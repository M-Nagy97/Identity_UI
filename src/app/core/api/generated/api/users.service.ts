import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, Optional } from '@angular/core';
import { Observable } from 'rxjs';
import { Configuration } from '../configuration';
import { CreateUserRequestDto } from '../model/createUserRequestDto';
import { ModuleDto } from '../model/moduleDto';
import { UpdateUserModulesRequestDto } from '../model/updateUserModulesRequestDto';
import { UpdateUserRequestDto } from '../model/updateUserRequestDto';
import { UserDto } from '../model/userDto';
import { UserFullDetailsDto } from '../model/userFullDetailsDto';

@Injectable({
  providedIn: 'root',
})
export class UsersService {
  constructor(
    private readonly httpClient: HttpClient,
    @Optional() private readonly configuration: Configuration = new Configuration(),
  ) {}

  apiUsersGet(): Observable<UserDto[]> {
    return this.httpClient.get<UserDto[]>(this.buildUrl('/api/users'), {
      headers: this.createHeaders(),
      withCredentials: this.configuration.withCredentials,
    });
  }

  apiUsersIdGet(id: string): Observable<UserDto> {
    return this.httpClient.get<UserDto>(this.buildUrl(`/api/users/${encodeURIComponent(id)}`), {
      headers: this.createHeaders(),
      withCredentials: this.configuration.withCredentials,
    });
  }

  apiUsersIdFullGet(id: string): Observable<UserFullDetailsDto> {
    return this.httpClient.get<UserFullDetailsDto>(this.buildUrl(`/api/users/${encodeURIComponent(id)}/full`), {
      headers: this.createHeaders(),
      withCredentials: this.configuration.withCredentials,
    });
  }

  apiUsersPost(body: CreateUserRequestDto): Observable<UserDto> {
    return this.httpClient.post<UserDto>(this.buildUrl('/api/users'), body, {
      headers: this.createHeaders(true),
      withCredentials: this.configuration.withCredentials,
    });
  }

  apiUsersIdPut(id: string, body: UpdateUserRequestDto): Observable<UserDto> {
    return this.httpClient.put<UserDto>(this.buildUrl(`/api/users/${encodeURIComponent(id)}`), body, {
      headers: this.createHeaders(true),
      withCredentials: this.configuration.withCredentials,
    });
  }

  apiUsersIdModulesPut(id: string, body: UpdateUserModulesRequestDto): Observable<ModuleDto[]> {
    return this.httpClient.put<ModuleDto[]>(this.buildUrl(`/api/users/${encodeURIComponent(id)}/modules`), body, {
      headers: this.createHeaders(true),
      withCredentials: this.configuration.withCredentials,
    });
  }

  apiUsersIdDelete(id: string): Observable<void> {
    return this.httpClient.delete<void>(this.buildUrl(`/api/users/${encodeURIComponent(id)}`), {
      headers: this.createHeaders(),
      withCredentials: this.configuration.withCredentials,
    });
  }

  private buildUrl(path: string): string {
    const basePath = (this.configuration.basePath ?? '').replace(/\/$/, '');
    return `${basePath}${path}`;
  }

  private createHeaders(includeContentType = false): HttpHeaders {
    let headers = new HttpHeaders();
    const token = this.configuration.lookupCredential('Bearer');

    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    if (includeContentType) {
      headers = headers.set('Content-Type', 'application/json');
    }

    return headers;
  }
}
