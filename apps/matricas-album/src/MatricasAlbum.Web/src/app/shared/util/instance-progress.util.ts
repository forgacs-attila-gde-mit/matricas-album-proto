import { AlbumInstanceListItem } from '../../core/models/album.model';

/**
 * Percentage 0-100 of how far an album instance has progressed,
 * derived from currentWeek vs the leading integer in `duration`
 * (e.g. "6 hét" → 6). Falls back to 4 weeks when `duration` doesn't
 * start with a number — matches the seeded mikroklíma demo.
 */
export function instanceProgressPercent(instance: AlbumInstanceListItem): number {
  const totalWeeks = Number.parseInt(instance.duration, 10) || 4;
  return Math.min(100, Math.round((instance.currentWeek / totalWeeks) * 100));
}
