import { AfterViewInit, ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { RequestManager } from '../../services/requestManager';
import { environment } from 'src/environments/environment';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';
import { ImplicitAutenticationService, ServiceCookies } from '@udistrital/planeacion-utilidades-module';
import { navigateToUrl } from 'single-spa'
import { DTO } from 'src/app/@core/models/dataRequest';
import { Plan } from 'src/app/@core/models/plan';
import { Vigencia } from 'src/app/@core/models/vigencia';
import { PlanFormulacion } from 'src/app/@core/models/planFormulacion';
import { InfoTercero } from 'src/app/@core/models/tercero';
import { DependenciaTipoDependencia, Dependencia } from 'src/app/@core/models/dependencia';
import { CodigosService } from '@udistrital/planeacion-utilidades-module';

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
  rol!: string;

  CODIGO_TIPO_PROYECTO!: string;

  @ViewChild(MatPaginator) paginator: MatPaginator = new MatPaginator(
    new MatPaginatorIntl(),
    ChangeDetectorRef.prototype
  );

  //Servicios Utilidades Module
  private autenticationService = new ImplicitAutenticationService();
  private serviceCookies = new ServiceCookies();

  private codigosService = new CodigosService();
  
  constructor(
    private request: RequestManager,
    private router: Router
  ) {
    this.planesInteres = [];
    this.banderaTodosSeleccionados = false;
    this.datosCargados = false;
    let roles: any = this.autenticationService.getRoles();
    if (
      roles.__zone_symbol__value.find(
        (x: string) => x == 'JEFE_DEPENDENCIA' || x == 'ASISTENTE_DEPENDENCIA'
      )
    ) {
      this.rol = 'JEFE_DEPENDENCIA';
    } else if (
      roles.__zone_symbol__value.find((x: string) => x == 'PLANEACION')
    ) {
      this.rol = 'PLANEACION';
    } else if (
      roles.__zone_symbol__value.find(
        (x: string) => x == 'JEFE_UNIDAD_PLANEACION'
      )
    ) {
      this.rol = 'JEFE_UNIDAD_PLANEACION';
    }
  }

  async ngOnInit() {
    this.CODIGO_TIPO_PROYECTO = await this.codigosService.getId('PLANES_CRUD', 'tipo-plan', 'PR_SP');

    if (
      this.rol == 'JEFE_DEPENDENCIA' ||
      this.rol == 'ASISTENTE_DEPENDENCIA' ||
      this.rol == 'JEFE_UNIDAD_PLANEACION'
    ) {
      this.validarUnidad();
    } else {
      await this.loadUnidades();
    }

    this.informacionTabla = new MatTableDataSource([] as PlanFormulacion[]);
    this.informacionTabla.filterPredicate = (data) => this.filtroTabla(data);
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

  async ajustarData({ value }: { value: string }) {
    this.loadPeriodos()
    this.loadPlanes()
    Swal.fire({
      title: 'Cargando información',
      timerProgressBar: true,
      showConfirmButton: false,
      allowEscapeKey: false,
      allowOutsideClick: false,
      willOpen: () => {
        Swal.showLoading();
      },
    })

    this.auxUnidades.map((und: any) => {
      if (und.Nombre === value) {
        this.unidad = und;
      }
    });

    await new Promise((resolve, reject) => {
      this.request.get(environment.PLANEACION_FORMULACION_MID, `formulacion/planes_formulacion`).subscribe({
        next: (data: DTO) => {

          if (data.Data != null) {
            const latestVersions = (data.Data as PlanFormulacion[])
              .filter((plan) => plan.dependencia_nombre == value)
              .reduce((acc: Record<string, PlanFormulacion>, plan: PlanFormulacion) => {
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
            this.informacionTabla.filterPredicate = (data) => this.filtroTabla(data);
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
    Swal.fire({
      title: 'Cargando Unidades',
      timerProgressBar: true,
      showConfirmButton: false,
      allowEscapeKey: false,
      allowOutsideClick: false,
      willOpen: () => {
        Swal.showLoading();
      },
    })
    this.autenticationService.getDocumento().then((document: any) => {
      this.request.get(environment.TERCEROS_SERVICE, `datos_identificacion/?query=Numero:${document}`)
        .subscribe((datosInfoTercero: InfoTercero[]) => {
          this.request.get(environment.PLANEACION_FORMULACION_MID, `formulacion/tercero/${datosInfoTercero[0].TerceroId.Id}`)
            .subscribe((vinculacion: DTO) => {
              if (vinculacion.Data != "") {
                const promises = vinculacion.Data.map((und: any) => {
                  return new Promise((innerResolve, innerReject) => {
                    this.request.get(environment.OIKOS_SERVICE, `dependencia_tipo_dependencia?query=DependenciaId:${und["DependenciaId"]}`).subscribe((dataUnidad: DependenciaTipoDependencia[]) => {
                      if (dataUnidad) {
                        let unidad = dataUnidad[0].DependenciaId
                        unidad.TipoDependencia = dataUnidad[0].TipoDependenciaId.Id
                        for (let i = 0; i < dataUnidad.length; i++) {
                          if (dataUnidad[i].TipoDependenciaId.Id === 2) {
                            unidad.TipoDependencia = dataUnidad[i].TipoDependenciaId.Id
                          }
                        }
                        this.auxUnidades.push(unidad);
                        innerResolve(this.auxUnidades);
                      }
                      innerReject(`Error: No fue posible obtener la dependencia ${und["DependenciaId"]}`);
                    });
                  });
                });

                Promise.all(promises)
                  .then(() => {
                    Swal.close();
                  })
                  .catch((error) => {
                    Swal.close();
                    Swal.fire({
                      title: 'Error en la operación',
                      text: `No fue posible obtener la unidad o unidades pertenecientes al usuario`,
                      icon: 'warning',
                      showConfirmButton: false,
                      timer: 4000
                    })
                  });
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
    this.serviceCookies.setCookie("plan", JSON.stringify(auxPlan[0]))
    this.serviceCookies.setCookie("vigencia", JSON.stringify(vigencia[0]))
    this.serviceCookies.setCookie("unidad", JSON.stringify(this.unidad))
    navigateToUrl(`/formulacion`);
  }

  loadPlanes() {
    this.request.get(environment.PLANES_CRUD, `plan?query=formato:true,activo:true`).subscribe({
      next: (data: DTO) => {
        if (data) {
          this.planes = data.Data as Plan[]
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
    var dataAux = data.filter((e: { tipo_plan_id: any; }) => e.tipo_plan_id != this.CODIGO_TIPO_PROYECTO);
    return dataAux.filter((e: { activo: boolean; }) => e.activo == true);
  }

  loadPeriodos() {
    this.request.get(environment.PARAMETROS_SERVICE, `periodo?query=CodigoAbreviacion:VG,activo:true`).subscribe({
      next: (data: DTO) => {
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

  async loadUnidades() {
    Swal.fire({
      title: 'Cargando unidades',
      timerProgressBar: true,
      showConfirmButton: false,
      allowEscapeKey: false,
      allowOutsideClick: false,
      willOpen: () => {
        Swal.showLoading();
      },
    });
    await new Promise((resolve, reject) => {
      this.request
        .get(environment.PLANEACION_FORMULACION_MID, `formulacion/unidades`)
        .subscribe({
          next: (data: any) => {
            if (data) {
              this.auxUnidades = data.Data;
              Swal.close();
              resolve(this.auxUnidades);
            }
          },
          error: (error) => {
            Swal.fire({
              title: 'Error en la operación',
              text: `No se encontraron datos registrados ${JSON.stringify(
                error
              )}`,
              icon: 'warning',
              showConfirmButton: false,
              timer: 2500,
            });
            reject(error);
          },
        });
    });
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
    }, (error) => {
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
        this.planesInteres.forEach(async (plan) => {
          const auxPlan = {
            ...plan,
            _id: plan.id,
            estado_plan_id: await this.codigosService.getId('PLANES_CRUD', 'estado-plan', 'RV_SP'),
          };
          this.request.put(environment.PLANES_CRUD, `plan`, auxPlan, auxPlan._id).subscribe({
            next: (data: DTO) => {
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
