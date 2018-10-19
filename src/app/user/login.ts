import { Component } from '@angular/core';
import { Logger } from '../core/logger';
import { 
  FormGroup,
  FormControl,
  Validators,
  FormBuilder,
  AbstractControl,
  ValidationErrors
} from '@angular/forms';
import { Router } from '@angular/router';
import { ConfigService } from '../core/config.service';
import { UserService } from '../core/user.service';
import { SessionService } from '../core/session.service';
import { User } from '../shared/user';
import { RegisterPage } from '../register/register';
import { AppError } from '../shared/error';
import { Util } from '../shared/util';


@Component({
  selector: 'app-login',
  templateUrl: 'login.html'
})
export class LoginPage {
  public form: FormGroup;
  public error: AppError;
  public resetSuccess: boolean;

  constructor(
    private log: Logger,
    private router: Router,
    private configService: ConfigService,
    private userService: UserService,
    private sessionService: SessionService,
    private fb: FormBuilder
   ) {
    this.form = fb.group({
      'email': ['', Validators.required],
      'password': ['', Validators.required],
      'stayLoggedIn': [false, Validators.required]
    });
  }

  onSubmit() {
    this.error = null;
    this.resetSuccess = false;

    //this.dataService.setLoading(true);
    let formUser = new User(this.form.value);
    this.log.debug(formUser);

    let sessionId = Util.newGuid();

    this.sessionService.login(this.form.value.email, this.form.value.password, sessionId)
      .subscribe(() => {
        // save session id if desired
        if(this.form.value.stayLoggedIn) {
          this.configService.put('sessionId', sessionId);
        }
      },
      error => {
          this.log.debug('An error occurred!');
          this.log.debug(error);

          this.error = error;

          if(error.code === 401) {
            this.error = new AppError('Invalid username or password');
          }
      });
  }

  resetPassword() {
    this.error = null;
    this.resetSuccess = false;

    if(!this.form.value.email) {
      this.error = new Error('Please input email address');
      return;
    }

    this.userService.resetPassword(this.form.value.email).subscribe(() => {
      this.resetSuccess = true;
    }, err => {
      this.error = err;
    });
  }
}