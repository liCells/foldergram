import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { CollectionMembership, CollectionSummary, FeedItem } from '../types/api';
import { useAuthStore } from '../stores/auth';
import { useCollectionsStore } from '../stores/collections';
import CollectionBookmark from './CollectionBookmark.vue';

function createFeedItem(id: number): FeedItem {
  return {
    id,
    folderId: 11,
    folderSlug: 'album',
    folderName: 'Album',
    folderPath: 'album',
    folderBreadcrumb: null,
    filename: `photo-${id}.jpg`,
    width: 1200,
    height: 1500,
    mediaType: 'image',
    durationMs: null,
    isAnimated: false,
    thumbnailUrl: `/thumbnails/${id}.webp`,
    previewUrl: `/previews/${id}.webp`,
    sortTimestamp: 1_800_000_000_000 + id,
    takenAt: 1_800_000_000_000 + id,
    isSaved: false
  };
}

function createCollection(slug: string, name: string, isDefault = false): CollectionSummary {
  return {
    id: isDefault ? 1 : Math.abs(slug.length * 17),
    slug,
    name,
    isDefault,
    itemCount: 0,
    coverImage: null,
    previewImages: [],
    createdAt: '2026-04-28T00:00:00.000Z',
    updatedAt: '2026-04-28T00:00:00.000Z'
  };
}

function createMembership(collection: CollectionSummary, containsImage: boolean): CollectionMembership {
  return {
    ...collection,
    containsImage
  };
}

