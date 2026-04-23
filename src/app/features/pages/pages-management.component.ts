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
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import {
  IdentityManagementApiService,
  IdentityModule,
  IdentityPage,
  IdentityPermission,
  PagePayload,
} from '../../core/api/identity-management-api.service';

interface SelectOption {
  label: string;
  value: number | null;
}

@Component({
  selector: 'app-pages-management',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TranslatePipe,
    ButtonModule,
    CardModule,
    DialogModule,
    DropdownModule,
    InputTextModule,
    ProgressSpinnerModule,
    TableModule,
    TooltipModule,
  ],
  templateUrl: './pages-management.component.html',
  styleUrl: './pages-management.component.scss',
})
export class PagesManagementComponent implements OnInit {
  private readonly api = inject(IdentityManagementApiService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly translate = inject(TranslateService);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly dialogVisible = signal(false);
  readonly selectedPage = signal<IdentityPage | null>(null);
  readonly pages = signal<IdentityPage[]>([]);
  readonly modules = signal<IdentityModule[]>([]);
  readonly permissions = signal<IdentityPermission[]>([]);

  readonly form = this.formBuilder.group({
    code: ['', [Validators.required, Validators.maxLength(128)]],
    name: ['', [Validators.required, Validators.maxLength(256)]],
    urlPath: ['', [Validators.maxLength(600)]],
    parentId: [null as number | null],
    moduleId: [null as number | null],
    permissionId: [null as number | null],
  });

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);

    forkJoin({
      pages: this.api.getPages(),
      modules: this.api.getModules(),
      permissions: this.api.getPermissions(),
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ pages, modules, permissions }) => {
          this.pages.set([...pages].sort((left, right) => (left.code ?? '').localeCompare(right.code ?? '')));
          this.modules.set([...modules].sort((left, right) => (left.code ?? '').localeCompare(right.code ?? '')));
          this.permissions.set([...permissions].sort((left, right) => (left.code ?? '').localeCompare(right.code ?? '')));
        },
        error: (error) => this.showError(error, 'pages.messages.load_error'),
      });
  }

  openCreate(): void {
    this.selectedPage.set(null);
    this.form.reset({
      code: '',
      name: '',
      urlPath: '',
      parentId: null,
      moduleId: null,
      permissionId: null,
    });
    this.dialogVisible.set(true);
  }

  openEdit(page: IdentityPage): void {
    this.selectedPage.set(page);
    this.form.reset({
      code: page.code ?? '',
      name: page.name ?? '',
      urlPath: page.urlPath ?? '',
      parentId: page.parentId ?? null,
      moduleId: page.moduleId ?? null,
      permissionId: page.permissionId ?? null,
    });
    this.dialogVisible.set(true);
  }

  savePage(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const page = this.selectedPage();
    const payload = this.buildPayload();
    const request = page?.id != null
      ? this.api.updatePage(page.id, payload)
      : this.api.createPage(payload);

    this.saving.set(true);
    request.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => {
        this.dialogVisible.set(false);
        this.showSuccess(page?.id != null ? 'pages.messages.update_success' : 'pages.messages.create_success');
        this.loadData();
      },
      error: (error) => this.showError(error, page?.id != null ? 'pages.messages.update_error' : 'pages.messages.create_error'),
    });
  }

  confirmDelete(page: IdentityPage): void {
    if (page.id == null) {
      return;
    }

    this.confirmationService.confirm({
      header: this.translate.instant('pages.delete.title'),
      message: this.translate.instant('pages.delete.message', { name: page.name || page.code || '-' }),
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.deletePage(page.id!),
    });
  }

  parentPageOptions(): SelectOption[] {
    const selectedId = this.selectedPage()?.id ?? null;
    return this.pages()
      .filter((page) => page.id != null && page.id !== selectedId)
      .map((page) => ({
        label: `${page.name || page.code || page.id} (${page.code || page.id})`,
        value: page.id!,
      }));
  }

  moduleOptions(): SelectOption[] {
    return this.modules()
      .filter((module) => module.id != null)
      .map((module) => ({
        label: `${module.name || module.code || module.id} (${module.code || module.id})`,
        value: module.id!,
      }));
  }

  permissionOptions(): SelectOption[] {
    return this.permissions()
      .filter((permission) => permission.id != null)
      .map((permission) => ({
        label: `${permission.name || permission.code || permission.id} (${permission.code || permission.id})`,
        value: permission.id!,
      }));
  }

  moduleLabel(moduleId: number | null | undefined): string {
    if (moduleId == null) {
      return '-';
    }

    const module = this.modules().find((item) => item.id === moduleId);
    return module?.name || module?.code || `${moduleId}`;
  }

  permissionLabel(permissionId: number | null | undefined): string {
    if (permissionId == null) {
      return '-';
    }

    const permission = this.permissions().find((item) => item.id === permissionId);
    return permission?.name || permission?.code || `${permissionId}`;
  }

  parentLabel(parentId: number | null | undefined): string {
    if (parentId == null) {
      return '-';
    }

    const page = this.pages().find((item) => item.id === parentId);
    return page?.name || page?.code || `${parentId}`;
  }

  isInvalid(controlName: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[controlName];
    return control.invalid && (control.touched || control.dirty);
  }

  private deletePage(pageId: number): void {
    this.api.deletePage(pageId).subscribe({
      next: () => {
        this.showSuccess('pages.messages.delete_success');
        this.loadData();
      },
      error: (error) => this.showError(error, 'pages.messages.delete_error'),
    });
  }

  private buildPayload(): PagePayload {
    const value = this.form.getRawValue();
    return {
      code: (value.code ?? '').trim(),
      name: (value.name ?? '').trim(),
      urlPath: this.toNullable(value.urlPath ?? ''),
      parentId: value.parentId ?? null,
      moduleId: value.moduleId ?? null,
      permissionId: value.permissionId ?? null,
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
