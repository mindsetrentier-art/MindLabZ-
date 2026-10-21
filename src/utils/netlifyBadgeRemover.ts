/**
 * Netlify Badge & Drawer Auto-Remover Utility
 * 
 * Automatically purges, suppresses, and hides Netlify's floating "POWERED BY Netlify",
 * Netlify Drawer, feedback toolbar, and deploy preview badges that overlap the
 * bottom navigation dock and obscure application features.
 */

export function setupNetlifyBadgeRemover(): () => void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return () => {};
  }

  const isNetlifyElement = (el: Element): boolean => {
    try {
      const tagName = el.tagName.toLowerCase();
      if (tagName === 'netlify-drawer' || tagName === 'netlify-toolbar') {
        return true;
      }

      const id = (el.id || '').toLowerCase();
      const className = (typeof el.className === 'string' ? el.className : '').toLowerCase();
      if (
        id.includes('netlify') ||
        className.includes('netlify-badge') ||
        className.includes('netlify-drawer') ||
        className.includes('netlify-feedback')
      ) {
        return true;
      }

      // Check for links or images pointing to netlify
      if (tagName === 'a') {
        const href = (el.getAttribute('href') || '').toLowerCase();
        if (href.includes('netlify.com') || href.includes('netlify.app')) {
          return true;
        }
      }

      if (tagName === 'img') {
        const src = (el.getAttribute('src') || '').toLowerCase();
        const alt = (el.getAttribute('alt') || '').toLowerCase();
        if (src.includes('netlify') || alt.includes('netlify')) {
          return true;
        }
      }

      if (tagName === 'iframe') {
        const src = (el.getAttribute('src') || '').toLowerCase();
        const title = (el.getAttribute('title') || '').toLowerCase();
        const idStr = (el.getAttribute('id') || '').toLowerCase();
        if (src.includes('netlify') || title.includes('netlify') || idStr.includes('netlify')) {
          return true;
        }
      }

      // Check dataset attributes
      if ((el as HTMLElement).dataset) {
        for (const key in (el as HTMLElement).dataset) {
          if (key.toLowerCase().includes('netlify')) {
            return true;
          }
        }
      }

      // Check text content for floating bottom elements
      const text = (el.textContent || '').trim().toLowerCase();
      if (
        text.includes('powered by netlify') ||
        text.includes('deploys by netlify') ||
        text.includes('hosted on netlify')
      ) {
        return true;
      }
    } catch {
      // Ignore evaluation errors on cross-origin elements
    }
    return false;
  };

  const purgeElement = (el: Element) => {
    try {
      const htmlEl = el as HTMLElement;
      // Completely hide and disable interaction
      htmlEl.style.setProperty('display', 'none', 'important');
      htmlEl.style.setProperty('visibility', 'hidden', 'important');
      htmlEl.style.setProperty('opacity', '0', 'important');
      htmlEl.style.setProperty('pointer-events', 'none', 'important');
      htmlEl.style.setProperty('width', '0px', 'important');
      htmlEl.style.setProperty('height', '0px', 'important');
      htmlEl.style.setProperty('z-index', '-9999', 'important');
      htmlEl.style.setProperty('position', 'absolute', 'important');
      htmlEl.style.setProperty('left', '-9999px', 'important');
      htmlEl.style.setProperty('top', '-9999px', 'important');
      // Remove from DOM if possible
      if (el.parentNode) {
        el.parentNode.removeChild(el);
      }
    } catch {
      // Fallback
    }
  };

  const scanAndPurge = () => {
    // 1. Selector query
    const selectors = [
      '#netlify-badge',
      '#netlify-identity-widget',
      '#netlify-deploy-preview-badge',
      '.netlify-badge',
      'netlify-drawer',
      'netlify-toolbar',
      '[data-netlify-deploy-id]',
      'iframe[src*="netlify"]',
      'iframe[id*="netlify"]',
      'iframe[title*="Netlify" i]',
      'a[href*="netlify.com"]',
      'img[src*="netlify"]',
      'div[class*="netlify"]',
      'div[id*="netlify"]',
    ];

    selectors.forEach((sel) => {
      try {
        const found = document.querySelectorAll(sel);
        found.forEach((el) => purgeElement(el));
      } catch {
        // Continue
      }
    });

    // 2. Scan direct children of body for fixed bottom elements
    try {
      const bodyChildren = document.body ? Array.from(document.body.children) : [];
      bodyChildren.forEach((child) => {
        if (child.id === 'root') return;
        if (isNetlifyElement(child)) {
          purgeElement(child);
          return;
        }

        // Check computed styles for fixed positioning at bottom
        try {
          const style = window.getComputedStyle(child);
          if (style.position === 'fixed') {
            const text = (child.textContent || '').toLowerCase();
            if (text.includes('netlify')) {
              purgeElement(child);
            }
          }
        } catch {
          // Ignore
        }
      });
    } catch {
      // Ignore
    }
  };

  // Immediate execution
  scanAndPurge();

  // MutationObserver to catch dynamically injected scripts or elements
  let observer: MutationObserver | null = null;
  if (typeof MutationObserver !== 'undefined' && document.body) {
    observer = new MutationObserver((mutations) => {
      let shouldScan = false;
      for (const m of mutations) {
        if (m.addedNodes.length > 0) {
          for (let i = 0; i < m.addedNodes.length; i++) {
            const node = m.addedNodes[i];
            if (node.nodeType === Node.ELEMENT_NODE) {
              const el = node as Element;
              if (isNetlifyElement(el)) {
                purgeElement(el);
              } else {
                shouldScan = true;
              }
            }
          }
        }
      }
      if (shouldScan) {
        scanAndPurge();
      }
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  }

  // Periodic safety scan (especially after window load when async scripts arrive)
  const intervals: number[] = [];
  [100, 300, 600, 1000, 2000, 3500, 5000, 8000].forEach((delay) => {
    const timer = window.setTimeout(scanAndPurge, delay);
    intervals.push(timer);
  });

  const recurringTimer = window.setInterval(scanAndPurge, 4000);
  intervals.push(recurringTimer);

  window.addEventListener('load', scanAndPurge);

  // Return cleanup function
  return () => {
    if (observer) observer.disconnect();
    intervals.forEach((id) => window.clearTimeout(id));
    window.removeEventListener('load', scanAndPurge);
  };
}
