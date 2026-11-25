import { Component } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { Location } from '@angular/common';
import { FirebaseService } from '../../services/firebase.service';

@Component({
  selector: 'app-productos',
  templateUrl: './productos.page.html',
  styleUrls: ['./productos.page.scss'],
  standalone: false
})
export class ProductosPage {
  productos: any[] = [];

  cargando = false;
  guardando = false;
  subiendoImagen = false;

  productoEditandoId: string | null = null;

  categorias: string[] = [
    'Abarrotes',
    'Bebidas',
    'Limpieza',
    'Lácteos',
    'Embutidos',
    'Snacks',
    'Otros'
  ];

  nuevoProducto: any = {
    nombre: '',
    descripcion: '',
    categoria: 'Abarrotes',
    precio: null,
    cantidad: null,
    imagen: ''
  };

  constructor(
    private firebaseService: FirebaseService,
    private alertController: AlertController,
    private location: Location
  ) {}

  async ionViewWillEnter() {
    await this.cargarProductos();
  }

  volver() {
    this.location.back();
  }

  async cargarProductos() {
    this.cargando = true;

    try {
      const resultado =
        await this.firebaseService.obtenerProductosCatalogo();

      this.productos = resultado ?? [];
    } catch (error) {
      console.error('Error al cargar productos:', error);

      await this.mostrarAlerta(
        'Error',
        'No se pudieron cargar los productos.'
      );
    } finally {
      this.cargando = false;
    }
  }

