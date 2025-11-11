import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-trades-page',
  templateUrl: './trades-page.component.html',
})
export class TradesPageComponent implements OnInit {
  trades: any[] = [];
  loading = false;
  filterForm = this.fb.group({
    symbol: [''],
    status: [''],
    direction: [''],
    from: [''],
    to: [''],
  });

  constructor(private api: ApiService, private fb: FormBuilder, private router: Router) {}

  ngOnInit(): void {
    this.load();
  }

  load() {
    this.loading = true;
    this.api.getTrades(this.filterForm.value).subscribe({
      next: (data: any) => {
        this.trades = data.trades || [];
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  openTrade(trade: any) {
    this.router.navigate(['/trades', trade.id]);
  }
}
