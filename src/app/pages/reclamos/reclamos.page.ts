import { Component } from '@angular/core';
import { FirebaseService } from '../../services/firebase.service';

@Component({
  selector: 'app-reclamos',
  templateUrl: './reclamos.page.html',
  styleUrls: ['./reclamos.page.scss'],
  standalone: false
})
export class ReclamosPage {

  productos: any[] = [];

  constructor(
    private firebaseService: FirebaseService
  ) {}

  async ionViewWillEnter() {

    const todos: any[] =
      await this.firebaseService.obtenerProductos();

    // 🔥 SOLO RECHAZADOS
    this.productos = todos.filter(p =>
      p.estado === 'rechazado'
    );
  }

  async resolverReclamo(item: any) {

    await this.firebaseService.actualizarProducto(item.id, {
      estado: 'resuelto'
    });

    this.ionViewWillEnter();
  }
}