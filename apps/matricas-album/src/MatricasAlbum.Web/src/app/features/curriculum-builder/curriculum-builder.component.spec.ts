import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { of } from 'rxjs';
import { AlbumApi } from '../../core/services/album-api.service';
import { CurriculumDetail, CurriculumModuleRef } from '../../core/models/album.model';
import { CurriculumBuilderComponent } from './curriculum-builder.component';

function moduleRef(id: string, sortOrder: number): CurriculumModuleRef {
  return { id, moduleVersionId: `mv-${id}`, moduleId: `m-${id}`, moduleName: `Module ${id}`, moduleVersionNumber: 1, topicCount: 2, sortOrder };
}

function draftDetail(modules: CurriculumModuleRef[]): CurriculumDetail {
  return {
    id: 'cur-1',
    name: 'Teszt tanterv',
    archivedAt: null,
    versions: [{ id: 'cv-1', curriculumId: 'cur-1', versionNumber: 1, isDraft: true, name: 'Teszt tanterv', modules }],
  };
}

describe('CurriculumBuilderComponent — Task 6.2', () => {
  let fixture: ComponentFixture<CurriculumBuilderComponent>;
  let api: jasmine.SpyObj<AlbumApi>;

  beforeEach(async () => {
    api = jasmine.createSpyObj<AlbumApi>('AlbumApi', ['getCurricula', 'getModules', 'getCurriculum', 'addCurriculumModule', 'removeCurriculumModule', 'reorderCurriculumModules']);
    api.getCurricula.and.returnValue(of([]));
    api.getModules.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [CurriculumBuilderComponent],
      providers: [{ provide: AlbumApi, useValue: api }],
    }).compileComponents();
    fixture = TestBed.createComponent(CurriculumBuilderComponent);
    fixture.detectChanges();
  });

  it('preview_order: module references are exposed sorted by sortOrder', () => {
    const c = fixture.componentInstance;
    c.selectedCurriculum.set(draftDetail([moduleRef('b', 2), moduleRef('a', 1)]));
    expect(c.modules().map(m => m.id)).toEqual(['a', 'b']);
  });

  it('builder_dragdrop: dropping reorders and persists the new order', () => {
    const c = fixture.componentInstance;
    c.selectedCurriculum.set(draftDetail([moduleRef('a', 1), moduleRef('b', 2)]));
    api.reorderCurriculumModules.and.returnValue(of(draftDetail([moduleRef('b', 1), moduleRef('a', 2)])));

    c.drop({ previousIndex: 1, currentIndex: 0 } as CdkDragDrop<CurriculumModuleRef[]>);

    expect(api.reorderCurriculumModules).toHaveBeenCalledWith('cur-1', [
      { id: 'b', sortOrder: 1 },
      { id: 'a', sortOrder: 2 },
    ]);
    expect(c.modules().map(m => m.id)).toEqual(['b', 'a']);
  });

  it('add_module references the published version id of a module', () => {
    const c = fixture.componentInstance;
    c.selectedCurriculum.set(draftDetail([]));
    api.addCurriculumModule.and.returnValue(of(draftDetail([moduleRef('x', 1)])));

    c.addModule({ id: 'm-x', name: 'Module x', latestVersionNumber: 2, topicCount: 3, hasDraft: false, latestPublishedVersionId: 'mv-x', archivedAt: null });

    expect(api.addCurriculumModule).toHaveBeenCalledWith('cur-1', { moduleVersionId: 'mv-x' });
  });

  it('only published modules appear in the library', () => {
    const c = fixture.componentInstance;
    c.library.set([
      { id: 'm1', name: 'Published', latestVersionNumber: 1, topicCount: 2, hasDraft: false, latestPublishedVersionId: 'mv-1', archivedAt: null },
      { id: 'm2', name: 'Draft only', latestVersionNumber: 1, topicCount: 0, hasDraft: true, latestPublishedVersionId: null, archivedAt: null },
    ]);
    expect(c.filteredLibrary().map(m => m.id)).toEqual(['m1']);
  });
});
