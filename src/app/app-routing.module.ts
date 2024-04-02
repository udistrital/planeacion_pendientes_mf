import { NgModule } from '@angular/core';
import { RouterModule, Routes, provideRouter } from '@angular/router';
import { APP_BASE_HREF } from '@angular/common';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { TablaPendientesFormulacionComponent } from './components/pendientes-formulacion/tabla-pendientes-formulacion.component';
import { TablaPendientesSeguimientoComponent } from './components/pendientes-seguimiento/tabla-pendientes-seguimiento.component';
import { getSingleSpaExtraProviders } from 'single-spa-angular';

const routes: Routes = [
  { path: 'formulacion', component: TablaPendientesFormulacionComponent },
  { path: 'seguimiento', component: TablaPendientesSeguimientoComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
  providers: [
    provideRouter(routes),
    { provide: APP_BASE_HREF, useValue: '/pendientes/' },
    getSingleSpaExtraProviders(),
    provideHttpClient(withFetch())]
})
export class AppRoutingModule { }
