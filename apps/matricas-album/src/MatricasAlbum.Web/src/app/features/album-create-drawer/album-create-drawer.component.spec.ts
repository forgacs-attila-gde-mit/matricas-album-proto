import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AlbumCreateDrawerComponent } from './album-create-drawer.component';
import { AlbumStore } from '../../core/services/album.store';

// Minimal fake AlbumStore: just enough surface for the drawer to render in
// `sticker` mode. The component is heavily store-coupled, so we provide the
// signals/values it reads during a sticker-mode render and cast to AlbumStore.
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
  };
}

describe('AlbumCreateDrawerComponent — progressive disclosure (Task 1.3)', () => {
  let fixture: ComponentFixture<AlbumCreateDrawerComponent>;
  let el: HTMLElement;

  beforeEach(async () => {
    const fake = makeFakeStore();
    await TestBed.configureTestingModule({
      imports: [AlbumCreateDrawerComponent],
      providers: [{ provide: AlbumStore, useValue: fake as unknown as AlbumStore }],
    }).compileComponents();
    fixture = TestBed.createComponent(AlbumCreateDrawerComponent);
    el = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  });

  it('shows the essential matrica fields by default', () => {
    expect(el.querySelector('[name="stickerTitle"]')).not.toBeNull();
    expect(el.querySelector('[name="stickerEvidence"]')).not.toBeNull();
    expect(el.querySelector('.activity-type-card')).not.toBeNull();
  });

  it('hides the advanced "Részletes tervezés" metadata and adapt panel by default', () => {
    expect(el.querySelector('[name="metadataSubject"]')).toBeNull();
    expect(el.querySelector('.adapt-panel')).toBeNull();
  });

  it('reveals the advanced metadata when "Részletes tervezés" is toggled', () => {
    const toggle = el.querySelector('[data-disclosure="advanced"]') as HTMLButtonElement;
    expect(toggle).not.toBeNull();
    toggle.click();
    fixture.detectChanges();
    expect(el.querySelector('[name="metadataSubject"]')).not.toBeNull();
    expect(el.querySelector('.adapt-panel')).not.toBeNull();
  });

  it('shows a live matrica preview that reflects the title field', () => {
    fixture.componentInstance.stickerTitle = 'Élő előnézet teszt';
    fixture.detectChanges();
    const preview = el.querySelector('ma-matrica-preview');
    expect(preview).not.toBeNull();
    expect(preview?.querySelector('.mp-title')?.textContent).toContain('Élő előnézet teszt');
  });

  it('sends structured activity metadata (not note-lines) in the create payload (Task 3.3)', () => {
    const c = fixture.componentInstance;
    c.stickerTitle = 'Sebesség mérése';
    c.metadataSubject = 'Fizika';
    c.metadataGrade = '9. évfolyam';
    c.metadataCompetencies = 'mérés, elemzés';
    c.metadataNatLinks = '2.1';
    c.metadataInteractionMode = 'vita';
    c.metadataParticipantMode = 'paros';
    c.metadataEstimatedMinutes = 25;
    c.metadataContextMode = 'terep';

    const payload = (c as unknown as { toStickerPayload(): Record<string, unknown> }).toStickerPayload();
    const meta = payload['metadata'] as Record<string, unknown>;

    expect(meta).toBeTruthy();
    expect(meta['subject']).toBe('Fizika');
    expect(meta['gradeLevel']).toBe('9. évfolyam');
    expect(meta['estimatedMinutes']).toBe(25);
    expect(meta['modality']).toBe('vita');
    expect(meta['groupSize']).toBe('paros');
    expect(meta['contextMode']).toBe('terep');
    expect(meta['competencies']).toEqual(['mérés', 'elemzés']);
    expect(meta['natReferences']).toEqual(['2.1']);

    // The planning metadata must no longer leak into the teacher steps as note-lines.
    const steps = payload['teacherSteps'] as string[];
    expect(steps.some(step => step.startsWith('Tervezési meta:') || step.startsWith('Kompetenciák:'))).toBe(false);
  });
});
