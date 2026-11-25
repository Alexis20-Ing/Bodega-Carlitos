import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { FirebaseService } from '../../services/firebase.service';

@Component({
  selector: 'app-admin-pedidos',
  templateUrl: './admin-pedidos.page.html',
  styleUrls: ['./admin-pedidos.page.scss'],
  standalone: false,
})
export class AdminPedidosPage {

  pedidos: any[] = [];

  cargando: boolean = true;
  actualizandoEstado: boolean = false;

  // BÚSQUEDA Y FILTRO
  busqueda: string = '';
  filtroEstado: string = 'todos';

  // ESTADÍSTICAS GENERALES
  totalPedidos: number = 0;
  pedidosHoy: number = 0;
  productosAgotados: number = 0;

  // ESTADÍSTICAS POR ESTADO
  pendientes: number = 0;
  confirmados: number = 0;
  preparando: number = 0;
  listos: number = 0;
  entregados: number = 0;
  cancelados: number = 0;

  // VENTAS DE PEDIDOS ENTREGADOS
  ventasEntregadas: number = 0;

  constructor(
    private firebaseService: FirebaseService,
    private alertController: AlertController,
    private router: Router
  ) {}

  // CARGAR DATOS AL ENTRAR A LA PÁGINA
  async ionViewWillEnter() {
    await this.cargarPedidos();
  }

  // BÚSQUEDA Y FILTRO DE PEDIDOS
  get pedidosFiltrados(): any[] {
    const texto = this.busqueda.trim().toLowerCase();

    return this.pedidos.filter((pedido: any) => {

      const coincideEstado =
        this.filtroEstado === 'todos' ||
        pedido.estado === this.filtroEstado;

      const productos = Array.isArray(pedido.productos)
        ? pedido.productos
            .map((producto: any) => producto.producto ?? '')
            .join(' ')
        : '';

      const contenido = [
        pedido.id ?? '',
        pedido.usuario ?? '',
        pedido.nombre ?? '',
        productos
      ].join(' ').toLowerCase();

      const coincideBusqueda =
        contenido.includes(texto);

      return coincideEstado && coincideBusqueda;
    });
  }

  // CARGAR PEDIDOS Y PRODUCTOS DESDE FIREBASE
  async cargarPedidos() {
    this.cargando = true;

    try {

      // 1. CARGAR PEDIDOS
      const pedidos =
        await this.firebaseService.obtenerPedidos();

      this.pedidos = pedidos ?? [];

      // ORDENAR PEDIDOS DEL MÁS RECIENTE AL MÁS ANTIGUO
      this.pedidos.sort((a: any, b: any) => {

        const fechaA = a.fecha?.toDate
          ? a.fecha.toDate().getTime()
          : new Date(a.fecha).getTime();

        const fechaB = b.fecha?.toDate
          ? b.fecha.toDate().getTime()
          : new Date(b.fecha).getTime();

        const tiempoA =
          Number.isFinite(fechaA) ? fechaA : 0;

        const tiempoB =
          Number.isFinite(fechaB) ? fechaB : 0;

        return tiempoB - tiempoA;
      });

      // 2. ACTUALIZAR ESTADÍSTICAS DE PEDIDOS
      this.calcularEstadisticas();

      // 3. CARGAR PRODUCTOS Y CONTAR LOS AGOTADOS
      try {

        const productos =
          await this.firebaseService.obtenerProductos();

        this.productosAgotados =
          (productos ?? []).filter((producto: any) => {

            const cantidad =
              Number(producto.cantidad ?? 0);

            return cantidad <= 0;

          }).length;

      } catch (error) {

        console.error(
          'Error al cargar productos:',
          error
        );

      }

    } catch (error) {

      console.error(
        'Error al cargar pedidos:',
        error
      );

      const alert =
        await this.alertController.create({
          header: 'Error',
          message: 'No se pudieron cargar los pedidos.',
          buttons: ['OK']
        });

      await alert.present();

    } finally {

      this.cargando = false;

    }
  }

