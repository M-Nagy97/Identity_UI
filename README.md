# Identity UI - Agent README

Read this first when working on the Identity UI. It is written to help AI agents understand the project quickly and avoid spending credits rediscovering structure, conventions, and backend contracts.

## Project Summary

Identity UI is an Angular 17 frontend for the reusable Identity/Profile backend. It should stay business-agnostic: users, profiles, roles, permissions, modules, pages, authentication, and authorization only.

Do not add HR, school, hospital, sales, inventory, employee, student, customer, or other business-domain concepts unless the user explicitly asks to repurpose the app.

## Stack

- Angular 17 standalone components.
- TypeScript 5.4.
- SCSS.
- PrimeNG 17, PrimeIcons, PrimeFlex.
- ngx-translate for `en` and `ar`.
- OpenAPI Generator `typescript-angular` client.
- Angular signals are used for local component/session state.

## Commands

Run from this folder:

```powershell
npm install
npm start
npm run build
npm test
```

API client generation:

```powershell
npm run fetch-swagger
npm run generate-api
npm run update-api
```

`npm run update-api` downloads `swagger.json`, then regenerates `src/app/core/api/generated`.

## Backend Connection

Development uses same-origin `/api` calls and `proxy.conf.json` forwards `/api` to:

```text
http://localhost:5054
```

The Swagger fetch script defaults to:

```text
https://localhost:8500/swagger/v1/swagger.json
```

If the backend is running on a different port, update the command or config deliberately. Do not change API paths in components just to work around a local port mismatch.

The matching backend repo is:

```text
D:\Projects\Repos\BackEnd\reusableIdentity\reusableIdentity
```

Useful backend command:

```powershell
dotnet run --project src/ReusableIdentity.API/ReusableIdentity.API.csproj --no-launch-profile
```

## Important Files

- `package.json` - scripts and dependencies.
- `angular.json` - Angular project config.
- `proxy.conf.json` - dev proxy for `/api`.
- `swagger.json` - local OpenAPI document used to generate the API client.
- `openapitools.json` - OpenAPI generator config.
- `src/app/app.routes.ts` - top-level routing.
- `src/app/app.config.ts` - app providers, API configuration, translation setup.
- `src/app/core/api/generated` - generated API services and models. Do not hand-edit.
- `src/app/features/auth/data/auth-session.service.ts` - login, register, logout, local session state.
- `src/app/core/guards` - auth and guest route guards.
- `src/app/layout` - main shell, sidebar, topbar.
- `src/app/features/users` - implemented user/profile screens.
- `src/assets/i18n/en.json` and `src/assets/i18n/ar.json` - translations.
- `src/app/styles/main.scss` - global styles and RTL/LTR support.

## Current Routes

Top-level routes:

- `/auth/login`
- `/auth/register`
- `/dashboard`
- `/users/list`
- `/users/create`
- `/users/edit/:id`
- `/users/my-profile`

Redirects:

- `/` to `/auth/login`
- `/login` to `/auth/login`
- `/register` to `/auth/register`

Protected routes use `authGuard`. Auth routes use `guestGuard`.

## Current Feature State

Implemented:

- Login.
- Register.
- Logout with refresh token revoke.
- Dashboard placeholder/overview.
- Main layout with sidebar and topbar.
- Light/dark theme toggle.
- Arabic/English language service with RTL/LTR switching.
- Users list.
- User creation with optional profile step.
- User edit with account and profile forms.
- My profile view/edit.

Not fully implemented yet:

- Roles screens.
- Permissions screens.
- Modules screens.
- Pages/navigation screens.
- Role-permission assignment UI.
- User-module assignment UI.
- Token refresh flow/interceptor.
- Permission-aware route guards and navigation filtering.

## Auth Session Details

Session state is in `AuthSessionService`.

Local storage keys use the `reusable-identity-*` prefix:

- `reusable-identity-authenticated`
- `reusable-identity-access-token`
- `reusable-identity-refresh-token`
- `reusable-identity-user-id`
- `reusable-identity-language`
- `reusable-identity-theme`

