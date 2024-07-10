import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';
import { CommonModule } from '@angular/common';
import { CountdownModule } from 'ngx-countdown';

@Component({
  selector: 'app-game-room',
  standalone: true,
  imports: [CommonModule, CountdownModule],
  templateUrl: './game-room.component.html',
  styleUrl: './game-room.component.css',
})
export class GameRoomComponent {
  private socket: Socket;
  route: ActivatedRoute = inject(ActivatedRoute);
  roomId = -1;
  currentState = 0;
  players: {
    id: string;
    username: string;
    ready: boolean;
    toggleable: boolean;
    score: number;
  }[];

  constructor(private router: Router) {
    this.roomId = this.route.snapshot.params['id'];
    this.players = [];
    const token = localStorage.getItem('accessToken');
    this.socket = io(environment.apiEndpoint, {
      auth: {
        token: `Bearer ${token}`,
      },
    });
    this.socket.on('connect_error', (err: any) => {
      this.router.navigate(['/']);
    });
    this.socket.on('connect_failed', (err: any) => {
      this.router.navigate(['/']);
    });

    this.socket.on('connect', () => {
      this.socket.emit('joinRoom', this.roomId, 'player');
    });

    this.socket.on('joinRoomRes', (res) => {
      if (res.room) {
        this.currentState = 1;
        this.players = res.room.players.map(
          (player: { id: string; username: string }) => {
            return { ...player, ready: false, toggleable: false, score: 0 };
          }
        );
      }
      console.log(`onJoin`, res);
    });

    this.socket.on('receiveCurrentState', (res) => {
      if (res.room) {
        this.currentState = 1;
        this.players = res.room.players.map(
          (player: { id: string; username: string }) => {
            return { ...player, ready: false, toggleable: false, score: 0 };
          }
        );
      }
      console.log(`currentState`, res);
    });
  }

  toggleReady(i: number) {}

  takePicture() {}
}
