import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders} from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  //backend url and creating variables for current user logged in. I have hardcoded the backend url so you will have to change it for deployment
  private authUrl = 'http://localhost:3000'; 
  private currentUserSubject: BehaviorSubject<any>;
  public currentUser: Observable<any>;

  //Set the user subject and the user as an observer which will watch for changes to UserSubject (i.e a logout deleting user data)
  constructor(private http: HttpClient, private router: Router) {
    this.currentUserSubject = new BehaviorSubject<any>(JSON.parse(localStorage.getItem('currentUser')!));
    this.currentUser = this.currentUserSubject.asObservable();
  }
  //getter for the user subject value
  public get currentUserValue(): any {
    return this.currentUserSubject.value;
  }
  //hits the signup endpoint in the backend using httpclient
  signup(username: string, password: string) {
    console.log(username);
    console.log(password);
    return this.http.post<any>(`${this.authUrl}/api/users/signup`,{
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: { "username": username, "password": password },
    });
  }
  //hits the signin endpoint in the backend using httpclient
  signin(username: string, password: string) {
    return this.http.post<any>(`${this.authUrl}/api/users/signin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: { "username": username, "password": password },
    })
      .pipe(map(user => {
        // store user details and web token in local storage to keep user logged in between page refreshes
        localStorage.setItem('currentUser', JSON.stringify(user));
        this.currentUserSubject.next(user);
        return user;
      }));
  }
  //This sends a sign in request to googles endpoint so the user can be signed in with google
  googleSignin(token: string) {
    return this.http.post<any>(`${this.authUrl}/google-signin`, { token })
      .pipe(map(user => {
        localStorage.setItem('currentUser', JSON.stringify(user));
        this.currentUserSubject.next(user);
        return user;
      }));
  }
  //Log-out logic, which will remove the user from local storage 
  logout() {
    // remove user from local storage to log user out
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
    this.router.navigate(['/']);
  }
}