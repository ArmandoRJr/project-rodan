import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { io } from 'socket.io-client';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-game-test',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './game-test.component.html',
  styleUrl: './game-test.component.css',
})
export class GameTestComponent implements OnInit {
  private socket;
  roomData: any;
  roundData: any;
  scores: any = {};
  userId: string;
  isSpectator: boolean = false;
  isPlayer: boolean = false;

  imageForm = new FormGroup({
    image: new FormControl(''),
  });

  constructor() {
    this.socket = io(environment.apiEndpoint);
    this.userId = this.socket.id ?? '';
  }

  ngOnInit() {
    this.socket.on('playerJoined', (data) => {
      this.userId = data.playerId;
      this.isPlayer = true;
    });

    this.socket.on('spectatorJoined', (data) => {
      this.userId = data.spectatorId;
      this.isSpectator = true;
    });

    this.socket.on('roomData', (data) => {
      this.roomData = data;
    });

    this.socket.on('newRound', (data) => {
      this.roundData = data;
    });

    this.socket.on('score', (data) => {
      this.scores[data.userId] = this.scores[data.userId] || [];
      this.scores[data.userId].push(data.score);
    });

    this.socket.on('roundEnded', (scores) => {
      this.scores = scores;
    });

    this.socket.on('gameOver', (scores) => {
      this.scores = scores;
      alert('Game Over!');
    });

    this.socket.emit('joinRoom', 'someRoomId');
  }

  submitPicture(picture: Event) {
    const input = picture.target as HTMLInputElement;
    if (this.isPlayer) {
      if (input.files && input.files.length > 0) {
        const file = input.files[0];
        this.socket.emit('submitPicture', 'someRoomId', file);
      }
    } else {
      alert('Spectators cannot submit pictures.');
    }
  }
}
