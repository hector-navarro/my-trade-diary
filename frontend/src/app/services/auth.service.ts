import { Injectable } from '@angular/core';
import { BehaviorSubject, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';

interface AuthResponse {
  token: string;
  user: { id: number; email: string; name?: string };
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUserSubject = new BehaviorSubject<AuthResponse['user'] | null>(this.getStoredUser());
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {}

  private getStoredUser() {
    const stored = localStorage.getItem('trade_diary_user');
    if (stored) {
      return JSON.parse(stored);
    }
    return null;
  }

  get token() {
    return localStorage.getItem('trade_diary_token');
  }

  signup(data: { email: string; password: string; name?: string }) {
    return this.http.post<AuthResponse>('/api/auth/signup', data).pipe(
      tap((response) => this.persist(response)),
    );
  }

  login(data: { email: string; password: string }) {
    return this.http.post<AuthResponse>('/api/auth/login', data).pipe(
      tap((response) => this.persist(response)),
    );
  }

  logout() {
    localStorage.removeItem('trade_diary_token');
    localStorage.removeItem('trade_diary_user');
    this.currentUserSubject.next(null);
  }

  private persist(response: AuthResponse) {
    localStorage.setItem('trade_diary_token', response.token);
    localStorage.setItem('trade_diary_user', JSON.stringify(response.user));
    this.currentUserSubject.next(response.user);
  }
}
