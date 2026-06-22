import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FirebaseService } from '../../services/firebase.service';

@Component({
  selector: 'app-verificacion',
  templateUrl: './verificacion.page.html',
  styleUrls: ['./verificacion.page.scss'],
  standalone: false
})
export class VerificacionPage {

  id: string = '';
  producto: any;

  empaque = false;
  fecha = false;
  cantidad = false;
  golpeado = false;

  constructor(
    private route: ActivatedRoute,
    private firebaseService: FirebaseService,
    private router: Router
  ) {}

  async ionViewWillEnter() {

    this.id = this.route.snapshot.paramMap.get('id') || '';

    if (!this.id) return;

    this.producto =
      await this.firebaseService.obtenerProductoPorId(this.id);

  }

  // =====================================
  // ✅ ACEPTAR PRODUCTO
  // =====================================

  async aceptarProducto() {

    // ❌ No puede estar golpeado y aceptado a la vez
    if (
      this.empaque &&
      this.fecha &&
      this.cantidad &&
      this.golpeado
    ) {

      alert(
        'Un producto golpeado no puede ser aceptado. Desmarque "Golpeado" o rechace el producto.'
      );

      return;

    }

    // ❌ Golpeado = rechazo automático
    if (this.golpeado) {

      alert(
        'Producto rechazado automáticamente por estar golpeado.'
      );

      await this.rechazarProducto();

      return;

    }

    // ❌ Si falta alguna condición básica
    if (
      !this.empaque ||
      !this.fecha ||
      !this.cantidad
    ) {

      alert(
        'El producto no cumple los estándares de calidad.'
      );

      await this.rechazarProducto();

      return;

    }

    // ✅ Todo correcto
    await this.firebaseService.actualizarProducto(
      this.id,
      {
        estado: 'aceptado'
      }
    );

    this.router.navigate(['/tabs/historial']);

  }

  // =====================================
  // ❌ RECHAZAR PRODUCTO
  // =====================================

  async rechazarProducto() {

    await this.firebaseService.actualizarProducto(
      this.id,
      {
        estado: 'rechazado',
        motivo: {
          empaque: this.empaque,
          fecha: this.fecha,
          cantidad: this.cantidad,
          golpeado: this.golpeado
        }
      }
    );

    this.router.navigate(['/tabs/reclamos']);

  }

}