import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sign-up',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './sign-up.component.html',
  styleUrl: './sign-up.component.css',
})
export class SignUpComponent {
  error: string = ''; // string representing the error message
  loading: boolean;
  signUpForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private router: Router
  ) {
    this.loading = false;
    this.signUpForm = this.fb.group({
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

  signUp() {
    const username = this.signUpForm.value.username;
    const password = this.signUpForm.value.password;

    this.loading = true;
    this.api.signUp(username, password).subscribe({
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

  goToLogin() {
    this.router.navigate(['/login']);
  }

  goToMainPage() {
    this.router.navigate(['/']);
  }
}
