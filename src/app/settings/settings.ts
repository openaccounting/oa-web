import { Component } from '@angular/core';
import { 
  FormGroup,
  Validators,
  FormBuilder,
  AbstractControl
} from '@angular/forms';
import { ConfigService } from '../core/config.service';
import { ApiKeyService } from '../core/apikey.service';
import { SessionService } from '../core/session.service';
import { UserService } from '../core/user.service';
import { AppError } from '../shared/error';
import { ApiKey } from '../shared/apikey';
import { Util } from '../shared/util';
import { User } from '../shared/user';

class KeyItem {
  exists: boolean;
  form: FormGroup;
}

@Component({
  selector: 'app-settings',
  templateUrl: 'settings.html'
})
export class SettingsPage {
  public form: FormGroup;
  public error: AppError;
  private changePasswordForm: FormGroup;
  private changePasswordError: AppError;
  private keyItems: KeyItem[];
  private keyError: AppError;

  constructor(
    private configService: ConfigService,
    private apiKeyService: ApiKeyService,
    public sessionService: SessionService,
    private userService: UserService,
    private fb: FormBuilder
   ) {
  }

  ngOnInit() {
    let server = this.configService.get('server');

    this.form = this.fb.group({
      'server': [server, Validators.required],
    });

    if(!this.sessionService.getUser()) {
      return;
    }

    this.changePasswordForm = this.fb.group({
      'password': [null, Validators.required],
      'password2': [null, Validators.required]
    }, {
      validator: this.passwordMatchValidator
    });

    this.keyItems = [];

    this.apiKeyService.getApiKeys().subscribe(keys => {
      keys.forEach(key => {
        this.keyItems.push({
          exists: true,
          form: this.fb.group({
            'id': [key.id, Validators.required],
            'label': [key.label, Validators.required]
          })
        });
      });
    });
  }

  onSubmit() {
    this.configService.put('server', this.form.value.server);
  }

  changePassword() {
    let user = new User({
      password: this.changePasswordForm.value.password
    });

    this.userService.putUser(user).subscribe(() => {
      this.changePasswordError = new AppError('Successfully changed password');
    }, err => {
      this.changePasswordError = err;
    });
  }

  passwordMatchValidator(control: AbstractControl) {
    if(control.get('password').value === control.get('password2').value) {
      return null;
    } else {
      control.get('password2').setErrors({mismatchedPassword: true});
    }
  }

  newKey() {
    let key = new ApiKey({
      id: Util.newGuid(),
      label: ''
    });

    this.keyItems.push({
      exists: false,
      form: this.fb.group({
        'id': [key.id, Validators.required],
        'label': [key.label, Validators.required]
      })
    });
  }

  postKey(item: KeyItem) {
    let key = new ApiKey(item.form.value);
    this.apiKeyService.newApiKey(key).subscribe(() => {
      item.exists = true;
      item.form.markAsPristine();
    }, err => {
      this.keyError = err;
    })
  }

  updateKey(item: KeyItem) {
    let key = new ApiKey(item.form.value);
    this.apiKeyService.putApiKey(key).subscribe(newKey => {
      item.form.markAsPristine();
    }, err => {
      this.keyError = err;
    })
  }

  deleteKey(item: KeyItem) {
    let key = new ApiKey(item.form.value);
    this.apiKeyService.deleteApiKey(key.id).subscribe(() => {
      // remove item from list
      this.keyItems = this.keyItems.filter(item => {
        return item.form.value['id'] !== key.id;
      });
    }, err => {
      this.keyError = err;
    })
  }
}