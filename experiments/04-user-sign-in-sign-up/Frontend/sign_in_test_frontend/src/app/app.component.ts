import { Component } from '@angular/core';
//import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { provideHttpClient } from '@angular/common/http';
//import { AppRoutingModule } from './app.routes';
import { AuthComponent } from './auth/auth.component';
import { CommonModule } from '@angular/common';



@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormsModule, AuthComponent, CommonModule],
  template: `
    <h1>Welcome to {{title}}!</h1>
    <app-auth><app-auth/>
    
  `,
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'sign_in_test_frontend';
}
