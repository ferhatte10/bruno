import { buildSidebarEntries } from './index';
import * as platformUtils from 'utils/common/platform';

jest.mock('utils/common/platform', () => ({
  ...jest.requireActual('utils/common/platform'),
  isWindowsOS: jest.fn()
}));

describe('buildSidebarEntries', () => {
  it('resolves collection without ghost entry when paths differ only by case on Windows', () => {
    platformUtils.isWindowsOS.mockReturnValue(true);

    const activeWorkspace = {
      type: 'custom',
      collections: [
        { path: 'C:\\users\\bob\\my-collection', remote: true }
      ]
    };

    const collections = [
      { uid: '123', pathname: 'C:\\Users\\Bob\\My-Collection' }
    ];

    const entries = buildSidebarEntries({ collections, activeWorkspace, workspaces: [] });

    expect(entries).toHaveLength(1);
    expect(entries[0].kind).toBe('loaded');
    expect(entries[0].collection).toBe(collections[0]);
  });

  it('keeps case-sensitive behavior on non-Windows platforms', () => {
    platformUtils.isWindowsOS.mockReturnValue(false);

    const activeWorkspace = {
      type: 'custom',
      collections: [
        { path: '/users/bob/my-collection', remote: true }
      ]
    };

    const collections = [
      { uid: '123', pathname: '/Users/Bob/My-Collection' }
    ];

    const entries = buildSidebarEntries({ collections, activeWorkspace, workspaces: [] });

    expect(entries).toHaveLength(1);
    expect(entries[0].kind).toBe('ghost');
  });
});

describe('buildSidebarEntries with pinned collections', () => {
  const activeWorkspace = {
    type: 'custom',
    collections: [
      { path: '/ws/charlie' },
      { path: '/ws/alpha' },
      { path: '/ws/bravo' },
      { path: '/ws/delta' }
    ]
  };

  const collections = [
    { uid: 'c', name: 'charlie', pathname: '/ws/charlie' },
    { uid: 'a', name: 'alpha', pathname: '/ws/alpha' },
    { uid: 'b', name: 'bravo', pathname: '/ws/bravo' },
    { uid: 'd', name: 'delta', pathname: '/ws/delta' }
  ];

  const orderOf = (entries) => entries.map((e) => e.collection.uid);

  beforeEach(() => {
    platformUtils.isWindowsOS.mockReturnValue(false);
  });

  it('keeps workspace order when nothing is pinned', () => {
    const entries = buildSidebarEntries({ collections, activeWorkspace, workspaces: [], pinnedCollectionPaths: [] });
    expect(orderOf(entries)).toEqual(['c', 'a', 'b', 'd']);
  });

  it('moves pinned collections to the top and keeps workspace order within each group', () => {
    const entries = buildSidebarEntries({
      collections,
      activeWorkspace,
      workspaces: [],
      pinnedCollectionPaths: ['/ws/delta', '/ws/alpha']
    });
    expect(orderOf(entries)).toEqual(['a', 'd', 'c', 'b']);
  });

  it('applies the alphabetical sort inside the pinned and unpinned groups', () => {
    const entries = buildSidebarEntries({
      collections,
      activeWorkspace,
      workspaces: [],
      collectionSortOrder: 'alphabetical',
      pinnedCollectionPaths: ['/ws/delta', '/ws/charlie']
    });
    expect(orderOf(entries)).toEqual(['c', 'd', 'a', 'b']);
  });

  it('applies the reverse alphabetical sort inside the pinned and unpinned groups', () => {
    const entries = buildSidebarEntries({
      collections,
      activeWorkspace,
      workspaces: [],
      collectionSortOrder: 'reverseAlphabetical',
      pinnedCollectionPaths: ['/ws/alpha', '/ws/charlie']
    });
    expect(orderOf(entries)).toEqual(['c', 'a', 'd', 'b']);
  });

  it('ignores pinned paths that are not in the active workspace', () => {
    const entries = buildSidebarEntries({
      collections,
      activeWorkspace,
      workspaces: [],
      pinnedCollectionPaths: ['/elsewhere/other']
    });
    expect(orderOf(entries)).toEqual(['c', 'a', 'b', 'd']);
  });

  it('matches pinned paths case-insensitively on Windows', () => {
    platformUtils.isWindowsOS.mockReturnValue(true);
    const entries = buildSidebarEntries({
      collections,
      activeWorkspace,
      workspaces: [],
      pinnedCollectionPaths: ['/WS/Bravo']
    });
    expect(orderOf(entries)).toEqual(['b', 'c', 'a', 'd']);
  });
});
