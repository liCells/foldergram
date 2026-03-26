import { defineStore } from 'pinia';

import { fetchReels } from '../api/gallery';
import type { FeedItem } from '../types/api';
import { resolveReelsAffinitySnapshot, type ReelsAffinitySnapshot } from '../utils/reels';
import { useAppStore } from './app';

interface ReelsState {
  items: FeedItem[];
  page: number;
  limit: number;
  hasMore: boolean;
  loading: boolean;
  error: string | null;
  initialized: boolean;
  seed: number | null;
  affinitySnapshot: ReelsAffinitySnapshot | null;
  activeReelId: number | null;
}

function createReelsSeed(): number {
  const cryptoObject = globalThis.crypto;
  if (cryptoObject?.getRandomValues) {
    return cryptoObject.getRandomValues(new Uint32Array(1))[0] ?? Math.floor(Math.random() * 2_147_483_647);
  }

  return Math.floor(Math.random() * 2_147_483_647);
}

export const useReelsStore = defineStore('reels', {
  state: (): ReelsState => ({
    items: [],
    page: 1,
    limit: 6,
    hasMore: true,
    loading: false,
    error: null,
    initialized: false,
    seed: null,
    affinitySnapshot: null,
    activeReelId: null
  }),
  getters: {
    activeItem: (state) => state.items.find((item) => item.id === state.activeReelId) ?? state.items[0] ?? null
  },
  actions: {
    ensureSeed() {
      if (this.seed !== null) {
        return this.seed;
      }

      this.seed = createReelsSeed();
      return this.seed;
    },

    setActiveReel(id: number | null) {
      this.activeReelId = id;
    },

    reset() {
      this.items = [];
      this.page = 1;
      this.hasMore = true;
      this.loading = false;
      this.error = null;
      this.initialized = false;
      this.seed = null;
      this.affinitySnapshot = null;
      this.activeReelId = null;
    },

    async loadInitial(force = false) {
      if (this.loading) {
        return;
      }

      if (this.initialized && !force) {
        return;
      }

      this.items = [];
      this.page = 1;
      this.hasMore = true;
      this.error = null;
      this.initialized = false;
      this.affinitySnapshot = force ? null : this.affinitySnapshot;
      this.activeReelId = null;
      await this.loadMore();
    },

    async loadMore() {
      if (this.loading || !this.hasMore) {
        return;
      }

      const appStore = useAppStore();
      this.affinitySnapshot = resolveReelsAffinitySnapshot(
        this.affinitySnapshot,
        appStore.lastOpenedFolderSlug,
        appStore.recentOpenedFolderSlugs
      );

      this.loading = true;
      this.error = null;

      try {
        const payload = await fetchReels(this.page, this.limit, this.ensureSeed(), {
          lastFolder: this.affinitySnapshot.lastFolder,
          recentFolders: this.affinitySnapshot.recentFolders
        });

        this.items.push(...payload.items);
        this.page += 1;
        this.hasMore = payload.hasMore;
        this.initialized = true;

        if (this.activeReelId === null && this.items.length > 0) {
          this.activeReelId = this.items[0]?.id ?? null;
        }
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Unable to load reels';
      } finally {
        this.loading = false;
      }
    },

    async prefetchIfNeeded(activeIndex: number) {
      if (activeIndex < 0 || !this.hasMore || this.loading) {
        return;
      }

      if (activeIndex >= this.items.length - 3) {
        await this.loadMore();
      }
    }
  }
});
