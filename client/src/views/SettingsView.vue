<template>
  <section class="w-[min(100%,72rem)] mx-auto flex flex-col gap-[1.2rem]">
    <header class="flex items-end justify-between gap-4 pb-[0.8rem] max-sm:flex-col max-sm:items-start">
      <div>
        <span class="eyebrow">Settings</span>
        <h1 class="mt-[0.15rem] mb-0 text-[clamp(1.55rem,2.4vw,2rem)] font-medium tracking-[-0.04em]">Library Controls</h1>
        <p class="m-0 text-muted">Manage feed defaults, access, scans, and the library index.</p>
      </div>
    </header>

    <section
      v-if="showScanErrorNotice"
      class="card grid gap-[1rem] p-8 border-[color-mix(in_srgb,#d2a133_45%,var(--border)_55%)]"
      style="background: radial-gradient(circle at top right, rgba(210,161,51,0.18), transparent 42%), linear-gradient(180deg, color-mix(in srgb, var(--surface) 92%, #fff4d1 8%) 0%, color-mix(in srgb, var(--surface) 86%, #ffeab1 14%) 100%);"
    >
      <div class="flex items-start justify-between gap-4">
        <div class="grid gap-[0.35rem]">
          <span class="eyebrow text-[#9f6a00]">Scan Needs Attention</span>
          <h2 class="m-0 text-[1.1rem]">The last scan completed with errors</h2>
          <p class="m-0 text-muted">{{ scanErrorNoticeMessage }}</p>
        </div>
        <button
          class="inline-flex h-9 w-9 items-center justify-center rounded-full border-0 bg-[rgba(159,106,0,0.08)] text-[#9f6a00] cursor-pointer transition-colors duration-180 hover:bg-[rgba(159,106,0,0.14)]"
          type="button"
          aria-label="Dismiss scan warning"
          @click="dismissScanErrorNotice"
        >
          <span class="i-fluent-dismiss-20-filled h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      <div class="flex items-center gap-4 max-sm:flex-col-reverse max-sm:items-stretch">
        <p class="m-0 text-muted">Run a new library scan to retry failed media and fill in any missing thumbnails or previews.</p>
        <button class="btn-primary min-w-[11.5rem]" type="button" :disabled="scanActionDisabled" @click="runManualScan">
          {{ scanButtonLabel }}
        </button>
      </div>
    </section>

    <section
      v-if="showIgnoredRootMediaNotice"
      class="card flex items-center justify-between gap-3 px-4 py-3 border-[color-mix(in_srgb,var(--border)_82%,#d2a133_18%)]"
      style="background: linear-gradient(180deg, color-mix(in srgb, var(--surface) 97%, #fff9ea 3%) 0%, color-mix(in srgb, var(--surface) 94%, #fff3d8 6%) 100%);"
    >
      <p class="m-0 min-w-0 flex-1 break-words text-[0.8rem] leading-[1.45] text-muted">
        {{ ignoredRootMediaNoticeMessage }}
      </p>
      <button
        class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-0 bg-[rgba(159,106,0,0.08)] text-[#9f6a00] cursor-pointer transition-colors duration-180 hover:bg-[rgba(159,106,0,0.14)]"
        type="button"
        aria-label="Dismiss gallery root warning"
        @click="dismissIgnoredRootMediaNotice"
      >
        <span class="i-fluent-dismiss-20-filled h-5 w-5" aria-hidden="true" />
      </button>
    </section>

    <div class="flex flex-col md:flex-row gap-8 items-start mt-[0.5rem]">
      <!-- Navigation Sidebar -->
      <nav class="flex flex-col gap-2 w-full md:w-[16rem] shrink-0 sticky top-[6.5rem]">
        <button
          @click="currentCategory = 'library'"
          class="flex items-start gap-3 px-4 py-[0.85rem] rounded-[0.85rem] border-0 text-left transition-colors duration-150 cursor-pointer"
          :class="currentCategory === 'library' ? 'bg-surface-alt font-bold text-text' : 'bg-transparent text-muted hover:bg-surface-hover hover:text-text'"
        >
          <span class="w-[1.25rem] h-[1.25rem] shrink-0 mt-[0.1rem]" :class="currentCategory === 'library' ? 'i-fluent-folder-sync-20-filled' : 'i-fluent-folder-sync-20-regular'" aria-hidden="true"></span>
          <span class="flex flex-col gap-[0.1rem]">
            <span>Scan & Library</span>
            <span class="text-[0.75rem] font-normal text-muted">Index media, rebuild derivatives, and set feed defaults</span>
          </span>
        </button>
        <button
          @click="currentCategory = 'access'"
          class="flex items-start gap-3 px-4 py-[0.85rem] rounded-[0.85rem] border-0 text-left transition-colors duration-150 cursor-pointer"
          :class="currentCategory === 'access' ? 'bg-surface-alt font-bold text-text' : 'bg-transparent text-muted hover:bg-surface-hover hover:text-text'"
        >
          <span class="w-[1.25rem] h-[1.25rem] shrink-0 mt-[0.1rem]" :class="currentCategory === 'access' ? 'i-fluent-lock-shield-20-filled' : 'i-fluent-lock-shield-20-regular'" aria-hidden="true"></span>
          <span class="flex flex-col gap-[0.1rem]">
            <span>Security & Access</span>
            <span class="text-[0.75rem] font-normal text-muted">Password locks & viewer roles</span>
          </span>
        </button>
        <button
          @click="currentCategory = 'status'"
          class="flex items-start gap-3 px-4 py-[0.85rem] rounded-[0.85rem] border-0 text-left transition-colors duration-150 cursor-pointer"
          :class="currentCategory === 'status' ? 'bg-surface-alt font-bold text-text' : 'bg-transparent text-muted hover:bg-surface-hover hover:text-text'"
        >
          <span class="w-[1.25rem] h-[1.25rem] shrink-0 mt-[0.1rem]" :class="currentCategory === 'status' ? 'i-fluent-data-usage-20-filled' : 'i-fluent-data-usage-20-regular'" aria-hidden="true"></span>
          <span class="flex flex-col gap-[0.1rem]">
            <span>System Status</span>
            <span class="text-[0.75rem] font-normal text-muted">Storage overview & scan history</span>
          </span>
        </button>
      </nav>

      <!-- Content Area -->
      <div class="flex-1 w-full min-w-0 flex flex-col gap-[1.15rem]">
        
        <!-- CATEGORY: ACCESS -->
        <template v-if="currentCategory === 'access'">
          <section class="card grid gap-[1.15rem] p-8">
            <div class="flex items-start justify-between gap-4 max-sm:flex-col max-sm:items-start">
              <div>
                <h2 class="m-0 text-[1.18rem]">Admin and viewer access</h2>
                <p class="m-0 mt-[0.35rem] text-muted">Protect admin actions with an admin password, then optionally issue a separate viewer password for browsing-only sessions.</p>
              </div>
              <span
                class="inline-flex items-center justify-center min-h-8 px-[0.7rem] py-[0.35rem] rounded-full text-[0.76rem] font-bold whitespace-nowrap"
                :class="authStore.enabled ? 'text-accent-strong bg-[color-mix(in_srgb,var(--accent-soft)_78%,transparent_22%)]' : 'text-muted bg-surface-alt'"
              >
                {{ authStore.enabled ? 'Admin Locked' : 'Open Access' }}
              </span>
            </div>

            <p class="m-0 text-muted">
              {{ authProtectionDescription }}
            </p>

            <div v-if="authFeedback" class="rounded-[0.95rem] px-4 py-3 text-[0.9rem]" :class="authFeedback.tone === 'error' ? 'border border-[rgba(214,48,49,0.24)] text-[#c0392b] bg-[rgba(214,48,49,0.08)]' : 'border border-[rgba(24,119,242,0.2)] text-accent-strong bg-[rgba(24,119,242,0.08)]'">
              {{ authFeedback.message }}
            </div>

            <section v-if="!authStore.enabled" class="grid gap-[1rem]">
              <div class="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
                <label class="grid gap-[0.45rem]">
                  <span class="text-[0.76rem] font-bold uppercase tracking-[0.08em] text-muted">Admin password</span>
                  <input
                    v-model="enablePassword"
                    class="h-12 rounded-[0.95rem] border border-border bg-[color-mix(in_srgb,var(--surface-alt)_84%,transparent_16%)] px-4 text-[0.95rem] text-text outline-none transition-[border-color,box-shadow] duration-180 focus:border-[color-mix(in_srgb,var(--accent)_48%,var(--border)_52%)] focus:shadow-[0_0_0_4px_color-mix(in_srgb,var(--accent-soft)_76%,transparent_24%)]"
                    type="password"
                    autocomplete="new-password"
                    placeholder="Minimum 8 characters"
                    :disabled="authStore.loading"
                  />
                </label>
                <label class="grid gap-[0.45rem]">
                  <span class="text-[0.76rem] font-bold uppercase tracking-[0.08em] text-muted">Confirm password</span>
                  <input
                    v-model="enablePasswordConfirmation"
                    class="h-12 rounded-[0.95rem] border border-border bg-[color-mix(in_srgb,var(--surface-alt)_84%,transparent_16%)] px-4 text-[0.95rem] text-text outline-none transition-[border-color,box-shadow] duration-180 focus:border-[color-mix(in_srgb,var(--accent)_48%,var(--border)_52%)] focus:shadow-[0_0_0_4px_color-mix(in_srgb,var(--accent-soft)_76%,transparent_24%)]"
                    type="password"
                    autocomplete="new-password"
                    placeholder="Repeat the password"
                    :disabled="authStore.loading"
                  />
                </label>
              </div>

              <div class="flex flex-col md:flex-row items-center gap-4 max-sm:items-stretch">
                <p class="m-0 flex-1 text-muted">The admin password is stored as a one-way hash and unlocks this browser with a signed session cookie.</p>
                <button class="btn-primary min-w-[13rem]" type="button" :disabled="authStore.loading" @click="enableAccessProtection">
                  {{ authStore.loading ? 'Enabling...' : 'Enable Admin Password' }}
                </button>
              </div>
            </section>

            <section v-else class="grid gap-[1rem]">
              <!-- Change Password -->
              <div class="grid gap-[0.9rem] rounded-[1.05rem] border border-border p-5">
                <div class="flex items-start justify-between gap-4 max-sm:flex-col max-sm:items-start">
                  <div>
                    <h3 class="m-0 text-[1rem]">Change admin password</h3>
                    <p class="m-0 mt-[0.25rem] text-muted">Update the admin password and invalidate older sessions.</p>
                  </div>
                  <button
                    class="inline-flex min-h-11 items-center justify-center rounded-[0.95rem] border border-[rgba(24,119,242,0.2)] bg-[rgba(24,119,242,0.08)] px-4 text-[0.9rem] font-semibold text-accent-strong transition-colors duration-180 hover:bg-[rgba(24,119,242,0.16)] disabled:cursor-wait disabled:opacity-60 max-sm:w-full"
                    type="button"
                    :aria-expanded="showChangePasswordForm"
                    :disabled="authStore.loading"
                    @click="toggleChangePasswordForm"
                  >
                    {{ showChangePasswordForm ? 'Hide Form' : 'Change Password' }}
                  </button>
                </div>

                <template v-if="showChangePasswordForm">
                  <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <label class="grid gap-[0.45rem]">
                      <span class="text-[0.76rem] font-bold uppercase tracking-[0.08em] text-muted">Current password</span>
                      <input
                        v-model="currentPassword"
                        class="h-12 rounded-[0.95rem] border border-border bg-[color-mix(in_srgb,var(--surface-alt)_84%,transparent_16%)] px-4 text-[0.95rem] text-text outline-none transition-[border-color,box-shadow] duration-180 focus:border-[color-mix(in_srgb,var(--accent)_48%,var(--border)_52%)] focus:shadow-[0_0_0_4px_color-mix(in_srgb,var(--accent-soft)_76%,transparent_24%)]"
                        type="password"
                        autocomplete="current-password"
                        :disabled="authStore.loading"
                      />
                    </label>
                    <label class="grid gap-[0.45rem]">
                      <span class="text-[0.76rem] font-bold uppercase tracking-[0.08em] text-muted">New password</span>
                      <input
                        v-model="nextPassword"
                        class="h-12 rounded-[0.95rem] border border-border bg-[color-mix(in_srgb,var(--surface-alt)_84%,transparent_16%)] px-4 text-[0.95rem] text-text outline-none transition-[border-color,box-shadow] duration-180 focus:border-[color-mix(in_srgb,var(--accent)_48%,var(--border)_52%)] focus:shadow-[0_0_0_4px_color-mix(in_srgb,var(--accent-soft)_76%,transparent_24%)]"
                        type="password"
                        autocomplete="new-password"
                        :disabled="authStore.loading"
                      />
                    </label>
                    <label class="grid gap-[0.45rem]">
                      <span class="text-[0.76rem] font-bold uppercase tracking-[0.08em] text-muted">Confirm new password</span>
                      <input
                        v-model="nextPasswordConfirmation"
                        class="h-12 rounded-[0.95rem] border border-border bg-[color-mix(in_srgb,var(--surface-alt)_84%,transparent_16%)] px-4 text-[0.95rem] text-text outline-none transition-[border-color,box-shadow] duration-180 focus:border-[color-mix(in_srgb,var(--accent)_48%,var(--border)_52%)] focus:shadow-[0_0_0_4px_color-mix(in_srgb,var(--accent-soft)_76%,transparent_24%)]"
                        type="password"
                        autocomplete="new-password"
                        :disabled="authStore.loading"
                      />
                    </label>
                  </div>

                  <div class="flex flex-col md:flex-row items-center gap-4 max-sm:items-stretch">
                    <p class="m-0 flex-1 text-muted">Use at least 8 characters. Changing the password signs out any older sessions.</p>
                    <button class="btn-primary min-w-[13rem]" type="button" :disabled="authStore.loading" @click="changeAccessPassword">
                      {{ authStore.loading ? 'Updating...' : 'Change Admin Password' }}
                    </button>
                  </div>
                </template>
              </div>
              
              <!-- Viewer Access -->
              <div class="grid gap-[0.9rem] rounded-[1.05rem] border border-border p-5">
                <div class="flex items-start justify-between gap-4 max-sm:flex-col max-sm:items-start">
                  <div>
                    <h3 class="m-0 text-[1rem]">Viewer access</h3>
                    <p class="m-0 mt-[0.25rem] text-muted">Issue a browsing-only password for viewer sessions or open the library for anonymous public viewing.</p>
                  </div>
                  <span
                    class="inline-flex items-center justify-center min-h-8 px-[0.7rem] py-[0.35rem] rounded-full text-[0.76rem] font-bold whitespace-nowrap"
                    :class="viewerAccessStatusTone"
                  >
                    {{ viewerAccessStatusLabel }}
                  </span>
                </div>

                <div
                  class="rounded-[0.95rem] border px-4 py-3"
                  :class="viewerAccessActive ? 'border-[rgba(24,119,242,0.18)] bg-[rgba(24,119,242,0.06)]' : 'border-border bg-[color-mix(in_srgb,var(--surface-alt)_82%,transparent_18%)]'"
                >
                  <p class="m-0 text-[0.92rem] font-semibold text-text">{{ viewerAccessSummaryTitle }}</p>
                  <p class="m-0 mt-[0.3rem] text-[0.88rem] text-muted">{{ viewerAccessSummary }}</p>
                </div>

                <div class="grid gap-[0.7rem] mt-2">
                  <label class="flex items-start gap-3 rounded-[0.9rem] border border-border px-4 py-3 cursor-pointer">
                    <input v-model="viewerAccessMode" class="mt-[0.2rem]" type="radio" value="off" :disabled="authStore.loading" />
                    <span class="grid gap-[0.15rem]">
                      <span class="text-[0.92rem] font-semibold text-text">Admin only</span>
                      <span class="text-[0.84rem] text-muted">Only the admin password can unlock the app.</span>
                    </span>
                  </label>
                  <label class="flex items-start gap-3 rounded-[0.9rem] border border-border px-4 py-3 cursor-pointer">
                    <input v-model="viewerAccessMode" class="mt-[0.2rem]" type="radio" value="password" :disabled="authStore.loading" />
                    <span class="grid gap-[0.15rem]">
                      <span class="text-[0.92rem] font-semibold text-text">Viewer password</span>
                      <span class="text-[0.84rem] text-muted">Allow a separate viewer login that can browse and use shared likes without seeing admin controls.</span>
                    </span>
                  </label>
                  <label class="flex items-start gap-3 rounded-[0.9rem] border border-border px-4 py-3 cursor-pointer">
                    <input v-model="viewerAccessMode" class="mt-[0.2rem]" type="radio" value="public" :disabled="authStore.loading" />
                    <span class="grid gap-[0.15rem]">
                      <span class="text-[0.92rem] font-semibold text-text">Public</span>
                      <span class="text-[0.84rem] text-muted">Allow anonymous browsing with browser-local favorites while keeping admin unlock available from More.</span>
                    </span>
                  </label>
                </div>

                <div v-if="viewerAccessMode === 'password'" class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  <label class="grid gap-[0.45rem]">
                    <span class="text-[0.76rem] font-bold uppercase tracking-[0.08em] text-muted">Viewer password</span>
                    <input
                      v-model="viewerPassword"
                      class="h-12 rounded-[0.95rem] border border-border bg-[color-mix(in_srgb,var(--surface-alt)_84%,transparent_16%)] px-4 text-[0.95rem] text-text outline-none transition-[border-color,box-shadow] duration-180 focus:border-[color-mix(in_srgb,var(--accent)_48%,var(--border)_52%)] focus:shadow-[0_0_0_4px_color-mix(in_srgb,var(--accent-soft)_76%,transparent_24%)]"
                      type="password"
                      autocomplete="new-password"
                      :placeholder="viewerAccessEnabled ? 'Enter a new viewer password' : 'Minimum 8 characters'"
                      :disabled="authStore.loading"
                    />
                  </label>
                  <label class="grid gap-[0.45rem]">
                    <span class="text-[0.76rem] font-bold uppercase tracking-[0.08em] text-muted">Confirm viewer password</span>
                    <input
                      v-model="viewerPasswordConfirmation"
                      class="h-12 rounded-[0.95rem] border border-border bg-[color-mix(in_srgb,var(--surface-alt)_84%,transparent_16%)] px-4 text-[0.95rem] text-text outline-none transition-[border-color,box-shadow] duration-180 focus:border-[color-mix(in_srgb,var(--accent)_48%,var(--border)_52%)] focus:shadow-[0_0_0_4px_color-mix(in_srgb,var(--accent-soft)_76%,transparent_24%)]"
                      type="password"
                      autocomplete="new-password"
                      :placeholder="viewerAccessEnabled ? 'Repeat the new viewer password' : 'Repeat the viewer password'"
                      :disabled="authStore.loading"
                    />
                  </label>
                </div>

                <div class="flex flex-col md:flex-row items-center gap-4 max-sm:items-stretch mt-3">
                  <p class="m-0 flex-1 text-muted">{{ viewerAccessDescription }}</p>
                  <button class="btn-primary min-w-[13rem]" type="button" :disabled="authStore.loading" @click="saveViewerAccess">
                    {{ authStore.loading ? 'Saving...' : viewerAccessButtonLabel }}
                  </button>
                </div>

                <div v-if="viewerFeedback" class="rounded-[0.95rem] px-4 py-3 text-[0.9rem] mt-2" :class="viewerFeedback.tone === 'error' ? 'border border-[rgba(214,48,49,0.24)] text-[#c0392b] bg-[rgba(214,48,49,0.08)]' : 'border border-[rgba(24,119,242,0.2)] text-accent-strong bg-[rgba(24,119,242,0.08)]'">
                  {{ viewerFeedback.message }}
                </div>
              </div>
              
            </section>
          </section>

          <!-- Danger Zone -->
          <div v-if="authStore.enabled" class="border border-[rgba(214,48,49,0.3)] rounded-[1.05rem] overflow-hidden">
            <div class="bg-[rgba(214,48,49,0.04)] px-6 py-4 border-b border-[rgba(214,48,49,0.1)]">
              <h3 class="m-0 text-[1rem] text-[#c0392b] font-bold">Danger Zone</h3>
            </div>
            <div class="p-6 grid gap-[0.9rem] bg-surface">
              <div class="flex items-start justify-between gap-4 max-sm:flex-col max-sm:items-start">
                <div>
                  <h3 class="m-0 text-[1rem]">Disable admin password</h3>
                  <p class="m-0 mt-[0.25rem] text-muted">Turn the admin password back off for this Foldergram instance.</p>
                </div>
                <button
                  class="inline-flex min-h-11 items-center justify-center rounded-[0.95rem] border border-[rgba(214,48,49,0.24)] bg-[rgba(214,48,49,0.08)] px-4 text-[0.9rem] font-semibold text-[#c0392b] transition-colors duration-180 hover:bg-[rgba(214,48,49,0.16)] disabled:cursor-wait disabled:opacity-60 max-sm:w-full"
                  type="button"
                  :aria-expanded="showDisablePasswordForm"
                  :disabled="authStore.loading"
                  @click="toggleDisablePasswordForm"
                >
                  {{ showDisablePasswordForm ? 'Hide Form' : 'Disable Access' }}
                </button>
              </div>

              <template v-if="showDisablePasswordForm">
                <div class="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-4 items-end max-lg:grid-cols-1 mt-2">
                  <label class="grid gap-[0.45rem]">
                    <span class="text-[0.76rem] font-bold uppercase tracking-[0.08em] text-muted">Current password</span>
                    <input
                      v-model="disablePassword"
                      class="h-12 rounded-[0.95rem] border border-border bg-[color-mix(in_srgb,var(--surface-alt)_84%,transparent_16%)] px-4 text-[0.95rem] text-text outline-none transition-[border-color,box-shadow] duration-180 focus:border-[color-mix(in_srgb,var(--accent)_48%,var(--border)_52%)] focus:shadow-[0_0_0_4px_color-mix(in_srgb,var(--accent-soft)_76%,transparent_24%)]"
                      type="password"
                      autocomplete="current-password"
                      :disabled="authStore.loading"
                    />
                  </label>
                  <button class="btn-primary min-w-[13rem] bg-[#d93025] hover:bg-[#c5281c] border-transparent text-white" type="button" :disabled="authStore.loading" @click="disableAccessProtection">
                    {{ authStore.loading ? 'Disabling...' : 'Disable Admin Password' }}
                  </button>
                  <button class="inline-flex min-h-11 items-center justify-center rounded-[0.95rem] border border-border bg-transparent px-4 text-[0.92rem] font-semibold text-text transition-colors duration-180 hover:bg-surface-alt disabled:cursor-wait disabled:opacity-60" type="button" :disabled="authStore.loading" @click="signOut">
                    Sign Out
                  </button>
                </div>
              </template>
            </div>
          </div>
        </template>

        <!-- CATEGORY: LIBRARY -->
        <template v-if="currentCategory === 'library'">
          <section
            v-if="showStoriesMigrationNotice"
            class="card grid gap-[1rem] p-6 border-[color-mix(in_srgb,#d2a133_42%,var(--border)_58%)]"
            style="background: radial-gradient(circle at top right, rgba(210,161,51,0.18), transparent 40%), linear-gradient(180deg, color-mix(in srgb, var(--surface) 94%, #fff3cf 6%) 0%, color-mix(in srgb, var(--surface) 88%, #ffe6a6 12%) 100%);"
          >
            <div class="flex items-start justify-between gap-4">
              <div class="grid gap-[0.3rem]">
                <span class="eyebrow text-[#9f6a00]">Stories Migration</span>
                <h2 class="m-0 text-[1.1rem]">This library may already use folders named stories</h2>
                <p class="m-0 text-muted">
                  Foldergram can now treat <code>stories/</code> as profile stories and highlights by default. Choose whether to keep legacy folder behavior or switch to the new reserved stories mode, then rescan the library.
                </p>
              </div>
              <button
                class="inline-flex h-9 w-9 items-center justify-center rounded-full border-0 bg-[rgba(159,106,0,0.08)] text-[#9f6a00] cursor-pointer transition-colors duration-180 hover:bg-[rgba(159,106,0,0.14)]"
                type="button"
                aria-label="Dismiss stories migration notice"
                @click="dismissStoriesMigrationNotice"
              >
                <span class="i-fluent-dismiss-20-filled h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <div class="flex flex-col md:flex-row items-center gap-3 max-sm:items-stretch">
              <button class="btn-primary min-w-[13rem]" type="button" :disabled="storiesModeActionBusy || !authStore.canManageLibrary" @click="openStoriesModeConfirm(false)">
                Use Stories Feature
              </button>
              <button
                class="inline-flex min-h-11 items-center justify-center rounded-[0.95rem] border border-border bg-transparent px-4 text-[0.92rem] font-semibold text-text transition-colors duration-180 hover:bg-surface-alt disabled:cursor-not-allowed disabled:opacity-60"
                type="button"
                :disabled="storiesModeActionBusy || !authStore.canManageLibrary"
                @click="openStoriesModeConfirm(true)"
              >
                Keep Legacy Behavior
              </button>
            </div>
            <p class="m-0 text-muted">{{ storiesModeActionHelper }}</p>
          </section>

          <section
            v-else-if="showStoriesAnnouncementCard"
            class="card grid gap-[1rem] border-[color-mix(in_srgb,var(--border)_84%,#8cc8ff_16%)] p-6"
            style="background: linear-gradient(135deg, color-mix(in srgb, var(--surface) 97%, #f7fbff 3%) 0%, color-mix(in srgb, var(--surface) 93%, #e6f3ff 7%) 100%);"
          >
            <div class="flex items-start justify-between gap-4">
              <div class="grid gap-[0.3rem]">
                <div class="flex items-center gap-2">
                  <h2 class="m-0 text-xl">Stories</h2>
                  <span class="eyebrow inline-flex w-fit self-start text-xs">New Feature</span>
                </div>
                <p class="m-0 text-[0.95rem] font-medium text-text">Reserved <code>stories/</code> folders can power App Folder stories</p>
                <p class="m-0 text-muted">
                  Drop direct media into <code>AppFolder/stories</code> for the avatar story set, and use direct child folders for highlight circles. Nested folders stay inside the same highlight capsule.
                  <button
                    class="ml-1 inline-flex border-0 bg-transparent p-0 text-[0.92em] font-semibold text-accent-strong underline underline-offset-[0.18em] cursor-pointer transition-opacity duration-180 hover:opacity-80"
                    type="button"
                    :aria-expanded="showStoriesAnnouncementStructure"
                    @click="toggleStoriesAnnouncementStructure"
                  >
                    {{ showStoriesAnnouncementStructure ? 'Hide directory structure' : 'See directory structure' }}
                  </button>
                </p>
              </div>
              <button
                class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-0 bg-[rgba(24,119,242,0.08)] text-accent-strong cursor-pointer transition-colors duration-180 hover:bg-[rgba(24,119,242,0.14)]"
                type="button"
                aria-label="Dismiss stories announcement"
                @click="dismissStoriesAnnouncement"
              >
                <span class="i-fluent-dismiss-20-filled h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <pre v-if="showStoriesAnnouncementStructure" class="m-0 overflow-x-auto rounded-[0.95rem] border border-border bg-[color-mix(in_srgb,var(--surface-alt)_82%,transparent_18%)] p-4 text-[0.78rem] leading-[1.55] text-muted"><code>gallery/
└─ AnimalPlanet/
   ├─ cover.jpg
   ├─ post-1.jpg
   └─ stories/
      ├─ story-1.mp4
      ├─ story-2.jpg
      ├─ Lions/
      │  ├─ clip-1.mp4
      │  └─ nested-1/
      │     └─ clip-2.jpg
      └─ Tigers/
         └─ tiger-1.jpg</code></pre>
          </section>

          <section class="card grid gap-[1.15rem] p-6">
            <div class="flex items-start justify-between gap-4 max-sm:flex-col max-sm:items-start">
              <div>
                <h2 class="m-0 text-[1.18rem]">Stories folders</h2>
                <p class="m-0 mt-[0.25rem] text-muted">
                  {{ storiesModeDescription }}
                </p>
              </div>
              <span class="inline-flex items-center justify-center min-h-8 px-[0.7rem] py-[0.35rem] rounded-full text-[0.76rem] font-bold whitespace-nowrap text-accent-strong bg-[color-mix(in_srgb,var(--accent-soft)_78%,transparent_22%)]">
                {{ storiesMode ? 'Legacy folders' : 'Reserved stories' }}
              </span>
            </div>

            <label class="flex items-start gap-3 rounded-[0.95rem] border border-border px-4 py-3 cursor-pointer">
              <input
                v-model="storiesMode"
                class="mt-[0.2rem]"
                type="checkbox"
                :disabled="storiesModeActionBusy || waitingForInitialStatus"
              />
              <span class="grid gap-[0.15rem]">
                <span class="text-[0.92rem] font-semibold text-text">Treat stories folders as normal app folders</span>
                <span class="text-[0.84rem] text-muted">{{ storiesModeLabelDescription }}</span>
              </span>
            </label>

            <div v-if="storiesModeFeedback" class="rounded-[0.95rem] px-4 py-3 text-[0.9rem]" :class="storiesModeFeedback.tone === 'error' ? 'border border-[rgba(214,48,49,0.24)] text-[#c0392b] bg-[rgba(214,48,49,0.08)]' : 'border border-[rgba(24,119,242,0.2)] text-accent-strong bg-[rgba(24,119,242,0.08)]'">
              {{ storiesModeFeedback.message }}
            </div>

            <div class="flex flex-col md:flex-row items-center gap-3 max-sm:items-stretch">
              <p class="m-0 flex-1 text-muted">{{ storiesModeActionNote }}</p>
              <button
                class="btn-primary min-w-[13rem]"
                type="button"
                :disabled="storiesModeActionDisabled"
                :style="{ cursor: storiesModeActionBusy ? 'wait' : storiesModeActionDisabled ? 'not-allowed' : undefined }"
                @click="openStoriesModeConfirm(storiesMode)"
              >
                {{ storiesModeButtonLabel }}
              </button>
            </div>
          </section>

          <section class="card grid gap-[1.15rem] p-6">
            <div class="flex items-start justify-between gap-4 max-sm:flex-col max-sm:items-start">
              <div>
                <h2 class="m-0 text-[1.18rem]">Feed Defaults</h2>
                <p class="m-0 mt-[0.25rem] text-muted">Choose what Home and Reels open with by default.</p>
              </div>
              <span class="inline-flex items-center justify-center min-h-8 px-[0.7rem] py-[0.35rem] rounded-full text-[0.76rem] font-bold whitespace-nowrap text-accent-strong bg-[color-mix(in_srgb,var(--accent-soft)_78%,transparent_22%)] max-sm:whitespace-normal">
                Home: {{ savedHomeFeedDefaultModeLabel }} · Reels: {{ savedReelsFeedDefaultModeLabel }}
              </span>
            </div>

            <div
              v-if="feedDefaultsFeedback"
              class="rounded-[0.95rem] px-4 py-3 text-[0.9rem]"
              :class="feedDefaultsFeedback.tone === 'error' ? 'border border-[rgba(214,48,49,0.24)] text-[#c0392b] bg-[rgba(214,48,49,0.08)]' : 'border border-[rgba(24,119,242,0.2)] text-accent-strong bg-[rgba(24,119,242,0.08)]'"
            >
              {{ feedDefaultsFeedback.message }}
            </div>

            <div class="grid gap-4 lg:grid-cols-2">
              <section class="grid gap-[0.75rem] rounded-[0.95rem] border border-border p-4">
                <div class="grid gap-[0.12rem]">
                  <h3 class="m-0 text-[0.98rem]">Home feed default</h3>
                  <p class="m-0 text-[0.82rem] text-muted">Choose the first feed mode shown on Home.</p>
                </div>

                <div class="grid gap-2">
                  <label
                    v-for="mode in homeFeedDefaultOptions"
                    :key="mode.id"
                    class="flex min-w-0 items-start gap-[0.55rem] rounded-[0.8rem] border border-border px-3 py-[0.7rem] cursor-pointer"
                  >
                    <input
                      v-model="homeFeedDefaultMode"
                      class="mt-[0.15rem]"
                      :name="HOME_FEED_DEFAULT_GROUP_NAME"
                      type="radio"
                      :value="mode.id"
                      :disabled="savingFeedDefaults || waitingForInitialStatus"
                    />
                    <span class="grid min-w-0 gap-[0.08rem]">
                      <span class="text-[0.86rem] font-semibold text-text">{{ mode.label }}</span>
                      <span class="overflow-hidden text-ellipsis whitespace-nowrap text-[0.74rem] text-muted">{{ mode.description }}</span>
                    </span>
                  </label>
                </div>
              </section>

              <section class="grid gap-[0.75rem] rounded-[0.95rem] border border-border p-4">
                <div class="grid gap-[0.12rem]">
                  <h3 class="m-0 text-[0.98rem]">Reels feed default</h3>
                  <p class="m-0 text-[0.82rem] text-muted">Choose the queue style used when Reels opens.</p>
                </div>

                <div class="grid gap-2">
                  <label
                    v-for="mode in reelsFeedDefaultOptions"
                    :key="mode.id"
                    class="flex min-w-0 items-start gap-[0.55rem] rounded-[0.8rem] border border-border px-3 py-[0.7rem] cursor-pointer"
                  >
                    <input
                      v-model="reelsFeedDefaultMode"
                      class="mt-[0.15rem]"
                      :name="REELS_FEED_DEFAULT_GROUP_NAME"
                      type="radio"
                      :value="mode.id"
                      :disabled="savingFeedDefaults || waitingForInitialStatus"
                    />
                    <span class="grid min-w-0 gap-[0.08rem]">
                      <span class="text-[0.86rem] font-semibold text-text">{{ mode.label }}</span>
                      <span class="overflow-hidden text-ellipsis whitespace-nowrap text-[0.74rem] text-muted">{{ mode.description }}</span>
                    </span>
                  </label>
                </div>
              </section>
            </div>

            <div class="flex flex-col md:flex-row items-center gap-3 max-sm:items-stretch">
              <p class="m-0 flex-1 text-muted">{{ feedDefaultsActionNote }}</p>
              <button class="btn-primary min-w-[13rem]" :style="feedDefaultsButtonStyle" type="button" :disabled="feedDefaultsSaveDisabled" @click="saveFeedDefaults">
                {{ feedDefaultsButtonLabel }}
              </button>
            </div>
          </section>

          <section class="card grid gap-[1.15rem] p-8">
            <div class="flex items-start justify-between gap-4 max-sm:flex-col max-sm:items-start">
              <div>
                <h2 class="m-0 text-[1.18rem]">Scan Library</h2>
                <p class="m-0 mt-[0.35rem] text-muted">Run a scan after adding folders or when you want to refresh indexed media.</p>
              </div>
              <span
                class="inline-flex items-center justify-center min-h-8 px-[0.7rem] py-[0.35rem] rounded-full text-[0.76rem] font-bold whitespace-nowrap"
                :class="{
                  'text-muted bg-surface-alt': statusTone === 'idle',
                  'text-accent-strong bg-[color-mix(in_srgb,var(--accent-soft)_78%,transparent_22%)]': statusTone === 'active',
                  'text-[#b76e00] bg-[rgba(242,164,30,0.14)]': statusTone === 'warning',
                  'text-[#c0392b] bg-[rgba(214,48,49,0.12)]': statusTone === 'danger',
                }"
              >{{ statusLabel }}</span>
            </div>

            <div class="flex flex-col md:flex-row items-center gap-4 max-sm:items-stretch mt-4">
              <p class="m-0 flex-1 text-muted">{{ scanActionNote }}</p>
              <button
                class="btn-primary min-w-[13rem]"
                type="button"
                :disabled="scanActionDisabled"
                @click="runManualScan"
              >
                {{ scanButtonLabel }}
              </button>
            </div>

            <p v-if="scanError" class="m-0 px-4 py-[0.85rem] border border-[rgba(214,48,49,0.24)] rounded-[0.9rem] text-[#c0392b] bg-[rgba(214,48,49,0.08)]">{{ scanError }}</p>
          </section>

          <section class="card grid gap-[1.15rem] p-8">
             <div class="flex items-start justify-between gap-4 max-sm:flex-col max-sm:items-start">
              <div>
                <h2 class="m-0 text-[1.18rem]">Regenerate Thumbnails</h2>
                <p class="m-0 mt-[0.35rem] text-muted">Rebuild feed and profile thumbnails plus video posters from indexed media only. Original files are not affected.</p>
              </div>
            </div>

            <div class="flex flex-col md:flex-row items-center gap-4 max-sm:items-stretch mt-4">
              <p class="m-0 flex-1 text-muted">{{ thumbnailRebuildActionNote }}</p>
              <button class="btn-primary min-w-[13rem]" type="button" :disabled="thumbnailRebuildActionDisabled" @click="confirmThumbnailRebuildOpen = true">
                {{ thumbnailRebuildButtonLabel }}
              </button>
            </div>
            
            <p v-if="thumbnailRebuildError" class="m-0 px-4 py-[0.85rem] border border-[rgba(214,48,49,0.24)] rounded-[0.9rem] text-[#c0392b] bg-[rgba(214,48,49,0.08)]">{{ thumbnailRebuildError }}</p>
          </section>

          <!-- Danger Zone -->
          <div class="border border-[rgba(214,48,49,0.3)] rounded-[1.05rem] overflow-hidden" :class="highlightRebuildAction ? 'ring-2 ring-[color-mix(in_srgb,var(--accent)_45%,transparent_55%)]' : ''">
            <div class="bg-[rgba(214,48,49,0.04)] px-6 py-4 border-b border-[rgba(214,48,49,0.1)] flex items-center justify-between">
              <h3 class="m-0 text-[1rem] text-[#c0392b] font-bold">Danger Zone</h3>
              <span
                v-if="appStore.isLibraryRebuildRequired"
                class="inline-flex items-center justify-center min-h-8 px-[0.7rem] py-[0.35rem] rounded-full text-[0.76rem] font-bold whitespace-nowrap text-[#9f6a00] bg-[rgba(210,161,51,0.14)]"
              >
                Recommended
              </span>
            </div>
            <div class="p-6 grid gap-[1.15rem] bg-surface">
              <div class="flex items-start justify-between gap-4 max-sm:flex-col max-sm:items-start">
                <div>
                  <h3 class="m-0 text-[1rem]">Rebuild Library Index</h3>
                  <p class="m-0 mt-[0.25rem] text-muted">Reset the library index, reuse matching cached media, and generate only missing derivatives from the current gallery root.</p>
                </div>
              </div>

              <dl class="grid gap-[0.8rem] m-0 mb-2">
                <div class="px-4 py-[0.85rem] rounded-[0.85rem] border border-border bg-surface-alt">
                  <dt class="m-0 mb-[0.25rem] text-muted text-[0.72rem] font-bold tracking-[0.08em] uppercase">Current gallery root</dt>
                  <dd class="m-0 text-[0.92rem] font-semibold break-all">{{ adminStats?.libraryIndex.currentGalleryRoot ?? 'Unavailable' }}</dd>
                </div>
                <div v-if="adminStats?.libraryIndex.previousGalleryRoot" class="px-4 py-[0.85rem] rounded-[0.85rem] border border-[#d2a133] bg-[rgba(210,161,51,0.04)]">
                  <dt class="m-0 mb-[0.25rem] text-[#b76e00] text-[0.72rem] font-bold tracking-[0.08em] uppercase">Previous gallery root</dt>
                  <dd class="m-0 text-[0.92rem] font-semibold break-all">{{ adminStats.libraryIndex.previousGalleryRoot }}</dd>
                </div>
              </dl>

              <div class="flex flex-col md:flex-row items-center gap-4 max-sm:items-stretch">
                <p class="m-0 flex-1 text-muted">{{ rebuildActionNote }}</p>
                <button class="btn-primary min-w-[13rem] bg-[#d93025] hover:bg-[#c5281c] border-transparent text-white" type="button" :disabled="rebuildActionDisabled" @click="confirmRebuildOpen = true">
                  {{ rebuildButtonLabel }}
                </button>
              </div>
              <p v-if="rebuildError" class="m-0 px-4 py-[0.85rem] border border-[rgba(214,48,49,0.24)] rounded-[0.9rem] text-[#c0392b] bg-[rgba(214,48,49,0.08)]">{{ rebuildError }}</p>
            </div>
          </div>
        </template>

        <!-- CATEGORY: STATUS -->
        <template v-if="currentCategory === 'status'">
          <section class="card grid gap-[1.15rem] p-8">
            <div class="flex items-start justify-between gap-4">
              <div>
                <h2 class="m-0 text-[1.18rem]">Library Status</h2>
                <p class="m-0 mt-[0.35rem] text-muted">Current storage and index state.</p>
              </div>
            </div>
            <dl class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 m-0 mt-4">
              <div class="flex flex-col gap-1 py-3 border-b border-border">
                <dt class="m-0 text-muted text-[0.76rem] font-bold tracking-[0.08em] uppercase">Storage</dt>
                <dd class="m-0 text-[1.45rem] font-medium tracking-tight" :class="appStore.isLibraryUnavailable ? 'text-[#c0392b]' : 'text-text'">{{ storageLabel }}</dd>
              </div>
              <div class="flex flex-col gap-1 py-3 border-b border-border">
                <dt class="m-0 text-muted text-[0.76rem] font-bold tracking-[0.08em] uppercase">Folders</dt>
                <dd class="m-0 text-[1.45rem] font-medium tracking-tight">{{ formatCount(appStore.stats?.folders ?? 0) }}</dd>
              </div>
              <div class="flex flex-col gap-1 py-3 border-b border-border md:border-b-0">
                <dt class="m-0 text-muted text-[0.76rem] font-bold tracking-[0.08em] uppercase">Indexed posts</dt>
                <dd class="m-0 text-[1.45rem] font-medium tracking-tight">{{ formatCount(appStore.stats?.indexedImages ?? 0) }}</dd>
              </div>
              <div class="flex flex-col gap-1 py-3 border-b-0">
                <dt class="m-0 text-muted text-[0.76rem] font-bold tracking-[0.08em] uppercase">Indexed videos</dt>
                <dd class="m-0 text-[1.45rem] font-medium tracking-tight">{{ formatCount(appStore.stats?.indexedVideos ?? 0) }}</dd>
              </div>
            </dl>
          </section>

          <section class="card grid gap-[1.15rem] p-8">
            <div class="flex items-start justify-between gap-4">
              <div>
                <h2 class="m-0 text-[1.18rem]">Last Scan</h2>
                <p class="m-0 mt-[0.35rem] text-muted">Most recent completed run tracked by the app.</p>
              </div>
            </div>
            <dl class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 m-0 mt-4">
              <div class="flex flex-col gap-1 py-3 border-b border-border">
                <dt class="m-0 text-muted text-[0.76rem] font-bold tracking-[0.08em] uppercase">Status</dt>
                <dd class="m-0 text-[1.2rem] font-medium tracking-tight capitalize">{{ lastScanStatus }}</dd>
              </div>
              <div class="flex flex-col gap-1 py-3 border-b border-border">
                <dt class="m-0 text-muted text-[0.76rem] font-bold tracking-[0.08em] uppercase">Finished</dt>
                <dd class="m-0 text-[1.2rem] font-medium tracking-tight">{{ lastScanFinishedAt }}</dd>
              </div>
              <div class="flex flex-col gap-1 py-3 border-b border-border md:border-b-0">
                <dt class="m-0 text-muted text-[0.76rem] font-bold tracking-[0.08em] uppercase">Files scanned</dt>
                <dd class="m-0 text-[1.45rem] font-medium tracking-tight">{{ formatCount(lastCompletedScan?.scanned_files ?? 0) }}</dd>
              </div>
              <div class="flex flex-col gap-1 py-3 border-b-0">
                <dt class="m-0 text-muted text-[0.76rem] font-bold tracking-[0.08em] uppercase">Changes</dt>
                <dd class="m-0 text-[1rem] font-medium leading-relaxed whitespace-pre-line">{{ lastScanChangeSummary }}</dd>
              </div>
            </dl>
          </section>
        </template>
      </div>
    </div>

    <!-- Dialogs -->
    <ConfirmDialog
      v-if="confirmRebuildOpen"
      title="Rebuild the current library index?"
      message="This will clear the indexed database tables for folders, posts, likes, and scan history, then rescan the active gallery root. Existing thumbnails and previews at the configured storage paths will be reused when their mirrored files already exist, and only missing derivatives will be generated. Original files in the gallery will not be deleted."
      confirm-label="Rebuild Library Index"
      loading-label="Rebuilding..."
      :loading="rebuilding"
      @cancel="confirmRebuildOpen = false"
      @confirm="runLibraryRebuild"
    />
    <ConfirmDialog
      v-if="confirmThumbnailRebuildOpen"
      title="Regenerate thumbnails only?"
      message="This will remove generated feed and profile thumbnails plus video poster images, then rebuild them from the current indexed library. Previews, likes, scan history, and indexed library records will not be changed. Original files in the gallery will not be deleted."
      confirm-label="Regenerate Thumbnails"
      loading-label="Regenerating..."
      :loading="rebuildingThumbnails"
      @cancel="confirmThumbnailRebuildOpen = false"
      @confirm="runThumbnailRebuild"
    />
    <ConfirmDialog
      v-if="confirmStoriesModeOpen"
      :title="storiesModeConfirmTitle"
      :message="storiesModeConfirmMessage"
      confirm-label="Save and Rescan"
      loading-label="Saving..."
      :loading="savingStoriesMode"
      @cancel="confirmStoriesModeOpen = false"
      @confirm="runStoriesModeSave"
    />
  </section>
