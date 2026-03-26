import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

import { useAppStore } from '../stores/app';
import type { FeedItem, FolderSummary } from '../types/api';
import ReelPlayerCard from './ReelPlayerCard.vue';

vi.mock('vidstack/bundle', () => ({}));

class FakeMediaPlayerElement extends HTMLElement {
  muted = true;
  paused = true;
  playCallCount = 0;
  pauseCallCount = 0;

  async play() {
    this.playCallCount += 1;
    this.paused = false;
  }

  async pause() {
    this.pauseCallCount += 1;
    this.paused = true;
  }
}

class FakeMediaProviderElement extends HTMLElement {}
class FakeMediaPosterElement extends HTMLElement {}

if (!customElements.get('media-player')) {
  customElements.define('media-player', FakeMediaPlayerElement);
}

if (!customElements.get('media-provider')) {
  customElements.define('media-provider', FakeMediaProviderElement);
}

if (!customElements.get('media-poster')) {
  customElements.define('media-poster', FakeMediaPosterElement);
}

function createFeedItem(id: number): FeedItem {
  return {
    id,
    folderId: 77,
    folderSlug: 'animal-planet',
    folderName: 'Animal Planet',
    folderPath: 'animal-planet',
    folderBreadcrumb: null,
    filename: `reel-${id}.mp4`,
    width: 1080,
    height: 1920,
    mediaType: 'video',
    durationMs: 21_000,
    thumbnailUrl: `/thumbs/${id}.webp`,
    previewUrl: `/previews/${id}.mp4`,
    sortTimestamp: 1_777_000_000_000 + id,
    takenAt: 1_777_000_000_000 + id
  };
}

function createFolder(): FolderSummary {
  return {
    id: 77,
    slug: 'animal-planet',
    name: 'Animal Planet',
    description: 'Wildlife clips',
    folderPath: 'animal-planet',
    breadcrumb: null,
    imageCount: 0,
    videoCount: 3,
    latestImageMtimeMs: null,
    avatarImageId: null,
    avatarUrl: null
  };
}

function getPlayerElement(wrapper: ReturnType<typeof mount>) {
  return wrapper.get('media-player').element as unknown as FakeMediaPlayerElement;
}

describe('ReelPlayerCard', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    const appStore = useAppStore();
    appStore.$patch({
      videoMuted: true
    });
    window.localStorage.clear();
  });

  it('shows the overlay only for the active reel', async () => {
    const wrapper = mount(ReelPlayerCard, {
      props: {
        item: createFeedItem(1),
        folder: createFolder(),
        active: true
      },
      global: {
        stubs: {
          Avatar: {
            template: '<div data-test="avatar" />'
          }
        }
      }
    });

    await flushPromises();
    expect(wrapper.get('.reel-player-card__overlay').classes()).toContain('reel-player-card__overlay--visible');

    await wrapper.setProps({
      active: false
    });
    await flushPromises();

    expect(wrapper.get('.reel-player-card__overlay').classes()).not.toContain('reel-player-card__overlay--visible');
  });

  it('toggles playback when the active reel surface is clicked', async () => {
    const wrapper = mount(ReelPlayerCard, {
      props: {
        item: createFeedItem(2),
        folder: createFolder(),
        active: true
      },
      global: {
        stubs: {
          Avatar: {
            template: '<div data-test="avatar" />'
          }
        }
      }
    });

    await flushPromises();

    const player = getPlayerElement(wrapper);
    expect(player.playCallCount).toBeGreaterThanOrEqual(1);
    expect(player.paused).toBe(false);
    expect(wrapper.find('.reel-player-card__pause-indicator').exists()).toBe(false);

    await wrapper.get('.reel-player-card__surface').trigger('click');
    await flushPromises();

    expect(player.pauseCallCount).toBe(1);
    expect(player.paused).toBe(true);
    expect(wrapper.find('.reel-player-card__pause-indicator').exists()).toBe(true);

    await wrapper.get('.reel-player-card__surface').trigger('click');
    await flushPromises();

    expect(player.playCallCount).toBeGreaterThanOrEqual(2);
    expect(player.paused).toBe(false);
    expect(wrapper.find('.reel-player-card__pause-indicator').exists()).toBe(false);
  });

  it('persists the mute preference for the current reel and later reels', async () => {
    const appStore = useAppStore();
    const wrapper = mount(ReelPlayerCard, {
      props: {
        item: createFeedItem(3),
        folder: createFolder(),
        active: true
      },
      global: {
        stubs: {
          Avatar: {
            template: '<div data-test="avatar" />'
          }
        }
      }
    });

    await flushPromises();

    await wrapper.get('.reel-player-card__sound-button').trigger('click');
    await flushPromises();

    const firstPlayer = getPlayerElement(wrapper);
    expect(appStore.videoMuted).toBe(false);
    expect(firstPlayer.muted).toBe(false);
    expect(wrapper.get('.reel-player-card__sound-button').attributes('aria-label')).toBe('Mute sound');

    wrapper.unmount();

    const nextWrapper = mount(ReelPlayerCard, {
      props: {
        item: createFeedItem(4),
        folder: createFolder(),
        active: true
      },
      global: {
        stubs: {
          Avatar: {
            template: '<div data-test="avatar" />'
          }
        }
      }
    });

    await flushPromises();

    const secondPlayer = getPlayerElement(nextWrapper);
    expect(appStore.videoMuted).toBe(false);
    expect(secondPlayer.muted).toBe(false);
    expect(nextWrapper.get('.reel-player-card__sound-button').attributes('aria-label')).toBe('Mute sound');
  });
});
