import { Component, OnInit } from '@angular/core';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-dashboard-page',
  templateUrl: './dashboard-page.component.html',
})
export class DashboardPageComponent implements OnInit {
  overview: any;
  deviations: any[] = [];
  loading = false;

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loading = true;
    this.api.getOverview().subscribe({
      next: (data) => {
        this.overview = data;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
    this.api.getDeviations().subscribe({
      next: (data: any) => (this.deviations = data.deviations || []),
      error: () => (this.deviations = []),
    });
  }
}
