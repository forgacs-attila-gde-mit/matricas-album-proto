import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CreationMode, CreationShellComponent } from './creation-shell.component';

const MODES: CreationMode[] = [
  { key: 'ures', label: 'Üres' },
  { key: 'ai', label: 'AI' },
];

@Component({
  standalone: true,
  imports: [CreationShellComponent],
  template: `
    <ma-creation-shell [modes]="modes" [initialMode]="initialMode" (modeSelected)="onMode($event)">
      <div shellLeft class="left-content">LEFT</div>
      <div shellCenter class="center-content">CENTER</div>
      <div shellRight class="right-content">RIGHT</div>
    </ma-creation-shell>
  `,
})
class HostComponent {
  modes = MODES;
  initialMode: string | null = null;
  selected: string | null = null;
  onMode(key: string) {
    this.selected = key;
  }
}

describe('CreationShellComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    el = fixture.nativeElement as HTMLElement;
  });

  it('shows a mode chooser first (one button per mode) and hides the panes', () => {
    fixture.detectChanges();
    const buttons = el.querySelectorAll('[data-mode-key]');
    expect(buttons.length).toBe(2);
    expect(el.querySelector('.center-content')).toBeNull();
  });

  it('emits modeSelected and reveals the three panes when a mode is chosen', () => {
    fixture.detectChanges();
    (el.querySelector('[data-mode-key="ai"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(host.selected).toBe('ai');
    expect(el.querySelector('.left-content')?.textContent).toContain('LEFT');
    expect(el.querySelector('.center-content')?.textContent).toContain('CENTER');
    expect(el.querySelector('.right-content')?.textContent).toContain('RIGHT');
  });

  it('skips the chooser and shows the panes directly when initialMode is set', () => {
    host.initialMode = 'ures';
    fixture.detectChanges();
    expect(el.querySelector('[data-mode-key]')).toBeNull();
    expect(el.querySelector('.center-content')?.textContent).toContain('CENTER');
  });

  it('collapses the left and right side panes via their toggle buttons', () => {
    host.initialMode = 'ures';
    fixture.detectChanges();
    expect(el.querySelector('.left-content')).not.toBeNull();

    (el.querySelector('[data-toggle="left"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(el.querySelector('.left-content')).toBeNull();

    (el.querySelector('[data-toggle="right"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(el.querySelector('.right-content')).toBeNull();
  });
});
