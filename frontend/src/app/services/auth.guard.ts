import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable, map } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(): Observable<boolean | UrlTree> {
    return this.auth.currentUser$.pipe(
      map((user) => {
        if (user) {
          return true;
        }
        const token = this.auth.token;
        if (!token) {
          return this.router.createUrlTree(['/login']);
        }
        return true;
      }),
    );
  }
}
