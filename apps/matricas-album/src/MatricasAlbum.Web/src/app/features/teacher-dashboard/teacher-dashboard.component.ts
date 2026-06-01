import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AlbumStore } from '../../core/services/album.store';
import { GuidedDemoService } from '../../core/services/guided-demo.service';
import { AlbumInstanceListItem } from '../../core/models/album.model';
import { instanceProgressPercent } from '../../shared/util/instance-progress.util';
import { BtnComponent } from '../../shared/ui/btn/btn.component';
import { ChipComponent } from '../../shared/ui/chip/chip.component';
import { IconComponent } from '../../shared/ui/icon/icon.component';

interface PriorityStrip {
  readonly tone: 'help' | 'feedback' | 'continue' | 'empty';
  readonly icon: string;
  readonly label: string;
  readonly title: string;
  readonly body: string;
  readonly cta: string;
  readonly path: string[];
}

@Component({
  selector: 'ma-teacher-dashboard',
  standalone: true,
  imports: [RouterLink, BtnComponent, ChipComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './teacher-dashboard.component.html',
  styleUrl: './teacher-dashboard.component.scss',
})
export class TeacherDashboardComponent {
  readonly store = inject(AlbumStore);
  readonly guidedDemo = inject(GuidedDemoService);

  /** Routes to /teacher/instances/:id/plan or /feedback when an active instance exists. */
  readonly activePlanPath = computed(() => {
    const id = this.store.activeInstanceId();
    return id ? ['/teacher/instances', id, 'plan'] : ['/teacher/instances'];
  });
  readonly activeFeedbackPath = computed(() => {
    const id = this.store.activeInstanceId();
    return id ? ['/teacher/instances', id, 'feedback'] : ['/teacher/instances'];
  });
  readonly priorityStrip = computed<PriorityStrip>(() => {
    const active = this.store.activeInstanceSummary();
    const openHelpCount = this.store.helpRequests().filter(request => !request.resolvedAt).length;
    const pendingEvidenceCount = active?.pendingEvidenceCount ?? this.store.pendingEvidence().length;

    if (openHelpCount > 0) {
      return {
        tone: 'help',
        icon: 'back_hand',
        label: 'Most',
        title: 'Segítségkérés vár',
        body: `${openHelpCount} nyitott csapatkérés a visszajelzési sorban.`,
        cta: 'Megnézem',
        path: this.activeFeedbackPath(),
      };
    }

    if (pendingEvidenceCount > 0) {
      return {
        tone: 'feedback',
        icon: 'rate_review',
        label: 'Következő lépés',
        title: 'Visszajelzésre vár',
        body: `${pendingEvidenceCount} bizonyíték vár tanári visszajelzésre.`,
        cta: 'Visszajelzési sor',
        path: this.activeFeedbackPath(),
      };
    }

    if (active) {
      return {
        tone: 'continue',
        icon: 'auto_stories',
        label: 'Fókusz',
        title: 'Folytasd a futó albumot',
        body: `Aktuális ${this.store.albumUnitLabel}: ${active.currentWeek}.`,
        cta: 'Futó album megnyitása',
        path: this.activePlanPath(),
      };
    }

    return {
      tone: 'empty',
      icon: 'add_circle',
      label: 'Kezdés',
      title: 'Indíts futó albumot',
      body: 'Válassz albumtervet, és hozz létre osztályhoz kötött futtatást.',
      cta: 'Futó albumok',
      path: ['/teacher/instances'],
    };
  });

  progress(instance: AlbumInstanceListItem): number {
    return instanceProgressPercent(instance);
  }

  startFromIdea(): void {
    this.store.openStickerWizard('idea');
  }

  startFromLesson(): void {
    this.store.openTemplateWizard('lesson');
  }

  startFromCurriculum(): void {
    this.store.openTemplateWizard('curriculum');
  }
}
