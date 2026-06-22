import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { RankingProveedoresPageRoutingModule } from './ranking-proveedores-routing.module';

import { RankingProveedoresPage } from './ranking-proveedores.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RankingProveedoresPageRoutingModule
  ],
  declarations: [RankingProveedoresPage]
})
export class RankingProveedoresPageModule {}
