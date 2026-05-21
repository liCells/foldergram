import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';

import FeedList from './FeedList.vue';

const items = [
  {
    id: 1,
    folderId: 7,
    folderSlug: 'animal-planet',
    folderName: 'AnimalPlanet',
    folderPath: 'animal-planet',
    folderBreadcrumb: null,
    filename: 'post-1.jpg',
    width: 1200,
    height: 1500,
    mediaType: 'image' as const,
    durationMs: null,
    isAnimated: false,
    thumbnailUrl: '/thumbnails/1.webp',
    previewUrl: '/previews/1.webp',
    sortTimestamp: 1_777_000_000_001,
    takenAt: 1_777_000_000_001
  },
  {
    id: 2,
    folderId: 7,
    folderSlug: 'animal-planet',
    folderName: 'AnimalPlanet',
    folderPath: 'animal-planet',
    folderBreadcrumb: null,
    filename: 'post-2.jpg',
    width: 1200,
    height: 1500,
    mediaType: 'image' as const,
    durationMs: null,
    isAnimated: false,
    thumbnailUrl: '/thumbnails/2.webp',
    previewUrl: '/previews/2.webp',
    sortTimestamp: 1_777_000_000_002,
    takenAt: 1_777_000_000_002
  }
];

describe('FeedList', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('adds timeline separators for the home feed', () => {
    const wrapper = mount(FeedList, {
      props: {
        items,
        context: 'home'
      },
      global: {
        stubs: {
          FeedCard: {
            props: ['item'],
            template: '<article class="feed-card-stub">{{ item.id }}</article>'
          }
        }
      }
    });

    expect(wrapper.get('section').classes()).toContain('feed-list--home');
    expect(wrapper.findAll('.feed-list__item')).toHaveLength(2);
  });
});
