import { Injectable } from '@angular/core';
import { RequestManager } from './requestManager';
import { environment } from 'src/environments/environment';
import { DTO } from '../@core/models/dataRequest';

@Injectable({
  providedIn: 'root',
})
export class CodigosEstados {
  private idPlanEstadoAvalado: string = '';
  private idEstadoPlanRevisionVerificada: string = '';
  private idTipoPlanProyecto: string = '';
  private constructor(public request: RequestManager) { }

  public async cargarIdentificadores() {
    await new Promise((resolve, _) => {
      this.request
        .get(
          environment.PLANES_CRUD,
          `estado-plan?query=codigo_abreviacion:A_SP,activo=true`
        )
        .subscribe({
          next: (data: DTO) => {
            if (data.Data[0]) {
              this.idPlanEstadoAvalado = data.Data[0]._id;
              resolve(data.Data[0]._id);
            }
          },
        });
    });
    await new Promise((resolve) => {
      this.request
        .get(
          environment.PLANES_CRUD,
          `estado-plan?query=codigo_abreviacion:RV_SP,activo=true`
        )
        .subscribe({
          next: (data: DTO) => {
            if (data.Data[0]) {
              this.idEstadoPlanRevisionVerificada = data.Data[0]._id;
              resolve(data.Data[0]._id);
            }
          },
        });
    });
    await new Promise((resolve) => {
      this.request
        .get(
          environment.PLANES_CRUD,
          `tipo-plan?query=codigo_abreviacion:PR_SP,activo=true`
        )
        .subscribe({
          next: (data: DTO) => {
            if (data.Data[0]) {
              this.idTipoPlanProyecto = data.Data[0]._id;
              resolve(data.Data[0]._id);
            }
          },
        });
    });
  }

  public getIdPlanEstadoAvalado() {
    return this.idPlanEstadoAvalado;
  }

  public getIdEstadoPlanRevisionVerificada() {
    return this.idEstadoPlanRevisionVerificada;
  }

  public getIdTipoPlanProyecto() {
    return this.idTipoPlanProyecto;
  }
}
