"use strict";
(() => {
  const script = document.querySelector('script[data-citation-tracker]');
  if (!script) return;
  const url = new URL('citation-stats.json', script.src);
  fetch(url, { cache: 'no-cache' })
    .then(response => {
      if (!response.ok) throw new Error('Citation data unavailable');
      return response.json();
    })
    .then(data => {
      if (!data || !data.totals || !data.byPaper || !data.bySlug) return;
      document.querySelectorAll('[data-citation-summary]').forEach(el => {
        const field = el.getAttribute('data-citation-summary');
        if (Number.isSafeInteger(data.totals[field])) el.textContent = data.totals[field].toLocaleString('en-US');
      });
      document.querySelectorAll('[data-citation-count]').forEach(el => {
        const paper = el.getAttribute('data-citation-count');
        const count = data.byPaper[paper];
        if (Number.isSafeInteger(count)) el.textContent = count.toLocaleString('en-US');
      });
      const queryContainer = document.querySelector('[data-citation-from-query]');
      if (queryContainer) {
        const slug = new URLSearchParams(location.search).get('paper');
        const count = data.bySlug[slug];
        const number = queryContainer.querySelector('[data-citation-query-count]');
        if (number && Number.isSafeInteger(count)) {
          number.textContent = count.toLocaleString('en-US');
          queryContainer.hidden = false;
        }
      }
    })
    .catch(() => { /* Keep the pre-rendered manuscript and portfolio counts. */ });
})();
