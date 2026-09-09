import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { LostItemClaimsReportResponse } from '../../shared/models/claims-report.model';
import { LostItemResponse } from '../../shared/models/lost-item.model';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);

  importFile(file: File): Observable<LostItemResponse[]> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<LostItemResponse[]>('/api/admin/lost-items/import', formData);
  }

  getClaimsReport(): Observable<LostItemClaimsReportResponse[]> {
    return this.http.get<LostItemClaimsReportResponse[]>('/api/admin/lost-items/claims');
  }
}
