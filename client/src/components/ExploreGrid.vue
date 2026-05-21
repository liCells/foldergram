<template>
  <section class="explore-grid" aria-label="Explore posts">
    <RouterLink v-for="(item, index) in items" :key="item.contentId ?? item.id" custom :to="buildPostRoute(item.contentId ?? item.id)" v-slot="{ href, navigate }">
      <a
        :href="href"
        class="explore-grid__item group"
        :class="getTileClass(index)"
        @click="handleImageNavigation($event, item, navigate)"
      >
        <template v-if="item.mediaType === 'text'">
          <div class="explore-grid__text-tile">
            <div class="explore-grid__text-meta">
              <span>{{ item.textFormat === 'markdown' ? 'Markdown note' : 'Text note' }}</span>
              <strong>{{ item.filename }}</strong>
            </div>
            <p>{{ item.textContent || item.filename }}</p>
            <small>{{ item.folderName }}</small>
          </div>
        </template>
        <ResilientImage v-else :src="item.thumbnailUrl" :alt="item.filename" loading="lazy" :retry-while="appStore.isScanning" />
        <div v-if="item.mediaType === 'video'" class="absolute inset-x-0 top-0 flex items-center justify-between px-2 py-2 text-white pointer-events-none bg-[linear-gradient(180deg,rgba(10,14,24,0.72)_0%,rgba(10,14,24,0)_100%)]">
          <span class="i-fluent-play-circle-24-filled w-[1.15rem] h-[1.15rem] text-white" aria-hidden="true" />
          <span v-if="item.durationMs" class="rounded-full bg-black/55 px-[0.42rem] py-[0.12rem] text-[0.7rem] font-semibold">
            {{ formatMediaDuration(item.durationMs) }}
          </span>
        </div>
      </a>
    </RouterLink>
  </section>
</template>

<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router';

import { useAppStore } from '../stores/app';
import type { FeedItem } from '../types/api';
import { formatMediaDuration } from '../utils/media';
import ResilientImage from './ResilientImage.vue';

defineProps<{
  items: FeedItem[];
}>();

const emit = defineEmits<{
  open: [item: FeedItem];
}>();

const FEATURE_INDEXES = new Set([2, 8, 13]);

const appStore = useAppStore();
const route = useRoute();

function getTileClass(index: number): string {
  return FEATURE_INDEXES.has(index % 15) ? 'explore-grid__item--feature' : '';
}

function buildPostRoute(id: string | number) {
  return {
    name: 'image',
    params: { id: String(id) },
    query: route.query
  };
}

function handleImageNavigation(event: MouseEvent, item: FeedItem, navigate: () => void) {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
    return;
  }

  event.preventDefault();
  emit('open', item);
  appStore.setImageModalBackground(route.fullPath);
  navigate();
}
</script>

<style scoped>
.explore-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  grid-auto-flow: dense;
  gap: 0.2rem;
}

.explore-grid__item {
  position: relative;
  display: block;
  aspect-ratio: 1 / 1;
  overflow: hidden;
  background: var(--surface-alt);
}

.explore-grid__text-tile {
  display: flex;
  height: 100%;
  flex-direction: column;
  justify-content: space-between;
  gap: 0.95rem;
  padding: 0.95rem;
  background: linear-gradient(180deg, var(--surface) 0%, var(--surface-alt) 100%);
  color: var(--text);
}

.explore-grid__text-meta {
  display: grid;
  gap: 0.18rem;
}

.explore-grid__text-meta span {
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--muted);
}

.explore-grid__text-meta strong {
  font-size: 0.92rem;
  line-height: 1.25;
}

.explore-grid__text-tile p {
  display: -webkit-box;
  margin: 0;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 7;
  white-space: pre-wrap;
  line-height: 1.55;
  font-size: 0.88rem;
  color: var(--muted);
  text-wrap: pretty;
}

.explore-grid__text-tile small {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.73rem;
  color: var(--muted);
}

.explore-grid__item :deep(img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition:
    transform 0.2s ease,
    opacity 0.2s ease;
}

.explore-grid__item:hover :deep(img) {
  transform: scale(1.02);
  opacity: 0.92;
}

@media (min-width: 1080px) {
  .explore-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .explore-grid__item--feature {
    grid-column: span 2;
    grid-row: span 2;
  }
}

@media (max-width: 699px) {
  .explore-grid {
    gap: 0.15rem;
  }
}
</style>
