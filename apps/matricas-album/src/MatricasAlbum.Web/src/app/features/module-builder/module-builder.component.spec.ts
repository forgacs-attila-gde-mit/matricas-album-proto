import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { of } from 'rxjs';
import { AlbumApi } from '../../core/services/album-api.service';
import { ModuleDetail, ModuleTopicRef } from '../../core/models/album.model';
import { ModuleBuilderComponent } from './module-builder.component';

function topicRef(id: string, sortOrder: number): ModuleTopicRef {
  return { id, topicVersionId: `tv-${id}`, topicId: `t-${id}`, topicName: `Topic ${id}`, topicVersionNumber: 1, blockCount: 3, sortOrder };
}

function draftDetail(topics: ModuleTopicRef[]): ModuleDetail {
  return {
    id: 'mod-1',
    name: 'Teszt modul',
    archivedAt: null,
    versions: [{ id: 'mv-1', moduleId: 'mod-1', versionNumber: 1, isDraft: true, name: 'Teszt modul', topics }],
  };
}

describe('ModuleBuilderComponent — Task 6.1', () => {
  let fixture: ComponentFixture<ModuleBuilderComponent>;
  let api: jasmine.SpyObj<AlbumApi>;

  beforeEach(async () => {
    api = jasmine.createSpyObj<AlbumApi>('AlbumApi', ['getModules', 'getTopics', 'getModule', 'addModuleTopic', 'removeModuleTopic', 'reorderModuleTopics']);
    api.getModules.and.returnValue(of([]));
    api.getTopics.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [ModuleBuilderComponent],
      providers: [{ provide: AlbumApi, useValue: api }],
    }).compileComponents();
    fixture = TestBed.createComponent(ModuleBuilderComponent);
    fixture.detectChanges();
  });

  it('preview_order: topic references are exposed sorted by sortOrder', () => {
    const c = fixture.componentInstance;
    c.selectedModule.set(draftDetail([topicRef('b', 2), topicRef('a', 1)]));
    expect(c.topics().map(t => t.id)).toEqual(['a', 'b']);
  });

  it('builder_dragdrop: dropping reorders and persists the new order', () => {
    const c = fixture.componentInstance;
    c.selectedModule.set(draftDetail([topicRef('a', 1), topicRef('b', 2)]));
    api.reorderModuleTopics.and.returnValue(of(draftDetail([topicRef('b', 1), topicRef('a', 2)])));

    c.drop({ previousIndex: 1, currentIndex: 0 } as CdkDragDrop<ModuleTopicRef[]>);

    expect(api.reorderModuleTopics).toHaveBeenCalledWith('mod-1', [
      { id: 'b', sortOrder: 1 },
      { id: 'a', sortOrder: 2 },
    ]);
    expect(c.topics().map(t => t.id)).toEqual(['b', 'a']);
  });

  it('add_topic references the published version id of a topic', () => {
    const c = fixture.componentInstance;
    c.selectedModule.set(draftDetail([]));
    api.addModuleTopic.and.returnValue(of(draftDetail([topicRef('x', 1)])));

    c.addTopic({ id: 't-x', name: 'Topic x', latestVersionNumber: 2, blockCount: 4, hasDraft: false, latestPublishedVersionId: 'tv-x', archivedAt: null });

    expect(api.addModuleTopic).toHaveBeenCalledWith('mod-1', { topicVersionId: 'tv-x' });
  });

  it('only published topics appear in the library', () => {
    const c = fixture.componentInstance;
    c.library.set([
      { id: 't1', name: 'Published', latestVersionNumber: 1, blockCount: 2, hasDraft: false, latestPublishedVersionId: 'tv-1', archivedAt: null },
      { id: 't2', name: 'Draft only', latestVersionNumber: 1, blockCount: 0, hasDraft: true, latestPublishedVersionId: null, archivedAt: null },
    ]);
    expect(c.filteredLibrary().map(t => t.id)).toEqual(['t1']);
  });
});
