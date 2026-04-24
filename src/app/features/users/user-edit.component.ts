import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { finalize, forkJoin } from 'rxjs';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import {
  ModuleDto,
  ModulesService,
  RoleDto,
  RolesService,
  UpdateUserProfileRequestDto,
  UpdateUserRequestDto,
  UserFullDetailsDto,
  UsersService,
  ProfileService,
} from '../../core/api/generated';

type RoleOption = {
  name: string;
  description: string | null;
};

type ModuleOption = {
  id: number;
  code: string;
  name: string;
  label: string;
};

@Component({
  selector: 'app-user-edit',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    TranslatePipe,
    ButtonModule,
    CardModule,
    CheckboxModule,
    InputTextareaModule,
    InputTextModule,
    MultiSelectModule,
    ProgressSpinnerModule,
  ],
  templateUrl: './user-edit.component.html',
  styleUrl: './user-edit.component.scss',
})
export class UserEditComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly usersService = inject(UsersService);
  private readonly rolesService = inject(RolesService);
  private readonly modulesService = inject(ModulesService);
  private readonly profileService = inject(ProfileService);
  private readonly messageService = inject(MessageService);
  private readonly translate = inject(TranslateService);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly userId = signal<string>('');
  readonly availableRoles = signal<RoleOption[]>([]);
  readonly availableModules = signal<ModuleOption[]>([]);

  readonly accountForm = this.formBuilder.nonNullable.group({
    userName: ['', [Validators.required, Validators.maxLength(64)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(256)]],
    isActive: true,
    roles: this.formBuilder.nonNullable.control<string[]>([]),
    moduleIds: this.formBuilder.nonNullable.control<number[]>([]),
  });

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
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      void this.router.navigateByUrl('/users/list');
      return;
    }

    this.userId.set(id);
    this.loadUser(id);
  }

  save(): void {
    if (this.accountForm.invalid || this.profileForm.invalid) {
      this.accountForm.markAllAsTouched();
      this.profileForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);

    forkJoin({
      account: this.usersService.apiUsersIdPut(this.userId(), this.buildAccountPayload()),
      profile: this.profileService.apiProfileUserIdPut(this.userId(), this.buildProfilePayload()),
    })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: this.translate.instant('common.success'),
            detail: this.translate.instant('users.edit.save_success'),
          });
          void this.router.navigateByUrl('/users/list');
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: this.translate.instant('common.error'),
            detail: this.extractErrorMessage(error, this.translate.instant('users.edit.save_error')),
          });
        },
      });
  }

  private loadUser(id: string): void {
    this.loading.set(true);

    forkJoin({
      user: this.usersService.apiUsersIdFullGet(id),
      roles: this.rolesService.apiRolesGet(),
      modules: this.modulesService.apiModulesGet(),
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ user, roles, modules }) => {
          this.availableRoles.set(this.mapRoleOptions(roles ?? []));
          this.availableModules.set(this.mapModuleOptions(modules ?? []));
          this.patchForms(user);
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: this.translate.instant('common.error'),
            detail: this.extractErrorMessage(error, this.translate.instant('users.edit.load_error')),
          });
        },
      });
  }

  private patchForms(user: UserFullDetailsDto): void {
    this.accountForm.patchValue({
      userName: user.userName ?? '',
      email: user.email ?? '',
      isActive: user.isActive ?? true,
      roles: this.normalizeRoleNames((user.roles ?? []).map((role) => role.name)),
      moduleIds: this.normalizeModuleIds((user.modules ?? []).map((module) => module.id)),
    });

    this.profileForm.patchValue({
      displayName: user.profile?.displayName ?? user.userName ?? '',
      firstName: user.profile?.firstName ?? '',
      lastName: user.profile?.lastName ?? '',
      phoneNumber: user.profile?.phoneNumber ?? '',
      avatarUrl: user.profile?.avatarUrl ?? '',
      timeZone: user.profile?.timeZone ?? '',
      preferredLanguage: user.profile?.preferredLanguage ?? '',
      bio: user.profile?.bio ?? '',
    });
  }

  private buildAccountPayload(): UpdateUserRequestDto {
    const value = this.accountForm.getRawValue();

    return {
      userName: value.userName.trim(),
      email: value.email.trim(),
      isActive: value.isActive,
      roles: this.normalizeRoleNames(value.roles),
      moduleIds: this.normalizeModuleIds(value.moduleIds),
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

  private mapRoleOptions(roles: ReadonlyArray<RoleDto>): RoleOption[] {
    return [...roles]
      .map((role) => ({
        name: role.name?.trim() ?? '',
        description: role.description ?? null,
      }))
      .filter((role) => role.name.length > 0)
      .sort((left, right) => left.name.localeCompare(right.name));
  }

  private mapModuleOptions(modules: ReadonlyArray<ModuleDto>): ModuleOption[] {
    return [...modules]
      .filter((module): module is Required<Pick<ModuleDto, 'id'>> & ModuleDto => module.id != null)
      .map((module) => {
        const name = module.name?.trim() ?? '';
        const code = module.code?.trim() ?? '';

        return {
          id: module.id,
          code,
          name,
          label: code && name ? `${name} (${code})` : name || code || `#${module.id}`,
        };
      })
      .sort((left, right) => left.name.localeCompare(right.name));
  }

  private normalizeRoleNames(roleNames: ReadonlyArray<string | null | undefined>): string[] {
    return [...new Set(
      roleNames
        .map((roleName) => roleName?.trim() ?? '')
        .filter((roleName) => roleName.length > 0),
    )];
  }

  private normalizeModuleIds(moduleIds: ReadonlyArray<number | null | undefined>): number[] {
    return [...new Set(
      moduleIds.filter((moduleId): moduleId is number => typeof moduleId === 'number' && moduleId > 0),
    )];
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
}
