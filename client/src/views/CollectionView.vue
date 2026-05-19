<template>
  <section class="w-[min(100%,58rem)] mx-auto">
    <EmptyState
      v-if="appStore.isLibraryUnavailable"
      title="Library storage unavailable"
      :description="appStore.libraryUnavailableReason"
    />
    <ErrorState v-else-if="collectionsStore.collectionError" title="Could not load collection" :message="collectionsStore.collectionError" />
    <template v-else>
      <header class="collection-page__header" :aria-label="collectionTitle">
        <RouterLink class="collection-page__back-link" :to="{ name: 'collections' }">
          <span class="i-fluent-chevron-left-20-regular collection-page__back-icon" aria-hidden="true" />
          <span>Collections</span>
        </RouterLink>
        <div class="collection-page__title-row">
          <h1 class="collection-page__title">{{ collectionTitle }}</h1>
          <button
            v-if="canManageCurrentCollection"
            class="collection-page__menu-button"
            type="button"
            aria-label="Collection options"
            title="Collection options"
            @click="menuOpen = true"
          >
            <span class="i-fluent-more-horizontal-24-filled" aria-hidden="true" />
          </button>
        </div>
      </header>

      <EmptyState
        v-if="!collectionsStore.loadingCollection && collectionsStore.currentImages.length === 0"
        :title="`${collectionTitle} is empty`"
        :description="emptyDescription"
      />
      <div v-else-if="collectionsStore.loadingCollection && collectionsStore.currentImages.length === 0" class="card p-8 text-center">
        <p class="text-muted">Loading collection...</p>
      </div>
      <FolderGrid v-else :items="collectionsStore.currentImages" variant="posts" columns="three" />
      <InfiniteLoader
        v-if="collectionsStore.currentImages.length > 0"
        :loading="collectionsStore.loadingCollection"
        :has-more="collectionsStore.currentHasMore"
        @load-more="collectionsStore.loadCollection(slug, false)"
      />
    </template>

    <div v-if="menuOpen" class="collection-action-backdrop" @click.self="menuOpen = false">
      <div class="collection-action-sheet" role="dialog" aria-modal="true" aria-label="Collection actions">
        <button class="collection-action-sheet__item collection-action-sheet__item--danger" type="button" @click="openDeleteDialog">
          Delete collection
        </button>
        <button class="collection-action-sheet__item" type="button" @click="openEditDialog">
          Edit Collection
        </button>
        <button class="collection-action-sheet__item" type="button" @click="menuOpen = false">
          Cancel
        </button>
      </div>
    </div>

    <div v-if="editDialogOpen" class="collection-action-backdrop" @click.self="closeEditDialog">
      <section class="collection-edit-dialog" role="dialog" aria-modal="true" aria-labelledby="edit-collection-title">
        <header class="collection-edit-dialog__header">
          <h2 id="edit-collection-title">Edit collection</h2>
          <button
            class="collection-edit-dialog__close"
            type="button"
            aria-label="Close"
            title="Close"
            :disabled="editingCollection"
            @click="closeEditDialog"
          >
            <span class="i-fluent-dismiss-24-regular" aria-hidden="true" />
          </button>
        </header>
        <form class="collection-edit-dialog__form" @submit.prevent="submitRename">
          <input
            ref="editInputElement"
            v-model="editName"
            class="collection-edit-dialog__input"
            type="text"
            maxlength="80"
            :disabled="editingCollection"
          />
          <p v-if="actionError" class="collection-management-error">{{ actionError }}</p>
          <button class="collection-edit-dialog__done" type="submit" :disabled="editingCollection">
            {{ editingCollection ? 'Saving...' : 'Done' }}
          </button>
        </form>
      </section>
    </div>

    <div v-if="deleteDialogOpen" class="collection-action-backdrop" @click.self="closeDeleteDialog">
      <section class="collection-delete-dialog" role="dialog" aria-modal="true" aria-labelledby="delete-collection-title">
        <div class="collection-delete-dialog__copy">
          <h2 id="delete-collection-title">Delete collection?</h2>
          <p>When you delete this collection, the photos and videos will still be saved.</p>
        </div>
        <p v-if="actionError" class="collection-management-error collection-management-error--dialog">{{ actionError }}</p>
        <button
          class="collection-delete-dialog__action collection-delete-dialog__action--danger"
          type="button"
          :disabled="deletingCollection"
          @click="confirmDelete"
        >
          {{ deletingCollection ? 'Deleting...' : 'Delete' }}
        </button>
        <button
          class="collection-delete-dialog__action"
          type="button"
          :disabled="deletingCollection"
          @click="closeDeleteDialog"
        >
          Cancel
        </button>
      </section>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { RouterLink, useRouter } from 'vue-router';

