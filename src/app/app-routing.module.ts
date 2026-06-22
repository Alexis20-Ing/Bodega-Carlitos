import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },

  {
    path: 'login',
    loadChildren: () => import('./tab1/tab1.module').then(m => m.Tab1PageModule)
  },

  {
    path: 'tabs',
    loadChildren: () => import('./tabs/tabs.module').then(m => m.TabsPageModule)
  },
  {
    path: 'nueva-recepcion',
    loadChildren: () => import('./pages/nueva-recepcion/nueva-recepcion.module').then( m => m.NuevaRecepcionPageModule)
  },
  {
    path: 'historial',
    loadChildren: () => import('./pages/historial/historial.module').then( m => m.HistorialPageModule)
  },
  {
    path: 'historial',
    loadChildren: () => import('./pages/historial/historial.module').then( m => m.HistorialPageModule)
  },
  {
    path: 'nueva-recepcion',
    loadChildren: () => import('./pages/nueva-recepcion/nueva-recepcion.module').then( m => m.NuevaRecepcionPageModule)
  },
  {
    path: 'historial',
    loadChildren: () => import('./pages/historial/historial.module').then( m => m.HistorialPageModule)
  },
  {
    path: 'nueva-recepcion',
    loadChildren: () => import('./pages/nueva-recepcion/nueva-recepcion.module').then( m => m.NuevaRecepcionPageModule)
  },
  {
    path: 'verificacion',
    loadChildren: () => import('./pages/verificacion/verificacion.module').then( m => m.VerificacionPageModule)
  },
  {
    path: 'reportes',
    loadChildren: () => import('./pages/reportes/reportes.module').then( m => m.ReportesPageModule)
  },
  {
    path: 'inventario',
    loadChildren: () => import('./pages/inventario/inventario.module').then( m => m.InventarioPageModule)
  },
  {
    path: 'reclamos',
    loadChildren: () => import('./pages/reclamos/reclamos.module').then( m => m.ReclamosPageModule)
  },
  {
    path: 'proveedores',
    loadChildren: () => import('./pages/proveedores/proveedores.module').then( m => m.ProveedoresPageModule)
  },
  {
    path: 'ranking-proveedores',
    loadChildren: () => import('./pages/ranking-proveedores/ranking-proveedores.module').then( m => m.RankingProveedoresPageModule)
  },
  {
    path: 'estadisticas',
    loadChildren: () => import('./pages/estadisticas/estadisticas.module').then( m => m.EstadisticasPageModule)
  },
  {
    path: 'reportes',
    loadChildren: () => import('./pages/reportes/reportes.module').then( m => m.ReportesPageModule)
  }
  
];
@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
