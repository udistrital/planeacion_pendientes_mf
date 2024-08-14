import { Injectable } from '@angular/core';
import { WebSocketSubject } from 'rxjs/webSocket';
import { environment } from 'src/environments/environment';
import { RequestManager } from './requestManager';
import { ImplicitAutenticationService } from '@udistrital/planeacion-utilidades-module';

@Injectable({
  providedIn: 'root',
})
export class Notificaciones {
  private socket$: WebSocketSubject<any> | undefined;
  private autenticationService = new ImplicitAutenticationService();

  readonly NOTIFICACION: any = {
    CODIGO_SISGPLAN: "SP",
    CODIGO_NOTIFICACION_INFORMATIVA: "NI",
    ASUNTO: "Sin asunto"
  }

  defaultTemplate = { NOMBRE_UNIDAD: "XXXX", NOMBRE_PLAN: "XXXX", VIGENCIA: "XXXX" }
  readonly CORREO: any = {
    CORREO_BASE: "notificacion_sisgplan@udistrital.edu.co",
    TERMINACION_CORREO: "@udistrital.edu.co",
    INICIO_PLANTILLA: "SISGPLAN_PLANTILLA",
    PLANTILLA_DEFECTO_FORMULACION : this.defaultTemplate,
    PLANTILLA_DEFECTO_SEGUIMIENTO : {...this.defaultTemplate, TRIMESTRE: "XXXX"}
  }
  
  constructor(private request: RequestManager) {
    this.request.updateHeaderToken();
  }

  connectWebSocket() {
    this.socket$ = new WebSocketSubject(environment.NOTIFICACION_MID_WS);

    // Permite conectarse al servidor aún así sin escuchar mensajes entrantes
    this.socket$.subscribe(); 

    // Enviar el docuemento de usuario al servidor cuando se establezca la conexión
    let docUsuarioAuth: any = this.autenticationService.getDocumento();
    this.socket$.next(docUsuarioAuth.__zone_symbol__value);
  }

  // Función genérica para hacer solicitudes HTTP GET
  private async fetchData(url: string, endpoint: string): Promise<any> {
    try {
      return await new Promise((resolve, reject) => {
        this.request.get(url, endpoint).subscribe(
          (data: any) => resolve(data),
          (error: any) => reject(error)
        );
      });
    } catch (error: any) {
      throw new Error(`Error al obtener datos de ${url}${endpoint}: ${error.message}`);
    }
  }

  // Obtener plantilla de la notificación por código de abreviación
  async getPlantilla(codigo: string) {
    const plantilla = await this.fetchData(environment.NOTIFICACIONES_CRUD, `plantilla?query=codigo_abreviacion:${codigo}`);
    return plantilla.Data[0];
  }

  // Obtener id sistema por código de abreviación (SP)
  async getIdSistema(codigo: string) {
    const sistema = await this.fetchData(environment.NOTIFICACIONES_CRUD, `sistema?query=codigo_abreviacion:${codigo}`);
    return sistema.Data[0]._id;
  }

  // Obtener tipo de notificación por código de abreviación (NI = Notificación informativa)
  async getIdTipoNotificacion(codigo: string) {
    const tipoNotificacion = await this.fetchData(environment.NOTIFICACIONES_CRUD, `tipo_notificacion?query=codigo_abreviacion:${codigo}`);
    return tipoNotificacion.Data[0]._id;
  }

  // Obtener cargos por códigos de abreviación
  async getCargos(codigosAbreviacion: string) {
    const cargos = await this.fetchData(environment.PARAMETROS_SERVICE, `parametro?query=CodigoAbreviacion__in:${codigosAbreviacion}`);
    return cargos.Data;
  }
  
  // Obtener los usuarios destino por dependencia y cargo
  async getUsuariosDestino(dependencias: string, idsCargos: string) {
    return await this.fetchData(environment.TERCEROS_SERVICE, `vinculacion?query=DependenciaId__in:${dependencias},CargoId__in:${idsCargos}`);
  }

  // Obtener el documento de un usuario
  async getDatosIdentificacion(idTercero: string) {
    const datos = await this.fetchData(environment.TERCEROS_SERVICE, `datos_identificacion?query=TerceroId.Id:${idTercero},TipoDocumentoId.CodigoAbreviacion:CC`);
    return datos[0];
  }

