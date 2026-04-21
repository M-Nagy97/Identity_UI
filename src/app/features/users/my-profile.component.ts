import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { finalize } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import {
  ProfileService,
  UpdateUserProfileRequestDto,
  UserProfileDto,
} from '../../core/api/generated';
import { AuthSessionService } from '../auth/data/auth-session.service';

@Component({
  selector: 'app-my-profile',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TranslatePipe,
    ButtonModule,
    CardModule,
    InputTextModule,
    InputTextareaModule,
    ProgressSpinnerModule,
  ],
  templateUrl: './my-profile.component.html',
  styleUrl: './my-profile.component.scss',
})
export class MyProfileComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly profileService = inject(ProfileService);
  private readonly messageService = inject(MessageService);
  private readonly translate = inject(TranslateService);
  private readonly authSession = inject(AuthSessionService);

  readonly loading = signal(true);
  readonly submitting = signal(false);
  readonly editing = signal(false);
  readonly profile = signal<UserProfileDto | null>(null);

  readonly form = this.formBuilder.nonNullable.group({
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
    this.loadProfile();
  }

  toggleEdit(): void {
    if (!this.editing()) {
      // Entering edit mode — populate form from profile
      const p = this.profile();
      if (p) {
        this.form.patchValue({
          displayName: p.displayName ?? '',
          firstName: p.firstName ?? '',
          lastName: p.lastName ?? '',
          phoneNumber: p.phoneNumber ?? '',
          avatarUrl: p.avatarUrl ?? '',
          timeZone: p.timeZone ?? '',
          preferredLanguage: p.preferredLanguage ?? '',
          bio: p.bio ?? '',
        });
      }
    }
    this.editing.update((v) => !v);
  }

  cancelEdit(): void {
    this.editing.set(false);
  }

  saveProfile(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const userId = this.authSession.currentUserId();
    if (!userId) return;

    this.submitting.set(true);

    this.profileService
      .apiProfileUserIdPut(userId, this.buildPayload())
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: (updated) => {
          this.profile.set(updated);
          this.editing.set(false);
          this.messageService.add({
            severity: 'success',
            summary: this.translate.instant('common.success'),
            detail: this.translate.instant('users.my_profile.save_success'),
          });
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: this.translate.instant('common.error'),
            detail: this.extractErrorMessage(error, this.translate.instant('users.my_profile.save_error')),
          });
        },
      });
  }

  private loadProfile(): void {
    const userId = this.authSession.currentUserId();
    if (!userId) {
      this.loading.set(false);
      return;
    }

    this.loading.set(true);

    this.profileService
      .apiProfileUserIdGet(userId)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (profile) => {
          this.profile.set(profile);
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: this.translate.instant('common.error'),
            detail: this.extractErrorMessage(error, this.translate.instant('users.my_profile.load_error')),
          });
        },
      });
  }

  private buildPayload(): UpdateUserProfileRequestDto {
    const v = this.form.getRawValue();
    return {
      displayName: v.displayName.trim(),
      firstName: this.toNullable(v.firstName),
      lastName: this.toNullable(v.lastName),
      phoneNumber: this.toNullable(v.phoneNumber),
      avatarUrl: this.toNullable(v.avatarUrl),
      timeZone: this.toNullable(v.timeZone),
      preferredLanguage: this.toNullable(v.preferredLanguage),
      bio: this.toNullable(v.bio),
    };
  }

  private toNullable(value: string): string | null {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }

  private extractErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse) {
      const errorBag = error.error?.errors as Record<string, string[]> | undefined;
      if (errorBag) {
        const messages = Object.values(errorBag).flat().filter(Boolean);
        if (messages.length) return messages.join(' ');
      }
      const title = error.error?.title as string | undefined;
      if (title) return title;
      if (typeof error.error === 'string' && error.error.trim()) return error.error;
    }
    if (error instanceof Error && error.message) return error.message;
    return fallback;
  }

  isInvalid(controlName: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[controlName];
    return control.invalid && (control.touched || control.dirty);
  }
}
