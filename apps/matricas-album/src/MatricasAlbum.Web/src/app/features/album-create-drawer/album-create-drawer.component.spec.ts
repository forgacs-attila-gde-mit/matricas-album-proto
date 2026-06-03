import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AlbumCreateDrawerComponent } from './album-create-drawer.component';
import { AlbumStore } from '../../core/services/album.store';

// Minimal fake AlbumStore: just enough surface for the drawer to render.
// The component is heavily store-coupled, so we provide the signals/values
// it reads during render and cast to AlbumStore.
function makeFakeStore() {
  return {
    wizardOpen: signal(true),
    wizardMode: signal('sticker'),
    stickerEntryContext: signal('manual'),
    templateEntryContext: signal('album'),
    newVersionPrefill: signal(null),
    newTemplateVersionPrefill: signal(null),
    instanceStickerPrefill: signal(null),
    stickerLibrary: signal([
      { id: 's1', title: 'Mintamatrica', latestVersionId: 'v1', archivedAt: null, phase: 'kerdezes', short: '' },
    ]),
    templates: signal([]),
    activeTemplateId: signal(null),
    album: { weekTitles: [] as string[], currentWeek: 1 },
    albumUnitLabel: 'hét',
    setWizardOpen: () => {},
    selectTemplate: () => {},
    openTemplateWizard: () => {},
    createSticker: jasmine.createSpy('createSticker').and.resolveTo(true),
    createTemplate: jasmine.createSpy('createTemplate').and.resolveTo(true),
  };
}

