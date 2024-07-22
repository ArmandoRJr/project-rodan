import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Socket, io } from 'socket.io-client';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-socket-test',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './socket-test.component.html',
  styleUrl: './socket-test.component.css',
})
export class SocketTestComponent {
  private socket: Socket;
  messageForm = new FormGroup({
    message: new FormControl(''),
  });
  warning: string = '';
  messages: string[] = [];

  constructor() {
    this.socket = io(environment.apiEndpoint);
    this.socket.on('message', (msg: string) => {
      this.messages.push(msg);
    });
    this.socket.on('warning', (warning: string) => {
      this.warning = warning;
    });
  }

  sendMessage(): void {
    const message = this.messageForm.value.message ?? '';

    if (message.trim()) {
      this.socket.emit('message', message);
      this.messageForm.reset();
    }
  }
}