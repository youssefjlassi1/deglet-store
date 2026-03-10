import { Injectable, signal } from '@angular/core';

export interface ToastState {
  message: string;
  productName?: string;
  visible: boolean;
  actionLabel?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private readonly DEFAULT_DURATION_MS = 3500;
  private hideTimeout: ReturnType<typeof setTimeout> | null = null;
  private actionHandler: (() => void) | null = null;

  readonly toast = signal<ToastState>({
    message: '',
    visible: false
  });

  show(message: string, productName?: string, durationMs?: number): void {
    this.actionHandler = null;

    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }

    this.toast.set({
      message,
      productName,
      visible: true,
      actionLabel: undefined
    });

    this.hideTimeout = setTimeout(() => {
      this.dismiss();
      this.hideTimeout = null;
    }, durationMs ?? this.DEFAULT_DURATION_MS);
  }

  showWithAction(message: string, actionLabel: string, action: () => void, durationMs?: number): void {
    this.actionHandler = action;

    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }

    this.toast.set({
      message,
      productName: undefined,
      visible: true,
      actionLabel
    });

    this.hideTimeout = setTimeout(() => {
      this.dismiss();
      this.hideTimeout = null;
    }, durationMs ?? this.DEFAULT_DURATION_MS);
  }

  /** Affiche un toast de succès "Produit ajouté au panier" avec le nom du produit. */
  addedToCart(productName: string): void {
    this.show('Ajouté au panier', productName);
  }

  dismiss(): void {
    this.toast.update((t) => ({ ...t, visible: false, actionLabel: undefined }));
    this.actionHandler = null;
  }

  runAction(): void {
    const handler = this.actionHandler;
    this.dismiss();
    if (handler) {
      handler();
    }
  }
}
