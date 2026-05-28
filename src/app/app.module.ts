import { NgModule } from '@angular/core';

import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

import {
  IonicModule,
  IonicRouteStrategy
} from '@ionic/angular';

import { FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

// 🔥 FIREBASE (COMPATIBLE CON APPMODULE)
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

import { environment } from '../environments/environment';

@NgModule({
  declarations: [
    AppComponent
  ],

  imports: [

    BrowserModule,

    IonicModule.forRoot(), // 🔥 ESTO ES CLAVE

    AppRoutingModule,

    FormsModule

  ],

  providers: [

    {
      provide: RouteReuseStrategy,
      useClass: IonicRouteStrategy
    }

  ],

  bootstrap: [
    AppComponent
  ]
})
export class AppModule {}