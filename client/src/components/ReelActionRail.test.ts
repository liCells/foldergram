import { defineComponent, ref } from 'vue';
import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

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
  });

  it('does not bubble the info toggle click to a parent container', async () => {
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

    await wrapper.get('button[aria-label="Show reel details"]').trigger('click');
    await flushPromises();

    expect(wrapper.get('[data-test="parent-count"]').text()).toBe('0');
  });

  it('renders the info toggle beside the folder link', () => {
    const item = createFeedItem(22);

    const wrapper = mount(ReelActionRail, {
      props: {
        item
      },
      global: {
        stubs: {
          RouterLink: {
            props: ['to'],
            template: '<a data-test="folder-link"><slot /></a>'
          }
        }
      }
    });

    const controls = wrapper.findAll('.reel-action-rail > *');

    expect(controls).toHaveLength(2);
    expect(controls[0]?.find('button[aria-label="Show reel details"]').exists()).toBe(true);
    expect(controls[1]?.attributes('data-test')).toBe('folder-link');
  });
});
