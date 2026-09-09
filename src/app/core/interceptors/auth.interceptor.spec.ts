import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AuthService } from '../auth/auth.service';
import { authInterceptor } from './auth.interceptor';

function makeToken(payload: unknown): string {
  const base64url = (obj: unknown) =>
    btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${base64url({ alg: 'RS256' })}.${base64url(payload)}.signature`;
}

const validToken = makeToken({
  sub: 'alice',
  role: 'USER',
  uid: '1001',
  iat: 1,
  exp: Math.floor(Date.now() / 1000) + 3600,
});

describe('authInterceptor', () => {
  let httpClient: HttpClient;
  let httpMock: HttpTestingController;
  let authService: AuthService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    httpClient = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(AuthService);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('attaches the Authorization header to /api requests when a token is present', () => {
    authService.login({ username: 'alice', password: 'password123' }).subscribe();
    httpMock.expectOne('/api/auth/login').flush({ token: validToken });

    httpClient.get('/api/lost-items').subscribe();
    const req = httpMock.expectOne('/api/lost-items');
    expect(req.request.headers.get('Authorization')).toBe(`Bearer ${validToken}`);
  });

  it('omits the header when no token is present', () => {
    httpClient.get('/api/lost-items').subscribe();
    const req = httpMock.expectOne('/api/lost-items');
    expect(req.request.headers.has('Authorization')).toBe(false);
  });

  it('does not touch requests outside /api', () => {
    authService.login({ username: 'alice', password: 'password123' }).subscribe();
    httpMock.expectOne('/api/auth/login').flush({ token: validToken });

    httpClient.get('/assets/logo.png').subscribe();
    const req = httpMock.expectOne('/assets/logo.png');
    expect(req.request.headers.has('Authorization')).toBe(false);
  });
});
