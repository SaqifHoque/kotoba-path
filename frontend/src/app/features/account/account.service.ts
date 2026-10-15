import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, timeout } from 'rxjs';

export interface Account { id: string; username?: string; recoveryKey?: string; }

@Injectable({providedIn: 'root'})
export class AccountService {
  account: Account = {id: 'guest'};
  available = false;
  changing = false;
  private readonly marker = 'kotoba-account-change';
  constructor(private readonly http: HttpClient) {
    window.addEventListener('storage', event => {
      if (event.key === this.marker) { this.changing = true; window.location.reload(); }
    });
  }
  async initialize(): Promise<void> {
    try {
      const saved = JSON.parse(localStorage.getItem('kotoba-last-account') || 'null') as Account | null;
      if (saved && (saved.id === 'guest' || /^[0-9a-f-]{36}$/.test(saved.id))) this.account = saved;
    } catch { /* The server remains the authority for identity. */ }
    try {
      this.account = await firstValueFrom(this.http.get<Account>('/api/account').pipe(timeout(10000)));
      this.available = true;
      try { localStorage.setItem('kotoba-last-account', JSON.stringify(this.account)); } catch { /* Optional offline cache hint. */ }
    } catch { this.available = false; }
  }
  cacheKey(key: string): string {
    return this.account.id === 'guest' ? key : `kotoba-account-${this.account.id}:${key}`;
  }
  async change(action: 'register' | 'login' | 'recover' | 'logout', body: object): Promise<Account> {
    const url = action === 'register' ? '/api/study-profile/register' : `/api/account/${action}`;
    const account = await firstValueFrom(this.http.post<Account | null>(url, body, {
      headers: {'X-Kotoba-Request': '1'}
    }).pipe(timeout(20000)));
    this.changing = true;
    const identity = account ? {id: account.id, username: account.username} : {id: 'guest'};
    try { localStorage.setItem('kotoba-last-account', JSON.stringify(identity)); } catch { /* Optional offline cache hint. */ }
    // Other tabs must stop using their current profile. This marker contains no credentials.
    try { localStorage.setItem(this.marker, crypto.randomUUID()); } catch { /* Server owner binding still protects other tabs. */ }
    if (action === 'register') {
      // The database profile has been claimed. Remove guest caches only after success.
      for (const key of ['kotoba-kanji-reviews-v1', 'kotoba-proficiency-v1', 'kotoba-vocabulary-reviews-v1', 'kotoba-forge-v1']) {
        try {
          const value = localStorage.getItem(key);
          if (value && account) localStorage.setItem(`kotoba-account-${account.id}:${key}`, value);
          localStorage.removeItem(key);
        } catch { /* The claimed database profile remains authoritative. */ }
      }
    }
    return account ?? {id: 'guest'};
  }
}
