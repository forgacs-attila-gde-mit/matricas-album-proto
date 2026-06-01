export type PhaseId = 'kerdezes' | 'kepzelet' | 'cselekves' | 'reflexio';

export interface PhaseInfo {
  readonly id: PhaseId;
  readonly label: string;
  readonly icon: string;
  readonly color: PhaseId; // matches CSS class suffix
}

export const PHASES: Record<PhaseId, PhaseInfo> = {
  kerdezes:  { id: 'kerdezes',  label: 'Kérdezés',  icon: 'search',           color: 'kerdezes'  },
  kepzelet:  { id: 'kepzelet',  label: 'Képzelet',  icon: 'lightbulb',        color: 'kepzelet'  },
  cselekves: { id: 'cselekves', label: 'Cselekvés', icon: 'science',          color: 'cselekves' },
  reflexio:  { id: 'reflexio',  label: 'Reflexió',  icon: 'self_improvement', color: 'reflexio'  },
};

export function normalizePhase(value: string | null | undefined): PhaseId {
  const phase = value?.trim().toLowerCase();
  if (phase === 'kerdezes' || phase === 'kepzelet' || phase === 'cselekves' || phase === 'reflexio') {
    return phase;
  }

  if (phase === 'bizonyit' || phase === 'bizonyitek' || phase === 'bizonyitekgyujtes') {
    return 'cselekves';
  }

  return 'kerdezes';
}

export function phaseInfo(value: string | null | undefined): PhaseInfo {
  return PHASES[normalizePhase(value)];
}

export type StickerState =
  | 'tervezett' | 'aktiv' | 'bekuldve' | 'varakozik'
  | 'javitas' | 'elkeszult' | 'reflektalt';

export interface StateInfo {
  readonly id: StickerState;
  readonly label: string;
  readonly cls: string;
}

export const STATES: Record<StickerState, StateInfo> = {
  tervezett:  { id: 'tervezett',  label: 'Tervezett',                 cls: 'state-tervezett'  },
  aktiv:      { id: 'aktiv',      label: 'Aktív',                     cls: 'state-aktiv'      },
  bekuldve:   { id: 'bekuldve',   label: 'Bizonyíték beküldve',       cls: 'state-bekuldve'   },
  varakozik:  { id: 'varakozik',  label: 'Tanári visszajelzésre vár', cls: 'state-varakozik'  },
  javitas:    { id: 'javitas',    label: 'Javítás alatt',             cls: 'state-javitas'    },
  elkeszult:  { id: 'elkeszult',  label: 'Elkészült',                 cls: 'state-elkeszult'  },
  reflektalt: { id: 'reflektalt', label: 'Reflektált',                cls: 'state-reflektalt' },
};
