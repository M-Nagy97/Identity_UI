import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { finalize, map } from 'rxjs';
import { MessageService, MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { StepsModule } from 'primeng/steps';
import {
  CreateUserRequestDto,
  ProfileService,
  UpdateUserProfileRequestDto,
  UsersService,
} from '../../core/api/generated';

function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;

  if (!password || !confirmPassword || password === confirmPassword) {
    return null;
  }

  return { passwordMismatch: true };
}

@Component({
  selector: 'app-user-create',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TranslatePipe,
    ButtonModule,
    CardModule,
    CheckboxModule,
    InputTextareaModule,
    InputTextModule,
    PasswordModule,
    ProgressSpinnerModule,
    StepsModule,
  ],
  templateUrl: './user-create.component.html',
  styleUrl: './user-create.component.scss',
})
export class UserCreateComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly usersService = inject(UsersService);
  private readonly profileService = inject(ProfileService);
  private readonly messageService = inject(MessageService);
  private readonly translate = inject(TranslateService);
  private readonly router = inject(Router);

  readonly creatingUser = signal(false);
  readonly savingProfile = signal(false);
  readonly activeIndex = signal(0);
  readonly stepItems = signal<MenuItem[]>([]);
  readonly createdUserId = signal<string | null>(null);
  readonly createdUserName = signal<string>('');
  readonly createdUserEmail = signal<string>('');

  readonly accountForm = this.formBuilder.nonNullable.group(
    {
      userName: ['', [Validators.required, Validators.maxLength(64)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(256)]],
      password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(128)]],
      confirmPassword: ['', [Validators.required]],
      isActive: true,
    },
    { validators: passwordMatchValidator },
  );

  readonly profileForm = this.formBuilder.nonNullable.group({
    displayName: ['', [Validators.required, Validators.maxLength(160)]],
    firstName: ['', [Validators.maxLength(100)]],
    lastName: ['', [Validators.maxLength(100)]],
    phoneNumber: ['', [Validators.maxLength(30)]],
    avatarUrl: ['', [Validators.maxLength(600)]],
    timeZone: ['', [Validators.maxLength(100)]],
    preferredLanguage: ['', [Validators.maxLength(16)]],
    bio: ['', [Validators.maxLength(1000)]],
  });

  ngOnInit(): void {
    this.updateStepItems();
    this.translate.onLangChange.subscribe(() => this.updateStepItems());
  }

  completeAccountStep(): void {
    if (this.createdUserId()) {
      this.activeIndex.set(1);
      return;
    }

    if (this.accountForm.invalid) {
      this.accountForm.markAllAsTouched();
      return;
    }

    this.creatingUser.set(true);

    this.usersService
      .apiUsersPost(this.buildCreatePayload())
      .pipe(finalize(() => this.creatingUser.set(false)))
      .subscribe({
        next: (user) => {
          const userId = user.id ?? null;
          const userName = user.userName ?? this.accountForm.controls.userName.value;
          const email = user.email ?? this.accountForm.controls.email.value;

          this.createdUserId.set(userId);
          this.createdUserName.set(userName);
          this.createdUserEmail.set(email);
          this.accountForm.disable({ emitEvent: false });

          if (!this.profileForm.controls.displayName.value.trim()) {
            this.profileForm.controls.displayName.setValue(userName);
          }

          this.messageService.add({
            severity: 'success',
            summary: this.translate.instant('common.success'),
            detail: this.translate.instant('users.messages.create_success', {
              userName,
            }),
          });

          this.activeIndex.set(1);
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: this.translate.instant('common.error'),
            detail: this.extractErrorMessage(error, this.translate.instant('users.messages.create_error')),
          });
        },
      });
  }

  goBackToAccount(): void {
    this.activeIndex.set(0);
  }

  skipProfile(): void {
    this.messageService.add({
      severity: 'success',
      summary: this.translate.instant('common.success'),
      detail: this.translate.instant('users.messages.profile_skipped', {
        userName: this.createdUserName(),
      }),
    });

    void this.router.navigateByUrl('/dashboard');
  }

  saveProfile(): void {
    if (!this.createdUserId()) {
      this.activeIndex.set(0);
      return;
    }

    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.savingProfile.set(true);

    this.profileService
      .apiProfileUserIdPut(this.createdUserId()!, this.buildProfilePayload())
      .pipe(finalize(() => this.savingProfile.set(false)))
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: this.translate.instant('common.success'),
            detail: this.translate.instant('users.messages.profile_success', {
              userName: this.createdUserName(),
            }),
          });

          void this.router.navigateByUrl('/dashboard');
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: this.translate.instant('common.error'),
            detail: this.extractErrorMessage(error, this.translate.instant('users.messages.profile_error')),
          });
        },
      });
  }

  private updateStepItems(): void {
    this.stepItems.set([
      { label: this.translate.instant('users.steps.account') },
      { label: this.translate.instant('users.steps.profile') },
    ]);
  }



  private buildCreatePayload(): CreateUserRequestDto {
    const value = this.accountForm.getRawValue();

    return {
      userName: value.userName.trim(),
      email: value.email.trim(),
      password: value.password,
      isActive: value.isActive,
    };
  }

  private buildProfilePayload(): UpdateUserProfileRequestDto {
    const value = this.profileForm.getRawValue();

    return {
      displayName: value.displayName.trim(),
      firstName: this.toNullable(value.firstName),
      lastName: this.toNullable(value.lastName),
      phoneNumber: this.toNullable(value.phoneNumber),
      avatarUrl: this.toNullable(value.avatarUrl),
      timeZone: this.toNullable(value.timeZone),
      preferredLanguage: this.toNullable(value.preferredLanguage),
      bio: this.toNullable(value.bio),
    };
  }

  private toNullable(value: string): string | null {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }

  private extractErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof Error && error.message) {
      return error.message;
    }

    if (error instanceof HttpErrorResponse) {
      const title = error.error?.title as string | undefined;
      const errorBag = error.error?.errors as Record<string, string[]> | undefined;

      if (errorBag) {
        const validationMessages = Object.values(errorBag).flat().filter(Boolean);
        if (validationMessages.length) {
          return validationMessages.join(' ');
        }
      }

      if (title) {
        return title;
      }

      if (typeof error.error === 'string' && error.error.trim()) {
        return error.error;
      }
    }

    return fallback;
  }

  isAccountInvalid(controlName: keyof typeof this.accountForm.controls): boolean {
    const control = this.accountForm.controls[controlName];
    return control.invalid && (control.touched || control.dirty);
  }

  isProfileInvalid(controlName: keyof typeof this.profileForm.controls): boolean {
    const control = this.profileForm.controls[controlName];
    return control.invalid && (control.touched || control.dirty);
  }

  get passwordsDoNotMatch(): boolean {
    return this.accountForm.hasError('passwordMismatch') &&
      (this.accountForm.controls.confirmPassword.touched || this.accountForm.controls.confirmPassword.dirty);
  }
}
