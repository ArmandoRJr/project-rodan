import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { SignReturn } from '../classes/sign-return';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  endpoint = environment.apiEndpoint;

  constructor(private http: HttpClient) {}
  /**
   * HttpClient has methods for all the CRUD actions: get, post, put, patch, delete, and head.
   * First parameter is the URL, and the second parameter is the body.
   * You can use this as a reference for how to use HttpClient.
   * @param content The content of the message
   * @returns
   */

  signUp(username: string, password: string): Observable<SignReturn> {
    return this.http.post<SignReturn>(this.endpoint + `/users/signup`, {
      username,
      password,
    });
  }

  signIn(username: string, password: string): Observable<SignReturn> {
    return this.http.post<SignReturn>(this.endpoint + `/users/signin`, {
      username,
      password,
    });
  }

  signOut(): Observable<{ message: string }> {
    return this.http.get<{ message: string }>(this.endpoint + `/users/signout`);
  }

  me(): Observable<{ userId: string }> {
    const token = localStorage.getItem('accessToken');

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    return this.http.get<{ userId: string }>(this.endpoint + `/users/me`, {
      headers,
    });
  }
}
