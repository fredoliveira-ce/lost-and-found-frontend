import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ClaimDialog, ClaimDialogData } from './claim-dialog';

describe('ClaimDialog quantity bounds', () => {
  let component: ClaimDialog;

  function createWithMax(quantityRemaining: number) {
    const data: ClaimDialogData = {
      item: { id: 1, itemName: 'Laptop', quantity: quantityRemaining, quantityRemaining, place: 'Airport' },
    };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MAT_DIALOG_DATA, useValue: data },
        { provide: MatDialogRef, useValue: { close: vi.fn() } },
      ],
    });

    component = TestBed.createComponent(ClaimDialog).componentInstance;
  }

  it('starts at quantity 1', () => {
    createWithMax(3);
    expect(component['quantity']()).toBe(1);
  });

  it('does not decrement below 1', () => {
    createWithMax(3);
    component.decrement();
    expect(component['quantity']()).toBe(1);
  });

  it('does not increment past quantityRemaining', () => {
    createWithMax(3);
    component.increment();
    component.increment();
    component.increment();
    component.increment();
    component.increment();
    expect(component['quantity']()).toBe(3);
  });

  it('increments and decrements within bounds', () => {
    createWithMax(5);
    component.increment();
    component.increment();
    expect(component['quantity']()).toBe(3);
    component.decrement();
    expect(component['quantity']()).toBe(2);
  });

  it('handles a max of exactly 1 (increment is a no-op)', () => {
    createWithMax(1);
    component.increment();
    expect(component['quantity']()).toBe(1);
  });
});
