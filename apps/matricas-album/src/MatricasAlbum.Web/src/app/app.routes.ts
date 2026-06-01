import { Routes } from '@angular/router';

/**
 * Hash-routed app. The URL is the source of truth for role / active instance /
 * detail IDs; the store follows along (see TeacherShell, StudentShell, and the
 * detail shell components for the route → store glue).
 *
 * Path skeleton:
 *   /teacher
 *     /                                                 home / Műhely
 *     /sticker-library             (/:resourceId?)      Matricatár (optional drawer ID)
 *     /templates                   (/:templateId?)      Albumtervek list / detail
 *     /instances                                        Futó albumok list
 *     /instances/:instanceId/                           InstanceShell (loads the instance)
 *       /plan | /stickers | /teams | /evidence
 *       /feedback | /quality | /differentiation | /closure
 *     /settings | /help
 *   /student
 *     /instances/:instanceId/                           StudentAlbumShell
 *       /current | /team | /evidence | /feedback | /reflection | /help
 *   /closure                                            Standalone closure role
 */
export const APP_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'teacher' },

  {
    path: 'teacher',
    loadComponent: () => import('./layout/teacher-shell.component').then(m => m.TeacherShellComponent),
    children: [
      { path: '', pathMatch: 'full',
        loadComponent: () => import('./features/teacher-dashboard/teacher-dashboard.component').then(m => m.TeacherDashboardComponent),
      },
      { path: 'sticker-library',
        loadComponent: () => import('./features/sticker-library/sticker-library.component').then(m => m.StickerLibraryComponent),
      },
      { path: 'sticker-library/:resourceId',
        loadComponent: () => import('./features/sticker-library/sticker-library.component').then(m => m.StickerLibraryComponent),
      },
      { path: 'templates',
        loadComponent: () => import('./features/album-templates/album-templates.component').then(m => m.AlbumTemplatesComponent),
      },
      { path: 'templates/:templateId',
        loadComponent: () => import('./features/album-template-detail/album-template-detail.component').then(m => m.AlbumTemplateDetailComponent),
      },
      { path: 'instances',
        loadComponent: () => import('./features/album-instances/album-instances.component').then(m => m.AlbumInstancesComponent),
      },
      {
        path: 'instances/:instanceId',
        loadComponent: () => import('./layout/instance-shell.component').then(m => m.InstanceShellComponent),
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'plan' },
          { path: 'plan',
            loadComponent: () => import('./features/album-plan/album-plan.component').then(m => m.AlbumPlanComponent),
          },
          { path: 'stickers',
            loadComponent: () => import('./features/stickers-list/stickers-list.component').then(m => m.StickersListComponent),
          },
          { path: 'teams',
            loadComponent: () => import('./features/teams-list/teams-list.component').then(m => m.TeamsListComponent),
          },
          { path: 'evidence',
            loadComponent: () => import('./features/evidence-portfolio/evidence-portfolio.component').then(m => m.EvidencePortfolioComponent),
          },
          { path: 'feedback',
            loadComponent: () => import('./features/feedback-queue/feedback-queue.component').then(m => m.FeedbackQueueComponent),
          },
          { path: 'quality',
            loadComponent: () => import('./features/quality-panel/quality-panel.component').then(m => m.QualityPanelComponent),
          },
          { path: 'differentiation',
            loadComponent: () => import('./features/differentiation/differentiation.component').then(m => m.DifferentiationComponent),
          },
          { path: 'closure',
            loadComponent: () => import('./features/closure/closure.component').then(m => m.ClosureComponent),
          },
        ],
      },
      { path: 'settings',
        loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent),
      },
      { path: 'help',
        loadComponent: () => import('./features/teacher-help/teacher-help.component').then(m => m.TeacherHelpComponent),
      },
    ],
  },

  {
    path: 'student',
    loadComponent: () => import('./layout/student-shell.component').then(m => m.StudentShellComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'home' },
      // Landing path that resolves the first available instance (set up in StudentShell).
      { path: 'home', loadComponent: () => import('./features/student-current/student-current.component').then(m => m.StudentCurrentComponent) },
      {
        path: 'instances/:instanceId',
        loadComponent: () => import('./layout/student-album-shell.component').then(m => m.StudentAlbumShellComponent),
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'current' },
          { path: 'current',
            loadComponent: () => import('./features/student-current/student-current.component').then(m => m.StudentCurrentComponent),
          },
          { path: 'team',
            loadComponent: () => import('./features/student-team/student-team.component').then(m => m.StudentTeamComponent),
          },
          { path: 'evidence',
            loadComponent: () => import('./features/student-evidence/student-evidence.component').then(m => m.StudentEvidenceComponent),
          },
          { path: 'feedback',
            loadComponent: () => import('./features/student-feedback/student-feedback.component').then(m => m.StudentFeedbackComponent),
          },
          { path: 'reflection',
            loadComponent: () => import('./features/student-reflection/student-reflection.component').then(m => m.StudentReflectionComponent),
          },
          { path: 'help',
            loadComponent: () => import('./features/student-help/student-help.component').then(m => m.StudentHelpComponent),
          },
        ],
      },
    ],
  },

  { path: 'closure',
    loadComponent: () => import('./features/closure/closure.component').then(m => m.ClosureComponent),
  },

  { path: '**', redirectTo: 'teacher' },
];
