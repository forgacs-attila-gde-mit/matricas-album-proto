import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'matricas-album:beta-features';

/**
 * Runtime, user-toggled "show beta features" flag, persisted in localStorage. Gates the
 * still-maturing gold-standard hierarchy nav entries (Blokkműhely, Témakörök, Modulok,
 * Tantervek, Felépítés). Default OFF, so the new concepts are hidden until a teacher opts in
 * from the Beállítások page. (The API side stays gated separately by Features:Hierarchy:*.)
 */
@Injectable({ providedIn: 'root' })
export class BetaFeaturesService {
  readonly enabled = signal<boolean>(this.read());

  setEnabled(value: boolean): void {
    this.enabled.set(value);
    try {
      localStorage.setItem(STORAGE_KEY, value ? '1' : '0');
    } catch {
      // localStorage unavailable (private mode / SSR) — keep the in-memory signal only.
    }
  }

  toggle(): void {
    this.setEnabled(!this.enabled());
  }

  private read(): boolean {
    try {
      return localStorage.getItem(STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  }
}
