import { ModuleDto } from './moduleDto';
import { RoleDto } from './roleDto';
import { UserProfileDto } from './userProfileDto';

export interface UserFullDetailsDto {
  id?: string;
  userName?: string | null;
  email?: string | null;
  isActive?: boolean;
  isDeleted?: boolean;
  profile?: UserProfileDto | null;
  roles?: RoleDto[] | null;
  modules?: ModuleDto[] | null;
  permissions?: unknown[] | null;
  pages?: unknown[] | null;
}
