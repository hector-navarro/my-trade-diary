import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-risk-settings-page',
  templateUrl: './risk-settings-page.component.html',
})
export class RiskSettingsPageComponent implements OnInit {
  form = this.fb.group({
    maxRiskPerTrade: [null],
    maxDailyLoss: [null],
    maxConsecutiveLosses: [null],
    maxTradeDurationMinutes: [null],
  });
  message: string | null = null;

  constructor(private fb: FormBuilder, private api: ApiService) {}

  ngOnInit(): void {
    this.api.getRiskPolicy().subscribe((data: any) => {
      if (data.policy) {
        this.form.patchValue(data.policy);
      }
    });
  }

  save() {
    this.api.updateRiskPolicy(this.form.value).subscribe({
      next: () => (this.message = 'Risk policy saved.'),
      error: (err) => (this.message = err.error?.message || 'Could not save policy'),
    });
  }
}
