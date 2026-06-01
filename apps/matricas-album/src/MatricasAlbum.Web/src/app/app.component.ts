import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AlbumStore } from './core/services/album.store';
import { ToastComponent } from './shared/ui/toast/toast.component';
import { StickerDetailDrawerComponent } from './features/sticker-detail-drawer/sticker-detail-drawer.component';
import { StickerResourceDetailDrawerComponent } from './features/sticker-resource-detail-drawer/sticker-resource-detail-drawer.component';
import { FeedbackDrawerComponent } from './features/feedback-drawer/feedback-drawer.component';
import { PrintPreviewComponent } from './features/print-preview/print-preview.component';
import { AlbumCreateDrawerComponent } from './features/album-create-drawer/album-create-drawer.component';
import { AiAdviceDrawerComponent } from './features/ai-advice-drawer/ai-advice-drawer.component';
import { GuidedDemoPanelComponent } from './features/guided-demo-panel/guided-demo-panel.component';
import { GuidedDemoService } from './core/services/guided-demo.service';

/**
 * Root component. After the routing refactor the role + active page are
 * URL-driven (see app.routes.ts and the shell components). This component
 * just hosts the global router-outlet and the singleton overlays.
 */
@Component({
  selector: 'ma-root',
  standalone: true,
  imports: [
    RouterOutlet,
    ToastComponent,
    StickerDetailDrawerComponent,
    StickerResourceDetailDrawerComponent,
    FeedbackDrawerComponent,
    PrintPreviewComponent,
    AlbumCreateDrawerComponent,
    AiAdviceDrawerComponent,
    GuidedDemoPanelComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <router-outlet />

    <ma-sticker-detail-drawer />
    <ma-sticker-resource-detail-drawer [readOnly]="store.stickerResourceReadOnly()" />
    <ma-feedback-drawer [mode]="store.role() === 'student' ? 'student' : 'teacher'" />
    <ma-ai-advice-drawer />
    <ma-album-create-drawer />
    <ma-print-preview />
    <ma-guided-demo-panel />
    <ma-toast />
  `,
})
export class AppComponent {
  readonly store = inject(AlbumStore);
  readonly guidedDemo = inject(GuidedDemoService);
}
