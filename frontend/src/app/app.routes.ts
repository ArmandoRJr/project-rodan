import { Routes } from '@angular/router';
import { MainPageTestComponent } from './components/main-page-test/main-page-test.component';
import { SocketTestComponent } from './components/socket-test/socket-test.component';
import { GameTestComponent } from './components/game-test/game-test.component';

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
];
