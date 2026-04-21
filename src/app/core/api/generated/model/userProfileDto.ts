export interface UserProfileDto { 
    userId: string;
    displayName: string;
    firstName?: string | null;
    lastName?: string | null;
    phoneNumber?: string | null;
    avatarUrl?: string | null;
    timeZone?: string | null;
    preferredLanguage?: string | null;
    bio?: string | null;
}
