<template>
  <!-- Mobile top nav — hidden on desktop (md+) -->
  <header class="topbar hidden max-md:flex items-center justify-between gap-4 sticky top-0 z-20 px-4 py-[0.95rem] bg-bg backdrop-blur-[12px] border-b border-border">
    <RouterLink class="topbar__brand inline-flex items-center justify-center w-12 h-12 shrink-0 p-[0.3rem] rounded-[1rem] color-inherit transition-[background-color,transform] duration-180 hover:bg-surface-hover hover:-translate-y-px" to="/" aria-label="Foldergram home">
      <BrandMark />
    </RouterLink>
    <div v-if="moreMenuOpen" class="fixed inset-0 z-30" @click="closeMoreMenu" />
    <div class="relative z-40 flex min-w-0 max-w-[calc(100vw-6rem)] flex-wrap items-center justify-end gap-[0.35rem]">
      <RouterLink custom to="/" v-slot="{ href, navigate, isActive }">
        <a
          :href="href"
          class="topbar__icon-link inline-flex items-center justify-center w-11 h-12 rounded-[1rem] border-0 bg-transparent color-inherit cursor-pointer transition-colors duration-150 hover:bg-white/8"
          :class="isActive ? topbarActiveClass : ''"
          aria-label="Home"
          @click="navigate"
        >
          <span class="w-[1.45rem] h-[1.45rem]" :class="isActive ? 'i-fluent-home-16-filled' : 'i-fluent-home-16-regular'" aria-hidden="true" />
        </a>
      </RouterLink>
      <RouterLink custom :to="{ name: 'reels' }" v-slot="{ href, navigate, isActive }">
        <a
          :href="href"
          class="topbar__icon-link inline-flex items-center justify-center w-11 h-12 rounded-[1rem] border-0 bg-transparent color-inherit cursor-pointer transition-colors duration-150 hover:bg-white/8"
          :class="isActive ? topbarActiveClass : ''"
          aria-label="Reels"
          @click="navigate"
        >
          <span class="w-[1.45rem] h-[1.45rem]" :class="isActive ? 'i-fluent-play-circle-24-filled' : 'i-fluent-play-circle-24-regular'" aria-hidden="true" />
        </a>
      </RouterLink>
      <RouterLink custom :to="{ name: 'explore' }" v-slot="{ href, navigate, isActive }">
        <a
          :href="href"
          class="topbar__icon-link inline-flex items-center justify-center w-11 h-12 rounded-[1rem] border-0 bg-transparent color-inherit cursor-pointer transition-colors duration-150 hover:bg-white/8"
          :class="isActive ? topbarActiveClass : ''"
          aria-label="Search"
          @click="navigate"
        >
          <span class="w-[1.45rem] h-[1.45rem]" :class="isActive ? 'i-fluent-search-16-filled' : 'i-fluent-search-16-regular'" aria-hidden="true" />
        </a>
      </RouterLink>
      <RouterLink custom :to="{ name: 'library' }" v-slot="{ href, navigate, isActive }">
        <a
          :href="href"
          class="topbar__icon-link inline-flex items-center justify-center w-11 h-12 rounded-[1rem] border-0 bg-transparent color-inherit cursor-pointer transition-colors duration-150 hover:bg-white/8"
          :class="isActive ? topbarActiveClass : ''"
          aria-label="Library"
          @click="navigate"
        >
          <span class="w-[1.45rem] h-[1.45rem]" :class="isActive ? 'i-fluent-folder-16-filled' : 'i-fluent-folder-16-regular'" aria-hidden="true" />
        </a>
      </RouterLink>
      <RouterLink v-if="showPlacesNav" custom :to="{ name: 'places' }" v-slot="{ href, navigate, isActive }">
        <a
          :href="href"
          class="topbar__icon-link inline-flex items-center justify-center w-11 h-12 rounded-[1rem] border-0 bg-transparent color-inherit cursor-pointer transition-colors duration-150 hover:bg-white/8"
          :class="isActive || isPlacesRoute ? topbarActiveClass : ''"
          aria-label="Places"
          @click="navigate"
        >
          <span class="w-[1.45rem] h-[1.45rem]" :class="isActive || isPlacesRoute ? 'i-fluent-location-20-filled' : 'i-fluent-location-20-regular'" aria-hidden="true" />
        </a>
      </RouterLink>
      <RouterLink v-if="authStore.canUseSavedItems" custom :to="{ name: 'likes' }" v-slot="{ href, navigate, isActive }">
        <a
          :href="href"
          class="topbar__icon-link inline-flex items-center justify-center w-11 h-12 rounded-[1rem] border-0 bg-transparent color-inherit cursor-pointer transition-colors duration-150 hover:bg-white/8"
          :class="isActive ? topbarActiveClass : ''"
          :aria-label="`${likesStore.collectionLabel} (${likesStore.items.length})`"
          @click="navigate"
        >
          <span class="w-[1.45rem] h-[1.45rem]" :class="isActive ? 'i-fluent-heart-20-filled' : 'i-fluent-heart-20-regular'" aria-hidden="true" />
        </a>
      </RouterLink>
      <div class="relative">
        <button
          class="topbar__icon-link inline-flex items-center justify-center w-11 h-12 rounded-[1rem] border-0 bg-transparent color-inherit cursor-pointer transition-colors duration-150 hover:bg-white/8"
          :class="moreMenuOpen ? topbarActiveClass : ''"
          type="button"
          aria-label="More"
          aria-haspopup="menu"
          :aria-expanded="moreMenuOpen"
          @click="toggleMoreMenu"
        >
          <span class="i-fluent-line-horizontal-3-20-filled w-[1.45rem] h-[1.45rem]" aria-hidden="true" />
        </button>

        <div
          v-if="moreMenuOpen"
          class="absolute right-0 top-[calc(100%+0.45rem)] w-[18rem] overflow-hidden rounded-[1.55rem] border border-border bg-[color-mix(in_srgb,var(--surface)_96%,var(--bg)_4%)] shadow-[0_28px_70px_rgba(0,0,0,0.24)]"
        >
          <RouterLink
            v-if="authStore.canDeleteMedia"
            class="flex items-center gap-[0.95rem] px-[1.2rem] py-[1rem] text-[0.98rem] text-text transition-colors duration-150 hover:bg-surface-hover"
            :to="{ name: 'trash' }"
            @click="closeMoreMenu"
          >
            <span class="i-fluent-delete-16-regular w-[1.18rem] h-[1.18rem] shrink-0" aria-hidden="true" />
            <span>Trash</span>
          </RouterLink>

          <RouterLink v-if="authStore.canAccessSettings" custom :to="{ name: 'settings' }" v-slot="{ href, navigate, isActive }">
            <a
              :href="href"
              class="flex items-center gap-[0.95rem] px-[1.2rem] py-[1rem] text-[0.98rem] text-text transition-colors duration-150 hover:bg-surface-hover"
              @click="handleSettingsNavigate($event, navigate)"
            >
              <span
                class="w-[1.18rem] h-[1.18rem] shrink-0"
                :class="isActive ? 'i-fluent-settings-20-filled' : 'i-fluent-settings-20-regular'"
                aria-hidden="true"
              />
              <span>Settings</span>
            </a>
          </RouterLink>

          <button
            v-if="authStore.canUnlockAdmin"
            class="flex items-center gap-[0.95rem] w-full px-[1.2rem] py-[1rem] border-0 bg-transparent text-[0.98rem] text-text cursor-pointer text-left transition-colors duration-150 hover:bg-surface-hover disabled:opacity-60 disabled:cursor-wait"
            type="button"
            :disabled="authStore.loading"
            @click="handleUnlockAdmin"
          >
            <span class="i-fluent-key-16-regular w-[1.18rem] h-[1.18rem] shrink-0" aria-hidden="true" />
            <span>Unlock admin</span>
          </button>

          <button
            class="flex items-center gap-[0.95rem] w-full px-[1.2rem] py-[1rem] border-0 bg-transparent text-[0.98rem] text-text cursor-pointer text-left transition-colors duration-150 hover:bg-surface-hover"
            type="button"
            :aria-label="themeLabel"
            @click="handleAppearanceToggle"
          >
            <span
              v-if="appStore.theme === 'light'"
              class="i-fluent-weather-moon-20-regular w-[1.18rem] h-[1.18rem] shrink-0"
              aria-hidden="true"
            />
            <span
              v-else
              class="i-fluent-weather-sunny-20-regular w-[1.18rem] h-[1.18rem] shrink-0"
              aria-hidden="true"
            />
            <span>Switch appearance</span>
          </button>

          <button
            v-if="authStore.authenticated"
            class="flex items-center gap-[0.95rem] w-full px-[1.2rem] py-[1rem] border-0 bg-transparent text-[0.98rem] text-text cursor-pointer text-left transition-colors duration-150 hover:bg-surface-hover disabled:opacity-60 disabled:cursor-wait"
            type="button"
            :disabled="authStore.loading"
            @click="handleSignOut"
          >
            <span class="i-fluent-arrow-exit-20-regular w-[1.18rem] h-[1.18rem] shrink-0" aria-hidden="true" />
            <span>{{ signOutLabel }}</span>
          </button>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { RouterLink, useRoute } from 'vue-router';

