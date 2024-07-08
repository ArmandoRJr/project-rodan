import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-main-page-test',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './main-page-test.component.html',
  styleUrl: './main-page-test.component.css',
})
export class MainPageTestComponent {
  constructor(private router: Router) {}

  goToSignUp() {
    this.router.navigate(['/signup']);
  }

  goToLogIn() {
    this.router.navigate(['/login']);
  }
}
