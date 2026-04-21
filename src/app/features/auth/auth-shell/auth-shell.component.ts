import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { TranslatePipe } from '@ngx-translate/core';
import { LanguageService } from '../../../core/services/language.service';

const THEME_KEY = 'technical-office-theme';

@Component({
  selector: 'app-auth-shell',
  standalone: true,
  imports: [RouterLink, RouterOutlet, ButtonModule, ToastModule, TranslatePipe],
  templateUrl: './auth-shell.component.html',
  styleUrl: './auth-shell.component.scss',
})
export class AuthShellComponent {
  readonly languageService = inject(LanguageService);
  readonly darkTheme = signal(this.readTheme() === 'dark');

  constructor() {
    const theme = this.darkTheme() ? 'dark' : 'light';
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }

  toggleTheme(): void {
    this.darkTheme.update((value) => !value);
    const theme = this.darkTheme() ? 'dark' : 'light';

    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem(THEME_KEY, theme);
    }
  }

  private readTheme(): 'light' | 'dark' {
    if (typeof localStorage === 'undefined') {
      return 'light';
    }

    const stored = localStorage.getItem(THEME_KEY);
    return stored === 'dark' ? 'dark' : 'light';
  }
}
