import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter, withViewTransitions } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { I18nPluralPipe } from '@angular/common';

import { provideTranslateService, provideTranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader, provideTranslateHttpLoader } from '@ngx-translate/http-loader';

import { ApiModule, Configuration } from './core/api/generated';
import { environment } from '../environments/environment';
import { routes } from './app.routes';
import { MessageService } from 'primeng/api';
import { ConfirmationService } from 'primeng/api';

// PrimeNG 17: theme is loaded in styles (main.scss). For PrimeNG 18+ use providePrimeNG({ theme: { preset: Aura }, ripple: true }).

function apiConfigurationFactory(): Configuration {
  const base = (environment.apiBaseUrl ?? '').replace(/\/$/, '');
  return new Configuration({
    basePath: base,
    accessToken: () => {
      if (typeof localStorage === 'undefined') {
        return '';
      }

      return localStorage.getItem('reusable-identity-access-token') ?? '';
    },
  });
}

export const appConfig: ApplicationConfig = {
  providers: [
    importProvidersFrom(ApiModule.forRoot(apiConfigurationFactory)),
    I18nPluralPipe,
    provideRouter(routes, withViewTransitions()),
    provideAnimationsAsync(),
    provideHttpClient(withFetch()),
    provideTranslateHttpLoader({ prefix: 'assets/i18n/', suffix: '.json' }),
    ...provideTranslateService({
      loader: provideTranslateLoader(TranslateHttpLoader),
      lang: 'ar',
      fallbackLang: 'en',
    }),
    MessageService,
    ConfirmationService,
  ],
};
