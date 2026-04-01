import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { FeedItem } from '../types/api';
import FeedCard from './FeedCard.vue';

vi.mock('vidstack/bundle', () => ({}));
vi.mock('vue-router', async () => {
  const actual = await vi.importActual<typeof import('vue-router')>('vue-router');

  return {
    ...actual,
    useRoute: () => ({
      fullPath: '/',
      query: {}
    })
  };
});

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
class FakeMediaControlsElement extends HTMLElement {}
class FakeMediaControlsGroupElement extends HTMLElement {}
class FakeMediaPlayButtonElement extends HTMLElement {}
class FakeMediaMuteButtonElement extends HTMLElement {}
class FakeMediaFullscreenButtonElement extends HTMLElement {}

if (!customElements.get('media-player')) {
  customElements.define('media-player', FakeMediaPlayerElement);
}

if (!customElements.get('media-provider')) {
  customElements.define('media-provider', FakeMediaProviderElement);
}

if (!customElements.get('media-poster')) {
  customElements.define('media-poster', FakeMediaPosterElement);
}

if (!customElements.get('media-controls')) {
  customElements.define('media-controls', FakeMediaControlsElement);
}

if (!customElements.get('media-controls-group')) {
  customElements.define('media-controls-group', FakeMediaControlsGroupElement);
}

if (!customElements.get('media-play-button')) {
  customElements.define('media-play-button', FakeMediaPlayButtonElement);
}

if (!customElements.get('media-mute-button')) {
  customElements.define('media-mute-button', FakeMediaMuteButtonElement);
}

if (!customElements.get('media-fullscreen-button')) {
  customElements.define('media-fullscreen-button', FakeMediaFullscreenButtonElement);
}

function createVideoItem(id: number): FeedItem {
  return {
    id,
    folderId: 15,
    folderSlug: 'phone-clips',
    folderName: 'Phone Clips',
    folderPath: 'phone-clips',
    folderBreadcrumb: null,
    filename: `clip-${id}.mp4`,
    width: 1920,
    height: 1080,
    mediaType: 'video',
    durationMs: 31_000,
    thumbnailUrl: `/thumbs/${id}.webp`,
    previewUrl: `/previews/${id}.mp4`,
    sortTimestamp: 1_777_000_000_000 + id,
    takenAt: 1_777_000_000_000 + id
  };
}

function createImageItem(id: number): FeedItem {
  return {
    id,
    folderId: 15,
    folderSlug: 'phone-clips',
    folderName: 'Phone Clips',
    folderPath: 'phone-clips',
    folderBreadcrumb: null,
    filename: `photo-${id}.jpg`,
    width: 1200,
    height: 1500,
    mediaType: 'image',
    durationMs: null,
    thumbnailUrl: `/thumbs/${id}.webp`,
    previewUrl: `/previews/${id}.webp`,
    sortTimestamp: 1_777_000_000_000 + id,
    takenAt: 1_777_000_000_000 + id
  };
}

const globalStubs = {
  Avatar: {
    template: '<div data-test="avatar" />'
  },
  ConfirmDialog: {
    template: '<div data-test="confirm-dialog" />'
  },
  ResilientImage: {
    template: '<img data-test="resilient-image" />'
  },
  RouterLink: {
    props: ['custom', 'to'],
    template: `
      <template v-if="custom">
        <span class="router-link-stub" :data-to="typeof to === 'string' ? to : JSON.stringify(to)">
          <slot href="#" :navigate="() => {}" />
        </span>
      </template>
      <a v-else v-bind="$attrs" :data-to="typeof to === 'string' ? to : JSON.stringify(to)"><slot /></a>
    `
  }
};

