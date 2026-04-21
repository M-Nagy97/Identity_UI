import { Routes } from '@angular/router';

export const USERS_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'list' },
  {
    path: 'list',
    loadComponent: () =>
      import('./user-list.component').then((m) => m.UserListComponent),
  },
  {
    path: 'create',
    loadComponent: () =>
      import('./user-create.component').then((m) => m.UserCreateComponent),
  },
  {
    path: 'edit/:id',
    loadComponent: () =>
      import('./user-edit.component').then((m) => m.UserEditComponent),
  },
  {
    path: 'my-profile',
    loadComponent: () =>
      import('./my-profile.component').then((m) => m.MyProfileComponent),
  },
];
