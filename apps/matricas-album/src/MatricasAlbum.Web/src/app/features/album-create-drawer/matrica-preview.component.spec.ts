import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatricaPreviewComponent } from './matrica-preview.component';

@Component({
  standalone: true,
  imports: [MatricaPreviewComponent],
  template: `
    <ma-matrica-preview
      [title]="title"
      [phase]="phase"
      [short]="short"
      [instruction]="instruction"
      [evidence]="evidence"
    />
  `,
})
class HostComponent {
  title = '';
  phase = 'cselekves';
  short = '';
  instruction = '';
  evidence = '';
}

describe('MatricaPreviewComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    el = fixture.nativeElement as HTMLElement;
  });

  it('renders the title, falling back to a placeholder when empty', () => {
    fixture.detectChanges();
    expect(el.querySelector('.mp-title')?.textContent).toContain('Tevékenység címe');

    host.title = 'Hőtérkép készítése';
    fixture.detectChanges();
    expect(el.querySelector('.mp-title')?.textContent).toContain('Hőtérkép készítése');
  });

  it('shows a phase chip for the current learning-path phase', () => {
    fixture.detectChanges();
    expect(el.querySelector('ma-phase-chip')).not.toBeNull();
  });

  it('renders the student instruction when provided, else a placeholder', () => {
    fixture.detectChanges();
    expect(el.querySelector('.mp-placeholder')).not.toBeNull();
    expect(el.querySelector('.mp-instruction')).toBeNull();

    host.instruction = 'Mérjétek meg a hőmérsékletet öt ponton.';
    fixture.detectChanges();
    expect(el.querySelector('.mp-instruction')?.textContent).toContain('Mérjétek meg');
    expect(el.querySelector('.mp-placeholder')).toBeNull();
  });

  it('shows the evidence-type label', () => {
    host.evidence = 'Mérési adatlap + reflexió';
    fixture.detectChanges();
    expect(el.querySelector('.mp-evidence-value')?.textContent).toContain('Mérési adatlap + reflexió');
  });
});
