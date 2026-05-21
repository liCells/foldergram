<template>
  <section
    v-if="image"
    :class="['viewer relative', { 'viewer--modal': isModal }]"
    @wheel="handleWheel"
  >
    <!-- Close button (modal only) -->
    <button
      v-if="isModal"
      class="viewer__modal-close"
      type="button"
      aria-label="Close post"
      @click="$emit('close')"
    >
      <svg
        class="viewer__modal-close-icon"
        viewBox="0 0 24 24"
        role="presentation"
      >
        <path
          d="m7 7 10 10M17 7 7 17"
          fill="none"
          stroke="currentColor"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="1.8"
        />
      </svg>
    </button>

    <!-- Previous nav -->
    <RouterLink
      v-if="previousNavigationImageId"
      :class="[
        'inline-flex items-center justify-center w-[2.2rem] h-[2.2rem] rounded-full text-[#111] bg-white/88 shadow-[0_8px_20px_rgba(0,0,0,0.18)]',
        isModal
          ? 'fixed top-1/2 z-45 -translate-y-1/2 left-[5px]'
          : 'absolute top-1/2 z-2 -mt-[1.1rem] left-[-3.25rem] max-md:left-[-2.75rem]',
      ]"
      :to="{
        name: 'image',
        params: { id: String(previousNavigationImageId) },
        query: route.query,
      }"
      aria-label="Previous post"
    >
      <svg class="w-4 h-4" viewBox="0 0 24 24" role="presentation">
        <path
          d="m14.5 6.5-5 5 5 5"
          fill="none"
          stroke="currentColor"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="1.8"
        />
      </svg>
    </RouterLink>

    <!-- Next nav -->
    <RouterLink
      v-if="nextNavigationImageId"
      :class="[
        'inline-flex items-center justify-center w-[2.2rem] h-[2.2rem] rounded-full text-[#111] bg-white/88 shadow-[0_8px_20px_rgba(0,0,0,0.18)]',
        isModal
          ? 'fixed top-1/2 z-45 -translate-y-1/2 right-[5px]'
          : 'absolute top-1/2 z-2 -mt-[1.1rem] right-[-3.25rem] max-md:right-[-2.75rem]',
      ]"
      :to="{
        name: 'image',
        params: { id: String(nextNavigationImageId) },
        query: route.query,
      }"
      aria-label="Next post"
    >
      <svg class="w-4 h-4" viewBox="0 0 24 24" role="presentation">
        <path
          d="m9.5 6.5 5 5-5 5"
          fill="none"
          stroke="currentColor"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="1.8"
        />
      </svg>
    </RouterLink>

    <button
      v-if="isModalSidebarCollapsible"
      ref="sidebarToggleElement"
      class="viewer__sidebar-toggle"
      type="button"
      :aria-expanded="isSidebarExpanded"
      :aria-label="
        isSidebarExpanded ? 'Hide post details' : 'Show post details'
      "
      @click="toggleSidebar"
    >
      <span
        :class="
          isSidebarExpanded
            ? 'i-fluent-panel-left-contract-16-filled'
            : 'i-fluent-panel-left-expand-16-filled'
        "
        class="viewer__sidebar-toggle-icon"
        aria-hidden="true"
      />
    </button>

    <!-- Card -->
      <div
        ref="cardWrapperElement"
        :class="[
          'card viewer__card-wrapper',
        {
          'viewer__card-wrapper--modal': isModal,
          'viewer__card-wrapper--compact': isModalSidebarCollapsible,
        },
      ]"
    >
      <!-- Media -->
      <div
        :class="[
          'viewer__media',
          {
            'viewer__media--modal': isModal,
            'viewer__media--page': !isModal,
            'viewer__media--swipe-enabled': isModal,
          },
        ]"
        @pointercancel="handleMediaPointercancel"
        @pointerdown="handleMediaPointerdown"
        @pointermove="handleMediaPointermove"
        @pointerup="handleMediaPointerup"
      >
        <template v-if="image.mediaType === 'video'">
          <div
            class="viewer__media-shell viewer__media-shell--video viewer__media-shell--video-interactive"
            :style="mediaShellStyle"
            aria-label="Toggle playback"
            role="button"
            tabindex="0"
            @click="handleVideoSurfaceClick"
            @keydown="handleVideoSurfaceKeydown"
          >
            <media-player
              ref="playerElement"
              class="viewer__player"
              :src.prop="videoSource"
              :title.prop="image.filename"
              :fullscreenOrientation.prop="'none'"
              :playsInline.prop="true"
              :muted.prop="appStore.videoMuted"
              :loop.prop="true"
              load="eager"
              preload="metadata"
              >
                <media-provider />
              <media-poster
                class="viewer__player-poster"
                :src.prop="image.thumbnailUrl"
                :alt.prop="image.filename"
              />
              <VideoProgressFooter
                variant="viewer"
                :time-label="videoTimeLabel"
                data-swipe-ignore="true"
              >
                <template #leading>
                  <div class="viewer__player-controls-group">
                    <media-play-button
                      class="viewer__player-control"
                      aria-label="Toggle playback"
                    >
                      <span
                        class="viewer__player-control-icon viewer__player-play-icon viewer__player-play-icon--play i-fluent-play-16-filled"
                        aria-hidden="true"
                      />
                      <span
                        class="viewer__player-control-icon viewer__player-play-icon viewer__player-play-icon--pause i-fluent-pause-16-filled"
                        aria-hidden="true"
                      />
                    </media-play-button>
                  </div>
                </template>
                <template #trailing>
                  <div class="viewer__player-controls-group">
                    <media-mute-button
                      class="viewer__player-control"
                      aria-label="Toggle sound"
                    >
                      <span
                        class="viewer__player-control-icon viewer__player-mute-icon viewer__player-mute-icon--on i-fluent-speaker-2-16-regular"
                        aria-hidden="true"
                      />
                      <span
                        class="viewer__player-control-icon viewer__player-mute-icon viewer__player-mute-icon--off i-fluent-speaker-mute-16-regular"
                        aria-hidden="true"
                      />
                    </media-mute-button>
                    <button
                      v-if="showHdButton"
                      class="viewer__player-control"
                      :class="{ 'viewer__player-control--active': isPlayingHd }"
                      type="button"
                      :aria-label="
                        isPlayingHd
                          ? 'Switch to preview quality'
                          : 'Switch to HD original'
                      "
                      :aria-pressed="isPlayingHd"
                      :title="isPlayingHd ? 'Preview quality' : 'HD original'"
                      @click.stop="toggleHdSource"
                    >
                      <span
                        class="viewer__player-control-icon"
                        :class="
                          isPlayingHd
                            ? 'i-fluent-hd-16-filled'
                            : 'i-fluent-hd-16-regular'
                        "
                        aria-hidden="true"
                      />
                    </button>
                    <media-fullscreen-button
                      class="viewer__player-control"
                      aria-label="Toggle fullscreen"
                      target="media"
                    >
                      <span
                        class="viewer__player-control-icon viewer__player-fullscreen-icon viewer__player-fullscreen-icon--enter i-fluent-full-screen-maximize-16-regular"
                        aria-hidden="true"
                      />
                      <span
                        class="viewer__player-control-icon viewer__player-fullscreen-icon viewer__player-fullscreen-icon--exit i-fluent-full-screen-minimize-16-regular"
                        aria-hidden="true"
                      />
                    </media-fullscreen-button>
                  </div>
                </template>
              </VideoProgressFooter>
            </media-player>
            <div
              v-if="showVideoPausedIndicator"
              class="viewer__pause-indicator"
              aria-hidden="true"
            >
              <span class="viewer__pause-icon i-fluent-play-20-filled" />
            </div>
          </div>
        </template>
        <div
          v-else-if="image.mediaType === 'image'"
          class="viewer__media-shell viewer__media-shell--image"
          :style="mediaShellStyle"
        >
          <ResilientImage
            class="viewer__media-image"
            :src="image.previewUrl"
            :fallback-src="image.originalUrl"
            :alt="image.filename"
            :width="image.width"
            :height="image.height"
            loading="eager"
            :retry-while="appStore.isScanning"
          />
        </div>
        <div
          v-else
          class="viewer__media-shell viewer__media-shell--text"
        >
          <article class="viewer__text-card">
            <header class="viewer__text-header">
              <div class="viewer__text-kicker">
                {{ image.textFormat === 'markdown' ? 'Markdown note' : 'Text note' }}
              </div>
              <h1 class="viewer__text-title">{{ image.filename }}</h1>
              <p class="viewer__text-subtitle">
                {{ image.folderName }} · {{ formattedDate }}
              </p>
            </header>
            <div
              class="viewer__text-content prose"
              :class="{ 'viewer__text-content--collapsed': !textExpanded }"
              v-html="renderedTextContent"
            />
            <button
              v-if="shouldShowTextToggle"
              class="viewer__text-toggle"
              type="button"
              @click="textExpanded = !textExpanded"
            >
              {{ textExpanded ? 'Show less' : 'Read more' }}
            </button>
          </article>
        </div>
      </div>

      <button
        v-if="isModalSidebarOverlayVisible"
        class="viewer__drawer-backdrop"
        type="button"
        aria-label="Hide post details"
        @click="handleSidebarBackdropClick"
      />

      <!-- Sidebar -->
      <aside
        ref="sidebarElement"
        :class="[
        'viewer__sidebar',
        {
          'viewer__sidebar--modal': isModal,
            'viewer__sidebar--drawer': isModalSidebarCollapsible,
            'viewer__sidebar--drawer-open':
              isModalSidebarCollapsible && isSidebarExpanded,
            'viewer__sidebar--dragging': isSidebarSheetDragging,
          },
        ]"
        :style="sidebarSheetStyle"
        :aria-hidden="isModalSidebarCollapsible && !isSidebarExpanded"
        :inert="isModalSidebarCollapsible && !isSidebarExpanded"
        @pointercancel="handleSidebarSheetPointercancel"
        @pointerdown="handleSidebarSheetPointerdown"
        @pointermove="handleSidebarSheetPointermove"
        @pointerup="handleSidebarSheetPointerup"
      >
        <div
          v-if="isModalSidebarCollapsible"
          class="viewer__sidebar-handle"
          aria-hidden="true"
        />

        <!-- Header -->
        <div
          class="viewer__sidebar-header flex items-center justify-between gap-4 border-b border-border px-5 pt-[1.1rem] pb-4"
        >
          <RouterLink
            class="viewer__sidebar-folder-link flex items-center gap-[0.85rem] min-w-0"
            :to="{ name: 'folder', params: { slug: image.folderSlug } }"
            aria-label="Open folder"
          >
            <Avatar
              class="h-[2.65rem] w-[2.65rem]"
              :name="image.folderName"
              :src="folderAvatar"
            />
            <div class="viewer__sidebar-folder-meta min-w-0">
              <h2 class="viewer__sidebar-title m-0 text-[0.9rem] font-semibold truncate">
                {{ image.folderName }}
              </h2>
              <p class="viewer__sidebar-breadcrumb m-0 text-muted truncate">
                {{
                  folder?.breadcrumb ??
                  image.folderBreadcrumb ??
                  "Top-level source folder"
                }}
              </p>
            </div>
          </RouterLink>
          <span class="viewer__sidebar-date text-muted text-[0.78rem] whitespace-nowrap">{{
            formattedDate
          }}</span>
        </div>

        <!-- Description -->
        <div class="viewer__sidebar-summary grid gap-[0.3rem] px-5 pt-[1.1rem]">
          <p class="viewer__sidebar-caption m-0 text-text">
            <strong class="mr-[0.35rem]">{{ image.folderName }}</strong>
            {{ readableFilename }}
          </p>
          <p
            v-if="primaryTextContent.trim()"
            class="m-0 text-[0.74rem] font-semibold uppercase tracking-[0.08em] text-muted"
          >
            {{ image.mediaType === 'text' ? 'Post body' : 'Shared description' }}
          </p>
          <div
            v-if="summaryHtml"
            class="viewer__sidebar-copy"
            :class="{ 'viewer__sidebar-copy--collapsed': !summaryExpanded }"
            v-html="summaryHtml"
          />
          <button
            v-if="shouldShowSummaryToggle"
            class="viewer__text-toggle viewer__text-toggle--sidebar"
            type="button"
            @click="summaryExpanded = !summaryExpanded"
          >
            {{ summaryExpanded ? 'Show less' : 'Read more' }}
          </button>
          <p class="viewer__sidebar-path mt-3 text-muted">
            <span class="viewer__sidebar-path-label">Folder Path</span>
            <span class="viewer__sidebar-path-value">{{ image.relativePath }}</span>
          </p>
        </div>

        <!-- Quick stats -->
        <dl class="viewer__sidebar-stats m-0 px-5 pt-[0.9rem]">
          <div v-if="image.mediaType !== 'text'" class="viewer__sidebar-stat">
            <dt class="viewer__sidebar-stat-label">
              Dimensions
            </dt>
            <dd class="viewer__sidebar-stat-value m-0 text-[0.96rem] font-semibold">
              {{ image.width }} × {{ image.height }}
            </dd>
          </div>
          <div class="viewer__sidebar-stat">
            <dt class="viewer__sidebar-stat-label">
              Type
            </dt>
            <dd class="viewer__sidebar-stat-value m-0 text-[0.96rem] font-semibold">
              {{
                image.mediaType === "video"
                  ? `Video (${image.mimeType})`
                  : image.mimeType
              }}
            </dd>
          </div>
          <div
            v-if="image.mediaType === 'video' && image.durationMs"
            class="viewer__sidebar-stat"
          >
            <dt class="viewer__sidebar-stat-label">
              Duration
            </dt>
            <dd class="viewer__sidebar-stat-value m-0 text-[0.96rem] font-semibold">
              {{ formattedDuration }}
            </dd>
          </div>
          <div class="viewer__sidebar-stat">
            <dt class="viewer__sidebar-stat-label">
              Size
            </dt>
            <dd class="viewer__sidebar-stat-value m-0 text-[0.96rem] font-semibold">{{ fileSize }}</dd>
          </div>
          <div
            v-if="image.place"
            class="viewer__sidebar-stat"
          >
            <dt class="viewer__sidebar-stat-label">
              Place
            </dt>
            <dd class="viewer__sidebar-stat-value m-0 text-[0.96rem] font-semibold">
              <RouterLink
                class="text-inherit no-underline hover:text-muted"
                :to="{ name: 'place', params: { slug: image.place.slug } }"
              >
                {{ image.place.name }}
              </RouterLink>
            </dd>
          </div>
        </dl>

        <!-- Metadata -->
        <dl
          v-if="image.mediaType !== 'text' && exifDetails.length > 0"
          class="viewer__sidebar-metadata m-0 px-5 pt-[0.75rem]"
        >
          <div
            v-for="detail in exifDetails"
            :key="detail.label"
            class="viewer__sidebar-metadata-item"
          >
            <dt class="viewer__sidebar-metadata-label">
              {{ detail.label }}
            </dt>
            <dd class="viewer__sidebar-metadata-value m-0 text-[0.96rem] font-semibold break-words">
              {{ detail.value }}
            </dd>
          </div>
        </dl>

        <!-- Actions -->
        <div
          class="viewer__sidebar-actions flex items-center justify-between gap-3 px-5 pt-[0.7rem] pb-5 mt-auto"
        >
          <div class="viewer__sidebar-actions-group flex items-center gap-[0.55rem]">
            <!-- Like -->
            <button
              v-if="authStore.canUseSavedItems && image.mediaType !== 'text'"
              class="viewer__sidebar-action inline-flex items-center justify-center p-0 border-0 bg-transparent cursor-pointer transition-[opacity,transform,color] duration-180 hover:opacity-72 hover:-translate-y-px disabled:opacity-45 disabled:cursor-wait disabled:transform-none"
              :class="{ 'text-[#e5484d]': likesStore.isLiked(image.id) }"
              type="button"
              :aria-label="likesStore.toggleAriaLabel(likesStore.isLiked(image.id))"
              :aria-pressed="likesStore.isLiked(image.id)"
              :disabled="likesStore.isPending(image.id)"
              @click="likesStore.toggleLike(image)"
            >
              <span
                class="w-[1.55rem] h-[1.55rem]"
                :class="
                  likesStore.isLiked(image.id)
                    ? 'i-fluent-heart-20-filled'
                    : 'i-fluent-heart-20-regular'
                "
                aria-hidden="true"
              />
            </button>
            <CollectionBookmark
              v-if="image.mediaType !== 'text'"
              :item="image"
              placement="viewer"
            />
          </div>

          <div class="viewer__sidebar-actions-group flex items-center gap-[0.55rem]">
            <!-- Set as cover -->
            <button
              v-if="authStore.canManageLibrary && image.mediaType !== 'text'"
              class="viewer__sidebar-action inline-flex items-center justify-center p-0 border-0 bg-transparent cursor-pointer text-text transition-[opacity,transform] duration-180 hover:opacity-72 hover:-translate-y-px disabled:opacity-45 disabled:cursor-wait disabled:transform-none"
              type="button"
              aria-label="Set as folder cover"
              title="Set as folder cover"
              :disabled="settingCover || isCurrentCover"
              @click="handleSetCover"
            >
              <span :class="[isCurrentCover ? 'i-fluent-folder-add-20-filled text-accent' : 'i-fluent-folder-add-20-regular', 'w-[1.5rem] h-[1.5rem]']" aria-hidden="true" />
            </button>
            <!-- Download original -->
            <a
              class="viewer__sidebar-action inline-flex items-center justify-center p-0 border-0 bg-transparent cursor-pointer text-text transition-[opacity,transform] duration-180 hover:opacity-72 hover:-translate-y-px"
              :href="downloadOriginalMediaUrl"
              download
              aria-label="Download original file"
              title="Download original file"
            >
              <svg
                class="w-[1.55rem] h-[1.55rem]"
                viewBox="0 0 24 24"
                role="presentation"
              >
                <path
                  d="M12 4.75v9.5m0 0 3.5-3.5M12 14.25l-3.5-3.5M5.75 16.75v1.5A1.75 1.75 0 0 0 7.5 20h9a1.75 1.75 0 0 0 1.75-1.75v-1.5"
                  fill="none"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1.4"
                />
              </svg>
            </a>
            <!-- Open original -->
            <a
              class="viewer__sidebar-action inline-flex items-center justify-center p-0 border-0 bg-transparent cursor-pointer text-text transition-[opacity,transform] duration-180 hover:opacity-72 hover:-translate-y-px"
              :href="originalMediaUrl"
              target="_blank"
              rel="noreferrer"
              aria-label="Open original file"
              title="Open original file"
            >
              <svg
                class="w-[1.55rem] h-[1.55rem]"
                viewBox="0 0 24 24"
                role="presentation"
              >
                <path
                  d="M11 7H6a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-5"
                  fill="none"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1"
                />
                <path
                  d="M10 14L20 4"
                  fill="none"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1"
                />
                <path
                  d="M15 4h5v5"
                  fill="none"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1"
                />
              </svg>
            </a>
            <!-- Delete -->
            <button
              v-if="authStore.canDeleteMedia && image.mediaType !== 'text'"
              class="viewer__sidebar-action inline-flex items-center justify-center p-0 border-0 bg-transparent cursor-pointer text-[#d93025] transition-[opacity,transform] duration-180 hover:opacity-72 hover:-translate-y-px disabled:opacity-45 disabled:cursor-wait disabled:transform-none"
              type="button"
              aria-label="Delete post"
              :disabled="deleting"
              @click="$emit('delete')"
            >
              <svg
                class="w-[1.38rem] h-[1.38rem]"
                viewBox="0 0 32 32"
                role="presentation"
              >
                <path d="M12 12h2v12h-2z" fill="currentColor" />
                <path d="M18 12h2v12h-2z" fill="currentColor" />
                <path
                  d="M4 6v2h2v20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8h2V6zm4 22V8h16v20z"
                  fill="currentColor"
                />
                <path d="M12 2h8v2h-8z" fill="currentColor" />
              </svg>
            </button>
          </div>
        </div>
      </aside>
    </div>
  </section>
