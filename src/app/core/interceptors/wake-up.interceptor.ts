import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize, retry, timer } from 'rxjs';
import { NotificationService } from '../notifications/notification.service';

// Render's free tier can take up to ~50s to cold-start, but the Netlify
// redirect proxying /api/* to it times out well before that - a request
// hitting a sleeping backend fails with a network error (status 0) or a
// gateway error (502/503/504) rather than ever reaching the app. Neither
// means the request itself is wrong, so it's retried rather than shown as
// an error - a real failure from the backend (e.g. 401 on bad credentials)
// always has its own status/body and is left alone.
const MAX_RETRIES = 15;
const RETRY_DELAY_MS = 3000;

function isColdStartError(error: unknown): boolean {
  return error instanceof HttpErrorResponse && [0, 502, 503, 504].includes(error.status);
}

export const wakeUpInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith('/api')) {
    return next(req);
  }

  const notifications = inject(NotificationService);
  let retrying = false;

  return next(req).pipe(
    retry({
      count: MAX_RETRIES,
      delay: (error, retryCount) => {
        if (!isColdStartError(error)) {
          throw error;
        }
        if (!retrying) {
          retrying = true;
          notifications.beginWakingUp();
        }
        notifications.updateWakingUp(retryCount, MAX_RETRIES);
        return timer(RETRY_DELAY_MS);
      },
    }),
    finalize(() => {
      if (retrying) {
        notifications.endWakingUp();
      }
    }),
  );
};