</template>
<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import ConfirmDialog from '../components/ConfirmDialog.vue';
import { fetchAdminStats, triggerLibraryRebuild, triggerManualScan, triggerThumbnailRebuild, updateHomeFeedDefault, updateReelsFeedDefault, updateStoriesMode } from '../api/gallery';
import { useAppStore } from '../stores/app';
import { useAuthStore } from '../stores/auth';
import { useFeedStore } from '../stores/feed';
import { useFoldersStore } from '../stores/folders';
import { useLikesStore } from '../stores/likes';
import { useMomentsStore } from '../stores/moments';
import { useViewerStore } from '../stores/viewer';
import type { AppStats, FeedMode, ReelsFeedMode, ViewerAccessMode } from '../types/api';

const appStore = useAppStore();
const authStore = useAuthStore();
const feedStore = useFeedStore();
const foldersStore = useFoldersStore();
const likesStore = useLikesStore();
const momentsStore = useMomentsStore();
const viewerStore = useViewerStore();
const route = useRoute();
const currentCategory = ref<'library' | 'access' | 'status'>('library');
const scanError = ref<string | null>(null);
const rebuildError = ref<string | null>(null);
const thumbnailRebuildError = ref<string | null>(null);
const requestingScan = ref(false);
const rebuilding = ref(false);
const rebuildingThumbnails = ref(false);
const savingStoriesMode = ref(false);
const savingFeedDefaults = ref(false);
const confirmRebuildOpen = ref(false);
const confirmThumbnailRebuildOpen = ref(false);
const confirmStoriesModeOpen = ref(false);
const authFeedback = ref<{ tone: 'success' | 'error'; message: string } | null>(null);
const viewerFeedback = ref<{ tone: 'success' | 'error'; message: string } | null>(null);
const feedDefaultsFeedback = ref<{ tone: 'success' | 'error'; message: string } | null>(null);
const storiesModeFeedback = ref<{ tone: 'success' | 'error'; message: string } | null>(null);
const adminStats = ref<AppStats | null>(null);
const showChangePasswordForm = ref(false);
const showDisablePasswordForm = ref(false);
const enablePassword = ref('');
const enablePasswordConfirmation = ref('');
const currentPassword = ref('');
const nextPassword = ref('');
const nextPasswordConfirmation = ref('');
const disablePassword = ref('');
const homeFeedDefaultMode = ref<FeedMode>('random');
const reelsFeedDefaultMode = ref<ReelsFeedMode>('random');
const storiesMode = ref(false);
const feedDefaultsHydrated = ref(false);
const storiesModeHydrated = ref(false);
const pendingStoriesModeValue = ref<boolean | null>(null);
const showStoriesAnnouncementStructure = ref(false);
const viewerAccessMode = ref<ViewerAccessMode>(authStore.accessMode);
const viewerPassword = ref('');
const viewerPasswordConfirmation = ref('');
const SCAN_ERROR_NOTICE_STORAGE_KEY = 'foldergram-scan-error-notice-dismissal';
const IGNORED_ROOT_MEDIA_NOTICE_STORAGE_KEY = 'foldergram-ignored-root-media-notice-dismissal';
const NOTICE_DISMISS_MS = 7 * 24 * 60 * 60 * 1000;
const MIN_PASSWORD_LENGTH = 8;
const HOME_FEED_DEFAULT_GROUP_NAME = 'home-feed-default';
const REELS_FEED_DEFAULT_GROUP_NAME = 'reels-feed-default';
const STORIES_MIGRATION_NOTICE_STORAGE_KEY = 'foldergram-stories-migration-dismissed';
const STORIES_ANNOUNCEMENT_STORAGE_KEY = 'foldergram-stories-announcement-dismissed';

