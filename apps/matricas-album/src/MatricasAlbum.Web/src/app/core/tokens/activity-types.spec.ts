import { ACTIVITY_TYPES, activityTypeLabel } from './activity-types';

// REFACTOR-001 Task 2.3: the Tevékenységtípus picker (create drawer) and the Matricatár
// facet both render ACTIVITY_TYPES. This guards that they only ever offer the closed,
// system-defined taxonomy — no user/AI-invented types — matching the API ActivityType seed.
describe('ACTIVITY_TYPES — picker lists only system types', () => {
  const SYSTEM_KEYS = ['felfedezo', 'kiserletezo', 'feldolgozo', 'kommunikacios', 'kollaborativ', 'reflektiv'];

  it('lists exactly the six system keys, in order', () => {
    expect(ACTIVITY_TYPES.map(t => t.id as string)).toEqual(SYSTEM_KEYS);
  });

  it('has no duplicates and every entry has a label and icon', () => {
    const ids = ACTIVITY_TYPES.map(t => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const type of ACTIVITY_TYPES) {
      expect(type.label.trim().length).toBeGreaterThan(0);
      expect(type.icon.trim().length).toBeGreaterThan(0);
    }
  });

  it('preserves the Hungarian display names verbatim', () => {
    expect(activityTypeLabel('felfedezo')).toBe('Felfedező');
    expect(activityTypeLabel('kiserletezo')).toBe('Kísérletező');
    expect(activityTypeLabel('reflektiv')).toBe('Reflektív');
  });

  it('returns an empty label for unknown or missing keys (never invents one)', () => {
    expect(activityTypeLabel('ismeretlen')).toBe('');
    expect(activityTypeLabel(null)).toBe('');
    expect(activityTypeLabel(undefined)).toBe('');
  });
});
