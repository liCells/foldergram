import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { reactive } from 'vue';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { FeedItem, RailCapsule, RailViewerStoreContract } from '../types/api';
import { useAppStore } from '../stores/app';
import StoriesModal from './StoriesModal.vue';

function createVideoItem(id: number): FeedItem {
  return {
    id,
    folderId: 91,
    folderSlug: 'animal-planet',
    folderName: 'Animal Planet',
    folderPath: 'animal-planet',
    folderBreadcrumb: null,
    filename: `story-${id}.mp4`,
    width: 1080,
    height: 1920,
    mediaType: 'video',
    durationMs: 12_000,
    thumbnailUrl: `/thumbs/${id}.webp`,
    previewUrl: `/previews/${id}.mp4`,
    sortTimestamp: 1_777_000_000_000 + id,
    takenAt: 1_777_000_000_000 + id
  };
}

function createCapsule(id: string, title: string, item: FeedItem): RailCapsule {
  return {
    id,
    title,
    subtitle: 'Recent story set',
    dateContext: 'Latest Mar 28, 2026',
    imageCount: 1,
    coverImage: item
  };
}

function createStore(capsules: RailCapsule[], imagesByCapsuleId: Record<string, FeedItem[]>) {
  return reactive<RailViewerStoreContract>({
    currentCapsule: null,
    currentImages: [],
    currentHasMore: false,
    async loadCapsule(id: string) {
      const capsule = capsules.find((entry) => entry.id === id) ?? null;
      if (!capsule) {
        return;
      }

      this.currentCapsule = capsule;
      this.currentImages = imagesByCapsuleId[id] ?? [];
      this.currentHasMore = false;
    }
  });
}

