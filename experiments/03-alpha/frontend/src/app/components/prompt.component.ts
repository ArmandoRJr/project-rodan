
import { Component, OnInit } from '@angular/core';
import { SocketService } from '../services/socket.service';

@Component({
    selector: 'app-prompt',
    templateUrl: './prompt.component.html',
    styleUrls: ['./prompt.component.css']

})
export class promptComponent implements OnInit {
    prompt: string;

    constructor(private socketService: SocketService) { }

    ngOnInit(): void {
        this.socketService.onEvent('prompt').subscribe((data) => {
            this.prompt = data.prompt;
        });
    }
    
}