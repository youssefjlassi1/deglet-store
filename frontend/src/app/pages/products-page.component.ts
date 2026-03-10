import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../core/api.service';
import { CartService } from '../core/cart.service';
import { Product } from '../core/models';

type ProductCategory = 'Tous' | 'Naturelles' | 'Gourmandes' | 'Dérivés' | 'Coffrets';

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
  protected readonly selectedCategory = signal<ProductCategory>('Tous');
  protected readonly categories: ProductCategory[] = ['Tous', 'Naturelles', 'Gourmandes', 'Dérivés', 'Coffrets'];

  protected readonly filteredProducts = computed(() => {
    const category = this.selectedCategory();
    if (category === 'Tous') {
      return this.products();
    }
    // For now, return all products. You can add category filtering logic later
    return this.products();
  });

  constructor() {
    void this.loadProducts();
  }

  async loadProducts(): Promise<void> {
    try {
      const products = await firstValueFrom(this.apiService.getProducts());
      this.products.set(products);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  }

  selectCategory(category: ProductCategory): void {
    this.selectedCategory.set(category);
  }

  addToCart(product: Product): void {
    this.cartService.addToCart(product, 1);
  }

  getProductWeight(product: Product): string {
    // Mock weight based on product name or variety
    if (product.name.toLowerCase().includes('sirop')) {
      return '350 ml';
    }
    if (product.name.toLowerCase().includes('coffret') || product.name.toLowerCase().includes('prestige')) {
      return '1.5 kg';
    }
    if (product.name.toLowerCase().includes('chocolat')) {
      return '400 g';
    }
    return '500 g';
  }
}
