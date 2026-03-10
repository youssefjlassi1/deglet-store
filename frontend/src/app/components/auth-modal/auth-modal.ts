import { Component, EventEmitter, Output, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-auth-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './auth-modal.html',
  styleUrl: './auth-modal.scss'
})
export class AuthModal {
  @Output() close = new EventEmitter<void>();

  private readonly apiService = inject(ApiService);
  private readonly authService = inject(AuthService);
  private readonly formBuilder = inject(FormBuilder);

  protected readonly isLoginView = signal(true);
  protected readonly loading = signal(false);
  protected readonly authError = signal('');
  protected readonly showPassword = signal(false);

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

  toggleView(): void {
    this.isLoginView.set(!this.isLoginView());
    this.authError.set('');
    this.showPassword.set(false);
  }

  togglePassword(): void {
    this.showPassword.set(!this.showPassword());
  }

  closeModal(): void {
    this.close.emit();
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
      this.closeModal();
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
      this.registerForm.reset({ fullName: '', email: '', phone: '', password: '' });
      this.closeModal();
    } catch {
      this.authError.set('Inscription impossible. Essayez un autre email.');
    } finally {
      this.loading.set(false);
    }
  }
}

