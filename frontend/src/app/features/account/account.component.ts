import { Component } from '@angular/core';
import { NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AccountService } from './account.service';
import { StudySyncService } from '../learn/study-sync.service';

@Component({selector: 'app-account', standalone: true, imports: [NgIf, FormsModule],
  templateUrl: './account.component.html', styleUrls: ['./account.component.scss']})
export class AccountComponent {
  open = false;
  mode: 'register' | 'login' | 'recover' = 'login';
  username = ''; password = ''; recoveryKey = ''; savedKey = ''; busy = false; error = '';
  constructor(public readonly auth: AccountService, private readonly sync: StudySyncService) {}
  async submit(action: 'register' | 'login' | 'recover' | 'logout' = this.mode): Promise<void> {
    if (this.busy) return;
    this.busy = true; this.error = '';
    try {
      await this.sync.prepareAccountChange(action === 'register');
      const result = await this.auth.change(action, {username: this.username, password: this.password, recoveryKey: this.recoveryKey});
      this.password = ''; this.recoveryKey = '';
      if (result.recoveryKey) this.savedKey = result.recoveryKey;
      else window.location.reload();
    } catch (error: unknown) {
      const status = (error as {status?: number}).status;
      this.error = error instanceof Error && !status ? error.message : status === 429 ? 'Too many attempts. Try again in ten minutes.'
        : status === 409 ? 'Username unavailable or profile changed. Reload and try again.'
        : status === 401 ? 'Incorrect username, password, or recovery key.'
        : status === 400 ? 'Check your username and password length.' : 'Unable to connect. Retry when the database is available.';
      this.sync.cancelAccountChange();
    } finally { this.busy = false; }
  }
  finish(): void { window.location.reload(); }
}
