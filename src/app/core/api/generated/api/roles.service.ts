import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, Optional } from '@angular/core';
import { Observable } from 'rxjs';
import { Configuration } from '../configuration';
import { RoleDto } from '../model/roleDto';

@Injectable({
  providedIn: 'root',
})
export class RolesService {
  constructor(
    private readonly httpClient: HttpClient,
    @Optional() private readonly configuration: Configuration = new Configuration(),
  ) {}

  apiRolesGet(): Observable<RoleDto[]> {
    return this.httpClient.get<RoleDto[]>(this.buildUrl('/api/roles'), {
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
