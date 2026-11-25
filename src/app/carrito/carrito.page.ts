import { Component } from '@angular/core';
import { Location } from '@angular/common';
import { AlertController } from '@ionic/angular';
import { FirebaseService } from '../services/firebase.service';

@Component({
  selector: 'app-carrito',
  templateUrl: './carrito.page.html',
  styleUrls: ['./carrito.page.scss'],
  standalone: false,
})
export class CarritoPage {

  carrito: any[] = [];

  procesandoPedido: boolean = false;
  actualizandoStock: boolean = false;

  constructor(
    private location: Location,
    private alertController: AlertController,
    private firebaseService: FirebaseService
  ) {}

  // ==========================================
  // CARGAR CARRITO
  // ==========================================

  async ionViewWillEnter() {
    const carritoGuardado = localStorage.getItem('carrito');

    if (carritoGuardado) {
      try {
        this.carrito = JSON.parse(carritoGuardado);

        if (!Array.isArray(this.carrito)) {
          this.carrito = [];
        }
      } catch (error) {
        console.error('Error al recuperar el carrito:', error);
        this.carrito = [];
      }
    } else {
      this.carrito = [];
    }

    // Comprobar el stock actual del catálogo nuevo.
    await this.actualizarStockCarrito();
  }

  // ==========================================
  // CONSULTAR STOCK EN CATALOGO_PRODUCTOS
  // ==========================================

  async actualizarStockCarrito(): Promise<boolean> {
    if (this.actualizandoStock) {
      return false;
    }

    this.actualizandoStock = true;

    let stockValido = true;
    let cambiosDetectados = false;

    try {
      for (const producto of this.carrito) {
        try {
          const productoFirebase: any =
            await this.firebaseService.obtenerProductoCatalogoPorId(
              String(producto.id)
            );

          // Si el producto ya no existe en el catálogo.
          if (!productoFirebase) {
            producto.cantidad = 0;
            producto.noDisponible = true;

            stockValido = false;
            cambiosDetectados = true;

            continue;
          }

          const stockAnterior = Number(producto.cantidad ?? 0);

          const stockActual = Math.max(
            0,
            Number(productoFirebase.cantidad ?? 0)
          );

          // Actualizar stock disponible.
          producto.cantidad = stockActual;
          producto.noDisponible = stockActual <= 0;

          // Actualizar nombre del producto.
          producto.producto =
            productoFirebase.nombre ??
            productoFirebase.producto ??
            producto.producto;

          // Mantener el nombre actualizado.
          producto.nombre =
            productoFirebase.nombre ??
            productoFirebase.producto ??
            producto.nombre ??
            producto.producto;

          // Actualizar categoría.
          producto.categoria =
            productoFirebase.categoria ??
            producto.categoria ??
            'General';

          // Actualizar precio.
          producto.precio = Number(
            productoFirebase.precio ?? producto.precio ?? 0
          );

          // Actualizar imagen del catálogo.
          producto.imagen =
            productoFirebase.imagen ??
            productoFirebase.foto ??
            producto.imagen ??
            producto.foto ??
            '';

          // Compatibilidad con el HTML antiguo que utiliza foto.
          producto.foto = producto.imagen;

          // Detectar cambios en el stock.
          if (stockAnterior !== stockActual) {
            cambiosDetectados = true;
          }

          // Comprobar si el producto está agotado.
          if (stockActual <= 0) {
            stockValido = false;
          }

          // Ajustar la cantidad solicitada al stock disponible.
          const cantidadCarrito = Number(
            producto.cantidadCarrito ?? 1
          );

          if (cantidadCarrito > stockActual && stockActual > 0) {
            producto.cantidadCarrito = stockActual;

            cambiosDetectados = true;
            stockValido = false;
          }

          // Corregir cantidades inválidas.
          if (
            !Number.isFinite(cantidadCarrito) ||
            cantidadCarrito < 1
          ) {
            producto.cantidadCarrito = 1;
            cambiosDetectados = true;
          }

        } catch (error) {
          console.error(
            `Error al consultar el stock de ${producto.producto}:`,
            error
          );

          stockValido = false;
        }
      }

      this.guardarCarrito();

      // Si cambió el stock, el cliente debe revisar el carrito.
      return stockValido && !cambiosDetectados;

    } finally {
      this.actualizandoStock = false;
    }
  }

