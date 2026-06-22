import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { TabsPage } from './tabs.page';

const routes: Routes = [
  {
    path: '',
    component: TabsPage,
    children: [

      {
        path: 'tab2',
        loadChildren: () =>
          import('../tab2/tab2.module')
            .then(m => m.Tab2PageModule)
      },

      {
        path: 'nueva-recepcion',
        loadChildren: () =>
          import('../pages/nueva-recepcion/nueva-recepcion.module')
            .then(m => m.NuevaRecepcionPageModule)
      },

      {
        path: 'historial',
        loadChildren: () =>
          import('../pages/historial/historial.module')
            .then(m => m.HistorialPageModule)
      },

      {
        path: 'inventario',
        loadChildren: () =>
          import('../pages/inventario/inventario.module')
            .then(m => m.InventarioPageModule)
      },

      {
        path: 'proveedores',
        loadChildren: () =>
          import('../pages/proveedores/proveedores.module')
            .then(m => m.ProveedoresPageModule)
      },

      {
        path: 'reclamos',
        loadChildren: () =>
          import('../pages/reclamos/reclamos.module')
            .then(m => m.ReclamosPageModule)
      },

      {
        path: 'ranking-proveedores',
        loadChildren: () =>
          import('../pages/ranking-proveedores/ranking-proveedores.module')
            .then(m => m.RankingProveedoresPageModule)
      },

      {
        path: 'verificacion/:id',
        loadChildren: () =>
          import('../pages/verificacion/verificacion.module')
            .then(m => m.VerificacionPageModule)
      },

      {
        path: 'estadisticas',
        loadChildren: () =>
          import('../pages/estadisticas/estadisticas.module')
            .then(m => m.EstadisticasPageModule)
      },

      {
        path: 'reportes',
        loadChildren: () =>
          import('../pages/reportes/reportes.module')
            .then(m => m.ReportesPageModule)
      },

      {
        path: '',
        redirectTo: 'tab2',
        pathMatch: 'full'
      }

    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TabsPageRoutingModule {}