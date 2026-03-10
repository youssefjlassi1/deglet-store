import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { CartItem, Order, Product } from '../core/models';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CurrencyPipe, DatePipe],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss'
})
export class HomePageComponent {
  private readonly apiService = inject(ApiService);
  protected readonly authService = inject(AuthService);
  private readonly formBuilder = inject(FormBuilder);

  protected readonly loading = signal(false);
  protected readonly submittingOrder = signal(false);
  protected readonly authError = signal('');
  protected readonly orderMessage = signal('');
  protected readonly products = signal<Product[]>([]);
  protected readonly orders = signal<Order[]>([]);
  protected readonly cart = signal<CartItem[]>([]);
  protected readonly featuredProducts = computed(() => this.products().filter((product) => product.featured));
  protected readonly cartCount = computed(() => this.cart().reduce((sum, item) => sum + item.quantity, 0));
  protected readonly cartTotal = computed(() =>
    this.cart().reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  );

  protected readonly loginForm = this.formBuilder.nonNullable.group({
    email: ['client@dhaouidattes.com', [Validators.required, Validators.email]],
    password: ['Client123!', [Validators.required, Validators.minLength(6)]]
  });

  protected readonly registerForm = this.formBuilder.nonNullable.group({
    fullName: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  protected readonly checkoutForm = this.formBuilder.nonNullable.group({
    shippingAddress: ['', [Validators.required]],
    city: ['', [Validators.required]],
    phone: ['', [Validators.required]],
    notes: ['']
  });

  constructor() {
    void this.loadProducts();

    if (this.authService.isAuthenticated()) {
      void this.refreshProfileAndOrders();
    }
  }

  async login(): Promise<void> {
    if (this.loginForm.invalid) {
      this.authError.set('Veuillez saisir un email et un mot de passe valides.');
      return;
    }

    this.loading.set(true);
    this.authError.set('');

    try {
      const response = await firstValueFrom(this.apiService.login(this.loginForm.getRawValue()));
      this.authService.setSession(response);
      await this.refreshProfileAndOrders();
    } catch {
      this.authError.set('Impossible de se connecter. Vérifiez vos identifiants.');
    } finally {
      this.loading.set(false);
    }
  }

  async register(): Promise<void> {
    if (this.registerForm.invalid) {
      this.authError.set('Veuillez compléter correctement le formulaire d’inscription.');
      return;
    }

    this.loading.set(true);
    this.authError.set('');

    try {
      const response = await firstValueFrom(this.apiService.register(this.registerForm.getRawValue()));
      this.authService.setSession(response);
      await this.refreshProfileAndOrders();
      this.registerForm.reset({ fullName: '', email: '', phone: '', password: '' });
    } catch {
      this.authError.set('Inscription impossible. Essayez un autre email.');
    } finally {
      this.loading.set(false);
    }
  }

  addToCart(product: Product): void {
    const existingItem = this.cart().find((item) => item.product.id === product.id);

    if (existingItem) {
      this.cart.set(
        this.cart().map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      );
      return;
    }

    this.cart.set([...this.cart(), { product, quantity: 1 }]);
  }

  changeQuantity(productId: string, delta: number): void {
    this.cart.set(
      this.cart()
        .map((item) =>
          item.product.id === productId ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  removeFromCart(productId: string): void {
    this.cart.set(this.cart().filter((item) => item.product.id !== productId));
  }

  async submitOrder(): Promise<void> {
    if (!this.authService.isAuthenticated()) {
      this.orderMessage.set('Connectez-vous en tant que client pour finaliser la commande.');
      return;
    }

    if (this.checkoutForm.invalid || this.cart().length === 0) {
      this.orderMessage.set('Ajoutez des produits et complétez les informations de livraison.');
      return;
    }

    this.submittingOrder.set(true);
    this.orderMessage.set('');

    try {
      await firstValueFrom(
        this.apiService.createOrder({
          ...this.checkoutForm.getRawValue(),
          items: this.cart().map((item) => ({ productId: item.product.id, quantity: item.quantity }))
        })
      );

      this.cart.set([]);
      this.checkoutForm.reset({ shippingAddress: '', city: '', phone: '', notes: '' });
      this.orderMessage.set('Commande envoyée avec succès.');
      await this.loadProducts();
      await this.loadMyOrders();
    } catch {
      this.orderMessage.set('La commande a échoué. Vérifiez le stock ou reconnectez-vous.');
    } finally {
      this.submittingOrder.set(false);
    }
  }

  logout(): void {
    this.authService.logout();
    this.orders.set([]);
  }

  private async refreshProfileAndOrders(): Promise<void> {
    try {
      const profile = await firstValueFrom(this.apiService.getProfile());
      this.authService.updateUser(profile);
      await this.loadMyOrders();
    } catch {
      this.authService.logout();
    }
  }

  private async loadProducts(): Promise<void> {
    const products = await firstValueFrom(this.apiService.getProducts());
    this.products.set(products);
  }

  private async loadMyOrders(): Promise<void> {
    const orders = await firstValueFrom(this.apiService.getMyOrders());
    this.orders.set(orders);
  }
}