function loadDismissedScanErrorNotice(): { scanId: number; dismissedUntil: number } | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const rawValue = window.localStorage.getItem(SCAN_ERROR_NOTICE_STORAGE_KEY);
  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue) as { scanId?: unknown; dismissedUntil?: unknown };
    if (
      typeof parsed.scanId !== 'number' ||
      !Number.isFinite(parsed.scanId) ||
      typeof parsed.dismissedUntil !== 'number' ||
      !Number.isFinite(parsed.dismissedUntil)
    ) {
      return null;
    }

    return {
      scanId: parsed.scanId,
      dismissedUntil: parsed.dismissedUntil
    };
  } catch {
    return null;
  }
}

const dismissedScanErrorNotice = ref(loadDismissedScanErrorNotice());
const dismissedIgnoredRootMediaNotice = ref(loadDismissedIgnoredRootMediaNotice());
const dismissedStoriesMigrationNotice = ref(loadDismissedStoriesNotice(STORIES_MIGRATION_NOTICE_STORAGE_KEY));
const dismissedStoriesAnnouncement = ref(loadDismissedStoriesNotice(STORIES_ANNOUNCEMENT_STORAGE_KEY));

function wait(milliseconds: number) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

function formatCount(value: number) {
  return new Intl.NumberFormat().format(value);
}

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return 'Never';
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value));
}

