import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DrawerComponent } from './drawer.component';

@Component({
  standalone: true,
  imports: [DrawerComponent],
  template: `
    <button type="button" class="outside">Kívül</button>
    <ma-drawer [open]="open()" (close)="onClose()">
      <input class="inside-first" />
      <button type="button" class="inside-last">Mentés</button>
    </ma-drawer>
  `,
})
class HostComponent {
  open = signal(false);
  closed = 0;
  onClose() {
    this.closed += 1;
  }
}

describe('DrawerComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    el = fixture.nativeElement as HTMLElement;
  });

  it('traps focus inside the panel via CDK (panel marked with the trap anchors)', async () => {
    host.open.set(true);
    fixture.detectChanges();
    await fixture.whenStable();
    const panel = el.querySelector('.drawer') as HTMLElement;
    expect(panel).not.toBeNull();
    // CdkTrapFocus inserts focus-trap anchor siblings around the trapped region.
    const anchors = el.querySelectorAll('.cdk-focus-trap-anchor');
    expect(anchors.length).toBe(2);
  });

  it('moves initial focus into the panel (auto-capture)', async () => {
    host.open.set(true);
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise(resolve => setTimeout(resolve));
    const panel = el.querySelector('.drawer') as HTMLElement;
    expect(panel.contains(document.activeElement)).toBeTrue();
  });

  it('still closes on Escape', () => {
    host.open.set(true);
    fixture.detectChanges();
    const panel = el.querySelector('.drawer') as HTMLElement;
    panel.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
    expect(host.closed).toBe(1);
  });
});
