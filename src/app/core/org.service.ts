import { Injectable } from '@angular/core';
import { Logger } from './logger';
import { ApiService } from './api.service';
import { SessionService } from './session.service';
import { ConfigService } from './config.service';
import { Org } from '../shared/org';
import { Invite } from '../shared/invite';
import { Observable } from 'rxjs/Observable';
import { SessionOptions } from '../shared/session-options';

@Injectable()
export class OrgService {
  private org: Org;

  constructor(
    private log: Logger,
    private apiService: ApiService,
    private sessionService: SessionService,
    private configService: ConfigService) {
    this.log.debug('orgService constructor');

    this.sessionService.getSessions().subscribe(([user, org]) => {
      this.log.debug('orgService: new session');
      this.org = org;
    });
  }

  getOrg(id: string): Observable<Org> {
    return this.apiService.getOrg(id);
  }

  getCurrentOrg(): Org {
    return this.org;
  }

  getOrgs(): Observable<Org[]> {
    return this.apiService.getOrgs();
  }

  newOrg(org: Org, createDefaultAccounts: boolean): Observable<Org> {
    let sessionOptions = new SessionOptions({
      createDefaultAccounts: createDefaultAccounts
    });

    return this.apiService.postOrg(org)
      .do(org => {
        this.org = org;
        this.configService.put('defaultOrg', this.org.id);
        this.sessionService.switchOrg(this.org, sessionOptions);
      });
  }

  selectOrg(id: string): Observable<Org> {
    return this.getOrg(id)
      .do(org => {
        this.org = org;
        this.configService.put('defaultOrg', this.org.id);
        this.sessionService.switchOrg(this.org);
      });
  }

  updateOrg(org: Org): Observable<Org> {
    return this.apiService.putOrg(org)
      .do(org => {
        this.org = org;
        this.sessionService.switchOrg(this.org);
      })
  }

  getInvites(): Observable<Invite[]> {
    return this.apiService.getInvites();
  }

  newInvite(invite: Invite): Observable<Invite> {
    return this.apiService.postInvite(invite);
  }

  acceptInvite(inviteId: string): Observable<Invite> {
    let invite = new Invite({
      id: inviteId,
      accepted: true
    });

    return this.apiService.putInvite(invite);
  }

  deleteInvite(inviteId: string): Observable<any> {
    return this.apiService.deleteInvite(inviteId);
  }
}