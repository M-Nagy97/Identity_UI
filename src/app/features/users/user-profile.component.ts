import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { finalize, map } from 'rxjs';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import {
  UpdateUserProfileRequestDto,
  ProfileService,
  UserDto,
  UsersService,
} from '../../core/api/generated';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TranslatePipe,
    ButtonModule,
    CardModule,
    DropdownModule,
    InputTextareaModule,
    InputTextModule,
    ProgressSpinnerModule,
  ],
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.scss',
})
export class UserProfileComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly usersService = inject(UsersService);
  private readonly profileService = inject(ProfileService);
  private readonly messageService = inject(MessageService);
  private readonly translate = inject(TranslateService);
  private readonly route = inject(ActivatedRoute);

  readonly loadingUsers = signal(true);
  readonly submitting = signal(false);
  readonly users = signal<UserDto[]>([]);

  readonly form = this.formBuilder.nonNullable.group({
    userId: ['', [Validators.required]],
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
    this.loadUsers();
  }

  saveProfile(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    this.submitting.set(true);

    this.profileService
      .apiProfileUserIdPut(value.userId, this.buildProfilePayload())
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: this.translate.instant('common.success'),
            detail: this.translate.instant('users.messages.profile_success', {
              userName: this.selectedUserName(),
            }),
          });
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

  selectedUserName(): string {
    const userId = this.form.controls.userId.value;
    const selectedUser = this.users().find((user) => user.id === userId);
    return selectedUser?.userName ?? this.translate.instant('users.profile_page.selected_user_empty');
  }

  selectedUserEmail(): string | null {
    const userId = this.form.controls.userId.value;
    const selectedUser = this.users().find((user) => user.id === userId);
    return selectedUser?.email ?? null;
  }

  private loadUsers(): void {
    this.loadingUsers.set(true);

    this.usersService.apiUsersGet()
      .pipe(
        map((users) =>
          [...users]
            .filter((user) => !!user.id && !user.isDeleted)
            .sort((left, right) => (left.userName ?? '').localeCompare(right.userName ?? '')),
        ),
        finalize(() => this.loadingUsers.set(false)),
      )
      .subscribe({
        next: (users) => {
          this.users.set(users);
          const queryUserId = this.route.snapshot.queryParamMap.get('userId');
          if (queryUserId && users.some((user) => user.id === queryUserId)) {
            this.form.controls.userId.setValue(queryUserId);
          }
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: this.translate.instant('common.error'),
            detail: this.extractErrorMessage(
              error,
              this.translate.instant('users.messages.load_users_error'),
            ),
          });
        },
      });
  }

  private buildProfilePayload(): UpdateUserProfileRequestDto {
    const value = this.form.getRawValue();

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

  isInvalid(controlName: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[controlName];
    return control.invalid && (control.touched || control.dirty);
  }
}
