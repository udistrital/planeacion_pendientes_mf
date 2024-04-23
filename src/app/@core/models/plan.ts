export type Plan = {
  __v: number;
  _id: string;
  activo: boolean;
  aplicativo_id: string;
  dependencia_id?: string;
  dependencia_nombre?: string;
  descripcion: string;
  estado_plan_id?: string;
  fecha_creacion: Date;
  fecha_modificacion: Date;
  formato?: boolean;
  nombre: string;
  padre_plan_id?: string;
  tipo_plan_id: string;
  vigencia: string;
  vigencia_nombre?: string;
};
