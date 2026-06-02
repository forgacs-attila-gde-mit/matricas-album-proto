import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { of } from 'rxjs';
import { AlbumApi } from '../../core/services/album-api.service';
import { TopicBlockRef, TopicDetail } from '../../core/models/album.model';
import { TopicBuilderComponent } from './topic-builder.component';

function blockRef(id: string, sortOrder: number): TopicBlockRef {
  return { id, blockVersionId: `bv-${id}`, blockId: `b-${id}`, blockName: `Block ${id}`, blockVersionNumber: 1, activityCount: 2, sortOrder };
}

function draftDetail(blocks: TopicBlockRef[]): TopicDetail {
  return {
    id: 'top-1',
    name: 'Teszt témakör',
    archivedAt: null,
    versions: [{ id: 'tv-1', topicId: 'top-1', versionNumber: 1, isDraft: true, name: 'Teszt témakör', blocks }],
  };
}

describe('TopicBuilderComponent — Task 5.2', () => {
  let fixture: ComponentFixture<TopicBuilderComponent>;
  let api: jasmine.SpyObj<AlbumApi>;

  beforeEach(async () => {
    api = jasmine.createSpyObj<AlbumApi>('AlbumApi', ['getTopics', 'getBlocks', 'getTopic', 'addTopicBlock', 'removeTopicBlock', 'reorderTopicBlocks']);
    api.getTopics.and.returnValue(of([]));
    api.getBlocks.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [TopicBuilderComponent],
      providers: [{ provide: AlbumApi, useValue: api }],
    }).compileComponents();
    fixture = TestBed.createComponent(TopicBuilderComponent);
    fixture.detectChanges();
  });

  it('preview_order: block references are exposed sorted by sortOrder', () => {
    const c = fixture.componentInstance;
    c.selectedTopic.set(draftDetail([blockRef('b', 2), blockRef('a', 1)]));
    expect(c.blocks().map(b => b.id)).toEqual(['a', 'b']);
  });

  it('builder_dragdrop: dropping reorders and persists the new order', () => {
    const c = fixture.componentInstance;
    c.selectedTopic.set(draftDetail([blockRef('a', 1), blockRef('b', 2)]));
    api.reorderTopicBlocks.and.returnValue(of(draftDetail([blockRef('b', 1), blockRef('a', 2)])));

    c.drop({ previousIndex: 1, currentIndex: 0 } as CdkDragDrop<TopicBlockRef[]>);

    expect(api.reorderTopicBlocks).toHaveBeenCalledWith('top-1', [
      { id: 'b', sortOrder: 1 },
      { id: 'a', sortOrder: 2 },
    ]);
    expect(c.blocks().map(b => b.id)).toEqual(['b', 'a']);
  });

  it('add_block references the published version id of a block', () => {
    const c = fixture.componentInstance;
    c.selectedTopic.set(draftDetail([]));
    api.addTopicBlock.and.returnValue(of(draftDetail([blockRef('x', 1)])));

    c.addBlock({ id: 'b-x', name: 'Block x', latestVersionNumber: 2, flowType: 'linear', grouping: 'group', activityCount: 3, hasDraft: false, latestPublishedVersionId: 'bv-x', archivedAt: null });

    expect(api.addTopicBlock).toHaveBeenCalledWith('top-1', { blockVersionId: 'bv-x' });
  });

  it('only published blocks appear in the library', () => {
    const c = fixture.componentInstance;
    c.library.set([
      { id: 'b1', name: 'Published', latestVersionNumber: 1, flowType: 'linear', grouping: 'group', activityCount: 1, hasDraft: false, latestPublishedVersionId: 'bv-1', archivedAt: null },
      { id: 'b2', name: 'Draft only', latestVersionNumber: 1, flowType: 'linear', grouping: 'group', activityCount: 0, hasDraft: true, latestPublishedVersionId: null, archivedAt: null },
    ]);
    expect(c.filteredLibrary().map(b => b.id)).toEqual(['b1']);
  });
});
