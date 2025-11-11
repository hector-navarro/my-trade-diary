import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-signup-page',
  templateUrl: './signup-page.component.html',
})
export class SignupPageComponent {
  form = this.fb.group({
    name: [''],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });
  error: string | null = null;

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {}

  submit() {
    if (this.form.invalid) {
      this.error = 'Please complete all required fields with valid data';
      return;
    }
    this.auth.signup(this.form.value as any).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => (this.error = err.error?.message || 'Signup failed'),
    });
  }
}
