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
import { DataRequest } from 'src/app/@core/models/dataRequest';
import { Plan } from 'src/app/@core/models/plan';
import { Vigencia } from 'src/app/@core/models/vigencia';
import { PlanFormulacion } from 'src/app/@core/models/planFormulacion';
import { InfoTercero } from 'src/app/@core/models/tercero';
import { DependenciaTipoDependencia, Dependencia } from 'src/app/@core/models/dependencia';

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
  informacionTabla!: MatTableDataSource<PlanFormulacion>;
  inputsFiltros!: NodeListOf<HTMLInputElement>;
  auxUnidades: Dependencia[] = [];
  unidad!: Dependencia;
  vigencias!: Vigencia[];
  planes: Plan[] = [];
  planesInteres: PlanFormulacion[];
  banderaTodosSeleccionados: boolean;
  datosCargados: boolean;

  @ViewChild(MatPaginator) paginator: MatPaginator = new MatPaginator(
    new MatPaginatorIntl(),
    ChangeDetectorRef.prototype
  );

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
    this.informacionTabla = new MatTableDataSource([] as PlanFormulacion[]);
    this.informacionTabla.filterPredicate = (data)=> this.filtroTabla(data);
    this.informacionTabla.paginator = this.paginator;
  }

  ngAfterViewInit(): void {
    this.inputsFiltros = document.querySelectorAll('th input');
  }

  filtroTabla(plan: PlanFormulacion) {
    let filtrosPasados: number = 0;
    let valoresAComparar = [
      plan.vigencia.toString(),
      plan.nombre.toLowerCase(),
      plan.version.toString(),
    ];
    this.inputsFiltros.forEach((input, posicion) => {
      if (valoresAComparar[posicion].includes(input.value.toLowerCase())) {
        filtrosPasados++;
      }
    });
    return filtrosPasados === valoresAComparar.length;
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

  async ajustarData({ value }: { value:string }) {
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
        next: (data: DataRequest) => {
          if (data.Data != null) {
            const filterData = (data.Data as PlanFormulacion[]).filter((plan) => plan.dependencia_nombre == value);

            const latestVersions = filterData.reduce((acc: Record<string, PlanFormulacion>, plan: PlanFormulacion) => {
              // Si ya existe un objeto con el mismo nombre y su versión es menor, lo reemplazamos
              const key = `${plan.nombre}-${plan.vigencia}`;
              if (!acc[key] || plan.version > acc[key].version) {
                acc[key] = plan;
              }
              return acc;
            }, {});

            // Obtenemos los valores del objeto, que representan la data filtrada y se les agrega la opción de seleecionado con el valor inicial
            const estadoSeleccion = Object.values(latestVersions)
              .filter((plan) => plan.estado === "Revisado")
              .map(pl => ({
                ...pl,
                seleccionado: false
              })) as PlanFormulacion[];
            this.informacionTabla = new MatTableDataSource(estadoSeleccion);
            this.informacionTabla.filterPredicate = (data)=> this.filtroTabla(data);
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
    this.autenticationService.getDocument().then((document)=>{
      this.request.get(environment.TERCEROS_SERVICE, `datos_identificacion/?query=Numero:${document}`)
      .subscribe((datosInfoTercero: InfoTercero[]) => {
        this.request.get(environment.PLANES_MID, `formulacion/vinculacion_tercero/${datosInfoTercero[0].TerceroId.Id}`)
          .subscribe((vinculacion: DataRequest) => {
            if (vinculacion.Data != "") {
              this.request.get(environment.OIKOS_SERVICE, `dependencia_tipo_dependencia?query=DependenciaId:${vinculacion.Data.DependenciaId}`).subscribe((dataUnidad: DependenciaTipoDependencia[]) => {
                if (dataUnidad) {
                  let unidad = dataUnidad[0].DependenciaId
                  unidad.TipoDependencia = dataUnidad[0].TipoDependenciaId.Id
                  for (let i = 0; i < dataUnidad.length; i++) {
                    if (dataUnidad[i].TipoDependenciaId.Id === 2) {
                      unidad.TipoDependencia = dataUnidad[i].TipoDependenciaId.Id
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
    });
  }

  consultarPlan(plan: PlanFormulacion) {
    const vigencia = this.vigencias.filter(vig => vig.Year === plan.vigencia)
    const auxPlan = this.planes.filter(pl => pl.nombre === plan.nombre)
    this.verificarFormulario.setCookie("plan", JSON.stringify(auxPlan[0]))
    this.verificarFormulario.setCookie("vigencia", JSON.stringify(vigencia[0]))
    this.verificarFormulario.setCookie("unidad", JSON.stringify(this.unidad))
    navigateToUrl(`/formulacion`);
  }

  loadPlanes() {
    this.request.get(environment.PLANES_CRUD, `plan?query=formato:true,activo:true`).subscribe({
      next: (data: DataRequest) => {
        if (data) {
          this.planes = (data.Data as Plan[]).filter((e) => e.tipo_plan_id != this.codigosEstados.getIdTipoPlanIndicativo());
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

  loadPeriodos() {
    this.request.get(environment.PARAMETROS_SERVICE, `periodo?query=CodigoAbreviacion:VG,activo:true`).subscribe({ 
      next: (data: DataRequest) => {
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

  seleccionarPlan(plan: PlanFormulacion) {
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
          (x) => x.id == unidadEliminar
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
    },(error) => {
        Swal.fire({
          title: 'Error en la operación',
          icon: 'error',
          text: `${JSON.stringify(error)}`,
          showConfirmButton: false,
          timer: 2500
        })
      }
    )
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
        this.planesInteres.forEach((plan) => {
          const auxPlan = { 
              ...plan,
              _id: plan.id,
              estado_plan_id: 
                this.codigosEstados.getIdEstadoPlanRevisionVerificada(),
            }; 
          this.request.put(environment.PLANES_CRUD, `plan`, auxPlan, auxPlan._id).subscribe({
              next: (data: DataRequest) => {
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
    }, (error) => {
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
