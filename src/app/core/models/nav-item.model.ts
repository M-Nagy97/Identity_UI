export interface NavItem {
  label: string;
  icon: string;
  module: string;
  route?: string;
  section?: boolean;
  children?: NavItem[];
}
