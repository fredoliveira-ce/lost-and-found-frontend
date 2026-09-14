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

  it('shows feedback if a single attempt is just slow, before any failure', () => {
    httpClient.get('/api/lost-items').subscribe();
    const req = httpMock.expectOne('/api/lost-items');

    vi.advanceTimersByTime(1500);
    expect(notifications.updateWakingUp).toHaveBeenCalledWith(0, 15);

    req.flush({ ok: true });
    expect(notifications.endWakingUp).toHaveBeenCalledTimes(1);
  });

  it('does not show anything for a request that resolves before the initial delay', () => {
    httpClient.get('/api/lost-items').subscribe();
    httpMock.expectOne('/api/lost-items').flush({ ok: true });

    vi.advanceTimersByTime(1500);

    expect(notifications.beginWakingUp).not.toHaveBeenCalled();
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

  it('does not retry a real error from the backend, e.g. a 401 on a non-login request', () => {
    let error: unknown;
    httpClient.get('/api/lost-items').subscribe({ error: (e) => (error = e) });

    httpMock.expectOne('/api/lost-items').flush(
      { type: 'UNAUTHORIZED', message: 'Missing or invalid authentication token.' },
      { status: 401, statusText: 'Unauthorized' },
    );

    expect(error).toBeTruthy();
    expect(notifications.beginWakingUp).not.toHaveBeenCalled();
  });

  it('quietly retries a 401 on login a few times, for the account-seeding race on wake-up', () => {
    let result: unknown;
    httpClient.post('/api/auth/login', { username: 'admin', password: 'password123' }).subscribe(
      (res) => (result = res),
    );

    httpMock
      .expectOne('/api/auth/login')
      .flush({ message: 'Invalid credentials' }, { status: 401, statusText: 'Unauthorized' });
    vi.advanceTimersByTime(800);
    httpMock
      .expectOne('/api/auth/login')
      .flush({ message: 'Invalid credentials' }, { status: 401, statusText: 'Unauthorized' });
    vi.advanceTimersByTime(800);
    httpMock.expectOne('/api/auth/login').flush({ token: 'a-token' });

    expect(result).toEqual({ token: 'a-token' });
    // Quiet: this window is brief, so it isn't worth alarming the user with a message.
    expect(notifications.beginWakingUp).not.toHaveBeenCalled();
  });

  it('still surfaces a login 401 that persists past the seeding-race grace retries', () => {
    let error: unknown;
    httpClient.post('/api/auth/login', { username: 'admin', password: 'wrong' }).subscribe({
      error: (e) => (error = e),
    });

    for (let i = 0; i < 4; i++) {
      httpMock
        .expectOne('/api/auth/login')
        .flush({ message: 'Invalid credentials' }, { status: 401, statusText: 'Unauthorized' });
      vi.advanceTimersByTime(800);
    }

    expect(error).toBeTruthy();
    expect((error as { status: number }).status).toBe(401);
  });

  it('does not touch requests outside /api', () => {
    httpClient.get('/assets/logo.png').subscribe();
    httpMock.expectOne('/assets/logo.png').flush({});

    vi.advanceTimersByTime(1500);

    expect(notifications.beginWakingUp).not.toHaveBeenCalled();
  });
});
