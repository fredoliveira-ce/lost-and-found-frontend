import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
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

// Feedback shouldn't wait for a full failed attempt first - a single try can
// itself take a while against a cold backend. Give it a short head start,
// then say something even if nothing has actually failed yet.
const INITIAL_FEEDBACK_DELAY_MS = 1500;

// AccountSeeder runs as a startup task *after* the embedded server already
// accepts connections, so there's a brief window right after wake-up where
// login 401s because the seeded accounts don't exist yet - not because the
// password is wrong. A couple of quick, silent retries covers that window
// without masking a genuinely wrong password, which keeps failing the same
// way past it.
const LOGIN_URL = '/api/auth/login';
const LOGIN_RACE_RETRIES = 3;
const LOGIN_RACE_DELAY_MS = 800;

function isColdStartError(error: unknown): boolean {
  return error instanceof HttpErrorResponse && [0, 502, 503, 504].includes(error.status);
}

function isLoginSeedingRace(
  req: HttpRequest<unknown>,
  error: unknown,
  retryCount: number,
): boolean {
  return (
    req.url === LOGIN_URL &&
    retryCount <= LOGIN_RACE_RETRIES &&
    error instanceof HttpErrorResponse &&
    error.status === 401
  );
}

export const wakeUpInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith('/api')) {
    return next(req);
  }

  const notifications = inject(NotificationService);
  let retrying = false;

  const showWakingUp = (attempt: number) => {
    if (!retrying) {
      retrying = true;
      notifications.beginWakingUp();
    }
    notifications.updateWakingUp(attempt, MAX_RETRIES);
  };

  const initialTimer = setTimeout(() => showWakingUp(0), INITIAL_FEEDBACK_DELAY_MS);

  return next(req).pipe(
    retry({
      count: MAX_RETRIES,
      delay: (error, retryCount) => {
        clearTimeout(initialTimer);

        if (isLoginSeedingRace(req, error, retryCount)) {
          return timer(LOGIN_RACE_DELAY_MS);
        }
        if (!isColdStartError(error)) {
          throw error;
        }

        showWakingUp(retryCount);
        return timer(RETRY_DELAY_MS);
      },
    }),
    finalize(() => {
      clearTimeout(initialTimer);
      if (retrying) {
        notifications.endWakingUp();
      }
    }),
  );
};
