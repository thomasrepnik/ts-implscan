import { Routes } from '@angular/router';
import { HomeComponent } from './home.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'export', loadChildren: () => import('./export/export.routes').then((m) => m.exportRoutes) },
];
