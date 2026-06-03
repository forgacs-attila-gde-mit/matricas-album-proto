import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { AlbumTemplateDetailComponent } from './album-template-detail.component';
import { AlbumStore } from '../../core/services/album.store';

const PRIMARY = '.detail-card .quote'; // Vezérkérdés body
const SECONDARY = '[name=""], .project-prompts-list'; // Záró produktum card content

function makeFakeStore() {
  const version = {
    id: 'v1',
    versionNumber: 1,
    isDraft: false,
    title: 'Városi mikroklíma nyomában',
    subject: 'Integrált természettudomány',
    grade: '7-8. évfolyam',
    duration: '4 hét',
    durationType: 'het',
    patternKey: 'altalanos',
    patternName: 'Általános',
    drivingQ: 'Hogyan tehetnénk élhetőbbé az iskola környékét?',
    finalProduct: 'Javaslatcsomag makettel',
    audience: 'Osztálytársak, iskolavezetés',
    projectReflectionPrompts: ['Mit tanultatok?'],
    dispositions: ['Kíváncsiság'],
    weeks: [{ weekNumber: 1, title: 'Kérdezés' }],
    stickers: [],
  };
  return {
    activeAlbumTemplate: signal({
      id: 'tpl-1',
      title: version.title,
      archivedAt: null,
      versions: [version],
    }),
    activeTemplateId: signal('tpl-1'),
    albumTemplateLoading: signal(false),
    editingTemplate: signal(false),
    stickerLibrary: signal([]),
    openAlbumTemplate: () => Promise.resolve(),
    closeAlbumTemplate: () => {},
    selectTemplate: () => {},
  };
}

describe('AlbumTemplateDetailComponent — Részletek disclosure (REFACTOR-003)', () => {
  let fixture: ComponentFixture<AlbumTemplateDetailComponent>;
  let el: HTMLElement;

  const disclosureToggle = () =>
    el.querySelector('ma-disclosure button.disclosure-toggle') as HTMLButtonElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AlbumTemplateDetailComponent],
      providers: [
        { provide: AlbumStore, useValue: makeFakeStore() as unknown as AlbumStore },
        { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({ templateId: 'tpl-1' })) } },
        { provide: Router, useValue: { navigate: () => {} } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(AlbumTemplateDetailComponent);
    el = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  });

  it('keeps the driving question (Vezérkérdés) visible by default', () => {
    expect(el.querySelector(PRIMARY)?.textContent).toContain('Hogyan tehetnénk élhetőbbé');
  });

  it('hides the secondary metadata (Záró produktum, fókuszok) behind the collapsed "Részletek" disclosure', () => {
    expect(disclosureToggle()).not.toBeNull();
    expect(disclosureToggle().getAttribute('aria-expanded')).toBe('false');
    expect(el.textContent).not.toContain('Javaslatcsomag makettel');
    expect(el.querySelector('.pill-row')).toBeNull();
  });

  it('reveals the secondary metadata when the disclosure is toggled', () => {
    disclosureToggle().click();
    fixture.detectChanges();
    expect(el.textContent).toContain('Javaslatcsomag makettel');
    expect(el.querySelector('.pill-row')).not.toBeNull();
  });
});
