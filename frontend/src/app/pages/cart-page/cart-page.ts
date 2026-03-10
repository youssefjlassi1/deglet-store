import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CartService } from '../../core/cart.service';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { Order, OrderStatus } from '../../core/models';
import { firstValueFrom } from 'rxjs';
import { ToastService } from '../../core/toast.service';
import { AuthUiService } from '../../core/auth-ui.service';

@Component({
  selector: 'app-cart-page',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, RouterLink],
  templateUrl: './cart-page.html',
  styleUrl: './cart-page.scss',
})
export class CartPageComponent implements OnInit {
  readonly cartService = inject(CartService);
  private readonly apiService = inject(ApiService);
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);
  private readonly authUiService = inject(AuthUiService);

  readonly orders = signal<Order[]>([]);
  readonly loadingOrders = signal(false);
  readonly activeTab = signal<'cart' | 'orders'>('cart');

  checkoutForm = {
    shippingAddress: '',
    city: '',
    phone: '',
    notes: ''
  };

  isSubmitting = false;
  orderSuccess = false;

  readonly cartTotal = computed(() => this.cartService.getTotal());
  readonly cartItems = computed(() => this.cartService.getCart()());

  ngOnInit() {
    if (this.authService.isAuthenticated()) {
      this.loadOrders();
    }
  }

  async loadOrders() {
    if (!this.authService.isAuthenticated()) return;
    
    try {
      this.loadingOrders.set(true);
      const orders = await firstValueFrom(this.apiService.getMyOrders());
      this.orders.set(orders);
    } catch (error) {
      console.error('Erreur lors du chargement des commandes', error);
    } finally {
      this.loadingOrders.set(false);
    }
  }

  updateQuantity(productId: string, event: Event) {
    const qty = +(event.target as HTMLInputElement).value;
    if (qty > 0) {
      this.cartService.updateQuantity(productId, qty);
    }
  }

  increaseQuantity(productId: string) {
    const item = this.cartService.getCart()().find(i => i.product.id === productId);
    if (item) {
      this.cartService.updateQuantity(productId, item.quantity + 1);
    }
  }

  decreaseQuantity(productId: string) {
    const item = this.cartService.getCart()().find(i => i.product.id === productId);
    if (item && item.quantity > 1) {
      this.cartService.updateQuantity(productId, item.quantity - 1);
    }
  }

  removeItem(productId: string) {
    this.cartService.removeFromCart(productId);
  }

  getStatusLabel(status: OrderStatus): string {
    const labels: Record<OrderStatus, string> = {
      pending: 'En attente',
      confirmed: 'Confirmée',
      preparing: 'En préparation',
      shipped: 'Expédiée',
      delivered: 'Livrée',
      cancelled: 'Annulée'
    };
    return labels[status] || status;
  }

  getStatusColor(status: OrderStatus): string {
    const colors: Record<OrderStatus, string> = {
      pending: '#f59e0b',
      confirmed: '#3b82f6',
      preparing: '#8b5cf6',
      shipped: '#06b6d4',
      delivered: '#10b981',
      cancelled: '#ef4444'
    };
    return colors[status] || '#6b7280';
  }

  getStatusProgress(status: OrderStatus): number {
    const progress: Record<OrderStatus, number> = {
      pending: 0,
      confirmed: 20,
      preparing: 40,
      shipped: 60,
      delivered: 100,
      cancelled: 0
    };
    return progress[status] || 0;
  }

  getStatusSteps(status: OrderStatus) {
    const steps = [
      { label: 'En attente', status: 'pending' as OrderStatus },
      { label: 'Confirmée', status: 'confirmed' as OrderStatus },
      { label: 'En préparation', status: 'preparing' as OrderStatus },
      { label: 'Expédiée', status: 'shipped' as OrderStatus },
      { label: 'Livrée', status: 'delivered' as OrderStatus }
    ];

    const currentIndex = steps.findIndex(s => s.status === status);
    const activeIndex = currentIndex >= 0 ? currentIndex : 0;
    
    return steps.map((step, index) => ({
      ...step,
      active: index <= activeIndex,
      current: index === activeIndex,
      color: this.getStatusColor(step.status)
    }));
  }

  async submitOrder() {
    if (this.cartService.getCart()().length === 0) return;

    if (!this.authService.isAuthenticated()) {
      this.toastService.showWithAction(
        'Vous devez être connecté pour passer une commande.',
        'Se connecter / S’inscrire',
        () => {
          this.authUiService.open();
        },
        8000
      );
      return;
    }
    
    const items = this.cartService.getCart()().map(item => ({
      productId: item.product.id,
      quantity: item.quantity
    }));

    const payload = {
      ...this.checkoutForm,
      items
    };

    try {
      this.isSubmitting = true;
      this.orderSuccess = false;
      await firstValueFrom(this.apiService.createOrder(payload));
      this.cartService.clearCart();
      this.checkoutForm = { shippingAddress: '', city: '', phone: '', notes: '' };
      this.orderSuccess = true;
      await this.loadOrders();
      this.activeTab.set('orders');
      
      setTimeout(() => {
        this.orderSuccess = false;
      }, 5000);
    } catch (error: any) {
      console.error('Erreur lors de la création de la commande', error);
      this.toastService.show('Erreur lors de la commande. Veuillez réessayer.', undefined, 5000);
    } finally {
      this.isSubmitting = false;
    }
  }

  switchTab(tab: 'cart' | 'orders') {
    this.activeTab.set(tab);
    if (tab === 'orders' && this.authService.isAuthenticated()) {
      this.loadOrders();
    }
  }
}

