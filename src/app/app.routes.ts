import { Routes } from '@angular/router';
import { adminGuard } from './core/guards/admin.guard';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'browse' },
  {
    path: 'login',
    loadComponent: () => import('./features/login/login').then((m) => m.Login),
  },
  {
    path: 'browse',
    loadComponent: () => import('./features/browse/browse').then((m) => m.Browse),
    canActivate: [authGuard],
  },
  {
    path: 'admin/import',
    loadComponent: () => import('./features/admin/import/import').then((m) => m.Import),
    canActivate: [authGuard, adminGuard],
  },
  {
    path: 'admin/claims-report',
    loadComponent: () =>
      import('./features/admin/claims-report/claims-report').then((m) => m.ClaimsReport),
    canActivate: [authGuard, adminGuard],
  },
  { path: '**', redirectTo: 'browse' },
];
