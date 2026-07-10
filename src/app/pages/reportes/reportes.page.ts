import { Component } from '@angular/core';
import { FirebaseService } from '../../services/firebase.service';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';

@Component({
  selector: 'app-reportes',
  templateUrl: './reportes.page.html',
  styleUrls: ['./reportes.page.scss'],
  standalone: false
})
export class ReportesPage {

  productos: any[] = [];
  proveedores: any[] = [];

  proveedorSeleccionado = '';
  categoriaSeleccionada = '';
  fechaInicio: any = '';
  fechaFin: any = '';

  historial: any[] = [];
  categorias = ['Abarrotes', 'Bebidas', 'Limpieza', 'Lácteos', 'Embutidos', 'Snacks', 'Otros'];

  constructor(
    private firebaseService: FirebaseService
  ) {}

  async ionViewWillEnter() {
    this.productos = await this.firebaseService.obtenerProductos();
    this.proveedores = await this.firebaseService.obtenerProveedores();
  }

  generarPDF() {
    this.generarReporte("todos");
  }

  generarInventario() {
    this.generarReporte("inventario");
  }

  generarRechazados() {
    this.generarReporte("rechazados");
  }

  async generarReporte(tipo: string) {

    let lista = [...this.productos];

    if (this.proveedorSeleccionado) {
      lista = lista.filter(p => p.proveedor == this.proveedorSeleccionado);
    }

    if (this.categoriaSeleccionada) {
      lista = lista.filter(p => p.categoria == this.categoriaSeleccionada);
    }

    if (this.fechaInicio) {
      const inicio = new Date(this.fechaInicio);
      lista = lista.filter(p => {
        const f = p.fecha?.toDate ? p.fecha.toDate() : new Date(p.fecha);
        return f >= inicio;
      });
    }

    if (this.fechaFin) {
      const fin = new Date(this.fechaFin);
      fin.setHours(23, 59, 59, 999);

      lista = lista.filter(p => {
        const f = p.fecha?.toDate ? p.fecha.toDate() : new Date(p.fecha);
        return f <= fin;
      });
    }

    let titulo = '';

    if (tipo === 'inventario') {
      lista = lista.filter(p => p.estado === 'aceptado');
      titulo = 'REPORTE INVENTARIO ACTUAL';
    } else if (tipo === 'rechazados') {
      lista = lista.filter(p => p.estado === 'rechazado');
      titulo = 'REPORTE PRODUCTOS RECHAZADOS';
    } else {
      titulo = 'REPORTE GENERAL';
    }

    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('BODEGA CARLITOS', 14, 15);

    doc.setFontSize(14);
    doc.text(titulo, 14, 24);

    doc.setFontSize(11);
    doc.text('Fecha: ' + new Date().toLocaleString(), 14, 32);

    doc.text('Proveedor: ' + (this.proveedorSeleccionado || 'Todos'), 14, 39);
    doc.text('Categoría: ' + (this.categoriaSeleccionada || 'Todas'), 70, 39);
    doc.text('Total registros: ' + lista.length, 14, 46);

    const filas = lista.map(p => {
      const f = p.fecha?.toDate ? p.fecha.toDate() : new Date(p.fecha);

      return [
        p.proveedor,
        p.producto,
        p.cantidad,
        'S/ ' + Number(p.precio).toFixed(2),
        p.estado,
        f.toLocaleDateString(),
        p.firma ? 'Firmado' : 'Sin Firma'
      ];
    });

    autoTable(doc, {
      startY: 55,
      head: [['Proveedor', 'Producto', 'Cant.', 'Precio', 'Estado', 'Fecha', 'Firma']],
      body: filas
    });

    const fileName =
      tipo === 'inventario'
        ? 'Inventario.pdf'
        : tipo === 'rechazados'
          ? 'Rechazados.pdf'
          : 'Reporte.pdf';

    if (Capacitor.getPlatform() !== 'web') {

      const base64 = doc.output('datauristring').split(',')[1];

      const file = await Filesystem.writeFile({
        path: fileName,
        data: base64,
        directory: Directory.Documents
      });

      const fileUri = file.uri;

      this.historial.unshift({
        nombre: fileName,
        fecha: new Date().toLocaleString(),
        uri: fileUri
      });

      await Share.share({
        title: 'Reporte Bodega',
        text: 'Te comparto el PDF generado',
        url: fileUri,
        dialogTitle: 'Compartir PDF'
      });

      alert('PDF generado ✔');

      window.open(fileUri, '_system');

    }

    else {
      doc.save(fileName);
    }
  }

  verHistorial() {
    console.log('Historial:', this.historial);
  }
}
