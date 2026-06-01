import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { ALBUM_TEMPLATE_PATTERNS, AlbumTemplateDetail, TemplateStickerView } from '../../core/models/album.model';
import { AlbumStore } from '../../core/services/album.store';
import { BtnComponent } from '../../shared/ui/btn/btn.component';
import { ChipComponent } from '../../shared/ui/chip/chip.component';
import { IconComponent } from '../../shared/ui/icon/icon.component';
import { PhaseChipComponent } from '../../shared/ui/phase-chip/phase-chip.component';

@Component({
  selector: 'ma-album-template-detail',
  standalone: true,
  imports: [FormsModule, DragDropModule, BtnComponent, ChipComponent, IconComponent, PhaseChipComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="content-narrow template-detail">
      @if (template(); as template) {
        @if (selectedVersion(); as version) {
        <div class="page-head detail-head">
          <div>
            <div class="row wrap" style="margin-bottom: 14px;">
              <ma-chip tone="primary" icon="edit_note">Albumterv</ma-chip>
              <ma-chip icon="history">v{{ version.versionNumber }}</ma-chip>
              @if (version.id === template.versions[0].id) {
                <ma-chip tone="primary" icon="star">Legutóbbi</ma-chip>
              }
              @if (template.archivedAt) {
                <ma-chip tone="neutral" icon="archive">Archivált</ma-chip>
              }
              <ma-chip icon="category">{{ version.patternName }}</ma-chip>
              @if (isSelected()) {
                <ma-chip tone="primary" icon="radio_button_checked">Kijelölve</ma-chip>
              }
              <ma-chip icon="bookmark_added">{{ version.stickers.length }} matrica</ma-chip>
            </div>
            @if (editing()) {
              <label class="field-label" for="tpl-title">Albumterv címe</label>
              <input
                id="tpl-title"
                class="title-input"
                type="text"
                [value]="version.title"
                placeholder="Pl. Városi mikroklíma nyomában"
                (input)="patchMetadata(template.id, { title: $any($event.target).value })"
              />
              <div class="sub-grid labeled">
                <label class="field">
                  <span>Tantárgy</span>
                  <input
                    class="meta-input"
                    type="text"
                    [value]="version.subject"
                    placeholder="Pl. Integrált természettudomány"
                    (input)="patchMetadata(template.id, { subject: $any($event.target).value })"
                  />
                </label>
                <label class="field">
                  <span>Évfolyam</span>
                  <input
                    class="meta-input"
                    type="text"
                    [value]="version.grade"
                    placeholder="Pl. 7. évfolyam"
                    (input)="patchMetadata(template.id, { grade: $any($event.target).value })"
                  />
                </label>
                <label class="field">
                  <span>Időegység</span>
                  <select
                    class="meta-input"
                    [value]="version.durationType"
                    (change)="patchMetadata(template.id, { durationType: $any($event.target).value })"
                  >
                    <option value="het">Hét</option>
                    <option value="ora">Óra</option>
                    <option value="fazis">Fázis</option>
                  </select>
                </label>
                <label class="field">
                  <span>Album-minta</span>
                  <select
                    class="meta-input"
                    [value]="version.patternKey"
                    (change)="patchPatternMetadata(template.id, $any($event.target).value)"
                  >
                    @for (pattern of patterns; track pattern.key) {
                      <option [value]="pattern.key">{{ pattern.name }}</option>
                    }
                  </select>
                </label>
              </div>
            } @else {
              <h1>{{ version.title }}</h1>
              <div class="sub">{{ version.subject }} · {{ version.grade }} · {{ version.duration }}</div>
            }
          </div>

          <div class="head-actions">
            @if (template.versions.length > 1) {
              <label class="version-select">
                <span>Verzió</span>
                <select [value]="version.id" (change)="selectVersion($event)">
                  @for (item of template.versions; track item.id) {
                    <option [value]="item.id">v{{ item.versionNumber }} · {{ item.title }}</option>
                  }
                </select>
              </label>
            }
            <ma-btn variant="ghost" icon="arrow_back" (clicked)="backToList()">Visszatérés</ma-btn>
            <ma-btn variant="secondary" icon="radio_button_checked" (clicked)="selectTemplate(template.id)">
              Kijelölés
            </ma-btn>
            @if (editing()) {
              <ma-btn variant="primary" icon="check" (clicked)="exitEdit()">Kész</ma-btn>
              @if (isFreshDraft(template)) {
                <ma-btn variant="ghost" icon="delete" (clicked)="discardFresh(template.id)">Mégse</ma-btn>
              }
            } @else {
              <ma-btn variant="secondary" icon="edit" (clicked)="enterEdit(template.id)">Szerkesztés</ma-btn>
            }
            <ma-btn
              variant="ghost"
              [icon]="template.archivedAt ? 'unarchive' : 'archive'"
              (clicked)="toggleArchive(template.id)"
            >
              @if (template.archivedAt) { Visszaállítás } @else { Archiválás }
            </ma-btn>
          </div>
        </div>

        @if (draftVersion(); as draft) {
          <div class="draft-banner" role="status">
            <div class="row" style="gap: 10px; align-items: center;">
              <ma-icon name="edit_note" />
              <div>
                <div class="t-title">
                  @if (isFreshDraft(template)) {
                    Új albumterv vázlat — v{{ draft.versionNumber }}
                  } @else {
                    Vázlat — v{{ draft.versionNumber }}
                  }
                </div>
                <div class="muted t-body-sm">
                  @if (isFreshDraft(template)) {
                    Az albumterv csak publikálás után indítható futó albumként. Mégse: a vázlat törlődik.
                  } @else {
                    A változások egy vázlatba kerülnek, amíg nem publikálod. Az új példányok és más felhasználók
                    még a legutóbbi publikált verziót látják.
                  }
                </div>
              </div>
            </div>
            <div class="row" style="gap: 8px;">
              <ma-btn variant="secondary" size="sm" icon="check" (clicked)="publishDraft(template.id)">
                Publikálás
              </ma-btn>
              @if (!isFreshDraft(template)) {
                <ma-btn variant="ghost" size="sm" icon="delete" (clicked)="discardDraft(template.id)">
                  Elvetés
                </ma-btn>
              }
            </div>
          </div>
        }

        <div class="meta-grid">
          <section class="card detail-card">
            <div class="card-section-title">Vezérkérdés</div>
            @if (editing()) {
              <textarea
                class="meta-textarea"
                rows="3"
                [value]="version.drivingQ"
                placeholder="Az album több héten átívelő nyílt kérdése"
                (input)="patchMetadata(template.id, { drivingQuestion: $any($event.target).value })"
              ></textarea>
            } @else {
              <div class="quote">„{{ version.drivingQ }}”</div>
            }
          </section>

          <section class="card detail-card">
            <div class="card-section-title">Záró produktum</div>
            @if (editing()) {
              <textarea
                class="meta-textarea"
                rows="3"
                [value]="version.finalProduct"
                placeholder="Mit készít el a végén a csapat?"
                (input)="patchMetadata(template.id, { finalProduct: $any($event.target).value })"
              ></textarea>
            } @else {
              <div class="t-body">{{ version.finalProduct }}</div>
            }
            <div class="card-section-title audience-label">Közönség</div>
            @if (editing()) {
              <input
                class="meta-input"
                type="text"
                [value]="version.audience"
                placeholder="Kiknek készül az album?"
                (input)="patchMetadata(template.id, { audience: $any($event.target).value })"
              />
            } @else {
              <div class="t-body">{{ version.audience }}</div>
            }
            <div class="card-section-title project-prompts-label">Projektzáró reflexiós kérdések</div>
            @if (editing()) {
              <div class="project-prompts-editor">
                @for (prompt of version.projectReflectionPrompts; track $index) {
                  <div class="project-prompt-row">
                    <textarea
                      class="meta-textarea project-prompt-input"
                      rows="2"
                      [value]="prompt"
                      [placeholder]="'Reflexiós kérdés ' + ($index + 1)"
                      (input)="patchProjectReflectionPrompt(template.id, version.projectReflectionPrompts, $index, $any($event.target).value)"
                    ></textarea>
                    <button
                      type="button"
                      class="project-prompt-remove"
                      aria-label="Reflexiós kérdés eltávolítása"
                      [disabled]="version.projectReflectionPrompts.length <= 1"
                      (click)="removeProjectReflectionPrompt(template.id, version.projectReflectionPrompts, $index)"
                    >
                      <ma-icon name="close" size="sm" />
                    </button>
                  </div>
                }
                @if (version.projectReflectionPrompts.length < 5) {
                  <ma-btn variant="ghost" size="sm" icon="add" (clicked)="addProjectReflectionPrompt(template.id, version.projectReflectionPrompts)">
                    Kérdés hozzáadása
                  </ma-btn>
                }
              </div>
            } @else {
              <ol class="project-prompts-list">
                @for (prompt of version.projectReflectionPrompts; track $index) {
                  <li>{{ prompt }}</li>
                }
              </ol>
            }
          </section>
        </div>

        <section class="card detail-card">
          <div class="card-section-title">Tanulási fókuszok</div>
          @if (editing()) {
            <div class="chip-input">
              <div class="chip-input-tags">
                @for (disposition of version.dispositions; track disposition; let i = $index) {
                  <span class="chip-tag">
                    <ma-icon name="psychology" size="sm" />
                    <span>{{ disposition }}</span>
                    <button
                      type="button"
                      class="chip-tag-remove"
                      [attr.aria-label]="'Eltávolítás: ' + disposition"
                      (click)="removeDisposition(template.id, version.dispositions, i)"
                    >
                      <ma-icon name="close" size="sm" />
                    </button>
                  </span>
                }
                <input
                  type="text"
                  class="chip-tag-input"
                  [(ngModel)]="newDispositionText"
                  (keydown.enter)="addDisposition(template.id, version.dispositions, $event)"
                  (keydown.,)="addDisposition(template.id, version.dispositions, $event)"
                  placeholder="Új tanulási fókusz — Enter vagy , a hozzáadáshoz"
                />
              </div>
              <div class="muted t-body-sm" style="margin-top: 6px;">
                Enter vagy vessző zár egy elemet. Az X gomb eltávolítja.
              </div>
            </div>
          } @else {
            <div class="pill-row">
              @for (disposition of version.dispositions; track disposition) {
                <ma-chip icon="psychology">{{ disposition }}</ma-chip>
              } @empty {
                <div class="muted t-body-sm">Nincs rögzített tanulási fókusz.</div>
              }
            </div>
          }
        </section>

        <section class="assigned-section">
          <div class="section-title-row">
            <div>
              <div class="card-section-title">{{ unitsLabel() }}</div>
              <div class="muted t-body-sm">
                Időegységek és a hozzájuk rendelt matricák. Időegység-típust az albumterv fejlécében válthatsz.
              </div>
            </div>
          </div>

          <div class="week-sections">
            @for (section of weekSections(); track section.weekNumber) {
              <div class="week-section">
                <div class="week-section-head">
                  <div class="week-section-title-wrap">
                    <span class="week-num">{{ section.weekNumber }}. {{ unitLabel() }}</span>
                    @if (editing()) {
                      <input
                        class="meta-input week-title-input"
                        type="text"
                        [value]="section.title"
                        [placeholder]="'A ' + section.weekNumber + '. ' + unitLabel() + ' fókusza'"
                        (input)="patchWeekTitle(template.id, version.weeks, $index, $any($event.target).value)"
                      />
                    } @else {
                      <span class="week-title">{{ section.title }}</span>
                    }
                  </div>
                  <div class="row" style="gap: 8px;">
                    <ma-btn variant="secondary" size="sm" icon="add" (clicked)="openPicker(template.id, section.weekNumber)">
                      Matrica
                    </ma-btn>
                    @if (editing()) {
                      <button
                        type="button"
                        class="unit-remove-btn"
                        [attr.aria-label]="unitLabel() + ' eltávolítása'"
                        (click)="removeUnit(template.id, version.weeks, $index)"
                      >
                        <ma-icon name="delete" size="sm" />
                      </button>
                    }
                  </div>
                </div>

                <div
                  class="template-sticker-grid"
                  [class.is-empty]="section.stickers.length === 0"
                  cdkDropList
                  [cdkDropListData]="section"
                  [cdkDropListConnectedTo]="dropListIds()"
                  [id]="'unit-' + section.weekNumber"
                  [cdkDropListDisabled]="!isDraftView()"
                  (cdkDropListDropped)="onStickerDropped(template.id, $event)"
                  cdkDropListOrientation="horizontal"
                >
                  @if (section.stickers.length === 0) {
                    <div class="empty-week">
                      <ma-icon name="bookmark_added" />
                      <span>Nincs matrica ezen a {{ unitLabel() }}en.</span>
                    </div>
                  }
                  @for (sticker of section.stickers; track sticker.id) {
                      <div class="template-sticker-card-wrap" cdkDrag [cdkDragData]="sticker" [cdkDragDisabled]="!isDraftView()">
                        <button type="button" class="template-sticker-card" (click)="openSticker(sticker)">
                          <div class="row-between">
                            <ma-phase-chip [phase]="sticker.phase" />
                            <div class="row wrap">
                              <ma-chip icon="history">v{{ sticker.stickerVersionNumber }}</ma-chip>
                              <ma-chip icon="sort">{{ sticker.sortOrder }}. hely</ma-chip>
                            </div>
                          </div>
                          <div>
                            <div class="t-title-lg">{{ sticker.title }}</div>
                            <div class="muted t-body" style="margin-top: 8px;">{{ sticker.short }}</div>
                          </div>
                        </button>
                        @if (isDraftView()) {
                          <div class="sticker-move-row">
                            <button
                              type="button"
                              class="move-btn"
                              [attr.aria-label]="'Egy ' + unitLabel() + 'tel feljebb'"
                              [disabled]="sticker.week <= 1"
                              (click)="moveStickerUp(template.id, sticker)"
                            >
                              <ma-icon name="arrow_upward" size="sm" />
                            </button>
                            <button
                              type="button"
                              class="move-btn"
                              [attr.aria-label]="'Egy ' + unitLabel() + 'tel lejjebb'"
                              [disabled]="sticker.week >= version.weeks.length"
                              (click)="moveStickerDown(template.id, sticker, version.weeks.length)"
                            >
                              <ma-icon name="arrow_downward" size="sm" />
                            </button>
                            <button
                              type="button"
                              class="move-btn"
                              aria-label="Sorrendben balra"
                              [disabled]="sticker.sortOrder <= 1"
                              (click)="moveStickerLeft(template.id, sticker)"
                            >
                              <ma-icon name="arrow_back" size="sm" />
                            </button>
                            <button
                              type="button"
                              class="move-btn"
                              aria-label="Sorrendben jobbra"
                              [disabled]="!canMoveStickerRight(sticker)"
                              (click)="moveStickerRight(template.id, sticker)"
                            >
                              <ma-icon name="arrow_forward" size="sm" />
                            </button>
                            <button
                              type="button"
                              class="sticker-remove-btn"
                              [attr.aria-label]="'Matrica eltávolítása: ' + sticker.title"
                              (click)="removeSticker(template.id, sticker.id)"
                            >
                              <ma-icon name="delete" size="sm" />
                            </button>
                          </div>
                        }
                      </div>
                    }
                </div>

                @if (pickerOpenForWeek() === section.weekNumber) {
                  <div class="picker-card">
                    <div class="row-between">
                      <div>
                        <div class="card-section-title">Matricák a {{ section.weekNumber }}. hétre</div>
                        <div class="muted t-body-sm">Kattints egy matricára a hozzáadáshoz.</div>
                      </div>
                      <ma-btn variant="ghost" size="sm" icon="close" (clicked)="closePicker()">Bezárás</ma-btn>
                    </div>
                    <div class="picker-grid">
                      @for (item of pickerStickers(); track item.id) {
                        <button
                          type="button"
                          class="picker-card-item"
                          (click)="addStickerToWeek(template.id, item.latestVersionId, section.weekNumber)"
                        >
                          <div class="row-between">
                            <ma-phase-chip [phase]="item.phase" />
                            <ma-chip icon="history">v{{ item.latestVersionNumber }}</ma-chip>
                          </div>
                          <div class="t-title">{{ item.title }}</div>
                          <div class="muted t-body-sm">{{ item.short }}</div>
                        </button>
                      } @empty {
                        <div class="muted t-body-sm">Nincs választható matrica a tárban.</div>
                      }
                    </div>
                  </div>
                }
              </div>
            }
          </div>

          @if (editing()) {
            <button
              type="button"
              class="add-unit-btn"
              (click)="addUnit(template.id, version.weeks)"
            >
              <ma-icon name="add_circle" />
              <span>{{ addUnitLabel() }}</span>
            </button>
          }
        </section>
        }
      } @else if (store.albumTemplateLoading()) {
        <div class="loading-state">
          <ma-icon name="progress_activity" size="xl" />
          <div class="muted t-body">Albumterv betöltése…</div>
        </div>
      } @else {
        <div class="empty-state">
          <ma-icon name="edit_note" size="xl" />
          <div>
            <div class="t-title">Nincs megnyitott albumterv</div>
            <div class="muted t-body-sm">Térj vissza az Albumtervek listához.</div>
          </div>
          <ma-btn variant="secondary" icon="arrow_back" (clicked)="backToList()">Visszatérés</ma-btn>
        </div>
      }
    </div>
  `,
  styles: `
    .template-detail {
      display: grid;
      gap: 22px;
    }

    .detail-head {
      align-items: flex-start;
      margin-bottom: 18px;
    }

    .head-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      flex-wrap: wrap;
      max-width: 520px;
    }

    .version-select {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border: 1px solid var(--n-300);
      border-radius: 12px;
      background: white;
      font-size: 13px;
      color: var(--n-700);
    }

    .version-select span {
      color: var(--n-500);
      font-weight: 600;
    }

    .version-select select {
      max-width: 220px;
      border: 0;
      outline: none;
      background: transparent;
      color: var(--n-800);
      font: inherit;
    }

    .meta-grid {
      display: grid;
      grid-template-columns: minmax(0, 1.1fr) minmax(280px, 0.9fr);
      gap: 22px;
    }

    .detail-card {
      border-radius: 16px;
      padding: 22px;
    }

    .quote {
      font-size: 20px;
      line-height: 30px;
      color: var(--n-800);
    }

    .audience-label {
      margin-top: 18px;
    }

    .project-prompts-label {
      margin-top: 20px;
    }

    .project-prompts-editor {
      display: grid;
      gap: 10px;
    }

    .project-prompt-row {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 34px;
      gap: 8px;
      align-items: start;
    }

    .project-prompt-input {
      margin: 0;
    }

    .project-prompt-remove {
      width: 34px;
      height: 34px;
      display: inline-grid;
      place-items: center;
      border: 1px solid var(--n-200);
      border-radius: 10px;
      background: white;
      color: var(--n-600);
      cursor: pointer;

      &:disabled {
        opacity: 0.45;
        cursor: not-allowed;
      }
    }

    .project-prompts-list {
      margin: 8px 0 0;
      padding-left: 20px;
      color: var(--n-700);
      display: grid;
      gap: 6px;
    }

    .week-outline {
      display: grid;
      gap: 10px;
    }

    .week-outline-row {
      display: grid;
      grid-template-columns: 86px minmax(0, 1fr);
      gap: 14px;
      align-items: baseline;
      padding: 10px 0;
      border-bottom: 1px solid var(--n-100);
    }

    .week-outline-row:last-child {
      border-bottom: 0;
    }

    .week-num {
      color: var(--primary-700);
      font-weight: 600;
      font-size: 13px;
    }

    .week-title {
      color: var(--n-800);
      font-size: 14px;
      line-height: 21px;
    }

    .assigned-section {
      display: grid;
      gap: 16px;
      margin-top: 10px;
    }

    .section-title-row,
    .week-section-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
    }
    .week-section-title-wrap {
      display: flex;
      align-items: center;
      gap: 12px;
      flex: 1 1 auto;
      min-width: 0;
    }
    .week-title-input {
      flex: 1 1 220px;
      max-width: 420px;
    }
    .unit-remove-btn {
      background: white;
      border: 1px solid var(--n-200);
      border-radius: 8px;
      width: 30px;
      height: 30px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: var(--n-600);
    }
    .unit-remove-btn:hover {
      background: var(--n-50);
      color: var(--n-800);
    }
    .add-unit-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 14px;
      margin-top: 14px;
      border: 1px dashed var(--primary-300, #c7bff0);
      background: #fdfcff;
      border-radius: 12px;
      color: var(--primary-700, #4c3fa3);
      cursor: pointer;
      font: inherit;
    }
    .add-unit-btn:hover {
      background: #f7f4ff;
      border-style: solid;
    }

    .week-sections {
      display: grid;
      gap: 18px;
    }

    .week-section {
      display: grid;
      gap: 14px;
      padding: 18px;
      border: 1px solid var(--n-200);
      border-radius: 16px;
      background: white;
    }

    .template-sticker-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 16px;
      /* Always reserve a CDK drop target, even when the unit has no stickers yet. */
      min-height: 60px;
    }
    .template-sticker-grid.is-empty {
      grid-template-columns: 1fr;
    }
    .template-sticker-grid.is-empty .empty-week {
      width: 100%;
    }
    .template-sticker-grid.cdk-drop-list-receiving .empty-week {
      border-color: var(--primary-300, #c7bff0);
      background: #f7f4ff;
      color: var(--primary-700, #4c3fa3);
    }

    .template-sticker-card {
      min-height: 164px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 18px;
      padding: 18px;
      border: 1px solid var(--n-200);
      border-radius: 16px;
      background: white;
      text-align: left;
      font: inherit;
      color: inherit;
      cursor: pointer;
      transition: border-color 120ms ease, box-shadow 120ms ease;
    }

    .template-sticker-card:hover {
      border-color: var(--primary-300);
      box-shadow: var(--shadow-md);
    }

    .template-sticker-card:focus-visible {
      outline: 2px solid var(--primary-400, #7c6ce0);
      outline-offset: 2px;
    }

    .empty-week,
    .loading-state,
    .empty-state {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 22px;
      border: 1px dashed var(--n-300);
      border-radius: 16px;
      background: var(--n-50);
      color: var(--n-700);
    }

    .loading-state {
      justify-content: center;
      min-height: 260px;
    }

    @media (max-width: 1100px) {
      .meta-grid,
      .template-sticker-grid {
        grid-template-columns: 1fr;
      }
    }

    .title-input {
      font-size: 30px;
      font-weight: 600;
      letter-spacing: -0.4px;
      width: 100%;
      padding: 8px 12px;
      border: 1px solid var(--primary-300, #c7bff0);
      border-radius: 10px;
      background: #fdfcff;
      font-family: inherit;
      color: inherit;
    }
    .sub-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 10px;
      margin-top: 8px;
    }
    .sub-grid.labeled {
      grid-template-columns: 1fr 1fr 1fr;
      gap: 12px;
      margin-top: 12px;
    }
    .field-label {
      display: block;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.2px;
      text-transform: uppercase;
      color: var(--n-600);
      margin: 0 0 6px 4px;
    }
    .sub-grid.labeled .field {
      display: grid;
      gap: 4px;
    }
    .sub-grid.labeled .field > span {
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.2px;
      text-transform: uppercase;
      color: var(--n-600);
      padding-left: 4px;
    }
    .meta-input,
    .meta-textarea {
      width: 100%;
      padding: 8px 10px;
      border: 1px solid var(--n-200);
      border-radius: 8px;
      font: inherit;
      background: white;
      color: inherit;
      box-sizing: border-box;
    }
    .meta-textarea { resize: vertical; }
    .meta-input:focus-visible,
    .meta-textarea:focus-visible,
    .title-input:focus-visible {
      outline: 2px solid var(--primary-400, #7c6ce0);
      outline-offset: 1px;
    }

    .chip-input {
      display: grid;
      gap: 4px;
    }
    .chip-input-tags {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 6px;
      padding: 8px;
      border: 1px solid var(--n-200);
      border-radius: 10px;
      background: white;
      min-height: 44px;
    }
    .chip-tag {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 4px 4px 10px;
      border-radius: 999px;
      background: var(--primary-50, #f3f0ff);
      color: var(--primary-700, #4b3aaf);
      font-size: 13px;
    }
    .chip-tag-remove {
      display: inline-grid;
      place-items: center;
      width: 22px;
      height: 22px;
      border: 0;
      border-radius: 50%;
      background: transparent;
      color: var(--primary-700, #4b3aaf);
      cursor: pointer;
    }
    .chip-tag-remove:hover {
      background: var(--primary-100, #efeaff);
    }
    .chip-tag-input {
      flex: 1 1 180px;
      min-width: 120px;
      border: 0;
      outline: none;
      padding: 6px 8px;
      font: inherit;
      background: transparent;
    }

    .week-edit-list {
      display: grid;
      gap: 8px;
    }
    .week-edit-row {
      display: grid;
      grid-template-columns: 90px 1fr;
      gap: 10px;
      align-items: center;
    }
    .week-edit-row .week-num {
      font-weight: 600;
      color: var(--n-700);
    }
    .week-input { padding: 6px 10px; }

    .draft-banner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 14px;
      padding: 12px 16px;
      border: 1px solid var(--primary-200, #d8d1ff);
      border-left: 4px solid var(--primary-500, #6f5ad9);
      background: #f7f3ff;
      border-radius: 12px;
      flex-wrap: wrap;
    }
    .draft-banner ma-icon { color: var(--primary-600, #5b4cb6); }

    .template-sticker-card-wrap {
      display: grid;
      gap: 8px;
    }

    .template-sticker-card-wrap.cdk-drag-dragging {
      opacity: 0.85;
    }
    .cdk-drag-preview {
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
      border-radius: 14px;
      background: white;
    }
    .cdk-drag-placeholder {
      opacity: 0.25;
    }
    .template-sticker-grid.cdk-drop-list-dragging .template-sticker-card-wrap:not(.cdk-drag-placeholder) {
      transition: transform 180ms cubic-bezier(0, 0, 0.2, 1);
    }

    .sticker-move-row {
      display: flex;
      gap: 6px;
      align-items: center;
      padding: 8px 10px;
      border: 1px dashed var(--n-200);
      border-radius: 10px;
      background: #faf8f5;
    }
    .move-btn {
      display: inline-grid;
      place-items: center;
      width: 30px;
      height: 30px;
      border: 1px solid var(--n-300);
      border-radius: 8px;
      background: white;
      cursor: pointer;
      color: var(--n-700);
    }
    .move-btn:hover:not(:disabled) {
      background: var(--n-50);
      border-color: var(--primary-300, #c7bff0);
      color: var(--primary-700, #4c3fa3);
    }
    .move-btn:disabled {
      opacity: 0.35;
      cursor: not-allowed;
    }
    .sticker-move-row .sticker-remove-btn { margin-left: auto; }
    .sticker-remove-btn {
      display: inline-grid;
      place-items: center;
      width: 36px;
      height: 36px;
      border: 1px solid var(--n-200);
      border-radius: 8px;
      background: white;
      cursor: pointer;
      color: var(--danger, #c14444);
    }
    .sticker-remove-btn:hover {
      background: #fff5f5;
      border-color: var(--danger, #c14444);
    }

    .picker-card {
      margin-top: 12px;
      padding: 16px;
      border: 1px solid var(--primary-200, #d8d1ff);
      border-radius: 12px;
      background: #fdfcff;
    }
    .picker-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 10px;
      margin-top: 10px;
    }
    .picker-card-item {
      display: grid;
      gap: 6px;
      padding: 12px;
      border: 1px solid var(--n-200);
      border-radius: 10px;
      background: white;
      text-align: left;
      cursor: pointer;
      font: inherit;
      color: inherit;
      transition: border-color 120ms, box-shadow 120ms;
    }
    .picker-card-item:hover {
      border-color: var(--primary-300);
      box-shadow: var(--shadow-md);
    }
    @media (max-width: 900px) {
      .picker-grid { grid-template-columns: 1fr; }
    }
  `,
})
export class AlbumTemplateDetailComponent implements OnInit, OnDestroy {
  readonly store = inject(AlbumStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private routeSub?: Subscription;
  readonly template = this.store.activeAlbumTemplate;

  ngOnInit(): void {
    this.routeSub = this.route.paramMap.subscribe(params => {
      const id = params.get('templateId');
      if (!id) return;
      if (this.store.activeTemplateId() !== id || !this.store.activeAlbumTemplate()) {
        void this.store.openAlbumTemplate(id);
      }
    });
  }

  ngOnDestroy(): void { this.routeSub?.unsubscribe(); }
  readonly selectedVersionSelection = signal<{
    templateId: string | null;
    latestVersionId: string | null;
    versionId: string | null;
  }>({ templateId: null, latestVersionId: null, versionId: null });

  readonly isSelected = computed(() => {
    const template = this.template();
    return !!template && template.id === this.store.activeTemplateId();
  });

  readonly selectedVersion = computed(() => {
    const template = this.template();
    if (!template || template.versions.length === 0) return null;
    const draft = template.versions.find(v => v.isDraft);
    // Without an explicit user selection, prefer the draft (most editable surface) if present,
    // otherwise fall back to the latest published version (versions[0] is descending order).
    const defaultVersion = draft ?? template.versions[0];
    const selection = this.selectedVersionSelection();
    if (selection.templateId !== template.id || selection.latestVersionId !== template.versions[0].id) {
      return defaultVersion;
    }
    return template.versions.find(version => version.id === selection.versionId) ?? defaultVersion;
  });

  readonly draftVersion = computed(() => this.template()?.versions.find(v => v.isDraft) ?? null);
  readonly isDraftView = computed(() => this.selectedVersion()?.isDraft === true);

  /** Singular unit label derived from the selected version's durationType. */
  readonly unitLabel = computed(() => {
    const type = this.selectedVersion()?.durationType ?? 'het';
    return type === 'het' ? 'hét' : type === 'ora' ? 'óra' : 'fázis';
  });

  /** Plural / section-header form of the unit label. */
  readonly unitsLabel = computed(() => {
    const type = this.selectedVersion()?.durationType ?? 'het';
    return type === 'het' ? 'Hetek' : type === 'ora' ? 'Órák' : 'Fázisok';
  });

  /** "Új X hozzáadása" CTA label. */
  readonly addUnitLabel = computed(() => `Új ${this.unitLabel()} hozzáadása`);

  /** True when the page is rendering metadata as editable inputs. Mirrors the store flag. */
  readonly editing = this.store.editingTemplate;

  /** Local chip-tag input buffer for dispositions. */
  newDispositionText = '';

  readonly pickerOpenForWeek = signal<number | null>(null);
  readonly patterns = ALBUM_TEMPLATE_PATTERNS;
  readonly pickerStickers = computed(() =>
    this.store.stickerLibrary().filter(item => !item.archivedAt),
  );

  readonly weekSections = computed(() => {
    const version = this.selectedVersion();
    if (!version) return [];

    const weekNumbers = new Set<number>([
      ...version.weeks.map(week => week.weekNumber),
      ...version.stickers.map(sticker => sticker.week),
    ]);

    return [...weekNumbers].sort((a, b) => a - b).map(weekNumber => ({
      weekNumber,
      title: version.weeks.find(week => week.weekNumber === weekNumber)?.title ?? `Névtelen ${this.unitLabel()}`,
      stickers: version.stickers
        .filter(sticker => sticker.week === weekNumber)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    }));
  });

  /** CDK needs every drop list's DOM id so it knows where this unit can drop into. */
  readonly dropListIds = computed(() => this.weekSections().map(section => `unit-${section.weekNumber}`));

  backToList(): void {
    this.store.closeAlbumTemplate();
    void this.router.navigate(['/teacher/templates']);
  }

  selectTemplate(id: string): void {
    this.store.selectTemplate(id);
  }

  selectVersion(event: Event): void {
    const template = this.template();
    this.selectedVersionSelection.set({
      templateId: template?.id ?? null,
      latestVersionId: template?.versions[0]?.id ?? null,
      versionId: (event.target as HTMLSelectElement).value,
    });
  }

  editTemplate(template: AlbumTemplateDetail): void {
    // Legacy drawer flow retained but no longer the default entry point.
    this.store.openTemplateVersionWizard(template);
  }

  async enterEdit(templateId: string): Promise<void> {
    await this.store.enterTemplateEdit(templateId);
  }

  exitEdit(): void {
    this.store.exitTemplateEdit();
  }

  /** A fresh template is one that has only its initial draft (v1) and has not been published yet. */
  isFreshDraft(template: AlbumTemplateDetail): boolean {
    return template.versions.length === 1 && template.versions[0].isDraft;
  }

  async discardFresh(templateId: string): Promise<void> {
    await this.store.discardFreshTemplate(templateId);
  }

  patchMetadata(templateId: string, patch: Record<string, unknown>): void {
    this.store.scheduleTemplateMetadataPatch(templateId, patch);
  }

  patchPatternMetadata(templateId: string, patternKey: string): void {
    const pattern = this.patterns.find(item => item.key === patternKey) ?? this.patterns[0];
    this.store.scheduleTemplateMetadataPatch(templateId, {
      patternKey: pattern.key,
      patternName: pattern.name,
      patternDescription: pattern.description,
    });
  }

  addDisposition(templateId: string, current: string[], event: Event): void {
    event.preventDefault();
    const value = this.newDispositionText.trim().replace(/,$/, '').trim();
    if (!value) return;
    if (current.includes(value)) {
      this.newDispositionText = '';
      return;
    }
    this.newDispositionText = '';
    const next = [...current, value];
    this.store.scheduleTemplateMetadataPatch(templateId, { dispositions: next });
  }

  removeDisposition(templateId: string, current: string[], index: number): void {
    const next = current.filter((_, i) => i !== index);
    this.store.scheduleTemplateMetadataPatch(templateId, { dispositions: next });
  }

  patchProjectReflectionPrompt(templateId: string, current: string[], index: number, value: string): void {
    const next = current.map((prompt, i) => (i === index ? value : prompt));
    this.store.scheduleTemplateMetadataPatch(templateId, { projectReflectionPrompts: next });
  }

  addProjectReflectionPrompt(templateId: string, current: string[]): void {
    if (current.length >= 5) return;
    this.store.scheduleTemplateMetadataPatch(templateId, { projectReflectionPrompts: [...current, 'Mit vinnétek tovább ebből a projektből?'] });
  }

  removeProjectReflectionPrompt(templateId: string, current: string[], index: number): void {
    if (current.length <= 1) return;
    const next = current.filter((_, i) => i !== index);
    this.store.scheduleTemplateMetadataPatch(templateId, { projectReflectionPrompts: next });
  }

  patchWeekTitle(
    templateId: string,
    weeks: { weekNumber: number; title: string }[],
    index: number,
    value: string,
  ): void {
    // Send only the ordered list of week titles — server rebuilds the rows in order.
    const titles = weeks.map((week, i) => (i === index ? value : week.title));
    this.store.scheduleTemplateMetadataPatch(templateId, { weekTitles: titles });
  }

  async addUnit(templateId: string, weeks: { weekNumber: number; title: string }[]): Promise<void> {
    // Touching the units implies an edit — ensure the draft exists first so the patch lands there.
    await this.store.ensureTemplateDraft(templateId);
    const titles = [...weeks.map(week => week.title), ''];
    this.store.scheduleTemplateMetadataPatch(templateId, { weekTitles: titles });
  }

  async removeUnit(templateId: string, weeks: { weekNumber: number; title: string }[], index: number): Promise<void> {
    await this.store.ensureTemplateDraft(templateId);
    const titles = weeks.map(week => week.title).filter((_, i) => i !== index);
    this.store.scheduleTemplateMetadataPatch(templateId, { weekTitles: titles });
  }

  toggleArchive(id: string): void {
    void this.store.toggleTemplateArchive(id);
  }

  openSticker(sticker: TemplateStickerView): void {
    void this.store.openStickerResourceReadOnly(sticker.stickerResourceId);
  }

  comingSoon(label: string): void {
    this.store.showToast(`${label}: hamarosan elérhető.`, 'construction');
  }

  // --- Draft management -----------------------------------------------------------------

  async publishDraft(templateId: string): Promise<void> {
    await this.store.publishTemplateDraft(templateId);
    // After publish, follow the freshly-promoted version.
    this.selectedVersionSelection.set({ templateId: null, latestVersionId: null, versionId: null });
  }

  async discardDraft(templateId: string): Promise<void> {
    await this.store.discardTemplateDraft(templateId);
    this.closePicker();
    this.selectedVersionSelection.set({ templateId: null, latestVersionId: null, versionId: null });
  }

  // --- Sticker management (auto-creates the draft on first edit) ------------------------

  async openPicker(templateId: string, weekNumber: number): Promise<void> {
    // Creating a draft on first interaction so the embedded picker writes into the right place.
    await this.store.ensureTemplateDraft(templateId);
    this.pickerOpenForWeek.set(weekNumber);
  }

  closePicker(): void {
    this.pickerOpenForWeek.set(null);
  }

  async addStickerToWeek(templateId: string, stickerVersionId: string, weekNumber: number): Promise<void> {
    await this.store.addStickerToTemplateDraft(templateId, stickerVersionId, weekNumber, 0);
    this.pickerOpenForWeek.set(null);
  }

  async removeSticker(templateId: string, templateStickerId: string): Promise<void> {
    await this.store.removeStickerFromTemplateDraft(templateId, templateStickerId);
  }

  // --- Sticker movement controls (drag-drop + arrow buttons) ----------------------------

  /**
   * Handle a CDK drag-drop. Two cases:
   *   - same unit → reorder by reassigning sortOrder among siblings.
   *   - cross-unit → move sticker to new unit at the dropped index, then renumber siblings.
   * Goes through the bulk reorder endpoint so the unique (versionId, Week, SortOrder)
   * index doesn't collide mid-update.
   */
  onStickerDropped(
    templateId: string,
    event: CdkDragDrop<{ weekNumber: number; title: string; stickers: TemplateStickerView[] }>,
  ): void {
    const dragged = event.item.data as TemplateStickerView;
    const targetSection = event.container.data;
    if (!dragged || !targetSection) return;
    const targetWeek = targetSection.weekNumber;
    const sourceWeek = dragged.week;
    const newIndex = event.currentIndex;

    const items: Array<{ id: string; week: number; sortOrder: number }> = [];

    const destStickers = (this.selectedVersion()?.stickers.filter(s => s.week === targetWeek && s.id !== dragged.id) ?? [])
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder);
    const clampedIndex = Math.min(newIndex, destStickers.length);
    destStickers.splice(clampedIndex, 0, dragged);
    destStickers.forEach((sticker, index) => {
      const desiredSort = index + 1;
      const desiredWeek = sticker.id === dragged.id ? targetWeek : sticker.week;
      if (sticker.sortOrder === desiredSort && sticker.week === desiredWeek) return;
      items.push({ id: sticker.id, week: desiredWeek, sortOrder: desiredSort });
    });

    if (sourceWeek !== targetWeek) {
      const sourceStickers = (this.selectedVersion()?.stickers.filter(s => s.week === sourceWeek && s.id !== dragged.id) ?? [])
        .slice()
        .sort((a, b) => a.sortOrder - b.sortOrder);
      sourceStickers.forEach((sticker, index) => {
        const desiredSort = index + 1;
        if (sticker.sortOrder === desiredSort) return;
        items.push({ id: sticker.id, week: sticker.week, sortOrder: desiredSort });
      });
    }

    void this.store.reorderTemplateStickers(templateId, items);
  }


  /** Move a sticker into the previous unit, appending it at the end of that unit's order. */
  moveStickerUp(templateId: string, sticker: TemplateStickerView): void {
    if (sticker.week <= 1) return;
    this.moveStickerToUnit(templateId, sticker, sticker.week - 1);
  }

  moveStickerDown(templateId: string, sticker: TemplateStickerView, unitCount: number): void {
    if (sticker.week >= unitCount) return;
    this.moveStickerToUnit(templateId, sticker, sticker.week + 1);
  }

  moveStickerLeft(templateId: string, sticker: TemplateStickerView): void {
    if (sticker.sortOrder <= 1) return;
    this.swapStickerSort(templateId, sticker, sticker.sortOrder - 1);
  }

  moveStickerRight(templateId: string, sticker: TemplateStickerView): void {
    if (!this.canMoveStickerRight(sticker)) return;
    this.swapStickerSort(templateId, sticker, sticker.sortOrder + 1);
  }

  canMoveStickerRight(sticker: TemplateStickerView): boolean {
    const stickersInWeek = this.selectedVersion()?.stickers.filter(item => item.week === sticker.week).length ?? 0;
    return sticker.sortOrder < stickersInWeek;
  }

  /** Swap sortOrders with the sticker currently at `targetOrder` in the same unit (atomic bulk PATCH). */
  private swapStickerSort(templateId: string, sticker: TemplateStickerView, targetOrder: number): void {
    const version = this.selectedVersion();
    if (!version) return;
    const partner = version.stickers.find(item => item.week === sticker.week && item.sortOrder === targetOrder);
    const items: Array<{ id: string; week: number; sortOrder: number }> = [
      { id: sticker.id, week: sticker.week, sortOrder: targetOrder },
    ];
    if (partner) items.push({ id: partner.id, week: partner.week, sortOrder: sticker.sortOrder });
    void this.store.reorderTemplateStickers(templateId, items);
  }

  /** Move a sticker into a different unit; append to the end and renumber the source unit. */
  private moveStickerToUnit(templateId: string, sticker: TemplateStickerView, targetWeek: number): void {
    const version = this.selectedVersion();
    if (!version) return;
    const targetSort = version.stickers
      .filter(item => item.week === targetWeek)
      .reduce((acc, item) => Math.max(acc, item.sortOrder), 0) + 1;
    const items: Array<{ id: string; week: number; sortOrder: number }> = [
      { id: sticker.id, week: targetWeek, sortOrder: targetSort },
    ];
    // Renumber the source unit so we don't leave gaps.
    version.stickers
      .filter(item => item.week === sticker.week && item.id !== sticker.id)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .forEach((item, index) => {
        const desired = index + 1;
        if (item.sortOrder !== desired) {
          items.push({ id: item.id, week: item.week, sortOrder: desired });
        }
      });
    void this.store.reorderTemplateStickers(templateId, items);
  }
}
