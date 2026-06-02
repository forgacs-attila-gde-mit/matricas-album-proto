import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AlbumStore } from '../../core/services/album.store';
import { BetaFeaturesService } from '../../core/services/beta-features.service';
import { GuidedDemoService } from '../../core/services/guided-demo.service';
import { BtnComponent } from '../../shared/ui/btn/btn.component';
import { ChipComponent } from '../../shared/ui/chip/chip.component';
import { IconComponent } from '../../shared/ui/icon/icon.component';

@Component({
  selector: 'ma-settings',
  standalone: true,
  imports: [BtnComponent, ChipComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="content-narrow">
      <div class="page-head">
        <div>
          <ma-chip tone="primary" icon="settings">Beállítások</ma-chip>
          <h1 style="margin-top: 14px;">Demo karbantartás</h1>
          <div class="sub">
            Gyors tisztítás és alapállapot-visszaállítás bemutatók előtt.
          </div>
        </div>
      </div>

      <div class="settings-grid">
        <article class="maintenance-card">
          <div class="card-icon soft">
            <ma-icon name="science" />
          </div>
          <div class="card-copy">
            <div class="t-title-lg">Béta funkciók megjelenítése</div>
            <div class="muted t-body">
              A készülő gold-standard hierarchia-építők — <strong>Blokkműhely</strong>, <strong>Témakörök</strong>,
              <strong>Modulok</strong>, <strong>Tantervek</strong> és <strong>Felépítés</strong> — megjelennek az oldalsávban.
              Alapból rejtve; bekapcsolás után bármikor visszakapcsolható.
            </div>
          </div>
          <button
            type="button"
            role="switch"
            class="switch"
            data-beta-toggle
            [class.switch-on]="beta.enabled()"
            [attr.aria-checked]="beta.enabled()"
            aria-label="Béta funkciók megjelenítése"
            (click)="beta.toggle()"
          >
            <span class="switch-knob"></span>
          </button>
        </article>

        <article class="maintenance-card">
          <div class="card-icon demo">
            <ma-icon name="auto_awesome" />
          </div>
          <div class="card-copy">
            <div class="t-title-lg">Vezetett bemutató indítása</div>
            <div class="muted t-body">
              Lépésről lépésre végigvezet a mikroklíma példán: matricák, albumterv, futó album,
              tanulói bizonyíték, AI draft, visszajelzés és projektzárás.
            </div>
          </div>
          <ma-btn
            variant="primary"
            icon="auto_awesome"
            [disabled]="store.maintenanceLoading() || store.loading()"
            (clicked)="guidedDemo.open()"
          >
            Bemutató indítása
          </ma-btn>
        </article>

        <article class="maintenance-card">
          <div class="card-icon soft">
            <ma-icon name="delete_sweep" />
          </div>
          <div class="card-copy">
            <div class="t-title-lg">AI javaslatok törlése</div>
            <div class="muted t-body">
              Törli a generált tanácskártyákat és futási auditokat. Az albumok, matricák,
              bizonyítékok és beépített AI jelzések megmaradnak.
            </div>
          </div>
          <ma-btn
            variant="danger"
            icon="delete_sweep"
            [disabled]="store.maintenanceLoading()"
            (clicked)="clearAiAdvices()"
          >
            AI javaslatok törlése
          </ma-btn>
        </article>

        <article class="maintenance-card danger-zone">
          <div class="card-icon danger">
            <ma-icon name="restart_alt" />
          </div>
          <div class="card-copy">
            <div class="t-title-lg">Adatbázis alapállapotba állítása</div>
            <div class="muted t-body">
              Töröl minden demo adatot, majd visszaállítja az egy darab kezdő mikroklíma albumot.
            </div>
          </div>
          <ma-btn
            variant="danger"
            icon="restart_alt"
            [disabled]="store.maintenanceLoading() || store.loading()"
            (clicked)="resetDemoData()"
          >
            Alapállapot visszaállítása
          </ma-btn>
        </article>
      </div>
    </div>
  `,
  styles: `
    .settings-grid {
      display: grid;
      gap: 16px;
      max-width: 820px;
    }

    .maintenance-card {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr) auto;
      gap: 18px;
      align-items: center;
      padding: 22px;
      border: 1px solid var(--n-200);
      border-radius: 16px;
      background: white;
    }

    .danger-zone {
      border-color: #fecaca;
      background: #fffafa;
    }

    .card-icon {
      width: 48px;
      height: 48px;
      display: grid;
      place-items: center;
      border-radius: 12px;
      flex-shrink: 0;
    }

    .card-icon.soft {
      background: var(--n-100);
      color: var(--n-700);
    }

    .card-icon.danger {
      background: var(--danger-bg);
      color: var(--danger);
    }

    .card-icon.demo {
      background: var(--primary-100);
      color: var(--primary-700);
    }

    .card-copy {
      min-width: 0;
      display: grid;
      gap: 6px;
    }

    .switch {
      width: 52px;
      height: 30px;
      flex-shrink: 0;
      border-radius: 999px;
      border: 1px solid var(--n-300);
      background: var(--n-200);
      padding: 0;
      cursor: pointer;
      position: relative;
      transition: background 140ms ease, border-color 140ms ease;
    }
    .switch-knob {
      position: absolute;
      top: 50%;
      left: 3px;
      transform: translateY(-50%);
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: white;
      box-shadow: var(--shadow-sm, 0 1px 2px rgba(0,0,0,0.2));
      transition: left 140ms ease;
    }
    .switch-on {
      background: var(--primary-500, #6c5ce0);
      border-color: var(--primary-500, #6c5ce0);
    }
    .switch-on .switch-knob {
      left: 25px;
    }
    .switch:focus-visible {
      outline: 2px solid var(--primary-400, #7c6ce0);
      outline-offset: 2px;
    }

    @media (max-width: 820px) {
      .maintenance-card {
        grid-template-columns: auto minmax(0, 1fr);
      }

      ma-btn {
        grid-column: 1 / -1;
      }
    }
  `,
})
export class SettingsComponent {
  readonly store = inject(AlbumStore);
  readonly guidedDemo = inject(GuidedDemoService);
  readonly beta = inject(BetaFeaturesService);

  async clearAiAdvices(): Promise<void> {
    const confirmed = window.confirm('Törlöd az összes generált AI tanácsot? Az album adatai megmaradnak.');
    if (!confirmed) return;
    await this.store.clearAiAdvices();
  }

  async resetDemoData(): Promise<void> {
    const confirmed = window.confirm('Visszaállítod a demo adatbázist alapállapotba? Minden jelenlegi matrica, album, bizonyíték és tanács törlődik.');
    if (!confirmed) return;
    await this.store.resetDemoData();
  }
}
