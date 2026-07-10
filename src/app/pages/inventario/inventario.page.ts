import { Component } from '@angular/core';
import { FirebaseService } from '../../services/firebase.service';

@Component({
  selector: 'app-inventario',
  templateUrl: './inventario.page.html',
  styleUrls: ['./inventario.page.scss'],
  standalone: false
})
export class InventarioPage {

  productos: any[] = [];
  productosFiltrados: any[] = [];
  buscar = '';
  categoriaSeleccionada = 'Todas';
  categorias = ['Todas', 'Abarrotes', 'Bebidas', 'Limpieza', 'Lácteos', 'Embutidos', 'Snacks', 'Otros'];

  constructor(
    private firebaseService: FirebaseService
  ) {}

  async ionViewWillEnter() {

    this.productos =
      await this.firebaseService.obtenerProductos();

    this.productosFiltrados = [...this.productos];

  }

  filtrarProductos() {
    const texto = this.buscar.toLowerCase().trim();

    this.productosFiltrados = this.productos.filter(p => {
      const coincideNombre = p.producto?.toLowerCase().includes(texto);
      const coincideCategoria = this.categoriaSeleccionada === 'Todas' || p.categoria === this.categoriaSeleccionada;
      return coincideNombre && coincideCategoria;
    });
  }
}
