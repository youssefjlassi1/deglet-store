import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth.service';
import { CartService } from './core/cart.service';
import { AuthModal } from './components/auth-modal/auth-modal';
import { ToastComponent } from './components/toast/toast.component';
import { AuthUiService } from './core/auth-ui.service';
import { ChatbotWidget } from './components/chatbot-widget/chatbot-widget';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, AuthModal, ToastComponent, ChatbotWidget],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly authService = inject(AuthService);
  private readonly cartService = inject(CartService);
  protected readonly authUiService = inject(AuthUiService);

  protected readonly cartCount = computed(() => this.cartService.getCartCount());
  protected readonly isAuthModalOpen = this.authUiService.isAuthModalOpen;

  logout(): void {
    this.authService.logout();
  }

  openAuthModal(): void {
    this.authUiService.open();
  }

  closeAuthModal(): void {
    this.authUiService.close();
  }

  scrollToCart(): void {
    const cartElement = document.getElementById('cart');
    if (cartElement) {
      cartElement.scrollIntoView({ behavior: 'smooth' });
    }
  }
}

