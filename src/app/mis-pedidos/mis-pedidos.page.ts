import { Component, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { FirebaseService } from '../services/firebase.service';

@Component({
  selector: 'app-mis-pedidos',
  templateUrl: './mis-pedidos.page.html',
  styleUrls: ['./mis-pedidos.page.scss'],
  standalone: false,
})
export class MisPedidosPage implements OnDestroy {

  pedidos: any[] = [];
  cargando: boolean = true;

  // Permite detener la escucha de Firebase.
  private cancelarEscucha: (() => void) | null = null;

  // Evita alertas por los pedidos que se cargan inicialmente.
  private primeraCarga: boolean = true;

  // Guarda el último estado conocido de cada pedido.
  private estadosAnteriores: Map<string, string> = new Map();

  // Control de las alertas de actualización.
  private mostrandoAlerta: boolean = false;
  private avisosPendientes: string[] = [];

  constructor(
    private router: Router,
    private alertController: AlertController,
    private firebaseService: FirebaseService
  ) {}

  // ==========================================
  // ENTRAR A LA PÁGINA
  // ==========================================

  async ionViewWillEnter() {
    const sesion = localStorage.getItem('sesion');

    if (!sesion) {
      await this.mostrarAlerta(
        'Acceso denegado',
        'No has iniciado sesión. Inicia sesión para consultar tus pedidos.'
      );

      this.router.navigate(['/login']);
      return;
    }

    // Validar que la sesión contenga información legible.
    let sesionData: any;

    try {
      sesionData = JSON.parse(sesion);
    } catch (error) {
      console.error('Error al leer la sesión:', error);

      localStorage.removeItem('sesion');

      await this.mostrarAlerta(
        'Sesión no válida',
        'Inicia sesión nuevamente para consultar tus pedidos.'
      );

      this.router.navigate(['/login']);
      return;
    }

    if (!sesionData) {
      this.router.navigate(['/login']);
      return;
    }

    // Reiniciar el control de cambios al entrar.
    this.primeraCarga = true;
    this.estadosAnteriores.clear();
    this.avisosPendientes = [];

    // Evitar escuchas duplicadas.
    this.detenerEscucha();

    await this.cargarPedidos();

    // Activar la actualización en tiempo real.
    this.iniciarEscuchaPedidos();
  }

  // ==========================================
  // OBTENER DATOS DE LA SESIÓN
  // ==========================================

  private obtenerDatosSesion(): any | null {
    const sesion = localStorage.getItem('sesion');

    if (!sesion) {
      return null;
    }

    try {
      return JSON.parse(sesion);
    } catch (error) {
      console.error('Error al leer la sesión:', error);
      return null;
    }
  }

  // ==========================================
  // IDENTIFICAR LOS PEDIDOS DEL CLIENTE
  // ==========================================

  private esPedidoDelUsuario(
    pedido: any,
    sesionData: any
  ): boolean {

    const usuarioId = sesionData?.id;
    const usuarioPedidoId = pedido?.usuarioId;

    // Si ambos tienen ID, comparar los identificadores.
    if (
      usuarioId !== null &&
      usuarioId !== undefined &&
      usuarioPedidoId !== null &&
      usuarioPedidoId !== undefined
    ) {
      return String(usuarioPedidoId) === String(usuarioId);
    }

    // Compatibilidad con pedidos antiguos sin usuarioId.
    const usuario =
      sesionData?.usuario ??
      sesionData?.nombre ??
      null;

    if (usuario && pedido?.usuario) {
      return String(pedido.usuario).trim().toLowerCase() ===
        String(usuario).trim().toLowerCase();
    }

    return false;
  }

  // ==========================================
  // CARGAR PEDIDOS DESDE FIREBASE
  // ==========================================

  async cargarPedidos() {
    this.cargando = true;

    try {
      const sesionData = this.obtenerDatosSesion();

      if (!sesionData) {
        this.pedidos = [];
        return;
      }

      // Los pedidos se guardan en la colección "pedidos".
      const todosLosPedidos =
        await this.firebaseService.obtenerPedidos();

      this.pedidos = todosLosPedidos
        .filter((pedido: any) =>
          this.esPedidoDelUsuario(pedido, sesionData)
        )
        .map((pedido: any) => this.normalizarPedido(pedido));

      this.ordenarPedidos();

    } catch (error) {
      console.error('Error al cargar pedidos:', error);

      await this.mostrarAlerta(
        'Error',
        'No se pudieron cargar tus pedidos. Comprueba tu conexión e inténtalo nuevamente.'
      );

    } finally {
      this.cargando = false;
    }
  }

  // ==========================================
  // NORMALIZAR LOS DATOS DEL PEDIDO
  // ==========================================

  private normalizarPedido(pedido: any): any {
    return {
      ...pedido,

      // Asegurar que siempre exista una lista de productos.
      productos: Array.isArray(pedido.productos)
        ? pedido.productos.map((producto: any) => ({
            ...producto,

            producto:
              producto.nombre ??
              producto.producto ??
              'Producto',

            nombre:
              producto.nombre ??
              producto.producto ??
              'Producto',

            categoria: producto.categoria ?? 'General',

            precio: Number(producto.precio ?? 0),

            cantidad: Number(producto.cantidad ?? 0),

            subtotal: Number(
              producto.subtotal ??
              (
                Number(producto.precio ?? 0) *
                Number(producto.cantidad ?? 0)
              )
            ),

            // Compatibilidad con las dos propiedades de imagen.
            imagen: producto.imagen ?? producto.foto ?? '',
            foto: producto.imagen ?? producto.foto ?? ''
          }))
        : [],

      total: Number(pedido.total ?? 0),

      estado: pedido.estado ?? 'pendiente'
    };
  }

  // ==========================================
  // ESCUCHAR CAMBIOS EN TIEMPO REAL
  // ==========================================

  iniciarEscuchaPedidos() {
    const sesionData = this.obtenerDatosSesion();

    if (!sesionData) {
      return;
    }

    try {
      this.cancelarEscucha =
        this.firebaseService.escucharPedidos(

          (todosLosPedidos: any[]) => {

            // Mostrar únicamente los pedidos del cliente actual.
            const pedidosUsuario = todosLosPedidos
              .filter((pedido: any) =>
                this.esPedidoDelUsuario(pedido, sesionData)
              )
              .map((pedido: any) => this.normalizarPedido(pedido));

            // Primera carga: guardar estados sin mostrar alertas.
            if (this.primeraCarga) {

              pedidosUsuario.forEach((pedido: any) => {
                this.estadosAnteriores.set(
                  String(pedido.id),
                  pedido.estado ?? 'pendiente'
                );
              });

              this.primeraCarga = false;

            } else {

              // Detectar cambios de estado en pedidos existentes.
              pedidosUsuario.forEach((pedido: any) => {
                const id = String(pedido.id);

                const estadoNuevo =
                  pedido.estado ?? 'pendiente';

                const estadoAnterior =
                  this.estadosAnteriores.get(id);

                if (
                  estadoAnterior !== undefined &&
                  estadoAnterior !== estadoNuevo
                ) {
                  this.avisosPendientes.push(
                    `Tu pedido #${id.slice(0, 8)} ahora está: ${this.obtenerTextoEstado(estadoNuevo)}.`
                  );
                }

                this.estadosAnteriores.set(id, estadoNuevo);
              });

              this.mostrarSiguienteAviso();
            }

            this.pedidos = pedidosUsuario;
            this.ordenarPedidos();
            this.cargando = false;
          },

          (error: any) => {
            console.error(
              'No se pudo actualizar la lista en tiempo real:',
              error
            );
          }
        );

    } catch (error) {
      console.error('Error al iniciar la escucha de pedidos:', error);
    }
  }

  // ==========================================
  // ORDENAR DEL MÁS RECIENTE AL MÁS ANTIGUO
  // ==========================================

  ordenarPedidos() {
    this.pedidos.sort((a: any, b: any) => {
      const tiempoA = this.obtenerTiempoFecha(a.fecha);
      const tiempoB = this.obtenerTiempoFecha(b.fecha);

      return tiempoB - tiempoA;
    });
  }

  // ==========================================
  // CONVERTIR FECHAS DE FIREBASE
  // ==========================================

  private obtenerTiempoFecha(fecha: any): number {
    let fechaConvertida: Date;

    if (fecha?.toDate && typeof fecha.toDate === 'function') {
      fechaConvertida = fecha.toDate();
    } else if (fecha instanceof Date) {
      fechaConvertida = fecha;
    } else {
      fechaConvertida = new Date(fecha);
    }

    const tiempo = fechaConvertida.getTime();

    return Number.isFinite(tiempo) ? tiempo : 0;
  }

  // ==========================================
  // MOSTRAR ALERTAS DE CAMBIO DE ESTADO
  // ==========================================

  async mostrarSiguienteAviso() {
    if (
      this.mostrandoAlerta ||
      this.avisosPendientes.length === 0
    ) {
      return;
    }

    this.mostrandoAlerta = true;

    const mensaje = this.avisosPendientes.shift();

    try {
      const alert = await this.alertController.create({
        header: '¡Actualización de tu pedido!',
        message: mensaje,
        buttons: ['Entendido'],
        backdropDismiss: false
      });

      alert.onDidDismiss().then(() => {
        this.mostrandoAlerta = false;
        this.mostrarSiguienteAviso();
      });

      await alert.present();

    } catch (error) {
      console.error('Error al mostrar el aviso:', error);
      this.mostrandoAlerta = false;
    }
  }

  // ==========================================
  // DETENER ESCUCHA DE FIREBASE
  // ==========================================

  detenerEscucha() {
    if (this.cancelarEscucha) {
      this.cancelarEscucha();
      this.cancelarEscucha = null;
    }
  }

  // ==========================================
  // LIMPIAR AL DESTRUIR EL COMPONENTE
  // ==========================================

  ngOnDestroy() {
    this.detenerEscucha();
  }

  // ==========================================
  // CONTAR UNIDADES DEL PEDIDO
  // ==========================================

  obtenerCantidadProductos(pedido: any): number {
    if (!Array.isArray(pedido.productos)) {
      return 0;
    }

    return pedido.productos.reduce(
      (total: number, producto: any) =>
        total + Number(producto.cantidad ?? 0),
      0
    );
  }

  // ==========================================
  // TEXTO DEL ESTADO
  // ==========================================

  obtenerTextoEstado(estado: string): string {
    switch (estado) {
      case 'pendiente':
        return 'Pendiente';

      case 'confirmado':
        return 'Confirmado';

      case 'preparando':
        return 'Preparando';

      case 'listo':
        return 'Listo para recoger';

      case 'entregado':
        return 'Entregado';

      case 'cancelado':
        return 'Cancelado';

      default:
        return estado || 'Pendiente';
    }
  }

  // ==========================================
  // CLASE CSS DEL ESTADO
  // ==========================================

  obtenerClaseEstado(estado: string): string {
    switch (estado) {
      case 'pendiente':
        return 'estado-pendiente';

      case 'confirmado':
        return 'estado-confirmado';

      case 'preparando':
        return 'estado-preparando';

      case 'listo':
        return 'estado-listo';

      case 'entregado':
        return 'estado-entregado';

      case 'cancelado':
        return 'estado-cancelado';

      default:
        return 'estado-pendiente';
    }
  }

  // ==========================================
  // MOSTRAR ALERTA GENERAL
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
  // VOLVER A LA TIENDA
  // ==========================================

  volver() {
    this.detenerEscucha();
    this.router.navigate(['/tabs/tab2']);
  }
}
