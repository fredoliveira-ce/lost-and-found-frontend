import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ClaimRequest, ClaimResponse } from '../../shared/models/claim.model';
import { LostItemResponse } from '../../shared/models/lost-item.model';

@Injectable({ providedIn: 'root' })
export class LostItemService {
  private readonly http = inject(HttpClient);

  list(): Observable<LostItemResponse[]> {
    return this.http.get<LostItemResponse[]>('/api/lost-items');
  }

  search(q: string): Observable<LostItemResponse[]> {
    return this.http.get<LostItemResponse[]>('/api/lost-items/search', {
      params: new HttpParams().set('q', q),
    });
  }

  query(q: string): Observable<LostItemResponse[]> {
    return this.http.get<LostItemResponse[]>('/api/lost-items/query', {
      params: new HttpParams().set('q', q),
    });
  }

  claim(lostItemId: number, request: ClaimRequest): Observable<ClaimResponse> {
    return this.http.post<ClaimResponse>(`/api/lost-items/${lostItemId}/claims`, request);
  }
}
