let mockStoreData = {};

jest.mock('electron-store', () => {
  return jest.fn().mockImplementation((opts = {}) => {
    mockStoreData = { ...(opts.defaults || {}) };
    return {
      get store() {
        return mockStoreData;
      },
      set store(value) {
        mockStoreData = value;
      },
      get: (key, fallback) => (key in mockStoreData ? mockStoreData[key] : fallback),
      set: (key, value) => {
        mockStoreData[key] = value;
      },
      delete: (key) => {
        delete mockStoreData[key];
      }
    };
  });
});

const snapshotManager = require('../../src/services/snapshot');

const workspacePath = '/workspaces/my-workspace';
const payments = `${workspacePath}/collections/payments`;
const users = `${workspacePath}/collections/users`;

const save = (workspace) =>
  snapshotManager.saveSnapshot({
    version: '0.0.1',
    activeWorkspacePath: workspacePath,
    extras: { devTools: { open: false, activeTab: '', tabs: {} } },
    workspaces: [
      {
        pathname: workspacePath,
        environment: '',
        lastActiveCollectionPathname: null,
        activeWorkspaceTabType: null,
        sorting: 'default',
        collections: [],
        ...workspace
      }
    ],
    collections: []
  });

const savedWorkspace = () => snapshotManager.getSnapshot().workspaces[0];

describe('workspace snapshot: pinned collections', () => {
  beforeEach(() => {
    mockStoreData = { workspaces: [], collections: [] };
    snapshotManager._lookupCache = null;
  });

  it('remembers pinned collections so they stay on top after a restart', () => {
    expect(save({ pinnedCollections: [payments, users] })).toBe(true);

    expect(savedWorkspace().pinnedCollections).toEqual([payments, users]);
  });

  it('keeps one entry per collection when the same collection is pinned twice', () => {
    save({ pinnedCollections: [payments, payments, users] });

    expect(savedWorkspace().pinnedCollections).toEqual([payments, users]);
  });

  it('throws away entries that are not paths', () => {
    save({ pinnedCollections: [payments, 123, null, '', users] });

    expect(savedWorkspace().pinnedCollections).toEqual([payments, users]);
  });

  it('records no pinned collections for snapshots written before pinning existed', () => {
    save({});

    expect(savedWorkspace().pinnedCollections).toEqual([]);
  });
});