  // Obtener id de la unidad por nombre
  async getIdUnidad(nombreUnidad: string) {
    const unidad = await this.fetchData(environment.OIKOS_SERVICE, `dependencia?query=Nombre:${nombreUnidad}`);
    return unidad[0].Id;
  }

  // Obtener el id de la vigencia por nombre
  async getIdVigencia(nombreVigencia: string) {
    const vigencia = await this.fetchData(environment.PARAMETROS_SERVICE, `periodo?query=CodigoAbreviacion:VG,Nombre:${nombreVigencia},activo:true`);
    return vigencia.Data[0].Id;
  }

  // Obtener id del plan por nombre, unidad y vigencia
  async getIdPlan(nombrePlan: string, idDependencia: string, idVigencia: string) {
    const plan = await this.fetchData(environment.PLANES_CRUD, `plan?query=nombre:${nombrePlan},dependencia_id:${idDependencia},vigencia:${idVigencia},activo:true,formato:false`);
    return plan.Data[0]._id;
  }

  // Publicar notificación
  async publicarNotificaciones(data: any): Promise<any[]> {
    const notificaciones: any = await new Promise((resolve, reject) => {
      this.request.post(environment.NOTIFICACIONES_CRUD, 'notificacion', data)
        .subscribe(
          (data: any) => resolve(data),
          (error: any) => reject(error)
        );
    });
    return notificaciones.Data;
  }

  // Enviar correos
  async enviarCorreos(data: any): Promise<any[]> {
    const notificaciones: any = await new Promise((resolve, reject) => {
      this.request.post(environment.NOTIFICACION_MID, 'email/enviar_templated_email/', data)
        .subscribe(
          (data: any) => resolve(data),
          (error: any) => reject(error)
        );
    });
    return notificaciones.Data;
  }

  // Constuir el body de la notificación
  async getBodyNotificacion(data: any) {
    const cod_modulo = data.codigo[0]
    const { nombre_unidad, nombre_plan, nombre_vigencia, plantilla_mensaje } = data;

    // Modificar el mensaje de la plantilla
    let mensaje = plantilla_mensaje;
    const reemplazos: any = {"[NOMBRE UNIDAD]": nombre_unidad, "[NOMBRE PLAN]": nombre_plan, "[VIGENCIA]": nombre_vigencia};

    if (cod_modulo === "S") {
      reemplazos["[TRIMESTRE]"] = data.trimestre;
    }

    for (const [key, value] of Object.entries(reemplazos)) {
      mensaje = mensaje.replace(key, value);
    }

    // Obtener el documento del usuario autenticado
    var docUsuarioAuth: any = await this.autenticationService.getDocumento();

    // Construir metadatos del sistema (información necesaria para planeacion_cliente)
    const metadatos: any = {
      modulo: cod_modulo == "F" ? "formulacion" : "seguimiento",
      nombre_unidad,
      nombre_plan,
      nombre_vigencia,
    }

    if (cod_modulo == "S") {
      metadatos["trimestre"] = data.trimestre;
    }

    data.documentos = ["7230282"] // CAMBIARRR!!!!

    // Cuerpo de la notificacion
    return {
      sistema_id: data.sistema_id,
      tipo_notificacion_id: data.tipo_notificacion_id,
      destinatarios: data.documentos,
      remitente: docUsuarioAuth,
      asunto: this.NOTIFICACION.ASUNTO,
      mensaje,
      metadatos,
      activo: true
    };
  }

  // Constuir el body del correo
  getBodyCorreo(data: any) {
    const cod_modulo = data.codigo[0]
    let { codigo, correos, nombre_unidad, nombre_plan, nombre_vigencia } = data;

    let dataPlantilla: any = {
      NOMBRE_UNIDAD: nombre_unidad,
      NOMBRE_PLAN: nombre_plan,
      VIGENCIA: nombre_vigencia
    }

    if (cod_modulo === "S") {
      dataPlantilla["TRIMESTRE"] = data.trimestre;
    }

    correos = ["dabautistac@udistrital.edu.co"] // CAMBIARRR!!!!
    
    return {
      Source: this.CORREO.CORREO_BASE,
      Template: `${this.CORREO.INICIO_PLANTILLA}_${codigo}`,
      Destinations: [{
        Destination: { ToAddresses: correos },
        ReplacementTemplateData: dataPlantilla
      }],
      DefaultTemplateData: codigo[0] == "F" ? this.CORREO.PLANTILLA_DEFECTO_FORMULACION : this.CORREO.PLANTILLA_DEFECTO_SEGUIMIENTO
    }
  }

