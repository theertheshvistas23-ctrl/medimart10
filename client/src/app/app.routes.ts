import { Routes } from '@angular/router';

export const routes: Routes = [

  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },

  {
    path: 'login',
    loadComponent: () =>
      import('./components/login/login')
      .then(m => m.LoginComponent)
  },

  {
    path: 'register',
    loadComponent: () =>
      import('./components/register/register')
      .then(m => m.RegisterComponent)
  },

  {
    path: 'admin',
    loadComponent: () =>
      import('./components/admin-dashboard/admin-dashboard')
      .then(m => m.AdminDashboardComponent)
  },

  {
    path: 'cashier',
    loadComponent: () =>
      import('./components/cashier-dashboard/cashier-dashboard')
      .then(m => m.CashierDashboardComponent)
  },

  {
    path: 'customer',
    loadComponent: () =>
      import('./components/customer-dashboard/customer-dashboard')
      .then(m => m.CustomerDashboardComponent)
  },

  {
    path: 'medicine-management',
    loadComponent: () =>
      import('./components/medicine-management/medicine-management')
      .then(m => m.MedicineManagementComponent)
  },

  {
    path: '**',
    redirectTo: 'login'
  }

];