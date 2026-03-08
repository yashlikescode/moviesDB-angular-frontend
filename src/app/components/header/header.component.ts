import { AsyncPipe, NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router, RouterLink, RouterModule } from '@angular/router';
import { AuthService } from '../../auth.service';

@Component({
  selector: 'header',
  standalone: true,
  imports: [
    MatToolbarModule,
    MatButtonModule,
    RouterLink,
    RouterModule,
    AsyncPipe,
    NgIf,
  ],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent {
  readonly isLoggedIn$;

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {
    this.isLoggedIn$ = this.authService.isLoggedIn$;
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: () => {
        this.router.navigate(['/login']);
      },
    });
  }
}