</template>

<script setup lang="ts">
  import "vidstack/bundle"

  import { marked } from "marked"
  import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue"
  import { RouterLink, useRoute, useRouter } from "vue-router"
  import type { PlayerSrc } from "vidstack"
  import type { MediaPlayerElement } from "vidstack/elements"

  import { useHorizontalSwipe } from "../composables/useHorizontalSwipe"
  import type { ImageDetail, FolderSummary } from "../types/api"
  import { useAppStore } from "../stores/app"
  import { useAuthStore } from "../stores/auth"
  import { useLikesStore } from "../stores/likes"
  import { useFoldersStore } from "../stores/folders"
  import { getOriginalMediaDownloadUrl, getOriginalMediaUrl } from "../utils/original-media"
  import Avatar from "./Avatar.vue"
  import CollectionBookmark from "./CollectionBookmark.vue"
  import ResilientImage from "./ResilientImage.vue"
  import VideoProgressFooter from "./VideoProgressFooter.vue"
  import { formatMediaDuration, formatVideoTimestamp, videoPreviewWouldDownscale } from "../utils/media"

  const props = defineProps<{
    image: ImageDetail | null
    folder?: FolderSummary | null
    isModal?: boolean
    deleting?: boolean
  }>()

  defineEmits<{
    close: []
    delete: []
  }>()

  const likesStore = useLikesStore()
  const appStore = useAppStore()
  const authStore = useAuthStore()
  const foldersStore = useFoldersStore()
  const route = useRoute()
  const router = useRouter()
  const playerElement = ref<MediaPlayerElement | null>(null)
  const cardWrapperElement = ref<HTMLElement | null>(null)
  const sidebarElement = ref<HTMLElement | null>(null)
  const sidebarToggleElement = ref<HTMLButtonElement | null>(null)
  const wheelDeltaAccumulator = ref(0)
  const navigationLockedUntil = ref(0)
  const isSidebarCollapsible = ref(false)
  const isSidebarExpanded = ref(true)
  const isSidebarSheetDragging = ref(false)
  const isPlayingHd = ref(false)
  const isVideoPaused = ref(false)
  const videoDurationMs = ref(props.image?.durationMs ?? 0)
  const videoCurrentTimeMs = ref(0)
  const sidebarSheetDragOffset = ref(0)
  const settingCover = ref(false)
  const textExpanded = ref(false)
  const summaryExpanded = ref(false)

  const WHEEL_NAVIGATION_THRESHOLD = 72
  const NAVIGATION_COOLDOWN_MS = 320
  const originalMediaUrl = computed(() => (props.image ? getOriginalMediaUrl(props.image.contentId ?? props.image.id) : ""))
  const downloadOriginalMediaUrl = computed(() => (props.image ? getOriginalMediaDownloadUrl(props.image.contentId ?? props.image.id) : ""))
  const MODAL_SIDEBAR_COLLAPSE_BREAKPOINT = 960
  const SHEET_SWIPE_MIN_DISTANCE = 56
  const SHEET_SWIPE_MAX_HORIZONTAL_DISTANCE = 96
  const SHEET_SWIPE_MIN_VERTICAL_RATIO = 1.15
  const SHEET_MAX_DRAG_OFFSET = 240

  type MetadataDetail = {
    label: string
    value: string
  }

  function renderRichText(source: string, format: ImageDetail["textFormat"]) {
    const rawHtml = format === "markdown" ? marked.parse(source) : source
      .split(/\n{2,}/)
      .map(block => `<p>${block.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br />")}</p>`)
      .join("")

    return String(rawHtml)
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
      .replace(/\son\w+="[^"]*"/gi, "")
      .replace(/\son\w+='[^']*'/gi, "")
      .replace(/javascript:/gi, "")
  }

  let videoMuteSyncToken = 0
  let playerReady = false
  let pendingVideoRestore: { currentTime: number; wasPaused: boolean } | null = null
  let removePlayerEventListeners: (() => void) | null = null
  let sidebarSheetPointerId: number | null = null
  let sidebarSheetCapturedElement: Element | null = null
  let sidebarSheetStartX = 0
  let sidebarSheetStartY = 0
  let sidebarSheetStartScrollTop = 0
  let mediaSheetRevealPointerId: number | null = null
  let mediaSheetRevealCapturedElement: Element | null = null
  let mediaSheetRevealStartX = 0
  let mediaSheetRevealStartY = 0

  const fileSize = computed(() => {
    if (!props.image) {
      return ""
    }

    const megabytes = props.image.fileSize / (1024 * 1024)
    return `${megabytes.toFixed(2)} MB`
  })

  const showHdButton = computed(
    () =>
      props.image?.mediaType === 'video' &&
      props.image?.playbackStrategy === 'original' &&
      videoPreviewWouldDownscale(props.image.width, props.image.height),
  )
  const showVideoPausedIndicator = computed(
    () => props.image?.mediaType === 'video' && isVideoPaused.value,
  )
  const videoTimeLabel = computed(() =>
    formatVideoTimestamp(
      videoDurationMs.value > 0 ? videoDurationMs.value : props.image?.durationMs,
      videoCurrentTimeMs.value,
    ),
  )

  const videoSrc = computed(() => {
    if (!props.image || props.image.mediaType !== 'video') {
      return props.image?.previewUrl ?? ''
    }

    if (isPlayingHd.value && props.image.originalUrl) {
      return props.image.originalUrl
    }

    return props.image.previewUrl
  })
  const videoSource = computed<PlayerSrc>(() => {
    if (!props.image || props.image.mediaType !== "video") {
      return { src: props.image?.previewUrl ?? "", type: "video/mp4" }
    }

    return {
      src: videoSrc.value,
      type: "video/mp4",
    }
  })
  const mediaShellStyle = computed(() => {
    if (!props.image) {
      return undefined
    }

    if (props.image.mediaType === "text") {
      return {
        "--viewer-media-aspect-ratio": "4 / 5",
        "--viewer-media-intrinsic-width": "720px",
      }
    }

    return {
      "--viewer-media-aspect-ratio": `${props.image.width} / ${props.image.height}`,
      "--viewer-media-intrinsic-width": `${props.image.width}px`,
    }
  })

  const locallySetCover = ref(false)

  const isCurrentCover = computed(() => {
    if (locallySetCover.value) return true;
    if (!props.image) return false;

    if ('folderAvatarImageId' in props.image && typeof props.image.folderAvatarImageId === 'number') {
      return props.image.id === props.image.folderAvatarImageId;
    }

    if (foldersStore.currentFolder?.avatarUrl) {
      return foldersStore.currentFolder.avatarUrl.includes(`/api/images/${props.image.id}/`);
    }

    return false;
  })

  const folderAvatar = computed(() => props.folder?.avatarUrl ?? null)
  const readableFilename = computed(() =>
    props.image
      ? (props.image.mediaType === "text"
          ? props.image.filename
          : props.image.filename
          .replace(/\.[^.]+$/, "")
          .replace(/[_-]+/g, " ")
          .replace(/\s+/g, " ")
          .trim())
      : "",
  )
  const formattedDate = computed(() =>
    props.image
      ? new Date(
          props.image.takenAt ?? props.image.sortTimestamp,
        ).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "",
  )
  const formattedDuration = computed(() =>
    formatMediaDuration(props.image?.durationMs),
  )
  const primaryTextContent = computed(() => {
    if (!props.image) {
      return ""
    }

    if (props.image.mediaType === "text") {
      return props.image.textContent ?? ""
    }

    return props.image.sharedDescription ?? ""
  })
  const primaryTextFormat = computed(() =>
    props.image?.mediaType === "text"
      ? props.image.textFormat ?? "plain"
      : props.image?.sharedDescriptionFormat ?? "plain",
  )
  const renderedTextContent = computed(() => renderRichText(primaryTextContent.value, primaryTextFormat.value))
  const shouldShowTextToggle = computed(() => primaryTextContent.value.trim().length > 520)
  const summaryHtml = computed(() => {
    if (!primaryTextContent.value.trim()) {
      return ""
    }

    return renderRichText(primaryTextContent.value, primaryTextFormat.value)
  })
  const shouldShowSummaryToggle = computed(() => primaryTextContent.value.trim().length > 260)
  const exifDetails = computed<MetadataDetail[]>(() => {
    const exif = props.image?.exif
    if (!exif) {
      return []
    }

    const details: MetadataDetail[] = []
    const location = formatLocation(
      exif.latitude,
      exif.longitude,
      exif.altitudeMeters,
    )
    const camera = formatCameraLabel(exif.cameraMake, exif.cameraModel)
    const aperture =
      typeof exif.fNumber === "number" && Number.isFinite(exif.fNumber)
        ? `f/${formatExifNumber(exif.fNumber, 2)}`
        : null
    const shutter = formatExposureTime(exif.exposureTimeSeconds)
    const iso =
      typeof exif.iso === "number" && Number.isFinite(exif.iso)
        ? formatExifNumber(exif.iso, 0)
        : null
    const focalLength = formatFocalLength(
      exif.focalLengthMm,
      exif.focalLength35mmMm,
    )

    if (location) {
      details.push({
        label: "Location",
        value: location,
      })
    }

    if (camera) {
      details.push({
        label: "Camera",
        value: camera,
      })
    }

    if (exif.lensModel) {
      details.push({
        label: "Lens",
        value: exif.lensModel,
      })
    }

    if (aperture) {
      details.push({
        label: "Aperture",
        value: aperture,
      })
    }

    if (shutter) {
      details.push({
        label: "Shutter",
        value: shutter,
      })
    }

    if (iso) {
      details.push({
        label: "ISO",
        value: iso,
      })
    }

    if (focalLength) {
      details.push({
        label: "Focal length",
        value: focalLength,
      })
    }

    return details
  })
  const isModalSidebarCollapsible = computed(
    () => props.isModal === true && isSidebarCollapsible.value,
  )
  const isLikesNavigationContext = computed(() => {
    if (props.isModal !== true || !appStore.imageModalBackgroundPath) {
      return false
    }

    return router.resolve(appStore.imageModalBackgroundPath).name === "likes"
  })
  const likesNavigationIds = computed(() => {
    if (!props.image || !isLikesNavigationContext.value) {
      return null
    }

    const currentIndex = likesStore.items.findIndex(
      item => item.id === props.image?.id,
    )
    if (currentIndex === -1) {
      return null
    }

    return {
      previousImageId: likesStore.items[currentIndex - 1]?.id ?? null,
      nextImageId: likesStore.items[currentIndex + 1]?.id ?? null,
    }
  })
  const previousNavigationImageId = computed(
    () => likesNavigationIds.value?.previousImageId ?? props.image?.previousImageId ?? null,
  )
  const nextNavigationImageId = computed(
    () => likesNavigationIds.value?.nextImageId ?? props.image?.nextImageId ?? null,
  )
  const isModalSidebarOverlayVisible = computed(
    () => isModalSidebarCollapsible.value && isSidebarExpanded.value,
  )
  const sidebarSheetStyle = computed(() =>
    isModalSidebarCollapsible.value
      ? {
          "--viewer-sidebar-drag-offset": `${sidebarSheetDragOffset.value}px`,
        }
      : undefined,
  )
  const swipeNavigation = useHorizontalSwipe({
    canStart: canStartSwipeNavigation,
    isEnabled: () => props.isModal === true && props.image !== null,
    onSwipeLeft: () => {
      wheelDeltaAccumulator.value = 0
      void navigateByDirection("next")
    },
    onSwipeRight: () => {
      wheelDeltaAccumulator.value = 0
      void navigateByDirection("previous")
    },
  })

  function syncVideoMuted(player: MediaPlayerElement, muted: boolean) {
    const token = ++videoMuteSyncToken
    player.muted = muted

    requestAnimationFrame(() => {
      if (videoMuteSyncToken === token) {
        videoMuteSyncToken = 0
      }
    })
  }

  function isPrimaryPlainClick(event: MouseEvent) {
    return (
      !event.defaultPrevented &&
      event.button === 0 &&
      !event.metaKey &&
      !event.ctrlKey &&
      !event.shiftKey &&
      !event.altKey
    )
  }

  function isPlayerInteractiveTarget(target: EventTarget | null) {
    return target instanceof HTMLElement && Boolean(
      target.closest(
        [
          "a",
          "button",
          "input",
          "select",
          "textarea",
          "label",
          "media-play-button",
          "media-mute-button",
          "media-fullscreen-button",
          "media-time-slider",
        ].join(", "),
      ),
    )
  }

  function syncVideoTimelineState(player: MediaPlayerElement | null = playerElement.value) {
    if (!player) {
      return
    }

    if (Number.isFinite(player.duration) && player.duration > 0) {
      videoDurationMs.value = player.duration * 1000
    }

    if (Number.isFinite(player.currentTime) && player.currentTime >= 0) {
      videoCurrentTimeMs.value = player.currentTime * 1000
    }
  }

  function formatExifNumber(
    value: number | null | undefined,
    maximumFractionDigits = 1,
  ) {
    if (typeof value !== "number" || !Number.isFinite(value)) {
      return null
    }

    return new Intl.NumberFormat(undefined, {
      maximumFractionDigits,
    }).format(value)
  }

  function formatCameraLabel(
    make: string | null | undefined,
    model: string | null | undefined,
  ) {
    if (make && model) {
      return model.toLowerCase().startsWith(make.toLowerCase())
        ? model
        : `${make} ${model}`
    }

    return make ?? model ?? null
  }

  function formatExposureTime(seconds: number | null | undefined) {
    if (typeof seconds !== "number" || !Number.isFinite(seconds) || seconds <= 0) {
      return null
    }

    if (seconds >= 1) {
      return `${formatExifNumber(seconds, seconds >= 10 ? 0 : 1)} s`
    }

    const reciprocal = Math.round(1 / seconds)
    if (
      reciprocal > 1 &&
      Math.abs(1 / reciprocal - seconds) <= Math.max(seconds * 0.08, 0.0005)
    ) {
      return `1/${reciprocal} s`
    }

    return `${formatExifNumber(seconds, 3)} s`
  }

  function formatFocalLength(
    focalLengthMm: number | null | undefined,
    focalLength35mmMm: number | null | undefined,
  ) {
    const focalLength = formatExifNumber(focalLengthMm, 2)
    const focalLength35mm = formatExifNumber(focalLength35mmMm, 0)

    if (focalLength && focalLength35mm) {
      return `${focalLength} mm (${focalLength35mm} mm equiv.)`
    }

    if (focalLength) {
      return `${focalLength} mm`
    }

    if (focalLength35mm) {
      return `${focalLength35mm} mm equiv.`
    }

    return null
  }

  function formatLocation(
    latitude: number | null | undefined,
    longitude: number | null | undefined,
    altitudeMeters: number | null | undefined,
  ) {
    if (
      typeof latitude !== "number" ||
      !Number.isFinite(latitude) ||
      typeof longitude !== "number" ||
      !Number.isFinite(longitude)
    ) {
      return null
    }

    const coordinates = `${formatExifNumber(latitude, 5)}, ${formatExifNumber(
      longitude,
      5,
    )}`
    const altitude = formatExifNumber(altitudeMeters, 1)

    return altitude ? `${coordinates} (alt ${altitude} m)` : coordinates
  }

  function focusSidebarToggle(force = false) {
    if (!force) {
      const activeElement = document.activeElement
      if (
        !sidebarElement.value ||
        !(activeElement instanceof Node) ||
        !sidebarElement.value.contains(activeElement)
      ) {
        return
      }
    }

    void nextTick(() => {
      sidebarToggleElement.value?.focus()
    })
  }

  function releaseCapturedPointer(
    capturedElement: Element | null,
    pointerId: number | null,
  ) {
    if (!capturedElement || pointerId === null || !("releasePointerCapture" in capturedElement)) {
      return
    }

    try {
      capturedElement.releasePointerCapture(pointerId)
    } catch {
      // Ignore failures if the pointer has already been released.
    }
  }

  function isGestureIgnoredTarget(target: EventTarget | null) {
    if (!(target instanceof Element)) {
      return false
    }

    return Boolean(
      target.closest(
        [
          '[data-swipe-ignore="true"]',
          '[data-sheet-swipe-ignore="true"]',
          "button",
          "a",
          "input",
          "select",
          "textarea",
          "label",
          '[role="button"]',
          '[role="link"]',
        ].join(", "),
      ),
    )
  }

  function resetSidebarSheetGesture() {
    releaseCapturedPointer(sidebarSheetCapturedElement, sidebarSheetPointerId)
    sidebarSheetPointerId = null
    sidebarSheetCapturedElement = null
    sidebarSheetStartX = 0
    sidebarSheetStartY = 0
    sidebarSheetStartScrollTop = 0
    sidebarSheetDragOffset.value = 0
    isSidebarSheetDragging.value = false
  }

  function resetMediaSheetRevealGesture() {
    releaseCapturedPointer(
      mediaSheetRevealCapturedElement,
      mediaSheetRevealPointerId,
    )
    mediaSheetRevealPointerId = null
    mediaSheetRevealCapturedElement = null
    mediaSheetRevealStartX = 0
    mediaSheetRevealStartY = 0
  }

  function updateSidebarLayout() {
    resetSidebarSheetGesture()
    resetMediaSheetRevealGesture()

    if (!props.isModal) {
      isSidebarCollapsible.value = false
      isSidebarExpanded.value = true
      return
    }

    const nextCollapsible = window.innerWidth <= MODAL_SIDEBAR_COLLAPSE_BREAKPOINT
    const wasCollapsible = isSidebarCollapsible.value

    isSidebarCollapsible.value = nextCollapsible

    if (!nextCollapsible) {
      isSidebarExpanded.value = true
      return
    }

    if (!wasCollapsible) {
      focusSidebarToggle()
      isSidebarExpanded.value = false
    }
  }

  function openSidebar() {
    if (!isModalSidebarCollapsible.value) {
      return
    }

    resetSidebarSheetGesture()
    isSidebarExpanded.value = true
  }

  function toggleSidebar() {
    if (!isModalSidebarCollapsible.value) {
      return
    }

    if (isSidebarExpanded.value) {
      closeSidebar()
      return
    }

    openSidebar()
  }

  function closeSidebar(options: { restoreFocus?: boolean } = {}) {
    if (!isModalSidebarCollapsible.value) {
      return
    }

    resetSidebarSheetGesture()
    isSidebarExpanded.value = false

    if (options.restoreFocus !== false) {
      focusSidebarToggle(true)
    }
  }

  function handleSidebarBackdropClick() {
    closeSidebar()
  }

  function handleMediaPointerdown(event: PointerEvent) {
    swipeNavigation.onPointerdown(event)
    handleMediaSheetRevealPointerdown(event)
  }

  function handleMediaPointermove(event: PointerEvent) {
    swipeNavigation.onPointermove(event)
    handleMediaSheetRevealPointermove(event)
  }

  async function handleMediaPointerup(event: PointerEvent) {
    await swipeNavigation.onPointerup(event)
    await handleMediaSheetRevealPointerup(event)
  }

  function handleMediaPointercancel(event: PointerEvent) {
    swipeNavigation.onPointercancel()
    handleMediaSheetRevealPointercancel(event)
  }

  function handleMediaSheetRevealPointerdown(event: PointerEvent) {
    if (
      !event.isPrimary ||
      event.pointerType === "mouse" ||
      !isModalSidebarCollapsible.value ||
      isSidebarExpanded.value ||
      Date.now() < navigationLockedUntil.value ||
      isGestureIgnoredTarget(event.target)
    ) {
      return
    }

    mediaSheetRevealPointerId = event.pointerId
    mediaSheetRevealStartX = event.clientX
    mediaSheetRevealStartY = event.clientY

    if (event.currentTarget instanceof Element && "setPointerCapture" in event.currentTarget) {
      try {
        event.currentTarget.setPointerCapture(event.pointerId)
        mediaSheetRevealCapturedElement = event.currentTarget
      } catch {
        mediaSheetRevealCapturedElement = null
      }
    }
  }

  function handleMediaSheetRevealPointermove(event: PointerEvent) {
    if (event.pointerId !== mediaSheetRevealPointerId) {
      return
    }

    const deltaX = Math.abs(event.clientX - mediaSheetRevealStartX)
    const deltaY = mediaSheetRevealStartY - event.clientY

    if (deltaY > 10 && deltaY > deltaX) {
      event.preventDefault()
    }
  }

  async function handleMediaSheetRevealPointerup(event: PointerEvent) {
    if (event.pointerId !== mediaSheetRevealPointerId) {
      return
    }

    const deltaX = event.clientX - mediaSheetRevealStartX
    const deltaY = event.clientY - mediaSheetRevealStartY

    resetMediaSheetRevealGesture()

    if (-deltaY < SHEET_SWIPE_MIN_DISTANCE) {
      return
    }

    if (Math.abs(deltaX) > SHEET_SWIPE_MAX_HORIZONTAL_DISTANCE) {
      return
    }

    if (Math.abs(deltaY) <= Math.abs(deltaX) * SHEET_SWIPE_MIN_VERTICAL_RATIO) {
      return
    }

    openSidebar()
  }

  function handleMediaSheetRevealPointercancel(_event: PointerEvent) {
    resetMediaSheetRevealGesture()
  }

  function handleSidebarSheetPointerdown(event: PointerEvent) {
    if (
      !event.isPrimary ||
      event.pointerType === "mouse" ||
      !isModalSidebarCollapsible.value ||
      !isSidebarExpanded.value ||
      isGestureIgnoredTarget(event.target)
    ) {
      return
    }

    sidebarSheetPointerId = event.pointerId
    sidebarSheetStartX = event.clientX
    sidebarSheetStartY = event.clientY
    sidebarSheetStartScrollTop = sidebarElement.value?.scrollTop ?? 0

    if (event.currentTarget instanceof Element && "setPointerCapture" in event.currentTarget) {
      try {
        event.currentTarget.setPointerCapture(event.pointerId)
        sidebarSheetCapturedElement = event.currentTarget
      } catch {
        sidebarSheetCapturedElement = null
      }
    }
  }

  function handleSidebarSheetPointermove(event: PointerEvent) {
    if (event.pointerId !== sidebarSheetPointerId) {
      return
    }

    const sidebar = sidebarElement.value
    if (!sidebar || sidebarSheetStartScrollTop > 0 || sidebar.scrollTop > 0) {
      return
    }

    const deltaX = event.clientX - sidebarSheetStartX
    const deltaY = event.clientY - sidebarSheetStartY

    if (deltaY <= 0) {
      if (isSidebarSheetDragging.value) {
        sidebarSheetDragOffset.value = 0
      }
      return
    }

    if (deltaY > 10 && deltaY > Math.abs(deltaX)) {
      event.preventDefault()
      isSidebarSheetDragging.value = true
      sidebarSheetDragOffset.value = Math.min(deltaY, SHEET_MAX_DRAG_OFFSET)
    }
  }

  function handleSidebarSheetPointerup(event: PointerEvent) {
    if (event.pointerId !== sidebarSheetPointerId) {
      return
    }

    const deltaX = event.clientX - sidebarSheetStartX
    const deltaY = event.clientY - sidebarSheetStartY
    const shouldClose =
      isSidebarSheetDragging.value &&
      deltaY >= SHEET_SWIPE_MIN_DISTANCE &&
      deltaY > Math.abs(deltaX) * SHEET_SWIPE_MIN_VERTICAL_RATIO

    resetSidebarSheetGesture()

    if (shouldClose) {
      closeSidebar({ restoreFocus: false })
    }
  }

  function handleSidebarSheetPointercancel(_event: PointerEvent) {
    resetSidebarSheetGesture()
  }

  function canStartSwipeNavigation(event: PointerEvent) {
    if (Date.now() < navigationLockedUntil.value) {
      return false
    }

    const target = event.target
    return !isGestureIgnoredTarget(target)
  }

  async function attemptVideoPlayback(): Promise<void> {
    if (props.image?.mediaType !== "video") {
      return
    }

    await nextTick()
    const player = playerElement.value
    if (!player) {
      return
    }

    syncVideoMuted(player, appStore.videoMuted)

    try {
      await player.play()
      isVideoPaused.value = false
      return
    } catch {
      if (appStore.videoMuted) {
        // Ignore autoplay rejections and leave manual controls available.
        isVideoPaused.value = true
        return
      }
    }

    syncVideoMuted(player, true)

    try {
      await player.play()
      isVideoPaused.value = false
    } catch {
      // Ignore autoplay rejections and leave manual controls available.
      isVideoPaused.value = true
    }
  }

  async function resumeVideoPlayback() {
    const player = playerElement.value
    if (!player || props.image?.mediaType !== "video") {
      return
    }

    syncVideoMuted(player, appStore.videoMuted)

    try {
      await player.play()
      isVideoPaused.value = false
    } catch {
      // Ignore playback rejections and leave manual controls available.
    }
  }

  function handlePlayerVolumeChange() {
    const player = playerElement.value
    // Ignore volume-change events that fire before the player has fully initialized.
    // Vidstack can emit these during its own setup with muted=false, which would
    // overwrite the persisted muted preference read from localStorage.
    if (!player || !playerReady || videoMuteSyncToken !== 0) {
      return
    }

    if (player.muted !== appStore.videoMuted) {
      appStore.setVideoMuted(player.muted)
    }
  }

  function toggleHdSource() {
    const player = playerElement.value
    const image = props.image
    if (!player || !image || image.mediaType !== 'video') {
      return
    }

    const savedTime = player.currentTime
    pendingVideoRestore = {
      currentTime: savedTime,
      wasPaused: player.paused
    }
    isPlayingHd.value = !isPlayingHd.value
  }

  async function handlePlayerReadyForPlayback(): Promise<void> {
    const player = playerElement.value
    if (player && pendingVideoRestore) {
      const restoreState = pendingVideoRestore
      pendingVideoRestore = null
      player.currentTime = restoreState.currentTime
      syncVideoTimelineState(player)

      if (!restoreState.wasPaused) {
        void player.play().catch(() => { /* ignore */ })
      } else {
        isVideoPaused.value = true
      }

      return
    }

    await attemptVideoPlayback()
  }

  function bindPlayerEventListeners(player: MediaPlayerElement | null) {
    removePlayerEventListeners?.()
    removePlayerEventListeners = null

    if (!player) {
      return
    }

    const handleReady = () => {
      playerReady = true
      void handlePlayerReadyForPlayback()
    }
    const handlePlay = () => {
      isVideoPaused.value = false
      syncVideoTimelineState(player)
    }
    const handlePause = () => {
      isVideoPaused.value = props.image?.mediaType === "video"
      syncVideoTimelineState(player)
    }
    const handleVolume = () => {
      handlePlayerVolumeChange()
    }
    const handleDuration = (event: Event) => {
      if (event instanceof CustomEvent && typeof event.detail === "number" && event.detail > 0) {
        videoDurationMs.value = event.detail * 1000
      }

      syncVideoTimelineState(player)
    }
    const handleTimeUpdate = (event: Event) => {
      if (
        event instanceof CustomEvent &&
        typeof event.detail === "object" &&
        event.detail !== null &&
        "currentTime" in event.detail &&
        typeof event.detail.currentTime === "number"
      ) {
        videoCurrentTimeMs.value = event.detail.currentTime * 1000
        return
      }

      syncVideoTimelineState(player)
    }
    const handleEnded = () => {
      videoCurrentTimeMs.value = videoDurationMs.value
    }

    player.addEventListener("loaded-metadata", handleReady)
    player.addEventListener("can-play", handleReady)
    player.addEventListener("play", handlePlay)
    player.addEventListener("pause", handlePause)
    player.addEventListener("volume-change", handleVolume)
    player.addEventListener("duration-change", handleDuration)
    player.addEventListener("time-update", handleTimeUpdate)
    player.addEventListener("ended", handleEnded)

    removePlayerEventListeners = () => {
      player.removeEventListener("loaded-metadata", handleReady)
      player.removeEventListener("can-play", handleReady)
      player.removeEventListener("play", handlePlay)
      player.removeEventListener("pause", handlePause)
      player.removeEventListener("volume-change", handleVolume)
      player.removeEventListener("duration-change", handleDuration)
      player.removeEventListener("time-update", handleTimeUpdate)
      player.removeEventListener("ended", handleEnded)
    }

    if (player.hasAttribute("data-can-play")) {
      void handlePlayerReadyForPlayback()
    }
  }

  watch(
    () => props.image?.contentId ?? props.image?.id ?? null,
    () => {
      wheelDeltaAccumulator.value = 0
      navigationLockedUntil.value = 0
      resetSidebarSheetGesture()
      resetMediaSheetRevealGesture()
      isPlayingHd.value = false
      isVideoPaused.value = false
      textExpanded.value = false
      summaryExpanded.value = false
      videoDurationMs.value = props.image?.durationMs ?? 0
      videoCurrentTimeMs.value = 0
      pendingVideoRestore = null
      void attemptVideoPlayback()
    },
  )

  watch(
    () => appStore.videoMuted,
    videoMuted => {
      const player = playerElement.value
      if (!player) {
        return
      }

      syncVideoMuted(player, videoMuted)
    },
  )

  watch(playerElement, player => {
    videoDurationMs.value = props.image?.durationMs ?? 0
    videoCurrentTimeMs.value = 0
    playerReady = false
    bindPlayerEventListeners(player)
  })

  watch(
    () => props.isModal,
    () => {
      updateSidebarLayout()
    },
  )

  async function navigateByDirection(direction: "previous" | "next") {
    const targetId =
      direction === "next"
        ? nextNavigationImageId.value
        : previousNavigationImageId.value
    if (!targetId) {
      return
    }

    navigationLockedUntil.value = Date.now() + NAVIGATION_COOLDOWN_MS
    await router.push({
      name: "image",
      params: { id: String(targetId) },
      query: route.query,
    })
  }

  function handleWheel(event: WheelEvent) {
    if (!props.isModal || !props.image) {
      return
    }

    if (
      sidebarElement.value &&
      event.target instanceof Node &&
      sidebarElement.value.contains(event.target)
    ) {
      return
    }

    if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) {
      return
    }

    event.preventDefault()

    if (Date.now() < navigationLockedUntil.value) {
      return
    }

    wheelDeltaAccumulator.value += event.deltaY

    if (Math.abs(wheelDeltaAccumulator.value) < WHEEL_NAVIGATION_THRESHOLD) {
      return
    }

    const direction = wheelDeltaAccumulator.value > 0 ? "next" : "previous"
    wheelDeltaAccumulator.value = 0
    void navigateByDirection(direction)
  }

  function handleKeydown(event: KeyboardEvent) {
    if (!props.isModal || !props.image || event.defaultPrevented) {
      return
    }

    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
      return
    }

    if (Date.now() < navigationLockedUntil.value) {
      return
    }

    let direction: "previous" | "next" | null = null

    if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      direction = "previous"
    }

    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      direction = "next"
    }

    if (!direction) {
      return
    }

    event.preventDefault()
    wheelDeltaAccumulator.value = 0
    void navigateByDirection(direction)
  }

  async function toggleVideoSurfacePlayback() {
    const player = playerElement.value
    if (!player || props.image?.mediaType !== "video") {
      return
    }

    if (player.paused) {
      await resumeVideoPlayback()
      return
    }

    isVideoPaused.value = true
    void player.pause().catch(() => {
      // Ignore pause rejections before the provider is ready.
    })
  }

  async function handleVideoSurfaceClick(event: MouseEvent) {
    if (!isPrimaryPlainClick(event) || isPlayerInteractiveTarget(event.target)) {
      return
    }

    await toggleVideoSurfacePlayback()
  }

  function handleVideoSurfaceKeydown(event: KeyboardEvent) {
    if (isPlayerInteractiveTarget(event.target)) {
      return
    }

    if (event.key !== "Enter" && event.key !== " ") {
      return
    }

    event.preventDefault()
    void toggleVideoSurfacePlayback()
  }

  async function handleSetCover() {
    if (!props.image || settingCover.value) return;
    try {
      settingCover.value = true;
      await foldersStore.setFolderCover(props.image.folderSlug, props.image.id);
      locallySetCover.value = true;
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to set cover');
    } finally {
      settingCover.value = false;
    }
  }

  onMounted(() => {
    void nextTick().then(updateSidebarLayout)
    window.addEventListener("resize", updateSidebarLayout)
    window.addEventListener("keydown", handleKeydown)
    void attemptVideoPlayback()
  })

  onUnmounted(() => {
    resetSidebarSheetGesture()
    resetMediaSheetRevealGesture()
    window.removeEventListener("resize", updateSidebarLayout)
    window.removeEventListener("keydown", handleKeydown)
    removePlayerEventListeners?.()
    removePlayerEventListeners = null
    void playerElement.value?.pause().catch(() => { /* ignore */ })
  })
