// Client-side reading niceties shared by the Note and BlogPost layouts:
// a hover copy button on code blocks and the top-of-page scroll-progress bar.
// (`.copy-btn` styling lives in src/styles/global.css — it must be a global
// rule because the button is created here, not in an .astro template.)

const COPY_ICON =
  '<svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" stroke-width="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke-width="2"/></svg>';
const CHECK_ICON =
  '<svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>';

/** Appends a hover-reveal "copy" button to every non-mermaid `<pre>` on the page. */
export function initCopyButtons(): void {
  document.querySelectorAll<HTMLElement>('pre:not([data-language="mermaid"])').forEach((pre) => {
    pre.style.position = 'relative';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'copy-btn';
    btn.setAttribute('aria-label', 'Copy code');
    btn.innerHTML = COPY_ICON;
    pre.appendChild(btn);

    btn.addEventListener('click', async () => {
      await navigator.clipboard.writeText(pre.querySelector('code')?.textContent ?? '');
      btn.innerHTML = CHECK_ICON;
      btn.style.color = 'rgb(var(--color-accent-rgb))';
      setTimeout(() => {
        btn.innerHTML = COPY_ICON;
        btn.style.color = '';
      }, 2000);
    });
  });
}

/**
 * Drives the `#progress-bar` width from scroll position. `onProgress`, if given,
 * receives the 0–100 percentage on every scroll — Note.astro uses it to persist
 * read state.
 */
export function initReadingProgress(onProgress?: (pct: number) => void): void {
  const bar = document.getElementById('progress-bar');
  window.addEventListener(
    'scroll',
    () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      const pct = total > 0 ? (window.scrollY / total) * 100 : 0;
      if (bar) bar.style.width = `${total > 0 ? pct : 0}%`;
      onProgress?.(pct);
    },
    { passive: true },
  );
}
