import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { NotificationService } from '../notifications/notification.service';
import { errorInterceptor } from './error.interceptor';

describe('errorInterceptor', () => {
  let httpClient: HttpClient;
  let httpMock: HttpTestingController;
  let notifications: { showError: ReturnType<typeof vi.fn> };
  let authService: { logout: ReturnType<typeof vi.fn> };
  let router: Router;

  beforeEach(() => {
    notifications = { showError: vi.fn() };
    authService = { logout: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: NotificationService, useValue: notifications },
        { provide: AuthService, useValue: authService },
      ],
    });
    httpClient = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('extracts ApiErrorResponse.message and shows it', () => {
    httpClient.get('/api/lost-items/999').subscribe({ error: () => {} });

    httpMock
      .expectOne('/api/lost-items/999')
      .flush(
        { type: 'NOT_FOUND', message: 'Lost item with id = 999 was not found.' },
        { status: 404, statusText: 'Not Found' },
      );

    expect(notifications.showError).toHaveBeenCalledWith(
      'Lost item with id = 999 was not found.',
    );
  });

  it('logs out and redirects to /login on a 401', () => {
    httpClient.get('/api/lost-items').subscribe({ error: () => {} });

    httpMock
      .expectOne('/api/lost-items')
      .flush(
        { type: 'UNAUTHORIZED', message: 'Missing or invalid authentication token.' },
        { status: 401, statusText: 'Unauthorized' },
      );

    expect(authService.logout).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('falls back to a generic message when the body is not an ApiErrorResponse', () => {
    httpClient.get('/api/lost-items').subscribe({ error: () => {} });

    httpMock.expectOne('/api/lost-items').error(new ProgressEvent('error'), { status: 0 });

    expect(notifications.showError).toHaveBeenCalledWith(
      'Could not reach the server. Is it running?',
    );
  });
});
