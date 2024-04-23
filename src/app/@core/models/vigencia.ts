export type Vigencia = {
  Id:                number;
  Nombre:            string;
  Descripcion:       string;
  Year:              number;
  Ciclo:             string;
  CodigoAbreviacion: string;
  Activo:            boolean;
  AplicacionId:      number;
  InicioVigencia:    Date;
  FinVigencia:       Date;
  FechaCreacion:     string;
  FechaModificacion: string;
}
