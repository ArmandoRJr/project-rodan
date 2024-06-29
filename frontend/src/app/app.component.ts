// src/app/app.component.ts
import { Component, OnInit } from "@angular/core";
import { io, Socket } from "socket.io-client";
import { environment } from "../environments/environment";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"],
})
export class AppComponent implements OnInit {
  private socket: Socket;
  message: string = "";
  messages: string[] = [];

  constructor() {
    this.socket = io(environment.apiEndpoint);
  }

  ngOnInit(): void {
    this.socket.on("message", (msg: string) => {
      this.messages.push(msg);
    });
  }

  sendMessage(): void {
    if (this.message.trim()) {
      this.socket.emit("message", this.message);
      this.message = "";
    }
  }
}
