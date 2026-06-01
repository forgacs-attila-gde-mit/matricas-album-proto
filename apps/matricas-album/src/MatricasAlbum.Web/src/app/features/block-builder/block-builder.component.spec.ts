import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { of } from 'rxjs';
import { AlbumApi } from '../../core/services/album-api.service';
import { BlockActivityRef, BlockDetail } from '../../core/models/album.model';
import { BlockBuilderComponent } from './block-builder.component';

function activity(id: string, sortOrder: number, role = 'primary'): BlockActivityRef {
  return { id, stickerVersionId: `sv-${id}`, stickerResourceId: `sr-${id}`, activityTitle: `Act ${id}`, stickerVersionNumber: 1, role, sortOrder };
}

function draftDetail(activities: BlockActivityRef[]): BlockDetail {
  return {
    id: 'blk-1',
    name: 'Teszt blokk',
    archivedAt: null,
    versions: [{ id: 'bv-1', blockId: 'blk-1', versionNumber: 1, isDraft: true, name: 'Teszt blokk', flowType: 'linear', grouping: 'group', activities }],
  };
}

describe('BlockBuilderComponent — Task 4.3', () => {
  let fixture: ComponentFixture<BlockBuilderComponent>;
  let api: jasmine.SpyObj<AlbumApi>;

  beforeEach(async () => {
    api = jasmine.createSpyObj<AlbumApi>('AlbumApi', [
      'getBlocks', 'getStickerLibrary', 'getBlock', 'createBlock', 'addBlockActivity',
      'updateBlockActivityRole', 'removeBlockActivity', 'reorderBlockActivities',
    ]);
    api.getBlocks.and.returnValue(of([]));
    api.getStickerLibrary.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [BlockBuilderComponent],
      providers: [{ provide: AlbumApi, useValue: api }],
    }).compileComponents();
    fixture = TestBed.createComponent(BlockBuilderComponent);
    fixture.detectChanges();
  });

  it('preview_order: activities are exposed sorted by sortOrder', () => {
    const c = fixture.componentInstance;
    // Provide them out of order; the builder must present them by sortOrder.
    c.selectedBlock.set(draftDetail([activity('b', 2), activity('a', 1)]));

    expect(c.activities().map(a => a.id)).toEqual(['a', 'b']);
  });

  it('assign_role: setRole calls the API with the chosen role', () => {
    const c = fixture.componentInstance;
    c.selectedBlock.set(draftDetail([activity('a', 1)]));
    api.updateBlockActivityRole.and.returnValue(of(draftDetail([activity('a', 1, 'assessment')])));

    c.setRole('a', 'assessment');

    expect(api.updateBlockActivityRole).toHaveBeenCalledWith('blk-1', 'a', 'assessment');
    expect(c.activities()[0].role).toBe('assessment');
  });

  it('builder_dragdrop: dropping reorders and persists the new sort order', () => {
    const c = fixture.componentInstance;
    c.selectedBlock.set(draftDetail([activity('a', 1), activity('b', 2)]));
    api.reorderBlockActivities.and.returnValue(of(draftDetail([activity('b', 1), activity('a', 2)])));

    // Drag the 2nd card (index 1) to the front (index 0).
    c.drop({ previousIndex: 1, currentIndex: 0 } as CdkDragDrop<BlockActivityRef[]>);

    expect(api.reorderBlockActivities).toHaveBeenCalledWith('blk-1', [
      { id: 'b', sortOrder: 1 },
      { id: 'a', sortOrder: 2 },
    ]);
    expect(c.activities().map(a => a.id)).toEqual(['b', 'a']);
  });

  it('does not call reorder when the card is dropped in place', () => {
    const c = fixture.componentInstance;
    c.selectedBlock.set(draftDetail([activity('a', 1), activity('b', 2)]));

    c.drop({ previousIndex: 1, currentIndex: 1 } as CdkDragDrop<BlockActivityRef[]>);

    expect(api.reorderBlockActivities).not.toHaveBeenCalled();
  });
});
