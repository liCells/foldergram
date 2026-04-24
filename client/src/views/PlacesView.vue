<template>
  <section class="w-[min(100%,72rem)] mx-auto flex flex-col gap-[1.4rem]">
    <header class="flex items-end justify-between gap-4 max-sm:flex-col max-sm:items-start">
      <div>
        <span class="eyebrow">Places</span>
        <h1 class="mt-[0.15rem] mb-0 text-[clamp(1.55rem,2.4vw,2rem)] font-medium tracking-[-0.04em]">
          All places
        </h1>
        <p class="m-0 mt-1 text-muted">
          Browse posts grouped from offline location data.
        </p>
      </div>
      <div class="flex items-center gap-[1.4rem] shrink-0 max-sm:w-full max-sm:justify-between">
        <div class="text-center">
          <p class="m-0 text-[1.35rem] font-bold tracking-tight">
            {{ formatCount(placesStore.items.length) }}
          </p>
          <p class="m-0 text-muted text-[0.72rem] uppercase tracking-[0.08em]">
            Places
          </p>
        </div>
        <div class="w-px h-8 bg-border"></div>
        <div class="text-center">
          <p class="m-0 text-[1.35rem] font-bold tracking-tight">
            {{ formatCount(totalPosts) }}
          </p>
          <p class="m-0 text-muted text-[0.72rem] uppercase tracking-[0.08em]">
            Posts
          </p>
        </div>
      </div>
    </header>

    <ErrorState
      v-if="placesStore.listError && placesStore.items.length === 0"
      title="Could not load places"
      :message="placesStore.listError"
    />
    <template v-else>
      <div class="flex flex-wrap items-center gap-3 p-[0.85rem] pl-4 bg-surface border border-border rounded-[1.1rem] shadow-[var(--shadow)]">
        <div class="relative flex-1 min-w-[12rem]">
          <svg
            class="absolute left-3 top-1/2 -translate-y-1/2 w-[1rem] h-[1rem] text-muted pointer-events-none"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            id="places-search"
            v-model.trim="searchQuery"
            class="w-full h-10 pl-9 pr-4 border border-border rounded-[0.75rem] text-text text-[0.88rem] bg-surface-alt transition-[border-color,box-shadow] duration-150 focus:outline-none focus:border-accent/40 focus:shadow-[0_0_0_3px_var(--accent-soft)]"
            type="search"
            placeholder="Search names, regions, or coordinates..."
          />
        </div>

        <div class="relative">
          <select
            v-model="sortMode"
            class="h-10 pl-3 pr-9 border border-border rounded-[0.75rem] text-text text-[0.82rem] bg-surface-alt cursor-pointer appearance-none focus:outline-none focus:border-accent/40"
          >
            <option value="posts-desc">Most posts</option>
            <option value="name-asc">Name A-Z</option>
            <option value="name-desc">Name Z-A</option>
            <option value="country-asc">Country A-Z</option>
          </select>
          <svg
            class="pointer-events-none absolute right-[0.65rem] top-1/2 -translate-y-1/2 w-[0.85rem] h-[0.85rem] text-muted"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>

        <span class="ml-auto text-muted text-[0.8rem] shrink-0">
          {{ formatCount(filteredPlaces.length) }} result{{ filteredPlaces.length !== 1 ? "s" : "" }}
        </span>
      </div>

      <section
        v-if="placesStore.loadingList && placesStore.items.length === 0"
        class="card p-12 text-center"
      >
        <p class="m-0 text-muted">Loading places...</p>
      </section>

      <EmptyState
        v-else-if="placesStore.items.length === 0"
        title="No places indexed yet"
        description="Prepare offline place data and rebuild assignments from Settings to group posts by location."
      />

      <section
        v-else-if="filteredPlaces.length === 0"
        class="card p-12 text-center"
      >
        <p class="m-0 text-muted">
          No places match. Try a different search or sort.
        </p>
      </section>

      <section
        v-else
        class="bg-surface border border-border rounded-[1.1rem] shadow-[var(--shadow)] overflow-hidden"
        aria-label="All places"
      >
        <RouterLink
          v-for="(place, i) in filteredPlaces"
          :key="place.id"
          class="group flex items-center gap-4 px-5 py-[0.8rem] transition-colors duration-150 hover:bg-surface-hover max-sm:items-start"
          :class="i > 0 ? 'border-t border-border' : ''"
          :to="{ name: 'place', params: { slug: place.slug } }"
        >
          <div class="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-border bg-surface-alt text-accent-strong">
            <span class="i-fluent-location-48-filled h-[1.35rem] w-[1.35rem]" aria-hidden="true" />
          </div>

          <div class="flex-1 min-w-0">
            <div class="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
              <p class="m-0 min-w-0 text-[0.9rem] font-semibold leading-[1.25] break-words sm:truncate">
                {{ place.name }}
              </p>
            </div>
            <p class="m-0 text-muted text-[0.76rem] truncate">
              {{ formatMetadataLine(place) }}
            </p>
            <p
              v-if="formatCoordinates(place)"
              class="m-0 hidden text-muted text-[0.74rem] truncate font-mono opacity-70 sm:block"
            >
              {{ formatCoordinates(place) }}
            </p>
            <div class="mt-1 grid gap-[0.12rem] sm:hidden">
              <span class="text-[0.74rem] font-semibold text-text">
                {{ formatPostCount(place) }}
              </span>
              <span
                v-if="formatCoordinates(place)"
                class="text-[0.72rem] text-muted font-mono"
              >
                {{ formatCoordinates(place) }}
              </span>
            </div>
          </div>

          <div class="hidden items-center gap-3 shrink-0 text-right sm:flex">
            <div class="grid gap-[0.15rem] justify-items-end">
              <span class="text-[0.82rem] font-semibold text-text tabular-nums">
                {{ formatPostCount(place) }}
              </span>
              <span class="text-[0.72rem] text-muted">
                {{ place.kind === "manual" ? "Manual place" : place.isApproximate ? "Nearest city" : "City match" }}
              </span>
            </div>
            <span
              class="w-[7px] h-[7px] rounded-full shrink-0"
              :class="place.postCount > 0 ? 'bg-[#1ca44e]' : 'bg-border'"
              :title="place.postCount > 0 ? 'Ready' : 'Empty'"
            ></span>
          </div>
        </RouterLink>
      </section>
    </template>
  </section>
