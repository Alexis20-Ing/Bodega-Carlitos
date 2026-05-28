import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { NuevaRecepcionPageRoutingModule } from './nueva-recepcion-routing.module';

import { NuevaRecepcionPage } from './nueva-recepcion.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    NuevaRecepcionPageRoutingModule
  ],
  declarations: [NuevaRecepcionPage]
})
export class NuevaRecepcionPageModule {}
