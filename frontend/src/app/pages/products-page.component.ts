import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../core/api.service';
import { CartService } from '../core/cart.service';
import { Product } from '../core/models';

@Component({
  selector: 'app-products-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './products-page.component.html',
  styleUrl: './products-page.component.scss'
})
export class ProductsPageComponent {
  private readonly apiService = inject(ApiService);
  private readonly cartService = inject(CartService);

  protected readonly products = signal<Product[]>([]);
  protected readonly categories = signal<string[]>(['Tous']);
  protected readonly selectedCategory = signal<string>('Tous');

  protected readonly filteredProducts = computed(() => {
    const category = this.selectedCategory();
    const list = this.products();
    if (category === 'Tous') {
      return list;
    }
    return list.filter((p) => (p.category ?? '').trim() === category);
  });

  constructor() {
    void this.loadData();
  }

  async loadData(): Promise<void> {
    try {
      const [products, apiCategories] = await Promise.all([
        firstValueFrom(this.apiService.getProducts()),
        firstValueFrom(this.apiService.getProductCategories()),
      ]);
      this.products.set(products);
      this.categories.set(['Tous', ...apiCategories]);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  }

  selectCategory(category: string): void {
    this.selectedCategory.set(category);
  }

  addToCart(product: Product): void {
    this.cartService.addToCart(product, 1);
  }

  getProductWeight(product: Product): string {
    if (product.grammage?.trim()) {
      return product.grammage.trim();
    }
    if (product.name.toLowerCase().includes('sirop')) return '350 ml';
    if (product.name.toLowerCase().includes('coffret') || product.name.toLowerCase().includes('prestige')) return '1.5 kg';
    if (product.name.toLowerCase().includes('chocolat')) return '400 g';
    return '500 g';
  }
}
