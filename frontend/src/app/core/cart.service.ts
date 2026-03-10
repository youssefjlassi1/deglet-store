import { inject, Injectable, signal } from '@angular/core';
import { CartItem, Product } from './models';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private readonly cart = signal<CartItem[]>([]);
  private readonly toastService = inject(ToastService);

  getCart() {
    return this.cart.asReadonly();
  }

  getCartCount() {
    return this.cart().reduce((sum, item) => sum + item.quantity, 0);
  }

  addToCart(product: Product, quantity: number = 1): void {
    const currentCart = this.cart();
    const existingItem = currentCart.find((item) => item.product.id === product.id);

    if (existingItem) {
      this.cart.set(
        currentCart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      );
    } else {
      this.cart.set([...currentCart, { product, quantity }]);
    }
    this.toastService.addedToCart(product.name);
  }

  removeFromCart(productId: string): void {
    this.cart.set(this.cart().filter((item) => item.product.id !== productId));
  }

  updateQuantity(productId: string, quantity: number): void {
    if (quantity <= 0) {
      this.removeFromCart(productId);
      return;
    }
    this.cart.set(
      this.cart().map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  }

  clearCart(): void {
    this.cart.set([]);
  }

  getTotal(): number {
    return this.cart().reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  }
}
