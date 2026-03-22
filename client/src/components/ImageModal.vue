<template>
  <section
    v-if="image"
    :class="['viewer relative', { 'viewer--modal': isModal }]"
    @wheel="handleWheel"
  >
    <!-- Close button (modal only) -->
    <button
      v-if="isModal"
      class="fixed top-[0.6rem] right-[0.6rem] z-55 inline-flex items-center justify-center w-[3rem] h-[3rem] p-0 border-0 text-white/85 bg-transparent cursor-pointer transition-opacity duration-150 hover:text-white"
      type="button"
      aria-label="Close post"
      @click="$emit('close')"
    >
      <svg
        class="w-8 h-8"
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
      v-if="image.previousImageId"
      :class="[
        'inline-flex items-center justify-center w-[2.2rem] h-[2.2rem] rounded-full text-[#111] bg-white/88 shadow-[0_8px_20px_rgba(0,0,0,0.18)]',
        isModal
          ? 'fixed top-1/2 z-45 -translate-y-1/2 left-[5px]'
          : 'absolute top-1/2 z-2 -mt-[1.1rem] left-[-3.25rem] max-md:left-[-2.75rem]',
      ]"
      :to="{
        name: 'image',
        params: { id: String(image.previousImageId) },
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
      v-if="image.nextImageId"
      :class="[
        'inline-flex items-center justify-center w-[2.2rem] h-[2.2rem] rounded-full text-[#111] bg-white/88 shadow-[0_8px_20px_rgba(0,0,0,0.18)]',
        isModal
          ? 'fixed top-1/2 z-45 -translate-y-1/2 right-[5px]'
          : 'absolute top-1/2 z-2 -mt-[1.1rem] right-[-3.25rem] max-md:right-[-2.75rem]',
      ]"
      :to="{
        name: 'image',
        params: { id: String(image.nextImageId) },
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
        class="i-fluent-panel-left-expand-16-filled w-8 h-8"
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
          },
        ]"
      >
        <template v-if="image.mediaType === 'video'">
          <div
            class="viewer__video-shell"
            :style="videoShellStyle"
          >
            <media-player
              ref="playerElement"
              class="viewer__player"
              :src.prop="videoSource"
              :title.prop="image.filename"
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
              <media-controls class="viewer__player-controls">
                <media-controls-group class="viewer__player-controls-group">
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
                </media-controls-group>
                <media-controls-group class="viewer__player-controls-group">
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
                </media-controls-group>
              </media-controls>
            </media-player>
          </div>
        </template>
        <ResilientImage
          v-else
          :src="image.previewUrl"
          :alt="image.filename"
          :width="image.width"
          :height="image.height"
          loading="eager"
          :retry-while="appStore.isScanning"
        />
      </div>

      <button
        v-if="isModalSidebarOverlayVisible"
        class="viewer__drawer-backdrop"
        type="button"
        aria-label="Hide post details"
        @click="closeSidebar"
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
          },
        ]"
        :aria-hidden="isModalSidebarCollapsible && !isSidebarExpanded"
        :inert="isModalSidebarCollapsible && !isSidebarExpanded"
      >
        <!-- Header -->
        <div
          class="flex items-center justify-between gap-4 border-b border-border px-5 pt-[1.1rem] pb-4"
        >
          <RouterLink
            class="flex items-center gap-[0.85rem] min-w-0"
            :to="{ name: 'folder', params: { slug: image.folderSlug } }"
            aria-label="Open folder"
          >
            <Avatar
              class="h-[2.65rem] w-[2.65rem]"
              :name="image.folderName"
              :src="folderAvatar"
            />
            <div class="min-w-0">
              <h2 class="m-0 text-[0.9rem] font-semibold truncate">
                {{ image.folderName }}
              </h2>
              <p class="m-0 text-muted truncate">
                {{
                  folder?.breadcrumb ??
                  image.folderBreadcrumb ??
                  "Top-level source folder"
                }}
              </p>
            </div>
          </RouterLink>
          <span class="text-muted text-[0.78rem] whitespace-nowrap">{{
            formattedDate
          }}</span>
        </div>

        <!-- Description -->
        <div class="grid gap-[0.3rem] px-5 pt-[1.1rem]">
          <p class="m-0 text-text">
            <strong class="mr-[0.35rem]">{{ image.folderName }}</strong>
            {{ readableFilename }}
          </p>
          <p class="m-0 text-muted">{{ image.relativePath }}</p>
        </div>

        <!-- Meta -->
        <dl class="grid gap-[0.9rem] m-0 px-5 pt-[0.35rem]">
          <div>
            <dt
              class="text-muted text-[0.75rem] mb-[0.25rem] uppercase tracking-[0.05em]"
            >
              Dimensions
            </dt>
            <dd class="m-0 text-[0.96rem] font-semibold">
              {{ image.width }} × {{ image.height }}
            </dd>
          </div>
          <div>
            <dt
              class="text-muted text-[0.75rem] mb-[0.25rem] uppercase tracking-[0.05em]"
            >
              Type
            </dt>
            <dd class="m-0 text-[0.96rem] font-semibold">
              {{
                image.mediaType === "video"
                  ? `Video (${image.mimeType})`
                  : image.mimeType
              }}
            </dd>
          </div>
          <div v-if="image.durationMs">
            <dt
              class="text-muted text-[0.75rem] mb-[0.25rem] uppercase tracking-[0.05em]"
            >
              Duration
            </dt>
            <dd class="m-0 text-[0.96rem] font-semibold">
              {{ formattedDuration }}
            </dd>
          </div>
          <div>
            <dt
              class="text-muted text-[0.75rem] mb-[0.25rem] uppercase tracking-[0.05em]"
            >
              Size
            </dt>
            <dd class="m-0 text-[0.96rem] font-semibold">{{ fileSize }}</dd>
          </div>
          <div
            v-for="detail in exifDetails"
            :key="detail.label"
          >
            <dt
              class="text-muted text-[0.75rem] mb-[0.25rem] uppercase tracking-[0.05em]"
            >
              {{ detail.label }}
            </dt>
            <dd class="m-0 text-[0.96rem] font-semibold break-words">
              {{ detail.value }}
            </dd>
          </div>
        </dl>

        <!-- Actions -->
        <div
          class="flex items-center justify-between gap-4 px-5 pt-[0.7rem] pb-5 mt-auto"
        >
          <!-- Like -->
          <button
            v-if="authStore.canUseSavedItems"
            class="inline-flex items-center justify-center p-0 border-0 bg-transparent cursor-pointer transition-[opacity,transform,color] duration-180 hover:opacity-72 hover:-translate-y-px disabled:opacity-45 disabled:cursor-wait disabled:transform-none"
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
                  ? 'i-fluent-heart-16-filled'
                  : 'i-fluent-heart-16-regular'
              "
              aria-hidden="true"
            />
          </button>

          <div class="flex items-center gap-4">
            <!-- Open original -->
            <a
              class="inline-flex items-center justify-center p-0 border-0 bg-transparent cursor-pointer text-text transition-[opacity,transform] duration-180 hover:opacity-72 hover:-translate-y-px"
              :href="image.originalUrl"
              target="_blank"
              rel="noreferrer"
              aria-label="Open original file"
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
              v-if="authStore.canDeleteMedia"
              class="inline-flex items-center justify-center p-0 border-0 bg-transparent cursor-pointer text-[#d93025] transition-[opacity,transform] duration-180 hover:opacity-72 hover:-translate-y-px disabled:opacity-45 disabled:cursor-wait disabled:transform-none"
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

  import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue"
  import { RouterLink, useRoute, useRouter } from "vue-router"
  import type { PlayerSrc } from "vidstack"
  import type { MediaPlayerElement } from "vidstack/elements"

  import type { ImageDetail, FolderSummary } from "../types/api"
  import { useAppStore } from "../stores/app"
  import { useAuthStore } from "../stores/auth"
  import { useLikesStore } from "../stores/likes"
  import Avatar from "./Avatar.vue"
  import ResilientImage from "./ResilientImage.vue"
  import { formatMediaDuration, videoPreviewWouldDownscale } from "../utils/media"

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
  const isPlayingHd = ref(false)

  const WHEEL_NAVIGATION_THRESHOLD = 72
  const NAVIGATION_COOLDOWN_MS = 320
  const MODAL_SIDEBAR_COLLAPSE_BREAKPOINT = 960

  type MetadataDetail = {
    label: string
    value: string
  }

  let videoMuteSyncToken = 0
  let pendingVideoRestore: { currentTime: number; wasPaused: boolean } | null = null
  let removePlayerEventListeners: (() => void) | null = null

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
  const videoShellStyle = computed(() => {
    if (!props.image || props.image.mediaType !== "video") {
      return undefined
    }

    return {
      "--viewer-media-aspect-ratio": `${props.image.width} / ${props.image.height}`,
      "--viewer-media-intrinsic-width": `${props.image.width}px`,
    }
  })

  const folderAvatar = computed(() => props.folder?.avatarUrl ?? null)
  const readableFilename = computed(() =>
    props.image
      ? props.image.filename
          .replace(/\.[^.]+$/, "")
          .replace(/[_-]+/g, " ")
          .replace(/\s+/g, " ")
          .trim()
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
  const isModalSidebarOverlayVisible = computed(
    () => isModalSidebarCollapsible.value && isSidebarExpanded.value,
  )

  function syncVideoMuted(player: MediaPlayerElement, muted: boolean) {
    const token = ++videoMuteSyncToken
    player.muted = muted

    requestAnimationFrame(() => {
      if (videoMuteSyncToken === token) {
        videoMuteSyncToken = 0
      }
    })
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

  function updateSidebarLayout() {
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

  function toggleSidebar() {
    if (!isModalSidebarCollapsible.value) {
      return
    }

    isSidebarExpanded.value = !isSidebarExpanded.value
  }

  function closeSidebar() {
    if (!isModalSidebarCollapsible.value) {
      return
    }

    isSidebarExpanded.value = false
    focusSidebarToggle(true)
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
      return
    } catch {
      if (appStore.videoMuted) {
        // Ignore autoplay rejections and leave manual controls available.
        return
      }
    }

    syncVideoMuted(player, true)

    try {
      await player.play()
    } catch {
      // Ignore autoplay rejections and leave manual controls available.
    }
  }

  function handlePlayerVolumeChange() {
    const player = playerElement.value
    if (!player || videoMuteSyncToken !== 0) {
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

      if (!restoreState.wasPaused) {
        void player.play().catch(() => { /* ignore */ })
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
      void handlePlayerReadyForPlayback()
    }
    const handleVolume = () => {
      handlePlayerVolumeChange()
    }

    player.addEventListener("loaded-metadata", handleReady)
    player.addEventListener("can-play", handleReady)
    player.addEventListener("volume-change", handleVolume)

    removePlayerEventListeners = () => {
      player.removeEventListener("loaded-metadata", handleReady)
      player.removeEventListener("can-play", handleReady)
      player.removeEventListener("volume-change", handleVolume)
    }

    if (player.hasAttribute("data-can-play")) {
      void handlePlayerReadyForPlayback()
    }
  }

  watch(
    () => props.image?.id ?? null,
    () => {
      wheelDeltaAccumulator.value = 0
      navigationLockedUntil.value = 0
      isPlayingHd.value = false
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
    bindPlayerEventListeners(player)
  })

  watch(
    () => props.isModal,
    () => {
      updateSidebarLayout()
    },
  )

  async function navigateByDirection(direction: "previous" | "next") {
    if (!props.image) {
      return
    }

    const targetId =
      direction === "next"
        ? props.image.nextImageId
        : props.image.previousImageId
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

  onMounted(() => {
    void nextTick().then(updateSidebarLayout)
    window.addEventListener("resize", updateSidebarLayout)
    window.addEventListener("keydown", handleKeydown)
    void attemptVideoPlayback()
  })

  onUnmounted(() => {
    window.removeEventListener("resize", updateSidebarLayout)
    window.removeEventListener("keydown", handleKeydown)
    removePlayerEventListeners?.()
    removePlayerEventListeners = null
    void playerElement.value?.pause().catch(() => { /* ignore */ })
  })
</script>