  async enviarNotificacion(datosBandera: any) {    
    // Obtener plantilla de la notificación por codigo de abreviación
    let plantilla = await this.getPlantilla(datosBandera.codigo);

    if (plantilla?.metadatos?.destinatarios) {       
      let codigosAbreviacion: string[] = [];
      if (plantilla.metadatos.destinatarios.some((str: any) => str.includes("jefe"))) {
        codigosAbreviacion.push("JO");
      } 
      if (plantilla.metadatos.destinatarios.some((str: any) => str.includes("asistente"))) {
        codigosAbreviacion.push("AS_D", "NR");
      }
      
      try {
        const cargos = await this.getCargos(codigosAbreviacion.join("|"));
        let idsCargos = cargos.map((cargo: any) => cargo.Id).join("|");

        // Obtener el id de la vigencia si no está en los datos de la bandera
        let dependencias: string;
        if (datosBandera.id_unidad) {
          dependencias = datosBandera.id_unidad.toString();
        } else {
          const id_unidad = await this.getIdUnidad(datosBandera.nombre_unidad);
          dependencias = id_unidad.toString();
        }

        // Añadir dependencia de planeación si aplica
        if (plantilla.metadatos.destinatarios.some((str: string) => str.includes("planeacion"))) {
          dependencias += "|11"; // Id dependencia planeacion
        }

        // Obtener los documentos y correos de los usuarios destino
        const usuarios = await this.getUsuariosDestino(dependencias, idsCargos);
        let documentos: string[] = [];
        let correos: string[] = [];
        for (let i = 0; i < usuarios.length; i++) {
          const usuario = usuarios[i];
          if (Object.keys(usuario).length > 0 && usuario.TerceroPrincipalId.Id) {
            const datos = await this.getDatosIdentificacion(usuario.TerceroPrincipalId.Id);
            if (Object.keys(datos).length > 0 && typeof datos.Numero === "string" && datos.Numero !== "") {
              documentos.push(datos.Numero);
            }

            const correo = usuario.TerceroPrincipalId.UsuarioWSO2;
            if (correo.endsWith(this.CORREO.TERMINACION_CORREO)) {
              correos.push(correo);
            }
          }
        }

        const sistema_id = await this.getIdSistema(this.NOTIFICACION.CODIGO_SISGPLAN);
        const tipo_notificacion_id = await this.getIdTipoNotificacion(this.NOTIFICACION.CODIGO_NOTIFICACION_INFORMATIVA);

        // Publicar notificaciones en el crud
        let dataNotificacion = {
          ...datosBandera, 
          documentos,
          plantilla_mensaje: plantilla.plantilla_mensaje,
          sistema_id,
          tipo_notificacion_id
        }
        const bodyNotificacion = await this.getBodyNotificacion(dataNotificacion);
        const notificaciones = await this.publicarNotificaciones(bodyNotificacion);

        // Establecer nuevamente la conexión (el servidor lo reconocerá como una conexión ya existente)
        this.connectWebSocket();

        // Enviar notificaciones a notificacion_mid por WebSocket (uso de tiempo real)
        if (this.socket$) {
          this.socket$.next(notificaciones); 
        }

        // Enviar notificaciones por correo
        let dataCorreo = { ...datosBandera, correos}
        const bodyCorreo = this.getBodyCorreo(dataCorreo);
        await this.enviarCorreos(bodyCorreo);

      } catch (error) {
        console.error('Error al publicar notificación:', error);
      }
    }
  }

  // Cargar plan en el modulo
  async loadNotificacion(notificacion: any) {
    const { modulo, nombre_plan, nombre_unidad, nombre_vigencia } = notificacion.metadatos;

    if (modulo && nombre_plan && nombre_unidad && nombre_vigencia) {
      const id_unidad = await this.getIdUnidad(nombre_unidad);
      const id_vigencia = await this.getIdVigencia(nombre_vigencia);

      if (id_vigencia && id_unidad) {
        if (modulo === "formulacion") {
          return { nombre_plan, id_unidad, id_vigencia }
        } else if (modulo == "seguimiento" && notificacion.metadatos.trimestre) {
          const plan_id = await this.getIdPlan(nombre_plan, id_unidad, id_vigencia)
          return { plan_id, trimestre: notificacion.metadatos.trimestre }
        }
      }
    }
    return null
  }
}
