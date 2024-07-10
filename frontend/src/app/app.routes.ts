import { Routes } from '@angular/router';
import { MainPageTestComponent } from './components/main-page-test/main-page-test.component';
import { SocketTestComponent } from './components/socket-test/socket-test.component';
import { GameTestComponent } from './components/game-test/game-test.component';
import { SignUpComponent } from './components/sign-up/sign-up.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { LogInComponent } from './components/log-in/log-in.component';
import { GameRoomComponent } from './components/game-room/game-room.component';

export const routes: Routes = [
  {
    path: '',
    component: MainPageTestComponent,
    title: 'Home Page',
  },
  {
    path: 'socket-test',
    component: SocketTestComponent,
    title: 'Socket Test',
  },
  {
    path: 'game-test',
    component: GameTestComponent,
    title: 'Game Test',
  },
  {
    path: 'signup',
    component: SignUpComponent,
    title: 'Sign Up',
  },
  {
    path: 'login',
    component: LogInComponent,
    title: 'Log In',
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    title: 'Dashboard',
  },
  {
    path: 'room/:id',
    component: GameRoomComponent,
    title: 'Game Room',
  },
];
