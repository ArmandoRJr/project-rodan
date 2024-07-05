import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
//import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthenticatorService {
  endpoint = 'http://localhost:3000';
  //endpoint = environment.apiEndpoint;
  

  constructor() { }
}
