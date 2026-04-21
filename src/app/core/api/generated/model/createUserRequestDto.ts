export interface CreateUserRequestDto {
  userName?: string | null;
  email?: string | null;
  password?: string | null;
  isActive?: boolean;
  roles?: string[] | null;
}
