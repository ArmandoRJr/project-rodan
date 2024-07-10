import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-main-page-test',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './main-page-test.component.html',
  styleUrl: './main-page-test.component.css',
})
export class MainPageTestComponent {
  checkingAuth: boolean;
  hasCredentials: boolean;

  constructor(private router: Router, private api: ApiService) {
    const token = localStorage.getItem('accessToken');
    this.hasCredentials = false;
    if (token === null || token === undefined) {
      this.checkingAuth = false;
    } else {
      this.checkingAuth = true;
      this.api.me().subscribe({
        next: (res) => {
          this.checkingAuth = false;
          this.hasCredentials = true;
        },
        error: (err) => {
          this.checkingAuth = false;
          this.hasCredentials = false;
        },
      });
    }
  }

  goToSignUp() {
    this.router.navigate(['/signup']);
  }

  goToLogIn() {
    this.router.navigate(['/login']);
  }

  goToDashboard() {
    this.router.navigate(['/dashboard']);
  }
}
