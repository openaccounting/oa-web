import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs/Observable';
import { User } from '../shared/user';

@Injectable()
export class UserService {
  private user: User;

  constructor(private apiService: ApiService) {

  }

  getUser(): Observable<User> {
    return this.apiService.getUser();
  }

  postUser(user: User): Observable<User> {
    return this.apiService.postUser(user);
  }

  putUser(user: User): Observable<User> {
    return this.apiService.putUser(user);
  }

  verifyUser(code: string): Observable<any> {
    return this.apiService.verifyUser(code);
  }

  resetPassword(email: string): Observable<any> {
    return this.apiService.resetPassword(email);
  }

  confirmResetPassword(password: string, code: string): Observable<User> {
    return this.apiService.confirmResetPassword(password, code);
  }
}