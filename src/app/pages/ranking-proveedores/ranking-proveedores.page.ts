import { Component } from '@angular/core';
import { FirebaseService } from '../../services/firebase.service';

@Component({
  selector: 'app-ranking-proveedores',
  templateUrl: './ranking-proveedores.page.html',
  styleUrls: ['./ranking-proveedores.page.scss'],
  standalone: false
})
export class RankingProveedoresPage {

  ranking: any[] = [];

  constructor(
    private firebaseService: FirebaseService
  ) {}

  async ionViewWillEnter() {

    const proveedores =
      await this.firebaseService.obtenerProveedores();

    const productos =
      await this.firebaseService.obtenerProductos();

    const lista = proveedores.map((p: any) => {

      const productosProveedor =
        productos.filter((prod: any) =>

          prod.proveedor?.toLowerCase().trim() ===
          p.nombre?.toLowerCase().trim()

        );

      const reclamos =
        productosProveedor.filter((prod: any) =>

          prod.estado === 'rechazado'

        );

      const total =
        productosProveedor.length;

      const confiabilidad =

        total == 0

        ? 100

        : Math.round(

            ((total - reclamos.length) / total)

            * 100

          );

      return {

        nombre: p.nombre,

        telefono: p.telefono,

        productos: total,

        reclamos: reclamos.length,

        confiabilidad

      };

    });

    lista.sort(

      (a, b) =>

      b.confiabilidad - a.confiabilidad

    );

    this.ranking = lista;

  }

}
