import { Injectable } from '@angular/core';
import { ApiKey } from '../shared/apikey';
import { ApiService } from './api.service';
import { Observable } from 'rxjs/Observable';

@Injectable()
export class ApiKeyService {
  constructor(private apiService: ApiService) {

  }

  getApiKeys(): Observable<ApiKey[]> {
    return this.apiService.getApiKeys();
  }

  newApiKey(key: ApiKey): Observable<ApiKey> {
    return this.apiService.postApiKey(key);
  }

  putApiKey(key: ApiKey): Observable<ApiKey> {
    return this.apiService.putApiKey(key)
  }

  deleteApiKey(id: string): Observable<any> {
    return this.apiService.deleteApiKey(id);
  }
}