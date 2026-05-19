<template>
  <section class="w-[min(100%,58rem)] mx-auto">
    <EmptyState
      v-if="appStore.isLibraryUnavailable"
      title="Library storage unavailable"
      :description="appStore.libraryUnavailableReason"
    />
    <ErrorState v-else-if="collectionsStore.error" title="Could not load collections" :message="collectionsStore.error" />
    <template v-else>
      <div v-if="collectionsStore.loading" class="card p-8 text-center">
        <p class="text-muted">Loading collections...</p>
      </div>

      <section v-else-if="collectionsStore.items.length > 0" class="grid gap-[1px] grid-cols-2 md:grid-cols-3">
        <RouterLink
          v-for="collection in collectionsStore.items"
          :key="collection.slug"
          class="group relative aspect-square overflow-hidden bg-surface-alt text-white"
          :to="{ name: 'collection', params: { slug: collection.slug } }"
        >
          <div
            v-if="showAllPostsMosaic(collection)"
            class="grid h-full w-full grid-cols-2 grid-rows-2 gap-[1px] bg-black/12"
          >
            <div
              v-for="slotIndex in 4"
              :key="`${collection.slug}-${slotIndex}`"
              class="overflow-hidden bg-[linear-gradient(135deg,#262b31_0%,#111827_100%)]"
            >
              <ResilientImage
                v-if="getPreviewImage(collection, slotIndex - 1)"
                :src="getPreviewImage(collection, slotIndex - 1)?.thumbnailUrl || ''"
                :alt="displayCollectionName(collection)"
                loading="lazy"
                class="h-full w-full object-cover transition-[transform,opacity] duration-220 group-hover:scale-[1.03] group-hover:opacity-90"
              />
            </div>
          </div>
          <ResilientImage
            v-else-if="collection.coverImage"
            :src="collection.coverImage.thumbnailUrl"
            :alt="displayCollectionName(collection)"
            loading="lazy"
            class="h-full w-full object-cover transition-[transform,opacity] duration-220 group-hover:scale-[1.03] group-hover:opacity-90"
          />
          <div v-else class="h-full w-full bg-[linear-gradient(135deg,#262b31_0%,#111827_100%)]"></div>
          <div class="absolute inset-x-0 bottom-0 grid gap-[0.15rem] px-3 py-3 bg-[linear-gradient(180deg,rgba(10,14,24,0)_0%,rgba(10,14,24,0.82)_100%)]">
            <strong class="truncate text-[0.95rem]">{{ displayCollectionName(collection) }}</strong>
            <span class="text-[0.74rem] font-semibold text-white/78">{{ formatCount(collection.itemCount) }} posts</span>
          </div>
        </RouterLink>
      </section>

      <EmptyState
        v-else
        title="No collections yet"
        description="Saved posts will appear in All Posts."
      />
    </template>
  </section>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { RouterLink } from 'vue-router';

import EmptyState from '../components/EmptyState.vue';
import ErrorState from '../components/ErrorState.vue';
import ResilientImage from '../components/ResilientImage.vue';
import { useAppStore } from '../stores/app';
import { useCollectionsStore } from '../stores/collections';
import type { CollectionSummary } from '../types/api';

const appStore = useAppStore();
const collectionsStore = useCollectionsStore();

function formatCount(value: number) {
  return new Intl.NumberFormat().format(value);
}

function displayCollectionName(collection: CollectionSummary) {
  return collection.isDefault ? 'All Posts' : collection.name;
}

function showAllPostsMosaic(collection: CollectionSummary) {
  return collection.isDefault && collection.previewImages.length > 0;
}

function getPreviewImage(collection: CollectionSummary, index: number) {
  return collection.previewImages[index] ?? null;
}

async function loadCollections() {
  if (appStore.isLibraryUnavailable) {
    return;
  }

  await collectionsStore.initialize();
}

onMounted(() => {
  void loadCollections();
});
</script>