</script>

<style scoped>
.viewer__media-shell--text {
  display: flex;
  align-items: stretch;
  justify-content: center;
  padding: 1.2rem;
  background:
    radial-gradient(circle at top right, rgba(255, 255, 255, 0.6), transparent 30%),
    linear-gradient(160deg, #f4ecd8 0%, #e7d7b1 100%);
}

.viewer__text-card {
  width: min(100%, 46rem);
  overflow: hidden;
  border: 1px solid rgba(109, 88, 55, 0.14);
  border-radius: 1.35rem;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.62), transparent 20%),
    rgba(255, 251, 242, 0.92);
  box-shadow: 0 20px 60px rgba(78, 59, 28, 0.12);
}

.viewer__text-header {
  display: grid;
  gap: 0.45rem;
  padding: 1.45rem 1.5rem 1.1rem;
  border-bottom: 1px solid rgba(109, 88, 55, 0.12);
}

.viewer__text-kicker {
  font-size: 0.73rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #89683a;
}

.viewer__text-title {
  margin: 0;
  font-size: clamp(1.2rem, 2vw, 1.55rem);
  line-height: 1.18;
  letter-spacing: -0.03em;
  color: #2f2619;
}

.viewer__text-subtitle {
  margin: 0;
  color: #7c6a4f;
  font-size: 0.88rem;
}

