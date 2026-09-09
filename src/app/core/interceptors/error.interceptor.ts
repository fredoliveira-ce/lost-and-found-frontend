import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { ApiErrorResponse } from '../../shared/models/api-error.model';
import { AuthService } from '../auth/auth.service';
import { NotificationService } from '../notifications/notification.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith('/api')) {
    return next(req);
  }

  const notifications = inject(NotificationService);
  const auth = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        const message = extractMessage(error);
        notifications.showError(message);

        if (error.status === 401) {
          auth.logout();
          router.navigate(['/login']);
        }
      } else {
        notifications.showError('Something went wrong. Please try again.');
      }
      return throwError(() => error);
    }),
  );
};

function extractMessage(error: HttpErrorResponse): string {
  const body = error.error as ApiErrorResponse | null;
  if (body && typeof body.message === 'string') {
    return body.message;
  }
  if (error.status === 0) {
    return 'Could not reach the server. Is it running?';
  }
  return 'Something went wrong. Please try again.';
}
