import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, Optional } from '@angular/core';
import { Observable } from 'rxjs';
import { Configuration } from '../configuration';
import { ModuleDto } from '../model/moduleDto';

@Injectable({
  providedIn: 'root',
})
export class ModulesService {
  constructor(
    private readonly httpClient: HttpClient,
    @Optional() private readonly configuration: Configuration = new Configuration(),
  ) {}

  apiModulesGet(): Observable<ModuleDto[]> {
    return this.httpClient.get<ModuleDto[]>(this.buildUrl('/api/modules'), {
      headers: this.createHeaders(),
      withCredentials: this.configuration.withCredentials,
    });
  }

  private buildUrl(path: string): string {
    const basePath = (this.configuration.basePath ?? '').replace(/\/$/, '');
    return `${basePath}${path}`;
  }

  private createHeaders(): HttpHeaders {
    let headers = new HttpHeaders();
    const token = this.configuration.lookupCredential('Bearer');

    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    return headers;
  }
}
