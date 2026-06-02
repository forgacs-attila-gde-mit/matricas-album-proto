import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AlbumApi } from '../../core/services/album-api.service';
import { CurriculumModuleRef, ModuleDetail } from '../../core/models/album.model';
import { HierarchyExplorerComponent } from './hierarchy-explorer.component';

function moduleRef(): CurriculumModuleRef {
  return { id: 'rel-1', moduleVersionId: 'mv-1', moduleId: 'm-1', moduleName: 'Erők', moduleVersionNumber: 2, topicCount: 1, sortOrder: 1 };
}

function moduleDetail(): ModuleDetail {
  // Two versions; the referenced one (mv-1) has the topic, an older one does not.
  return {
    id: 'm-1', name: 'Erők', archivedAt: null,
    versions: [
      { id: 'mv-0', moduleId: 'm-1', versionNumber: 1, isDraft: false, name: 'Erők', topics: [] },
      { id: 'mv-1', moduleId: 'm-1', versionNumber: 2, isDraft: false, name: 'Erők', topics: [
        { id: 'mt-1', topicVersionId: 'tv-1', topicId: 't-1', topicName: 'Mozgás', topicVersionNumber: 1, blockCount: 0, sortOrder: 1 },
      ] },
    ],
  };
}

describe('HierarchyExplorerComponent — Task 6.3', () => {
  let fixture: ComponentFixture<HierarchyExplorerComponent>;
  let api: jasmine.SpyObj<AlbumApi>;

  beforeEach(async () => {
    api = jasmine.createSpyObj<AlbumApi>('AlbumApi', ['getCurricula', 'getCurriculum', 'getModule', 'getTopic', 'getBlock']);
    api.getCurricula.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [HierarchyExplorerComponent],
      providers: [{ provide: AlbumApi, useValue: api }],
    }).compileComponents();
    fixture = TestBed.createComponent(HierarchyExplorerComponent);
    fixture.detectChanges();
  });

  it('lazy-loads a module detail on first expand and caches it', () => {
    const c = fixture.componentInstance;
    api.getModule.and.returnValue(of(moduleDetail()));

    c.toggle('rel-1', 'module', 'm-1');
    expect(c.isOpen('rel-1')).toBeTrue();
    expect(api.getModule).toHaveBeenCalledOnceWith('m-1');

    // Collapse + re-expand must NOT refetch (cached).
    c.toggle('rel-1', 'module', 'm-1');
    c.toggle('rel-1', 'module', 'm-1');
    expect(api.getModule).toHaveBeenCalledTimes(1);
  });

  it('resolves children from the exact referenced version, not the latest', () => {
    const c = fixture.componentInstance;
    api.getModule.and.returnValue(of(moduleDetail()));

    c.toggle('rel-1', 'module', 'm-1');

    // The ref points at version mv-1, which has the "Mozgás" topic.
    expect(c.moduleTopics(moduleRef()).map(t => t.topicName)).toEqual(['Mozgás']);
  });
});
