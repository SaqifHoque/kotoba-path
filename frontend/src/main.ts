import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { APP_INITIALIZER, inject } from '@angular/core';
import { AccountService } from './app/features/account/account.service';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, { providers: [
  provideHttpClient(withInterceptors([(request, next) => {
    if (request.url.split('?')[0] === '/api/study-profile' || request.url.startsWith('/api/study-profile/')) request = request.clone({setHeaders: {'X-Kotoba-Owner': inject(AccountService).account.id}});
    return next(request);
  }])),
  {provide: APP_INITIALIZER, multi: true, deps: [AccountService], useFactory: (account: AccountService) => () => account.initialize()}
] }).catch(console.error);
