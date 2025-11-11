import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private http: HttpClient) {}

  getTrades(filters: Record<string, any> = {}): Observable<any> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value);
      }
    });
    return this.http.get('/api/trades', { params });
  }

  getTrade(id: string) {
    return this.http.get(`/api/trades/${id}`);
  }

  createTrade(payload: any) {
    return this.http.post('/api/trades', payload);
  }

  updateTrade(id: string, payload: any) {
    return this.http.put(`/api/trades/${id}`, payload);
  }

  closeTrade(id: string, payload: any) {
    return this.http.post(`/api/trades/${id}/close`, payload);
  }

  addEvent(id: string, payload: any) {
    return this.http.post(`/api/trades/${id}/events`, payload);
  }

  getSetups() {
    return this.http.get('/api/setups');
  }

  createSetup(payload: any) {
    return this.http.post('/api/setups', payload);
  }

  updateSetup(id: string, payload: any) {
    return this.http.put(`/api/setups/${id}`, payload);
  }

  deleteSetup(id: string) {
    return this.http.delete(`/api/setups/${id}`);
  }

  getTags() {
    return this.http.get('/api/tags');
  }

  createTag(payload: any) {
    return this.http.post('/api/tags', payload);
  }

  updateTag(id: string, payload: any) {
    return this.http.put(`/api/tags/${id}`, payload);
  }

  deleteTag(id: string) {
    return this.http.delete(`/api/tags/${id}`);
  }

  getRiskPolicy() {
    return this.http.get('/api/risk/policy');
  }

  updateRiskPolicy(payload: any) {
    return this.http.put('/api/risk/policy', payload);
  }

  getOverview() {
    return this.http.get('/api/reports/overview');
  }

  getDeviations() {
    return this.http.get('/api/reports/deviations');
  }

  getAccounts() {
    return this.http.get('/api/accounts');
  }

  createAccount(payload: any) {
    return this.http.post('/api/accounts', payload);
  }

  deleteAccount(id: string) {
    return this.http.delete(`/api/accounts/${id}`);
  }
}
