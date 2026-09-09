import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { finalize } from 'rxjs';
import { AdminService } from '../../../core/admin/admin.service';
import { NotificationService } from '../../../core/notifications/notification.service';
import { LostItemResponse } from '../../../shared/models/lost-item.model';

@Component({
  selector: 'app-import',
  imports: [MatButtonModule, MatCardModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './import.html',
  styleUrl: './import.scss',
})
export class Import {
  private readonly admin = inject(AdminService);
  private readonly notifications = inject(NotificationService);

  protected readonly uploading = signal(false);
  protected readonly dragOver = signal(false);
  protected readonly importedItems = signal<LostItemResponse[] | null>(null);
  protected readonly lastFileName = signal<string | null>(null);

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragOver.set(true);
  }

  onDragLeave(): void {
    this.dragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragOver.set(false);
    const file = event.dataTransfer?.files?.[0];
    if (file) {
      this.upload(file);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.upload(file);
    }
    input.value = '';
  }

  private upload(file: File): void {
    this.uploading.set(true);
    this.lastFileName.set(file.name);
    this.admin
      .importFile(file)
      .pipe(finalize(() => this.uploading.set(false)))
      .subscribe({
        next: (items) => {
          this.importedItems.set(items);
          this.notifications.showSuccess(
            `Imported ${items.length} item${items.length === 1 ? '' : 's'} from ${file.name}.`,
          );
        },
      });
  }
}
