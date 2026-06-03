import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { UpgradePlanDto, UpgradePlanItemDto } from '../../core/services/album-api.service';
import { AlbumStore } from '../../core/services/album.store';
import { BtnComponent } from '../../shared/ui/btn/btn.component';
import { ChipComponent } from '../../shared/ui/chip/chip.component';
import { IconComponent } from '../../shared/ui/icon/icon.component';

/**
 * Modal that shows the upgrade-preview diff and lets the teacher commit it.
 * Inputs the plan; emits `close` after the user dismisses or commits.
 */
@Component({
  selector: 'ma-instance-upgrade-modal',
  standalone: true,
  imports: [BtnComponent, ChipComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (plan(); as p) {
      <div class="modal-backdrop" (click)="close.emit()">
        <div class="modal-card" (click)="$event.stopPropagation()" role="dialog" aria-modal="true">
          <div class="modal-head">
            <div>
              <div class="muted t-body-sm">Sablonverzió átvétele</div>
              <h2>v{{ p.currentVersionNumber }} → v{{ p.targetVersionNumber }}</h2>
            </div>
            <ma-btn variant="ghost" [iconOnly]="true" icon="close" ariaLabel="Bezárás" (clicked)="close.emit()" />
          </div>

          @if (p.isNoOp) {
            <div class="card-section noop">
              <ma-icon name="check_circle" />
              <div>
                <div class="t-title">Nincs változás</div>
                <div class="muted t-body-sm">A futó album már a legfrissebb sablonverzión van.</div>
              </div>
            </div>
          } @else {
            <div class="header-chips">
              @if (p.fromDurationType !== p.toDurationType) {
                <ma-chip tone="warning" icon="schedule">
                  Időegység: {{ unitLabel(p.fromDurationType) }} → {{ unitLabel(p.toDurationType) }}
                </ma-chip>
              }
              @if (p.fromUnitCount !== p.toUnitCount) {
                <ma-chip tone="warning" icon="view_week">
                  Egységek: {{ p.fromUnitCount }} → {{ p.toUnitCount }}
                </ma-chip>
              }
              @if (p.currentWeekClamp !== null && p.currentWeekClamp !== undefined) {
                <ma-chip tone="warning" icon="forward">
                  Aktuális egység vissza: {{ p.currentWeekClamp }}
                </ma-chip>
              }
            </div>

            @if (p.added.length > 0) {
              <section class="card-section">
                <div class="section-head">
                  <ma-icon name="add_circle" />
                  <strong>Új matricák</strong>
                  <span class="muted t-body-sm">{{ p.added.length }} db</span>
                </div>
                <ul class="item-list added">
                  @for (item of p.added; track item.stickerVersionId) {
                    <li>
                      <span class="t-body">{{ item.title }}</span>
                      <span class="muted t-body-sm">v{{ item.toStickerVersionNumber }} · {{ item.toWeek }}. egység · {{ item.toSort }}. hely</span>
                    </li>
                  }
                </ul>
              </section>
            }

            @if (p.removedKeptForEvidence.length > 0) {
              <section class="card-section">
                <div class="section-head">
                  <ma-icon name="archive" />
                  <strong>Eltávolítva — bizonyítékkal, archiváltra állítva</strong>
                  <span class="muted t-body-sm">{{ p.removedKeptForEvidence.length }} db</span>
                </div>
                <ul class="item-list kept">
                  @for (item of p.removedKeptForEvidence; track item.instanceStickerId) {
                    <li>
                      <span class="t-body">{{ item.title }}</span>
                      <span class="muted t-body-sm">v{{ item.fromStickerVersionNumber }} · {{ item.evidenceCount }} bizonyíték · {{ item.progressCount }} csapat-állapot</span>
                    </li>
                  }
                </ul>
                <div class="muted t-body-sm note">A bizonyítékok megmaradnak; a matrica nem jelenik meg az új idővonalon.</div>
              </section>
            }

            @if (p.removedNoEvidence.length > 0) {
              <section class="card-section">
                <div class="section-head">
                  <ma-icon name="delete" />
                  <strong>Eltávolítva — bizonyíték nélkül, törölve</strong>
                  <span class="muted t-body-sm">{{ p.removedNoEvidence.length }} db</span>
                </div>
                <ul class="item-list removed">
                  @for (item of p.removedNoEvidence; track item.instanceStickerId) {
                    <li>
                      <span class="t-body">{{ item.title }}</span>
                      <span class="muted t-body-sm">v{{ item.fromStickerVersionNumber }}</span>
                    </li>
                  }
                </ul>
              </section>
            }

            @if (p.moved.length > 0) {
              <section class="card-section">
                <div class="section-head">
                  <ma-icon name="swap_vert" />
                  <strong>Áthelyezett matricák</strong>
                  <span class="muted t-body-sm">{{ p.moved.length }} db</span>
                </div>
                <ul class="item-list">
                  @for (item of p.moved; track item.instanceStickerId) {
                    <li>
                      <span class="t-body">{{ item.title }}</span>
                      <span class="muted t-body-sm">
                        {{ item.fromWeek }}.{{ item.fromSort }} → {{ item.toWeek }}.{{ item.toSort }}
                      </span>
                    </li>
                  }
                </ul>
              </section>
            }

            @if (p.repointed.length > 0) {
              <section class="card-section">
                <div class="section-head">
                  <ma-icon name="history" />
                  <strong>Frissített matrica-verziók</strong>
                  <span class="muted t-body-sm">{{ p.repointed.length }} db</span>
                </div>
                <ul class="item-list repointed">
                  @for (item of p.repointed; track item.instanceStickerId) {
                    <li>
                      <span class="t-body">{{ item.title }}</span>
                      <span class="muted t-body-sm">v{{ item.fromStickerVersionNumber }} → v{{ item.toStickerVersionNumber }} · {{ item.evidenceCount }} bizonyíték megőrizve</span>
                    </li>
                  }
                </ul>
              </section>
            }

            @if (p.unchanged.length > 0) {
              <section class="card-section">
                <div class="section-head">
                  <ma-icon name="check" />
                  <strong>Változatlan</strong>
                  <span class="muted t-body-sm">{{ p.unchanged.length }} db</span>
                </div>
              </section>
            }
          }

          <div class="modal-footer">
            <ma-btn variant="ghost" (clicked)="close.emit()">Mégse</ma-btn>
            @if (!p.isNoOp) {
              <ma-btn variant="primary" icon="upgrade" [disabled]="committing()" (clicked)="commit()">
                @if (committing()) { Frissítés... } @else { Átvétel megerősítése }
              </ma-btn>
            }
          </div>
        </div>
      </div>
    }
  `,
  styles: `
    .modal-backdrop {
      position: fixed; inset: 0; background: rgba(15, 12, 28, 0.5);
      display: flex; align-items: center; justify-content: center;
      z-index: 100; padding: 24px;
    }
    .modal-card {
      width: min(680px, 100%); max-height: 86vh; overflow: auto;
      background: white; border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      display: flex; flex-direction: column;
    }
    .modal-head {
      display: flex; justify-content: space-between; align-items: flex-start;
      padding: 22px 24px 12px; border-bottom: 1px solid var(--n-200);
    }
    .modal-head h2 { margin: 4px 0 0; font-size: 22px; letter-spacing: -0.2px; }
    .icon-btn {
      background: transparent; border: 0; padding: 6px; cursor: pointer; color: var(--n-600);
      border-radius: 8px;
    }
    .icon-btn:hover { background: var(--n-100); color: var(--n-900); }
    .header-chips { display: flex; flex-wrap: wrap; gap: 6px; padding: 14px 24px 0; }
    .card-section {
      padding: 14px 24px;
      border-bottom: 1px solid var(--n-100);
    }
    .card-section.noop { display: flex; gap: 14px; align-items: center; color: var(--n-700); padding: 28px 24px; }
    .section-head {
      display: flex; align-items: center; gap: 8px;
      font-size: 14px; color: var(--n-700); margin-bottom: 8px;
    }
    .section-head strong { color: var(--n-900); font-weight: 600; }
    .item-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; }
    .item-list li {
      display: flex; justify-content: space-between; align-items: baseline; gap: 12px;
      padding: 8px 12px; border: 1px solid var(--n-200); border-radius: 8px; background: var(--n-50);
    }
    .item-list.added li { border-color: var(--success-200, #c4e7d4); background: #f0faf3; }
    .item-list.removed li { border-color: var(--danger-200, #f0c0c0); background: #fef5f5; }
    .item-list.kept li { border-color: var(--warning-200, #f5d8a8); background: #fff8ec; }
    .item-list.repointed li { border-color: var(--primary-200, #d8d1ff); background: #fdfcff; }
    .note { padding: 8px 12px 0; }
    .modal-footer {
      display: flex; gap: 8px; justify-content: flex-end;
      padding: 16px 24px; border-top: 1px solid var(--n-200);
      position: sticky; bottom: 0; background: white;
    }
  `,
})
export class InstanceUpgradeModalComponent {
  readonly store = inject(AlbumStore);
  readonly plan = input.required<UpgradePlanDto | null>();
  readonly close = output<void>();
  readonly committing = signal(false);

  unitLabel(type: string): string {
    return type === 'het' ? 'Hét' : type === 'ora' ? 'Óra' : 'Fázis';
  }

  async commit(): Promise<void> {
    this.committing.set(true);
    const ok = await this.store.commitInstanceUpgrade();
    this.committing.set(false);
    if (ok) this.close.emit();
  }
}
