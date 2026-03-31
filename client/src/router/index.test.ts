import { defineComponent } from 'vue';
import { RouterView } from 'vue-router';
import { flushPromises, mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

import { pinia } from '../stores/pinia';

vi.mock('../views/HomeView.vue', async () => {
  const { defineComponent } = await import('vue');

  return {
    default: defineComponent({
      name: 'HomeView',
      template: '<div data-test="home-view">home-view</div>'
    })
  };
});

vi.mock('../views/PostView.vue', async () => {
  const { defineComponent } = await import('vue');

  return {
    default: defineComponent({
      name: 'PostView',
      template: '<div data-test="post-view">post-view</div>'
    })
  };
});

vi.mock('../views/LibraryView.vue', async () => {
  const { defineComponent } = await import('vue');

  return {
    default: defineComponent({
      name: 'LibraryView',
      template: '<div data-test="library-view">library-view</div>'
    })
  };
});

vi.mock('../views/LikesView.vue', async () => {
  const { defineComponent } = await import('vue');

  return {
    default: defineComponent({
      name: 'LikesView',
      template: '<div data-test="likes-view">likes-view</div>'
    })
  };
});

vi.mock('../views/ExploreView.vue', async () => {
  const { defineComponent } = await import('vue');

  return {
    default: defineComponent({
      name: 'ExploreView',
      template: '<div data-test="explore-view">explore-view</div>'
    })
  };
});

vi.mock('../views/FolderView.vue', async () => {
  const { defineComponent } = await import('vue');

  return {
    default: defineComponent({
      name: 'FolderView',
      template: '<div data-test="folder-view">folder-view</div>'
    })
  };
});

vi.mock('../views/MomentView.vue', async () => {
  const { defineComponent } = await import('vue');

  return {
    default: defineComponent({
      name: 'MomentView',
      template: '<div data-test="moment-view">moment-view</div>'
    })
  };
});

vi.mock('../views/ReelsView.vue', async () => {
  const { defineComponent } = await import('vue');

  return {
    default: defineComponent({
      name: 'ReelsView',
      template: '<div data-test="reels-view-route">reels-view-route</div>'
    })
  };
});

vi.mock('../views/TrashView.vue', async () => {
  const { defineComponent } = await import('vue');

  return {
    default: defineComponent({
      name: 'TrashView',
      template: '<div data-test="trash-view">trash-view</div>'
    })
  };
});

vi.mock('../views/SettingsView.vue', async () => {
  const { defineComponent } = await import('vue');

  return {
    default: defineComponent({
      name: 'SettingsView',
      template: '<div data-test="settings-view">settings-view</div>'
    })
  };
});

import { router } from './index';

describe('router', () => {
  it('uses /post/:id as the canonical post route while keeping /image/:id as a legacy alias', async () => {
    const resolved = router.resolve({
      name: 'image',
      params: {
        id: '214'
      }
    });

    expect(resolved.fullPath).toBe('/post/214');

    await router.replace('/image/214');
    await router.isReady();
    await flushPromises();

    expect(router.currentRoute.value.name).toBe('image');
    expect(router.currentRoute.value.params.id).toBe('214');
    expect(router.currentRoute.value.fullPath).toBe('/image/214');
  });

  it('uses /f/:slug as the canonical folder route while keeping /folders/:slug as a legacy alias', async () => {
    const resolved = router.resolve({
      name: 'folder',
      params: {
        slug: 'animalplanet'
      }
    });

    expect(resolved.fullPath).toBe('/f/animalplanet');

    await router.replace('/folders/animalplanet');
    await router.isReady();
    await flushPromises();

    expect(router.currentRoute.value.name).toBe('folder');
    expect(router.currentRoute.value.params.slug).toBe('animalplanet');
    expect(router.currentRoute.value.fullPath).toBe('/folders/animalplanet');
  });

  it('renders the reels route and preserves the reels shell meta', async () => {
    await router.replace('/reels');
    await router.isReady();

    const wrapper = mount(
      defineComponent({
        name: 'RouterHost',
        components: {
          RouterView
        },
        template: '<RouterView />'
      }),
      {
        global: {
          plugins: [pinia, router]
        }
      }
    );

    await flushPromises();

    expect(router.currentRoute.value.name).toBe('reels');
    expect(router.currentRoute.value.meta.shell).toBe('reels');
    expect(wrapper.get('[data-test="reels-view-route"]').text()).toBe('reels-view-route');
  });
});
