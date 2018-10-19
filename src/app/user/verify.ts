import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AppError } from '../shared/error';
import { UserService } from '../core/user.service';


@Component({
  selector: 'app-verifyuser',
  templateUrl: 'verify.html'
})
export class VerifyUserPage {
  public error: AppError;
  public success: boolean;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private userService: UserService
  ) {
    this.route.queryParams.switchMap(params => {
      let code = params['code'];

      if(!code) {
        throw new Error('Missing code');
      }

      return this.userService.verifyUser(code);
    }).subscribe(() => {
      this.success = true;
    }, err => {
      this.error = err;
    })
  }
}