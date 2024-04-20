import { AfterViewInit, ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { RequestManager } from '../../services/requestManager';
import { environment } from 'src/environments/environment';
import Swal from 'sweetalert2';
import { VerificarFormulario } from '../../services/verificarFormulario'
import { Router } from '@angular/router';
import { ImplicitAutenticationService } from 'src/app/@core/utils/implicit_autentication.service';
import { navigateToUrl } from 'single-spa'
import { CodigosEstados } from 'src/app/services/codigosEstados.service';

@Component({
  selector: 'app-tabla-formulacion',
  templateUrl: './tabla-formulacion.component.html',
  styleUrls: ['./tabla-formulacion.component.scss'],
})
export class TablaFormulacionComponent implements OnInit, AfterViewInit {
  columnasMostradas: string[] = [
    'dependencia',
    'vigencia',
    'nombre',
    'version',
    'estado',
    'acciones',
    'seleccionar'
  ];
  informacionTabla: MatTableDataSource<any> = new MatTableDataSource<any>();
  inputsFiltros!: NodeListOf<HTMLInputElement>;
  auxUnidades: any[] = [];
  unidad: any;
  vigencias!: any[];
  planes!: any[];
  planesInteres: any;
  banderaTodosSeleccionados: boolean;
  datosCargados: boolean;

  @ViewChild(MatPaginator) paginator: MatPaginator = new MatPaginator(
    new MatPaginatorIntl(),
    ChangeDetectorRef.prototype
  );;

  constructor(
    private request: RequestManager,
    private verificarFormulario: VerificarFormulario,
    private autenticationService: ImplicitAutenticationService,
    private codigosEstados: CodigosEstados,
    private router: Router
  ) {
    this.planesInteres = [];
    this.banderaTodosSeleccionados = false;
    this.datosCargados = false;
  }

  async ngOnInit(){
    await this.codigosEstados.cargarIdentificadores();

    this.validarUnidad()
    const datosPrueba: any[] = [];
    this.informacionTabla = new MatTableDataSource<any>(datosPrueba);
    this.informacionTabla.filterPredicate = (plan: any, _) => {
      let filtrosPasados: number = 0;
      let valoresAComparar = [
        plan.dependencia_nombre.toLowerCase(),
        plan.vigencia.toString(),
        plan.nombre.toLowerCase(),
        plan.version.toString(),
        plan.estado.toLowerCase(),
      ];
      this.inputsFiltros.forEach((input, posicion) => {
        if (valoresAComparar[posicion].includes(input.value.toLowerCase())) {
          filtrosPasados++;
        }
      });
      return filtrosPasados === valoresAComparar.length;
    };
  }

  ngAfterViewInit(): void {
    this.inputsFiltros = document.querySelectorAll('th.mat-header-cell input');
    this.informacionTabla.data = [];
    this.informacionTabla.paginator = this.paginator;
  }

  aplicarFiltro(event: Event): void {
    let filtro: string = (event.target as HTMLInputElement).value;

    if (filtro === '') {
      this.inputsFiltros.forEach((input) => {
        if (input.value !== '') {
          filtro = input.value;
          return;
        }
      });
    }
    // Se debe poner algún valor que no sea vacio  para que se accione el filtro la tabla
    this.informacionTabla.filter = filtro.trim().toLowerCase();
  }

  async ajustarData(event: any) {
    this.loadPeriodos()
    this.loadPlanes()
    Swal.fire({
      title: 'Cargando información',
      timerProgressBar: true,
      showConfirmButton: false,
      willOpen: () => {
        Swal.showLoading();
      },
    })

    await new Promise((resolve, reject) => {
      this.request.get(environment.PLANES_MID, `formulacion/planes_formulacion`).subscribe({
        next: (data: any) => {
          if (data.Data != null) {
            const filterData = data.Data.filter((unid: any) => unid.dependencia_nombre == event.value);

            const latestVersions = filterData.reduce((acc: any, obj: any) => {
              // Si ya existe un objeto con el mismo nombre y su versión es menor, lo reemplazamos
              const key = `${obj.nombre}-${obj.vigencia}`;
              if (!acc[key] || obj.version > acc[key].version) {
                acc[key] = obj;
              }
              return acc;
            }, {} as Record<string, any>);

            // Obtenemos los valores del objeto, que representan la data filtrada
            const auxData = Object.values(latestVersions).filter((obj: any) => obj.estado === "Revisado")
            const filteredData: any[] = auxData;

            const estadoSeleccion = filteredData.map(pl => ({
              ...pl,
              seleccionado: false
            }));

            this.informacionTabla = new MatTableDataSource(estadoSeleccion);
            this.informacionTabla.paginator = this.paginator;
            this.datosCargados = true;
            Swal.close();
            if (this.informacionTabla.filteredData.length == 0) {
              this.datosCargados = false;
              Swal.fire({
                title: 'Atención en la operación',
                text: `No hay planes pendientes para verificar`,
                icon: 'warning',
                showConfirmButton: false,
                timer: 3500
              })
            }
            resolve(true);
          } else if (data.Data == null) {
            Swal.close();
            Swal.fire({
              title: 'Atención en la operación',
              text: `No hay planes formulados`,
              icon: 'warning',
              showConfirmButton: false,
              timer: 3500
            })
            reject(false);
          }
        }, 
        error: (error) => {
          console.error(error);
          Swal.close();
          Swal.fire({
            title: 'Error en la operación',
            text: `No se encontraron datos registrados`,
            icon: 'warning',
            showConfirmButton: false,
            timer: 2500
          })
        }
      })
    });
  }

  validarUnidad() {
    let document: any = this.autenticationService.getDocument();
    this.request.get(environment.TERCEROS_SERVICE, `datos_identificacion/?query=Numero:` + document.__zone_symbol__value)
      .subscribe((datosInfoTercero: any) => {
        this.request.get(environment.PLANES_MID, `formulacion/vinculacion_tercero/` + datosInfoTercero[0].TerceroId.Id)
          .subscribe((vinculacion: any) => {
            if (vinculacion["Data"] != "") {
              this.request.get(environment.OIKOS_SERVICE, `dependencia_tipo_dependencia?query=DependenciaId:` + vinculacion["Data"]["DependenciaId"]).subscribe((dataUnidad: any) => {
                if (dataUnidad) {
                  let unidad = dataUnidad[0]["DependenciaId"]
                  unidad["TipoDependencia"] = dataUnidad[0]["TipoDependenciaId"]["Id"]
                  for (let i = 0; i < dataUnidad.length; i++) {
                    if (dataUnidad[i]["TipoDependenciaId"]["Id"] === 2) {
                      unidad["TipoDependencia"] = dataUnidad[i]["TipoDependenciaId"]["Id"]
                    }
                  }
                  this.auxUnidades.push(unidad);
                  this.unidad = unidad
                }
              })
            } else {
              Swal.fire({
                title: 'Error en la operación',
                text: `No cuenta con los permisos requeridos para acceder a este módulo`,
                icon: 'warning',
                showConfirmButton: false,
                timer: 4000
              })
            }
          })
      })
  }

  consultarPlan(plan: any) {
    const vigencia = this.vigencias.filter(vig => vig.Year === plan.vigencia)
    const auxPlan = this.planes.filter(pl => pl.nombre === plan.nombre)
    this.verificarFormulario.setCookie("plan", JSON.stringify(auxPlan[0]))
    this.verificarFormulario.setCookie("vigencia", JSON.stringify(vigencia[0]))
    this.verificarFormulario.setCookie("unidad", JSON.stringify(this.unidad))
    navigateToUrl(`/formulacion`);
  }

  loadPlanes() {
    this.request.get(environment.PLANES_CRUD, `plan?query=formato:true`).subscribe({
      next: (data: any) => {
        if (data) {
          this.planes = data.Data;
          this.planes = this.filterPlanes(this.planes);
        }
      },
      error: (error) => {
        Swal.fire({
          title: 'Error en la operación',
          text: `No se encontraron datos registrados ${JSON.stringify(error)}`,
          icon: 'warning',
          showConfirmButton: false,
          timer: 2500
        })
      }
    })
  }

  filterPlanes(data: any) {
    var dataAux = data.filter((e: any) => e.tipo_plan_id != this.codigosEstados.getIdTipoPlanIndicativo());
    return dataAux.filter((e: any) => e.activo == true);
  }

  loadPeriodos() {
    this.request.get(environment.PARAMETROS_SERVICE, `periodo?query=CodigoAbreviacion:VG,activo:true`).subscribe({ 
      next: (data: any) => {
        if (data) {
          this.vigencias = data.Data;
        }
      },
      error: (error) => {
        Swal.fire({
          title: 'Error en la operación',
          text: `No se encontraron datos registrados ${JSON.stringify(error)}`,
          icon: 'warning',
          showConfirmButton: false,
          timer: 2500
        })
      }
    })
  }

  seleccionarPlan(plan: any) {
    if (!plan.seleccionado) {
      plan.seleccionado = true;
      this.planesInteres = [...this.planesInteres, plan];
    } else if (plan.seleccionado) {
      if (this.banderaTodosSeleccionados) {
        this.borrarSeleccion()
      } else {
        plan.seleccionado = false;
        let unidadEliminar = plan.id;
        const index = this.planesInteres.findIndex(
          (x: { id: any }) => x.id == unidadEliminar
        );
        this.planesInteres.splice(index, 1);

        this.banderaTodosSeleccionados = false;
      }
    }
  }

  seleccionarTodos() {
    Swal.fire({
      title: 'Seleccionar Todos los planes/proyectos',
      text: `¿Desea seleccionar todos los planes/proyectos?`,
      icon: 'warning',
      confirmButtonText: `Sí`,
      cancelButtonText: `No`,
      showCancelButton: true
    }).then((result) => {
      if (result.isConfirmed) {
        this.banderaTodosSeleccionados = true;
        this.planesInteres = this.informacionTabla.data

        // Itera sobre los elementos y cambia el icono
        for (const plan of this.informacionTabla.data) {
          plan.seleccionado = true;
        }
      } else if (result.dismiss === Swal.DismissReason.cancel) {
        Swal.fire({
          title: 'Selección de todos los planes/proyectos cancelada',
          icon: 'error',
          showConfirmButton: false,
          timer: 2500
        })
      }
    }),
      (error: any) => {
        Swal.fire({
          title: 'Error en la operación',
          icon: 'error',
          text: `${JSON.stringify(error)}`,
          showConfirmButton: false,
          timer: 2500
        })
      }
  }

  borrarSeleccion() {
    this.banderaTodosSeleccionados = false;
    // Itera sobre los elementos y cambia el icono a 'compare_arrows'
    for (const plan of this.informacionTabla.data) {
      plan.seleccionado = false;
    }

    // Limpia el array de unidades de interés
    this.planesInteres = [];
  }

  verificarSeleccion() {
    Swal.fire({
      title: 'Verificar Revisión',
      text: `¿Desea verificar la revisión de los planes/proyectos seleccionados?`,
      icon: 'warning',
      confirmButtonText: `Sí`,
      cancelButtonText: `No`,
      showCancelButton: true
    }).then((result) => {
      if (result.isConfirmed) {
        this.planesInteres.forEach((plan: any) => {
          const auxPlan = { 
              ...plan,
              _id: plan.id,
              estado_plan_id: 
                this.codigosEstados.getIdEstadoPlanRevisionVerificada(),
            }; 
          this.request.put(environment.PLANES_CRUD, `plan`, auxPlan, auxPlan._id).subscribe({
              next: (data: any) => {
              if (data) {
                Swal.fire({
                  title: 'Revisión Verficada Enviada',
                  icon: 'success',
                }).then((result) => {
                  if (result.value) {
                    const actualUrl = this.router.url;
                    this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
                      this.router.navigate([actualUrl]);
                    });
                  }
                })
              }
            },
            error: (error) => {
              console.error(error);
              Swal.fire({
                title: 'Error en la operación',
                icon: 'error',
                text: `El plan ${plan.nombre} está generando error en su aprobación, intente más tarde o comuniquese con la OATI`,
                showConfirmButton: false,
                timer: 2500
              })
            }
          })
        });
      } else if (result.dismiss === Swal.DismissReason.cancel) {
        Swal.fire({
          title: 'Envio de Revisión Verificada Cancelado',
          icon: 'error',
          showConfirmButton: false,
          timer: 2500
        })
      }
    },
    (error: any) => {
      Swal.fire({
        title: 'Error en la operación',
        icon: 'error',
        text: `${JSON.stringify(error)}`,
        showConfirmButton: false,
        timer: 2500
      })
    })
  }
}
