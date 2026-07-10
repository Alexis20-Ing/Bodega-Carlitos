import { Component } from '@angular/core';
import { FirebaseService } from '../../services/firebase.service';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-proveedores',
  templateUrl: './proveedores.page.html',
  styleUrls: ['./proveedores.page.scss'],
  standalone: false
})
export class ProveedoresPage {

  nombre = '';

  telefono = '';

  busqueda = '';

  proveedores: any[] = [];

  proveedoresFiltrados: any[] = [];

  editando = false;

  firebaseId = '';

  constructor(
    private firebaseService: FirebaseService,
    private alertController: AlertController
  ) {}

  async ionViewWillEnter() {

    this.busqueda = '';

    await this.cargarProveedores();

  }

  async cargarProveedores() {

    const proveedoresFirebase =
      await this.firebaseService.obtenerProveedores();

    const productos =
      await this.firebaseService.obtenerProductos();

    const lista = proveedoresFirebase.map((p: any) => {

      const productosProveedor =
        productos.filter((prod: any) =>

          prod.proveedor?.toLowerCase().trim() ===
          p.nombre?.toLowerCase().trim()

        );

      const reclamos =
        productosProveedor.filter((prod: any) =>

          prod.estado === 'rechazado'

        );

      return {

        id: String(p.id),

        nombre: p.nombre,

        telefono: p.telefono,

        productos: productosProveedor.length,

        reclamos: reclamos.length

      };

    });

    this.proveedores = [...lista];

    this.proveedoresFiltrados = [...lista];

  }

async agregarProveedor() {

  this.nombre = this.nombre.trim();
  this.telefono = this.telefono.trim();

  if (!this.nombre || !this.telefono) {

    alert('Completa todos los datos');

    return;

  }

  const soloLetras =
    /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/;

  if (!soloLetras.test(this.nombre)) {

    alert(
      'El nombre del proveedor solo debe contener letras.'
    );

    return;

  }

  const letras =
    this.nombre.replace(/\s/g, '');

  if (letras.length < 3) {

    alert(
      'El nombre es demasiado corto.'
    );

    return;

  }

  const palabrasInvalidas = [

    'asd',
    'asdf',
    'asdasd',
    'qwe',
    'qwerty',
    'zxc',
    'zxcv',
    'abc',
    'abcd',
    'prueba',
    'test'

  ];

  if (

    palabrasInvalidas.includes(

      this.nombre.toLowerCase()

    )

  ) {

    alert(
      'Ingrese un nombre de proveedor válido.'
    );

    return;

  }

  const repetido =

    this.proveedores.find(

      p =>

        p.nombre.toLowerCase().trim() ==

        this.nombre.toLowerCase().trim()

        &&

        String(p.id) != String(this.firebaseId)

    );

  if (repetido) {

    alert(
      'Ese proveedor ya existe.'
    );

    return;

  }

  if (!/^[0-9]{9}$/.test(this.telefono)) {

    alert(
      'Ingrese un teléfono válido de 9 dígitos.'
    );

    return;

  }

  try {

    if (this.editando) {

      await this.firebaseService.actualizarProveedor(

        String(this.firebaseId),

        {

          nombre: this.nombre,

          telefono: this.telefono

        }

      );

      const productos =

        await this.firebaseService.obtenerProductos();

      const proveedorAnterior =

        this.proveedores.find(

          p =>

            String(p.id) ==

            String(this.firebaseId)

        );

      if (proveedorAnterior) {

        for (const prod of productos) {

          if (

            prod.proveedor

              ?.toLowerCase()

              .trim() ==

            proveedorAnterior.nombre

              ?.toLowerCase()

              .trim()

          ) {

            await this.firebaseService.actualizarProducto(

              prod.id,

              {

                proveedor: this.nombre

              }

            );

          }

        }

      }

      alert('Proveedor actualizado');

    }

    else {

      await this.firebaseService.agregarProveedor({

        nombre: this.nombre,

        telefono: this.telefono

      });

      alert('Proveedor agregado');

    }

    this.limpiarFormulario();

    await this.cargarProveedores();

  }

  catch (error) {

    console.error(error);

    alert('Error al guardar proveedor');

  }

}

  editarProveedor(p: any) {

    this.nombre = p.nombre;

    this.telefono = p.telefono;

    this.firebaseId = String(p.id);

    this.editando = true;

  }

  async eliminarProveedor(id: any) {

    if (!confirm('¿Eliminar proveedor?')) return;

    await this.firebaseService.eliminarProveedor(

      String(id)

    );

    alert('Proveedor eliminado');

    await this.cargarProveedores();

  }

  llamarProveedor(telefono: string) {

    window.open(
      'tel:' + telefono,
      '_system'
    );

  }

  abrirWhatsapp(telefono: string) {

    const numero =
      telefono.replace(/\s/g, '');

    window.open(
      `https://wa.me/51${numero}`,
      '_blank'
    );

  }

  limpiarFormulario() {

    this.nombre = '';

    this.telefono = '';

    this.editando = false;

    this.firebaseId = '';

  }

  filtrarProveedores() {

    const texto =
      this.busqueda.toLowerCase().trim();

    if (!texto) {

      this.proveedoresFiltrados =
        [...this.proveedores];

      return;

    }

    this.proveedoresFiltrados =
      this.proveedores.filter(p =>

        p.nombre?.toLowerCase().includes(texto)

      );

  }

  mostrarTodos() {

    this.busqueda = '';

    this.proveedoresFiltrados =
      [...this.proveedores];

  }

  

}