import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { finalize } from 'rxjs';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import {
  IdentityManagementApiService,
  IdentityModule,
  ModulePayload,
} from '../../core/api/identity-management-api.service';

@Component({
  selector: 'app-modules-management',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TranslatePipe,
    ButtonModule,
    CardModule,
    DialogModule,
    InputTextModule,
    ProgressSpinnerModule,
    TableModule,
    TooltipModule,
  ],
  templateUrl: './modules-management.component.html',
  styleUrl: './modules-management.component.scss',
})
export class ModulesManagementComponent implements OnInit {
  private readonly api = inject(IdentityManagementApiService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly translate = inject(TranslateService);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly dialogVisible = signal(false);
  readonly selectedModule = signal<IdentityModule | null>(null);
  readonly modules = signal<IdentityModule[]>([]);

  readonly form = this.formBuilder.nonNullable.group({
    code: ['', [Validators.required, Validators.maxLength(128)]],
    name: ['', [Validators.required, Validators.maxLength(256)]],
  });

  ngOnInit(): void {
    this.loadModules();
  }

  loadModules(): void {
    this.loading.set(true);

    this.api.getModules()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (modules) => {
          this.modules.set([...modules].sort((left, right) => (left.code ?? '').localeCompare(right.code ?? '')));
        },
        error: (error) => this.showError(error, 'modules.messages.load_error'),
      });
  }

  openCreate(): void {
    this.selectedModule.set(null);
    this.form.reset({ code: '', name: '' });
    this.dialogVisible.set(true);
  }

  openEdit(module: IdentityModule): void {
    this.selectedModule.set(module);
    this.form.reset({
      code: module.code ?? '',
      name: module.name ?? '',
    });
    this.dialogVisible.set(true);
  }

  saveModule(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const module = this.selectedModule();
    const payload = this.buildPayload();
    const request = module?.id != null
      ? this.api.updateModule(module.id, payload)
      : this.api.createModule(payload);

    this.saving.set(true);
    request.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => {
        this.dialogVisible.set(false);
        this.showSuccess(module?.id != null ? 'modules.messages.update_success' : 'modules.messages.create_success');
        this.loadModules();
      },
      error: (error) => this.showError(error, module?.id != null ? 'modules.messages.update_error' : 'modules.messages.create_error'),
    });
  }

  confirmDelete(module: IdentityModule): void {
    if (module.id == null) {
      return;
    }

    this.confirmationService.confirm({
      header: this.translate.instant('modules.delete.title'),
      message: this.translate.instant('modules.delete.message', { name: module.name || module.code || '-' }),
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.deleteModule(module.id!),
    });
  }

  isInvalid(controlName: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[controlName];
    return control.invalid && (control.touched || control.dirty);
  }

  private deleteModule(moduleId: number): void {
    this.api.deleteModule(moduleId).subscribe({
      next: () => {
        this.showSuccess('modules.messages.delete_success');
        this.loadModules();
      },
      error: (error) => this.showError(error, 'modules.messages.delete_error'),
    });
  }

  private buildPayload(): ModulePayload {
    const value = this.form.getRawValue();
    return {
      code: value.code.trim(),
      name: value.name.trim(),
    };
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
