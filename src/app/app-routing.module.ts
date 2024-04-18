import { NgModule } from '@angular/core';
import { RouterModule, Routes, provideRouter } from '@angular/router';
import { APP_BASE_HREF } from '@angular/common';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { TablaFormulacionComponent } from './components/formulacion/tabla-formulacion.component';
import { TablaSeguimientoComponent } from './components/seguimiento/tabla-seguimiento.component';
import { getSingleSpaExtraProviders } from 'single-spa-angular';

const routes: Routes = [
  { path: 'formulacion', component: TablaFormulacionComponent },
  { path: 'seguimiento', component: TablaSeguimientoComponent }
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
