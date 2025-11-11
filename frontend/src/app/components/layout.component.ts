import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
})
export class LayoutComponent {
  constructor(private auth: AuthService, private router: Router) {}

  get user() {
    return this.auth.currentUser$;
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
