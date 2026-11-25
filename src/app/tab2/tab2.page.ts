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

  productos: any[] = [];
  productosFiltrados: any[] = [];
  carrito: any[] = [];

  buscar = '';
  categoriaSeleccionada = 'Todas';

  actualizando = false;
  cargando = false;

  nombreUsuario = 'Usuario';

  private cancelarEscuchaCatalogo: (() => void) | null = null;

  constructor(
    private router: Router,
    private alertController: AlertController,
    private firebaseService: FirebaseService
  ) {}

  // ==========================================
  // INICIALIZAR PANTALLA
  // ==========================================

  async ionViewWillEnter() {
    const sesionGuardada = localStorage.getItem('sesion');

    if (!sesionGuardada) {
      await this.mostrarAviso(
        'Acceso denegado',
        'No has iniciado sesión. Ingresa para continuar.'
      );

      this.router.navigate(['/login']);
      return;
    }

    this.obtenerNombreUsuario();
    this.recuperarCarrito();

    await this.cargarProductos();
    this.iniciarEscuchaCatalogo();
  }

  // ==========================================
  // OBTENER NOMBRE DEL USUARIO
  // ==========================================

  obtenerNombreUsuario() {
    this.nombreUsuario = 'Usuario';

    try {
      const usuarioGuardado = localStorage.getItem('usuario');
      const sesionGuardada = localStorage.getItem('sesion');

      let usuario: any = {};
      let sesion: any = {};

      if (usuarioGuardado) {
        try {
          usuario = JSON.parse(usuarioGuardado);
        } catch {
          usuario = { nombre: usuarioGuardado };
        }
      }

      if (sesionGuardada) {
        try {
          sesion = JSON.parse(sesionGuardada);
        } catch {
          sesion = { nombre: sesionGuardada };
        }
      }

      const nombre =
        usuario?.nombre ||
        usuario?.displayName ||
        usuario?.name ||
        usuario?.nombreCompleto ||
        sesion?.nombre ||
        sesion?.displayName ||
        sesion?.name ||
        sesion?.nombreCompleto;

      if (nombre && String(nombre).trim()) {
        this.nombreUsuario = String(nombre).trim();
        return;
      }

      const email =
        usuario?.email ||
        usuario?.usuario ||
        sesion?.email ||
        sesion?.usuario;

      if (email && String(email).includes('@')) {
        this.nombreUsuario = String(email)
          .split('@')[0];
      }

    } catch (error) {
      console.error(
        'Error al obtener el nombre del usuario:',
        error
      );
    }
  }

  // ==========================================
  // RECUPERAR CARRITO
  // ==========================================

  private recuperarCarrito() {
    const carritoGuardado = localStorage.getItem('carrito');

    if (!carritoGuardado) {
      this.carrito = [];
      return;
    }

    try {
      const datos = JSON.parse(carritoGuardado);
      this.carrito = Array.isArray(datos) ? datos : [];
    } catch (error) {
      console.error(
        'Error al recuperar el carrito:',
        error
      );

      this.carrito = [];
      localStorage.removeItem('carrito');
    }
  }

  // ==========================================
  // CARGAR PRODUCTOS
  // ==========================================

  async cargarProductos() {
    this.cargando = true;

    try {
      const resultado =
        await this.firebaseService.obtenerProductosCatalogo();

      this.procesarProductos(resultado ?? []);

    } catch (error) {
      console.error(
        'Error al cargar productos:',
        error
      );

      await this.mostrarAviso(
        'Error',
        'No se pudieron cargar los productos del catálogo.'
      );

    } finally {
      this.cargando = false;
    }
  }

  // ==========================================
  // PROCESAR PRODUCTOS
  // ==========================================

  procesarProductos(resultado: any[]) {
    const productosActuales = resultado ?? [];

    this.productos = productosActuales
      .filter((p: any) => Number(p.cantidad ?? 0) > 0)
      .map((p: any) => ({
        ...p,
        producto: p.nombre || p.producto || '',
        categoria: p.categoria || 'General',
        imagen: p.imagen || p.foto || '',
        precio: Number(p.precio ?? 0),
        cantidad: Number(p.cantidad ?? 0)
      }));

    this.filtrarProductos();
    this.actualizarProductosDelCarrito(productosActuales);
  }

  // ==========================================
  // ESCUCHAR CAMBIOS DEL CATÁLOGO
  // ==========================================

  iniciarEscuchaCatalogo() {
    this.cancelarEscuchaCatalogo?.();
    this.cancelarEscuchaCatalogo = null;

    this.cancelarEscuchaCatalogo =
      this.firebaseService.escucharProductosCatalogo(
        (resultado: any[]) => {
          this.procesarProductos(resultado);
        },
        (error: any) => {
          console.error(
            'Error al escuchar los cambios del catálogo:',
            error
          );
        }
      );
  }

  // ==========================================
  // ACTUALIZAR CATÁLOGO MANUALMENTE
  // ==========================================

  async actualizarCatalogo() {
    if (this.actualizando) {
      return;
    }

    this.actualizando = true;

    try {
      await this.cargarProductos();
    } finally {
      this.actualizando = false;
    }
  }

  // ==========================================
  // DETENER ESCUCHA AL SALIR
  // ==========================================

  ionViewWillLeave() {
    this.cancelarEscuchaCatalogo?.();
    this.cancelarEscuchaCatalogo = null;
  }

  // ==========================================
  // ACTUALIZAR PRODUCTOS DEL CARRITO
  // ==========================================

  actualizarProductosDelCarrito(productosActuales: any[]) {
    this.carrito = this.carrito.map((item: any) => {
      const actualizado = productosActuales.find(
        (p: any) => p.id === item.id
      );

      if (!actualizado) {
        return {
          ...item,
          cantidad: 0,
          estado: 'eliminado'
        };
      }

      return {
        ...item,
        nombre:
          actualizado.nombre ||
          actualizado.producto ||
          '',
        producto:
          actualizado.nombre ||
          actualizado.producto ||
          '',
        precio: Number(actualizado.precio ?? 0),
        cantidad: Number(actualizado.cantidad ?? 0),
        imagen:
          actualizado.imagen ||
          actualizado.foto ||
          '',
        estado: actualizado.estado ||
          (
            Number(actualizado.cantidad ?? 0) > 0
              ? 'disponible'
              : 'agotado'
          )
      };
    });

    localStorage.setItem(
      'carrito',
      JSON.stringify(this.carrito)
    );
  }

  // ==========================================
  // BUSCAR PRODUCTOS
  // ==========================================

  buscarProductos(event: any) {
    this.buscar = String(
      event?.detail?.value ?? ''
    ).toLowerCase().trim();

    this.filtrarProductos();
  }

  // ==========================================
  // SELECCIONAR CATEGORÍA
  // ==========================================

  seleccionarCategoria(categoria: string) {
    this.categoriaSeleccionada = categoria;
    this.filtrarProductos();
  }

  // ==========================================
  // FILTRAR PRODUCTOS
  // ==========================================

  filtrarProductos() {
    this.productosFiltrados = this.productos.filter(
      (producto: any) => {
        const nombre = String(
          producto.nombre ||
          producto.producto ||
          ''
        ).toLowerCase();

        const coincideNombre =
          nombre.includes(this.buscar);

        const coincideCategoria =
          this.categoriaSeleccionada === 'Todas' ||
          producto.categoria === this.categoriaSeleccionada;

        return coincideNombre && coincideCategoria;
      }
    );
  }

  // ==========================================
  // AGREGAR AL CARRITO
  // ==========================================

  agregarAlCarrito(producto: any) {
    const stockDisponible = Number(
      producto.cantidad ?? 0
    );

    if (stockDisponible <= 0) {
      this.mostrarAviso(
        'Producto agotado',
        'Este producto ya no tiene unidades disponibles.'
      );
      return;
    }

    const productoExistente = this.carrito.find(
      (item: any) => item.id === producto.id
    );

    if (productoExistente) {
      const cantidadActual = Number(
        productoExistente.cantidadCarrito ?? 0
      );

      if (cantidadActual < stockDisponible) {
        productoExistente.cantidadCarrito =
          cantidadActual + 1;
      } else {
        this.mostrarAviso(
          'Stock máximo',
          'No puedes agregar más unidades de las disponibles.'
        );
        return;
      }
    } else {
      this.carrito.push({
        ...producto,
        cantidadCarrito: 1
      });
    }

    localStorage.setItem(
      'carrito',
      JSON.stringify(this.carrito)
    );
  }

  // ==========================================
  // CANTIDAD DEL CARRITO
  // ==========================================

  obtenerCantidadCarrito(): number {
    return this.carrito.reduce(
      (total: number, producto: any) =>
        total + Number(producto.cantidadCarrito ?? 0),
      0
    );
  }

  // ==========================================
  // TOTAL DEL CARRITO
  // ==========================================

  obtenerTotalCarrito(): number {
    return this.carrito.reduce(
      (total: number, producto: any) =>
        total +
        Number(producto.precio ?? 0) *
        Number(producto.cantidadCarrito ?? 0),
      0
    );
  }

  // ==========================================
  // ABRIR CARRITO
  // ==========================================

  abrirCarrito() {
    this.router.navigate(['/carrito']);
  }

  // ==========================================
  // ABRIR MIS PEDIDOS
  // ==========================================

  abrirMisPedidos() {
    this.router.navigate(['/mis-pedidos']);
  }

  // ==========================================
  // CERRAR SESIÓN
  // ==========================================

  cerrarSesion() {
    this.cancelarEscuchaCatalogo?.();
    this.cancelarEscuchaCatalogo = null;

    localStorage.removeItem('sesion');
    localStorage.removeItem('usuario');
    localStorage.removeItem('carrito');

    this.carrito = [];
    this.nombreUsuario = 'Usuario';

    this.router.navigate(['/login']);
  }

  // ==========================================
  // MOSTRAR AVISOS
  // ==========================================

  async mostrarAviso(
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
}