/**
 * Page Transitions - View Transitions API + fallback
 * Handles smooth fade transitions between pages
 */
(function () {
    'use strict';

    // ---- Fade in on page load ----
    document.body.classList.add('page-entering');

    // ---- Intercept internal link clicks ----
    document.addEventListener('click', function (e) {
        var link = e.target.closest('a');
        if (!link) return;

        // Skip: external links, new tabs, downloads, hash-only, JS links
        if (link.target === '_blank') return;
        if (link.hasAttribute('download')) return;
        if (link.hasAttribute('data-no-transition')) return;
        var href = link.getAttribute('href');
        if (!href) return;
        if (href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
        if (/^https?:\/\//.test(href) && link.origin !== location.origin) return;

        // Skip if modifier keys (let browser handle)
        if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;

        // Skip if same page
        if (link.href === location.href) return;

        e.preventDefault();

        // Fade out current page
        document.body.classList.remove('page-entering');
        document.body.classList.add('page-leaving');

        // Navigate after fade-out animation completes
        setTimeout(function () {
            location.href = link.href;
        }, 320);
    });

    // ---- Handle browser back/forward (pageshow) ----
    window.addEventListener('pageshow', function (event) {
        if (event.persisted) {
            // Page restored from bfcache - re-trigger fade-in
            document.body.classList.remove('page-leaving');
            document.body.classList.add('page-entering');
        }
    });
})();
