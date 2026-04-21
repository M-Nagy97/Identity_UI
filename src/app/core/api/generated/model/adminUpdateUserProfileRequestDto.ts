export interface AdminUpdateUserProfileRequestDto {
  displayName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  phoneNumber?: string | null;
  avatarUrl?: string | null;
  timeZone?: string | null;
  preferredLanguage?: string | null;
  bio?: string | null;
}
