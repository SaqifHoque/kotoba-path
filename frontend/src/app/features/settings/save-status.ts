export interface SaveFacts {
  ready: boolean; phase: 'connecting' | 'saving' | 'idle'; connected: boolean;
  dirty: boolean; localSaved: boolean; pendingHistory: number; historyWarning: boolean;
  signedIn: boolean; demo: boolean; changing: boolean;
}
export interface SaveStatus { message: string; detail: string; retry: boolean; busy: boolean; attention: boolean; }

export function saveStatus(f: SaveFacts): SaveStatus {
  const result = (message: string, detail: string, retry = false, busy = false, attention = false): SaveStatus => ({message, detail, retry, busy, attention});
  if (f.changing) return result('Finishing account update…', 'Complete the account step in Settings to continue.', false, true);
  if (f.phase === 'connecting' || !f.ready) return result('Checking saved progress…', 'Your learning session will be ready shortly.', false, true);
  if (f.connected && !f.dirty && !f.pendingHistory && f.phase === 'idle') {
    return result(f.signedIn ? 'Saved to your account' : 'Progress saved', f.signedIn
      ? 'Continue on another device by signing in.' : 'This guest progress is linked to this browser. Create an account to continue on other devices.');
  }
  if (f.phase === 'saving') return result('Saving progress…', f.localSaved && !f.historyWarning ? 'A copy is saved on this device.' : 'Keep this tab open until saving finishes.', false, true);
  if (f.localSaved && !f.historyWarning) return result('Saved on this device', f.demo
    ? 'This demo keeps progress in this browser.' : f.signedIn ? 'Waiting to sync with your account. Retry when connected.' : 'Waiting to sync. This guest progress stays in this browser.', !f.demo);
  return result('Progress needs attention', 'Keep this tab open. Download your learning data in Settings before leaving; some progress may be available only in this tab.', !f.demo, false, true);
}
