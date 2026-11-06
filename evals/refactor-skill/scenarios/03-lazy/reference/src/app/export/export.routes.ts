import { Routes } from '@angular/router';
import { provideImplscan } from '../generated/implscan-registry';
import { ExportPageComponent } from './export-page.component';

export const exportRoutes: Routes = [{ path: '', providers: [provideImplscan()], component: ExportPageComponent }];
