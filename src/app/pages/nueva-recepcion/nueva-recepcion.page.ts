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

  productos: any[] = [];

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

    this.productos =
      await this.firebaseService.obtenerProductos();

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
  // VALIDAR NOMBRES
  // ======================================

  validarNombre(texto: string): boolean {

    texto =
      texto.trim().toLowerCase();

    const regex =
      /^[a-záéíóúñ\s]+$/i;

    if (!regex.test(texto)) {

      return false;

    }

    if (
      texto.replace(/\s/g, '').length < 3
    ) {

      return false;

    }

    const palabrasInvalidas = [

      "asd",

      "asdf",

      "qwe",

      "qwerty",

      "zxc",

      "abc",

      "test",

      "xxx",

      "aaa",

      "bbb",

      "ccc"

    ];

    for (let palabra of palabrasInvalidas) {

      if (
        texto.includes(palabra)
      ) {

        return false;

      }

    }

    return true;

  }

  // ======================================
  // FOTO
  // ======================================

  async tomarFoto() {

    try {

      const image =
        await Camera.getPhoto({

          quality: 25,

          width: 500,

          height: 500,

          allowEditing: false,

          resultType:
            CameraResultType.Base64

        });

      this.foto =
        image.base64String
          ? `data:image/jpeg;base64,${image.base64String}`
          : '';

    }

    catch (error) {

      console.error(error);

      alert(
        'No se pudo obtener la foto'
      );

    }

  }

  // ======================================
  // GUARDAR
  // ======================================

  async guardarProducto() {

    try {

      if (
        this.esNuevoProveedor
      ) {

        if (

          this.nuevoProveedor.trim() == '' ||

          this.nuevoTelefono.trim() == ''

        ) {

          alert(
            'Completa los datos del proveedor'
          );

          return;

        }

      }

      if (

        this.proveedor.trim() == '' &&

        !this.esNuevoProveedor ||

        this.producto.trim() == '' ||

        this.cantidad <= 0 ||

        this.precio <= 0

      ) {

        alert(
          'Completa correctamente los campos'
        );

        return;

      }

      //============================
      // VALIDAR PRODUCTO
      //============================

      if (

        !this.validarNombre(
          this.producto
        )

      ) {

        alert(
          'Ingrese un nombre de producto válido.'
        );

        return;

      }

      //============================
      // VALIDAR PROVEEDOR
      //============================

      if (
        this.esNuevoProveedor
      ) {

        if (

          !this.validarNombre(
            this.nuevoProveedor
          )

        ) {

          alert(
            'Ingrese un nombre de proveedor válido.'
          );

          return;

        }

      }

      //============================
      // EVITAR PROVEEDOR REPETIDO
      //============================

      if (
        this.esNuevoProveedor
      ) {

        const existeProveedor =

          this.proveedores.find(

            (p:any)=>

              p.nombre
                .trim()
                .toLowerCase()

              ==

              this.nuevoProveedor
                .trim()
                .toLowerCase()

          );

        if (
          existeProveedor
        ) {

          alert(
            'Ese proveedor ya existe.'
          );

          return;

        }

      }

      if (
        this.esNuevoProveedor
      ) {

        await this.firebaseService.agregarProveedor({

          nombre:
            this.nuevoProveedor.trim(),

          telefono:
            this.nuevoTelefono.trim()

        });

        this.proveedor =
          this.nuevoProveedor.trim();

      }

      //============================
      // EVITAR PRODUCTO REPETIDO
      //============================

      const existeProducto =

        this.productos.find(

          (p:any)=>

            p.producto
              .trim()
              .toLowerCase()

            ==

            this.producto
              .trim()
              .toLowerCase()

            &&

            p.proveedor
              .trim()
              .toLowerCase()

            ==

            this.proveedor
              .trim()
              .toLowerCase()

        );

      if (
        existeProducto
      ) {

        alert(
          'Este producto ya fue registrado para este proveedor.'
        );

        return;

      }

      const nuevoProducto = {

        proveedor:
          this.proveedor.trim(),

        producto:
          this.producto.trim(),

        cantidad:
          this.cantidad,

        precio:
          this.precio,

        estado:
          'pendiente',

        fecha:
          new Date(),

        foto:
          this.foto || ''

      };

      const docRef =

        await this.firebaseService.agregarProducto(

          nuevoProducto

        );

      await this.router.navigate([

        '/tabs/verificacion',

        docRef.id

      ]);

    }

    catch (error) {

      console.error(error);

      alert(
        'Error al guardar el producto.'
      );

    }

  }

}