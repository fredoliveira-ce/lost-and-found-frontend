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
  // can take up to a minute, longer than the Netlify proxy will wait on a
  // single attempt. beginWakingUp/endWakingUp bracket a request's whole
  // retry sequence (so several requests retrying at once still net out to
  // one message), while updateWakingUp refreshes the attempt counter shown.
  beginWakingUp(): void {
    this.wakingUpPending++;
  }

  updateWakingUp(attempt: number, maxAttempts: number): void {
    this.wakingUpRef?.dismiss();
    this.wakingUpRef = this.snackBar.open(
      `Waking up the server — this can take a minute (retry ${attempt}/${maxAttempts})...`,
      undefined,
      { panelClass: 'lf-snackbar-info' },
    );
  }

  endWakingUp(): void {
    this.wakingUpPending = Math.max(0, this.wakingUpPending - 1);
    if (this.wakingUpPending === 0 && this.wakingUpRef) {
      this.wakingUpRef.dismiss();
      this.wakingUpRef = null;
    }
  }
}
