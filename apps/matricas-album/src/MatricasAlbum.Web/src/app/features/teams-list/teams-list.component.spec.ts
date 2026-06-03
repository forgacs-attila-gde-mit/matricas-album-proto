import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TeamsListComponent } from './teams-list.component';
import { AlbumStore } from '../../core/services/album.store';

function makeFakeStore() {
  return {
    album: { className: '7.B' },
    teams: [],
    evidence: signal([]),
    helpRequests: signal([]),
    createTeam: jasmine.createSpy('createTeam').and.resolveTo(true),
    updateTeam: jasmine.createSpy('updateTeam').and.resolveTo(true),
  };
}

describe('TeamsListComponent — create form (REFACTOR-003 Task 3.2)', () => {
  let fixture: ComponentFixture<TeamsListComponent>;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TeamsListComponent],
      providers: [{ provide: AlbumStore, useValue: makeFakeStore() as unknown as AlbumStore }],
    }).compileComponents();
    fixture = TestBed.createComponent(TeamsListComponent);
    el = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  });

  function openCreate(): void {
    (el.querySelector('.page-head .btn-primary') as HTMLButtonElement).click();
    fixture.detectChanges();
  }

  it('marks the team name as required and disables Mentés until it is filled', () => {
    openCreate();
    const name = el.querySelector('[name="newName"]') as HTMLInputElement;
    expect(name.getAttribute('aria-required')).toBe('true');
    expect(name.closest('ma-field')?.querySelector('.req')).not.toBeNull();

    const save = el.querySelector('.edit-card .btn-primary') as HTMLButtonElement;
    expect(save.disabled).toBeTrue();

    name.value = 'Naprendszer-felfedezők';
    name.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect((el.querySelector('.edit-card .btn-primary') as HTMLButtonElement).disabled).toBeFalse();
  });

  it('shows exactly one primary button at a time (header CTA hides while the form is open)', () => {
    expect(el.querySelectorAll('.btn-primary').length).toBe(1);
    openCreate();
    expect(el.querySelectorAll('.btn-primary').length).toBe(1);
  });
});
