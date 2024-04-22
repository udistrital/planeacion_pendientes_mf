export type InfoTercero = {
  Id:                 number;
  TipoDocumentoId:    TipoID;
  TerceroId:          TerceroID;
  Numero:             string;
  DigitoVerificacion: number;
  CiudadExpedicion:   number;
  FechaExpedicion:    Date;
  Activo:             boolean;
  DocumentoSoporte:   number;
  FechaCreacion:      string;
  FechaModificacion:  string;
}

export type TerceroID = {
  Id:                  number;
  NombreCompleto:      string;
  PrimerNombre:        string;
  SegundoNombre:       string;
  PrimerApellido:      string;
  SegundoApellido:     string;
  LugarOrigen:         number;
  FechaNacimiento:     Date;
  Activo:              boolean;
  TipoContribuyenteId: TipoID;
  FechaCreacion:       string;
  FechaModificacion:   string;
  UsuarioWSO2:         string;
}

export type TipoID = {
  Id:                number;
  Nombre:            string;
  Descripcion:       string;
  CodigoAbreviacion: string;
  Activo:            boolean;
  FechaCreacion:     string;
  FechaModificacion: string;
  NumeroOrden?:      number;
}
