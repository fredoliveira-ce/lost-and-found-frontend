import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { NotificationService } from '../notifications/notification.service';

// Render's free tier spins the backend down after inactivity, so the first
// request after a while can take 30-50s instead of the usual instant reply.
// Rather than assume every slow request is a cold start, only surface the
// message once a request has actually been pending a while.
const WAKE_UP_THRESHOLD_MS = 4000;

export const wakeUpInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith('/api')) {
    return next(req);
  }

  const notifications = inject(NotificationService);
  let shown = false;

  const timer = setTimeout(() => {
    shown = true;
    notifications.showWakingUp();
  }, WAKE_UP_THRESHOLD_MS);

  return next(req).pipe(
    finalize(() => {
      clearTimeout(timer);
      if (shown) {
        notifications.dismissWakingUp();
      }
    }),
  );
};
