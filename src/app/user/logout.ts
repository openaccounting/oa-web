import { Component, OnInit } from '@angular/core';
import { ConfigService } from '../core/config.service';
import { SessionService } from '../core/session.service';
import { RegisterPage } from '../register/register';


@Component({
  selector: 'app-logout',
  templateUrl: 'logout.html'
})
export class LogoutPage implements OnInit {

  constructor(private configService: ConfigService, private sessionService: SessionService) {
  }

  ngOnInit() {
    this.configService.clear();
    this.sessionService.logout();
  }
}