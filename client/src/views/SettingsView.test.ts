import { createPinia, setActivePinia } from 'pinia';
import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as galleryApi from '../api/gallery';
import type { AppStats, AppStatus } from '../types/api';
import { useAppStore } from '../stores/app';
import SettingsView from './SettingsView.vue';

vi.mock('vue-router', () => ({
  useRoute: () => ({
    query: {}
  })
}));

function createAppStatus(
  defaultHomeFeedMode: AppStatus['preferences']['defaultHomeFeedMode'] = 'rediscover',
  defaultReelsFeedMode: AppStatus['preferences']['defaultReelsFeedMode'] = 'random'
): AppStatus {
  return {
    folders: 3,
    indexedImages: 18,
    indexedVideos: 6,
    scan: {
      isScanning: false,
      scanReason: null,
      phase: 'idle',
      startedAt: null,
      runId: null,
      discoveredFolders: 0,
      processedFolders: 0,
      discoveredImages: 0,
      processedImages: 0,
      queuedDerivativeJobs: 0,
      processedDerivativeJobs: 0,
      generatedThumbnails: 0,
      generatedPreviews: 0,
      currentFolder: null,
      lastCompletedScan: null
    },
    storage: {
      available: true,
      reason: null
    },
    libraryIndex: {
      rebuildRequired: false,
      reason: null,
      ignoredRootMediaCount: 0
    },
    preferences: {
      defaultHomeFeedMode,
      defaultReelsFeedMode,
      treatStoriesAsFolders: false
    },
    storiesMigration: {
      hasLegacyStoriesCandidates: false,
      decisionPending: false
    }
  };
}

function createAppStats(): AppStats {
  return {
    ...createAppStatus(),
    deletedImages: 0,
    thumbnailCount: 18,
    previewCount: 6,
    storage: {
      available: true,
      reason: null,
      usingInMemoryDatabase: false
    },
    libraryIndex: {
      rebuildRequired: false,
      reason: null,
      currentGalleryRoot: '/gallery',
      previousGalleryRoot: null,
      lastSuccessfulGalleryRoot: '/gallery',
      ignoredRootMediaCount: 0
    },
    lastScan: null
  };
}

describe('SettingsView', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.restoreAllMocks();
    vi.spyOn(galleryApi, 'fetchAdminStats').mockResolvedValue(createAppStats());
  });

  it('renders the combined feed defaults card with separate home and reels groups', async () => {
    const appStore = useAppStore();
    appStore.$patch({
      stats: createAppStatus()
    });

    const wrapper = mount(SettingsView, {
      global: {
        stubs: {
          ConfirmDialog: true
        }
      }
    });

    await flushPromises();

    expect(wrapper.text()).toContain('Feed Defaults');
    expect(wrapper.text()).toContain('Home feed default');
    expect(wrapper.text()).toContain('Reels feed default');
    expect(wrapper.findAll('input[type="radio"]')).toHaveLength(6);
    expect(wrapper.text()).not.toContain('Save Home Feed Default');
    expect(wrapper.text()).not.toContain('Save Reels Feed Default');
    expect((wrapper.get('input[name="home-feed-default"][value="rediscover"]').element as HTMLInputElement).checked).toBe(true);
    expect((wrapper.get('input[name="reels-feed-default"][value="random"]').element as HTMLInputElement).checked).toBe(true);

    const saveButton = wrapper
      .findAll('button')
      .find((button) => button.text() === 'Saved');

    expect(saveButton).toBeDefined();
    expect(saveButton!.attributes('disabled')).toBeDefined();
  });

  it('hydrates the saved feed defaults correctly when app status finishes loading after mount', async () => {
    const appStore = useAppStore();
    appStore.$patch({
      stats: null,
      loadingStats: true
    });

    const wrapper = mount(SettingsView, {
      global: {
        stubs: {
          ConfirmDialog: true
        }
      }
    });

    await flushPromises();

    appStore.$patch({
      loadingStats: false,
      stats: createAppStatus('recent', 'random')
    });

    await flushPromises();

    expect((wrapper.get('input[name="home-feed-default"][value="recent"]').element as HTMLInputElement).checked).toBe(true);
    expect((wrapper.get('input[name="home-feed-default"][value="random"]').element as HTMLInputElement).checked).toBe(false);
    expect((wrapper.get('input[name="reels-feed-default"][value="random"]').element as HTMLInputElement).checked).toBe(true);

    const saveButton = wrapper
      .findAll('button')
      .find((button) => button.text() === 'Saved');

    expect(saveButton).toBeDefined();
    expect(saveButton!.attributes('disabled')).toBeDefined();
  });

  it('saves the reels default from the feed defaults card', async () => {
    const appStore = useAppStore();
    appStore.$patch({
      stats: createAppStatus()
    });

    vi.spyOn(appStore, 'fetchStats').mockResolvedValue();
    const updateReelsFeedDefaultSpy = vi.spyOn(galleryApi, 'updateReelsFeedDefault').mockResolvedValue({
      defaultMode: 'recommended'
    });

    const wrapper = mount(SettingsView, {
      global: {
        stubs: {
          ConfirmDialog: true
        }
      }
    });

    await flushPromises();

    await wrapper.get('input[value="recommended"]').setValue(true);
    await flushPromises();

    const updateHomeFeedDefaultSpy = vi.spyOn(galleryApi, 'updateHomeFeedDefault');
    const saveButton = wrapper
      .findAll('button')
      .find((button) => button.text() === 'Save Feed Defaults');

    expect(saveButton).toBeDefined();

    await saveButton!.trigger('click');
    await flushPromises();

    expect(updateReelsFeedDefaultSpy).toHaveBeenCalledWith('recommended');
    expect(updateHomeFeedDefaultSpy).not.toHaveBeenCalled();
    expect(appStore.stats?.preferences.defaultReelsFeedMode).toBe('recommended');
    expect(wrapper.text()).toContain('Reels now opens with Recommended.');
  });
});
