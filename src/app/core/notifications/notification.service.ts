import { Injectable, inject } from '@angular/core';
import { MatSnackBar, MatSnackBarRef } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly snackBar = inject(MatSnackBar);

  private wakingUpRef: MatSnackBarRef<unknown> | null = null;
  private wakingUpPending = 0;

  showError(message: string): void {
    this.snackBar.open(message, 'Dismiss', {
      duration: 6000,
      panelClass: 'lf-snackbar-error',
    });
  }

  showSuccess(message: string): void {
    this.snackBar.open(message, undefined, {
      duration: 3000,
      panelClass: 'lf-snackbar-success',
    });
  }

  // Render's free tier spins the backend down after inactivity; a cold start
  // can take up to a minute. Requests are counted rather than shown per-call,
  // so several slow requests in flight at once still only show one message.
  showWakingUp(): void {
    this.wakingUpPending++;
    if (!this.wakingUpRef) {
      this.wakingUpRef = this.snackBar.open(
        "Waking up the server — this can take up to a minute on the first request.",
        undefined,
        { panelClass: 'lf-snackbar-info' },
      );
    }
  }

  dismissWakingUp(): void {
    this.wakingUpPending = Math.max(0, this.wakingUpPending - 1);
    if (this.wakingUpPending === 0 && this.wakingUpRef) {
      this.wakingUpRef.dismiss();
      this.wakingUpRef = null;
    }
  }
}
