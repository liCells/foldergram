import DefaultTheme from 'vitepress/theme';
import type { Theme } from 'vitepress';
import { watch } from 'vue';

import './custom.css';
import './rainbow.css';

function updateHomePageClass(enabled: boolean) {
  if (typeof document === 'undefined') {
    return;
  }

  document.documentElement.classList.toggle('fg-home-rainbow', enabled);
}

const theme: Theme = {
  extends: DefaultTheme,
  enhanceApp({ router }) {
    if (typeof window === 'undefined') {
      return;
    }

    watch(
      () => router.route.data.relativePath,
      (relativePath) => {
        updateHomePageClass(relativePath === 'index.md' || relativePath === '');
      },
      { immediate: true }
    );
  }
};

export default theme;
