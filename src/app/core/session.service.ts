import { Injectable } from '@angular/core';
import { Logger } from './logger';
import { User } from '../shared/user';
import { Org } from '../shared/org';
import { SessionOptions } from '../shared/session-options';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import { ConfigService } from './config.service';
import { ApiService } from './api.service';
import { WebSocketService } from './websocket.service';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/switchMap';
import 'rxjs/add/operator/map';

@Injectable()
export class SessionService {

  private sessions$: Subject<[User, Org, SessionOptions]>;
  private user: User;
  private org: Org;
  private loading: boolean;

  constructor(
    private log: Logger,
    private apiService: ApiService,
    private configService: ConfigService,
    private wsService: WebSocketService) {
    this.loading = true;

    this.sessions$ = new Subject<[User, Org, SessionOptions]>();
  }

  getSessions(): Observable<[User, Org, SessionOptions]> {
    return this.sessions$.asObservable();
  }

  login(email: string, password: string, sessionId: string): Observable<any> {
    return this.apiService.newSession(email, password, sessionId).do(() => {
      this.init(sessionId);
    });
  }

  init(sessionId?: string) {
    this.loading = true;
    let server = this.configService.get('server');

    if(!server || server === 'https://openaccounting.io:8080/api') {
      server = 'https://api.openaccounting.io';
      this.configService.put('server', server);
    }

    this.apiService.setUrl(server);

    sessionId = sessionId || this.configService.get('sessionId');

    let orgId = this.configService.get('defaultOrg');

    if(!sessionId) {
      this.loading = false;
      return this.sessions$.next([null, null, new SessionOptions()]);
    }

    this.apiService.setSession(sessionId);

    this.apiService.getUser()
      .catch(err => {
        this.log.debug('bad session ' + err);
        this.apiService.removeSessionInfo();
        this.configService.clear();
        this.loading = false;
        return Observable.of(null);
      })
      .switchMap(user => {
        if(!user) {
          this.loading = false;
          return Observable.of([null, null, new SessionOptions]);
        }

        return this.apiService.getOrg(orgId).map(org => {
          return [user, org];
        }).catch(err => {
          this.loading = false;
          this.log.debug('catching error here');
          return this.apiService.getOrgs().map(orgs => {
            if(orgs.length) {
              let org = orgs[0];
              this.configService.put('defaultOrg', org.id);
              return [user, org];
            }

            return [user, null];
          })
        })
      })
      .subscribe(([user, org]) => {
        this.log.debug('new session');
        this.log.debug(user);
        this.log.debug(org);
        this.user = user;
        this.org = org;

        if(org) {
          this.apiService.setOrgId(org.id);
        }

        // initialize websocket
        let matches = server.match(/\/\/([^\/]+)/);

        if(matches[1]) {
          let url = 'wss://' + 
            matches[1] + 
            '/ws';

          this.wsService.init(url, sessionId);

        } else {
          this.log.debug('Failed to initialize web socket because we can\'t parse server url');
        }

        this.loading = false;

        this.sessions$.next([user, org, new SessionOptions()]);
      })
  }

  logout() {
    setTimeout(() => {
      this.wsService.close();
      this.apiService.logout();
      this.log.debug('new session');
      this.log.debug(null);
      this.log.debug(null);
      this.sessions$.next([null, null, new SessionOptions()]);
    }, 1);
  }

  switchOrg(org: Org, options?: SessionOptions) {
    setTimeout(() => {
      if(!options) {
        options = new SessionOptions();
      }

      this.org = org;
      this.apiService.setOrgId(org.id);
      this.log.debug('new session');
      this.log.debug(this.user);
      this.log.debug(org);
      this.sessions$.next([this.user, org, options]);
    }, 1);
  }

  setLoading(loading) {
    setTimeout(() => {
      this.loading = loading;
    }, 1);
  }

  isLoading() {
    return this.loading;
  }

  getUser() {
    return this.user;
  }

  getOrg() {
    return this.org;
  }
}