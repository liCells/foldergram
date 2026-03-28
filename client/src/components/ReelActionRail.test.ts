import { defineComponent, ref } from 'vue';
import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

import { useAuthStore } from '../stores/auth';
import { useLikesStore } from '../stores/likes';
import type { FeedItem } from '../types/api';
import ReelActionRail from './ReelActionRail.vue';

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

describe('ReelActionRail', () => {
  beforeEach(() => {
    setActivePinia(createPinia());

    const authStore = useAuthStore();
    authStore.$patch({
      likesMode: 'local',
      capabilities: {
        canManageLibrary: false,
        canDeleteMedia: false,
        canAccessSettings: false,
        canUseSharedLikes: false,
        canUseLocalFavorites: true
      }
    });

    window.localStorage.clear();
  });

  it('does not bubble like clicks to a parent container', async () => {
    const likesStore = useLikesStore();
    const item = createFeedItem(15);

    const TestHost = defineComponent({
      components: {
        ReelActionRail
      },
      setup() {
        const parentClicks = ref(0);
        return {
          item,
          parentClicks
        };
      },
      template: `
        <div data-test="parent" @click="parentClicks += 1">
          <ReelActionRail :item="item" />
          <output data-test="parent-count">{{ parentClicks }}</output>
        </div>
      `
    });

    const wrapper = mount(TestHost, {
      global: {
        stubs: {
          RouterLink: {
            props: ['to'],
            template: '<a data-test="folder-link"><slot /></a>'
          }
        }
      }
    });

    await wrapper.get('button[aria-label="Like post"]').trigger('click');
    await flushPromises();

    expect(wrapper.get('[data-test="parent-count"]').text()).toBe('0');
    expect(likesStore.isLiked(item.id)).toBe(true);
  });
});
