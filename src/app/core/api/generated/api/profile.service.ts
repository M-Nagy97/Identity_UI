import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, Optional } from '@angular/core';
import { Observable } from 'rxjs';
import { Configuration } from '../configuration';
import { UpdateUserProfileRequestDto } from '../model/updateUserProfileRequestDto';
import { CreateUserProfileRequestDto } from '../model/createUserProfileRequestDto';
import { UserProfileDto } from '../model/userProfileDto';
@Injectable({
  providedIn: 'root',
})
export class ProfileService {
  constructor(
    private readonly httpClient: HttpClient,
    @Optional() private readonly configuration: Configuration = new Configuration(),
  ) {}

  apiProfileUserIdPost(userId: string, body: CreateUserProfileRequestDto): Observable<UserProfileDto> {
    return this.httpClient.post<UserProfileDto>(this.buildUrl(`/api/profile/${encodeURIComponent(userId)}`), body, {
      headers: this.createHeaders(true),
      withCredentials: this.configuration.withCredentials,
    });
  }

  apiProfileUserIdPut(userId: string, body: UpdateUserProfileRequestDto): Observable<UserProfileDto> {
    return this.httpClient.put<UserProfileDto>(this.buildUrl(`/api/profile/${encodeURIComponent(userId)}`), body, {
      headers: this.createHeaders(true),
      withCredentials: this.configuration.withCredentials,
    });
  }
  
  apiProfileUserIdGet(userId: string): Observable<UserProfileDto> {
    return this.httpClient.get<UserProfileDto>(this.buildUrl(`/api/profile/${encodeURIComponent(userId)}`), {
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