describe('CollectionBookmark', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    setActivePinia(createPinia());
    const authStore = useAuthStore();
    authStore.$patch({
      capabilities: {
        canManageLibrary: false,
        canDeleteMedia: false,
        canAccessSettings: false,
        canUseSharedLikes: false,
        canUseLocalFavorites: true,
        canUseSharedCollections: false,
        canUseLocalCollections: true
      }
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  it('opens on hover and focus, hides the default collection row, and closes on leave or Escape', async () => {
    const item = createFeedItem(42);
    const collectionsStore = useCollectionsStore();
    const savedCollection = createCollection('saved', 'Saved', true);
    const membershipPayload = {
      imageId: item.id,
      isSaved: false,
      items: [createMembership(savedCollection, false)]
    };

    collectionsStore.$patch({
      items: [savedCollection],
      membershipByImageId: {
        [item.id]: membershipPayload
      }
    });
    vi.spyOn(collectionsStore, 'fetchMembership').mockResolvedValue(membershipPayload);

    const wrapper = mount(CollectionBookmark, {
      attachTo: document.body,
      props: {
        item,
        placement: 'feed'
      },
      global: {
        stubs: {
          ResilientImage: {
            template: '<img data-test="cover" />'
          }
        }
      }
    });

    await wrapper.get('.collection-bookmark').trigger('pointerenter');
    await flushPromises();

    expect(document.body.textContent).toContain('Collections');
    expect(document.body.textContent).toContain('No collections yet');
    expect(document.body.textContent).not.toContain('Saved');

    await wrapper.get('.collection-bookmark').trigger('pointerleave');
    vi.advanceTimersByTime(200);
    await flushPromises();
    expect(document.querySelector('.collection-bookmark__popover')).toBeNull();

    await wrapper.get('.collection-bookmark').trigger('focusin');
    await flushPromises();
    expect(document.querySelector('.collection-bookmark__popover')).not.toBeNull();

    await wrapper.get('.collection-bookmark').trigger('keydown', { key: 'Escape' });
    await flushPromises();
    expect(document.querySelector('.collection-bookmark__popover')).toBeNull();

    wrapper.unmount();
  });

  it('creates a collection from the popover and keeps the default collection hidden', async () => {
    const item = createFeedItem(84);
    const collectionsStore = useCollectionsStore();
    const savedCollection = createCollection('saved', 'Saved', true);
    const travelCollection = createCollection('travel', 'Travel');
    const initialPayload = {
      imageId: item.id,
      isSaved: false,
      items: [createMembership(savedCollection, false)]
    };
    const createdPayload = {
      imageId: item.id,
      isSaved: true,
      items: [createMembership(savedCollection, true), createMembership(travelCollection, true)]
    };

    collectionsStore.$patch({
      items: [savedCollection],
      membershipByImageId: {
        [item.id]: initialPayload
      }
    });

    vi.spyOn(collectionsStore, 'fetchMembership').mockImplementation(async (_imageId, force) => {
      if (force) {
        collectionsStore.membershipByImageId[item.id] = createdPayload;
        collectionsStore.items = [savedCollection, travelCollection];
        collectionsStore.setSavedState(item.id, true);
        return createdPayload;
      }

      return collectionsStore.membershipByImageId[item.id] ?? initialPayload;
    });
    const createAndAddSpy = vi.spyOn(collectionsStore, 'createAndAdd').mockImplementation(async (name) => {
      expect(name).toBe('Travel');
      collectionsStore.items = [savedCollection, travelCollection];
      collectionsStore.membershipByImageId[item.id] = createdPayload;
      collectionsStore.setSavedState(item.id, true);
    });

    const wrapper = mount(CollectionBookmark, {
      attachTo: document.body,
      props: {
        item,
        placement: 'feed'
      },
      global: {
        stubs: {
          ResilientImage: {
            template: '<img data-test="cover" />'
          }
        }
      }
    });

    await wrapper.get('.collection-bookmark').trigger('focusin');
    await flushPromises();

    const createButton = document.body.querySelector<HTMLButtonElement>('.collection-bookmark__create-button');
    expect(createButton).not.toBeNull();
    createButton!.click();
    await flushPromises();

    const input = document.body.querySelector<HTMLInputElement>('.collection-bookmark__input');
    expect(input).not.toBeNull();
    input!.value = 'Travel';
    input!.dispatchEvent(new Event('input'));
    await flushPromises();

    const form = document.body.querySelector<HTMLFormElement>('.collection-bookmark__create');
    form!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await flushPromises();

    expect(createAndAddSpy).toHaveBeenCalledTimes(1);
    expect(document.querySelector('.collection-bookmark__popover')).toBeNull();
    expect(wrapper.get('.collection-bookmark__button').attributes('aria-label')).toBe('Remove saved post');

    wrapper.unmount();
  });

  it('keeps the popover open and shows an inline error when a custom row toggle fails', async () => {
    const item = createFeedItem(85);
    const collectionsStore = useCollectionsStore();
    const savedCollection = createCollection('saved', 'Saved', true);
    const travelCollection = createCollection('travel', 'Travel');
    const membershipPayload = {
      imageId: item.id,
      isSaved: true,
      items: [createMembership(savedCollection, true), createMembership(travelCollection, false)]
    };

    collectionsStore.$patch({
      items: [savedCollection, travelCollection],
      membershipByImageId: {
        [item.id]: membershipPayload
      }
    });

    vi.spyOn(collectionsStore, 'fetchMembership').mockResolvedValue(membershipPayload);
    vi.spyOn(collectionsStore, 'toggleCollectionMembership').mockRejectedValue(new Error('Unable to update collection'));

    const wrapper = mount(CollectionBookmark, {
      attachTo: document.body,
      props: {
        item,
        placement: 'feed'
      },
      global: {
        stubs: {
          ResilientImage: {
            template: '<img data-test="cover" />'
          }
        }
      }
    });

    await wrapper.get('.collection-bookmark').trigger('focusin');
    await flushPromises();

    const row = document.body.querySelector<HTMLButtonElement>('.collection-bookmark__row');
    expect(row).not.toBeNull();
    row!.click();
    await flushPromises();

    expect(document.querySelector('.collection-bookmark__popover')).not.toBeNull();
    expect(document.body.textContent).toContain('Unable to update collection');

    wrapper.unmount();
  });
});
