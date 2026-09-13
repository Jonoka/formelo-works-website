// Progressive enhancement only: native disclosures, anchors and content work without this module.
// No requests, analytics, storage, forms or third-party SDKs.
const disclosures = document.querySelectorAll<HTMLDetailsElement>('[data-nav-disclosure]');
for (const disclosure of disclosures) {
  const trigger = disclosure.querySelector<HTMLElement>('summary');
  disclosure.addEventListener('keydown', event => {
    if (event.key === 'Escape' && disclosure.open) {
      disclosure.open = false;
      trigger?.focus();
      event.preventDefault();
    }
  });
  disclosure.addEventListener('click', event => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const anchor = target.closest<HTMLAnchorElement>('a[href]');
    if (!anchor) return;
    // Close before the browser follows the genuine anchor. No prevented/dummy clicks.
    disclosure.open = false;
    const destination = new URL(anchor.href, window.location.href);
    if (destination.pathname === window.location.pathname && destination.hash) {
      const section = document.getElementById(decodeURIComponent(destination.hash.slice(1)));
      section?.focus({ preventScroll: true });
    }
  });
}
document.addEventListener('click', event => {
  if (!(event.target instanceof Node)) return;
  const target = event.target;
  for (const disclosure of disclosures) if (disclosure.open && !disclosure.contains(target)) disclosure.open = false;
});
// A persistent caption and native alt text are the no-JS fallback; enhancement hides broken icons.
for (const image of document.querySelectorAll<HTMLImageElement>('img[data-preview-image]')) {
  const fail = () => {
    image.dataset['failed'] = 'true';
    const notice = image.closest('figure')?.querySelector<HTMLElement>('[data-image-error]');
    if (notice) notice.hidden = false;
  };
  image.addEventListener('error', fail);
  if (image.complete && image.naturalWidth === 0) fail();
}
