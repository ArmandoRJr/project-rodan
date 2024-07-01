
import { Component, OnInit } from '@angular/core';
import { SocketService } from '../../services/socket.service';

//The prompt component for the game

@Component({
    selector: 'app-prompt',
    templateUrl: './prompt.component.html',
    styleUrls: ['./prompt.component.css']

})
export class PromptComponent implements OnInit {
    prompt: string;

    constructor(private socketService: SocketService) { }

    ngOnInit(): void {
        this.socketService.onEvent('prompt').subscribe((data) => {
            this.prompt = data.prompt;
        });
    }
    
}