function clearAuthFeedback() {
  authFeedback.value = null;
  authStore.clearError();
}

function clearViewerFeedback() {
  viewerFeedback.value = null;
  authStore.clearError();
}

function clearFeedDefaultsFeedback() {
  feedDefaultsFeedback.value = null;
}

function clearStoriesModeFeedback() {
  storiesModeFeedback.value = null;
}

function setAuthError(message: string) {
  authFeedback.value = {
    tone: 'error',
    message
  };
}

function setAuthSuccess(message: string) {
  authFeedback.value = {
    tone: 'success',
    message
  };
}

function setViewerError(message: string) {
  viewerFeedback.value = {
    tone: 'error',
    message
  };
}

function setViewerSuccess(message: string) {
  viewerFeedback.value = {
    tone: 'success',
    message
  };
}

function setFeedDefaultsFeedback(tone: 'success' | 'error', message: string) {
  feedDefaultsFeedback.value = {
    tone,
    message
  };
}

function resetChangePasswordFields() {
  currentPassword.value = '';
  nextPassword.value = '';
  nextPasswordConfirmation.value = '';
}

function resetDisablePasswordField() {
  disablePassword.value = '';
}

function toggleChangePasswordForm() {
  showChangePasswordForm.value = !showChangePasswordForm.value;
  if (!showChangePasswordForm.value) {
    resetChangePasswordFields();
  }
}

