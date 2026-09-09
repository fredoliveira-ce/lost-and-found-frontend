import { Component, OnInit, inject, signal } from '@angular/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { finalize } from 'rxjs';
import { AdminService } from '../../../core/admin/admin.service';
import { LostItemClaimsReportResponse } from '../../../shared/models/claims-report.model';

@Component({
  selector: 'app-claims-report',
  imports: [MatExpansionModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './claims-report.html',
  styleUrl: './claims-report.scss',
})
export class ClaimsReport implements OnInit {
  private readonly admin = inject(AdminService);

  protected readonly rows = signal<LostItemClaimsReportResponse[]>([]);
  protected readonly loading = signal(false);

  ngOnInit(): void {
    this.loading.set(true);
    this.admin
      .getClaimsReport()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (rows) => this.rows.set(rows),
      });
  }

  protected claimedTotal(row: LostItemClaimsReportResponse): number {
    return row.claimants.reduce((sum, claimant) => sum + claimant.quantity, 0);
  }
}
