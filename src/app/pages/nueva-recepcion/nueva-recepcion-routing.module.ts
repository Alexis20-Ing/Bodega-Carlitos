import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { NuevaRecepcionPage } from './nueva-recepcion.page';

const routes: Routes = [
  {
    path: '',
    component: NuevaRecepcionPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class NuevaRecepcionPageRoutingModule {}
