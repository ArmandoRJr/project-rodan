import { Component } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';
import { Router } from '@angular/router';
import { Room } from '../../classes/room';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent {
  private socket: Socket;
  loading: boolean;
  rooms: Room[];

  constructor(private router: Router) {
    this.loading = true;
    this.rooms = [];
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
      this.socket.emit('getRooms');
    });

    this.socket.on('getRoomsRes', (res: { rooms: Room[] }) => {
      this.rooms = res.rooms;
      this.loading = false;
    });

    this.socket.on('createRoomRes', (res: { room: Room }) => {
      this.router.navigate([`/room/${res.room.id}`]);
    });
  }

  makeRoom() {
    this.socket.emit('createRoom', 'home', 10);
  }

  joinRoom(id: string) {
    this.router.navigate([`/room/${id}`]);
  }
}