function toggleDisablePasswordForm() {
  showDisablePasswordForm.value = !showDisablePasswordForm.value;
  if (!showDisablePasswordForm.value) {
    resetDisablePasswordField();
  }
}

function validatePasswordConfirmation(password: string, confirmation: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }

  if (password.trim().length === 0) {
    return 'Password cannot be empty.';
  }

  if (password !== confirmation) {
    return 'The password confirmation does not match.';
  }

  return null;
}

function syncFeedDefaultsFromSaved() {
  homeFeedDefaultMode.value = appStore.defaultHomeFeedMode;
  reelsFeedDefaultMode.value = appStore.defaultReelsFeedMode;
  feedDefaultsHydrated.value = true;
}

function syncStoriesModeFromSaved() {
  storiesMode.value = appStore.treatStoriesAsFolders;
  storiesModeHydrated.value = true;
}

const scan = computed(() => appStore.stats?.scan ?? null);
const lastCompletedScan = computed(() => scan.value?.lastCompletedScan ?? adminStats.value?.lastScan ?? null);
const activeScanReason = computed(() => scan.value?.scanReason ?? null);
const homeFeedDefaultOptions: Array<{ id: FeedMode; label: string; description: string }> = [
  {
    id: 'random',
    label: 'Random',
    description: 'Steady shuffle.'
  },
  {
    id: 'recent',
    label: 'Recent',
    description: 'Newest first.'
  },
  {
    id: 'rediscover',
    label: 'Rediscover',
    description: 'Bring older picks back.'
  }
];
const reelsFeedDefaultOptions: Array<{ id: ReelsFeedMode; label: string; description: string }> = [
  {
    id: 'random',
    label: 'Random',
    description: 'Stable session shuffle.'
  },
  {
    id: 'recent',
    label: 'Recent',
    description: 'Newest videos first.'
  },
  {
    id: 'recommended',
    label: 'Recommended',
    description: 'Affinity-ranked mix.'
  }
];
const isLibraryRebuildActive = computed(
  () => rebuilding.value || (appStore.isScanning && activeScanReason.value === 'rebuild')
);
const isThumbnailRebuildActive = computed(
  () => rebuildingThumbnails.value || (appStore.isScanning && activeScanReason.value === 'rebuild-thumbnails')
);
const isRebuildOperationActive = computed(() => isLibraryRebuildActive.value || isThumbnailRebuildActive.value);
const scanProgressActive = computed(() => requestingScan.value || Boolean(scan.value?.isScanning && !isRebuildOperationActive.value));
const highlightRebuildAction = computed(() => route.query.action === 'rebuild');
const waitingForInitialStatus = computed(() => !appStore.stats || appStore.loadingStats);
const savedHomeFeedDefaultMode = computed(() => appStore.defaultHomeFeedMode);
const savedReelsFeedDefaultMode = computed(() => appStore.defaultReelsFeedMode);
const savedStoriesMode = computed(() => appStore.treatStoriesAsFolders);
const storiesModeRequiresDecision = computed(() => appStore.stats?.storiesMigration.decisionPending === true);
const savedHomeFeedDefaultModeLabel = computed(
  () => homeFeedDefaultOptions.find((mode) => mode.id === savedHomeFeedDefaultMode.value)?.label ?? 'Random'
);
const savedReelsFeedDefaultModeLabel = computed(
  () => reelsFeedDefaultOptions.find((mode) => mode.id === savedReelsFeedDefaultMode.value)?.label ?? 'Random'
);
const homeFeedDefaultDirty = computed(
  () => feedDefaultsHydrated.value && homeFeedDefaultMode.value !== savedHomeFeedDefaultMode.value
);
const reelsFeedDefaultDirty = computed(
  () => feedDefaultsHydrated.value && reelsFeedDefaultMode.value !== savedReelsFeedDefaultMode.value
);
const feedDefaultsDirty = computed(() => homeFeedDefaultDirty.value || reelsFeedDefaultDirty.value);
const storiesModeDirty = computed(() => storiesModeHydrated.value && storiesMode.value !== savedStoriesMode.value);
const feedDefaultsSaveDisabled = computed(
  () => waitingForInitialStatus.value || savingFeedDefaults.value || !feedDefaultsDirty.value
);
const storiesModeActionBusy = computed(
  () => savingStoriesMode.value || requestingScan.value || rebuilding.value || rebuildingThumbnails.value || appStore.isScanning
);
const storiesModeActionDisabled = computed(
  () =>
    waitingForInitialStatus.value ||
    appStore.isLibraryUnavailable ||
    storiesModeActionBusy.value ||
    (!storiesModeDirty.value && !storiesModeRequiresDecision.value)
);
const feedDefaultsButtonLabel = computed(() => {
  if (savingFeedDefaults.value) {
    return 'Saving...';
  }

  return feedDefaultsDirty.value ? 'Save Feed Defaults' : 'Saved';
});
const storiesModeButtonLabel = computed(() => {
  if (savingStoriesMode.value) {
    return 'Saving...';
  }

  if (storiesModeDirty.value || storiesModeRequiresDecision.value) {
    return 'Save and Rescan';
  }

  return 'Saved';
});
const feedDefaultsButtonStyle = computed(() =>
  feedDefaultsSaveDisabled.value ? { cursor: savingFeedDefaults.value ? 'wait' : 'not-allowed' } : undefined
);
const feedDefaultsActionNote = computed(() => {
  if (waitingForInitialStatus.value) {
    return 'Loading the current app preference...';
  }

  if (homeFeedDefaultDirty.value && reelsFeedDefaultDirty.value) {
    return 'Save both updates together. Home visitors can still switch modes on the homepage; Reels stays app-default only.';
  }

  if (homeFeedDefaultDirty.value) {
    return 'This updates the first feed mode shown on Home for this app. Visitors can still switch modes from the homepage.';
  }

  if (reelsFeedDefaultDirty.value) {
    return 'This updates the queue style used when Reels opens for this app. Visitors cannot switch modes from the reels page.';
  }

  return 'These are the current app-wide defaults for Home and Reels.';
});
const storiesModeDescription = computed(() =>
  storiesMode.value
    ? 'Folders named stories behave like ordinary app folders across the app.'
    : 'Folders named stories become profile stories/highlights instead of standalone app folders.'
);
const storiesModeLabelDescription = computed(() =>
  storiesMode.value
    ? 'Legacy mode is enabled. stories folders remain ordinary app folders everywhere.'
    : 'Reserved stories mode is enabled. AppFolder/stories powers avatar stories and highlight circles.'
);
const storiesModeActionNote = computed(() => {
  if (waitingForInitialStatus.value) {
    return 'Loading the current stories folders mode...';
  }

  if (appStore.isLibraryUnavailable) {
    return appStore.libraryUnavailableReason;
  }

  if (storiesModeActionBusy.value) {
    return 'Wait for the current library task to finish first.';
  }

  if (storiesModeRequiresDecision.value) {
    return 'Save your choice and rescan so the indexed folder structure matches the stories mode.';
  }

  if (storiesModeDirty.value) {
    return 'Changing this setting requires a rescan because stories paths are reinterpreted.';
  }

  return 'Reserved stories mode is the default. Enable legacy mode only if you rely on normal app folders literally named stories.';
});
const storiesModeActionHelper = computed(() => {
  if (!authStore.canManageLibrary) {
    return 'An admin session needs to confirm the stories folder mode and run the rescan.';
  }

  if (storiesModeActionBusy.value) {
    return 'Wait for the current library task to finish first.';
  }

  return 'This saves the setting immediately and starts a full rescan so the library reflects the chosen mode.';
});
const showStoriesMigrationNotice = computed(
  () =>
    appStore.stats?.storiesMigration.hasLegacyStoriesCandidates === true &&
    appStore.stats?.storiesMigration.decisionPending === true &&
    !dismissedStoriesMigrationNotice.value
);
const showStoriesAnnouncementCard = computed(
  () =>
    appStore.stats?.storiesMigration.hasLegacyStoriesCandidates === false &&
    appStore.stats?.storiesMigration.decisionPending === true &&
    !dismissedStoriesAnnouncement.value
);
const storiesModeConfirmTarget = computed(() => pendingStoriesModeValue.value ?? storiesMode.value);
const storiesModeConfirmTitle = computed(() =>
  storiesModeConfirmTarget.value
    ? 'Treat stories folders as normal app folders?'
    : 'Enable reserved stories folders?'
);
const storiesModeConfirmMessage = computed(() =>
  storiesModeConfirmTarget.value
    ? 'This will keep folders named stories behaving like normal app folders everywhere in the app. A rescan will start immediately because the indexed folder structure may change.'
    : 'This will reserve AppFolder/stories for avatar stories and highlight capsules by default. A rescan will start immediately because the indexed folder structure may change.'
);
const scanActionDisabled = computed(
  () =>
    waitingForInitialStatus.value ||
    appStore.isLibraryUnavailable ||
    appStore.isLibraryRebuildRequired ||
    appStore.isScanning ||
    requestingScan.value ||
    rebuilding.value ||
    rebuildingThumbnails.value
);
const rebuildActionDisabled = computed(
  () =>
    waitingForInitialStatus.value ||
    appStore.isLibraryUnavailable ||
    appStore.isScanning ||
    requestingScan.value ||
    rebuilding.value ||
    rebuildingThumbnails.value
);
const thumbnailRebuildActionDisabled = computed(
  () =>
    waitingForInitialStatus.value ||
    appStore.isLibraryUnavailable ||
    appStore.isLibraryRebuildRequired ||
    appStore.isScanning ||
    requestingScan.value ||
    rebuilding.value ||
    rebuildingThumbnails.value
);
const rebuildCardStyle = computed(() =>
  appStore.isLibraryRebuildRequired
    ? 'background: radial-gradient(circle at top right, rgba(210,161,51,0.2), transparent 42%), linear-gradient(180deg, var(--surface) 0%, color-mix(in srgb, var(--surface) 88%, #fff3c3 12%) 100%);'
    : 'background: linear-gradient(180deg, color-mix(in srgb, var(--surface) 96%, var(--accent) 4%) 0%, var(--surface) 100%);'
);
const statusTone = computed(() => {
  if (appStore.isLibraryUnavailable) {
    return 'danger';
  }

  if (scanProgressActive.value || isRebuildOperationActive.value) {
    return 'active';
  }

  if (lastCompletedScan.value?.status === 'completed_with_errors') {
    return 'warning';
  }

  return 'idle';
});
const statusLabel = computed(() => {
  if (appStore.isLibraryUnavailable) {
    return 'Storage unavailable';
  }

  if (scanProgressActive.value) {
    return 'Scan in progress';
  }

  if (isRebuildOperationActive.value) {
    return 'Rebuild active';
  }

  return 'Ready';
});
const scanButtonLabel = computed(() => {
  if (scanProgressActive.value) {
    return 'Scanning library...';
  }

  return 'Run Scan Library';
});
const scanActionNote = computed(() => {
  if (waitingForInitialStatus.value) {
    return 'Loading current library status...';
  }

  if (appStore.isLibraryUnavailable) {
    return appStore.libraryUnavailableReason;
  }

  if (appStore.isLibraryRebuildRequired) {
    return 'Rebuild the library index first because the gallery location changed.';
  }

  if (isRebuildOperationActive.value) {
    return 'Another library task is running. Live progress appears in the sticky status bar.';
  }

  if (scanProgressActive.value) {
    return 'Live progress appears in the sticky status bar.';
  }

  return 'Scans check for added, updated, or missing media.';
});
const rebuildButtonLabel = computed(() => {
  if (isLibraryRebuildActive.value) {
    return 'Rebuilding now...';
  }

  return 'Rebuild Library Index';
});
const thumbnailRebuildButtonLabel = computed(() => {
  if (isThumbnailRebuildActive.value) {
    return 'Regenerating now...';
  }

  return 'Regenerate Thumbnails';
});
const rebuildActionNote = computed(() => {
  if (waitingForInitialStatus.value) {
    return 'Loading current library status...';
  }

  if (appStore.isLibraryUnavailable) {
    return appStore.libraryUnavailableReason;
  }

  if (isLibraryRebuildActive.value) {
    return 'Live progress appears in the sticky status bar.';
  }

  if (isThumbnailRebuildActive.value) {
    return 'Wait for thumbnail regeneration to finish first.';
  }

  if (appStore.isScanning) {
    return 'Wait for the current scan to finish first.';
  }

  if (appStore.isLibraryRebuildRequired) {
    return 'Recommended because the gallery location changed.';
  }

  return 'Use this to reset the index and reuse any existing derivatives at the current storage paths.';
});
const thumbnailRebuildActionNote = computed(() => {
  if (waitingForInitialStatus.value) {
    return 'Loading current library status...';
  }

  if (appStore.isLibraryUnavailable) {
    return appStore.libraryUnavailableReason;
  }

  if (appStore.isLibraryRebuildRequired) {
    return 'Unavailable until the library index is rebuilt for the new gallery location.';
  }

  if (isThumbnailRebuildActive.value) {
    return 'Live progress appears in the sticky status bar.';
  }

  if (isLibraryRebuildActive.value) {
    return 'Wait for the full rebuild to finish first.';
  }

  if (appStore.isScanning) {
    return 'Wait for the current scan to finish first.';
  }

  return 'Use this for a faster thumbnail-only refresh.';
});
const authProtectionDescription = computed(() =>
  authStore.enabled
    ? 'Admin protection is active for this browser session. Use the controls below to rotate the admin password, configure viewer access, sign out, or turn protection off again.'
    : 'Protection is currently off. Anyone who can reach this app on your network can browse the library with full local access until you enable an admin password.'
);
const viewerAccessActive = computed(() => authStore.enabled && authStore.accessMode !== 'off');
const viewerAccessEnabled = computed(() => authStore.enabled && authStore.accessMode === 'password');
const viewerAccessStatusLabel = computed(() => {
  if (!authStore.enabled) {
    return 'Admin Password Off';
  }

  if (authStore.accessMode === 'password') {
    return 'Viewer Password On';
  }

  if (authStore.accessMode === 'public') {
    return 'Public Viewer On';
  }

  return 'Admin Only';
});
const viewerAccessStatusTone = computed(() => {
  if (!authStore.enabled) {
    return 'text-muted bg-surface-alt';
  }

  if (authStore.accessMode === 'password') {
    return 'text-accent-strong bg-[color-mix(in_srgb,var(--accent-soft)_78%,transparent_22%)]';
  }

  if (authStore.accessMode === 'public') {
    return 'text-[#0f766e] bg-[rgba(15,118,110,0.12)]';
  }

  return 'text-muted bg-surface-alt';
});
const viewerAccessSummaryTitle = computed(() => {
  if (!authStore.enabled) {
    return 'Enable the admin password first';
  }

  if (authStore.accessMode === 'password') {
    return 'Viewer password access is enabled';
  }

  if (authStore.accessMode === 'public') {
    return 'Public viewer access is enabled';
  }

  return 'Viewer access is currently off';
});
const viewerAccessSummary = computed(() => {
  if (!authStore.enabled) {
    return 'Viewer access settings become available after the admin password is enabled.';
  }

  if (authStore.accessMode === 'password') {
    return 'Viewers can sign in with the separate viewer password, use shared likes, and browse without admin controls. To replace that password, enter a new one below. The current viewer password is not required.';
  }

  if (authStore.accessMode === 'public') {
    return 'Anyone who can reach this Foldergram can browse without logging in. Favorites stay in the current browser only, and admins can elevate from More with the admin password.';
  }

  return 'Only the admin password can unlock the app right now. Turn on viewer password mode below if you want a browsing-only login.';
});
const viewerAccessDescription = computed(() => {
  if (viewerAccessMode.value === 'password') {
    return viewerAccessEnabled.value
      ? 'Enter a new viewer password below to rotate it. You do not need the current viewer password.'
      : 'Viewer logins get shared likes but cannot reach Settings, Trash, or any destructive action.';
  }

  if (viewerAccessMode.value === 'public') {
    return 'Anonymous visitors can browse immediately, use browser-local favorites, and unlock admin access from More when needed.';
  }

  return authStore.accessMode === 'password'
    ? 'Saving this will turn off viewer logins and return the app to admin-only access.'
    : authStore.accessMode === 'public'
      ? 'Saving this will disable public browsing and return the app to admin-only access.'
    : 'Viewer access is currently off, so only the admin password can unlock the app.';
});
const viewerAccessButtonLabel = computed(() => {
  if (viewerAccessMode.value === 'password') {
    return viewerAccessEnabled.value ? 'Update Viewer Password' : 'Enable Viewer Access';
  }

  if (viewerAccessMode.value === 'public') {
    return authStore.accessMode === 'public' ? 'Save Public Access' : 'Enable Public Access';
  }

  return authStore.accessMode === 'password' || authStore.accessMode === 'public' ? 'Disable Viewer Access' : 'Save Viewer Access';
});
const storageLabel = computed(() => (appStore.isLibraryUnavailable ? 'Unavailable' : 'Available'));
const lastScanStatus = computed(() => {
  if (!lastCompletedScan.value) {
    return 'No completed scans yet';
  }

  return lastCompletedScan.value.status.replaceAll('_', ' ');
});
const lastScanFinishedAt = computed(() => formatDateTime(lastCompletedScan.value?.finished_at));
const lastScanChangeSummary = computed(() => {
  if (!lastCompletedScan.value) {
    return '0 new\n0 updated\n0 removed';
  }

  return `${lastCompletedScan.value.new_files} new\n${lastCompletedScan.value.updated_files} updated\n${lastCompletedScan.value.removed_files} removed`;
});
const showScanErrorNotice = computed(() => {
  if (appStore.isLibraryUnavailable || appStore.isScanning) {
    return false;
  }

  if (lastCompletedScan.value?.status !== 'completed_with_errors') {
    return false;
  }

  const dismissed = dismissedScanErrorNotice.value;
  if (!dismissed) {
    return true;
  }

  if (dismissed.scanId !== lastCompletedScan.value.id) {
    return true;
  }

  return Date.now() >= dismissed.dismissedUntil;
});
const ignoredRootMediaCount = computed(() => appStore.stats?.libraryIndex.ignoredRootMediaCount ?? 0);
const showIgnoredRootMediaNotice = computed(() => {
  if (appStore.isLibraryUnavailable || (appStore.stats?.folders ?? 0) === 0 || ignoredRootMediaCount.value === 0) {
    return false;
  }

  const dismissed = dismissedIgnoredRootMediaNotice.value;
  if (!dismissed) {
    return true;
  }

  const currentGalleryRoot = adminStats.value?.libraryIndex.currentGalleryRoot ?? '';
  if (dismissed.galleryRoot !== currentGalleryRoot) {
    return true;
  }

  if (dismissed.ignoredRootMediaCount !== ignoredRootMediaCount.value) {
    return true;
  }

  return Date.now() >= dismissed.dismissedUntil;
});
const scanErrorNoticeMessage = computed(() => {
  return 'Some media failed during the last run. Scan the library again to retry any missed files and derivative generation.';
});
const ignoredRootMediaNoticeMessage = computed(() => {
  const supportedFileLabel = ignoredRootMediaCount.value === 1 ? 'supported file is' : 'supported files are';
  return `${formatCount(ignoredRootMediaCount.value)} ${supportedFileLabel} being ignored in the gallery root. Move them into a folder inside your gallery root to create App Folders. Files placed directly in the gallery root are ignored.`;
});

