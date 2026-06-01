import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

// REFACTOR-001 Task 1.1 — proves the Karma/Jasmine harness launches headless and
// that TestBed can compile + create a standalone component (no app-code dependency).
@Component({ standalone: true, template: '<p class="smoke">ok</p>' })
class SmokeComponent {}

describe('Angular test harness (smoke)', () => {
  it('runs plain Jasmine assertions', () => {
    expect(1 + 1).toBe(2);
  });

  it('compiles and renders a standalone component via TestBed', async () => {
    await TestBed.configureTestingModule({ imports: [SmokeComponent] }).compileComponents();
    const fixture = TestBed.createComponent(SmokeComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.smoke')?.textContent).toBe('ok');
  });
});
