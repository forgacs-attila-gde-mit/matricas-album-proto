import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FieldComponent } from './field.component';

@Component({
  standalone: true,
  imports: [FieldComponent],
  template: `
    <ma-field [label]="label" [required]="required" [help]="help" [error]="error">
      <input class="ctrl input" name="title" />
    </ma-field>
  `,
})
class HostComponent {
  label = 'Cím';
  required = false;
  help = '';
  error = '';
}

describe('FieldComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    el = fixture.nativeElement as HTMLElement;
  });

  it('renders the label text and projects the control inside the wrapping label', () => {
    fixture.detectChanges();
    expect(el.querySelector('.field-label')?.textContent).toContain('Cím');
    expect(el.querySelector('label.field input.ctrl')).not.toBeNull();
  });

  it('marks required fields with a visible asterisk, sr-only text, and aria-required on the control', () => {
    host.required = true;
    fixture.detectChanges();
    const marker = el.querySelector('.req');
    expect(marker?.textContent).toContain('*');
    expect(marker?.getAttribute('aria-hidden')).toBe('true');
    expect(el.querySelector('.field-label .sr-only')?.textContent).toContain('kötelező');
    expect(el.querySelector('input.ctrl')?.getAttribute('aria-required')).toBe('true');
  });

  it('renders no required marker or aria-required when optional', () => {
    fixture.detectChanges();
    expect(el.querySelector('.req')).toBeNull();
    expect(el.querySelector('input.ctrl')?.hasAttribute('aria-required')).toBe(false);
  });

  it('renders help text and an error line with role=alert', () => {
    host.help = 'Pl. Interjú a gondnokkal';
    host.error = 'A cím kötelező.';
    fixture.detectChanges();
    expect(el.querySelector('.help')?.textContent).toContain('Pl. Interjú a gondnokkal');
    const error = el.querySelector('.field-error');
    expect(error?.getAttribute('role')).toBe('alert');
    expect(error?.textContent).toContain('A cím kötelező.');
  });
});
