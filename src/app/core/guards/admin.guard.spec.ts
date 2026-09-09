import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, UrlTree } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { adminGuard } from './admin.guard';

describe('adminGuard', () => {
  let authService: { isAdmin: ReturnType<typeof vi.fn> };
  let router: Router;

  beforeEach(() => {
    authService = { isAdmin: vi.fn() };
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthService, useValue: authService }],
    });
    router = TestBed.inject(Router);
  });

  function runGuard() {
    return TestBed.runInInjectionContext(() => adminGuard({} as never, {} as never));
  }

  it('allows activation for an admin', () => {
    authService.isAdmin.mockReturnValue(true);
    expect(runGuard()).toBe(true);
  });

  it('redirects to /browse for a non-admin', () => {
    authService.isAdmin.mockReturnValue(false);
    const result = runGuard();

    expect(result).toBeInstanceOf(UrlTree);
    expect((result as UrlTree).toString()).toBe('/browse');
  });
});
