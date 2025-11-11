import { Routes } from '@angular/router';
import { LoginPageComponent } from './pages/login-page.component';
import { SignupPageComponent } from './pages/signup-page.component';
import { DashboardPageComponent } from './pages/dashboard-page.component';
import { TradesPageComponent } from './pages/trades-page.component';
import { NewTradePageComponent } from './pages/new-trade-page.component';
import { TradeDetailPageComponent } from './pages/trade-detail-page.component';
import { RiskSettingsPageComponent } from './pages/risk-settings-page.component';
import { SetupsTagsPageComponent } from './pages/setups-tags-page.component';
import { LayoutComponent } from './components/layout.component';
import { AuthGuard } from './services/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginPageComponent },
  { path: 'signup', component: SignupPageComponent },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardPageComponent },
      { path: 'trades', component: TradesPageComponent },
      { path: 'trades/new', component: NewTradePageComponent },
      { path: 'trades/:id', component: TradeDetailPageComponent },
      { path: 'risk', component: RiskSettingsPageComponent },
      { path: 'catalogs', component: SetupsTagsPageComponent },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
