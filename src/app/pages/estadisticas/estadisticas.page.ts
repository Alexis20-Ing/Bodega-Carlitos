import { Component } from '@angular/core';
import { FirebaseService } from '../../services/firebase.service';

import {
  Chart,
  PieController,
  BarController,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
} from 'chart.js';

Chart.register(
  PieController,
  BarController,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
);

@Component({
  selector: 'app-estadisticas',
  templateUrl: './estadisticas.page.html',
  styleUrls: ['./estadisticas.page.scss'],
  standalone: false
})
export class EstadisticasPage {

  total = 0;

  aceptados = 0;

  pendientes = 0;

  rechazados = 0;

  proveedores = 0;

  graficoEstados: any;

  graficoProveedores: any;

  graficoCategorias: any;

  ranking: any[] = [];

  peorProveedor: any = null;

  constructor(
    private firebaseService: FirebaseService
  ) {}

  async ionViewWillEnter() {

    const productos =
      await this.firebaseService.obtenerProductos();

    this.total = productos.length;

    this.aceptados =
      productos.filter(
        (p:any)=>p.estado=="aceptado"
      ).length;

    this.pendientes =
      productos.filter(
        (p:any)=>p.estado=="pendiente"
      ).length;

    this.rechazados =
      productos.filter(
        (p:any)=>p.estado=="rechazado"
      ).length;

    const listaProveedores =
      [...new Set(
        productos.map(
          (p:any)=>p.proveedor
        )
      )];

    this.proveedores =
      listaProveedores.length;

    this.crearGraficoEstados();

    this.crearGraficoProveedores(
      productos,
      listaProveedores
    );

    this.crearGraficoCategorias(productos);

    this.calcularRanking(productos);

  }

  //==========================================
  // GRAFICO CIRCULAR
  //==========================================

  crearGraficoEstados() {

    if(this.graficoEstados){
      this.graficoEstados.destroy();
    }

    this.graficoEstados =
      new Chart(
        "graficoEstados",
        {
          type:"pie",

          data:{

            labels:[
              "Aceptados",
              "Pendientes",
              "Rechazados"
            ],

            datasets:[{

              data:[
                this.aceptados,
                this.pendientes,
                this.rechazados
              ],

              backgroundColor:[
                "#22c55e",
                "#f59e0b",
                "#ef4444"
              ],

              borderColor:"#ffffff",

              borderWidth:3

            }]

          },

          options:{

            responsive:true,

            plugins:{

              legend:{
                position:"bottom"
              }

            }

          }

        }

      );

  }

  //==========================================
  // GRAFICO CATEGORIAS
  //==========================================

  crearGraficoCategorias(productos: any[]) {

    if (this.graficoCategorias) {
      this.graficoCategorias.destroy();
    }

    const mapaCategorias: any = {};
    productos.forEach(p => {
      const cat = p.categoria || 'Sin categoría';
      mapaCategorias[cat] = (mapaCategorias[cat] || 0) + 1;
    });

    const labels = Object.keys(mapaCategorias);
    const data = Object.values(mapaCategorias);

    this.graficoCategorias = new Chart(
      "graficoCategorias",
      {
        type: "doughnut",
        data: {
          labels: labels,
          datasets: [{
            data: data,
            backgroundColor: [
              "#3b82f6", "#10b981", "#6366f1", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"
            ],
            borderColor: "#ffffff",
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { position: "bottom" }
          }
        }
      }
    );

  }

  //==========================================
  // GRAFICO BARRAS
  //==========================================

  crearGraficoProveedores(
    productos:any[],
    proveedores:any[]
  ){

    if(this.graficoProveedores){

      this.graficoProveedores.destroy();

    }

    const cantidades:number[]=[];

    proveedores.forEach(

      (prov:any)=>{

        cantidades.push(

          productos.filter(

            p=>p.proveedor==prov

          ).length

        );

      }

    );

    this.graficoProveedores =

      new Chart(

        "graficoProveedores",

        {

          type:"bar",

          data:{

            labels:proveedores,

            datasets:[{

              label:"Productos",

              data:cantidades,

              backgroundColor:[
                "#2563eb",
                "#3b82f6",
                "#60a5fa",
                "#93c5fd",
                "#1d4ed8",
                "#0ea5e9",
                "#38bdf8",
                "#7dd3fc"
              ],

              borderRadius:8

            }]

          },

          options:{

            responsive:true,

            plugins:{

              legend:{

                display:false

              }

            },

            scales:{

              y:{

                beginAtZero:true

              }

            }

          }

        }

      );

  }

  //==========================================
  // RANKING
  //==========================================

  calcularRanking(productos:any[]){

    const mapa:any={};

    productos.forEach(

      (p:any)=>{

        if(!mapa[p.proveedor]){

          mapa[p.proveedor]={

            nombre:p.proveedor,

            aceptados:0,

            rechazados:0,

            total:0,

            porcentaje:0

          };

        }

        mapa[p.proveedor].total++;

        if(p.estado=="aceptado"){

          mapa[p.proveedor].aceptados++;

        }

        if(p.estado=="rechazado"){

          mapa[p.proveedor].rechazados++;

        }

      }

    );

    this.ranking = Object.values(mapa);

    this.ranking.forEach(

      (p:any)=>{

        p.porcentaje = Math.round(

          (p.aceptados*100)/(p.total||1)

        );

      }

    );

    this.ranking.sort(

      (a:any,b:any)=>

        b.porcentaje-a.porcentaje

    );

    const peor = [...this.ranking]

      .sort(

        (a:any,b:any)=>

          b.rechazados-a.rechazados

      )[0];

    if(peor && peor.rechazados>0){

      this.peorProveedor = peor;

    }

    else{

      this.peorProveedor = null;

    }

  }

}
