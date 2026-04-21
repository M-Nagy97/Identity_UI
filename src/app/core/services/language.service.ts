import { DOCUMENT } from '@angular/common';
import { Injectable, computed, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

const LANGUAGE_KEY = 'technical-office-language';

type AppLanguage = 'ar' | 'en';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly document = inject(DOCUMENT);
  private readonly translate = inject(TranslateService);
  private readonly currentLanguage = signal<AppLanguage>(this.resolveInitialLanguage());

  readonly currentLang = computed(() => this.currentLanguage());

  constructor() {
    this.applyLanguage(this.currentLanguage());
  }

  setLanguage(language: AppLanguage): void {
    if (language === this.currentLanguage()) {
      return;
    }

    this.currentLanguage.set(language);
    this.applyLanguage(language);
  }

  private resolveInitialLanguage(): AppLanguage {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(LANGUAGE_KEY);
      if (stored === 'ar' || stored === 'en') {
        return stored;
      }
    }

    const active = this.translate.currentLang || this.translate.getDefaultLang();
    return active === 'en' ? 'en' : 'ar';
  }

  private applyLanguage(language: AppLanguage): void {
    this.translate.use(language);

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(LANGUAGE_KEY, language);
    }

    const htmlElement = this.document.documentElement;
    htmlElement.lang = language;
    htmlElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }
}
