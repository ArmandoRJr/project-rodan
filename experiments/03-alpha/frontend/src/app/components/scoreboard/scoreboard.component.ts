
import { Component, OnInit } from '@angular/core';
import { SocketService } from '../../services/socket.service';

//scoreboard component for the game
@Component({
    selector: 'app-scoreboard',
    templateUrl: "./scoreboard.component.html",
    styleUrls: ['./scoreboard.component.css']
})
export class ScoreboardComponent implements OnInit {
    scores: any = {};
    winner: string;

    constructor(private socketService: SocketService) { }

    ngOnInit(): void {
        this.socketService.onEvent('gameOver').subscribe((data) => {
            this.scores = data.scores;
            this.winner = data.winner;
        });
    }
}

