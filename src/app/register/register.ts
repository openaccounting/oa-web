import { Component } from '@angular/core';
import { Logger } from '../core/logger';
import { 
  FormGroup,
  Validators,
  FormBuilder,
  AbstractControl
} from '@angular/forms';
import { UserService } from '../core/user.service';
import { ConfigService } from '../core/config.service';
import { User } from '../shared/user';
import { AppError } from '../shared/error';
import { Util } from '../shared/util';

@Component({
  selector: 'app-register',
  templateUrl: 'register.html'
})
export class RegisterPage {
  public registered: boolean = false;
  private form: FormGroup;
  private email: string;
  private error: AppError;

  constructor(
    private log: Logger,
    private userService: UserService,
    private configService: ConfigService,
    private fb: FormBuilder
   ) {
    this.form = fb.group({
      'firstName': ['', Validators.required],
      'lastName': ['', Validators.required],
      'email': ['', Validators.required],
      'password': ['', Validators.required],
      'password2': ['', Validators.required],
      'agreeToTerms': [false, Validators.required]
    }, {
      validator: this.passwordMatchValidator
    });
  }

  onSubmit() {
    let formUser = new User(this.form.value);
    formUser.id = Util.newGuid();
    formUser.signupSource = 'web';
    this.log.debug(formUser);

    this.userService.postUser(formUser)
      .subscribe(
        user => {
          this.log.debug(user);
          this.registered = true;
          this.email = user.email;
        },
        error => {
          this.log.debug('An error occurred!');
          this.log.debug(error);
          this.error = error;
        }
    );
  }

  passwordMatchValidator(control: AbstractControl) {
    if(control.get('password').value === control.get('password2').value) {
      return null;
    } else {
      control.get('password2').setErrors({mismatchedPassword: true});
    }
  }
}