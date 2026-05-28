import { Component } from '@angular/core';
import { FirebaseService } from '../../services/firebase.service';

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
    private firebaseService: FirebaseService
  ) {}

  async ionViewWillEnter() {

    this.busqueda = '';

    await this.cargarProveedores();

  }

  // ======================================
  // CARGAR PROVEEDORES
  // ======================================

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

    console.log('PROVEEDORES CARGADOS:', lista);

  }

  // ======================================
  // AGREGAR / EDITAR
  // ======================================

  async agregarProveedor() {

    if (
      !this.nombre.trim() ||
      !this.telefono.trim()
    ) {

      alert('Completa los datos');

      return;

    }

    try {

      // ======================================
      // EDITAR
      // ======================================

      if (this.editando) {

        console.log(
          'ID A ACTUALIZAR:',
          this.firebaseId
        );

        await this.firebaseService.actualizarProveedor(

          String(this.firebaseId),

          {
            nombre: this.nombre.trim(),
            telefono: this.telefono.trim()
          }

        );

        // ======================================
        // ACTUALIZAR HISTORIAL
        // ======================================

        const productos =
          await this.firebaseService.obtenerProductos();

        const proveedorAnterior =
          this.proveedores.find(

            p => String(p.id) === String(this.firebaseId)

          );

        if (proveedorAnterior) {

          const nombreAnterior =
            proveedorAnterior.nombre;

          for (const prod of productos) {

            if (

              prod.proveedor?.toLowerCase().trim() ===
              nombreAnterior?.toLowerCase().trim()

            ) {

              await this.firebaseService.actualizarProducto(

                prod.id,

                {
                  proveedor: this.nombre.trim()
                }

              );

            }

          }

        }

        alert('Proveedor actualizado');

      }

      // ======================================
      // AGREGAR
      // ======================================

      else {

        await this.firebaseService.agregarProveedor({

          nombre: this.nombre.trim(),

          telefono: this.telefono.trim()

        });

        alert('Proveedor agregado');

      }

      this.limpiarFormulario();

      await this.cargarProveedores();

    }

    catch (error) {

      console.error(
        'ERROR ACTUALIZAR:',
        error
      );

      alert('Error actualizando proveedor');

    }

  }

  // ======================================
  // EDITAR
  // ======================================

  editarProveedor(p: any) {

    console.log('PROVEEDOR EDITAR:', p);

    this.nombre = p.nombre;

    this.telefono = p.telefono;

    this.firebaseId = String(p.id);

    console.log(
      'FIREBASE ID:',
      this.firebaseId
    );

    this.editando = true;

  }

  // ======================================
  // ELIMINAR
  // ======================================

  async eliminarProveedor(id: any) {

    if (!confirm('¿Eliminar proveedor?')) return;

    await this.firebaseService.eliminarProveedor(

      String(id)

    );

    alert('Proveedor eliminado');

    await this.cargarProveedores();

  }

  // ======================================
  // LIMPIAR
  // ======================================

  limpiarFormulario() {

    this.nombre = '';

    this.telefono = '';

    this.editando = false;

    this.firebaseId = '';

  }

  // ======================================
  // FILTRAR
  // ======================================

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

  // ======================================
  // MOSTRAR TODOS
  // ======================================

  mostrarTodos() {

    this.busqueda = '';

    this.proveedoresFiltrados =
      [...this.proveedores];

  }

}