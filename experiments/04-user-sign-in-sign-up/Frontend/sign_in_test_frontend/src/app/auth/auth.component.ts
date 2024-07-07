import { Component, OnInit } from '@angular/core';
import { AuthService } from '../auth.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';


declare const gapi: any;

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.css'],
  imports: [FormsModule, CommonModule],
  standalone: true,
})
export class AuthComponent implements OnInit {
  loginUsername: string = '';
  loginPassword: string = '';
  signupUsername: string = '';
  signupPassword: string = '';
  showLogin = true;
  currentUser: any;

  constructor(private authService: AuthService) { }

  ngOnInit(): void {
    this.currentUser = this.authService.currentUserValue;
    this.initGoogleSignIn();
  }

  onLoginSubmit() {
    this.authService.signin(this.loginUsername, this.loginPassword).subscribe(user => {
      this.currentUser = user;
    });
  }

  onSignupSubmit() {
    this.authService.signup(this.signupUsername, this.signupPassword).subscribe(response => {
      console.log('User signed up', response);
      this.showLogin = true;
    });
  }

  googleLogin() {
    gapi.auth2.getAuthInstance().signIn().then((googleUser) => {
      const token = googleUser.getAuthResponse().id_token;
      this.authService.googleSignin(token).subscribe(user => {
        this.currentUser = user;
      });
    });
  }

  logout() {
    this.authService.logout();
    this.currentUser = null;
  }

  initGoogleSignIn() {
    gapi.load('auth2', () => {
      gapi.auth2.init({
        client_id: '886001870670-q7lmq8lscmlefrqev78rgrsu4u0fiksv.apps.googleusercontent.com'
      });
    });
  }
}