<template>
  <section class="grid grid-cols-[10.75rem_minmax(0,1fr)] items-start gap-x-[2.65rem] pt-[0.6rem] pb-[2.4rem] max-md:grid-cols-[9rem_minmax(0,1fr)] max-md:gap-x-[2rem] max-sm:grid-cols-1 max-sm:gap-y-[1.35rem] max-sm:pb-[1.85rem] max-sm:text-center">
    <div class="grid place-items-center">
      <button
        v-if="hasAvatarStory"
        type="button"
        class="block border-0 bg-transparent p-0 rounded-full cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text/55 focus-visible:ring-offset-4 focus-visible:ring-offset-bg"
        aria-label="Open folder stories"
        @click="emit('openAvatarStory')"
      >
        <div class="rounded-full p-[0.22rem] shadow-[0_16px_34px_rgba(246,106,61,0.12)] transition-transform duration-[180ms] hover:scale-[1.02]" style="background: var(--story-ring);">
          <div class="rounded-full bg-bg p-[0.22rem]">
            <Avatar class="w-[9.35rem] h-[9.35rem] max-md:w-[7.75rem] max-md:h-[7.75rem]" :name="folder.name" :src="folder.avatarUrl" />
          </div>
        </div>
      </button>
      <RouterLink v-else-if="folder.avatarImageId" custom :to="buildAvatarRoute(folder.avatarImageId)" v-slot="{ href, navigate }">
        <a
          :href="href"
          class="block rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text/55 focus-visible:ring-offset-4 focus-visible:ring-offset-bg"
          aria-label="Open folder avatar"
          @click="handleAvatarNavigation($event, navigate)"
        >
          <div class="rounded-full p-[0.22rem] shadow-[0_12px_24px_rgba(99,115,129,0.12)] transition-transform duration-[180ms] hover:scale-[1.02]" style="background: rgba(43, 48, 54, 0.8);">
            <div class="rounded-full bg-bg p-[0.22rem]">
              <Avatar class="w-[9.35rem] h-[9.35rem] max-md:w-[7.75rem] max-md:h-[7.75rem]" :name="folder.name" :src="folder.avatarUrl" />
            </div>
          </div>
        </a>
      </RouterLink>
      <div v-else class="rounded-full p-[0.22rem] shadow-[0_12px_24px_rgba(99,115,129,0.12)]" style="background: rgba(43, 48, 54, 0.8);">
        <div class="rounded-full bg-bg p-[0.22rem]">
          <Avatar class="w-[9.35rem] h-[9.35rem] max-md:w-[7.75rem] max-md:h-[7.75rem]" :name="folder.name" :src="folder.avatarUrl" />
        </div>
      </div>
    </div>
    <div class="grid gap-[1rem] pt-[0.35rem]">
      <div class="flex items-center gap-[0.75rem] flex-wrap max-sm:justify-center">
        <h1 class="m-0 text-[clamp(1.6rem,2.4vw,2rem)] font-medium leading-none tracking-[-0.04em]">{{ folder.name }}</h1>
        <button
          v-if="authStore.canManageLibrary"
          type="button"
          class="inline-flex items-center justify-center px-4 pt-2 pb-1.5 text-[0.75rem] font-semibold leading-none rounded-lg bg-surface-hover text-text hover:bg-border transition-colors border border-border cursor-pointer"
          @click="openProfileEditor"
        >
          Edit App Folder
        </button>
      </div>
      <p v-if="folder.breadcrumb" class="m-0 text-[0.84rem] font-medium tracking-[0.02em] text-muted">{{ folder.breadcrumb }}</p>
      <div class="flex items-center gap-[1.6rem] flex-wrap text-[0.95rem] leading-none max-sm:justify-center">
        <span><strong class="mr-[0.35rem] font-semibold">{{ folder.imageCount }}</strong>posts</span>
        <span><strong class="mr-[0.35rem] font-semibold">{{ folder.videoCount }}</strong>reels</span>
        <span v-if="folder.latestImageMtimeMs"><strong class="mr-[0.35rem] font-semibold">{{ formattedUpdatedDate }}</strong>updated</span>
      </div>
      <div class="grid max-w-[29rem] gap-[0.28rem] max-sm:max-w-none">
        <span class="text-[0.74rem] font-bold tracking-[0.1em] text-muted uppercase">Library path</span>
        <p class="m-0 font-mono text-[0.8rem] leading-[1.5] text-muted break-all">{{ folder.folderPath }}</p>
      </div>
      <div v-if="folder.description" class="max-w-[34rem] pt-[0.25rem]">
        <p class="m-0 text-[0.95rem] leading-[1.4] whitespace-pre-wrap">{{ folder.description }}</p>
      </div>
    </div>

    <Teleport to="body">
      <FolderProfileModal
        v-if="isEditingProfile"
        :initial-name="folder.name"
        :initial-description="folder.description"
        :error="profileError"
        :loading="savingProfile"
        @cancel="closeProfileEditor"
        @save="handleSaveProfile"
      />
    </Teleport>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import type { FolderSummary } from '../types/api';
import Avatar from './Avatar.vue';
import FolderProfileModal from './FolderProfileModal.vue';
import { useAppStore } from '../stores/app';
import { useAuthStore } from '../stores/auth';
import { useFoldersStore } from '../stores/folders';

const props = defineProps<{
  folder: FolderSummary;
  hasAvatarStory?: boolean;
}>();

const emit = defineEmits<{
  openAvatarStory: [];
}>();

const appStore = useAppStore();
const authStore = useAuthStore();
const foldersStore = useFoldersStore();
const route = useRoute();

const isEditingProfile = ref(false);
const savingProfile = ref(false);
const profileError = ref<string | null>(null);

const formattedUpdatedDate = computed(() =>
  props.folder.latestImageMtimeMs
    ? new Date(props.folder.latestImageMtimeMs).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    : ''
);

async function handleSaveProfile(data: { name: string; description: string | null }) {
  try {
    savingProfile.value = true;
    profileError.value = null;
    await foldersStore.updateFolderProfile(props.folder.slug, data.name, data.description);
    closeProfileEditor();
  } catch (error) {
    profileError.value = error instanceof Error ? error.message : 'Failed to update profile';
  } finally {
    savingProfile.value = false;
  }
}

function openProfileEditor() {
  profileError.value = null;
  isEditingProfile.value = true;
}

function closeProfileEditor() {
  profileError.value = null;
  isEditingProfile.value = false;
}

function buildAvatarRoute(id: number) {
  return {
    name: 'image',
    params: { id: String(id) },
    query: route.query
  };
}

function handleAvatarNavigation(event: MouseEvent, navigate: () => void) {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
    return;
  }

  event.preventDefault();
  appStore.setImageModalBackground(route.fullPath);
  navigate();
}
</script>
