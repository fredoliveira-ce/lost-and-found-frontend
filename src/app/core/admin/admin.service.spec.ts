import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AdminService } from './admin.service';

describe('AdminService', () => {
  let service: AdminService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AdminService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('importFile() POSTs multipart form data with a "file" field', () => {
    const file = new File(['ItemName: Laptop'], 'items.txt', { type: 'text/plain' });
    service.importFile(file).subscribe();

    const req = httpMock.expectOne('/api/admin/lost-items/import');
    expect(req.request.method).toBe('POST');
    expect(req.request.body instanceof FormData).toBe(true);
    expect((req.request.body as FormData).get('file')).toBe(file);
    req.flush([]);
  });

  it('getClaimsReport() GETs /api/admin/lost-items/claims', () => {
    service.getClaimsReport().subscribe();
    const req = httpMock.expectOne('/api/admin/lost-items/claims');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });
});