  // ==========================================
  // COMPROBAR PROBLEMAS DE STOCK
  // ==========================================

  hayProblemasStock(): boolean {
    return this.carrito.some((producto: any) =>
      producto.noDisponible === true ||
      Number(producto.cantidad ?? 0) <= 0 ||
      Number(producto.cantidadCarrito ?? 0) < 1 ||
      Number(producto.cantidadCarrito ?? 0) >
        Number(producto.cantidad ?? 0)
    );
  }

  // ==========================================
  // AUMENTAR CANTIDAD
  // ==========================================

  async aumentarCantidad(producto: any) {
    if (this.procesandoPedido || this.actualizandoStock) {
      return;
    }

    try {
      // Consultar el catálogo nuevo, no la colección antigua.
      const productoFirebase: any =
        await this.firebaseService.obtenerProductoCatalogoPorId(
          String(producto.id)
        );

      if (!productoFirebase) {
        producto.cantidad = 0;
        producto.noDisponible = true;

        this.guardarCarrito();

        await this.mostrarAlerta(
          'Producto no disponible',
          'Este producto ya no se encuentra disponible en el catálogo.'
        );

        return;
      }

      const stockActual = Math.max(
        0,
        Number(productoFirebase.cantidad ?? 0)
      );

      producto.cantidad = stockActual;
      producto.noDisponible = stockActual <= 0;

      producto.producto =
        productoFirebase.nombre ??
        productoFirebase.producto ??
        producto.producto;

      producto.nombre =
        productoFirebase.nombre ??
        productoFirebase.producto ??
        producto.nombre ??
        producto.producto;

      producto.categoria =
        productoFirebase.categoria ??
        producto.categoria ??
        'General';

      producto.precio = Number(
        productoFirebase.precio ?? producto.precio ?? 0
      );

      producto.imagen =
        productoFirebase.imagen ??
        productoFirebase.foto ??
        producto.imagen ??
        producto.foto ??
        '';

      producto.foto = producto.imagen;

      if (stockActual <= 0) {
        this.guardarCarrito();

        await this.mostrarAlerta(
          'Producto agotado',
          'Ya no quedan unidades disponibles de este producto.'
        );

        return;
      }

      if (Number(producto.cantidadCarrito) >= stockActual) {
        this.guardarCarrito();

        await this.mostrarAlerta(
          'Stock máximo alcanzado',
          `Solo quedan ${stockActual} unidad(es) disponibles.`
        );

        return;
      }

      producto.cantidadCarrito =
        Number(producto.cantidadCarrito ?? 1) + 1;

      this.guardarCarrito();

    } catch (error) {
      console.error('Error al verificar el stock:', error);

      await this.mostrarAlerta(
        'No se pudo verificar el stock',
        'Comprueba tu conexión a Internet e inténtalo nuevamente.'
      );
    }
  }

  // ==========================================
  // DISMINUIR CANTIDAD
  // ==========================================

  disminuirCantidad(producto: any) {
    if (this.procesandoPedido || this.actualizandoStock) {
      return;
    }

    if (Number(producto.cantidadCarrito) > 1) {
      producto.cantidadCarrito--;
    } else {
      this.eliminarProducto(producto);
      return;
    }

    this.guardarCarrito();
  }

  // ==========================================
  // ELIMINAR PRODUCTO
  // ==========================================

  eliminarProducto(producto: any) {
    if (this.procesandoPedido || this.actualizandoStock) {
      return;
    }

    this.carrito = this.carrito.filter(
      (item: any) => item.id !== producto.id
    );

    this.guardarCarrito();
  }

  // ==========================================
  // CALCULAR SUBTOTAL
  // ==========================================

  obtenerSubtotal(producto: any): number {
    return (
      Number(producto.precio ?? 0) *
      Number(producto.cantidadCarrito ?? 0)
    );
  }

  // ==========================================
  // CALCULAR TOTAL
  // ==========================================

  obtenerTotal(): number {
    return this.carrito.reduce(
      (total: number, producto: any) => {
        return total + this.obtenerSubtotal(producto);
      },
      0
    );
  }

  // ==========================================
  // GUARDAR CARRITO EN LOCALSTORAGE
  // ==========================================

  guardarCarrito() {
    localStorage.setItem(
      'carrito',
      JSON.stringify(this.carrito)
    );
  }

  // ==========================================
  // MOSTRAR ALERTA
  // ==========================================

