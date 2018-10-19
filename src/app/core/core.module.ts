import { ModuleWithProviders, NgModule, Optional, SkipSelf } from '@angular/core';

import { CommonModule } from '@angular/common';

import { Logger } from './logger';
import { ApiService } from './api.service';
//import { DataService } from './data.service';
import { AccountService } from './account.service';
import { ConfigService } from './config.service';
import { OrgService } from './org.service';
import { SessionService } from './session.service';
import { TransactionService } from './transaction.service';
import { UserService } from './user.service';
import { PriceService } from './price.service';
import { WebSocketService } from './websocket.service';
import { ApiKeyService } from './apikey.service';
import { HttpClientModule } from '@angular/common/http';


@NgModule({
  imports:      [CommonModule, HttpClientModule],
  declarations: [],
  exports:      [],
  providers:    []
})
export class CoreModule {
  constructor (@Optional() @SkipSelf() parentModule: CoreModule) {
    if (parentModule) {
      throw new Error(
        'CoreModule is already loaded. Import it in the AppModule only');
    }
  }

  static forRoot(): ModuleWithProviders {
    return {
      ngModule: CoreModule,
      providers: [
        Logger,
        ApiService,
        AccountService,
        ConfigService,
        OrgService,
        SessionService,
        TransactionService,
        UserService,
        PriceService,
        WebSocketService,
        ApiKeyService
      ]
    };
  }
}