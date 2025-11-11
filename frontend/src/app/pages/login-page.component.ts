import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login-page',
  templateUrl: './login-page.component.html',
})
export class LoginPageComponent {
  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });
  error: string | null = null;

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {}

  submit() {
    if (this.form.invalid) {
      this.error = 'Please fill in all required fields';
      return;
    }
    this.auth.login(this.form.value as any).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => (this.error = err.error?.message || 'Login failed'),
    });
  }
}
