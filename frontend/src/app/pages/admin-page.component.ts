import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, ElementRef, OnDestroy, ViewChild, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { DashboardSummary, Order, OrderStatus, Product, User, UserRole } from '../core/models';

export type ToastType = 'success' | 'error' | 'info';

export type ConfirmVariant = 'danger' | 'warning' | 'neutral';

export interface ConfirmDialogConfig {
  title: string;
  message: string;
  detail?: string;
  variant: ConfirmVariant;
  confirmLabel: string;
  cancelLabel?: string;
}

@Component({
  selector: 'app-admin-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CurrencyPipe, DatePipe],
  templateUrl: './admin-page.component.html',
  styleUrl: './admin-page.component.scss'
})
export class AdminPageComponent implements OnDestroy {
  private readonly apiService = inject(ApiService);
  protected readonly authService = inject(AuthService);
  private readonly formBuilder = inject(FormBuilder);

  @ViewChild('createFileInput')
  private createFileInput?: ElementRef<HTMLInputElement>;

  protected readonly summary = signal<DashboardSummary | null>(null);
  protected readonly products = signal<Product[]>([]);
  protected readonly orders = signal<Order[]>([]);
  protected readonly users = signal<User[]>([]);
  protected readonly loading = signal(false);
  protected readonly createUploading = signal(false);
  protected readonly editUploading = signal(false);
  protected readonly savingEdit = signal(false);
  protected readonly savingUser = signal(false);
  protected readonly changingUserRoleId = signal<string | null>(null);
  protected readonly deletingUserId = signal<string | null>(null);
  protected readonly editingProductId = signal<string | null>(null);
  protected readonly editingProduct = signal<Product | null>(null);
  protected readonly editingUser = signal<User | null>(null);
  protected readonly toast = signal<{ message: string; type: ToastType } | null>(null);
  protected readonly showConfirmModal = signal(false);
  protected readonly confirmConfig = signal<ConfirmDialogConfig | null>(null);
  private confirmResolve: ((value: boolean) => void) | null = null;
  private toastTimer: ReturnType<typeof setTimeout> | null = null;
  protected readonly previewImage = signal<string | null>(null);
  protected readonly editPreviewImage = signal<string | null>(null);
  protected readonly statuses: OrderStatus[] = ['pending', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled'];
  protected readonly selectedStatus = signal<OrderStatus | 'all'>('all');
  protected readonly searchQuery = signal('');
  protected readonly userSearchQuery = signal('');
  protected readonly showCreateModal = signal(false);
  protected readonly showEditModal = signal(false);
  protected readonly showUserModal = signal(false);
  protected readonly activeTab = signal<'products' | 'orders' | 'users'>('products');

  get allStatusesWithAll(): Array<OrderStatus | 'all'> {
    return ['all', ...this.statuses];
  }

  protected readonly productForm = this.formBuilder.nonNullable.group({
    name: ['', Validators.required],
    slug: ['', Validators.required],
    description: ['', Validators.required],
    variety: ['', Validators.required],
    category: ['', Validators.required],
    grammage: ['', Validators.required],
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
    category: ['', Validators.required],
    grammage: ['', Validators.required],
    imageUrl: ['', Validators.required]
  });

  protected readonly userForm = this.formBuilder.nonNullable.group({
    fullName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    role: ['client' as UserRole, Validators.required]
  });

  constructor() {
    void this.loadData();
  }

  ngOnDestroy(): void {
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
      this.toastTimer = null;
    }
  }