  async mostrarAlerta(
    titulo: string,
    mensaje: string
  ) {
    const alert = await this.alertController.create({
      header: titulo,
      message: mensaje,
      buttons: ['OK']
    });

    await alert.present();
  }

  // ==========================================
  // REALIZAR PEDIDO
  // ==========================================

  async realizarPedido() {
    if (this.procesandoPedido || this.actualizandoStock) {
      return;
    }

    if (this.carrito.length === 0) {
      await this.mostrarAlerta(
        'Carrito vacío',
        'Agrega al menos un producto antes de realizar el pedido.'
      );

      return;
    }

    this.procesandoPedido = true;

    try {
      // Verificar que el stock esté actualizado.
      const stockValido = await this.actualizarStockCarrito();

      if (!stockValido || this.hayProblemasStock()) {
        await this.mostrarAlerta(
          'Revisa tu carrito',
          'El stock de uno o más productos cambió. Revisa las cantidades disponibles y vuelve a confirmar tu pedido.'
        );

        return;
      }

      // Obtener la sesión del cliente.
      const sesion = localStorage.getItem('sesion');

      let sesionData: any = null;

      if (sesion) {
        try {
          sesionData = JSON.parse(sesion);
        } catch (error) {
          console.error('Error al leer la sesión:', error);
        }
      }

      if (!sesionData) {
        await this.mostrarAlerta(
          'Sesión no válida',
          'Inicia sesión nuevamente para realizar tu pedido.'
        );

        return;
      }

      // Preparar los productos del pedido.
      const productosPedido = this.carrito.map(
        (producto: any) => ({
          id: producto.id,

          producto:
            producto.nombre ??
            producto.producto ??
            'Producto',

          categoria: producto.categoria ?? 'General',

          precio: Number(producto.precio),

          cantidad: Number(producto.cantidadCarrito),

          subtotal:
            Number(producto.precio) *
            Number(producto.cantidadCarrito),

          // Campo nuevo para la imagen del catálogo.
          imagen: producto.imagen ?? producto.foto ?? '',

          // Se mantiene foto por compatibilidad con otras pantallas.
          foto: producto.imagen ?? producto.foto ?? ''
        })
      );

      // Crear el pedido que se guardará en Firebase.
      const pedido = {
        usuarioId: sesionData.id ?? null,

        usuario:
          sesionData.usuario ??
          sesionData.nombre ??
          'Cliente',

        productos: productosPedido,

        total: this.obtenerTotal(),

        estado: 'pendiente',

        fecha: new Date()
      };

      console.log('Pedido a realizar:', pedido);

      // IMPORTANTE:
      // Guarda el pedido en "pedidos" y descuenta el stock
      // de "catalogo_productos".
      await this.firebaseService.realizarPedidoConStockCatalogo(
        pedido
      );

      // Vaciar el carrito después de confirmar el pedido.
      this.carrito = [];
      localStorage.removeItem('carrito');

      const alert = await this.alertController.create({
        header: '¡Pedido realizado!',
        message:
          'Tu pedido fue registrado correctamente y el stock del catálogo fue actualizado.',
        buttons: [
          {
            text: 'Ver mis pedidos',
            handler: () => {
              window.location.href = '/mis-pedidos';
            }
          }
        ],
        backdropDismiss: false
      });

      await alert.present();

    } catch (error: any) {
      console.error('Error al realizar el pedido:', error);

      // Error de stock detectado dentro de la transacción.
      if (
        error?.message?.startsWith('STOCK_INSUFICIENTE:')
      ) {
        const datos = error.message.split(':');

        const nombreProducto = datos[1] || 'Producto';
        const stockDisponible = datos[2] || '0';

        await this.actualizarStockCarrito();

        await this.mostrarAlerta(
          'Stock insuficiente',
          `El producto "${nombreProducto}" ya no tiene suficientes unidades. Stock disponible: ${stockDisponible}. Revisa tu carrito e inténtalo nuevamente.`
        );

        return;
      }

      await this.mostrarAlerta(
        'Error',
        'No se pudo realizar el pedido. Verifica tu conexión e inténtalo nuevamente.'
      );

    } finally {
      this.procesandoPedido = false;
    }
  }

  // ==========================================
  // VOLVER A LA PANTALLA ANTERIOR
  // ==========================================

  volver() {
    this.location.back();
  }
}