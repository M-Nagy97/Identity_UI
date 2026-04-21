import { Component, inject, signal } from '@angular/core';
import { AbstractControl, ReactiveFormsModule, FormBuilder, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { MessageService } from 'primeng/api';
import { AuthSessionService } from '../data/auth-session.service';

function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;

  if (!password || !confirmPassword || password === confirmPassword) {
    return null;
  }

  return { passwordMismatch: true };
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    TranslatePipe,
    ButtonModule,
    InputTextModule,
    PasswordModule,
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authSession = inject(AuthSessionService);
  private readonly messageService = inject(MessageService);
  private readonly translate = inject(TranslateService);
  private readonly router = inject(Router);

  readonly submitting = signal(false);

  readonly form = this.formBuilder.nonNullable.group(
    {
      name: ['', [Validators.required]],
      family: ['', [Validators.required]],
      username: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: passwordMatchValidator },
  );

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { confirmPassword, ...payload } = this.form.getRawValue();
    this.submitting.set(true);

    this.authSession
      .register(payload)
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: this.translate.instant('common.success'),
            detail: this.translate.instant('auth.register_success'),
          });
          void this.router.navigateByUrl('/login');
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: this.translate.instant('common.error'),
            detail: this.translate.instant('auth.register_error'),
          });
        },
      });
  }

  isInvalid(controlName: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[controlName];
    return control.invalid && (control.touched || control.dirty);
  }

  get passwordsDoNotMatch(): boolean {
    return this.form.hasError('passwordMismatch') &&
      (this.form.controls.confirmPassword.touched || this.form.controls.confirmPassword.dirty);
  }
}
