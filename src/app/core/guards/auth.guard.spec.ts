import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, UrlTree } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
  let authService: { isAuthenticated: ReturnType<typeof vi.fn> };
  let router: Router;

  beforeEach(() => {
    authService = { isAuthenticated: vi.fn() };
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthService, useValue: authService }],
    });
    router = TestBed.inject(Router);
  });

  function runGuard(url: string) {
    return TestBed.runInInjectionContext(() =>
      authGuard(
        {} as never,
        { url } as never,
      ),
    );
  }

  it('allows activation when authenticated', () => {
    authService.isAuthenticated.mockReturnValue(true);
    expect(runGuard('/browse')).toBe(true);
  });

  it('redirects to /login with a returnUrl when not authenticated', () => {
    authService.isAuthenticated.mockReturnValue(false);
    const result = runGuard('/admin/import');

    expect(result).toBeInstanceOf(UrlTree);
    const tree = result as UrlTree;
    expect(tree.toString()).toContain('/login');
    expect(tree.queryParams['returnUrl']).toBe('/admin/import');
  });
});
