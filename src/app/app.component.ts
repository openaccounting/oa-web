import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { Logger } from './core/logger';
import { SessionService } from './core/session.service';
import { ConfigService } from './core/config.service';
import { OrgService } from './core/org.service';
import { AccountService } from './core/account.service';
import { TransactionService } from './core/transaction.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  public showLeftNav: boolean = false;
  public hideLeftNav: boolean = false;
  public isTopNavCollapsed: boolean = false;
  public loggedIn: boolean = false;

  public navItems: any = {
    '/dashboard': {
      link: '/dashboard',
      name: 'Dashboard'
    },
    '/accounts': {
      link: '/accounts',
      name: 'Accounts'
    },
    '/reports': {
      link: '/reports',
      name: 'Reports'
    },
    '/prices': {
      link: '/prices',
      name: 'Price Database',
    },
    '/orgs': {
      link: '/orgs',
      name: 'Organization'
    },
    '/settings': {
      link: '/settings',
      name: 'Settings'
    },
    '/login': {
      link: '/login',
      name: 'Login',
      hidden: true
    },
    '/logout': {
      link: '/logout',
      name: 'Logout'
    },
    '/tools/reconcile': {
      link: '/tools/reconcile',
      name: 'Reconcile'
    }
  };

  public leftNav: any[] = [
    this.navItems['/dashboard'],
    this.navItems['/accounts'],
    this.navItems['/reports'],
    this.navItems['/prices'],
    this.navItems['/orgs'],
    this.navItems['/settings']
  ];

  public toolsNav: any[] = [
    this.navItems['/tools/reconcile']
  ];

  // Allowed unauthenticated links besides login
  public passthroughLinks: any[] = [
    '/register',
    '/user/verify',
    '/user/reset-password',
    '/settings'
  ];

  constructor(
    private log: Logger,
    private router: Router,
    private location: Location,
    public sessionService: SessionService,
    private configService: ConfigService,
    private orgService: OrgService,
    private accountService: AccountService,
    private transactionService: TransactionService) {
    this.log.setLevel(Logger.INFO);
  }

  hideNavItem(link: string) {
    this.navItems[link].hidden = true;
  }

  showNavItem(link: string) {
    this.navItems[link].hidden = false;
  }

  ngOnInit() {
    this.log.info('app init');

    this.sessionService.getSessions().subscribe(([user, org]) => {
      this.log.debug('appComponent: new session');

      //this.dataService.setLoading(false);

      if(!user) {
        this.loggedIn = false;
        this.log.debug('no user');
        this.showLoggedOutMenu();

        let passthrough = false;

        this.passthroughLinks.forEach(link => {
          if(this.location.path().startsWith(link)) {
            passthrough = true;
          }
        })

        if(passthrough) {
          this.router.initialNavigation();
          return;
        }

        this.router.navigate(['/login']);
        return;
      }

      if(!org) {
        this.loggedIn = true;
        this.log.debug('display new org page');
        this.showCreateOrgMenu();

        // display new org screen
        // TODO allow joining of exisitng orgs
        this.router.navigate(['/orgs/new']);
        return;
      }

      this.loggedIn = true;

      this.showLoggedInMenu();

      if(
        this.router.url === '/login' ||
        this.router.url === '/orgs' ||
        this.router.url === '/orgs/new'
      ) {
        this.router.navigate(['/dashboard']);
        return;
      }

      this.router.initialNavigation();
    });

    this.configService.init().subscribe(() => {
      this.log.debug('config loaded');
      this.sessionService.init();
    });

    this.router.events.filter(val => {
      return val instanceof NavigationEnd;
    }).subscribe(val => {
      let event = val as NavigationEnd;
      if(event.url.match(/^\/accounts\/(.+?)\/transactions/)) {
        this.hideLeftNav = true;
        this.showLeftNav = false;
      } else {
        this.hideLeftNav = false;
        this.showLeftNav = false;
      }
    });
  }

  showLoggedInMenu() {
    this.showNavItem('/dashboard');
    this.showNavItem('/accounts');
    this.showNavItem('/reports');
    this.showNavItem('/prices');
    this.showNavItem('/orgs');
    this.showNavItem('/tools/reconcile');
    this.showNavItem('/logout');
    this.hideNavItem('/login');
  }

  showCreateOrgMenu() {
    this.hideNavItem('/dashboard');
    this.hideNavItem('/accounts');
    this.hideNavItem('/reports');
    this.hideNavItem('/prices');
    this.hideNavItem('/orgs');
    this.hideNavItem('/tools/reconcile');
    this.showNavItem('/logout');
    this.hideNavItem('/login');
  }

  showLoggedOutMenu() {
    this.hideNavItem('/dashboard');
    this.hideNavItem('/accounts');
    this.hideNavItem('/reports');
    this.hideNavItem('/prices');
    this.hideNavItem('/orgs');
    this.hideNavItem('/tools/reconcile');
    this.hideNavItem('/logout');
    this.showNavItem('/login');
  }
}
