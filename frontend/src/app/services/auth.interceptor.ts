import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private auth: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.auth.token;
    const isAbsolute = /^https?:\/\//i.test(req.url);
    const url = isAbsolute
      ? req.url
      : req.url.startsWith('/api')
        ? req.url
        : `/api${req.url.startsWith('/') ? req.url : `/${req.url}`}`;
    const apiReq = req.clone({
      url,
      setHeaders: token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {},
    });
    return next.handle(apiReq);
  }
}