import EmptyState from '../components/EmptyState.vue';
import ErrorState from '../components/ErrorState.vue';
import FolderGrid from '../components/FolderGrid.vue';
import InfiniteLoader from '../components/InfiniteLoader.vue';
import { useAppStore } from '../stores/app';
import { useCollectionsStore } from '../stores/collections';

const props = defineProps<{
  slug: string;
}>();

const appStore = useAppStore();
const collectionsStore = useCollectionsStore();
const router = useRouter();
const menuOpen = ref(false);
const editDialogOpen = ref(false);
const deleteDialogOpen = ref(false);
const editInputElement = ref<HTMLInputElement | null>(null);
const editName = ref('');
const actionError = ref<string | null>(null);
const editingCollection = ref(false);
const deletingCollection = ref(false);
const collectionTitle = computed(() => {
  if (!collectionsStore.currentCollection) {
    return 'Collection';
  }

  return collectionsStore.currentCollection.isDefault ? 'All Posts' : collectionsStore.currentCollection.name;
});
const emptyDescription = computed(() =>
  collectionsStore.currentCollection?.isDefault
    ? 'Use the bookmark action under any post to save it here.'
    : 'Bookmarked posts assigned to this collection will appear here.'
);
const canManageCurrentCollection = computed(() => collectionsStore.currentCollection?.isDefault === false);

async function loadCollection() {
  if (appStore.isLibraryUnavailable) {
    return;
  }

  await collectionsStore.loadCollection(props.slug, true);
}

async function openEditDialog() {
  menuOpen.value = false;
  actionError.value = null;
  editName.value = collectionsStore.currentCollection?.name ?? '';
  editDialogOpen.value = true;
  await nextTick();
  editInputElement.value?.focus();
  editInputElement.value?.select();
}

function closeEditDialog() {
  if (editingCollection.value) {
    return;
  }

  editDialogOpen.value = false;
  actionError.value = null;
}

function openDeleteDialog() {
  menuOpen.value = false;
  actionError.value = null;
  deleteDialogOpen.value = true;
}

function closeDeleteDialog() {
  if (deletingCollection.value) {
    return;
  }

  deleteDialogOpen.value = false;
  actionError.value = null;
}

async function submitRename() {
  const name = editName.value.trim();
  if (!name) {
    actionError.value = 'Collection name is required.';
    return;
  }

  editingCollection.value = true;
  actionError.value = null;

  try {
    await collectionsStore.updateCollectionName(props.slug, name);
    editDialogOpen.value = false;
  } catch (error) {
    actionError.value = error instanceof Error ? error.message : 'Unable to update collection';
  } finally {
    editingCollection.value = false;
  }
}

async function confirmDelete() {
  deletingCollection.value = true;
  actionError.value = null;

  try {
    await collectionsStore.deleteCollection(props.slug);
    deleteDialogOpen.value = false;
    await router.push({ name: 'collections' });
  } catch (error) {
    actionError.value = error instanceof Error ? error.message : 'Unable to delete collection';
  } finally {
    deletingCollection.value = false;
  }
}

onMounted(loadCollection);

watch(
  () => props.slug,
  () => {
    menuOpen.value = false;
    editDialogOpen.value = false;
    deleteDialogOpen.value = false;
    actionError.value = null;
    void loadCollection();
  }
);
</script>
