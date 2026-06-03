import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormSectionComponent } from './form-section.component';

@Component({
  standalone: true,
  imports: [FormSectionComponent],
  template: `
    <ma-form-section [title]="title" [hint]="hint" [columns]="columns">
      <div class="a">A</div>
      <div class="b">B</div>
    </ma-form-section>
  `,
})
class HostComponent {
  title = 'Alapok';
  hint = '';
  columns: 1 | 2 = 1;
}

describe('FormSectionComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    el = fixture.nativeElement as HTMLElement;
  });

  it('renders the section title as a heading and projects content into the grid', () => {
    fixture.detectChanges();
    expect(el.querySelector('h3.section-title')?.textContent).toContain('Alapok');
    expect(el.querySelectorAll('.section-grid > *').length).toBe(2);
  });

  it('renders the hint only when provided', () => {
    fixture.detectChanges();
    expect(el.querySelector('.section-hint')).toBeNull();
    host.hint = 'Csak a legfontosabbak.';
    fixture.detectChanges();
    expect(el.querySelector('.section-hint')?.textContent).toContain('Csak a legfontosabbak.');
  });

  it('applies the two-column class only when columns is 2', () => {
    fixture.detectChanges();
    expect(el.querySelector('.section-grid')?.classList.contains('cols-2')).toBeFalse();
    host.columns = 2;
    fixture.detectChanges();
    expect(el.querySelector('.section-grid')?.classList.contains('cols-2')).toBeTrue();
  });
});
