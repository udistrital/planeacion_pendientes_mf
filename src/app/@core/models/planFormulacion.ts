export type PlanFormulacion = {
  activo:              boolean;
  aplicativo_id:       string;
  dependencia_id:      string;
  dependencia_nombre:  string;
  descripcion:         string;
  estado:              string;
  estado_id:           string;
  fecha_creacion:      Date;
  id:                  string;
  nombre:              string;
  tipo_plan_id:        string;
  ultima_modificacion: Date;
  version:             number;
  vigencia:            number;
  vigencia_id:         string;
  seleccionado?:        boolean;
}