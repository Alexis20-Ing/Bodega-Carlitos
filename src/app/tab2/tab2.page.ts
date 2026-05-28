import { Component } from '@angular/core';

import { Router } from '@angular/router';

import { AlertController } from '@ionic/angular';

import { FirebaseService } from '../services/firebase.service';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  standalone: false,
})

export class Tab2Page {

  reclamos = 0;

  totalProductos = 0;

  resueltos = 0;

  proveedores = 0;

  modalAbierto = false;

  constructor(

    private router: Router,

    private alertController: AlertController,

    private firebaseService: FirebaseService

  ) {}

  async ionViewWillEnter() {

    const sesion =
      localStorage.getItem('sesion');

    if (!sesion) {

      const alert =
        await this.alertController.create({

        header: 'Acceso denegado',

        message:
          'No se ha iniciado sesión',

        buttons: ['OK']

      });

      await alert.present();

      this.router.navigate(['/login']);

      return;

    }

    const productos =
      await this.firebaseService
        .obtenerProductos();

    this.totalProductos =
      productos.length;

    this.resueltos =
      productos.filter((p: any) =>

        p.estado === 'resuelto'

      ).length;

    const listaProveedores =
      productos.map(
        (p: any) => p.proveedor
      );

    this.proveedores =
      [...new Set(listaProveedores)]
        .length;

    this.reclamos =
      productos.filter((p: any) =>

        p.estado === 'danado' ||

        p.estado === 'regular'

      ).length;

  }

  abrirResumen() {

    this.modalAbierto = true;

  }

  cerrarResumen() {

    this.modalAbierto = false;

  }

  cerrarSesion() {

    localStorage.removeItem(
      'sesion'
    );

    this.router.navigate([
      '/login'
    ]);

  }

}