function dismissScanErrorNotice() {
  const scanId = lastCompletedScan.value?.id;
  if (!scanId) {
    return;
  }

  const nextDismissal = {
    scanId,
    dismissedUntil: Date.now() + NOTICE_DISMISS_MS
  };

  dismissedScanErrorNotice.value = nextDismissal;
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(SCAN_ERROR_NOTICE_STORAGE_KEY, JSON.stringify(nextDismissal));
  }
}

function loadDismissedIgnoredRootMediaNotice(): { galleryRoot: string; ignoredRootMediaCount: number; dismissedUntil: number } | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const rawValue = window.localStorage.getItem(IGNORED_ROOT_MEDIA_NOTICE_STORAGE_KEY);
  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue) as {
      galleryRoot?: unknown;
      ignoredRootMediaCount?: unknown;
      dismissedUntil?: unknown;
    };
    if (
      typeof parsed.galleryRoot !== 'string' ||
      typeof parsed.ignoredRootMediaCount !== 'number' ||
      !Number.isFinite(parsed.ignoredRootMediaCount) ||
      typeof parsed.dismissedUntil !== 'number' ||
      !Number.isFinite(parsed.dismissedUntil)
    ) {
      return null;
    }

    return {
      galleryRoot: parsed.galleryRoot,
      ignoredRootMediaCount: parsed.ignoredRootMediaCount,
      dismissedUntil: parsed.dismissedUntil
    };
  } catch {
    return null;
  }
}

