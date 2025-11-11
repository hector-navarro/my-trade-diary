import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, Validators } from '@angular/forms';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-trade-detail-page',
  templateUrl: './trade-detail-page.component.html',
})
export class TradeDetailPageComponent implements OnInit {
  trade: any;
  loading = false;
  eventForm = this.fb.group({
    type: ['NOTE', Validators.required],
    price: [null],
    size: [null],
    note: [''],
  });
  closeForm = this.fb.group({
    exitPrice: [null, Validators.required],
  });
  message: string | null = null;

  constructor(private route: ActivatedRoute, private api: ApiService, private fb: FormBuilder) {}

  ngOnInit(): void {
    this.load();
  }

  load() {
    this.loading = true;
    this.message = null;
    const id = this.route.snapshot.paramMap.get('id') as string;
    this.api.getTrade(id).subscribe({
      next: (data: any) => {
        this.trade = data.trade;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  addEvent() {
    if (this.eventForm.invalid) {
      this.message = 'Please select an event type and provide required values.';
      return;
    }
    this.api.addEvent(this.trade.id, this.eventForm.value).subscribe({
      next: () => {
        this.eventForm.reset({ type: 'NOTE', price: null, size: null, note: '' });
        this.load();
      },
      error: (err) => (this.message = err.error?.message || 'Could not add event'),
    });
  }

  closeTrade() {
    if (this.closeForm.invalid) {
      this.message = 'Provide exit price to close the trade.';
      return;
    }
    this.api.closeTrade(this.trade.id, this.closeForm.value).subscribe({
      next: () => {
        this.load();
        this.message = 'Trade closed successfully.';
      },
      error: (err) => (this.message = err.error?.message || 'Could not close trade'),
    });
  }
}