  protected showToast(message: string, type: ToastType = 'info'): void {
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
      this.toastTimer = null;
    }
    this.toast.set({ message, type });
    this.toastTimer = setTimeout(() => {
      this.toast.set(null);
      this.toastTimer = null;
    }, 5200);
  }

  protected dismissToast(): void {
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
      this.toastTimer = null;
    }
    this.toast.set(null);
  }

  protected clearToast(): void {
    this.dismissToast();
  }

  protected openConfirm(config: ConfirmDialogConfig): Promise<boolean> {
    this.confirmConfig.set(config);
    this.showConfirmModal.set(true);
    return new Promise((resolve) => {
      this.confirmResolve = resolve;
    });
  }

  protected confirmAccept(): void {
    this.showConfirmModal.set(false);
    this.confirmConfig.set(null);
    const resolve = this.confirmResolve;
    this.confirmResolve = null;
    resolve?.(true);
  }

  protected confirmCancel(): void {
    this.showConfirmModal.set(false);
    this.confirmConfig.set(null);
    const resolve = this.confirmResolve;
    this.confirmResolve = null;
    resolve?.(false);
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

    this.clearToast();

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

      this.showToast('Image uploadée avec succès.', 'success');
    } catch (error) {
      console.error('Erreur upload:', error);
      this.showToast(
        "Erreur lors de l'upload de l'image. Vérifiez que le fichier est une image valide (max 5 Mo).",
        'error'
      );
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
        this.showToast('Veuillez uploader une image pour le produit.', 'info');
      } else {
        this.showToast('Veuillez compléter tous les champs du produit.', 'info');
      }
      return;
    }

    if (!this.productForm.get('imageUrl')?.value) {
      this.showToast("Veuillez uploader une image avant d'ajouter le produit.", 'info');
      return;
    }

    try {
      await firstValueFrom(this.apiService.createProduct(this.productForm.getRawValue()));
      this.showToast('Produit ajouté avec succès.', 'success');
      this.resetCreateForm();
      this.closeCreateModal();
      await this.loadData();
    } catch {
      this.showToast('Ajout impossible. Vérifiez votre session administrateur.', 'error');
    }
  }

  openEditModal(product: Product): void {
    this.editingProduct.set(product);
    this.editingProductId.set(product.id);
    this.editProductForm.reset({
      name: product.name,
      description: product.description,
      category: product.category ?? '',
      grammage: product.grammage ?? '',
      imageUrl: product.imageUrl
    });
    this.editPreviewImage.set(product.imageUrl);
    this.clearToast();
    this.showEditModal.set(true);
  }

  closeEditModal(): void {
    this.showEditModal.set(false);
    this.editingProductId.set(null);
    this.editingProduct.set(null);
    this.editProductForm.reset({
      name: '',
      description: '',
      category: '',
      grammage: '',
      imageUrl: ''
    });
    this.editPreviewImage.set(null);
  }

  openUserModal(user: User): void {
    this.editingUser.set(user);
    this.userForm.reset({
      fullName: user.fullName,
      email: user.email,
      phone: user.phone ?? '',
      role: user.role
    });
    if (this.isCurrentUser(user)) {
      this.userForm.controls.role.disable();
    } else {
      this.userForm.controls.role.enable();
    }
    this.clearToast();
    this.showUserModal.set(true);
  }

  closeUserModal(): void {
    this.showUserModal.set(false);
    this.editingUser.set(null);
    this.userForm.controls.role.enable();
    this.userForm.reset({
      fullName: '',
      email: '',
      phone: '',
      role: 'client'
    });
  }

  async saveProductChanges(): Promise<void> {
    const productId = this.editingProductId();

    if (!productId) {
      return;
    }

    if (this.editProductForm.invalid || !this.editProductForm.get('imageUrl')?.value) {
      this.showToast('Veuillez renseigner le nom, la description et une photo pour ce produit.', 'info');
      return;
    }

    this.savingEdit.set(true);

    try {
      await firstValueFrom(this.apiService.updateProduct(productId, this.editProductForm.getRawValue()));
      this.showToast('Produit modifié avec succès.', 'success');
      this.closeEditModal();
      await this.loadData();
    } catch {
      this.showToast('Modification impossible. Vérifiez votre session administrateur.', 'error');
    } finally {
      this.savingEdit.set(false);
    }
  }

  async updateStatus(orderId: string, status: string): Promise<void> {
    try {
      await firstValueFrom(this.apiService.updateOrderStatus(orderId, status));
      this.showToast('Statut de commande mis à jour.', 'success');
      await this.loadData();
    } catch {
      this.showToast('Mise à jour du statut impossible.', 'error');
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

  getFilteredUsers() {
    const query = this.userSearchQuery().trim().toLowerCase();

    if (!query) {
      return this.users();
    }

    return this.users().filter((user) =>
      user.fullName.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      (user.phone ?? '').toLowerCase().includes(query) ||
      this.getUserRoleLabel(user.role).toLowerCase().includes(query)
    );
  }

  getUserRoleLabel(role: UserRole): string {
    return role === 'admin' ? 'Administrateur' : 'Client';
  }

  getUserInitials(fullName: string): string {
    return fullName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('');
  }

  isCurrentUser(user: User): boolean {
    return this.authService.currentUser()?.id === user.id;
  }

  async saveUserChanges(): Promise<void> {
    const user = this.editingUser();

    if (!user) {
      return;
    }

    if (this.userForm.invalid) {
      this.showToast('Veuillez renseigner un nom, un e-mail valide et un rôle.', 'info');
      return;
    }

    this.savingUser.set(true);

    try {
      const updatedUser = await firstValueFrom(this.apiService.updateUser(user.id, this.userForm.getRawValue()));

      if (this.isCurrentUser(updatedUser)) {
        this.authService.updateUser(updatedUser);
      }

      this.showToast('Utilisateur mis à jour avec succès.', 'success');
      this.closeUserModal();
      await this.loadData();
    } catch {
      this.showToast('Modification utilisateur impossible.', 'error');
    } finally {
      this.savingUser.set(false);
    }
  }

  async toggleUserRole(user: User): Promise<void> {
    if (this.isCurrentUser(user)) {
      this.showToast('Vous ne pouvez pas modifier votre propre rôle administrateur.', 'info');
      return;
    }

    const nextRole: UserRole = user.role === 'admin' ? 'client' : 'admin';
    const actionLabel =
      nextRole === 'admin' ? 'promouvoir cet utilisateur en administrateur' : 'retirer les droits administrateur';

    const ok = await this.openConfirm({
      title: nextRole === 'admin' ? 'Promouvoir administrateur' : 'Retirer les droits administrateur',
      message: `Voulez-vous ${actionLabel} pour ${user.fullName} ?`,
      detail: 'Vous pourrez annuler cette action plus tard en modifiant à nouveau le rôle.',
      variant: nextRole === 'admin' ? 'warning' : 'danger',
      confirmLabel: 'Confirmer',
      cancelLabel: 'Annuler'
    });

    if (!ok) {
      return;
    }

    this.changingUserRoleId.set(user.id);

    try {
      await firstValueFrom(this.apiService.updateUser(user.id, { role: nextRole }));
      this.showToast(
        nextRole === 'admin' ? 'Utilisateur promu administrateur.' : 'Droits administrateur retirés.',
        'success'
      );
      await this.loadData();
    } catch {
      this.showToast('Changement de rôle impossible.', 'error');
    } finally {
      this.changingUserRoleId.set(null);
    }
  }

  async deleteUser(user: User): Promise<void> {
    if (this.isCurrentUser(user)) {
      this.showToast('Vous ne pouvez pas supprimer votre propre compte.', 'info');
      return;
    }

    const ok = await this.openConfirm({
      title: 'Supprimer le compte',
      message: `Supprimer définitivement le compte de ${user.fullName} ?`,
      detail: 'Cette action est irréversible.',
      variant: 'danger',
      confirmLabel: 'Supprimer',
      cancelLabel: 'Annuler'
    });

    if (!ok) {
      return;
    }

    this.deletingUserId.set(user.id);

    try {
      await firstValueFrom(this.apiService.deleteUser(user.id));
      if (this.editingUser()?.id === user.id) {
        this.closeUserModal();
      }
      this.showToast('Utilisateur supprimé avec succès.', 'success');
      await this.loadData();
    } catch {
      this.showToast('Suppression utilisateur impossible.', 'error');
    } finally {
      this.deletingUserId.set(null);
    }
  }

  async toggleFeatured(product: Product): Promise<void> {
    try {
      await firstValueFrom(this.apiService.updateProduct(product.id, { featured: !product.featured }));
      this.showToast('Produit mis à jour.', 'success');
      await this.loadData();
    } catch {
      this.showToast('Mise à jour du produit impossible.', 'error');
    }
  }

  async restock(product: Product): Promise<void> {
    try {
      await firstValueFrom(this.apiService.updateProduct(product.id, { stock: product.stock + 20 }));
      this.showToast('Stock mis à jour.', 'success');
      await this.loadData();
    } catch {
      this.showToast('Réapprovisionnement impossible.', 'error');
    }
  }

  async deleteProduct(product: Product): Promise<void> {
    const ok = await this.openConfirm({
      title: 'Supprimer le produit',
      message: `Supprimer « ${product.name} » du catalogue ?`,
      detail: 'Cette action est irréversible.',
      variant: 'danger',
      confirmLabel: 'Supprimer',
      cancelLabel: 'Annuler'
    });

    if (!ok) {
      return;
    }

    try {
      await firstValueFrom(this.apiService.deleteProduct(product.id));
      if (this.editingProductId() === product.id) {
        this.closeEditModal();
      }
      this.showToast('Produit supprimé avec succès.', 'success');
      await this.loadData();
    } catch {
      this.showToast('Suppression impossible. Vérifiez votre session administrateur.', 'error');
    }
  }

  private resetCreateForm(): void {
    this.productForm.reset({
      name: '',
      slug: '',
      description: '',
      variety: '',
      category: '',
      grammage: '',
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
      const [summary, products, orders, users] = await Promise.all([
        firstValueFrom(this.apiService.getDashboardSummary()),
        firstValueFrom(this.apiService.getProducts()),
        firstValueFrom(this.apiService.getOrders()),
        firstValueFrom(this.apiService.getUsers())
      ]);

      this.summary.set(summary);
      this.products.set(products);
      this.orders.set(orders);
      this.users.set(users);
    } finally {
      this.loading.set(false);
    }
  }
}