describe('StoriesModal', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    setActivePinia(createPinia());
    const appStore = useAppStore();
    appStore.$patch({
      videoMuted: true,
      stats: null
    });

    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
  });

  it('renders an actual video element for video story items in the shared rail viewer', async () => {
    const videoItem = createVideoItem(401);
    const capsule = createCapsule('home-stories', 'Home Stories', videoItem);
    const store = createStore([capsule], {
      [capsule.id]: [videoItem]
    });

    const wrapper = mount(StoriesModal, {
      props: {
        items: [capsule],
        initialId: capsule.id,
        railSingularLabel: 'Story',
        store
      },
      global: {
        stubs: {
          Avatar: {
            template: '<div data-test="avatar" />'
          },
          ResilientImage: {
            template: '<img data-test="resilient-image" />'
          }
        }
      }
    });

    await flushPromises();

    const video = wrapper.get('video.story-stage__video');
    expect(video.attributes('src')).toBe(videoItem.previewUrl);
    expect(video.attributes('poster')).toBe(videoItem.thumbnailUrl);
    expect(wrapper.find('img[data-test="resilient-image"]').exists()).toBe(false);
  });

  it('renders a download-original control and updates it when the active capsule changes', async () => {
    const firstItem = createVideoItem(451);
    const secondItem = createVideoItem(452);
    const firstCapsule = createCapsule('capsule-download-one', 'Download One', firstItem);
    const secondCapsule = createCapsule('capsule-download-two', 'Download Two', secondItem);
    const store = createStore([firstCapsule, secondCapsule], {
      [firstCapsule.id]: [firstItem],
      [secondCapsule.id]: [secondItem]
    });

    const wrapper = mount(StoriesModal, {
      props: {
        items: [firstCapsule, secondCapsule],
        initialId: firstCapsule.id,
        railSingularLabel: 'Story',
        store
      },
      global: {
        stubs: {
          Avatar: {
            template: '<div data-test="avatar" />'
          },
          ResilientImage: {
            template: '<img data-test="resilient-image" />'
          }
        }
      }
    });

    await flushPromises();

    expect(wrapper.get('a[aria-label="Download original file"]').attributes('href')).toBe('/api/originals/451?download=1');

    await wrapper.get('.story-stage__pager--right').trigger('click');
    await flushPromises();

    expect(wrapper.get('a[aria-label="Download original file"]').attributes('href')).toBe('/api/originals/452?download=1');
  });

  it('keeps the next arrow enabled on the last item when another capsule exists and advances into it', async () => {
    const firstItem = createVideoItem(501);
    const secondItem = createVideoItem(502);
    const firstCapsule = createCapsule('capsule-one', 'First Stories', firstItem);
    const secondCapsule = createCapsule('capsule-two', 'Second Stories', secondItem);
    const store = createStore([firstCapsule, secondCapsule], {
      [firstCapsule.id]: [firstItem],
      [secondCapsule.id]: [secondItem]
    });

    const wrapper = mount(StoriesModal, {
      props: {
        items: [firstCapsule, secondCapsule],
        initialId: firstCapsule.id,
        railSingularLabel: 'Story',
        store
      },
      global: {
        stubs: {
          Avatar: {
            template: '<div data-test="avatar" />'
          },
          ResilientImage: {
            template: '<img data-test="resilient-image" />'
          }
        }
      }
    });

    await flushPromises();

    const nextButton = wrapper.get('.story-stage__pager--right');
    expect(nextButton.attributes('disabled')).toBeUndefined();

    await nextButton.trigger('click');
    await flushPromises();

    expect(wrapper.text()).toContain('Second Stories');
    expect(wrapper.get('video.story-stage__video').attributes('src')).toBe(secondItem.previewUrl);
  });

  it('autoplay advances into the next capsule when the current capsule finishes', async () => {
    vi.useFakeTimers();

    let autoplayNow = 0;
    vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation((callback: FrameRequestCallback) =>
      window.setTimeout(() => {
        autoplayNow += 5_000;
        callback(autoplayNow);
      }, 0)
    );

    const firstItem = createVideoItem(601);
    const secondItem = createVideoItem(602);
    const firstCapsule = createCapsule('capsule-autoplay-one', 'Autoplay One', firstItem);
    const secondCapsule = createCapsule('capsule-autoplay-two', 'Autoplay Two', secondItem);
    const store = createStore([firstCapsule, secondCapsule], {
      [firstCapsule.id]: [firstItem],
      [secondCapsule.id]: [secondItem]
    });

    const wrapper = mount(StoriesModal, {
      props: {
        items: [firstCapsule, secondCapsule],
        initialId: firstCapsule.id,
        railSingularLabel: 'Story',
        store
      },
      global: {
        stubs: {
          Avatar: {
            template: '<div data-test="avatar" />'
          },
          ResilientImage: {
            template: '<img data-test="resilient-image" />'
          }
        }
      }
    });

    await flushPromises();
    await vi.runAllTimersAsync();
    await flushPromises();

    expect(wrapper.text()).toContain('Autoplay Two');
    expect(wrapper.get('video.story-stage__video').attributes('src')).toBe(secondItem.previewUrl);

    vi.useRealTimers();
  });

  it('shows capsule load errors in the viewer and retries the active capsule', async () => {
    const videoItem = createVideoItem(701);
    const capsule = createCapsule('capsule-error', 'Error Stories', videoItem);
    const loadCapsule = vi.fn();
    let shouldFail = true;
    const store = reactive<RailViewerStoreContract>({
      currentCapsule: null,
      currentImages: [],
      currentHasMore: false,
      currentError: null,
      async loadCapsule(id: string) {
        loadCapsule(id);
        this.currentCapsule = capsule;
        this.currentImages = [videoItem];
        this.currentHasMore = false;
        this.currentError = shouldFail ? 'Unable to load this story capsule' : null;
        shouldFail = false;
      }
    });

    const wrapper = mount(StoriesModal, {
      props: {
        items: [capsule],
        initialId: capsule.id,
        railSingularLabel: 'Story',
        store
      },
      global: {
        stubs: {
          Avatar: {
            template: '<div data-test="avatar" />'
          },
          ResilientImage: {
            template: '<img data-test="resilient-image" />'
          }
        }
      }
    });

    await flushPromises();

    expect(wrapper.text()).toContain('Unable to load this story capsule');

    await wrapper.get('button.story-stage__error-button').trigger('click');
    await flushPromises();

    expect(loadCapsule).toHaveBeenCalledTimes(2);
    expect(loadCapsule).toHaveBeenLastCalledWith(capsule.id);
    expect(wrapper.text()).not.toContain('Unable to load this story capsule');
  });
});
