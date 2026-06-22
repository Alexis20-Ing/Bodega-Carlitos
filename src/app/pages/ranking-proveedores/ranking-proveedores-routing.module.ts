import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { RankingProveedoresPage } from './ranking-proveedores.page';

const routes: Routes = [
  {
    path: '',
    component: RankingProveedoresPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RankingProveedoresPageRoutingModule {}
