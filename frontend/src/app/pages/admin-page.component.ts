import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, ElementRef, ViewChild, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { DashboardSummary, Order, OrderStatus, Product } from '../core/models';

@Component({
  selector: 'app-admin-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CurrencyPipe, DatePipe],
  templateUrl: './admin-page.component.html',
  styleUrl: './admin-page.component.scss'
})
export class AdminPageComponent {
  private readonly apiService = inject(ApiService);
  protected readonly authService = inject(AuthService);
  private readonly formBuilder = inject(FormBuilder);

  @ViewChild('createFileInput')
  private createFileInput?: ElementRef<HTMLInputElement>;

  protected readonly summary = signal<DashboardSummary | null>(null);
  protected readonly products = signal<Product[]>([]);
  protected readonly orders = signal<Order[]>([]);
  protected readonly loading = signal(false);
  protected readonly createUploading = signal(false);
  protected readonly editUploading = signal(false);
  protected readonly savingEdit = signal(false);
  protected readonly editingProductId = signal<string | null>(null);
  protected readonly editingProduct = signal<Product | null>(null);
  protected readonly feedback = signal('');
  protected readonly previewImage = signal<string | null>(null);
  protected readonly editPreviewImage = signal<string | null>(null);
  protected readonly statuses: OrderStatus[] = ['pending', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled'];
  protected readonly selectedStatus = signal<OrderStatus | 'all'>('all');
  protected readonly searchQuery = signal('');
  protected readonly showCreateModal = signal(false);
  protected readonly showEditModal = signal(false);
  protected readonly activeTab = signal<'products' | 'orders'>('products');

  get allStatusesWithAll(): Array<OrderStatus | 'all'> {
    return ['all', ...this.statuses];
  }

  protected readonly productForm = this.formBuilder.nonNullable.group({
    name: ['', Validators.required],
    slug: ['', Validators.required],
    description: ['', Validators.required],
    variety: ['', Validators.required],
    originRegion: ['', Validators.required],
    harvestYear: [2025, Validators.required],
    imageUrl: ['', Validators.required],
    price: [0, [Validators.required, Validators.min(0)]],
    stock: [0, [Validators.required, Validators.min(0)]],
    featured: [false, Validators.required]
  });

  protected readonly editProductForm = this.formBuilder.nonNullable.group({
    name: ['', Validators.required],
    description: ['', Validators.required],
    imageUrl: ['', Validators.required]
  });

  constructor() {
    void this.loadData();
  }

  async onFileSelected(event: Event, mode: 'create' | 'edit' = 'create'): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];

    if (mode === 'create') {
      this.createUploading.set(true);
    } else {
      this.editUploading.set(true);
    }

    this.feedback.set('');

