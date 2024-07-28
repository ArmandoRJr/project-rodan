import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-log-in',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './log-in.component.html',
  styleUrl: './log-in.component.css',
})
export class LogInComponent {
  error: string = ''; // string representing the error message
  loading: boolean;
  logInForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private router: Router
  ) {
    this.loading = false;
    this.logInForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
    });
  }

  ngAfterViewInit(): void {
    (window as any).loginCallback = this.loginCallback.bind(this);
    this.loadGoogleSignInScript();
  }

  loginCallback(response: any): void {
    this.loading = true;
    this.api.signByGoogle(response.credential).subscribe({
      next: (res) => {
        this.loading = false;
        localStorage.setItem('accessToken', String(res.token));
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error.error;
      },
    });
  }

  loadGoogleSignInScript(): void {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
  }

  logIn() {
    const username = this.logInForm.value.username;
    const password = this.logInForm.value.password;

    this.loading = true;
    this.api.signIn(username, password).subscribe({
      next: (res) => {
        this.loading = false;
        localStorage.setItem('accessToken', String(res.token));
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error.error;
      },
    });
  }

  goToSignUp() {
    this.router.navigate(['/signup']);
  }

  goToMainPage() {
    this.router.navigate(['/']);
  }
}
