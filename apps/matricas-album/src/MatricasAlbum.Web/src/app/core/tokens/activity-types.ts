// The closed, system-defined Tevékenységtípus taxonomy. Single source of truth on the web
// side; mirrors the API ActivityType seed (keys must stay identical: the server validates
// against ActivityTypeKeys and rejects anything else). Users/AI never extend this list.

export type ActivityTypeId =
  | 'felfedezo'
  | 'kiserletezo'
  | 'feldolgozo'
  | 'kommunikacios'
  | 'kollaborativ'
  | 'reflektiv';

export interface ActivityTypeOption {
  readonly id: ActivityTypeId;
  readonly label: string;
  readonly description: string;
  readonly icon: string;
}

export const ACTIVITY_TYPES: readonly ActivityTypeOption[] = [
  { id: 'felfedezo', label: 'Felfedező', description: 'Megfigyelés, gyűjtés, kérdésindítás.', icon: 'travel_explore' },
  { id: 'kiserletezo', label: 'Kísérletező', description: 'Próbálkozás, mérés, tesztelés.', icon: 'science' },
  { id: 'feldolgozo', label: 'Feldolgozó', description: 'Információ értelmezése és rendezése.', icon: 'library_books' },
  { id: 'kommunikacios', label: 'Kommunikációs', description: 'Magyarázat, vita, prezentáció, interjú.', icon: 'record_voice_over' },
  { id: 'kollaborativ', label: 'Kollaboratív', description: 'Közös alkotás és szerepmunka.', icon: 'groups' },
  { id: 'reflektiv', label: 'Reflektív', description: 'Önértékelés, visszatekintés, tanulság.', icon: 'self_improvement' },
];

// Display label for a stored activity-type key; empty string when unset/unrecognised.
export function activityTypeLabel(key: string | null | undefined): string {
  return ACTIVITY_TYPES.find(option => option.id === key)?.label ?? '';
}
