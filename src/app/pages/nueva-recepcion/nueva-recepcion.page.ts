import { Component } from '@angular/core';
import {
  Camera,
  CameraResultType
} from '@capacitor/camera';

import { Router } from '@angular/router';
import { FirebaseService } from '../../services/firebase.service';

@Component({
  selector: 'app-nueva-recepcion',
  templateUrl: './nueva-recepcion.page.html',
  styleUrls: ['./nueva-recepcion.page.scss'],
  standalone: false
})
export class NuevaRecepcionPage {

  producto = '';
  proveedor = '';
  cantidad = 0;
  precio = 0;

  foto: string = '';

  proveedores: any[] = [];

  esNuevoProveedor = false;
  nuevoProveedor = '';
  nuevoTelefono = '';

  constructor(
    private firebaseService: FirebaseService,
    private router: Router
  ) {}

  async ionViewWillEnter() {

    this.limpiarFormulario();

    this.proveedores =
      await this.firebaseService.obtenerProveedores();

  }

  limpiarFormulario() {

    this.producto = '';
    this.proveedor = '';
    this.cantidad = 0;
    this.precio = 0;

    this.foto = '';

    this.esNuevoProveedor = false;

    this.nuevoProveedor = '';
    this.nuevoTelefono = '';

  }

  // ======================================
  // FOTO
  // ======================================

  async tomarFoto() {

    try {

      const image = await Camera.getPhoto({

        quality: 25,

        width: 500,

        height: 500,

        allowEditing: false,

        resultType: CameraResultType.Base64

      });

      this.foto = image.base64String
        ? `data:image/jpeg;base64,${image.base64String}`
        : '';

      console.log('FOTO CAPTURADA');

      console.log(
        'Tamaño foto:',
        this.foto.length
      );

    }

    catch (error) {

      console.error('ERROR FOTO:', error);

      alert('No se pudo obtener la foto');

    }

  }

  // ======================================
  // GUARDAR
  // ======================================

  async guardarProducto() {

    try {

      console.time('TOTAL');

      if (this.esNuevoProveedor) {

        if (
          this.nuevoProveedor.trim() === '' ||
          this.nuevoTelefono.trim() === ''
        ) {
          alert('Completa los datos del proveedor');
          return;
        }

        console.time('GUARDAR_PROVEEDOR');

        await this.firebaseService.agregarProveedor({
          nombre: this.nuevoProveedor.trim(),
          telefono: this.nuevoTelefono.trim()
        });

        console.timeEnd('GUARDAR_PROVEEDOR');

        this.proveedor = this.nuevoProveedor.trim();
      }

      if (
        this.proveedor.trim() === '' ||
        this.producto.trim() === '' ||
        this.cantidad <= 0 ||
        this.precio <= 0
      ) {
        alert('Completa correctamente los campos');
        return;
      }

      console.time('CREAR_OBJETO');

      const nuevoProducto = {

        proveedor: this.proveedor.trim(),

        producto: this.producto.trim(),

        cantidad: this.cantidad,

        precio: this.precio,

        estado: 'pendiente',

        fecha: new Date(),

        foto: this.foto || ''

      };

      console.timeEnd('CREAR_OBJETO');

      console.log(
        'PRODUCTO A GUARDAR:',
        nuevoProducto
      );

      console.log(
        'Tamaño foto:',
        this.foto.length
      );

      console.time('FIREBASE');

      const docRef =
        await this.firebaseService.agregarProducto(
          nuevoProducto
        );

      console.timeEnd('FIREBASE');

      console.log(
        'GUARDADO OK:',
        docRef.id
      );

      console.time('NAVEGACION');

      await this.router.navigate([
        '/tabs/verificacion',
        docRef.id
      ]);

      console.timeEnd('NAVEGACION');

      console.timeEnd('TOTAL');

    }

    catch (error: any) {

      console.error(
        'ERROR COMPLETO:',
        error
      );

      alert(
        'Error al guardar. Revisa la consola.'
      );

    }

  }

}