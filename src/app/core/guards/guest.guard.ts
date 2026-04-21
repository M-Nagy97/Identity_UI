import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthSessionService } from '../../features/auth/data/auth-session.service';

export const guestGuard: CanActivateFn = () => {
  const authSession = inject(AuthSessionService);
  const router = inject(Router);

  return authSession.isAuthenticated() ? router.parseUrl('/dashboard') : true;
};
