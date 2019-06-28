import { Injectable } from '@angular/core';
import { Logger } from './logger';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { AccountApi } from '../shared/account';
import { Transaction } from '../shared/transaction';
import { Org } from '../shared/org';
import { User } from '../shared/user';
import { Price } from '../shared/price';
import { ApiKey } from '../shared/apikey';
import { Invite } from '../shared/invite';
import { Observable } from 'rxjs/Observable';
import { catchError, retry } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { AppError } from '../shared/error';

let logger;

@Injectable()
export class ApiService {

  private url: string;  // URL to web api
  private httpOptions = {
    headers: new HttpHeaders({
      'content-type':  'application/json',
      'accept-version': '^1.3.0'
    })
  };
  private orgId: string;
  private sessionId: string;

  constructor(private log: Logger, private http: HttpClient) {
    logger = log;
  }

  setUrl(url: string) {
    this.log.debug('set url', url);
    this.url = url;
  }

  verifyUser(code: string): Observable<any> {
    return this.http.post<any>(this.url + '/user/verify', {code: code}, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  resetPassword(email: string): Observable<any> {
    return this.http.post<any>(this.url + '/user/reset-password', {email: email}, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  confirmResetPassword(password: string, code: string): Observable<User> {
    return this.http.put<User>(this.url + '/user', {password: password, code: code}, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  newSession(email: string, password: string, sessionId: string): Observable<any> {
    let url = this.url + '/sessions';

    let tempHeaders = new HttpHeaders(this.httpOptions.headers.keys().reduce((acc, current) => {
      acc[current] = this.httpOptions.headers.get(current);
      return acc;
    }, {}));

    tempHeaders = tempHeaders.set('Authorization', 'Basic ' + window.btoa(email + ':' + password));

    return this.http.post<any>(url, {id: sessionId}, {headers: tempHeaders})
      .pipe(catchError(this.handleError));
  }

  logout() {
    let url = this.url + '/sessions/' + this.sessionId;
    this.http.delete<any>(url, this.httpOptions).subscribe(() => {
      this.removeSessionInfo();
    });
  }

  setSession(id: string) {
    this.sessionId = id;
    this.httpOptions.headers = this.httpOptions.headers.set('Authorization', 'Basic ' + window.btoa(id + ':'));
  }

  removeSessionInfo() {
    this.httpOptions.headers.delete('Authorization');
    this.sessionId = null;
  }

  setOrgId(orgId: string) {
    this.orgId = orgId;
  }

  getAccounts (date?: Date): Observable<AccountApi[]> {
    this.log.debug('API getAccounts()');
    let url = this.url + '/orgs/' + this.orgId + '/accounts';
    if(date) {
      url += '?date=' + date.getTime();
    }
    return this.http.get<AccountApi[]>(url, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  getTransactionsByAccount (accountId, options: any = {}): Observable<Transaction[]> {
    let url = this.url + '/orgs/' + this.orgId + '/accounts/' + accountId + '/transactions';

    if(Object.keys(options).length) {
      let optionsArray: string [] = [];

      for(let option in options) {
        optionsArray.push(option + '=' + options[option]);
      }

      url += '?' + optionsArray.join('&');
    }

    return this.http.get<Transaction[]>(url, this.httpOptions)
      .map(transactions => {
        return transactions.map(transaction => {
          // TODO do this on all transactions
          transaction = new Transaction(transaction);
          transaction.date = new Date(transaction.date);
          transaction.inserted = new Date(transaction.inserted);
          transaction.updated = new Date(transaction.updated);
          return transaction;
        });
      })
      .pipe(catchError(this.handleError));
  }

  getTransactions(options: any = {}): Observable<Transaction[]> {
    this.log.debug('API getTransactions()');
    let url = this.url + '/orgs/' + this.orgId + '/transactions';

    if(Object.keys(options).length) {
      let optionsArray: string [] = [];

      for(let option in options) {
        optionsArray.push(option + '=' + options[option]);
      }

      url += '?' + optionsArray.join('&');
    }

    return this.http.get<Transaction[]>(url, this.httpOptions)
      .map(transactions => {
        return transactions.map(transaction => {
          transaction.date = new Date(transaction.date);
          transaction.inserted = new Date(transaction.inserted);
          transaction.updated = new Date(transaction.updated);
          return transaction;
        });
      })
      .pipe(catchError(this.handleError));
  }

  postTransaction(transaction: Transaction): Observable<Transaction> {
    return this.http.post<Transaction>(this.url + '/orgs/' + this.orgId + '/transactions', transaction, this.httpOptions)
      .map(transaction => {
        transaction.date = new Date(transaction.date);
        transaction.inserted = new Date(transaction.inserted);
        transaction.updated = new Date(transaction.updated);
        return transaction;
      })
      .pipe(catchError(this.handleError));
  }

  putTransaction(oldId: string, transaction: Transaction): Observable<Transaction> {
    let url = this.url + '/orgs/' + this.orgId + '/transactions/' + oldId;
    return this.http.put<Transaction>(url, transaction, this.httpOptions)
      .map(transaction => {
        transaction.date = new Date(transaction.date);
        transaction.inserted = new Date(transaction.inserted);
        transaction.updated = new Date(transaction.updated);
        return transaction;
      })
      .pipe(catchError(this.handleError));
  }

  deleteTransaction(id: string): Observable<any> {
    let url = this.url + '/orgs/' + this.orgId + '/transactions/' + id;
    return this.http.delete<any>(url, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  postAccount(account: AccountApi): Observable<AccountApi> {
    return this.http.post<AccountApi>(this.url + '/orgs/' + this.orgId + '/accounts', account, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  postAccounts(accounts: AccountApi[]): Observable<AccountApi[]> {
    return this.http.post<AccountApi[]>(this.url + '/orgs/' + this.orgId + '/accounts', accounts, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  putAccount(account: AccountApi): Observable<AccountApi> {
    let url = this.url + '/orgs/' + this.orgId + '/accounts/' + account.id;
    return this.http.put<AccountApi>(url, account, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  deleteAccount(id: string): Observable<any> {
    let url = this.url + '/orgs/' + this.orgId + '/accounts/' + id;
    return this.http.delete<any>(url, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  getOrg (orgId): Observable<Org> {
    return this.http.get<Org>(this.url + '/orgs/' + orgId, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  getOrgs (): Observable<Org[]> {
    return this.http.get<Org[]>(this.url + '/orgs', this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  getUser (): Observable<User> {
    return this.http.get<User>(this.url + '/user', this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  postUser(user: User): Observable<User> {
    return this.http.post<User>(this.url + '/users', user, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  putUser(user: User): Observable<User> {
    return this.http.put<User>(this.url + '/user', user, this.httpOptions)
      .pipe(catchError(this.handleError))
  }

  postOrg(org: Org): Observable<Org> {
    return this.http.post<Org>(this.url + '/orgs', org, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  putOrg(org: Org): Observable<Org> {
    return this.http.put<Org>(this.url + '/orgs/' + this.orgId, org, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  getPricesNearestInTime(date: Date): Observable<Price[]> {
    let query = '/orgs/' + this.orgId + '/prices?nearestDate=' + date.getTime();
    return this.http.get<Price[]>(this.url + query, this.httpOptions)
      .map(prices => {
        return prices.map(price => {
          price.date = new Date(price.date);
          price.inserted = new Date(price.inserted);
          price.updated = new Date(price.updated);
          return price;
        });
      })
      .pipe(catchError(this.handleError));
  }

  getPricesByCurrency(currency: string): Observable<Price[]> {
    let query = '/orgs/' + this.orgId + '/prices?currency=' + currency;
    return this.http.get<Price[]>(this.url + query, this.httpOptions)
      .map(prices => {
        return prices.map(price => {
          price.date = new Date(price.date);
          price.inserted = new Date(price.inserted);
          price.updated = new Date(price.updated);
          return price;
        });
      })
      .pipe(catchError(this.handleError));
  }

  postPrice(price: Price): Observable<Price> {
    return this.http.post<Price>(this.url + '/orgs/' + this.orgId + '/prices', price, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  deletePrice(id: string): Observable<any> {
    let url = this.url + '/orgs/' + this.orgId + '/prices/' + id;
    return this.http.delete<any>(url, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  getApiKeys(): Observable<ApiKey[]> {
    return this.http.get<ApiKey[]>(this.url + '/apikeys', this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  postApiKey(key: ApiKey): Observable<ApiKey> {
    return this.http.post<ApiKey>(this.url + '/apikeys', key, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  putApiKey(key: ApiKey): Observable<ApiKey> {
    return this.http.put<ApiKey>(this.url + '/apikeys/' + key.id, key, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  deleteApiKey(id: string): Observable<any> {
    return this.http.delete<any>(this.url + '/apikeys/' + id, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  getInvites(): Observable<Invite[]> {
    return this.http.get<Invite[]>(this.url + '/orgs/' + this.orgId + '/invites', this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  postInvite(invite: Invite): Observable<Invite> {
    return this.http.post<Invite>(this.url + '/orgs/' + this.orgId + '/invites', invite, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  putInvite(invite: Invite): Observable<Invite> {
    return this.http.put<Invite>(this.url + '/orgs/' + this.orgId + '/invites/' + invite.id, invite, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  deleteInvite(id: string): Observable<any> {
    return this.http.delete<any>(this.url + '/orgs/' + this.orgId + '/invites/' + id, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  handleError(error: HttpErrorResponse) {
    if (error.error instanceof ErrorEvent) {
      // A client-side or network error occurred. Handle it accordingly.
      logger.error('An error occurred:', error.error.message);

      return throwError(new AppError(error.error.message))
    } else {
      // The backend returned an unsuccessful response code.
      // The response body may contain clues as to what went wrong,
      logger.error(
        `Backend returned code ${error.status}, ` +
        `body was: ${error.error}`);

      logger.error(error);
      logger.error(error.error.error);

      let appError: AppError;
      if(error.error.error) {
        appError = new AppError(error.error.error, error.status);
      } else if(error.message) {
        appError = new AppError(error.message, error.status);
      } else {
        appError = new AppError('An unexpected error has occurred');
      }

      return throwError(appError);
    }
  };
}
