export interface UpdateUserRequestDto {
  userName: string;
  email: string;
  isActive: boolean;
  roles: string[];
}