function dismissIgnoredRootMediaNotice() {
  const currentGalleryRoot = adminStats.value?.libraryIndex.currentGalleryRoot;
  if (!currentGalleryRoot || ignoredRootMediaCount.value === 0) {
    return;
  }

  const nextDismissal = {
    galleryRoot: currentGalleryRoot,
    ignoredRootMediaCount: ignoredRootMediaCount.value,
    dismissedUntil: Date.now() + NOTICE_DISMISS_MS
  };

  dismissedIgnoredRootMediaNotice.value = nextDismissal;
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(IGNORED_ROOT_MEDIA_NOTICE_STORAGE_KEY, JSON.stringify(nextDismissal));
  }
}

function loadDismissedStoriesNotice(storageKey: string): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return window.localStorage.getItem(storageKey) === '1';
}

function dismissStoriesMigrationNotice() {
  dismissedStoriesMigrationNotice.value = true;
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORIES_MIGRATION_NOTICE_STORAGE_KEY, '1');
  }
}

function dismissStoriesAnnouncement() {
  dismissedStoriesAnnouncement.value = true;
  showStoriesAnnouncementStructure.value = false;
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORIES_ANNOUNCEMENT_STORAGE_KEY, '1');
  }
}

function toggleStoriesAnnouncementStructure() {
  showStoriesAnnouncementStructure.value = !showStoriesAnnouncementStructure.value;
}

async function enableAccessProtection() {
  if (authStore.loading) {
    return;
  }

  clearAuthFeedback();
  clearViewerFeedback();
  const validationError = validatePasswordConfirmation(enablePassword.value, enablePasswordConfirmation.value);
  if (validationError) {
    setAuthError(validationError);
    return;
  }

  try {
    await authStore.enablePassword(enablePassword.value);
    enablePassword.value = '';
    enablePasswordConfirmation.value = '';
    setAuthSuccess('The admin password is now enabled for this Foldergram instance.');
  } catch (error) {
    setAuthError(error instanceof Error ? error.message : 'Unable to enable the admin password.');
  }
}

async function changeAccessPassword() {
  if (authStore.loading) {
    return;
  }

  clearAuthFeedback();
  clearViewerFeedback();
  if (currentPassword.value.length === 0) {
    setAuthError('Enter the current password to change it.');
    return;
  }

  const validationError = validatePasswordConfirmation(nextPassword.value, nextPasswordConfirmation.value);
  if (validationError) {
    setAuthError(validationError);
    return;
  }

  try {
    await authStore.changePassword(currentPassword.value, nextPassword.value);
    resetChangePasswordFields();
    showChangePasswordForm.value = false;
    setAuthSuccess('The admin password was updated and existing sessions were invalidated.');
  } catch (error) {
    setAuthError(error instanceof Error ? error.message : 'Unable to change the admin password.');
  }
}

