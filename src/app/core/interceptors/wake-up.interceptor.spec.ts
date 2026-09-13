import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { NotificationService } from '../notifications/notification.service';
import { wakeUpInterceptor } from './wake-up.interceptor';

describe('wakeUpInterceptor', () => {
  let httpClient: HttpClient;
  let httpMock: HttpTestingController;
  let notifications: {
    showWakingUp: ReturnType<typeof vi.fn>;
    dismissWakingUp: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.useFakeTimers();
    notifications = { showWakingUp: vi.fn(), dismissWakingUp: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([wakeUpInterceptor])),
        provideHttpClientTesting(),
        { provide: NotificationService, useValue: notifications },
      ],
    });
    httpClient = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    vi.useRealTimers();
  });

  it('shows a waking-up message once a request has been pending past the threshold', () => {
    httpClient.get('/api/lost-items').subscribe();
    const req = httpMock.expectOne('/api/lost-items');

    vi.advanceTimersByTime(4000);
    expect(notifications.showWakingUp).toHaveBeenCalledTimes(1);

    req.flush({});
    expect(notifications.dismissWakingUp).toHaveBeenCalledTimes(1);
  });

  it('does not show anything for requests that resolve before the threshold', () => {
    httpClient.get('/api/lost-items').subscribe();
    httpMock.expectOne('/api/lost-items').flush({});

    vi.advanceTimersByTime(4000);

    expect(notifications.showWakingUp).not.toHaveBeenCalled();
    expect(notifications.dismissWakingUp).not.toHaveBeenCalled();
  });

  it('does not touch requests outside /api', () => {
    httpClient.get('/assets/logo.png').subscribe();
    httpMock.expectOne('/assets/logo.png').flush({});

    vi.advanceTimersByTime(4000);

    expect(notifications.showWakingUp).not.toHaveBeenCalled();
  });
});
