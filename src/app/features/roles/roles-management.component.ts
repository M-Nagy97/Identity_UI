import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { finalize, forkJoin } from 'rxjs';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import {
  IdentityManagementApiService,
  IdentityPermission,
  IdentityRole,
  RolePayload,
} from '../../core/api/identity-management-api.service';
import { RoleDialogComponent } from './components/role-dialog/role-dialog.component';
import { RolePermissionsDialogComponent } from './components/role-permissions-dialog/role-permissions-dialog.component';

@Component({
  selector: 'app-roles-management',
  standalone: true,
  imports: [
    TranslatePipe,
    ButtonModule,
    CardModule,
    ProgressSpinnerModule,
    TableModule,
    TooltipModule,
    RoleDialogComponent,
    RolePermissionsDialogComponent,
  ],
  templateUrl: './roles-management.component.html',
  styleUrl: './roles-management.component.scss',
})
export class RolesManagementComponent implements OnInit {
  private readonly api = inject(IdentityManagementApiService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly translate = inject(TranslateService);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly permissionsLoading = signal(false);
  readonly permissionsSaving = signal(false);
  readonly roles = signal<IdentityRole[]>([]);
  readonly roleDialogVisible = signal(false);
  readonly permissionsDialogVisible = signal(false);
  readonly selectedRole = signal<IdentityRole | null>(null);
  readonly permissions = signal<IdentityPermission[]>([]);
  readonly selectedPermissionIds = signal<number[]>([]);

  ngOnInit(): void {
    this.loadRoles();
  }

  loadRoles(): void {
    this.loading.set(true);

    this.api.getRoles()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (roles) => {
          this.roles.set([...roles].sort((left, right) => (left.name ?? '').localeCompare(right.name ?? '')));
        },
        error: (error) => this.showError(error, 'roles.messages.load_error'),
      });
  }

  openCreate(): void {
    this.selectedRole.set(null);
    this.roleDialogVisible.set(true);
  }

  openEdit(role: IdentityRole): void {
    this.selectedRole.set(role);
    this.roleDialogVisible.set(true);
  }

  saveRole(payload: RolePayload): void {
    const role = this.selectedRole();
    const request = role?.id
      ? this.api.updateRole(role.id, payload)
      : this.api.createRole(payload);

    this.saving.set(true);
    request.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => {
        this.roleDialogVisible.set(false);
        this.showSuccess(role?.id ? 'roles.messages.update_success' : 'roles.messages.create_success');
        this.loadRoles();
      },
      error: (error) => this.showError(error, role?.id ? 'roles.messages.update_error' : 'roles.messages.create_error'),
    });
  }

  confirmDelete(role: IdentityRole): void {
    if (!role.id) {
      return;
    }

    this.confirmationService.confirm({
      header: this.translate.instant('roles.delete.title'),
      message: this.translate.instant('roles.delete.message', { name: role.name || '-' }),
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.deleteRole(role.id!),
    });
  }

  openPermissions(role: IdentityRole): void {
    if (!role.id) {
      return;
    }

    this.selectedRole.set(role);
    this.permissionsDialogVisible.set(true);
    this.permissionsLoading.set(true);

    forkJoin({
      all: this.api.getPermissions(),
      assigned: this.api.getRolePermissions(role.id),
    })
      .pipe(finalize(() => this.permissionsLoading.set(false)))
      .subscribe({
        next: ({ all, assigned }) => {
          this.permissions.set([...all].sort((left, right) => (left.code ?? '').localeCompare(right.code ?? '')));
          this.selectedPermissionIds.set(
            assigned
              .map((permission) => permission.id)
              .filter((id): id is number => id != null),
          );
        },
        error: (error) => this.showError(error, 'roles.permissions.load_error'),
      });
  }

  savePermissions(permissionIds: number[]): void {
    const role = this.selectedRole();
    if (!role?.id) {
      return;
    }

    this.permissionsSaving.set(true);
    this.api.updateRolePermissions(role.id, permissionIds)
      .pipe(finalize(() => this.permissionsSaving.set(false)))
      .subscribe({
        next: () => {
          this.permissionsDialogVisible.set(false);
          this.showSuccess('roles.permissions.save_success');
        },
        error: (error) => this.showError(error, 'roles.permissions.save_error'),
      });
  }

  private deleteRole(roleId: string): void {
    this.api.deleteRole(roleId).subscribe({
      next: () => {
        this.showSuccess('roles.messages.delete_success');
        this.loadRoles();
      },
      error: (error) => this.showError(error, 'roles.messages.delete_error'),
    });
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