async function disableAccessProtection() {
  if (authStore.loading) {
    return;
  }

  clearAuthFeedback();
  clearViewerFeedback();
  if (disablePassword.value.length === 0) {
    setAuthError('Enter the current password to disable protection.');
    return;
  }

  try {
    await authStore.disablePassword(disablePassword.value);
    resetDisablePasswordField();
    resetChangePasswordFields();
    showChangePasswordForm.value = false;
    showDisablePasswordForm.value = false;
    viewerAccessMode.value = 'off';
    viewerPassword.value = '';
    viewerPasswordConfirmation.value = '';
    setAuthSuccess('The admin password has been disabled.');
  } catch (error) {
    setAuthError(error instanceof Error ? error.message : 'Unable to disable the admin password.');
  }
}

async function saveViewerAccess() {
  if (authStore.loading || !authStore.enabled) {
    return;
  }

  clearAuthFeedback();
  clearViewerFeedback();

  if (viewerAccessMode.value === 'password') {
    const validationError = validatePasswordConfirmation(viewerPassword.value, viewerPasswordConfirmation.value);
    if (validationError) {
      setViewerError(validationError);
      return;
    }
  }

  try {
    await authStore.configureViewerAccess(
      viewerAccessMode.value,
      viewerAccessMode.value === 'password' ? viewerPassword.value : undefined
    );
    viewerPassword.value = '';
    viewerPasswordConfirmation.value = '';
    setViewerSuccess(
      viewerAccessMode.value === 'password'
        ? 'Viewer password access is enabled. The viewer password was saved.'
        : viewerAccessMode.value === 'public'
          ? 'Public viewer access is enabled. Anonymous visitors can now browse with browser-local favorites.'
        : 'Viewer access has been turned off. Only admin logins are allowed now.'
    );
  } catch (error) {
    setViewerError(error instanceof Error ? error.message : 'Unable to update viewer access.');
  }
}

async function signOut() {
  if (authStore.loading) {
    return;
  }

  clearAuthFeedback();

  try {
    await authStore.logout();
  } catch (error) {
    setAuthError(error instanceof Error ? error.message : 'Unable to sign out.');
  }
}

async function saveFeedDefaults() {
  if (feedDefaultsSaveDisabled.value) {
    return;
  }

  const shouldSaveHome = homeFeedDefaultDirty.value;
  const shouldSaveReels = reelsFeedDefaultDirty.value;

  savingFeedDefaults.value = true;
  clearFeedDefaultsFeedback();

  try {
    if (shouldSaveHome) {
      const payload = await updateHomeFeedDefault(homeFeedDefaultMode.value);
      if (appStore.stats) {
        appStore.stats.preferences.defaultHomeFeedMode = payload.defaultMode;
      }
      homeFeedDefaultMode.value = payload.defaultMode;
    }

    if (shouldSaveReels) {
      const payload = await updateReelsFeedDefault(reelsFeedDefaultMode.value);
      if (appStore.stats) {
        appStore.stats.preferences.defaultReelsFeedMode = payload.defaultMode;
      }
      reelsFeedDefaultMode.value = payload.defaultMode;
    }

    await appStore.fetchStats({ background: true });

    if (shouldSaveHome && shouldSaveReels) {
      setFeedDefaultsFeedback('success', 'Home and Reels defaults were updated.');
    } else if (shouldSaveHome) {
      setFeedDefaultsFeedback(
        'success',
        `The homepage now opens with ${homeFeedDefaultOptions.find((mode) => mode.id === homeFeedDefaultMode.value)?.label ?? 'Random'}.`
      );
    } else {
      setFeedDefaultsFeedback(
        'success',
        `Reels now opens with ${reelsFeedDefaultOptions.find((mode) => mode.id === reelsFeedDefaultMode.value)?.label ?? 'Random'}.`
      );
    }
  } catch (error) {
    await appStore.fetchStats({ background: true }).catch(() => {});
    setFeedDefaultsFeedback('error', error instanceof Error ? error.message : 'Unable to update the feed defaults.');
  } finally {
    savingFeedDefaults.value = false;
  }
}

function openStoriesModeConfirm(value: boolean) {
  if (!authStore.canManageLibrary) {
    return;
  }

  clearStoriesModeFeedback();
  storiesMode.value = value;
  pendingStoriesModeValue.value = value;
  confirmStoriesModeOpen.value = true;
}

async function warmScanStatus() {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    await wait(attempt === 0 ? 150 : 250);

    try {
      await appStore.fetchStats({ background: true });
    } catch {
      // The rescan request may win the race; keep polling until scan state flips or the request finishes.
    }

    if (appStore.stats?.scan.isScanning) {
      return;
    }
  }
}

async function loadAdminStats() {
  adminStats.value = await fetchAdminStats();
}

async function runStoriesModeSave() {
  if (!authStore.canManageLibrary || appStore.isLibraryUnavailable) {
    return;
  }

  const targetValue = pendingStoriesModeValue.value ?? storiesMode.value;
  let savedSetting = false;

  savingStoriesMode.value = true;
  clearStoriesModeFeedback();
  confirmStoriesModeOpen.value = false;

  try {
    const payload = await updateStoriesMode(targetValue);
    savedSetting = true;
    storiesMode.value = payload.treatStoriesAsFolders;

    if (appStore.stats) {
      appStore.stats.preferences.treatStoriesAsFolders = payload.treatStoriesAsFolders;
      appStore.stats.storiesMigration.decisionPending = false;
    }

    const request = triggerManualScan();
    void warmScanStatus();
    await request;
    await appStore.fetchStats({ background: true });
    await loadAdminStats().catch(() => {});
    await Promise.all([
      foldersStore.fetchFolders(true),
      feedStore.loadInitial(true),
      likesStore.initialize(true),
      momentsStore.fetchMoments(true)
    ]);

    storiesModeFeedback.value = {
      tone: 'success',
      message: targetValue
        ? 'stories folders now behave like normal app folders. The library was rescanned.'
        : 'Reserved stories folders are now active. The library was rescanned.'
    };
  } catch (error) {
    await appStore.fetchStats({ background: true }).catch(() => {});
    await loadAdminStats().catch(() => {});
    storiesModeFeedback.value = {
      tone: 'error',
      message: savedSetting
        ? error instanceof Error
          ? `The stories folders setting was saved, but the rescan failed: ${error.message}`
          : 'The stories folders setting was saved, but the rescan failed.'
        : error instanceof Error
          ? error.message
          : 'Unable to update the stories folders setting.'
    };
  } finally {
    pendingStoriesModeValue.value = null;
    savingStoriesMode.value = false;
  }
}

async function runManualScan() {
  if (scanActionDisabled.value) {
    return;
  }

  requestingScan.value = true;
  scanError.value = null;

  try {
    const request = triggerManualScan();
    void warmScanStatus();
    await request;
    await appStore.fetchStats({ background: true });
    await loadAdminStats().catch(() => {});
    await Promise.all([foldersStore.fetchFolders(true), feedStore.loadInitial(true)]);
  } catch (error) {
    scanError.value = error instanceof Error ? error.message : 'Unable to start a library scan.';
  } finally {
    requestingScan.value = false;
  }
}

async function runLibraryRebuild() {
  if (rebuildActionDisabled.value) {
    return;
  }

  rebuilding.value = true;
  rebuildError.value = null;
  confirmRebuildOpen.value = false;
  appStore.markLibraryRebuildStarted();
  feedStore.resetForRebuild();
  foldersStore.resetForRebuild();
  likesStore.resetForRebuild();
  momentsStore.resetForRebuild();
  viewerStore.reset();

  try {
    const request = triggerLibraryRebuild();
    void warmScanStatus();
    await request;
    await appStore.fetchStats({ background: true });
    await loadAdminStats().catch(() => {});
    await Promise.all([
      foldersStore.fetchFolders(true),
      feedStore.loadInitial(true),
      likesStore.initialize(true),
      momentsStore.fetchMoments(true)
    ]);
  } catch (error) {
    rebuildError.value = error instanceof Error ? error.message : 'Unable to rebuild the current library index.';
    await appStore.fetchStats({ background: true });
    await loadAdminStats().catch(() => {});
  } finally {
    rebuilding.value = false;
  }
}

async function runThumbnailRebuild() {
  if (thumbnailRebuildActionDisabled.value) {
    return;
  }

  rebuildingThumbnails.value = true;
  thumbnailRebuildError.value = null;
  confirmThumbnailRebuildOpen.value = false;

  try {
    const request = triggerThumbnailRebuild();
    void warmScanStatus();
    await request;
    await appStore.fetchStats({ background: true });
    await loadAdminStats().catch(() => {});
    await Promise.all([
      foldersStore.fetchFolders(true),
      feedStore.loadInitial(true),
      likesStore.initialize(true),
      momentsStore.fetchMoments(true)
    ]);
  } catch (error) {
    thumbnailRebuildError.value = error instanceof Error ? error.message : 'Unable to regenerate thumbnails.';
    await appStore.fetchStats({ background: true });
    await loadAdminStats().catch(() => {});
  } finally {
    rebuildingThumbnails.value = false;
  }
}

onMounted(async () => {
  if (!appStore.stats && !appStore.loadingStats) {
    await appStore.fetchStats();
  }

  if (appStore.stats) {
    syncFeedDefaultsFromSaved();
    syncStoriesModeFromSaved();
  }
  await loadAdminStats().catch(() => {});
});

watch(
  () => [appStore.stats, appStore.loadingStats, savedHomeFeedDefaultMode.value, savedReelsFeedDefaultMode.value, savedStoriesMode.value] as const,
  ([stats, loadingStats]) => {
    if (!stats || loadingStats) {
      return;
    }

    if (!feedDefaultsHydrated.value || savingFeedDefaults.value || !feedDefaultsDirty.value) {
      syncFeedDefaultsFromSaved();
    }

    if (!storiesModeHydrated.value || savingStoriesMode.value || !storiesModeDirty.value) {
      syncStoriesModeFromSaved();
    }
  },
  {
    immediate: true
  }
);

watch(
  () => authStore.enabled,
  (enabled) => {
    if (!enabled) {
      showChangePasswordForm.value = false;
      showDisablePasswordForm.value = false;
      resetChangePasswordFields();
      resetDisablePasswordField();
      clearViewerFeedback();
    }
  }
);

watch(viewerAccessMode, (mode) => {
  if (mode !== 'password') {
    viewerPassword.value = '';
    viewerPasswordConfirmation.value = '';
  }
});

watch(
  () => authStore.accessMode,
  (accessMode) => {
    viewerAccessMode.value = accessMode;
  },
  {
    immediate: true
  }
);

watch(
  () => authStore.enabled,
  (enabled) => {
    if (enabled) {
      return;
    }

    clearViewerFeedback();
    viewerAccessMode.value = 'off';
    viewerPassword.value = '';
    viewerPasswordConfirmation.value = '';
  }
);
</script>
