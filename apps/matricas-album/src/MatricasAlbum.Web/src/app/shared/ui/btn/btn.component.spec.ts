import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BtnComponent } from './btn.component';

@Component({
  standalone: true,
  imports: [BtnComponent],
  template: `<ma-btn [iconOnly]="iconOnly" [ariaLabel]="ariaLabel" icon="close">{{ text }}</ma-btn>`,
})
class HostComponent {
  iconOnly = false;
  ariaLabel: string | null = null;
  text = 'Mégse';
}

describe('BtnComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    el = fixture.nativeElement as HTMLElement;
  });

  it('exposes aria-label and the icon-only square class for icon buttons', () => {
    host.iconOnly = true;
    host.ariaLabel = 'Bezárás';
    host.text = '';
    fixture.detectChanges();
    const button = el.querySelector('button.btn') as HTMLButtonElement;
    expect(button.getAttribute('aria-label')).toBe('Bezárás');
    expect(button.classList.contains('btn-icon-only')).toBeTrue();
  });

  it('renders text buttons without aria-label or icon-only class by default', () => {
    fixture.detectChanges();
    const button = el.querySelector('button.btn') as HTMLButtonElement;
    expect(button.hasAttribute('aria-label')).toBeFalse();
    expect(button.classList.contains('btn-icon-only')).toBeFalse();
    expect(button.textContent).toContain('Mégse');
  });
});
