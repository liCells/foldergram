<template>
  <div :class="modal ? 'image-view image-view--modal' : 'image-view image-view--page'" @click.stop>
    <div v-if="!modal && activeImage" class="image-view__toolbar">
      <button
        class="image-view__back-button"
        type="button"
        aria-label="Back"
        @click="handleBack"
      >
        <svg class="image-view__back-icon" viewBox="0 0 24 24" role="presentation">
          <path
            d="m15 5-7 7 7 7"
            fill="none"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="1.9"
          />
        </svg>
        <span>Back</span>
      </button>
    </div>
    <ErrorState v-if="viewerStore.error" title="Could not load post" :message="viewerStore.error" />
    <PostViewer
      v-else-if="activeImage"
      :image="activeImage"
      :folder="folder"
      :is-modal="modal"
      :deleting="viewerStore.deleting"
      @close="emit('close')"
      @delete="openDeleteDialog"
    />
    <div v-else-if="viewerStore.loading" class="card p-8 text-center">
      <p class="text-muted">Loading post...</p>
    </div>
    <ConfirmDialog
      v-if="confirmDeleteOpen"
      title="Delete this post?"
      :message="deleteDialogMessage"
      :confirm-label="deleteDialogConfirmLabel"
      :loading="viewerStore.deleting"
      @cancel="confirmDeleteOpen = false"
      @confirm="handleDelete"
    >
      <template #details>
        <label class="flex items-start gap-3 mt-3 cursor-pointer select-none">
          <input
            v-model="deleteOriginalFromDisk"
            class="mt-[0.2rem]"
            type="checkbox"
            :disabled="viewerStore.deleting"
          />
          <span class="grid gap-[0.18rem]">
            <span class="text-[0.92rem] font-semibold text-text">Also permanently delete original file from disk</span>
            <span class="text-[0.84rem] text-muted">Keep this unchecked to move the post to Trash while keeping the source file on disk.</span>
          </span>
        </label>
        <p
          v-if="deleteOriginalFromDisk"
          class="m-0 mt-3 px-3 py-[0.8rem] rounded-[0.9rem] border border-[rgba(217,48,37,0.24)] text-[0.84rem] text-[#b42318] bg-[rgba(217,48,37,0.08)]"
        >
          This will permanently delete the original file, thumbnail, and preview from disk. This action cannot be undone.
        </p>
        <p
          v-if="deleteError"
          class="m-0 mt-3 px-3 py-[0.8rem] rounded-[0.9rem] border border-[rgba(217,48,37,0.24)] text-[0.84rem] text-[#b42318] bg-[rgba(217,48,37,0.08)]"
        >
          {{ deleteError }}
        </p>
      </template>
    </ConfirmDialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import ConfirmDialog from '../components/ConfirmDialog.vue';
import ErrorState from '../components/ErrorState.vue';
import PostViewer from '../components/PostViewer.vue';
import { useAppStore } from '../stores/app';
import { useFeedStore } from '../stores/feed';
import { useLikesStore } from '../stores/likes';
import { useFoldersStore } from '../stores/folders';
import { useMomentsStore } from '../stores/moments';
import { useViewerStore } from '../stores/viewer';

const props = defineProps<{
  id: string;
  modal?: boolean;
}>();

const emit = defineEmits<{
  close: [];
}>();

const appStore = useAppStore();
const feedStore = useFeedStore();
const likesStore = useLikesStore();
const viewerStore = useViewerStore();
const foldersStore = useFoldersStore();
const momentsStore = useMomentsStore();
const route = useRoute();
const router = useRouter();
const confirmDeleteOpen = ref(false);
const deleteOriginalFromDisk = ref(false);
const deleteError = ref<string | null>(null);

const contentId = computed(() => props.id.trim());
const activeMediaType = computed(() => (route.query.tab === 'reels' ? 'video' : undefined));
const activeImage = computed(() => {
  if (!viewerStore.image) {
    return null;
  }

  const viewerContentId = viewerStore.image.contentId ?? String(viewerStore.image.id);
  return viewerContentId === contentId.value ? viewerStore.image : null;
});
const folder = computed(() =>
  activeImage.value ? foldersStore.items.find((entry) => entry.slug === activeImage.value?.folderSlug) ?? null : null
);
const deleteDialogMessage = computed(() =>
  deleteOriginalFromDisk.value
    ? 'This will permanently delete the post from the app and remove original media from disk.'
    : 'This will delete the post from the app and move it to Trash. The original file will stay on disk unless you choose permanent deletion.'
);
const deleteDialogConfirmLabel = computed(() => (deleteOriginalFromDisk.value ? 'Permanently Delete' : 'Delete'));

async function loadImage() {
  if (contentId.value.length > 0) {
    await viewerStore.loadImage(contentId.value, activeMediaType.value);
  }
}

watch(() => [contentId.value, activeMediaType.value] as const, loadImage, { immediate: true });

function navigateBack() {
  if (typeof window !== 'undefined' && window.history.length > 1) {
    router.back();
    return;
  }

  if (activeImage.value) {
    void router.replace({ name: 'folder', params: { slug: activeImage.value.folderSlug } });
    return;
  }

  void router.replace({ name: 'library' });
}

function handleBack() {
  navigateBack();
}

function handleWindowKeydown(event: KeyboardEvent) {
  if (props.modal || event.defaultPrevented) {
    return;
  }

  if (event.key !== 'Escape' || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
    return;
  }

  event.preventDefault();
  navigateBack();
}

function openDeleteDialog() {
  deleteOriginalFromDisk.value = false;
  deleteError.value = null;
  confirmDeleteOpen.value = true;
}

async function handleDelete() {
  if (!viewerStore.image) {
    return;
  }

  const currentImage = viewerStore.image;
  deleteError.value = null;

  try {
    const deleted = await viewerStore.deleteImage(currentImage.id, {
      permanent: deleteOriginalFromDisk.value
    });
    confirmDeleteOpen.value = false;
    deleteOriginalFromDisk.value = false;

    feedStore.removeImage(deleted.id);
    likesStore.removeImage(deleted.id);
    const mediaType = currentImage.mediaType === 'video' ? 'video' : 'image';
    const removedFolder = foldersStore.removeImage(deleted.id, deleted.folderSlug, mediaType);
    momentsStore.removeImage(deleted.id);
    appStore.removeIndexedImage(removedFolder ? 1 : 0, mediaType);

    if (props.modal) {
      emit('close');
      return;
    }

    if (removedFolder) {
      await router.replace({ name: 'library' });
      return;
    }

    await router.replace({ name: 'folder', params: { slug: deleted.folderSlug } });
  } catch (error) {
    deleteError.value = error instanceof Error ? error.message : 'Unable to delete post';
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleWindowKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleWindowKeydown);
});
</script>

<style scoped>
.image-view {
  width: min(100%, 72rem);
}

.image-view--modal {
  display: flex;
  justify-content: center;
  min-height: 0;
  height: 100%;
  max-height: 100%;
}

.image-view--page {
  margin: 0 auto;
}

.image-view__toolbar {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  margin-bottom: 0.9rem;
}

.image-view__back-button {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.65rem 0.95rem;
  border: 0;
  border-radius: 999px;
  background: var(--surface-alt);
  color: var(--text);
  cursor: pointer;
  font: inherit;
  font-weight: 600;
}

.image-view__back-icon {
  width: 1.1rem;
  height: 1.1rem;
}
</style>
