import { Component, HostListener, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';
import { CommonModule } from '@angular/common';
import { CountdownModule } from 'ngx-countdown';
import { ApiService } from '../../services/api.service';
import { User } from '../../classes/user';
import { WebcamImage, WebcamModule } from 'ngx-webcam';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-game-room',
  standalone: true,
  imports: [CommonModule, CountdownModule, WebcamModule],
  templateUrl: './game-room.component.html',
  styleUrl: './game-room.component.css',
})
export class GameRoomComponent {
  private socket: Socket;
  route: ActivatedRoute = inject(ActivatedRoute);
  self: User | undefined;

  roomId = -1;
  currentState = 0;
  room:
    | {
        id: string;
        players: { id: string; username: string }[];
        playersReady: boolean[];
        spectators: number[];
        environment: string;
        preferredRounds: number;
      }
    | undefined;
  match:
    | {
        state: 'countdown' | 'round';
        prompts: string[];
        promptsDone: string[];
        round: number;
        maxRound: number;
        startTime: number;
        endTime: number;
        scores: {
          [playerId: string]: number;
        };
        points: {
          [playerId: string]: number;
        };
        itemsInQueue: {
          [playerId: string]: number;
        };

        roundStats: {
          prompt: string;
          chosenObjects: string[];
          submittedPicture: {
            [playerId: string]: {
              //picture: File;
              score: number;
              bestObject: string;
              objects: string[];
            };
          };
        }[];
      }
    | undefined;

  webcamImage: WebcamImage | undefined;
  triggerObservable: Subject<void> = new Subject<void>();

  takePictureError: string;

  constructor(private router: Router, private api: ApiService) {
    this.roomId = this.route.snapshot.params['id'];
    this.takePictureError = '';
    const token = localStorage.getItem('accessToken');
    if (token === null || token === undefined) {
      this.router.navigate(['/']);
    } else {
      this.api.me().subscribe({
        next: (res) => {
          this.self = res;
        },
        error: (err) => {
          this.router.navigate(['/']);
        },
      });
    }

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
      if (res.error) {
        console.log(res.error);
        this.router.navigate(['/dashboard']);
      }
    });

    this.socket.on('receiveCurrentState', (res) => {
      console.log(res);
      if (res.room) {
        this.room = res.room;
      } else {
        this.router.navigate(['/dashboard']);
      }
      if (res.match) {
        this.match = res.match;
      } else {
        this.match = undefined;
      }

      if (this.room && !this.match) {
        this.currentState = 1;
      } else if (this.room && this.match && this.match.state === 'countdown') {
        this.currentState = 2;
      } else if (this.room && this.match && this.match.state === 'round') {
        this.currentState = 3;
      } else {
        this.currentState = 0;
      }

      if (this.currentState !== 3) {
        this.takePictureError = '';
      }
    });

    this.socket.on('takePictureError', (error: string) => {
      this.takePictureError = error;
    });
  }

  toggleReady() {
    this.socket.emit('toggleReady', this.roomId);
  }

  takePicture() {
    this.takePictureError = '';
    this.triggerObservable.next();
  }

  startGame() {
    this.socket.emit('startGame', this.roomId);
  }

  handleImageCapture(webcamImage: WebcamImage): void {
    this.socket.emit('takePicture', this.roomId, webcamImage.imageAsBase64);
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any): void {
    // Adjust dimensions on window resize
    this.calcCameraHeight();
    this.calcCameraWidth();
  }

  calcCameraHeight(): number {
    // Calculate camera height based on viewport height (adjust as needed)
    const scoreboardHeight = 200; // Example height of the scoreboard in pixels
    const minHeight = 400; // Minimum height for the camera (adjust as needed)
    const availableHeight = window.innerHeight - scoreboardHeight;
    return Math.max(minHeight, availableHeight * 0.6); // Adjust percentage as needed
  }

  calcCameraWidth(): number {
    // Calculate camera width based on viewport width (adjust as needed)
    const minWidth = 300; // Minimum width for the camera (adjust as needed)
    return Math.max(minWidth, window.innerWidth * 0.8); // Adjust percentage as needed
  }

  // Helpers
  checkBoolean(ready: boolean) {
    return ready;
  }

  checkSelfSubmitted() {
    return (
      this.self &&
      this.match &&
      this.self.id in this.match.roundStats[this.match.round].submittedPicture
    );
  }

  getPreviousRoundStats(playerId: string) {
    if (!this.match || !this.room) {
      return ``;
    }

    if (this.match.round <= 0) {
      return ``;
    }

    if (
      playerId in this.match.roundStats[this.match.round - 1].submittedPicture
    ) {
      const bestObject =
        this.match.roundStats[this.match.round - 1].submittedPicture[playerId]
          .bestObject;
      const score =
        this.match.roundStats[this.match.round - 1].submittedPicture[playerId]
          .score;
      return `Best object: ${bestObject}, score: ${score}`;
    } else {
      return `No submission last round :(`;
    }
  }

  checkPlayerSubmitted(playerId: number | string) {
    return (
      this.match &&
      playerId in this.match.roundStats[this.match.round].submittedPicture
    );
  }

  goToDashboard() {
    this.socket.disconnect();
    this.router.navigate(['/dashboard']);
  }

  logOut() {
    this.api.signOut().subscribe({
      next: (res) => {
        this.socket.disconnect();
        localStorage.removeItem('accessToken');
        this.router.navigate(['/']);
      },
      error: (err) => {},
    });
  }
}
