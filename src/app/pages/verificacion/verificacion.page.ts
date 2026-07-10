import { Component, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FirebaseService } from '../../services/firebase.service';

@Component({
  selector: 'app-verificacion',
  templateUrl: './verificacion.page.html',
  styleUrls: ['./verificacion.page.scss'],
  standalone: false
})
export class VerificacionPage {

  @ViewChild('canvas', { static: false }) canvas!: ElementRef;
  private cx!: CanvasRenderingContext2D | null;
  private drawing = false;

  id: string = '';
  producto: any;

  empaque = false;
  fecha = false;
  cantidad = false;
  golpeado = false;

  cargando = false;
  firma: string = '';

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

    setTimeout(() => this.initCanvas(), 500);

  }

  initCanvas() {
    const el = this.canvas.nativeElement;
    this.cx = el.getContext('2d');

    el.width = el.offsetWidth;
    el.height = el.offsetHeight;

    if (this.cx) {
      this.cx.lineWidth = 3;
      this.cx.lineCap = 'round';
      this.cx.strokeStyle = '#1e3a8a';
    }
  }

  startDrawing(event: any) {
    this.drawing = true;
    this.draw(event);
  }

  stopDrawing() {
    this.drawing = false;
    if (this.cx) this.cx.beginPath();
    this.captureSignature();
  }

  draw(event: any) {
    if (!this.drawing || !this.cx) return;

    const el = this.canvas.nativeElement;
    const rect = el.getBoundingClientRect();

    const x = (event.touches ? event.touches[0].clientX : event.clientX) - rect.left;
    const y = (event.touches ? event.touches[0].clientY : event.clientY) - rect.top;

    this.cx.lineTo(x, y);
    this.cx.stroke();
    this.cx.beginPath();
    this.cx.moveTo(x, y);

    event.preventDefault();
  }

  clearCanvas() {
    if (this.cx) {
      this.cx.clearRect(0, 0, this.canvas.nativeElement.width, this.canvas.nativeElement.height);
      this.firma = '';
    }
  }

  captureSignature() {
    this.firma = this.canvas.nativeElement.toDataURL('image/png');
  }

  async aceptarProducto() {

    if (this.cargando) return;

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

    if (this.golpeado) {

      alert(
        'Producto rechazado automáticamente por estar golpeado.'
      );

      await this.rechazarProducto();

      return;

    }

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

    try {
      this.cargando = true;
      await this.firebaseService.actualizarProducto(
        this.id,
        {
          estado: 'aceptado',
          firma: this.firma
        }
      );

      this.router.navigate(['/tabs/historial']);
    } catch (error) {
      console.error(error);
      alert('Error al actualizar el estado.');
    } finally {
      this.cargando = false;
    }

  }

  async rechazarProducto() {

    if (this.cargando) return;

    try {
      this.cargando = true;
      await this.firebaseService.actualizarProducto(
        this.id,
        {
          estado: 'rechazado',
          firma: this.firma,
          motivo: {
            empaque: this.empaque,
            fecha: this.fecha,
            cantidad: this.cantidad,
            golpeado: this.golpeado
          }
        }
      );

      this.router.navigate(['/tabs/reclamos']);
    } catch (error) {
      console.error(error);
      alert('Error al registrar el rechazo.');
    } finally {
      this.cargando = false;
    }

  }

}
