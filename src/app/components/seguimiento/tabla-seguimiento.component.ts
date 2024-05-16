import { AfterViewInit, ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { RequestManager } from '../../services/requestManager';
import { environment } from 'src/environments/environment';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';
import { ImplicitAutenticationService } from 'src/app/@core/utils/implicit_autentication.service';
import { VerificarFormulario } from '../../services/verificarFormulario'
import { navigateToUrl } from 'single-spa'
import { CodigosEstados } from 'src/app/services/codigosEstados.service';
import { InfoTercero } from 'src/app/@core/models/tercero';
import { DTO } from 'src/app/@core/models/dataRequest';
import { Dependencia, DependenciaTipoDependencia } from 'src/app/@core/models/dependencia';
import { Vigencia } from 'src/app/@core/models/vigencia';
import { Plan } from 'src/app/@core/models/plan';
import { Seguimiento } from 'src/app/@core/models/seguimiento';

@Component({
  selector: 'app-tabla-seguimiento',
  templateUrl: './tabla-seguimiento.component.html',
  styleUrls: ['./tabla-seguimiento.component.scss'],
})
export class TablaSeguimientoComponent implements OnInit, AfterViewInit {
  columnasMostradas: string[] = [
    'dependencia',
    'vigencia',
    'nombre',
    'trimestre',
    'estado',
    'acciones',
    'seleccionar'
  ];
  informacionTabla!: MatTableDataSource<Seguimiento>;
  inputsFiltros!: NodeListOf<HTMLInputElement>;
  auxUnidades: Dependencia[] = [];
  unidad!: Dependencia;
  vigencias!: Vigencia[];
  planes!: Plan[];
  trimestreEstado!: Seguimiento[][];
  planesInteres: Seguimiento[];
  banderaTodosSeleccionados: boolean;
  datosCargados: boolean;

  @ViewChild(MatPaginator) paginator: MatPaginator = new MatPaginator(
    new MatPaginatorIntl(),
    ChangeDetectorRef.prototype
  );

  constructor(
    private request: RequestManager,
    private autenticationService: ImplicitAutenticationService,
    private router: Router,
    private verificarFormulario: VerificarFormulario,
    private codigosEstados: CodigosEstados,
  ) {
    this.planesInteres = [];
    this.banderaTodosSeleccionados = false;
    this.datosCargados = false;
  }

  async ngOnInit() {
    await this.codigosEstados.cargarIdentificadores();
    this.informacionTabla = new MatTableDataSource<Seguimiento>([]);
    this.informacionTabla.filterPredicate = (data, _) => this.filtroTabla(data)
    this.informacionTabla.paginator = this.paginator;
    this.validarUnidad()
  }

  ngAfterViewInit() {
    this.inputsFiltros = document.querySelectorAll('th input');
  }

  filtroTabla(seg: Seguimiento) {
    let filtrosPasados: number = 0;
    const valoresAComparar = [
      seg.plan_id.vigencia_nombre!.toLowerCase(),
      seg.plan_id.nombre.toLowerCase(),
      seg.periodo_seguimiento_id.periodo_nombre.toLowerCase()
    ];
    this.inputsFiltros.forEach((input, posicion) => {
      if (valoresAComparar[posicion].includes(input.value.trim().toLowerCase())) {
        filtrosPasados++;
      }
    });
    return filtrosPasados === valoresAComparar.length;
  }

  aplicarFiltro(event: Event) {
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
    Swal.fire({
      title: 'Cargando información',
      timerProgressBar: true,
      showConfirmButton: false,
      willOpen: () => {
        Swal.showLoading();
      },
    })

    if (value) {
      this.auxUnidades.map((und: any) => {
        if (und.Nombre === value) {
          this.unidad = und;
        }
      });

      try {
        await this.loadPeriodos()
        await this.loadPlanes()
        await this.obtenerEstado()

        //Lógica filtro
        const filteredData: Seguimiento[] = []
        this.trimestreEstado.forEach((planes) => {
          planes
            .filter(
              (plan) => plan.estado_seguimiento_id.codigo_abreviacion === "ER"
            )
            .forEach((seg) => {
              filteredData.push({
                ...seg,
                seleccionado: false,
                plan_id: {
                  ...seg.plan_id,
                  dependencia_nombre: value,
                  vigencia_nombre: this.vigencias.filter(
                    (vigencia) => vigencia.Id == Number(seg.plan_id.vigencia)
                  )[0].Nombre,
                },
              } as Seguimiento);
            });
        });

        this.informacionTabla = new MatTableDataSource(filteredData);
        this.informacionTabla.filterPredicate = (data, _) => this.filtroTabla(data)
        this.informacionTabla.paginator = this.paginator;
        this.datosCargados = true;
        Swal.close();
        if (this.informacionTabla.filteredData.length === 0) {
          this.datosCargados = false;
          Swal.fire({
            title: 'Atención en la operación',
            text: `No hay planes pendientes para verificar`,
            icon: 'warning',
            showConfirmButton: false,
            timer: 3500
          });
        }
      } catch (error) {
        console.error('Error al ajustar datos:', error);
        Swal.close();
      }
    } else {
      this.informacionTabla = new MatTableDataSource<Seguimiento>([]);
      this.informacionTabla.filterPredicate = (data, _) => this.filtroTabla(data);
      this.informacionTabla.paginator = this.paginator;
      this.datosCargados = false;
      Swal.close();
    }
  }

  validarUnidad() {
    Swal.fire({
      title: 'Cargando Unidades',
      timerProgressBar: true,
      showConfirmButton: false,
      willOpen: () => {
        Swal.showLoading();
      },
    })
    this.autenticationService.getDocument().then((document) => {
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

  consultarPlan(plan: Seguimiento) {
    const auxId = plan.plan_id._id
    const auxTrimestres = plan.periodo_seguimiento_id.periodo_nombre
    this.verificarFormulario.setCookie("estadoLista", 'true');
    navigateToUrl(`/seguimiento/gestion-seguimiento/` + auxId + `/` + auxTrimestres);
  }

  loadPlanes(): Promise<void> {
    return new Promise((resolve, reject) => {
      Swal.fire({
        title: 'Cargando información',
        timerProgressBar: true,
        showConfirmButton: false,
        willOpen: () => {
          Swal.showLoading();
        },
      })
      this.request.get(environment.PLANES_CRUD, `plan?query=activo:true,estado_plan_id:${this.codigosEstados.getIdPlanEstadoAvalado()},dependencia_id:${this.unidad.Id}`).subscribe({
        next: async (data: DTO) => {
          if (data) {
            if (data.Data.length != 0) {
              this.planes = (data.Data as Plan[])
                .sort((a, b) => {
                  return Number(b.vigencia) - Number(a.vigencia);
                });
              resolve()
            } else {
              Swal.fire({
                title: 'No se encontraron planes',
                icon: 'error',
                text: `No se encontraron planes para realizar el seguimiento`,
                showConfirmButton: false,
                timer: 3500
              })
              reject("No se encontraron planes");
            }
          }
        },
        error: (error) => {
          Swal.fire({
            title: 'Error en la operación',
            text: 'No se encontraron datos registrados',
            icon: 'warning',
            showConfirmButton: false,
            timer: 2500
          })
          reject(error);
        }
      })
    })
  }

  loadPeriodos(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.request.get(environment.PARAMETROS_SERVICE, `periodo?query=CodigoAbreviacion:VG,activo:true`).subscribe({
        next: (data: DTO) => {
          if (data) {
            this.vigencias = data.Data;
          }
          resolve()
        },
        error: (error) => {
          Swal.fire({
            title: 'Error en la operación',
            text: `No se encontraron datos registrados ${JSON.stringify(error)}`,
            icon: 'warning',
            showConfirmButton: false,
            timer: 2500
          })
          reject(error)
        }
      })
    })

  }

  obtenerEstado(): Promise<void> {
    return new Promise((resolve, reject) => {
      const auxPlanesTrimestre: Seguimiento[][] = [];

      const promises = this.planes.map((plan) => {
        return new Promise((innerResolve, innerReject) => {
          this.request.get(environment.PLANEACION_SEGUIMIENTO_MID, `seguimiento/${plan._id}/estado`).subscribe({
            next: (data: DTO) => {
              if (data?.Data != '' && data.Data != null) {
                auxPlanesTrimestre.push(data.Data as Seguimiento[])
              }
              innerResolve(auxPlanesTrimestre);
            },
            error: (error) => {
              Swal.fire({
                title: 'Error en la operación',
                text: `No se encontraron datos registrados ${JSON.stringify(error)}`,
                icon: 'warning',
                showConfirmButton: false,
                timer: 2500
              });
              innerReject(error);
            }
          });
        });
      });

      Promise.all(promises)
        .then(() => {
          this.trimestreEstado = auxPlanesTrimestre;
          resolve();
        })
        .catch((error) => {
          reject(error);
        });
    })
  }

  seleccionarPlan(plan: Seguimiento) {
    if (!plan.seleccionado) {
      plan.seleccionado = true;
      this.planesInteres = [...this.planesInteres, plan];
    } else if (plan.seleccionado) {
      if (this.banderaTodosSeleccionados) {
        this.borrarSeleccion()
      } else {
        plan.seleccionado = false;
        const index = this.planesInteres.findIndex(
          (x) => x._id == plan._id
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
      title: 'Verificar revisión',
      text: `¿Confirma que desea verificar la revisión del seguimiento de los planes/proyectos seleccionados?`,
      icon: 'warning',
      confirmButtonText: `Continuar`,
      cancelButtonText: `Cancelar`,
      showCancelButton: true
    }).then((result) => {
      if (result.isConfirmed) {
        let planesNoVerificables: { nombre: string; periodo: string }[] = [];
        const promises = this.planesInteres.map((plan) => {
          return new Promise((innerResolve, innerReject) => {
            this.request.put(environment.PLANEACION_SEGUIMIENTO_MID, `seguimiento/verificar_seguimiento`, "{}", plan._id).subscribe({
              next: (data: DTO) => {
                if (data) {
                  if (data.Success) {
                    Swal.fire({
                      title: 'El reporte se ha enviado satisfactoriamente',
                      icon: 'success',
                    })
                  } else {
                    planesNoVerificables.push(
                      {
                        nombre: plan.plan_id.nombre,
                        periodo: plan.periodo_seguimiento_id.periodo_nombre
                      }
                    )
                  }
                }
                innerResolve("Verificado");
              }, error: (error) => {
                Swal.fire({
                  title: 'Error en la operación',
                  icon: 'error',
                  text: `El plan ${plan["plan_id"]["nombre"]} está generando error en su aprobación, intente más tarde o comuniquese con la OATI`,
                  showConfirmButton: false,
                  timer: 2500
                })
                innerReject(error);
              }
            });
          })
        })

        Promise.all(promises)
          .then(() => {
            const actualUrl = this.router.url;
            if (planesNoVerificables.length != 0) {
              let message: string = '<b>Planes/Proyectos</b><br/>';
              for (let i = 0; i < planesNoVerificables.length; i++) {
                message = message + (i + 1).toString() + '. ' + planesNoVerificables[i].nombre + ' - ' + planesNoVerificables[i].periodo + "<br/>"
              }
              Swal.fire({
                title: 'Los siguientes planes/proyectos no son verificables (revisar sus respectivas actividades):',
                icon: 'warning',
                showConfirmButton: true,
                html: message
              }).then((result) => {
                this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
                  this.router.navigate([actualUrl]);
                });
              })
            } else {
              Swal.fire({
                title: 'Todos los planes/proyectos fueron verificados satisfactoriamente',
                icon: 'success',
                showConfirmButton: true,
              }).then((result) => {
                this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
                  this.router.navigate([actualUrl]);
                });
              })
            }
          })
      } else if (result.dismiss === Swal.DismissReason.cancel) {
        Swal.fire({
          title: 'Verificación de revisión cancelada',
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
