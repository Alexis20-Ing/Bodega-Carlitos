import { Component } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { FirebaseService } from '../../services/firebase.service';
import { Camera, CameraResultType } from '@capacitor/camera';

@Component({
  selector: 'app-historial',
  templateUrl: './historial.page.html',
  styleUrls: ['./historial.page.scss'],
  standalone: false
})
export class HistorialPage {

  productos: any[] = [];
  productosFiltrados: any[] = [];
  buscar = '';
  editandoIndex: number | null = null;

  constructor(
    private firebaseService: FirebaseService,
    private alertController: AlertController
  ) {}

  async ionViewWillEnter() {
    await this.cargarProductos();
  }

  async cargarProductos() {
    const data = await this.firebaseService.obtenerProductos();
    this.productos = data;
    this.productosFiltrados = [...data];
  }

  async eliminar(item: any) {

    const alert = await this.alertController.create({
      header: 'Confirmar',
      message: '¿Deseas eliminar este producto?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          handler: async () => {
            await this.firebaseService.eliminarProducto(item.id);
            await this.cargarProductos();
          }
        }
      ]
    });

    await alert.present();
  }

  editar(index: number) {
    this.editandoIndex = index;
  }

  async guardarEdicion(index: number) {

    const item = this.productos[index];

    await this.firebaseService.actualizarProducto(item.id, {
      producto: item.producto,
      proveedor: item.proveedor,
      cantidad: item.cantidad,
      precio: item.precio,
      estado: item.estado,
      foto: item.foto
    });

    this.editandoIndex = null;
    await this.cargarProductos();
  }

  async actualizarFoto(item: any) {

    const image = await Camera.getPhoto({
      quality: 100,
      allowEditing: false,
      resultType: CameraResultType.Base64
    });

    item.foto = image.base64String
      ? `data:image/jpeg;base64,${image.base64String}`
      : '';
  }

  filtrarProductos() {
    const texto = this.buscar.toLowerCase();

    this.productosFiltrados = this.productos.filter(p =>
      p.producto?.toLowerCase().includes(texto)
    );
  }
}