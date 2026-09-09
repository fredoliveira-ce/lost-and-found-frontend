import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { LostItemService } from './lost-item.service';

describe('LostItemService', () => {
  let service: LostItemService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(LostItemService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('list() GETs /api/lost-items', () => {
    service.list().subscribe();
    const req = httpMock.expectOne('/api/lost-items');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('search() GETs /api/lost-items/search with the query param', () => {
    service.search('labtop').subscribe();
    const req = httpMock.expectOne((r) => r.url === '/api/lost-items/search');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('q')).toBe('labtop');
    req.flush([]);
  });

  it('query() GETs /api/lost-items/query with the query param', () => {
    service.query('black bag near the cafeteria').subscribe();
    const req = httpMock.expectOne((r) => r.url === '/api/lost-items/query');
    expect(req.request.params.get('q')).toBe('black bag near the cafeteria');
    req.flush([]);
  });

  it('claim() POSTs to /api/lost-items/{id}/claims with the request body', () => {
    service.claim(42, { quantity: 2 }).subscribe();
    const req = httpMock.expectOne('/api/lost-items/42/claims');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ quantity: 2 });
    req.flush({ id: 1, lostItemId: 42, userId: 1001, quantity: 2, claimedAt: '2026-01-01T00:00:00Z' });
  });
});
