import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AlbumStore } from '../../../core/services/album.store';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'ma-toast',
  standalone: true,
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (store.toast(); as t) {
      <div class="toast">
        <ma-icon [name]="t.icon" />
        {{ t.msg }}
      </div>
    }
  `,
  styleUrl: './toast.component.scss',
})
export class ToastComponent {
  readonly store = inject(AlbumStore);
}
