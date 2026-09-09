import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { finalize } from 'rxjs';
import { LostItemService } from '../../core/lost-items/lost-item.service';
import { LostItemResponse } from '../../shared/models/lost-item.model';
import { ClaimDialog, ClaimDialogData, ClaimDialogResult } from './claim-dialog/claim-dialog';
import { ItemCard } from './item-card/item-card';

type SearchMode = 'search' | 'query';

@Component({
  selector: 'app-browse',
  imports: [
    FormsModule,
    ItemCard,
    MatButtonModule,
    MatButtonToggleModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './browse.html',
  styleUrl: './browse.scss',
})
export class Browse implements OnInit {
  private readonly lostItems = inject(LostItemService);
  private readonly dialog = inject(MatDialog);

  protected readonly items = signal<LostItemResponse[]>([]);
  protected readonly loading = signal(false);
  protected readonly mode = signal<SearchMode>('search');
  protected queryText = '';

  ngOnInit(): void {
    this.loadAll();
  }

  protected runSearch(): void {
    const q = this.queryText.trim();
    if (!q) {
      this.loadAll();
      return;
    }

    const request$ = this.mode() === 'search' ? this.lostItems.search(q) : this.lostItems.query(q);

    this.loading.set(true);
    request$.pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (items) => this.items.set(items),
    });
  }

  protected clearSearch(): void {
    this.queryText = '';
    this.loadAll();
  }

  protected openClaimDialog(item: LostItemResponse): void {
    const data: ClaimDialogData = { item };
    this.dialog
      .open<ClaimDialog, ClaimDialogData, ClaimDialogResult>(ClaimDialog, { data })
      .afterClosed()
      .subscribe((result) => {
        if (result) {
          this.applyLocalClaim(item.id, result.claimedQuantity);
        }
      });
  }

  private loadAll(): void {
    this.loading.set(true);
    this.lostItems
      .list()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (items) => this.items.set(items),
      });
  }

  /** The claim response has no quantityRemaining, so we decrement locally. */
  private applyLocalClaim(itemId: number, claimedQuantity: number): void {
    this.items.update((items) =>
      items.map((item) =>
        item.id === itemId
          ? { ...item, quantityRemaining: item.quantityRemaining - claimedQuantity }
          : item,
      ),
    );
  }
}
