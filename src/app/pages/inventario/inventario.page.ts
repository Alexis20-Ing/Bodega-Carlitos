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

  constructor(
    private firebaseService: FirebaseService
  ) {}

  async ionViewWillEnter() {

    this.productos =
      await this.firebaseService.obtenerProductos();

    this.productosFiltrados = [...this.productos];

  }

  filtrarProductos() {

    const texto = this.buscar.toLowerCase();

    this.productosFiltrados =
      this.productos.filter(p =>
        p.producto?.toLowerCase().includes(texto)
      );

  }
}