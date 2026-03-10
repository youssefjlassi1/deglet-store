import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthUiService {
  readonly isAuthModalOpen = signal(false);

  open(): void {
    this.isAuthModalOpen.set(true);
  }

  close(): void {
    this.isAuthModalOpen.set(false);
  }
}

