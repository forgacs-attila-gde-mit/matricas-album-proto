import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AlbumStore } from '../core/services/album.store';
import { BetaFeaturesService } from '../core/services/beta-features.service';
import { TeacherSidebarComponent } from './teacher-sidebar.component';

const BETA_LABELS = ['Blokkműhely', 'Témakörök', 'Modulok', 'Tantervek', 'Felépítés'];

describe('TeacherSidebarComponent — beta-gated hierarchy nav', () => {
  let fixture: ComponentFixture<TeacherSidebarComponent>;
  let beta: { enabled: ReturnType<typeof signal<boolean>>; toggle: () => void; setEnabled: (v: boolean) => void };

  beforeEach(async () => {
    const enabled = signal(false);
    beta = { enabled, toggle: () => enabled.update(v => !v), setEnabled: (v: boolean) => enabled.set(v) };
    const fakeStore = { activeInstanceId: signal(null), pendingEvidence: signal([] as unknown[]) };

    await TestBed.configureTestingModule({
      imports: [TeacherSidebarComponent],
      providers: [
        provideRouter([]),
        { provide: AlbumStore, useValue: fakeStore as unknown as AlbumStore },
        { provide: BetaFeaturesService, useValue: beta as unknown as BetaFeaturesService },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(TeacherSidebarComponent);
    fixture.detectChanges();
  });

  function labels(): string[] {
    return fixture.componentInstance.resolvedItems().map(item => item.label);
  }

  it('hides the beta hierarchy nav entries by default', () => {
    for (const label of BETA_LABELS) {
      expect(labels()).not.toContain(label);
    }
    // The always-on entries are still there.
    expect(labels()).toContain('Matricatár');
    expect(labels()).toContain('Albumtervek');
  });

  it('shows all five beta entries when beta features are enabled', () => {
    beta.setEnabled(true);
    for (const label of BETA_LABELS) {
      expect(labels()).toContain(label);
    }
  });

  it('places the beta entries between Matricatár and Albumtervek', () => {
    beta.setEnabled(true);
    const order = labels();
    expect(order.indexOf('Blokkműhely')).toBeGreaterThan(order.indexOf('Matricatár'));
    expect(order.indexOf('Felépítés')).toBeLessThan(order.indexOf('Albumtervek'));
  });
});