import { useAppStore } from '../stores/app';
import { useAuthStore } from '../stores/auth';
import { useLikesStore } from '../stores/likes';
import { usePlacesStore } from '../stores/places';
import BrandMark from './BrandMark.vue';

const appStore = useAppStore();
const authStore = useAuthStore();
const likesStore = useLikesStore();
const placesStore = usePlacesStore();
const route = useRoute();
const moreMenuOpen = ref(false);
const themeLabel = computed(() => (appStore.theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'));
const signOutLabel = computed(() => (authStore.accessMode === 'public' ? 'Return to public view' : 'Sign out'));
const showPlacesNav = computed(() => placesStore.items.length > 0 && placesStore.listError === null);
const isPlacesRoute = computed(() => route.name === 'places' || route.name === 'place');
const topbarActiveClass = 'router-link-active bg-[rgba(255,255,255,0.08)]';

function closeMoreMenu() {
  moreMenuOpen.value = false;
}

function toggleMoreMenu() {
  moreMenuOpen.value = !moreMenuOpen.value;
}

function handleAppearanceToggle() {
  appStore.toggleTheme();
  closeMoreMenu();
}

function handleUnlockAdmin() {
  authStore.openUnlockDialog();
  closeMoreMenu();
}

function handleSettingsNavigate(event: MouseEvent, navigate: (event?: MouseEvent) => void) {
  closeMoreMenu();
  navigate(event);
}

async function handleSignOut() {
  closeMoreMenu();

  try {
    await authStore.logout();
  } catch {
    // Keep the current shell visible and let auth-store error handling surface the failure.
  }
}

function handleWindowKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    closeMoreMenu();
  }
}

watch(
  () => route.fullPath,
  () => {
    closeMoreMenu();
  }
);

onMounted(() => {
  void placesStore.fetchPlaces();
  window.addEventListener('keydown', handleWindowKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleWindowKeydown);
});
</script>
