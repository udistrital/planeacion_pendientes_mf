# planeacion_pendientes_mf

Microfrontend de Pendientes. Contiene las características, funcionalidades y vistas del componente de Pendientes del Cliente del Sistema de Planeación.

## Especificaciones Técnicas

### Tecnologías Implementadas y Versiones

- [Angular 16.1.0](https://angular.io/)
- [Node 16.14.0](https://nodejs.org/en)

### Variables de Entorno

```shell
SINTOMAS_SERVICE: [API Sintomas Crud],
PLANES_CRUD: [API Planes CRUD],
PLANEACION_ARBOL_MID: [API MicroMid Arbol],
PLANEACION_FORMULACION_MID: [API MicroMid Formulacion],
PLANEACION_SEGUIMIENTO_MID: [API MicroMid Seguimiento],
PLANES_MID_PROXY: [Proxy Planes Mid],
OIKOS_SERVICE: [API OIKOS SERVICE],
PARAMETROS_SERVICE: [API PARAMETROS SERVICE],
RESOLUCIONES_DOCENTES_SERVICE: [API DOCENTES SERVICE],
GESTOR_DOCUMENTAL_MID: [API GESTOR DOCUMENTAL MID],
DOCUMENTO_SERVICE: [API DOCUMENTO SERVICE],
KRONOS_SERVICE: [API KRONOS SERVICE],
PRUEBAS: [API PRUEBAS],
TERCEROS_SERVICE: [API TERCEROS],
ACADEMICA_JBPM_SERVICE: [Servicio ACADEMICA JBPM],
CONFIGURACION_SERVICE: [Servicio de Configuracion Crud],
CONF_MENU_SERVICE: [Servicio Configuracion Menú],
NOTIFICACION_SERVICE: [Servicio de Notificaciones],

#Conexión a notificaciones
NOTIFICACION_MID_SERVICE: [API Mid Notificaciones],
ARM_AWS_NOTIFICACIONES: [Test Cumplidos Notificaciones],

TOKEN: {
  AUTORIZATION_URL: [URL de Autorización],
  CLIENTE_ID: [Tipo de Cliente],
  RESPONSE_TYPE: [Tipo de Respuesta],
  SCOPE: [Scope],
  REDIRECT_URL: [URL de redirección],
  SIGN_OUT_URL: [URL de Cerrar Sesión],
  SIGN_OUT_REDIRECT_URL: [URL de redirección],
  AUTENTICACION_MID: [API MID Autenticación],
},

SECRET_KEY: [SECRET_KEY],
```

### Ejecución del Proyecto

Clonar el proyecto del repositorio de git

```bash
# clone the project
git clone https://github.com/udistrital/planeacion_pendientes_mf.git


# enter the project directory
cd planeacion_pendientes_mf
```

Iniciar el servidor en local

```bash
# install dependency
npx npm install
or
npm install
# start server
npx ng serve
# Whenever you want to change the port just run
npx ng dev --port = 9528
```

Linter

```bash
# Angular linter
npm run lint
# run linter and auto fix
npm run lint:fix
# run linter on styles
npm run lint:styles
# run lint UI
npm run lint:ci
```

### Ejecución Dockerfile

```bash
# Does not apply
```

### Ejecución docker-compose

```bash
# Does not apply
```

### Ejecución Pruebas

Pruebas unitarias powered by Jest

```bash
# run unit test
npm run test
# Runt linter + unit test
npm run test:ui
```

## Estado CI

```bash
# Developing
```

## Modelo de Datos

```bash
# Developing
```

## Licencia

planeacion_pendientes_mf is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (atSara Sampaio your option) any later version.

planeacion_pendientes_mf is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with planeacion_pendientes_mf. If not, see https://www.gnu.org/licenses/.
