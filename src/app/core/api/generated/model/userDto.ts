export interface UserDto {
  id?: string;
  userName?: string | null;
  email?: string | null;
  isActive?: boolean;
  isDeleted?: boolean;
}
