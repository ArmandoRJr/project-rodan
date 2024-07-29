import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { User } from '../../classes/user';
import { CommonModule } from '@angular/common';
import { ProfileInfo } from '../../classes/profileInfo';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
})
export class ProfileComponent {
  checkingAuth: boolean;
  checkingMatchData: boolean;
  self: User | undefined;
  profileInfo: ProfileInfo | undefined;

  constructor(private router: Router, private api: ApiService) {
    const token = localStorage.getItem('accessToken');
    if (token === null || token === undefined) {
      this.checkingAuth = false;
      this.checkingMatchData = false;
      this.goToMainPage();
    } else {
      this.checkingAuth = true;
      this.checkingMatchData = true;
      this.api.me().subscribe({
        next: (res) => {
          this.checkingAuth = false;
          this.self = res;
          this.api.profileInfo().subscribe({
            next: (res) => {
              this.checkingMatchData = false;
              this.profileInfo = res;
            },
            error: (err) => {},
          });
        },
        error: (err) => {
          this.checkingAuth = false;
          this.goToMainPage();
        },
      });
    }
  }

  goToMainPage() {
    this.router.navigate(['/']);
  }
}
