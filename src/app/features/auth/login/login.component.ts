import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { MessageService } from 'primeng/api';
import { AuthSessionService } from '../data/auth-session.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    TranslatePipe,
    ButtonModule,
    CheckboxModule,
    InputTextModule,
    PasswordModule,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authSession = inject(AuthSessionService);
  private readonly messageService = inject(MessageService);
  private readonly translate = inject(TranslateService);
  private readonly router = inject(Router);

  readonly submitting = signal(false);

  readonly form = this.formBuilder.nonNullable.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    rememberMe: [true],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { username, password } = this.form.getRawValue();
    this.submitting.set(true);

    this.authSession
      .login({ username, password })
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: this.translate.instant('common.success'),
            detail: this.translate.instant('auth.login_success'),
          });
          void this.router.navigateByUrl('/dashboard');
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: this.translate.instant('common.error'),
            detail: this.translate.instant('auth.login_error'),
          });
        },
      });
  }

  isInvalid(controlName: 'username' | 'password'): boolean {
    const control = this.form.controls[controlName];
    return control.invalid && (control.touched || control.dirty);
  }
}