describe('AlbumCreateDrawerComponent — required-first + progressive disclosure (REFACTOR-003)', () => {
  let fixture: ComponentFixture<AlbumCreateDrawerComponent>;
  let el: HTMLElement;
  let fake: ReturnType<typeof makeFakeStore>;

  const disclosureToggle = () =>
    el.querySelector('ma-disclosure button.disclosure-toggle') as HTMLButtonElement;

  beforeEach(async () => {
    fake = makeFakeStore();
    await TestBed.configureTestingModule({
      imports: [AlbumCreateDrawerComponent],
      providers: [{ provide: AlbumStore, useValue: fake as unknown as AlbumStore }],
    }).compileComponents();
    fixture = TestBed.createComponent(AlbumCreateDrawerComponent);
    el = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  });

  it('shows only the required field and the type selector by default', () => {
    expect(el.querySelector('[name="stickerTitle"]')).not.toBeNull();
    expect(el.querySelector('.activity-type-card')).not.toBeNull();
    // Optional content (phase/evidence/descriptions/metadata) sits behind the disclosure.
    expect(el.querySelector('[name="stickerEvidence"]')).toBeNull();
    expect(el.querySelector('[name="stickerPhase"]')).toBeNull();
    expect(el.querySelector('[name="metadataSubject"]')).toBeNull();
    expect(disclosureToggle().getAttribute('aria-expanded')).toBe('false');
  });

  it('marks the title as required (visible asterisk + aria-required) and orders it before the optional section', () => {
    const title = el.querySelector('[name="stickerTitle"]') as HTMLInputElement;
    expect(title.getAttribute('aria-required')).toBe('true');
    expect(title.closest('ma-field')?.querySelector('.req')?.textContent).toContain('*');

    const disclosure = el.querySelector('ma-disclosure');
    expect(disclosure).not.toBeNull();
    expect(title.compareDocumentPosition(disclosure!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('reveals the optional sections (content, Tanítási keret, Adaptálás) when toggled', () => {
    disclosureToggle().click();
    fixture.detectChanges();
    expect(disclosureToggle().getAttribute('aria-expanded')).toBe('true');
    expect(el.querySelector('[name="stickerEvidence"]')).not.toBeNull();
    expect(el.querySelector('[name="metadataSubject"]')).not.toBeNull();
    expect(el.querySelector('[name="adaptSticker"]')).not.toBeNull();
  });

  it('saves with only the required field filled, without ever expanding the optional section', async () => {
    const c = fixture.componentInstance;
    c.stickerTitle = 'Csak cím';
    fixture.detectChanges();
    expect(c.canSubmit()).toBeTrue();
    expect(el.querySelector('[name="metadataSubject"]')).toBeNull();

    await c.submit();
    expect(fake.createSticker).toHaveBeenCalled();
  });

  it('submits an unchanged CreateStickerPayload shape (template restructure is payload-neutral)', async () => {
    const c = fixture.componentInstance;
    c.stickerTitle = 'Sebesség mérése';
    c.stickerShort = 'Rövid leírás';
    c.stickerInstruction = 'Mérjetek!';
    c.stickerEvidence = 'Mérési adatlap';
    fixture.detectChanges();

    await c.submit();
    const payload = fake.createSticker.calls.mostRecent().args[0];
    expect(Object.keys(payload).sort()).toEqual([
      'bPlan', 'evidenceTypeLabel', 'expectedProduct', 'lowResource', 'phase',
      'reflectionPrompt', 'shortDescription', 'studentChoice', 'studentInstruction',
      'teacherSteps', 'title',
    ]);
    expect(payload.title).toBe('Sebesség mérése');
    expect(payload.evidenceTypeLabel).toBe('Mérési adatlap');
  });

  describe('template mode', () => {
    beforeEach(() => {
      fake.wizardMode.set('template');
      fixture.detectChanges();
    });

    it('shows the two required fields and the pattern picker by default; the rest is collapsed', () => {
      expect(el.querySelector('[name="templateTitle"]')).not.toBeNull();
      expect(el.querySelector('[name="drivingQuestion"]')).not.toBeNull();
      expect(el.querySelector('.pattern-card')).not.toBeNull();
      expect(el.querySelector('[name="subject"]')).toBeNull();
      expect(el.querySelectorAll('.week-field input').length).toBe(0);
    });

    it('marks both required template fields with aria-required', () => {
      expect(el.querySelector('[name="templateTitle"]')?.getAttribute('aria-required')).toBe('true');
      expect(el.querySelector('[name="drivingQuestion"]')?.getAttribute('aria-required')).toBe('true');
    });

    it('reveals subject + outline fields when the disclosure is opened', () => {
      disclosureToggle().click();
      fixture.detectChanges();
      expect(el.querySelector('[name="subject"]')).not.toBeNull();
      // Dynamic [name] bindings don't reflect to DOM attributes — query by class.
      expect(el.querySelectorAll('.week-field input').length).toBeGreaterThan(0);
    });

    it('saves with only the required fields filled, without expanding the optional section', async () => {
      const c = fixture.componentInstance;
      c.templateTitle = 'Próbaterv';
      c.drivingQuestion = 'Miért?';
      fixture.detectChanges();
      expect(c.canSubmit()).toBeTrue();
      await c.submit();
      expect(fake.createTemplate).toHaveBeenCalled();
    });
  });

  describe('instance mode + footer a11y', () => {
    beforeEach(() => {
      fake.wizardMode.set('instance');
      fake.templates.set([
        { id: 't1', title: 'Mintaterv', archivedAt: null, isDraftOnly: false },
      ] as never);
      fixture.detectChanges();
    });

    it('shows the required Albumterv + name fields by default and collapses the rest', () => {
      expect(el.querySelector('[name="template"]')).not.toBeNull();
      expect(el.querySelector('[name="instanceTitle"]')?.getAttribute('aria-required')).toBe('true');
      expect(el.querySelector('[name="className"]')).toBeNull();
      expect(el.querySelector('[name="teamLines"]')).toBeNull();
    });

    it('keeps the footer hint in a polite live region and exactly one primary button per screen', () => {
      const hint = el.querySelector('.drawer-footer [aria-live="polite"]');
      expect(hint).not.toBeNull();
      expect(hint?.textContent).toContain('A kötelező mezők még hiányoznak.');
      expect(el.querySelectorAll('.btn-primary').length).toBe(1);
    });
  });
});