</template>

<script setup lang="ts">
  import { computed, onMounted, ref } from "vue"
  import { RouterLink } from "vue-router"

  import EmptyState from "../components/EmptyState.vue"
  import ErrorState from "../components/ErrorState.vue"
  import { usePlacesStore } from "../stores/places"
  import type { PlaceDetail } from "../types/api"

  type PlacesSort = "posts-desc" | "name-asc" | "name-desc" | "country-asc"

  const placesStore = usePlacesStore()
  const searchQuery = ref("")
  const sortMode = ref<PlacesSort>("posts-desc")

  const totalPosts = computed(() =>
    placesStore.items.reduce((total, place) => total + place.postCount, 0),
  )
  const normalizedQuery = computed(() => searchQuery.value.trim().toLowerCase())

  function formatCount(value: number) {
    return new Intl.NumberFormat().format(value)
  }

  function formatMetadataLine(place: PlaceDetail) {
    return [place.cityName, place.admin1Name, place.countryName ?? place.countryCode]
      .filter((part, index, parts) => part && parts.indexOf(part) === index)
      .join(", ") || "Offline city-level place"
  }

  function formatCoordinates(place: PlaceDetail) {
    if (typeof place.latitude !== "number" || typeof place.longitude !== "number") {
      return ""
    }

    return `${place.latitude.toFixed(4)}, ${place.longitude.toFixed(4)}`
  }

  function formatPostCount(place: PlaceDetail) {
    return `${formatCount(place.postCount)} post${place.postCount === 1 ? "" : "s"}`
  }

  function matchesSearch(place: PlaceDetail, query: string) {
    if (!query) {
      return true
    }

    return [
      place.slug,
      place.name,
      place.kind,
      formatMetadataLine(place),
      formatCoordinates(place),
    ].some(value => value.toLowerCase().includes(query))
  }

  function compareCountry(left: PlaceDetail, right: PlaceDetail) {
    const leftKey = [
      left.countryName ?? left.countryCode ?? "",
      left.admin1Name ?? "",
      left.cityName ?? "",
      left.name,
    ].join(" ")
    const rightKey = [
      right.countryName ?? right.countryCode ?? "",
      right.admin1Name ?? "",
      right.cityName ?? "",
      right.name,
    ].join(" ")

    return leftKey.localeCompare(rightKey)
  }

  function sortPlaces(left: PlaceDetail, right: PlaceDetail) {
    switch (sortMode.value) {
      case "name-asc":
        return left.name.localeCompare(right.name)
      case "name-desc":
        return right.name.localeCompare(left.name)
      case "country-asc":
        return compareCountry(left, right)
      case "posts-desc":
      default:
        return right.postCount - left.postCount || left.name.localeCompare(right.name)
    }
  }

  const filteredPlaces = computed(() =>
    placesStore.items
      .filter(place => matchesSearch(place, normalizedQuery.value))
      .slice()
      .sort(sortPlaces),
  )

  onMounted(async () => {
    await placesStore.fetchPlaces()
  })
</script>
