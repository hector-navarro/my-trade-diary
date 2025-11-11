import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { AppComponent } from './app.component';
import { routes } from './app.routes';
import { LayoutComponent } from './components/layout.component';
import { LoginPageComponent } from './pages/login-page.component';
import { SignupPageComponent } from './pages/signup-page.component';
import { DashboardPageComponent } from './pages/dashboard-page.component';
import { TradesPageComponent } from './pages/trades-page.component';
import { NewTradePageComponent } from './pages/new-trade-page.component';
import { TradeDetailPageComponent } from './pages/trade-detail-page.component';
import { RiskSettingsPageComponent } from './pages/risk-settings-page.component';
import { SetupsTagsPageComponent } from './pages/setups-tags-page.component';
import { AuthInterceptor } from './services/auth.interceptor';

@NgModule({
  declarations: [
    AppComponent,
    LayoutComponent,
    LoginPageComponent,
    SignupPageComponent,
    DashboardPageComponent,
    TradesPageComponent,
    NewTradePageComponent,
    TradeDetailPageComponent,
    RiskSettingsPageComponent,
    SetupsTagsPageComponent,
  ],
  imports: [BrowserModule, HttpClientModule, ReactiveFormsModule, FormsModule, RouterModule.forRoot(routes)],
  providers: [{ provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }],
  bootstrap: [AppComponent],
})
export class AppModule {}
