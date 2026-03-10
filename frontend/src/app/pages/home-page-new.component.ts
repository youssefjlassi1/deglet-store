import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { AuthUiService } from '../core/auth-ui.service';

@Component({
  selector: 'app-home-page-new',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './home-page-new.component.html',
  styleUrl: './home-page-new.component.scss'
})
export class HomePageNewComponent implements OnInit {
  private readonly apiService = inject(ApiService);
  protected readonly authService = inject(AuthService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly authUiService = inject(AuthUiService);

  protected readonly loading = signal(false);
  protected readonly authError = signal('');
  protected readonly heroImageUrl = signal('/images/hero-dates.jpg');

  protected readonly loginForm = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  protected readonly registerForm = this.formBuilder.nonNullable.group({
    fullName: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  ngOnInit(): void {
    this.route.fragment.subscribe(fragment => {
      if (fragment === 'auth') {
        this.authUiService.open();
      }
    });
  }

  scrollToProducts(): void {
    const productsElement = document.getElementById('products');
    if (productsElement) {
      productsElement.scrollIntoView({ behavior: 'smooth' });
    } else {
      // Navigate to products page
      window.location.href = '/produits';
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
      this.loginForm.reset({ email: '', password: '' });
    } catch {
      this.authError.set('Impossible de se connecter. Vérifiez vos identifiants.');
    } finally {
      this.loading.set(false);
    }
  }

  async register(): Promise<void> {
    if (this.registerForm.invalid) {
      this.authError.set('Veuillez compléter correctement le formulaire d\'inscription.');
      return;
    }

    this.loading.set(true);
    this.authError.set('');

    try {
      const response = await firstValueFrom(this.apiService.register(this.registerForm.getRawValue()));
      this.authService.setSession(response);
      this.registerForm.reset({ fullName: '', email: '', phone: '', password: '' });
    } catch {
      this.authError.set('Inscription impossible. Essayez un autre email.');
    } finally {
      this.loading.set(false);
    }
  }

  logout(): void {
    this.authService.logout();
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = '/images/hero-dates.jpg';
  }
}