The generated API client gets the bearer token through `Configuration.accessToken` in `app.config.ts`.

Important behavior:

- `login()` calls generated `AuthService.authLogin`.
- `register()` calls generated `AuthService.authRegister`.
- `logout()` calls generated `AuthService.authRevokeRefreshToken` when a refresh token exists, then clears local state.
- `currentUserId` is loaded from local storage, with fallback JWT `sub` claim parsing.

When adding protected API calls, use generated services so the configured token is applied consistently.

## Generated API Client Rules

Generated files live in:

```text
src/app/core/api/generated
```

Do not hand-edit generated services or models. If backend contracts changed:

1. Start the backend API.
2. Run `npm run update-api`.
3. Fix compile errors in app code caused by changed service/model names.
4. Commit both `swagger.json` and generated changes when appropriate.

The generated folder currently contains stale non-identity models/services such as sales, inventory, customer, and product. Treat those as legacy artifacts from an older Swagger source. For Identity UI work, use only identity services/models unless the user explicitly asks otherwise.

Identity-related generated services currently include:

- `AuthService`
- `UsersService`
- `ProfileService`
- `RolesService`
- `ModulesService`
- Other generated services may exist but may not belong to this identity project.

Always inspect the generated service method name before calling it. OpenAPI generator names may not match controller names exactly.

## UI Conventions

- Prefer standalone components.
- Prefer reactive forms for data entry.
- Use Angular signals for simple component state, matching existing code.
- Use PrimeNG controls for forms, buttons, tables, tags, cards, dialogs, menus, and feedback.
- Use `MessageService` for toast notifications.
- Keep operational admin screens dense and practical.
- Add translation keys to both `en.json` and `ar.json`.
- Use translation keys in templates instead of hardcoded user-facing text.
- Respect RTL/LTR behavior controlled by `LanguageService`.
- Use existing layout and styles before adding new visual systems.

## Backend Identity Contract

The UI should align with the reusable Identity backend. Key API areas:

- Auth: register, login, refresh token, revoke refresh token.
- Users: list, get by id, get full details, create, update, delete, get/update user modules.
- Profiles: list, get by user id, create, update, delete.
- Roles: CRUD and role permissions.
- Permissions: CRUD.
- Modules: CRUD.
- Pages: CRUD.

Backend rules that also apply to UI:

- `ApplicationUser` is generic and auth-focused.
- Profile fields are generic only: display name, first name, last name, phone, avatar, time zone, preferred language, bio.
- External bounded contexts reference users by `UserId` only.
- Do not add business-specific user fields to UI forms.
- Backend remains the authority for authorization. Client checks are only UX.

## Suggested Next Implementation Order

1. Add token refresh handling and 401 recovery.
2. Add permission/module/page-aware navigation filtering.
3. Add Roles list/create/edit/delete.
4. Add Role permission assignment.
5. Add Permissions CRUD.
6. Add Modules CRUD.
7. Add Pages CRUD and parent/module/permission selectors.
8. Add User module assignment in user edit/detail.

## Common Pitfalls

- Do not edit `src/app/core/api/generated` manually.
- Do not assume the generated API names are clean; inspect generated services.
- Do not keep adding business-specific UI copied from older generated sales/inventory artifacts.
- Do not hardcode backend ports in services or components.
- Do not add new user/profile fields unless the backend DTO supports them.
- Do not forget Arabic translations when adding English keys.
- Do not break RTL layout while styling new components.
- Do not rely on local storage `isAuthenticated` alone for security; backend authorization is required.

## Verification Checklist

Before finishing UI work:

```powershell
npm run build
```

Also verify:

- Login route loads.
- Protected routes redirect when unauthenticated.
- Authenticated shell renders.
- New translation keys exist in `en.json` and `ar.json`.
- API calls use generated services.
- No hand edits were made inside `src/app/core/api/generated`.
