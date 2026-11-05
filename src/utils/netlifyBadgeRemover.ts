/**
 * Netlify Badge & Drawer Auto-Remover Utility
 * 
 * Automatically purges, suppresses, and hides Netlify's floating "POWERED BY Netlify",
 * Netlify Drawer, feedback toolbar, and deploy preview badges that overlap the
 * bottom navigation dock and obscure application features.
 * 
 * CRITICAL SAFETY ISOLATION:
 * This utility strictly NEVER touches, scans, modifies, or deletes any DOM node
 * inside `#root`. React owns `#root` completely; removing nodes inside `#root`
 * causes React 19 DOM reconciliation errors (removeChild on Node) and blank pages.
 */

export function setupNetlifyBadgeRemover(): () => void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return () => {};
  }

  const isInsideRoot = (el: Element | null): boolean => {
    if (!el) return false;
    const root = document.getElementById('root');
    if (!root) return false;
    return el === root || root.contains(el);
  };

  const isNetlifyElement = (el: Element): boolean => {
    try {
      if (!el || isInsideRoot(el)) {
        return false;
      }

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

      // Check for links or images pointing to netlify outside #root
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

      // Check text content strictly for floating bottom external elements
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
      if (!el || isInsideRoot(el)) {
        return;
      }

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
      // Remove from DOM only if outside root
      if (el.parentNode && !isInsideRoot(el.parentNode as Element)) {
        el.parentNode.removeChild(el);
      }
    } catch {
      // Fallback
    }
  };

  const scanAndPurge = () => {
    const root = document.getElementById('root');

    // 1. Selector query strictly filtering out any React root nodes
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
    ];

    selectors.forEach((sel) => {
      try {
        const found = document.querySelectorAll(sel);
        found.forEach((el) => {
          if (!isInsideRoot(el)) {
            purgeElement(el);
          }
        });
      } catch {
        // Continue
      }
    });

    // 2. Scan direct children of body for external fixed bottom elements
    try {
      const bodyChildren = document.body ? Array.from(document.body.children) : [];
      bodyChildren.forEach((child) => {
        if (child === root || child.id === 'root' || isInsideRoot(child)) return;
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

  // MutationObserver to catch dynamically injected scripts or elements outside #root
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
              // Never touch elements inside React root
              if (isInsideRoot(el)) {
                continue;
              }
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

    // Observe body for external elements injected as direct siblings of #root
    observer.observe(document.body, {
      childList: true,
      subtree: false, // Only observe direct children of body to avoid scanning React tree mutations
    });
  }

  // Periodic safety scan (especially after window load when async scripts arrive)
  const intervals: number[] = [];
  [150, 400, 800, 1500, 3000, 6000].forEach((delay) => {
    const timer = window.setTimeout(scanAndPurge, delay);
    intervals.push(timer);
  });

  const recurringTimer = window.setInterval(scanAndPurge, 5000);
  intervals.push(recurringTimer);

  window.addEventListener('load', scanAndPurge);

  // Return cleanup function
  return () => {
    if (observer) observer.disconnect();
    intervals.forEach((id) => window.clearTimeout(id));
    window.removeEventListener('load', scanAndPurge);
  };
}