  // BOTÓN PARA ACTUALIZAR LAS ESTADÍSTICAS
  async refrescarPedidos() {
    if (this.cargando || this.actualizandoEstado) {
      return;
    }

    await this.cargarPedidos();
  }

  // CALCULAR ESTADÍSTICAS DE PEDIDOS
  calcularEstadisticas() {

    // TOTAL DE PEDIDOS
    this.totalPedidos = this.pedidos.length;

    // REINICIAR CONTADORES
    this.pendientes = 0;
    this.confirmados = 0;
    this.preparando = 0;
    this.listos = 0;
    this.entregados = 0;
    this.cancelados = 0;
    this.ventasEntregadas = 0;

    // CONTAR PEDIDOS DEL DÍA ACTUAL
    const ahora = new Date();

    this.pedidosHoy = this.pedidos.filter(
      (pedido: any) => {

        const fecha = pedido.fecha?.toDate
          ? pedido.fecha.toDate()
          : new Date(pedido.fecha);

        return (
          !isNaN(fecha.getTime()) &&
          fecha.getDate() === ahora.getDate() &&
          fecha.getMonth() === ahora.getMonth() &&
          fecha.getFullYear() === ahora.getFullYear()
        );

      }
    ).length;

    // CONTAR PEDIDOS SEGÚN SU ESTADO
    this.pedidos.forEach((pedido: any) => {

      switch (pedido.estado) {

        case 'pendiente':
          this.pendientes++;
          break;

        case 'confirmado':
          this.confirmados++;
          break;

        case 'preparando':
          this.preparando++;
          break;

        case 'listo':
          this.listos++;
          break;

        case 'entregado':
          this.entregados++;
          this.ventasEntregadas +=
            Number(pedido.total || 0);
          break;

        case 'cancelado':
          this.cancelados++;
          break;

      }

    });

  }

  // OBTENER LA CANTIDAD DE PRODUCTOS DE UN PEDIDO
  obtenerCantidadProductos(pedido: any): number {

    if (!Array.isArray(pedido.productos)) {
      return 0;
    }

    return pedido.productos.reduce(
      (total: number, producto: any) => {

        return total +
          Number(producto.cantidad || 0);

      },
      0
    );

  }

  // TEXTO DEL ESTADO
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

  // CLASE CSS SEGÚN EL ESTADO
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

  // CAMBIAR EL ESTADO DE UN PEDIDO
  async cambiarEstado(pedido: any) {

    if (this.actualizandoEstado) {
      return;
    }

    this.actualizandoEstado = true;

    try {

      console.log('ID del pedido:', pedido.id);
      console.log('Nuevo estado:', pedido.estado);

      await this.firebaseService.actualizarEstadoPedido(
        String(pedido.id),
        String(pedido.estado)
      );

      console.log(
        'Estado guardado correctamente en Firebase'
      );

      // ACTUALIZAR PEDIDOS Y ESTADÍSTICAS
      await this.cargarPedidos();

      const alert =
        await this.alertController.create({
          header: 'Estado actualizado',
          message:
            `El pedido ahora está en estado: ${this.obtenerTextoEstado(pedido.estado)}.`,
          buttons: ['OK']
        });

      await alert.present();

    } catch (error) {

      console.error(
        'ERROR AL ACTUALIZAR EL ESTADO:',
        error
      );

      await this.cargarPedidos();

      const alert =
        await this.alertController.create({
          header: 'Error',
          message:
            'No se pudo actualizar el estado del pedido. Revisa la conexión con Firebase.',
          buttons: ['OK']
        });

      await alert.present();

    } finally {

      this.actualizandoEstado = false;

    }

  }

  
  // IR A LA PÁGINA DE ADMINISTRACIÓN DE PRODUCTOS
  irAProductos() {
    this.router.navigate(['/productos']);
  }


  // CERRAR SESIÓN
  cerrarSesion() {

    localStorage.removeItem('sesion');
    localStorage.removeItem('usuario');
    localStorage.removeItem('carrito');

    this.router.navigate(['/login']);

  }

}
