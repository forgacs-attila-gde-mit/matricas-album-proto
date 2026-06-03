import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StudentCurrentComponent } from './student-current.component';
import { AlbumStore } from '../../core/services/album.store';

function makeFakeStore() {
  return {
    currentStickerForStudent: signal({
      id: 'is1',
      title: 'Hőnyomozók',
      phase: 'kerdezes',
      state: 'aktiv',
      week: 1,
      studentInstruction: 'Fotózzatok!',
      studentChoice: 'Választhattok helyszínt.',
      expectedProduct: '2 fotó',
      reflection: 'Mi lepett meg?',
      evidenceType: 'Fotó + jegyzet',
    }),
    selectedStudentTeam: signal({ id: 'team1', name: 'Árnyékkommandó', members: [] }),
    currentStudentProgress: signal(null),
    studentAdvices: signal([]),
    evidenceFlowOpen: signal(true),
    albumUnitLabel: 'hét',
    setEvidenceFlowOpen: () => {},
    openSticker: () => {},
    clearStudentAdvice: () => {},
    showToast: () => {},
    submitEvidence: jasmine.createSpy('submitEvidence').and.resolveTo(true),
  };
}

describe('StudentCurrentComponent — evidence form (REFACTOR-003 Task 3.3)', () => {
  let fixture: ComponentFixture<StudentCurrentComponent>;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudentCurrentComponent],
      providers: [{ provide: AlbumStore, useValue: makeFakeStore() as unknown as AlbumStore }],
    }).compileComponents();
    fixture = TestBed.createComponent(StudentCurrentComponent);
    el = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  });

  it('marks the reactive required fields with asterisk + aria-required', () => {
    const title = el.querySelector('[formcontrolname="title"]') as HTMLInputElement;
    expect(title.getAttribute('aria-required')).toBe('true');
    expect(title.closest('ma-field')?.querySelector('.req')).not.toBeNull();
    const description = el.querySelector('[formcontrolname="description"]') as HTMLTextAreaElement;
    expect(description.getAttribute('aria-required')).toBe('true');
  });

  it('routes the reactive validation message through the ma-field error slot (role=alert)', () => {
    const title = el.querySelector('[formcontrolname="title"]') as HTMLInputElement;
    title.value = '';
    title.dispatchEvent(new Event('input'));
    title.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    const error = title.closest('ma-field')?.querySelector('.field-error');
    expect(error?.getAttribute('role')).toBe('alert');
    expect(error?.textContent).toContain('A cím kötelező.');
  });

  it('keeps Beküldés disabled while the form is invalid (form.invalid convention)', () => {
    const submit = Array.from(el.querySelectorAll('button.btn-primary'))
      .find(button => button.textContent?.includes('Beküldés')) as HTMLButtonElement;
    expect(submit.disabled).toBeTrue();
  });
});