describe('FeedCard', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        observe() {}
        disconnect() {}
        unobserve() {}
      }
    );
  });

  it('updates the home video aspect ratio from the loaded video element when metadata disagrees with indexed dimensions', async () => {
    const wrapper = mount(FeedCard, {
      props: {
        item: createVideoItem(804),
        avatarUrl: null,
        context: 'home',
        isActiveVideo: false
      },
      global: {
        stubs: globalStubs
      }
    });

    await flushPromises();

    const player = wrapper.get('media-player').element as unknown as FakeMediaPlayerElement;
    const container = player.parentElement as HTMLElement;

    expect(container.style.aspectRatio).toBe('1920 / 1080');

    const video = document.createElement('video');
    Object.defineProperty(video, 'videoWidth', {
      configurable: true,
      value: 1080
    });
    Object.defineProperty(video, 'videoHeight', {
      configurable: true,
      value: 1920
    });
    player.appendChild(video);
    player.dispatchEvent(new Event('loaded-metadata'));

    await flushPromises();

    expect(container.style.aspectRatio).toBe('1080 / 1920');
  });

  it('toggles playback from home-feed video clicks and shows the paused indicator', async () => {
    const wrapper = mount(FeedCard, {
      props: {
        item: createVideoItem(805),
        avatarUrl: null,
        context: 'home',
        isActiveVideo: true
      },
      global: {
        stubs: globalStubs
      }
    });

    await flushPromises();

    const player = wrapper.get('media-player').element as unknown as FakeMediaPlayerElement;
    expect(player.playCallCount).toBeGreaterThanOrEqual(1);
    expect(player.paused).toBe(false);
    expect(wrapper.find('.feed-card__pause-indicator').exists()).toBe(false);

    await wrapper.get('.feed-card__video-shell').trigger('click');
    await flushPromises();

    expect(player.pauseCallCount).toBe(1);
    expect(player.paused).toBe(true);
    expect(wrapper.find('.feed-card__pause-indicator').exists()).toBe(true);

    await wrapper.get('.feed-card__video-shell').trigger('click');
    await flushPromises();

    expect(player.playCallCount).toBeGreaterThanOrEqual(2);
    expect(player.paused).toBe(false);
    expect(wrapper.find('.feed-card__pause-indicator').exists()).toBe(false);
  });

  it('renders a story ring on the home avatar and emits an in-place story open event', async () => {
    const wrapper = mount(FeedCard, {
      props: {
        item: createVideoItem(806),
        avatarUrl: null,
        hasAvatarStory: true,
        context: 'home',
        isActiveVideo: false
      },
      global: {
        stubs: globalStubs
      }
    });

    await flushPromises();

    const avatarButton = wrapper.get('button[aria-label="Open Phone Clips stories"]');
    expect(avatarButton.exists()).toBe(true);
    expect(avatarButton.attributes('title')).toBe('Open Phone Clips stories');

    await avatarButton.trigger('click');

    expect(wrapper.emitted('openFolderStory')).toEqual([['phone-clips']]);
  });

  it('exposes native tooltip titles on the feed card icon controls', async () => {
    const wrapper = mount(FeedCard, {
      props: {
        item: createImageItem(807),
        avatarUrl: null,
        context: 'home',
        isActiveVideo: false
      },
      global: {
        stubs: globalStubs
      }
    });

    await flushPromises();

    expect(wrapper.get('button[aria-label="More options"]').attributes('title')).toBe('More options');
    expect(wrapper.get('button[aria-label="Like post"]').attributes('title')).toBe('Like post');
    expect(wrapper.get('a[aria-label="Open post"]').attributes('title')).toBe('Open post');
    const postRouteLink = wrapper
      .findAll('a[data-to]')
      .find((candidate) => candidate.attributes('data-to')?.includes('"name":"image"'));

    expect(postRouteLink?.attributes('data-to')).toContain('"name":"image"');
    expect(postRouteLink?.attributes('data-to')).toContain('"id":"807"');
    expect(wrapper.get('a[aria-label="Open folder"]').attributes('title')).toBe('Open folder');

    const downloadLink = wrapper.get('a[aria-label="Download original file"]');

    expect(downloadLink.attributes('href')).toBe('/api/originals/807?download=1');
    expect(downloadLink.attributes('title')).toBe('Download original file');

    const originalLink = wrapper.get('a[aria-label="Open original file"]');

    expect(originalLink.attributes('href')).toBe('/api/originals/807');
    expect(originalLink.attributes('title')).toBe('Open original file');
  });
});