    try {
      const response = await firstValueFrom(this.apiService.uploadImage(file));
      const fullUrl = `http://localhost:3000${response.url}`;

      if (mode === 'create') {
        this.productForm.patchValue({ imageUrl: fullUrl });
        this.previewImage.set(fullUrl);
      } else {
        this.editProductForm.patchValue({ imageUrl: fullUrl });
        this.editPreviewImage.set(fullUrl);
      }

      this.feedback.set('Image uploadée avec succès.');
    } catch (error) {
      console.error('Erreur upload:', error);
      this.feedback.set('Erreur lors de l\'upload de l\'image. Vérifiez que le fichier est une image valide (max 5MB).');
      if (mode === 'create') {
        this.previewImage.set(null);
      } else {
        this.editPreviewImage.set(null);
      }
    } finally {
      if (mode === 'create') {
        this.createUploading.set(false);
      } else {
        this.editUploading.set(false);
      }

      input.value = '';
    }
  }

  removeImage(mode: 'create' | 'edit' = 'create'): void {
    if (mode === 'create') {
      this.previewImage.set(null);
      this.productForm.patchValue({ imageUrl: '' });
      return;
    }

    this.editPreviewImage.set(null);
    this.editProductForm.patchValue({ imageUrl: '' });
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzMzMzMzMyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTk5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZSBub24gZGlzcG9uaWJsZTwvdGV4dD48L3N2Zz4=';
  }

  openCreateModal(): void {
    this.showCreateModal.set(true);
  }

  closeCreateModal(): void {
    this.showCreateModal.set(false);
    this.resetCreateForm();
  }

  async createProduct(): Promise<void> {
    if (this.productForm.invalid) {
      if (!this.productForm.get('imageUrl')?.value) {
        this.feedback.set('Veuillez uploader une image pour le produit.');
      } else {
        this.feedback.set('Veuillez compléter tous les champs du produit.');
      }
      return;
    }

    if (!this.productForm.get('imageUrl')?.value) {
      this.feedback.set('Veuillez uploader une image avant d\'ajouter le produit.');
      return;
    }

    try {
      await firstValueFrom(this.apiService.createProduct(this.productForm.getRawValue()));
      this.feedback.set('Produit ajouté avec succès.');
      this.resetCreateForm();
      this.closeCreateModal();
      await this.loadData();
    } catch {
      this.feedback.set('Ajout impossible. Vérifiez votre session administrateur.');
    }
  }

  openEditModal(product: Product): void {
    this.editingProduct.set(product);
    this.editingProductId.set(product.id);
    this.editProductForm.reset({
      name: product.name,
      description: product.description,
      imageUrl: product.imageUrl
    });
    this.editPreviewImage.set(product.imageUrl);
    this.feedback.set('');
    this.showEditModal.set(true);
  }

  closeEditModal(): void {
    this.showEditModal.set(false);
    this.editingProductId.set(null);
    this.editingProduct.set(null);
    this.editProductForm.reset({
      name: '',
      description: '',
      imageUrl: ''
    });
    this.editPreviewImage.set(null);
  }

  async saveProductChanges(): Promise<void> {
    const productId = this.editingProductId();

    if (!productId) {
      return;
    }

    if (this.editProductForm.invalid || !this.editProductForm.get('imageUrl')?.value) {
      this.feedback.set('Veuillez renseigner le nom, la description et une photo pour ce produit.');
      return;
    }

    this.savingEdit.set(true);

    try {
      await firstValueFrom(this.apiService.updateProduct(productId, this.editProductForm.getRawValue()));
      this.feedback.set('Produit modifié avec succès.');
      this.closeEditModal();
      await this.loadData();
    } catch {
      this.feedback.set('Modification impossible. Vérifiez votre session administrateur.');
    } finally {
      this.savingEdit.set(false);
    }
  }

  async updateStatus(orderId: string, status: string): Promise<void> {
    try {
      await firstValueFrom(this.apiService.updateOrderStatus(orderId, status));
      this.feedback.set('Statut de commande mis à jour.');
      await this.loadData();
    } catch {
      this.feedback.set('Mise à jour du statut impossible.');
    }
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

  getFilteredOrders() {
    let filtered = this.orders();
    
    // Filter by status
    if (this.selectedStatus() !== 'all') {
      filtered = filtered.filter(order => order.status === this.selectedStatus());
    }
    
    // Filter by search query
    const query = this.searchQuery().toLowerCase();
    if (query) {
      filtered = filtered.filter(order => 
        order.customer.fullName.toLowerCase().includes(query) ||
        order.customer.email.toLowerCase().includes(query) ||
        order.id.toLowerCase().includes(query) ||
        order.shippingAddress.toLowerCase().includes(query) ||
        order.city.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }

  async toggleFeatured(product: Product): Promise<void> {
    try {
      await firstValueFrom(this.apiService.updateProduct(product.id, { featured: !product.featured }));
      this.feedback.set('Produit mis à jour.');
      await this.loadData();
    } catch {
      this.feedback.set('Mise à jour du produit impossible.');
    }
  }

  async restock(product: Product): Promise<void> {
    try {
      await firstValueFrom(this.apiService.updateProduct(product.id, { stock: product.stock + 20 }));
      this.feedback.set('Stock mis à jour.');
      await this.loadData();
    } catch {
      this.feedback.set('Restock impossible.');
    }
  }

  async deleteProduct(product: Product): Promise<void> {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le produit "${product.name}" ? Cette action est irréversible.`)) {
      return;
    }

    try {
      await firstValueFrom(this.apiService.deleteProduct(product.id));
      if (this.editingProductId() === product.id) {
        this.closeEditModal();
      }
      this.feedback.set('Produit supprimé avec succès.');
      await this.loadData();
    } catch {
      this.feedback.set('Suppression impossible. Vérifiez votre session administrateur.');
    }
  }

  private resetCreateForm(): void {
    this.productForm.reset({
      name: '',
      slug: '',
      description: '',
      variety: '',
      originRegion: '',
      harvestYear: 2025,
      imageUrl: '',
      price: 0,
      stock: 0,
      featured: false
    });
    this.previewImage.set(null);
    if (this.createFileInput) {
      this.createFileInput.nativeElement.value = '';
    }
  }

  private async loadData(): Promise<void> {
    if (!this.authService.isAdmin()) {
      return;
    }

    this.loading.set(true);

    try {
      const [summary, products, orders] = await Promise.all([
        firstValueFrom(this.apiService.getDashboardSummary()),
        firstValueFrom(this.apiService.getProducts()),
        firstValueFrom(this.apiService.getOrders())
      ]);

      this.summary.set(summary);
      this.products.set(products);
      this.orders.set(orders);
    } finally {
      this.loading.set(false);
    }
  }
}