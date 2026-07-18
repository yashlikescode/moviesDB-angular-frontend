import { Component, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../auth.service';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent implements OnDestroy {
  username = '';
  otp = '';
  errorMessage = '';
  infoMessage = '';
  isSubmitting = false;
  otpSent = false;
  otpRemainingSeconds = 0;

  private readonly otpExpirySeconds = 180;
  private otpTimer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
  ) {
    this.route.queryParamMap.subscribe((params) => {
      const session = params.get('session');
      this.infoMessage =
        session === 'expired'
          ? 'Your session expired. Please login again.'
          : '';
    });
  }

  onSendOtp(): void {
    if (!this.username.trim()) {
      this.snackBar.open(
        'Please enter your username to receive an OTP.',
        'Close',
        {
          duration: 3000,
        },
      );
      return;
    }

    this.authService.sendOtp(this.username.trim(), 'username').subscribe({
      next: () => {
        this.snackBar.open('OTP sent successfully!', 'Close', {
          duration: 3000,
        });
        this.otpSent = true;
        this.startOtpCountdown();
      },
      error: () => {
        this.snackBar.open('Failed to send OTP. Please try again.', 'Close', {
          duration: 3000,
        });
      },
    });
  }

  onSubmit(): void {
    if (!this.username.trim() || !this.otp.trim()) {
      this.snackBar.open(
        'Please enter all required details to login.',
        'Close',
        {
          duration: 3000,
        },
      );
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.infoMessage = '';

    this.authService
      .login({
        username: this.username.trim(),
        otp: this.otp.trim(),
      })
      .subscribe({
        next: () => {
          const username = this.authService.getUsername() || this.username.trim();
          this.router.navigateByUrl(`/collections/${username}`);
        },
        error: (err) => {
          this.errorMessage =
            err?.error?.error || 'Unable to login. Please try again.';
          this.isSubmitting = false;
        },
        complete: () => {
          this.isSubmitting = false;
        },
      });
  }

  private startOtpCountdown(): void {
    this.clearOtpTimer();
    this.otpRemainingSeconds = this.otpExpirySeconds;
    this.otpTimer = setInterval(() => {
      this.otpRemainingSeconds -= 1;
      if (this.otpRemainingSeconds <= 0) {
        this.clearOtpTimer();
      }
    }, 1000);
  }

  private clearOtpTimer(): void {
    if (this.otpTimer) {
      clearInterval(this.otpTimer);
      this.otpTimer = null;
    }
  }

  get otpExpirationText(): string {
    const minutes = Math.floor(this.otpRemainingSeconds / 60);
    const seconds = this.otpRemainingSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}`;
  }

  ngOnDestroy(): void {
    this.clearOtpTimer();
  }
}
