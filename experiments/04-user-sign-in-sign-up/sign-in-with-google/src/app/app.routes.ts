import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ErrorComponent } from './error/error.component';

export const routes: Routes = [{ path: 'login', component: LoginComponent },
    { path: 'dashboard', component: DashboardComponent },
    { path: 'error', component: ErrorComponent },
    { path: '', component: LoginComponent }];
