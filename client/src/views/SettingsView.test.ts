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
    excludedFolders: {
      envExcludedFolders: [],
      customExcludedFolders: [],
      effectiveExcludedFolders: []
    },
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

function mountSettingsView() {
  return mount(SettingsView, {
    global: {
      stubs: {
        ConfirmDialog: true
      }
    }
  });
}

async function openGeneralSettingsSidebarTab(wrapper: ReturnType<typeof mountSettingsView>) {
  const generalSettingsButton = wrapper
    .findAll('button')
    .find((button) => button.text().includes('General Settings'));

  expect(generalSettingsButton).toBeDefined();

  await generalSettingsButton!.trigger('click');
  await flushPromises();
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

    const wrapper = mountSettingsView();

    await flushPromises();

    expect(wrapper.text()).toContain('Scan & Library');
    expect(wrapper.text()).toContain('General Settings');
    expect(wrapper.text()).not.toContain('Home feed sort order');

    await openGeneralSettingsSidebarTab(wrapper);

    expect(wrapper.text()).toContain('Home feed sort order');
    expect(wrapper.text()).toContain('Reels feed sort order');
    expect(wrapper.text()).toContain('Excluded source folders');

    const [homeButton, reelsButton] = wrapper.findAll('button[aria-expanded]');
    expect(homeButton?.text()).toContain('Rediscover');
    expect(reelsButton?.text()).toContain('Random');

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

    const wrapper = mountSettingsView();

    await flushPromises();

    await openGeneralSettingsSidebarTab(wrapper);

    appStore.$patch({
      loadingStats: false,
      stats: createAppStatus('recent', 'random')
    });

    await flushPromises();

    const [homeButton, reelsButton] = wrapper.findAll('button[aria-expanded]');
    expect(homeButton?.text()).toContain('Recent');
    expect(reelsButton?.text()).toContain('Random');

    const saveButton = wrapper
      .findAll('button')
      .find((button) => button.text() === 'Saved');

    expect(saveButton).toBeDefined();
    expect(saveButton!.attributes('disabled')).toBeDefined();
  });

  it('saves the reels default from the general settings card', async () => {
    const appStore = useAppStore();
    appStore.$patch({
      stats: createAppStatus()
    });

    vi.spyOn(appStore, 'fetchStats').mockResolvedValue();
    const updateReelsFeedDefaultSpy = vi.spyOn(galleryApi, 'updateReelsFeedDefault').mockResolvedValue({
      defaultMode: 'recommended'
    });

    const wrapper = mountSettingsView();

    await flushPromises();
    await openGeneralSettingsSidebarTab(wrapper);

    const [, reelsButton] = wrapper.findAll('button[aria-expanded]');
    expect(reelsButton).toBeDefined();

    await reelsButton!.trigger('click');
    await flushPromises();
    const recommendedOption = wrapper.findAll('button').find((button) => button.text().includes('Recommended'));
    expect(recommendedOption).toBeDefined();
    await recommendedOption!.trigger('click');
    await flushPromises();

    const updateHomeFeedDefaultSpy = vi.spyOn(galleryApi, 'updateHomeFeedDefault');
    const updateExcludedFoldersSpy = vi.spyOn(galleryApi, 'updateExcludedFolders');
    const saveButton = wrapper
      .findAll('button')
      .find((button) => button.text() === 'Save changes');

    expect(saveButton).toBeDefined();

    await saveButton!.trigger('click');
    await flushPromises();

    expect(updateReelsFeedDefaultSpy).toHaveBeenCalledWith('recommended');
    expect(updateHomeFeedDefaultSpy).not.toHaveBeenCalled();
    expect(updateExcludedFoldersSpy).not.toHaveBeenCalled();
    expect(appStore.stats?.preferences.defaultReelsFeedMode).toBe('recommended');
    expect(wrapper.text()).toContain('Reels now opens with Recommended.');
  });

  it('saves custom excluded folder rules from the settings textarea', async () => {
    const appStore = useAppStore();
    appStore.$patch({
      stats: createAppStatus()
    });

    vi.spyOn(appStore, 'fetchStats').mockResolvedValue();
    const updateExcludedFoldersSpy = vi.spyOn(galleryApi, 'updateExcludedFolders').mockResolvedValue({
      envExcludedFolders: ['@eaDir'],
      customExcludedFolders: ['Archive/cache', 'thumbnails'],
      effectiveExcludedFolders: ['@eaDir', 'Archive/cache', 'thumbnails'],
      requiresScan: true
    });

    const wrapper = mountSettingsView();
    await flushPromises();
    await openGeneralSettingsSidebarTab(wrapper);

    await wrapper.get('textarea').setValue('Archive/cache\nthumbnails');
    await flushPromises();

    const saveButton = wrapper
      .findAll('button')
      .find((button) => button.text() === 'Save changes');

    expect(saveButton).toBeDefined();

    await saveButton!.trigger('click');
    await flushPromises();

    expect(updateExcludedFoldersSpy).toHaveBeenCalledWith(['Archive/cache', 'thumbnails']);
    expect(wrapper.text()).toContain('Excluded folders were saved. Run a library scan to apply them.');
  });
});
