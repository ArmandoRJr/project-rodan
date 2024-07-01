import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';

//This is the service that manages the websocket conncection
@Injectable({
    providedIn: 'root'
})
export class SocketService {
    private socket: Socket;
    private readonly url: string = 'http://localhost:4200';

    constructor(){
        this.socket = io(this.url);
    }

    onEvent(event: string): Observable<any> {
        return new Observable<any>(observer => {
            this.socket.on(event, (data) =>observer.next(data));
        });
    }

    sendEvent(event: string, data?: any){
        this.socket.emit(event, data);
    }
}

