import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DisclosureComponent } from './disclosure.component';

@Component({
  standalone: true,
  imports: [DisclosureComponent],
  template: `
    <ma-disclosure [label]="label" [hint]="hint" [(open)]="open">
      <div class="optional-content">REJTETT</div>
    </ma-disclosure>
  `,
})
class HostComponent {
  label = 'Opcionális részletek';
  hint = '';
  open = signal(false);
}

describe('DisclosureComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let el: HTMLElement;

  const toggle = () => el.querySelector('button.disclosure-toggle') as HTMLButtonElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    el = fixture.nativeElement as HTMLElement;
  });

  it('is closed by default: content hidden, aria-expanded=false, aria-controls wired', () => {
    fixture.detectChanges();
    expect(el.querySelector('.optional-content')).toBeNull();
    expect(toggle().getAttribute('aria-expanded')).toBe('false');
    const controls = toggle().getAttribute('aria-controls');
    expect(controls).toBeTruthy();
  });

  it('toggles open on click (a real button, so keyboard works for free) and updates aria', () => {
    fixture.detectChanges();
    toggle().click();
    fixture.detectChanges();
    expect(el.querySelector('.optional-content')?.textContent).toContain('REJTETT');
    expect(toggle().getAttribute('aria-expanded')).toBe('true');
    expect(el.querySelector('#' + toggle().getAttribute('aria-controls'))).not.toBeNull();
  });

  it('supports two-way open binding: host signal drives and reflects state', () => {
    fixture.detectChanges();
    host.open.set(true);
    fixture.detectChanges();
    expect(el.querySelector('.optional-content')).not.toBeNull();

    toggle().click();
    fixture.detectChanges();
    expect(host.open()).toBeFalse();
    expect(el.querySelector('.optional-content')).toBeNull();
  });

  it('renders the toggle label and optional hint', () => {
    host.hint = 'Mentéshez nem kell kinyitnod.';
    fixture.detectChanges();
    expect(toggle().textContent).toContain('Opcionális részletek');
    expect(el.querySelector('.disclosure-hint')?.textContent).toContain('Mentéshez nem kell kinyitnod.');
  });
});
