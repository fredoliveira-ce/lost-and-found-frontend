import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';

function makeToken(payload: unknown): string {
  const base64url = (obj: unknown) =>
    btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${base64url({ alg: 'RS256' })}.${base64url(payload)}.signature`;
}

const futureExp = Math.floor(Date.now() / 1000) + 3600;
const userToken = makeToken({ sub: 'alice', role: 'USER', uid: '1001', iat: 1, exp: futureExp });
const adminToken = makeToken({ sub: 'admin', role: 'ADMIN', uid: '9001', iat: 1, exp: futureExp });

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('starts unauthenticated with no stored token', () => {
    expect(service.isAuthenticated()).toBe(false);
    expect(service.isAdmin()).toBe(false);
    expect(service.username()).toBeNull();
  });

  it('login() stores the token and updates computed signals for a USER token', () => {
    service.login({ username: 'alice', password: 'password123' }).subscribe();

    const req = httpMock.expectOne('/api/auth/login');
    expect(req.request.method).toBe('POST');
    req.flush({ token: userToken });

    expect(service.token()).toBe(userToken);
    expect(service.isAuthenticated()).toBe(true);
    expect(service.isAdmin()).toBe(false);
    expect(service.username()).toBe('alice');
    expect(localStorage.getItem('auth_token')).toBe(userToken);
  });

  it('login() updates computed signals correctly for an ADMIN token', () => {
    service.login({ username: 'admin', password: 'password123' }).subscribe();
    httpMock.expectOne('/api/auth/login').flush({ token: adminToken });

    expect(service.isAdmin()).toBe(true);
    expect(service.username()).toBe('admin');
  });

  it('logout() clears the token and computed signals', () => {
    service.login({ username: 'alice', password: 'password123' }).subscribe();
    httpMock.expectOne('/api/auth/login').flush({ token: userToken });

    service.logout();

    expect(service.token()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
    expect(localStorage.getItem('auth_token')).toBeNull();
  });

  it('hydrates existing state from localStorage on construction', () => {
    localStorage.setItem('auth_token', adminToken);

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const freshService = TestBed.inject(AuthService);

    expect(freshService.isAuthenticated()).toBe(true);
    expect(freshService.isAdmin()).toBe(true);
  });
});
