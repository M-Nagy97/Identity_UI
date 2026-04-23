import { Component, input, output, signal, inject, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { TooltipModule } from 'primeng/tooltip';
import { TranslatePipe } from '@ngx-translate/core';
import { NavItem } from '../../core/models/nav-item.model';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, TooltipModule, TranslatePipe],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent implements OnInit {
  private readonly router = inject(Router);

  readonly collapsed = input<boolean>(false);
  readonly toggleSidebar = output<void>();

  readonly expandedModules = signal<Set<string>>(new Set());

  ngOnInit(): void {
    this.expandActiveModule();
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(() => this.expandActiveModule());
  }

  private expandActiveModule(): void {
    for (const item of this.navItems) {
      if (item.children?.length && this.hasActiveChild(item)) {
        this.expandedModules.update((set) => new Set(set).add(item.module));
        break;
      }
    }
  }

  readonly navItems: NavItem[] = [
    {
      label: 'nav.dashboard',
      icon: 'pi pi-home',
      route: '/dashboard',
      module: 'dashboard',
    },
    {
      label: 'nav.users',
      icon: 'pi pi-users',
      module: 'users',
      children: [
        {
          label: 'users.actions.manage',
          icon: 'pi pi-list',
          route: '/users/list',
          module: 'users-list',
        },
        {
          label: 'users.actions.create',
          icon: 'pi pi-user-plus',
          route: '/users/create',
          module: 'users-create',
        },
      ],
    },
    {
      label: 'nav.system',
      icon: 'pi pi-lock',
      module: 'system',
      children: [
        {
          label: 'nav.roles',
          icon: 'pi pi-shield',
          route: '/roles',
          module: 'roles',
        },
        {
          label: 'nav.modules',
          icon: 'pi pi-th-large',
          route: '/modules',
          module: 'modules',
        },
        {
          label: 'nav.permissions',
          icon: 'pi pi-key',
          route: '/permissions',
          module: 'permissions',
        },
        {
          label: 'nav.pages',
          icon: 'pi pi-sitemap',
          route: '/pages',
          module: 'pages',
        },
      ],
    },
  ];

  isModuleExpanded(module: string): boolean {
    return this.expandedModules().has(module);
  }

  toggleModule(module: string): void {
    this.expandedModules.update((set) => {
      const next = new Set(set);
      if (next.has(module)) next.delete(module);
      else next.add(module);
      return next;
    });
  }

  isRouteActive(route: string | undefined): boolean {
    if (!route) return false;
    if (route === '/dashboard') return this.router.url === '/dashboard' || this.router.url === '/';
    return this.router.url.startsWith(route);
  }

  hasActiveChild(item: NavItem): boolean {
    if (!item.children?.length) return false;
    return item.children.some((c: NavItem) => c.route && this.isRouteActive(c.route));
  }
}
