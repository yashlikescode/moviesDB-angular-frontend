import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { CollectionsComponent } from './components/collections/collections.component';
import { MovieComponent } from './components/movie/movie.component';
import { authGuard, guestGuard } from './auth.guard';

export const routes: Routes = [
  { path: '', component: HomeComponent, canActivate: [authGuard] },
  {
    path: 'collections',
    component: CollectionsComponent,
    canActivate: [authGuard],
  },
  { path: 'login', component: LoginComponent, canActivate: [guestGuard] },
  { path: 'register', component: RegisterComponent, canActivate: [guestGuard] },
  { path: 'movie/:id', component: MovieComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: '' },
];
