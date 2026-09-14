import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { NotificationService } from '../notifications/notification.service';
import { wakeUpInterceptor } from './wake-up.interceptor';

describe('wakeUpInterceptor', () => {
  let httpClient: HttpClient;
  let httpMock: HttpTestingController;
  let notifications: {
    beginWakingUp: ReturnType<typeof vi.fn>;
    updateWakingUp: ReturnType<typeof vi.fn>;
    endWakingUp: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.useFakeTimers();
    notifications = {
      beginWakingUp: vi.fn(),
      updateWakingUp: vi.fn(),
      endWakingUp: vi.fn(),
    };

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

  it('retries a network error (status 0) without surfacing it as an error', () => {
    let result: unknown;
    httpClient.get('/api/lost-items').subscribe((res) => (result = res));

    httpMock.expectOne('/api/lost-items').error(new ProgressEvent('error'), { status: 0 });
    expect(notifications.beginWakingUp).toHaveBeenCalledTimes(1);
    expect(notifications.updateWakingUp).toHaveBeenCalledWith(1, 15);

    vi.advanceTimersByTime(3000);
    httpMock.expectOne('/api/lost-items').flush({ ok: true });

    expect(result).toEqual({ ok: true });
    expect(notifications.endWakingUp).toHaveBeenCalledTimes(1);
  });

  it('retries a gateway timeout (502/503/504)', () => {
    httpClient.get('/api/lost-items').subscribe();

    httpMock
      .expectOne('/api/lost-items')
      .flush(null, { status: 503, statusText: 'Service Unavailable' });
    expect(notifications.updateWakingUp).toHaveBeenCalledWith(1, 15);

    vi.advanceTimersByTime(3000);
    httpMock.expectOne('/api/lost-items').flush({ ok: true });

    expect(notifications.endWakingUp).toHaveBeenCalledTimes(1);
  });

  it('does not retry a real error from the backend, e.g. a 401 with a body', () => {
    let error: unknown;
    httpClient.get('/api/lost-items').subscribe({ error: (e) => (error = e) });

    httpMock.expectOne('/api/lost-items').flush(
      { type: 'UNAUTHORIZED', message: 'Missing or invalid authentication token.' },
      { status: 401, statusText: 'Unauthorized' },
    );

    expect(error).toBeTruthy();
    expect(notifications.beginWakingUp).not.toHaveBeenCalled();
    expect(notifications.updateWakingUp).not.toHaveBeenCalled();
  });

  it('does not touch requests outside /api', () => {
    httpClient.get('/assets/logo.png').subscribe();
    httpMock.expectOne('/assets/logo.png').flush({});

    expect(notifications.beginWakingUp).not.toHaveBeenCalled();
  });
});
