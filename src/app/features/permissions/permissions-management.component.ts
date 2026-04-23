import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { finalize, forkJoin } from 'rxjs';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import {
  IdentityManagementApiService,
  IdentityModule,
  IdentityPermission,
  PermissionPayload,
} from '../../core/api/identity-management-api.service';

interface SelectOption {
  label: string;
  value: number;
}

@Component({
  selector: 'app-permissions-management',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TranslatePipe,
    ButtonModule,
    CardModule,
    DialogModule,
    DropdownModule,
    InputTextModule,
    InputTextareaModule,
    ProgressSpinnerModule,
    TableModule,
    TooltipModule,
  ],
  templateUrl: './permissions-management.component.html',
  styleUrl: './permissions-management.component.scss',
})
export class PermissionsManagementComponent implements OnInit {
  private readonly api = inject(IdentityManagementApiService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly translate = inject(TranslateService);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly dialogVisible = signal(false);
  readonly selectedPermission = signal<IdentityPermission | null>(null);
  readonly permissions = signal<IdentityPermission[]>([]);
  readonly modules = signal<IdentityModule[]>([]);

  readonly form = this.formBuilder.group({
    code: ['', [Validators.required, Validators.maxLength(128)]],
    name: ['', [Validators.required, Validators.maxLength(256)]],
    description: ['', [Validators.maxLength(500)]],
    moduleId: [null as number | null, [Validators.required]],
  });

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);

    forkJoin({
      permissions: this.api.getPermissions(),
      modules: this.api.getModules(),
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ permissions, modules }) => {
          this.permissions.set([...permissions].sort((left, right) => (left.code ?? '').localeCompare(right.code ?? '')));
          this.modules.set([...modules].sort((left, right) => (left.code ?? '').localeCompare(right.code ?? '')));
        },
        error: (error) => this.showError(error, 'permissions.messages.load_error'),
      });
  }

  openCreate(): void {
    this.selectedPermission.set(null);
    this.form.reset({
      code: '',
      name: '',
      description: '',
      moduleId: null,
    });
    this.dialogVisible.set(true);
  }

  openEdit(permission: IdentityPermission): void {
    this.selectedPermission.set(permission);
    this.form.reset({
      code: permission.code ?? '',
      name: permission.name ?? '',
      description: permission.description ?? '',
      moduleId: permission.moduleId ?? null,
    });
    this.dialogVisible.set(true);
  }

  savePermission(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const permission = this.selectedPermission();
    const payload = this.buildPayload();
    const request = permission?.id != null
      ? this.api.updatePermission(permission.id, payload)
      : this.api.createPermission(payload);

    this.saving.set(true);
    request.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => {
        this.dialogVisible.set(false);
        this.showSuccess(
          permission?.id != null
            ? 'permissions.messages.update_success'
            : 'permissions.messages.create_success',
        );
        this.loadData();
      },
      error: (error) => this.showError(
        error,
        permission?.id != null
          ? 'permissions.messages.update_error'
          : 'permissions.messages.create_error',
      ),
    });
  }

  confirmDelete(permission: IdentityPermission): void {
    if (permission.id == null) {
      return;
    }

    this.confirmationService.confirm({
      header: this.translate.instant('permissions.delete.title'),
      message: this.translate.instant('permissions.delete.message', {
        name: permission.name || permission.code || '-',
      }),
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.deletePermission(permission.id!),
    });
  }

  moduleOptions(): SelectOption[] {
    return this.modules()
      .filter((module) => module.id != null)
      .map((module) => ({
        label: `${module.name || module.code || module.id} (${module.code || module.id})`,
        value: module.id!,
      }));
  }

  moduleLabel(moduleId: number | null | undefined): string {
    if (moduleId == null) {
      return '-';
    }

    const module = this.modules().find((item) => item.id === moduleId);
    return module?.name || module?.code || `${moduleId}`;
  }

  isInvalid(controlName: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[controlName];
    return control.invalid && (control.touched || control.dirty);
  }

  private deletePermission(permissionId: number): void {
    this.api.deletePermission(permissionId).subscribe({
      next: () => {
        this.showSuccess('permissions.messages.delete_success');
        this.loadData();
      },
      error: (error) => this.showError(error, 'permissions.messages.delete_error'),
    });
  }

  private buildPayload(): PermissionPayload {
    const value = this.form.getRawValue();
    return {
      code: (value.code ?? '').trim(),
      name: (value.name ?? '').trim(),
      description: this.toNullable(value.description ?? ''),
      moduleId: value.moduleId!,
    };
  }

  private toNullable(value: string): string | null {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }

  private showSuccess(key: string): void {
    this.messageService.add({
      severity: 'success',
      summary: this.translate.instant('common.success'),
      detail: this.translate.instant(key),
    });
  }

  private showError(error: unknown, fallbackKey: string): void {
    this.messageService.add({
      severity: 'error',
      summary: this.translate.instant('common.error'),
      detail: this.extractErrorMessage(error, this.translate.instant(fallbackKey)),
    });
  }

  private extractErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse) {
      const errorBag = error.error?.errors as Record<string, string[]> | undefined;
      if (errorBag) {
        const validationMessages = Object.values(errorBag).flat().filter(Boolean);
        if (validationMessages.length) {
          return validationMessages.join(' ');
        }
      }

      const title = error.error?.title as string | undefined;
      if (title) {
        return title;
      }

      if (typeof error.error === 'string' && error.error.trim()) {
        return error.error;
      }
    }

    if (error instanceof Error && error.message) {
      return error.message;
    }

    return fallback;
  }
}
