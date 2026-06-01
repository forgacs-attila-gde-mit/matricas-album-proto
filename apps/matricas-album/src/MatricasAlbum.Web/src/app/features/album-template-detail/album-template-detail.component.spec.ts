import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { AlbumStore } from '../../core/services/album.store';
import { AlbumTemplateDetailComponent } from './album-template-detail.component';

// A single published version + its parent template, enough to render the editor.
function makeStore() {
  const version = {
    id: 'v1',
    albumTemplateId: 'tpl-1',
    versionNumber: 1,
    isDraft: false,
    title: 'Városi mikroklíma',
    subject: 'Integrált természettudomány',
    grade: '7. évfolyam',
    durationType: 'het',
    patternKey: 'altalanos',
    patternName: 'Általános album',
    patternDescription: '',
    duration: '4 hét',
    drivingQ: 'Hogyan tehetnénk élhetőbbé az iskola környékét a hőségben?',
    finalProduct: 'Javaslatcsomag makettel és mérési adatokkal',
    audience: 'Osztály és iskolavezetés',
    projectReflectionPrompts: ['Mit változtatott meg a bizonyíték?'],
    createdAt: '2026-01-01',
    differentiationPaths: [],
    dispositions: ['kíváncsiság', 'együttműködés'],
    weeks: [{ weekNumber: 1, title: 'Kérdezés és terepi megfigyelés' }],
    stickers: [],
  };
  const template = {
    id: 'tpl-1',
    archivedAt: null,
    title: version.title,
    subject: version.subject,
    grade: version.grade,
    durationType: 'het',
    patternKey: 'altalanos',
    patternName: 'Általános album',
    patternDescription: '',
    duration: '4 hét',
    drivingQ: version.drivingQ,
    finalProduct: version.finalProduct,
    audience: version.audience,
    projectReflectionPrompts: version.projectReflectionPrompts,
    differentiationPaths: [],
    dispositions: version.dispositions,
    weeks: version.weeks,
    stickers: version.stickers,
    versions: [version],
    qualityDims: [],
    aiNotes: [],
  };
  return {
    activeAlbumTemplate: signal(template),
    activeTemplateId: signal('tpl-1'),
    editingTemplate: signal(true),
    albumTemplateLoading: signal(false),
    stickerLibrary: signal([] as unknown[]),
    openAlbumTemplate: () => Promise.resolve(),
    showToast: () => {},
  };
}

describe('AlbumTemplateDetailComponent — secondary-metadata disclosure (Task 1.5)', () => {
  let fixture: ComponentFixture<AlbumTemplateDetailComponent>;
  let el: HTMLElement;
  // Stable selectors: the Vezérkérdés textarea (primary) vs the Záró produktum textarea (secondary).
  const PRIMARY = '[placeholder="Az album több héten átívelő nyílt kérdése"]';
  const SECONDARY = '[placeholder="Mit készít el a végén a csapat?"]';

  beforeEach(async () => {
    const store = makeStore();
    await TestBed.configureTestingModule({
      imports: [AlbumTemplateDetailComponent],
      providers: [
        { provide: AlbumStore, useValue: store as unknown as AlbumStore },
        { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({ templateId: 'tpl-1' })) } },
        { provide: Router, useValue: { navigate: () => {} } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(AlbumTemplateDetailComponent);
    el = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  });

  it('keeps the driving question (Vezérkérdés) visible by default', () => {
    expect(el.querySelector(PRIMARY)).not.toBeNull();
  });

  it('hides the secondary metadata (Záró produktum) behind a "Részletek" disclosure', () => {
    expect(el.querySelector('[data-disclosure="details"]')).not.toBeNull();
    expect(el.querySelector(SECONDARY)).toBeNull();
  });

  it('reveals the secondary metadata when the disclosure is toggled', () => {
    (el.querySelector('[data-disclosure="details"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(el.querySelector(SECONDARY)).not.toBeNull();
  });
});
