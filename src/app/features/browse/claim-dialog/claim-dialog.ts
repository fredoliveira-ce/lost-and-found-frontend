import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { finalize } from 'rxjs';
import { LostItemService } from '../../../core/lost-items/lost-item.service';
import { NotificationService } from '../../../core/notifications/notification.service';
import { LostItemResponse } from '../../../shared/models/lost-item.model';

export interface ClaimDialogData {
  item: LostItemResponse;
}

export interface ClaimDialogResult {
  claimedQuantity: number;
}

@Component({
  selector: 'app-claim-dialog',
  imports: [MatButtonModule, MatDialogModule, MatIconModule],
  templateUrl: './claim-dialog.html',
  styleUrl: './claim-dialog.scss',
})
export class ClaimDialog {
  protected readonly data = inject<ClaimDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<ClaimDialog, ClaimDialogResult>);
  private readonly lostItems = inject(LostItemService);
  private readonly notifications = inject(NotificationService);

  protected readonly quantity = signal(1);
  protected readonly submitting = signal(false);

  protected readonly maxQuantity = this.data.item.quantityRemaining;

  decrement(): void {
    this.quantity.update((value) => Math.max(1, value - 1));
  }

  increment(): void {
    this.quantity.update((value) => Math.min(this.maxQuantity, value + 1));
  }

  cancel(): void {
    this.dialogRef.close();
  }

  confirm(): void {
    if (this.submitting()) {
      return;
    }

    this.submitting.set(true);
    this.lostItems
      .claim(this.data.item.id, { quantity: this.quantity() })
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () => {
          this.notifications.showSuccess(
            `You claimed ${this.quantity()} of ${this.data.item.itemName}.`,
          );
          this.dialogRef.close({ claimedQuantity: this.quantity() });
        },
      });
  }
}
