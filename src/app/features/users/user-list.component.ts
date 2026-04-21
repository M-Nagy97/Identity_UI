import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { finalize } from 'rxjs';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { UserDto, UsersService } from '../../core/api/generated';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    RouterLink,
    TranslatePipe,
    ButtonModule,
    CardModule,
    ProgressSpinnerModule,
    TableModule,
    TagModule,
    TooltipModule,
  ],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.scss',
})
export class UserListComponent implements OnInit {
  private readonly usersService = inject(UsersService);
  private readonly messageService = inject(MessageService);
  private readonly translate = inject(TranslateService);

  readonly loading = signal(true);
  readonly users = signal<UserDto[]>([]);

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading.set(true);

    this.usersService.apiUsersGet()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (users) => {
          this.users.set(
            [...users]
              .filter((user) => !user.isDeleted)
              .sort((left, right) => (left.userName ?? '').localeCompare(right.userName ?? '')),
          );
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: this.translate.instant('common.error'),
            detail: this.extractErrorMessage(error, this.translate.instant('users.list.load_error')),
          });
        },
      });
  }

  statusLabel(user: UserDto): string {
    return this.translate.instant(user.isActive ? 'users.list.active' : 'users.list.inactive');
  }

  statusSeverity(user: UserDto): 'success' | 'danger' {
    return user.isActive ? 'success' : 'danger';
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
}