.viewer__text-content,
.viewer__sidebar-copy {
  color: #463a27;
  white-space: normal;
  line-height: 1.7;
}

.viewer__text-content {
  padding: 1.35rem 1.5rem 1.5rem;
  font-size: 1rem;
}

.viewer__sidebar-copy {
  font-size: 0.92rem;
}

.viewer__text-content--collapsed,
.viewer__sidebar-copy--collapsed {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
}

.viewer__text-content--collapsed {
  -webkit-line-clamp: 12;
}

.viewer__sidebar-copy--collapsed {
  -webkit-line-clamp: 6;
}

.viewer__text-toggle {
  margin: 0 1.5rem 1.3rem;
  padding: 0;
  border: 0;
  background: transparent;
  color: #8d5f25;
  font-weight: 700;
  cursor: pointer;
}

.viewer__text-toggle--sidebar {
  margin: 0;
}

.viewer__text-content :deep(p),
.viewer__sidebar-copy :deep(p) {
  margin: 0 0 0.95rem;
}

.viewer__text-content :deep(p:last-child),
.viewer__sidebar-copy :deep(p:last-child) {
  margin-bottom: 0;
}

.viewer__text-content :deep(h1),
.viewer__text-content :deep(h2),
.viewer__text-content :deep(h3),
.viewer__sidebar-copy :deep(h1),
.viewer__sidebar-copy :deep(h2),
.viewer__sidebar-copy :deep(h3) {
  margin: 0 0 0.8rem;
  color: #2f2619;
  line-height: 1.25;
  letter-spacing: -0.03em;
}

.viewer__text-content :deep(code),
.viewer__sidebar-copy :deep(code) {
  padding: 0.08rem 0.3rem;
  border-radius: 0.35rem;
  background: rgba(88, 68, 39, 0.08);
  font-size: 0.9em;
}

.viewer__text-content :deep(pre),
.viewer__sidebar-copy :deep(pre) {
  overflow: auto;
  padding: 0.95rem;
  border-radius: 0.85rem;
  background: rgba(88, 68, 39, 0.08);
}
</style>
