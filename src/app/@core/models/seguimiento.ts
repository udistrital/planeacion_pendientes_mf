import { Plan } from "./plan";

export type Seguimiento = {
  __v: number;
  _id: string;
  activo: boolean;
  dato: string;
  descripcion: string;
  estado_seguimiento_id: EstadoSeguimiento;
  fecha_creacion: Date;
  fecha_fin: Date;
  fecha_inicio: Date;
  fecha_modificacion: Date;
  nombre: string;
  periodo_seguimiento_id: PeriodoSeguimiento;
  plan_id: Plan;
  tipo_seguimiento_id: string;
  seleccionado?: boolean;
};

export type EstadoSeguimiento = {
  __v: number;
  _id: string;
  activo: boolean;
  codigo_abreviacion: string;
  descripcion: string;
  fecha_creacion: Date;
  fecha_modificacion: Date;
  nombre: string;
};

export type PeriodoSeguimiento = {
  __v: number;
  _id: string;
  activo: boolean;
  fecha_creacion: Date;
  fecha_fin: Date;
  fecha_inicio: Date;
  fecha_modificacion: Date;
  periodo_id: string;
  periodo_nombre: string;
  planes_interes: string;
  tipo_seguimiento_id: string;
  unidades_interes: string;
};
