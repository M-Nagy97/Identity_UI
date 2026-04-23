import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

const ACCESS_TOKEN_KEY = 'reusable-identity-access-token';

export interface IdentityRole {
  id?: string;
  name?: string | null;
  description?: string | null;
}

export interface IdentityModule {
  id?: number;
  code?: string | null;
  name?: string | null;
}

export interface IdentityPermission {
  id?: number;
  code?: string | null;
  name?: string | null;
  description?: string | null;
  moduleId?: number;
}

export interface IdentityPage {
  id?: number;
  code?: string | null;
  name?: string | null;
  urlPath?: string | null;
  parentId?: number | null;
  moduleId?: number | null;
  permissionId?: number | null;
}

export interface RolePayload {
  name: string;
  description: string | null;
}

export interface ModulePayload {
  code: string;
  name: string;
}

export interface PagePayload {
  code: string;
  name: string;
  urlPath: string | null;
  parentId: number | null;
  moduleId: number | null;
  permissionId: number | null;
}

export interface PermissionPayload {
  code: string;
  name: string;
  description: string | null;
  moduleId: number;
}

@Injectable({ providedIn: 'root' })
export class IdentityManagementApiService {
  private readonly http = inject(HttpClient);
  private readonly basePath = (environment.apiBaseUrl ?? '').replace(/\/$/, '');

  getRoles(): Observable<IdentityRole[]> {
    return this.http.get<IdentityRole[]>(this.url('/api/roles'), this.options());
  }

  createRole(payload: RolePayload): Observable<IdentityRole> {
    return this.http.post<IdentityRole>(this.url('/api/roles'), payload, this.options());
  }

  updateRole(id: string, payload: RolePayload): Observable<IdentityRole> {
    return this.http.put<IdentityRole>(this.url(`/api/roles/${id}`), payload, this.options());
  }

  deleteRole(id: string): Observable<void> {
    return this.http.delete<void>(this.url(`/api/roles/${id}`), this.options());
  }

  getRolePermissions(roleId: string): Observable<IdentityPermission[]> {
    return this.http.get<IdentityPermission[]>(this.url(`/api/roles/${roleId}/permissions`), this.options());
  }

  updateRolePermissions(roleId: string, permissionIds: number[]): Observable<IdentityPermission[]> {
    return this.http.put<IdentityPermission[]>(
      this.url(`/api/roles/${roleId}/permissions`),
      { permissionIds },
      this.options(),
    );
  }

  getModules(): Observable<IdentityModule[]> {
    return this.http.get<IdentityModule[]>(this.url('/api/modules'), this.options());
  }

  createModule(payload: ModulePayload): Observable<IdentityModule> {
    return this.http.post<IdentityModule>(this.url('/api/modules'), payload, this.options());
  }

  updateModule(id: number, payload: ModulePayload): Observable<IdentityModule> {
    return this.http.put<IdentityModule>(this.url(`/api/modules/${id}`), payload, this.options());
  }

  deleteModule(id: number): Observable<void> {
    return this.http.delete<void>(this.url(`/api/modules/${id}`), this.options());
  }

  getPages(): Observable<IdentityPage[]> {
    return this.http.get<IdentityPage[]>(this.url('/api/pages'), this.options());
  }

  createPage(payload: PagePayload): Observable<IdentityPage> {
    return this.http.post<IdentityPage>(this.url('/api/pages'), payload, this.options());
  }

  updatePage(id: number, payload: PagePayload): Observable<IdentityPage> {
    return this.http.put<IdentityPage>(this.url(`/api/pages/${id}`), payload, this.options());
  }

  deletePage(id: number): Observable<void> {
    return this.http.delete<void>(this.url(`/api/pages/${id}`), this.options());
  }

  getPermissions(): Observable<IdentityPermission[]> {
    return this.http.get<IdentityPermission[]>(this.url('/api/permissions'), this.options());
  }

  createPermission(payload: PermissionPayload): Observable<IdentityPermission> {
    return this.http.post<IdentityPermission>(this.url('/api/permissions'), payload, this.options());
  }

  updatePermission(id: number, payload: PermissionPayload): Observable<IdentityPermission> {
    return this.http.put<IdentityPermission>(this.url(`/api/permissions/${id}`), payload, this.options());
  }

  deletePermission(id: number): Observable<void> {
    return this.http.delete<void>(this.url(`/api/permissions/${id}`), this.options());
  }

  private url(path: string): string {
    return `${this.basePath}${path}`;
  }

  private options(): { headers: HttpHeaders } {
    let headers = new HttpHeaders();

    if (typeof localStorage !== 'undefined') {
      const token = localStorage.getItem(ACCESS_TOKEN_KEY);
      if (token) {
        headers = headers.set('Authorization', `Bearer ${token}`);
      }
    }

    return { headers };
  }
}