  async seleccionarImagen(event: Event) {
    const input = event.target as HTMLInputElement;
    const archivo = input.files?.[0];

    if (!archivo) return;

    if (!archivo.type.startsWith('image/')) {
      await this.mostrarAlerta(
        'Archivo inválido',
        'Selecciona un archivo de imagen.'
      );
      input.value = '';
      return;
    }

    if (archivo.size > 5 * 1024 * 1024) {
      await this.mostrarAlerta(
        'Imagen demasiado grande',
        'Selecciona una imagen que pese como máximo 5 MB.'
      );
      input.value = '';
      return;
    }

    this.subiendoImagen = true;

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const lector = new FileReader();

        lector.onload = () => {
          if (typeof lector.result === 'string') {
            resolve(lector.result);
          } else {
            reject(new Error('No se pudo leer la imagen.'));
          }
        };

        lector.onerror = () => {
          reject(new Error('Error al leer el archivo.'));
        };

        lector.readAsDataURL(archivo);
      });

      this.nuevoProducto.imagen = base64;
    } catch (error) {
      console.error('Error al procesar la imagen:', error);

      await this.mostrarAlerta(
        'Error',
        'No se pudo procesar la imagen seleccionada.'
      );
    } finally {
      this.subiendoImagen = false;
      input.value = '';
    }
  }

  quitarImagen() {
    this.nuevoProducto.imagen = '';
  }

  editarProducto(producto: any) {
    if (!producto.id) {
      void this.mostrarAlerta(
        'Error',
        'No se encontró el identificador del producto.'
      );
      return;
    }

    this.productoEditandoId = producto.id;

    this.nuevoProducto = {
      nombre: producto.nombre || producto.producto || '',
      descripcion: producto.descripcion || '',
      categoria: producto.categoria || 'Otros',
      precio: producto.precio ?? null,
      cantidad: producto.cantidad ?? 0,
      imagen: producto.imagen || producto.foto || ''
    };

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  cancelarEdicion() {
    this.productoEditandoId = null;

    this.nuevoProducto = {
      nombre: '',
      descripcion: '',
      categoria: 'Abarrotes',
      precio: null,
      cantidad: null,
      imagen: ''
    };
  }

  async agregarProducto() {
    if (this.guardando || this.subiendoImagen) return;

    const nombre = String(
      this.nuevoProducto.nombre ?? ''
    ).trim();

    const descripcion = String(
      this.nuevoProducto.descripcion ?? ''
    ).trim();

    const categoria = String(
      this.nuevoProducto.categoria ?? ''
    ).trim();

    const precio = Number(this.nuevoProducto.precio);
    const cantidad = Number(this.nuevoProducto.cantidad);
    const imagen = String(this.nuevoProducto.imagen ?? '');

    if (!nombre) {
      await this.mostrarAlerta(
        'Campo obligatorio',
        'Ingresa el nombre del producto.'
      );
      return;
    }

    if (!this.categorias.includes(categoria)) {
      await this.mostrarAlerta(
        'Categoría inválida',
        'Selecciona una categoría válida.'
      );
      return;
    }

    if (
      this.nuevoProducto.precio === null ||
      this.nuevoProducto.precio === '' ||
      !Number.isFinite(precio) ||
      precio <= 0
    ) {
      await this.mostrarAlerta(
        'Precio inválido',
        'Ingresa un precio mayor que cero.'
      );
      return;
    }

    if (
      this.nuevoProducto.cantidad === null ||
      this.nuevoProducto.cantidad === '' ||
      !Number.isInteger(cantidad) ||
      cantidad < 0
    ) {
      await this.mostrarAlerta(
        'Cantidad inválida',
        'Ingresa una cantidad entera igual o mayor que cero.'
      );
      return;
    }

    this.guardando = true;

    try {
      const nombreNormalizado = nombre.toLocaleLowerCase();

      const existente = this.productos.find((p) =>
        String(p.nombre || p.producto || '')
          .trim()
          .toLocaleLowerCase() === nombreNormalizado
      );

      const datosBase = {
        nombre,
        producto: nombre,
        descripcion,
        categoria,
        precio,
        imagen
      };

      if (this.productoEditandoId) {
        const datosActualizados = {
          ...datosBase,
          cantidad,
          estado: cantidad > 0 ? 'disponible' : 'agotado'
        };

        await this.firebaseService.actualizarProductoCatalogo(
          this.productoEditandoId,
          datosActualizados
        );

        await this.mostrarAlerta(
          'Producto actualizado',
          'Los cambios se guardaron correctamente.'
        );
      } else if (existente) {
        if (!existente.id) {
          throw new Error(
            'El producto existente no tiene un identificador de Firestore.'
          );
        }

        const stockActual = Number(existente.cantidad ?? 0);
        const nuevoStock = stockActual + cantidad;

        const datosActualizados = {
          ...datosBase,
          imagen: imagen || existente.imagen || existente.foto || '',
          cantidad: nuevoStock,
          estado: nuevoStock > 0 ? 'disponible' : 'agotado'
        };

        await this.firebaseService.actualizarProductoCatalogo(
          existente.id,
          datosActualizados
        );

        await this.mostrarAlerta(
          'Stock actualizado',
          `Se agregaron ${cantidad} unidades. Stock actual: ${nuevoStock}.`
        );
      } else {
        const nuevo = {
          ...datosBase,
          cantidad,
          estado: cantidad > 0 ? 'disponible' : 'agotado'
        };

        await this.firebaseService.agregarProductoCatalogo(nuevo);

        await this.mostrarAlerta(
          'Producto registrado',
          'El producto se guardó correctamente.'
        );
      }

      await this.cargarProductos();
      this.cancelarEdicion();
    } catch (error) {
      console.error('Error al guardar el producto:', error);

      await this.mostrarAlerta(
        'Error',
        'No se pudo guardar el producto. Comprueba tu conexión con Firebase.'
      );
    } finally {
      this.guardando = false;
    }
  }

  async eliminarProducto(producto: any) {
    if (this.guardando || this.subiendoImagen) return;

    if (!producto.id) {
      await this.mostrarAlerta(
        'Error',
        'No se encontró el identificador del producto.'
      );
      return;
    }

    const confirmacion = await this.alertController.create({
      header: 'Eliminar producto',
      message: `¿Estás seguro de que deseas eliminar "${producto.nombre || producto.producto}" del catálogo?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            void this.confirmarEliminacion(producto);
          }
        }
      ]
    });

    await confirmacion.present();
  }

  async confirmarEliminacion(producto: any) {
    if (this.guardando) return;

    this.guardando = true;

    try {
      await this.firebaseService.eliminarProductoCatalogo(producto.id);

      if (this.productoEditandoId === producto.id) {
        this.cancelarEdicion();
      }

      await this.cargarProductos();

      await this.mostrarAlerta(
        'Producto eliminado',
        'El producto se eliminó del catálogo correctamente.'
      );
    } catch (error) {
      console.error('Error al eliminar producto:', error);

      await this.mostrarAlerta(
        'Error',
        'No se pudo eliminar el producto. Comprueba tu conexión con Firebase.'
      );
    } finally {
      this.guardando = false;
    }
  }

  async mostrarAlerta(titulo: string, mensaje: string) {
    const alert = await this.alertController.create({
      header: titulo,
      message: mensaje,
      buttons: ['OK']
    });

    await alert.present();
  }
}
