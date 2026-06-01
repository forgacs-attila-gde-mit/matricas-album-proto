import { ChangeDetectionStrategy, Component, OnInit, OnDestroy, inject } from '@angular/core';
import { ActivatedRoute, RouterOutlet } from '@angular/router';
import { Subscription } from 'rxjs';
import { AlbumStore } from '../core/services/album.store';

/**
 * Parent route for /teacher/instances/:instanceId/* and the entry point that
 * binds the URL's instance ID to the store's activeInstance. Renders only the
 * child route via <router-outlet />; the topbar/sidebar are owned by the outer
 * TeacherShellComponent.
 */
@Component({
  selector: 'ma-instance-shell',
  standalone: true,
  imports: [RouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<router-outlet />`,
})
export class InstanceShellComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly store = inject(AlbumStore);
  private sub?: Subscription;

  ngOnInit(): void {
    this.sub = this.route.paramMap.subscribe(params => {
      const id = params.get('instanceId');
      if (!id) return;
      if (this.store.activeInstanceId() !== id) {
        void this.store.selectInstance(id);
      }
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
