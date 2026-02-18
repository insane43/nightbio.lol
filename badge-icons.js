// Custom SVG icons for badges — nightbio.lol (guns.lol-style)
(function() {
  var s = ' xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
  var icons = {
    community: '<svg' + s + '><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    og: '<svg' + s + '><path d="M12 2L15 8l6 1-4.5 4 1.5 5.5L12 17l-6 1.5 1.5-5.5L3 9l6-1L12 2z"/></svg>',
    owner: '<svg' + s + '><path d="M12 2l2.4 7.4h7.6l-6 4.6 2.3 7-6.3-4.6L5.7 21l2.3-7-6-4.6h7.6L12 2z"/></svg>',
    staff: '<svg' + s + '><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>',
    verified: '<svg' + s + '><circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/></svg>',
    premium: '<svg' + s + '><path d="M12 2L2 12l10 10 10-10L12 2z"/><path d="M2 12h20"/></svg>'
  };
  window.BADGE_ICONS = icons;
})();
