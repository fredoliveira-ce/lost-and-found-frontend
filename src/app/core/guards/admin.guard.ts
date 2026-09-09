import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

/**
 * UI convenience only - hides/redirects non-admins from admin screens.
 * The backend's `role` claim check (403 on /api/admin/**) is the real
 * enforcement; this guard just avoids showing a screen that would fail.
 */
export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  if (auth.isAdmin()) {
    return true;
  }
  const router = inject(Router);
  return router.createUrlTree(['/browse']);
};
