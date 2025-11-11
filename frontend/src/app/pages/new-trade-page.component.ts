import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TradeDirection } from '../types';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-new-trade-page',
  templateUrl: './new-trade-page.component.html',
})
export class NewTradePageComponent implements OnInit {
  form = this.fb.group({
    symbol: ['', Validators.required],
    direction: [TradeDirection.LONG, Validators.required],
    plannedEntry: [0, [Validators.required, Validators.min(0.0001)]],
    plannedStopLoss: [0, [Validators.required, Validators.min(0.0001)]],
    plannedTakeProfit: [0, [Validators.required, Validators.min(0.0001)]],
    plannedRiskAmount: [null],
    maxHoldMinutes: [null],
    notes: [''],
    emotionalState: [''],
    setupId: [null],
    accountId: [null],
    tags: [[]],
  });
  setups: any[] = [];
  tags: any[] = [];
  accounts: any[] = [];
  alerts: any[] = [];
  createdTradeId: number | null = null;
  error: string | null = null;

  constructor(private fb: FormBuilder, private api: ApiService, public router: Router) {}

  ngOnInit(): void {
    this.api.getSetups().subscribe((data: any) => (this.setups = data.setups || []));
    this.api.getTags().subscribe((data: any) => (this.tags = data.tags || []));
    this.api.getAccounts().subscribe((data: any) => (this.accounts = data.accounts || []));
  }

  get riskReward() {
    const entry = this.form.value.plannedEntry || 0;
    const stop = this.form.value.plannedStopLoss || 0;
    const take = this.form.value.plannedTakeProfit || 0;
    const risk = Math.abs(entry - stop);
    const reward = Math.abs(take - entry);
    return risk ? reward / risk : 0;
  }

  submit() {
    if (this.form.invalid) {
      this.error = 'Please ensure the form is valid.';
      return;
    }
    this.api.createTrade({
      ...this.form.value,
      tags: (this.form.value.tags as number[]) || [],
    }).subscribe({
      next: (data: any) => {
        this.alerts = data.alerts || [];
        this.createdTradeId = data.trade.id;
        if (!this.alerts.length) {
          this.router.navigate(['/trades', data.trade.id]);
        }
      },
      error: (err) => (this.error = err.error?.message || 'Could not create trade'),
    });
  }
}
