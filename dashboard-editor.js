// Dashboard bio editor — nightbio.lol (tabbed UI + live preview)
(function() {
  var BASE_URL = typeof window !== 'undefined' && window.location && window.location.origin ? window.location.origin : 'https://nightbio.lol';
  var MAX_LINKS = 20;

  function showMsg(el, text, type) {
    if (!el) return;
    el.textContent = text;
    el.className = 'editor-msg ' + (type || 'info');
    el.classList.remove('empty');
  }
  function clearMsg(el) {
    if (!el) return;
    el.textContent = '';
    el.className = 'editor-msg empty';
  }

  function escapeHtml(s) {
    if (!s) return '';
    var div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function getLinksFromList() {
    var list = document.getElementById('linkList');
    if (!list) return [];
    var items = list.querySelectorAll('.link-item');
    var links = [];
    for (var i = 0; i < items.length; i++) {
      var labelIn = items[i].querySelector('.label-in');
      var urlIn = items[i].querySelector('.url-in');
      var iconSel = items[i].querySelector('.link-icon');
      var url = urlIn && urlIn.value ? urlIn.value.trim() : '';
      if (url) {
        var icon = iconSel && iconSel.value ? iconSel.value.trim() : '';
        if (!icon && typeof detectPlatformFromUrl === 'function') icon = detectPlatformFromUrl(url);
        var iconOnlyCb = items[i].querySelector('.link-icon-only-cb');
        links.push({
          label: (labelIn && labelIn.value ? labelIn.value.trim() : '') || url,
          url: url,
          icon: icon,
          iconOnly: !!(iconOnlyCb && iconOnlyCb.checked)
        });
      }
    }
    return links;
  }

  function getEditorData() {
    var displayName = document.getElementById('displayName');
    var bioText = document.getElementById('bioText');
    var accentColor = document.getElementById('accentColor');
    var avatarURLIn = document.getElementById('avatarURLInput');
    var bannerURLIn = document.getElementById('bannerURLInput');
    var songURLIn = document.getElementById('songURLInput');
    return {
      displayName: displayName ? displayName.value.trim() : '',
      bio: bioText ? bioText.value.trim() : '',
      avatarURL: (avatarURLIn && avatarURLIn.value.trim()) || (window._editorCurrentData && window._editorCurrentData.avatarURL) || '',
      bannerURL: (bannerURLIn && bannerURLIn.value.trim()) || (window._editorCurrentData && window._editorCurrentData.bannerURL) || '',
      songURL: (songURLIn && songURLIn.value.trim()) || (window._editorCurrentData && window._editorCurrentData.songURL) || '',
      accentColor: accentColor ? accentColor.value : '#7c6bb8',
      displayStyle: (document.getElementById('displayStyleSelect') && document.getElementById('displayStyleSelect').value) || 'default',
      fontFamily: (document.getElementById('fontFamily') && document.getElementById('fontFamily').value) || 'Outfit',
      fontSize: parseInt(document.getElementById('fontSize') && document.getElementById('fontSize').value, 10) || 16,
      letterSpacing: parseFloat(document.getElementById('letterSpacing') && document.getElementById('letterSpacing').value) || 0,
      typewriterBio: !!(document.getElementById('typewriterBio') && document.getElementById('typewriterBio').checked),
      backgroundEffect: (document.getElementById('backgroundEffect') && document.getElementById('backgroundEffect').value) || 'none',
      buttonStyle: (document.getElementById('buttonStyle') && document.getElementById('buttonStyle').value) || 'filled',
      showViewsOnBio: !!(document.getElementById('showViewsOnBio') && document.getElementById('showViewsOnBio').checked),
      badges: (window._editorCurrentData && window._editorCurrentData.badges) || { community: true, og: false, owner: false, staff: false, verified: false, premium: false },
      badgeVisibility: (window._editorCurrentData && window._editorCurrentData.badgeVisibility) || {},
      badgeColors: (window._editorCurrentData && window._editorCurrentData.badgeColors) || {},
      alias: (window._editorCurrentData && window._editorCurrentData.alias != null) ? String(window._editorCurrentData.alias).trim() : '',
      metaTitle: (document.getElementById('metaTitle') && document.getElementById('metaTitle').value.trim()) || '',
      metaDescription: (document.getElementById('metaDescription') && document.getElementById('metaDescription').value.trim()) || '',
      metaImageURL: (document.getElementById('metaImageURL') && document.getElementById('metaImageURL').value.trim()) || '',
      links: getLinksFromList()
    };
  }

  function updatePreview(data) {
    data = data || getEditorData();
    var banner = document.getElementById('previewBanner');
    var avatarImg = document.getElementById('previewAvatar');
    var avatarPlace = document.getElementById('previewAvatarPlaceholder');
    var nameEl = document.getElementById('previewName');
    var bioEl = document.getElementById('previewBio');
    var linksEl = document.getElementById('previewLinks');

    if (banner) {
      if (data.bannerURL) {
        banner.style.backgroundImage = 'url(' + escapeHtml(data.bannerURL) + ')';
        banner.style.backgroundSize = 'cover';
        banner.style.backgroundPosition = 'center';
      } else {
        banner.style.backgroundImage = 'none';
      }
    }

    if (avatarImg && avatarPlace) {
      if (data.avatarURL) {
        avatarImg.src = data.avatarURL;
        avatarImg.style.display = 'block';
        avatarPlace.style.display = 'none';
      } else {
        avatarImg.style.display = 'none';
        avatarImg.removeAttribute('src');
        avatarPlace.style.display = 'flex';
        avatarPlace.textContent = (data.displayName || '?').charAt(0).toUpperCase();
      }
    }

    if (nameEl) nameEl.textContent = data.displayName || 'Your name';

    var aliasEl = document.getElementById('previewAlias');
    if (aliasEl) {
      var aliasText = (data.alias != null && String(data.alias).trim()) ? String(data.alias).trim() : ((window._editorCurrentData && window._editorCurrentData.alias != null) ? String(window._editorCurrentData.alias).trim() : '');
      if (aliasText) {
        aliasEl.textContent = 'also known as @' + aliasText;
        aliasEl.style.display = '';
      } else {
        aliasEl.textContent = '';
        aliasEl.style.display = 'none';
      }
    }

    /* Only show badges that are actually shown on profile (same logic as public bio) */
    function previewApplyBadgeVisibility(badges, visibility) {
      var out = {};
      var keys = ['community', 'og', 'owner', 'staff', 'verified', 'premium'];
      for (var i = 0; i < keys.length; i++) {
        var k = keys[i];
        if (!!badges[k] && (visibility == null || visibility[k] !== false)) out[k] = true;
      }
      return out;
    }
    var badgesEl = document.getElementById('previewBadges');
    if (badgesEl) {
      badgesEl.innerHTML = '';
      var badges = data.badges || {};
      var visibility = data.badgeVisibility || {};
      var visibleBadges = previewApplyBadgeVisibility(badges, visibility);
      var badgeColors = data.badgeColors || {};
      var icons = window.BADGE_ICONS || {};
      var order = ['community', 'verified', 'staff', 'owner', 'og', 'premium'];
      order.forEach(function(key) {
        if (!visibleBadges[key]) return;
        var span = document.createElement('span');
        span.className = 'preview-badge bio-badge bio-badge-' + key;
        if (badgeColors[key] && /^#[0-9A-Fa-f]{6}$/.test(String(badgeColors[key]))) {
          span.style.color = String(badgeColors[key]);
        }
        if (icons[key]) {
          var iconWrap = document.createElement('span');
          iconWrap.className = 'bio-badge-icon';
          iconWrap.innerHTML = icons[key];
          span.appendChild(iconWrap);
        }
        badgesEl.appendChild(span);
      });
    }

    if (bioEl) bioEl.textContent = data.bio || 'Your bio appears here.';

    if (linksEl) {
      linksEl.innerHTML = '';
      var links = data.links || [];
      links.forEach(function(l) {
        if (!l.url) return;
        var btn = document.createElement('span');
        btn.className = 'preview-link-btn';
        btn.textContent = l.label || l.url;
        linksEl.appendChild(btn);
      });
    }

    var screen = document.getElementById('previewScreen');
    if (screen) {
      if (data.accentColor) screen.style.setProperty('--preview-accent', data.accentColor);
      if (data.fontFamily) screen.style.setProperty('font-family', data.fontFamily + ', var(--font-body), sans-serif');
    }
  }

  function buildIconSelectOptions(selected) {
    var platforms = window.LINK_PLATFORMS || [];
    var opts = [];
    for (var i = 0; i < platforms.length; i++) {
      var p = platforms[i];
      opts.push('<option value="' + escapeHtml(p.value) + '"' + (p.value === (selected || '') ? ' selected' : '') + '>' + escapeHtml(p.label) + '</option>');
    }
    return opts.join('');
  }

  function renderLinkItem(link, index) {
    var li = document.createElement('li');
    li.className = 'link-item';
    li.dataset.index = index;
    var iconVal = (link && link.icon) ? link.icon : '';
    if (!iconVal && link && link.url && typeof detectPlatformFromUrl === 'function') iconVal = detectPlatformFromUrl(link.url);
    li.innerHTML =
      '<span class="link-drag" aria-hidden="true">⋮⋮</span>' +
      '<select class="link-icon form-select-sm" aria-label="Platform icon">' + buildIconSelectOptions(iconVal) + '</select>' +
      '<input type="text" class="label-in" placeholder="Label" value="' + (link ? escapeHtml(link.label) : '') + '" maxlength="50">' +
      '<input type="url" class="url-in" placeholder="https://..." value="' + (link ? escapeHtml(link.url) : '') + '" maxlength="500">' +
      '<label class="link-icon-only-wrap"><input type="checkbox" class="link-icon-only-cb" ' + (link && link.iconOnly ? 'checked' : '') + '> Icon only</label>' +
      '<button type="button" class="btn-icon link-move-up" aria-label="Move up">↑</button>' +
      '<button type="button" class="btn-icon link-move-down" aria-label="Move down">↓</button>' +
      '<button type="button" class="btn-icon link-remove" aria-label="Remove">✕</button>';
    var list = document.getElementById('linkList');
    if (list) list.appendChild(li);

    li.querySelector('.link-remove').addEventListener('click', function() {
      li.remove();
      updateLinkCount();
      updatePreview();
    });
    li.querySelector('.link-move-up').addEventListener('click', function() {
      var prev = li.previousElementSibling;
      if (prev) list.insertBefore(li, prev);
      updatePreview();
    });
    li.querySelector('.link-move-down').addEventListener('click', function() {
      var next = li.nextElementSibling;
      if (next) list.insertBefore(next, li);
      updatePreview();
    });

    var urlIn = li.querySelector('.url-in');
    if (urlIn) {
      urlIn.addEventListener('blur', function() {
        var sel = li.querySelector('.link-icon');
        if (sel && sel.value === '' && typeof detectPlatformFromUrl === 'function') {
          var detected = detectPlatformFromUrl(urlIn.value);
          if (detected) sel.value = detected;
        }
        updatePreview();
      });
    }
    var inputs = li.querySelectorAll('input');
    for (var j = 0; j < inputs.length; j++) {
      inputs[j].addEventListener('input', updatePreview);
      inputs[j].addEventListener('change', updatePreview);
    }
    li.querySelector('.link-icon').addEventListener('change', updatePreview);
    var iconOnlyCb = li.querySelector('.link-icon-only-cb');
    if (iconOnlyCb) iconOnlyCb.addEventListener('change', updatePreview);
    return li;
  }

  function updateLinkCount() {
    var list = document.getElementById('linkList');
    var badge = document.getElementById('linkCountBadge');
    var addBtn = document.getElementById('addLinkBtn');
    var count = list ? list.querySelectorAll('.link-item').length : 0;
    if (badge) badge.textContent = count + ' / ' + MAX_LINKS;
    if (addBtn) addBtn.disabled = count >= MAX_LINKS;
  }

  function switchTab(tabId) {
    var tabs = document.querySelectorAll('.editor-tab');
    var panels = document.querySelectorAll('.editor-panel');
    tabs.forEach(function(t) {
      t.classList.toggle('active', t.dataset.tab === tabId);
      t.setAttribute('aria-selected', t.dataset.tab === tabId ? 'true' : 'false');
    });
    var panelId = 'panel' + tabId.charAt(0).toUpperCase() + tabId.slice(1);
    panels.forEach(function(p) {
      var isActive = p.id === panelId;
      p.classList.toggle('active', isActive);
      p.hidden = !isActive;
    });
    if (tabId === 'analytics') refreshProfileViews();
    if (tabId === 'adminPanel' && typeof loadDashboardAdmin === 'function') loadDashboardAdmin();
    if (tabId === 'status') {
      runDashboardStatusChecks();
      if (!window._dashboardStatusWired) {
        window._dashboardStatusWired = true;
        var refreshBtn = document.getElementById('dsStatusRefresh');
        if (refreshBtn) refreshBtn.addEventListener('click', runDashboardStatusChecks);
        window._dashboardStatusInterval = setInterval(function() {
          var panel = document.getElementById('panelStatus');
          if (panel && panel.classList.contains('active')) runDashboardStatusChecks();
        }, 60000);
      }
    }
  }

  var DS_TOOLTIPS = { operational: 'Operational — All systems normal.', degraded: 'Degraded — Slow or partial issues. We\'re looking into it.', outage: 'Outage — Service unavailable. We\'re working on a fix.', checking: 'Checking…' };
  function dsSetDot(id, state, tooltipId) {
    var dot = document.getElementById(id);
    var tip = document.getElementById(tooltipId);
    if (!dot || !tip) return;
    dot.className = (id === 'dsOverviewDot' ? 'status-overview-dot ' : 'status-dot ') + state;
    dot.setAttribute('aria-label', state);
    tip.textContent = DS_TOOLTIPS[state] || DS_TOOLTIPS.checking;
  }
  function dsSetMeta(id, text, ok) {
    var el = document.getElementById(id);
    if (!el) return;
    el.textContent = text;
    el.classList.remove('latency-ok', 'latency-slow');
    if (ok === true) el.classList.add('latency-ok');
    if (ok === false) el.classList.add('latency-slow');
  }
  function dsSetOverview(allOk, anyDegraded, anyDown, detail) {
    var dot = document.getElementById('dsOverviewDot');
    var text = document.getElementById('dsOverviewText');
    var detailEl = document.getElementById('dsOverviewDetail');
    if (!dot || !text) return;
    dot.className = 'status-overview-dot';
    if (anyDown) { dot.classList.add('outage'); text.textContent = 'Some systems are down'; if (detailEl) detailEl.textContent = detail || 'One or more services are unavailable.'; }
    else if (anyDegraded) { dot.classList.add('degraded'); text.textContent = 'Some systems degraded'; if (detailEl) detailEl.textContent = detail || 'Performance issues detected.'; }
    else if (allOk) { dot.classList.add('operational'); text.textContent = 'All systems operational'; if (detailEl) detailEl.textContent = detail || 'All services are running normally.'; }
    else { dot.classList.add('checking'); text.textContent = 'Checking all systems…'; if (detailEl) detailEl.textContent = 'Verifying website, authentication, and database'; }
  }
  function runDashboardStatusChecks() {
    var updatedEl = document.getElementById('dsStatusUpdated');
    if (updatedEl) updatedEl.textContent = 'Last checked: ' + new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    var refreshBtn = document.getElementById('dsStatusRefresh');
    if (refreshBtn) refreshBtn.disabled = true;

    dsSetDot('dsDotWebsite', 'checking', 'dsTooltipWebsite');
    dsSetDot('dsDotApi', 'checking', 'dsTooltipApi');
    dsSetDot('dsDotDb', 'checking', 'dsTooltipDb');
    dsSetMeta('dsMetaWebsite', '—');
    dsSetMeta('dsMetaApi', '—');
    dsSetMeta('dsMetaDb', '—');
    dsSetOverview(false, false, false);

    var websiteOk = false, apiOk = false, dbOk = false;
    var websiteDegraded = false, apiDegraded = false, dbDegraded = false;
    var websiteMs = null, apiMs = null, dbMs = null;
    var done = { w: false, a: false, d: false };

    function finish() {
      if (!done.w || !done.a || !done.d) return;
      dsSetDot('dsDotWebsite', websiteDegraded ? 'degraded' : (websiteOk ? 'operational' : 'outage'), 'dsTooltipWebsite');
      dsSetDot('dsDotApi', apiDegraded ? 'degraded' : (apiOk ? 'operational' : 'outage'), 'dsTooltipApi');
      dsSetDot('dsDotDb', dbDegraded ? 'degraded' : (dbOk ? 'operational' : 'outage'), 'dsTooltipDb');
      dsSetMeta('dsMetaWebsite', websiteMs != null ? websiteMs + ' ms' : (websiteOk ? 'OK' : '—'), websiteOk && (websiteMs == null || websiteMs < 2000));
      dsSetMeta('dsMetaApi', apiMs != null ? apiMs + ' ms' : (apiOk ? 'OK' : '—'), apiOk && (apiMs == null || apiMs < 2000));
      dsSetMeta('dsMetaDb', dbMs != null ? dbMs + ' ms' : (dbOk ? 'OK' : '—'), dbOk && (dbMs == null || dbMs < 2000));
      dsSetOverview(websiteOk && apiOk && dbOk, websiteDegraded || apiDegraded || dbDegraded, !websiteOk || !apiOk || !dbOk);
      if (refreshBtn) refreshBtn.disabled = false;
    }

    var t0 = performance.now();
    fetch(window.location.origin + '/', { method: 'HEAD', cache: 'no-store' })
      .then(function(r) { websiteOk = r.ok; })
      .catch(function() { websiteOk = false; })
      .finally(function() {
        websiteMs = Math.round(performance.now() - t0);
        done.w = true;
        finish();
      });

    if (typeof initFirebase === 'function') initFirebase();
    var db = window.firebaseDb || (typeof firebase !== 'undefined' && firebase.database ? firebase.database() : null);
    var auth = typeof firebase !== 'undefined' && firebase.auth ? firebase.auth() : null;

    if (auth) {
      var tAuth = performance.now();
      var timeoutAuth = setTimeout(function() {
        if (!done.a) { apiDegraded = true; apiOk = true; apiMs = Math.round(performance.now() - tAuth); done.a = true; finish(); }
      }, 8000);
      auth.getRedirectResult().then(function() {
        apiOk = true;
        apiMs = Math.round(performance.now() - tAuth);
        done.a = true;
        clearTimeout(timeoutAuth);
        finish();
      }).catch(function() {
        apiOk = false;
        done.a = true;
        clearTimeout(timeoutAuth);
        finish();
      });
    } else { apiOk = false; done.a = true; finish(); }

    if (db) {
      var tDb = performance.now();
      db.ref('siteConfig').limitToFirst(1).once('value')
        .then(function() { dbOk = true; dbMs = Math.round(performance.now() - tDb); done.d = true; finish(); })
        .catch(function() { dbOk = false; done.d = true; finish(); });
    } else { dbOk = false; done.d = true; finish(); }
  }

  function init(uid) {
    window._editorCurrentData = { links: [] };

    var msgEl = document.getElementById('editorMessage');
    var saveBtn = document.getElementById('saveBioBtn');
    var addLinkBtn = document.getElementById('addLinkBtn');
    var bioUrlStrip = document.getElementById('bioUrlStrip');
    var bioUrlInput = document.getElementById('bioUrlInput');
    var copyBioUrlBtn = document.getElementById('copyBioUrlBtn');
    var viewBioBtn = document.getElementById('viewBioBtn');
    var avatarURLInput = document.getElementById('avatarURLInput');
    var bannerURLInput = document.getElementById('bannerURLInput');
    var songURLInput = document.getElementById('songURLInput');
    var avatarPreview = document.getElementById('avatarPreview');
    var bannerPreview = document.getElementById('bannerPreview');
    var avatarPlaceholder = document.getElementById('avatarPlaceholder');
    var bannerPlaceholder = document.getElementById('bannerPlaceholder');
    var displayName = document.getElementById('displayName');
    var bioText = document.getElementById('bioText');
    var bioCharCount = document.getElementById('bioCharCount');
    var accentColor = document.getElementById('accentColor');
    var accentColorHex = document.getElementById('accentColorHex');
    var linkList = document.getElementById('linkList');

    function setBioUrl(username) {
      if (username) {
        var base = (typeof window !== 'undefined' && window.location && window.location.origin)
          ? (window.location.origin + (window.location.pathname || '/').replace(/\/[^/]*$/, '/'))
          : BASE_URL + '/';
        var fullUrl = base + 'bio?u=' + encodeURIComponent(username);
        var shortDisplay = (base.replace(/\/$/, '')) + '/' + username;
        var viewHref = 'bio?u=' + encodeURIComponent(username);
        if (bioUrlInput) {
          bioUrlInput.value = shortDisplay;
          bioUrlInput.setAttribute('data-full-url', fullUrl);
        }
        if (bioUrlStrip) bioUrlStrip.style.display = 'flex';
        if (viewBioBtn) viewBioBtn.href = viewHref;
      }
    }

    function refreshProfileViews() {
      var el = document.getElementById('profileViewsCount');
      if (!el) return;
      getProfileViews(uid).then(function(n) {
        el.textContent = n.toLocaleString();
      }).catch(function() { el.textContent = '0'; });
    }

    var BADGE_DEFAULT_COLORS = { community: '#7c6bb8', verified: '#22c55e', staff: '#a855f7', owner: '#ef4444', og: '#eab308', premium: '#eab308' };
    function renderBadgesList(badges, badgeVisibility, badgeColors) {
      var grid = document.getElementById('badgesList');
      if (!grid || typeof window.BIO_BADGES === 'undefined') return;
      var icons = window.BADGE_ICONS || {};
      var vis = badgeVisibility || {};
      var colors = badgeColors || {};
      grid.innerHTML = '';
      var b = badges || {};
      var hasPremium = !!(b && b.premium);
      Object.keys(window.BIO_BADGES).forEach(function(key) {
        var info = window.BIO_BADGES[key];
        var hasBadge = !!b[key];
        var showOnProfile = info.userCanToggle ? hasBadge : (hasBadge && vis[key] !== false);
        var card = document.createElement('div');
        card.className = 'badge-card' + (hasBadge ? ' badge-card-owned' : '');
        card.dataset.badgeKey = key;
        var iconSvg = icons[key] || '';
        var iconHtml = iconSvg ? '<div class="badge-card-icon badge-card-icon-' + key + '">' + iconSvg + '</div>' : '<div class="badge-card-icon-placeholder">' + (info.label.charAt(0)) + '</div>';
        var title = '<div class="badge-card-title">' + escapeHtml(info.label) + '</div>';
        var desc = '<div class="badge-card-desc">' + escapeHtml(info.desc) + '</div>';
        var action = '';
        if (info.userCanToggle || hasBadge) {
          action = '<label class="badge-card-action badge-card-action-toggle">' +
            '<input type="checkbox" class="badge-toggle" id="badge' + key.charAt(0).toUpperCase() + key.slice(1) + '" ' + (showOnProfile ? 'checked' : '') + '> ' +
            '<span class="badge-action-label">' + (showOnProfile ? 'On profile' : 'Show on profile') + '</span></label>';
        } else {
          action = '<span class="badge-card-action badge-card-action-status">Granted by admin</span>';
        }
        var colorRow = '';
        if (hasPremium) {
          var defColor = (colors[key] && /^#[0-9A-Fa-f]{6}$/.test(colors[key])) ? colors[key] : (BADGE_DEFAULT_COLORS[key] || '#7c6bb8');
          colorRow = '<div class="badge-card-color-row"><div class="badge-card-color-wrap"><label class="badge-card-color-label">Color</label><div class="color-picker-wrap"><input type="color" class="badge-color-input" data-badge="' + key + '" value="' + defColor + '" aria-label="' + escapeHtml(info.label) + ' color"><input type="text" class="badge-color-hex form-input" data-badge="' + key + '" value="' + defColor + '" maxlength="7" placeholder="#000000"></div></div></div>';
        }
        card.innerHTML = iconHtml + '<div class="badge-card-body">' + title + desc + (colorRow || '') + '</div><div class="badge-card-action-wrap">' + action + '</div>';
        grid.appendChild(card);
        var toggle = card.querySelector('.badge-toggle');
        if (toggle) {
          toggle.addEventListener('change', function() {
            window._editorCurrentData.badgeVisibility = window._editorCurrentData.badgeVisibility || {};
            if (info.userCanToggle) {
            window._editorCurrentData.badges = window._editorCurrentData.badges || {};
            window._editorCurrentData.badges[key] = this.checked;
            } else {
              window._editorCurrentData.badgeVisibility[key] = this.checked;
            }
            var lbl = card.querySelector('.badge-action-label');
            if (lbl) lbl.textContent = this.checked ? 'On profile' : 'Show on profile';
            card.classList.toggle('badge-card-owned', !!window._editorCurrentData.badges[key]);
            updatePreview();
          });
        }
        if (hasPremium) {
          var colorInput = card.querySelector('.badge-color-input');
          var hexInput = card.querySelector('.badge-color-hex');
          if (colorInput && hexInput) {
            window._editorCurrentData.badgeColors = window._editorCurrentData.badgeColors || {};
            colorInput.addEventListener('input', function() {
              hexInput.value = colorInput.value;
              window._editorCurrentData.badgeColors[key] = colorInput.value;
              updatePreview();
            });
            hexInput.addEventListener('input', function() {
              var v = hexInput.value.trim();
              if (/^#[0-9A-Fa-f]{6}$/.test(v)) {
                colorInput.value = v;
                window._editorCurrentData.badgeColors[key] = v;
                updatePreview();
              }
            });
          }
        }
      });
      var filterSel = document.getElementById('badgesFilter');
      if (filterSel) {
        filterSel.onchange = function() {
          var v = filterSel.value;
          grid.querySelectorAll('.badge-card').forEach(function(card) {
            var key = card.dataset.badgeKey;
            var vis = window._editorCurrentData.badgeVisibility || {};
            var owned = !!(window._editorCurrentData.badges && window._editorCurrentData.badges[key]);
            var showOnProfile = (window.BIO_BADGES && window.BIO_BADGES[key] && window.BIO_BADGES[key].userCanToggle) ? owned : (owned && vis[key] !== false);
            var show = v === 'all' || (v === 'owned' && owned) || (v === 'available' && !owned);
            card.style.display = show ? '' : 'none';
          });
        };
      }
    }

    getCurrentUserBio(uid).then(function(data) {
      var d = data || { links: [] };
      window._editorCurrentData = d;

      if (d.username) setBioUrl(d.username);
      var currentHandleEl = document.getElementById('currentHandleDisplay');
      if (currentHandleEl) currentHandleEl.textContent = d.username || '—';
      var cooldownEl = document.getElementById('handleCooldownMsg');
      if (cooldownEl) {
        var lastChange = d.lastUsernameChangeAt;
        var sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
        if (lastChange && (Date.now() - lastChange) < sevenDaysMs) {
          var nextAt = new Date(lastChange + sevenDaysMs);
          cooldownEl.textContent = 'Next change available: ' + nextAt.toLocaleDateString(undefined, { dateStyle: 'medium' }) + ' at ' + nextAt.toLocaleTimeString(undefined, { timeStyle: 'short' });
        } else {
          cooldownEl.textContent = 'You can change your handle now.';
        }
      }
      var currentAliasEl = document.getElementById('currentAliasDisplay');
      if (currentAliasEl) currentAliasEl.textContent = (d.alias && d.alias.trim()) ? d.alias.trim() : '—';
      var aliasCooldownEl = document.getElementById('aliasCooldownMsg');
      if (aliasCooldownEl) {
        var lastAliasChange = d.lastAliasChangeAt;
        var sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
        if (lastAliasChange && (Date.now() - lastAliasChange) < sevenDaysMs) {
          var nextAt = new Date(lastAliasChange + sevenDaysMs);
          aliasCooldownEl.textContent = 'Next change available: ' + nextAt.toLocaleDateString(undefined, { dateStyle: 'medium' }) + ' at ' + nextAt.toLocaleTimeString(undefined, { timeStyle: 'short' });
        } else {
          aliasCooldownEl.textContent = 'You can change your alias now.';
        }
      }
      var newAliasInput = document.getElementById('newAliasInput');
      if (newAliasInput) newAliasInput.value = (d.alias && d.alias.trim()) ? d.alias.trim() : '';
      if (displayName) displayName.value = d.displayName || '';
      if (bioText) {
        bioText.value = d.bio || '';
        if (bioCharCount) bioCharCount.textContent = (d.bio || '').length;
      }
      if (accentColor) accentColor.value = d.accentColor || '#7c6bb8';
      if (accentColorHex) accentColorHex.value = d.accentColor || '#7c6bb8';

      var displayStyleSel = document.getElementById('displayStyleSelect');
      if (displayStyleSel) displayStyleSel.value = (d.displayStyle === 'card') ? 'card' : 'default';
      var modalWrap = document.getElementById('modalOptionsWrap');
      if (modalWrap) modalWrap.style.display = (d.displayStyle === 'card') ? 'block' : 'none';
      var modalBgMode = document.getElementById('modalBackgroundMode');
      var modalSolidWrap = document.getElementById('modalSolidColorWrap');
      var modalGradWrap = document.getElementById('modalGradientWrap');
      if (modalBgMode) {
        var mode = (d.modalUseGradient && d.modalGradientColor1 && d.modalGradientColor2) ? 'gradient' : 'solid';
        modalBgMode.value = mode;
        if (modalSolidWrap) modalSolidWrap.style.display = mode === 'solid' ? '' : 'none';
        if (modalGradWrap) modalGradWrap.style.display = mode === 'gradient' ? '' : 'none';
      }
      var modalBgColor = document.getElementById('modalBackgroundColor');
      var modalBgColorHex = document.getElementById('modalBackgroundColorHex');
      if (modalBgColor) modalBgColor.value = (d.modalBackgroundColor && /^#[0-9A-Fa-f]{6}$/.test(d.modalBackgroundColor)) ? d.modalBackgroundColor : '#12121a';
      if (modalBgColorHex) modalBgColorHex.value = (d.modalBackgroundColor && /^#[0-9A-Fa-f]{6}$/.test(d.modalBackgroundColor)) ? d.modalBackgroundColor : '#12121a';
      var modalGrad1 = document.getElementById('modalGradientColor1');
      var modalGrad1Hex = document.getElementById('modalGradientColor1Hex');
      var modalGrad2 = document.getElementById('modalGradientColor2');
      var modalGrad2Hex = document.getElementById('modalGradientColor2Hex');
      if (modalGrad1) modalGrad1.value = (d.modalGradientColor1 && /^#[0-9A-Fa-f]{6}$/.test(d.modalGradientColor1)) ? d.modalGradientColor1 : '#1a1a24';
      if (modalGrad1Hex) modalGrad1Hex.value = (d.modalGradientColor1 && /^#[0-9A-Fa-f]{6}$/.test(d.modalGradientColor1)) ? d.modalGradientColor1 : '#1a1a24';
      if (modalGrad2) modalGrad2.value = (d.modalGradientColor2 && /^#[0-9A-Fa-f]{6}$/.test(d.modalGradientColor2)) ? d.modalGradientColor2 : '#12121a';
      if (modalGrad2Hex) modalGrad2Hex.value = (d.modalGradientColor2 && /^#[0-9A-Fa-f]{6}$/.test(d.modalGradientColor2)) ? d.modalGradientColor2 : '#12121a';
      var modalOpacityIn = document.getElementById('modalOpacity');
      var modalBlurIn = document.getElementById('modalBlur');
      var modalBorderOpacityIn = document.getElementById('modalBorderOpacity');
      var modalRadiusIn = document.getElementById('modalRadius');
      if (modalOpacityIn) { modalOpacityIn.value = d.modalOpacity != null ? d.modalOpacity : 96; }
      if (modalBlurIn) { modalBlurIn.value = d.modalBlur != null ? d.modalBlur : 0; }
      if (modalBorderOpacityIn) { modalBorderOpacityIn.value = d.modalBorderOpacity != null ? d.modalBorderOpacity : 20; }
      if (modalRadiusIn) { modalRadiusIn.value = d.modalRadius != null ? d.modalRadius : 24; }
      var cardWidthIn = document.getElementById('cardWidth');
      var cardHeightIn = document.getElementById('cardHeight');
      if (cardWidthIn) cardWidthIn.value = (d.cardWidth != null && d.cardWidth > 0) ? d.cardWidth : '';
      if (cardHeightIn) cardHeightIn.value = (d.cardHeight != null && d.cardHeight > 0) ? d.cardHeight : '';
      var modalOpacityVal = document.getElementById('modalOpacityValue');
      var modalBlurVal = document.getElementById('modalBlurValue');
      var modalBorderVal = document.getElementById('modalBorderOpacityValue');
      if (modalOpacityVal) modalOpacityVal.textContent = (d.modalOpacity != null ? d.modalOpacity : 96) + '%';
      if (modalBlurVal) modalBlurVal.textContent = String(d.modalBlur != null ? d.modalBlur : 0);
      if (modalBorderVal) modalBorderVal.textContent = (d.modalBorderOpacity != null ? d.modalBorderOpacity : 20) + '%';
      var fontSel = document.getElementById('fontFamily');
      if (fontSel) fontSel.value = d.fontFamily || 'Outfit';
      var fontSizeIn = document.getElementById('fontSize');
      if (fontSizeIn) fontSizeIn.value = d.fontSize != null ? d.fontSize : 16;
      var letterSpacingIn = document.getElementById('letterSpacing');
      if (letterSpacingIn) letterSpacingIn.value = d.letterSpacing != null ? d.letterSpacing : 0;
      var typewriterCb = document.getElementById('typewriterBio');
      if (typewriterCb) typewriterCb.checked = (d.badges && d.badges.premium) ? !!d.typewriterBio : false;
      var bgEffect = document.getElementById('backgroundEffect');
      if (bgEffect) bgEffect.value = d.backgroundEffect || 'none';
      var btnStyle = document.getElementById('buttonStyle');
      if (btnStyle) btnStyle.value = d.buttonStyle || 'filled';
      var metaTitleIn = document.getElementById('metaTitle');
      if (metaTitleIn) metaTitleIn.value = d.metaTitle || '';
      var metaDescIn = document.getElementById('metaDescription');
      if (metaDescIn) {
        metaDescIn.value = d.metaDescription || '';
        var metaDescCount = document.getElementById('metaDescCount');
        if (metaDescCount) metaDescCount.textContent = (d.metaDescription || '').length;
      }
      var metaImageIn = document.getElementById('metaImageURL');
      if (metaImageIn) metaImageIn.value = d.metaImageURL || '';

      window._editorCurrentData.badges = d.badges || { community: true, og: false, owner: false, staff: false, verified: false, premium: false };
      window._editorCurrentData.badgeVisibility = d.badgeVisibility || {};
      window._editorCurrentData.badgeColors = d.badgeColors && typeof d.badgeColors === 'object' ? d.badgeColors : {};
      window._dashboardIsOwner = !!(d.badges && d.badges.owner);
      renderBadgesList(window._editorCurrentData.badges, window._editorCurrentData.badgeVisibility, window._editorCurrentData.badgeColors);

      var showViewsCb = document.getElementById('showViewsOnBio');
      if (showViewsCb) showViewsCb.checked = !!d.showViewsOnBio;
      var showVerifiedCheckmarkWrap = document.getElementById('showVerifiedCheckmarkWrap');
      var showVerifiedCheckmarkCb = document.getElementById('showVerifiedCheckmark');
      if (showVerifiedCheckmarkWrap) showVerifiedCheckmarkWrap.style.display = (d.badges && d.badges.verified) ? '' : 'none';
      if (showVerifiedCheckmarkCb) showVerifiedCheckmarkCb.checked = !!d.showVerifiedCheckmark;
      refreshProfileViews();

      if (avatarURLInput) avatarURLInput.value = d.avatarURL || '';
      if (bannerURLInput) bannerURLInput.value = d.bannerURL || '';
      if (songURLInput) songURLInput.value = d.songURL || '';
      if (avatarPreview && avatarPlaceholder) {
        if (d.avatarURL) {
          avatarPreview.src = d.avatarURL;
          avatarPreview.style.display = 'block';
          avatarPlaceholder.style.display = 'none';
        } else {
          avatarPreview.style.display = 'none';
          avatarPreview.removeAttribute('src');
          avatarPlaceholder.style.display = 'flex';
        }
      }
      if (bannerPreview && bannerPlaceholder) {
        if (d.bannerURL) {
          bannerPreview.src = d.bannerURL;
          bannerPreview.style.display = 'block';
          bannerPlaceholder.style.display = 'none';
        } else {
          bannerPreview.style.display = 'none';
          bannerPreview.removeAttribute('src');
          bannerPlaceholder.style.display = 'flex';
        }
      }

      var tabPremium = document.getElementById('tabPremium');
      if (tabPremium) tabPremium.style.display = (d.badges && d.badges.premium) ? '' : 'none';
      var tabAdminPanel = document.getElementById('tabAdminPanel');
      if (tabAdminPanel) tabAdminPanel.style.display = (d.badges && d.badges.staff) ? '' : 'none';
      var isOwner = !!(d.badges && d.badges.owner);
      document.querySelectorAll('.da-nav-item[data-section]').forEach(function(nav) {
        var section = nav.dataset.section;
        if (['settings', 'maintenance', 'held', 'export', 'sitedata', 'security'].indexOf(section) !== -1 && !isOwner) nav.style.display = 'none';
        else if (['settings', 'maintenance', 'held', 'export', 'sitedata', 'security'].indexOf(section) !== -1) nav.style.display = '';
      });
      if (d.badges && d.badges.premium) {
        var set = function(id, val) { var el = document.getElementById(id); if (el) el.value = val != null && val !== '' ? val : ''; };
        set('premiumButtonShape', d.premiumButtonShape);
        set('premiumLinkHoverEffect', d.premiumLinkHoverEffect);
        set('premiumLinkFontSize', d.premiumLinkFontSize != null ? d.premiumLinkFontSize : '');
        set('premiumLinkBorderRadius', d.premiumLinkBorderRadius != null ? d.premiumLinkBorderRadius : '');
        set('premiumUsernameEffect', d.premiumUsernameEffect || '');
        var nameColorVal = (d.premiumNameColor && /^#[0-9A-Fa-f]{6}$/.test(String(d.premiumNameColor))) ? d.premiumNameColor : '#ffffff';
        set('premiumNameColor', nameColorVal);
        var pNameColorHex = document.getElementById('premiumNameColorHex');
        if (pNameColorHex) pNameColorHex.value = nameColorVal;
        var bioColorVal = (d.premiumBioColor && /^#[0-9A-Fa-f]{6}$/.test(String(d.premiumBioColor))) ? d.premiumBioColor : '#e2e8f0';
        set('premiumBioColor', bioColorVal);
        var pBioColorHex = document.getElementById('premiumBioColorHex');
        if (pBioColorHex) pBioColorHex.value = bioColorVal;
        set('premiumBioFontSize', d.premiumBioFontSize != null ? d.premiumBioFontSize : '');
        set('premiumCustomFontFamily', d.premiumCustomFontFamily);
        set('premiumLayoutPreset', d.premiumLayoutPreset);
        set('premiumProfileAnimation', d.premiumProfileAnimation);
        var pPar = document.getElementById('premiumParallax');
        if (pPar) pPar.checked = !!d.premiumParallax;
        set('premiumBackgroundEffect', d.premiumBackgroundEffect === 'blurred' ? 'blurred' : '');
        set('premiumVideoBackground', d.premiumVideoBackground);
        set('premiumBannerBlur', d.premiumBannerBlur != null ? d.premiumBannerBlur : '');
        set('premiumAvatarBorder', d.premiumAvatarBorder);
        var pMonochromeBadges = document.getElementById('premiumMonochromeBadges');
        if (pMonochromeBadges) pMonochromeBadges.checked = !!d.premiumMonochromeBadges;
        document.getElementById('premiumHideBranding').checked = !!d.premiumHideBranding;
        var gU = document.getElementById('premiumGlowUsername');
        if (gU) gU.checked = !!d.premiumGlowUsername;
        var gS = document.getElementById('premiumGlowSocials');
        if (gS) gS.checked = !!d.premiumGlowSocials;
        var gB = document.getElementById('premiumGlowBadges');
        if (gB) gB.checked = !!d.premiumGlowBadges;
        var gBio = document.getElementById('premiumGlowBio');
        if (gBio) gBio.checked = !!d.premiumGlowBio;
        var glowColorEl = document.getElementById('premiumGlowColor');
        var glowColorHexEl = document.getElementById('premiumGlowColorHex');
        if (glowColorEl) glowColorEl.value = (d.premiumGlowColor && /^#[0-9A-Fa-f]{6}$/.test(d.premiumGlowColor)) ? d.premiumGlowColor : '#7c6bb8';
        if (glowColorHexEl) glowColorHexEl.value = (d.premiumGlowColor && /^#[0-9A-Fa-f]{6}$/.test(d.premiumGlowColor)) ? d.premiumGlowColor : '#7c6bb8';
        var glowStrengthEl = document.getElementById('premiumGlowStrength');
        var glowStrengthValEl = document.getElementById('premiumGlowStrengthValue');
        if (glowStrengthEl) glowStrengthEl.value = d.premiumGlowStrength != null ? Math.min(200, Math.max(25, parseInt(d.premiumGlowStrength, 10) || 100)) : 100;
        if (glowStrengthValEl) glowStrengthValEl.textContent = (d.premiumGlowStrength != null ? Math.min(200, Math.max(25, parseInt(d.premiumGlowStrength, 10) || 100)) : 100) + '%';
        set('premiumCustomCSS', d.premiumCustomCSS);
      }

      if (linkList) {
        linkList.innerHTML = '';
        (Array.isArray(d.links) ? d.links : []).forEach(function(l) { renderLinkItem(l); });
        updateLinkCount();
      }

      updatePreview(getEditorData());
    }).catch(function() {
      showMsg(msgEl, 'Could not load your bio.', 'error');
    });

    // Tab switching
    document.querySelectorAll('.editor-tab').forEach(function(tab) {
      tab.addEventListener('click', function() {
        switchTab(tab.dataset.tab);
      });
    });

    var dashboardAdminAllUsers = [];
    var dashboardAdminBanned = {};
    var dashboardAdminHardBanned = {};
    var dashboardAdminWired = false;
    var DASHBOARD_BADGE_KEYS = ['community', 'og', 'owner', 'staff', 'verified', 'premium'];

    function escapeHtmlDashboard(s) {
      if (s == null) return '';
      var div = document.createElement('div');
      div.textContent = s;
      return div.innerHTML;
    }

    function maskEmailDashboard(email) {
      if (!email || typeof email !== 'string') return '';
      var e = email.trim();
      var at = e.indexOf('@');
      if (at <= 0 || at >= e.length - 1) return '***';
      var local = e.slice(0, at);
      var domain = e.slice(at + 1);
      var maskedLocal = local.length <= 2 ? (local.charAt(0) + '*') : (local.charAt(0) + '***' + local.charAt(local.length - 1));
      var dot = domain.indexOf('.');
      var maskedDomain = dot <= 0 ? '***' : (domain.charAt(0) + '***' + domain.slice(dot));
      return maskedLocal + '@' + maskedDomain;
    }

    function showDashboardAdminToast(msg, type) {
      type = type || 'success';
      var el = document.getElementById('dashboardAdminToast');
      if (!el) return;
      el.textContent = msg;
      el.className = 'admin-toast ' + type;
      el.style.display = 'block';
      clearTimeout(window._dashboardAdminToastTimer);
      window._dashboardAdminToastTimer = setTimeout(function() { el.style.display = 'none'; }, 3500);
    }

    function getDashboardAdminFilteredList(users, banned) {
      var searchEl = document.getElementById('dashboardAdminUserSearch');
      var filterEl = document.getElementById('dashboardAdminUserFilter');
      var search = (searchEl && searchEl.value) ? searchEl.value.toLowerCase().trim() : '';
      var filter = (filterEl && filterEl.value) ? filterEl.value : 'all';
      var list = users || [];
      if (search) {
        list = list.filter(function(u) {
          return (u.username || '').toLowerCase().indexOf(search) !== -1 ||
            (u.displayName || '').toLowerCase().indexOf(search) !== -1 ||
            (u.email || '').toLowerCase().indexOf(search) !== -1;
        });
      }
      if (filter === 'banned') list = list.filter(function(u) { return banned && banned[u.uid]; });
      if (filter === 'active') list = list.filter(function(u) { return !banned || !banned[u.uid]; });
      return list;
    }

    function renderDashboardAdminTable(users, banned, hardBanned) {
      banned = banned || {};
      hardBanned = hardBanned || {};
      var list = getDashboardAdminFilteredList(users || [], banned);
      var total = (users || []).length;
      var countLine = document.getElementById('dashboardAdminUsersCountLine');
      if (countLine) {
        if (list.length === total) countLine.textContent = 'Showing ' + total + ' user' + (total !== 1 ? 's' : '') + '.';
        else countLine.textContent = 'Showing ' + list.length + ' of ' + total + ' users.';
      }
      var tbody = document.getElementById('dashboardAdminUserList');
      if (!tbody) return;
      tbody.innerHTML = '';
      if (!list.length) {
        tbody.innerHTML = '<tr><td colspan="7" class="admin-empty">No users match.</td></tr>';
        return;
      }
      var base = (window.location && window.location.origin) ? (window.location.origin + (window.location.pathname || '/').replace(/\/[^/]*$/, '/')) : '';
      list.forEach(function(u) {
        var badges = u.badges || {};
        var badgeHtml = DASHBOARD_BADGE_KEYS.map(function(k) {
          return '<span class="badge-pill ' + (badges[k] ? 'on' : '') + '" title="' + k + '">' + k.charAt(0).toUpperCase() + '</span>';
        }).join('');
        var isBanned = !!(banned && banned[u.uid]);
        var isHardBanned = !!(hardBanned && hardBanned[u.uid]);
        var profileUrl = base ? base + 'bio?u=' + encodeURIComponent(u.username) : '#';
        var uidTitle = 'UID ' + (u.userId != null ? u.userId : (u.uid || ''));
        var rawEmail = u.email || '';
        var emailDisplay = rawEmail ? ('<span class="admin-email-text" data-email="' + escapeHtmlDashboard(rawEmail) + '" data-masked="' + escapeHtmlDashboard(maskEmailDashboard(rawEmail)) + '">' + escapeHtmlDashboard(maskEmailDashboard(rawEmail)) + '</span>') : '—';
        var isOwner = !!window._dashboardIsOwner;
        var actions = '<button type="button" class="btn-icon edit-user-btn" data-uid="' + escapeHtmlDashboard(u.uid) + '" title="Edit">✎</button>' +
          '<a href="' + profileUrl + '" target="_blank" rel="noopener" class="btn-icon" title="View profile">↗</a>' +
          (isOwner && rawEmail ? '<button type="button" class="btn-icon admin-email-reveal" aria-label="Reveal email" title="Reveal email">👁</button>' : '');
        if (isBanned) {
          actions += '<button type="button" class="btn-icon unban-btn" data-uid="' + escapeHtmlDashboard(u.uid) + '" title="Unban">↩</button>';
          if (isOwner && isHardBanned && typeof removeIPBan === 'function') actions += '<button type="button" class="btn-icon danger-outline remove-ip-ban-btn" data-uid="' + escapeHtmlDashboard(u.uid) + '" title="Remove IP ban">IP</button>';
        } else {
          actions += '<button type="button" class="btn-icon danger ban-btn" data-uid="' + escapeHtmlDashboard(u.uid) + '" title="Ban">⊗</button>';
          if (isOwner && typeof hardBanUser === 'function') actions += '<button type="button" class="btn-icon danger hard-ban-btn" data-uid="' + escapeHtmlDashboard(u.uid) + '" title="Hard ban (account + IP)">⊛</button>';
        }
        if (isOwner) actions += '<button type="button" class="btn-icon danger-outline delete-account-btn" data-uid="' + escapeHtmlDashboard(u.uid) + '" title="Delete account">⌫</button>';
        var tr = document.createElement('tr');
        tr.title = uidTitle;
        tr.innerHTML =
          '<td><span class="user-name" title="' + escapeHtmlDashboard(uidTitle) + '">' + escapeHtmlDashboard(u.displayName || u.username || '—') + '</span></td>' +
          '<td><a href="' + profileUrl + '" target="_blank" rel="noopener" style="color: var(--purple-accent);" title="' + escapeHtmlDashboard(uidTitle) + '">' + escapeHtmlDashboard(u.username || '—') + '</a></td>' +
          '<td class="admin-email-cell">' + emailDisplay + '</td>' +
          '<td>' + ((u.stats && u.stats.views) || 0).toLocaleString() + '</td>' +
          '<td>' + badgeHtml + '</td>' +
          '<td>' + (isBanned ? '<span class="badge-pill badge-banned">' + (isHardBanned ? 'Hard banned' : 'Banned') + '</span>' : '<span class="badge-pill">Active</span>') + '</td>' +
          '<td class="actions">' + actions + '</td>';
        tbody.appendChild(tr);
      });
      tbody.querySelectorAll('.edit-user-btn').forEach(function(btn) {
        btn.addEventListener('click', function() { openDashboardEditModal(btn.dataset.uid); });
      });
      tbody.querySelectorAll('.ban-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
          if (!confirm('Ban this user? They will not be able to sign in.')) return;
          if (typeof banUser !== 'function') return;
          banUser(btn.dataset.uid).then(function() {
            showDashboardAdminToast('User banned.');
            loadDashboardAdmin();
          }).catch(function() { showDashboardAdminToast('Failed to ban.', 'error'); });
        });
      });
      tbody.querySelectorAll('.hard-ban-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
          if (!confirm('Hard ban: ban this user AND their IP so they cannot create new accounts. Continue?')) return;
          if (typeof hardBanUser !== 'function') return;
          hardBanUser(btn.dataset.uid).then(function() {
            showDashboardAdminToast('User and IP banned.');
            loadDashboardAdmin();
          }).catch(function(err) { showDashboardAdminToast(err && err.message ? err.message : 'Failed to hard ban (no IP on file).', 'error'); });
        });
      });
      tbody.querySelectorAll('.unban-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
          if (typeof unbanUser !== 'function') return;
          unbanUser(btn.dataset.uid).then(function() {
            showDashboardAdminToast('User unbanned.');
            loadDashboardAdmin();
          }).catch(function() { showDashboardAdminToast('Failed to unban.', 'error'); });
        });
      });
      tbody.querySelectorAll('.remove-ip-ban-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
          if (!confirm('Remove IP ban? They can create new accounts from this IP again.')) return;
          if (typeof removeIPBan !== 'function') return;
          removeIPBan(btn.dataset.uid).then(function() {
            showDashboardAdminToast('IP ban removed.');
            loadDashboardAdmin();
          }).catch(function() { showDashboardAdminToast('Failed to remove IP ban.', 'error'); });
        });
      });
      tbody.querySelectorAll('.delete-account-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
          if (!confirm('Permanently delete this user\'s bio and data? Their link will stop working. Their login account will still exist but they will have no profile.')) return;
          if (typeof deleteUserAccount !== 'function') return;
          deleteUserAccount(btn.dataset.uid).then(function() {
            showDashboardAdminToast('User account data deleted.');
            loadDashboardAdmin();
          }).catch(function() { showDashboardAdminToast('Failed to delete account.', 'error'); });
        });
      });
      tbody.querySelectorAll('.admin-email-reveal').forEach(function(btn) {
        btn.addEventListener('click', function() {
          var row = btn.closest('tr');
          if (!row) return;
          var span = row.querySelector('.admin-email-text');
          if (!span) return;
          var full = span.dataset.email || '';
          var masked = span.dataset.masked || '***';
          var isRevealed = span.getAttribute('data-revealed') === '1';
          if (isRevealed) {
            span.textContent = masked;
            span.setAttribute('data-revealed', '0');
            btn.setAttribute('aria-label', 'Reveal email');
            btn.setAttribute('title', 'Reveal email');
          } else {
            span.textContent = full;
            span.setAttribute('data-revealed', '1');
            btn.setAttribute('aria-label', 'Hide email');
            btn.setAttribute('title', 'Hide email');
          }
        });
      });
    }

    function openDashboardEditModal(uid) {
      var uidEl = document.getElementById('dashboardAdminEditUid');
      if (uidEl) uidEl.value = uid;
      if (typeof getCurrentUserBio !== 'function') return;
      getCurrentUserBio(uid).then(function(data) {
        if (!data) return;
        var dn = document.getElementById('dashboardAdminEditDisplayName');
        var bio = document.getElementById('dashboardAdminEditBio');
        if (dn) dn.value = data.displayName || '';
        if (bio) bio.value = data.bio || '';
        window._dashboardAdminEditOriginalBadges = data.badges || {};
        var listEl = document.getElementById('dashboardAdminEditBadgesList');
        if (listEl) {
          listEl.innerHTML = '';
          var badges = data.badges || {};
          var isOwner = !!window._dashboardIsOwner;
          DASHBOARD_BADGE_KEYS.forEach(function(k) {
            var label = document.createElement('label');
            label.className = 'admin-edit-badge-label';
            var disabled = (k === 'staff' && !isOwner) ? ' disabled' : '';
            label.innerHTML = '<input type="checkbox" class="edit-badge-cb" data-badge="' + k + '" ' + (badges[k] ? 'checked' : '') + disabled + '> ' + k;
            listEl.appendChild(label);
          });
        }
        var modal = document.getElementById('dashboardAdminEditModal');
        if (modal) modal.classList.add('on');
      }).catch(function() { showDashboardAdminToast('Could not load user.', 'error'); });
    }

    function saveDashboardEditUser() {
      var uidEl = document.getElementById('dashboardAdminEditUid');
      var uid = uidEl ? uidEl.value : '';
      if (!uid || typeof adminUpdateUserProfile !== 'function') return;
      var data = {
        displayName: (document.getElementById('dashboardAdminEditDisplayName') && document.getElementById('dashboardAdminEditDisplayName').value) || '',
        bio: (document.getElementById('dashboardAdminEditBio') && document.getElementById('dashboardAdminEditBio').value) || '',
        badges: {}
      };
      var listEl = document.getElementById('dashboardAdminEditBadgesList');
      if (listEl) {
        listEl.querySelectorAll('.edit-badge-cb').forEach(function(cb) {
          data.badges[cb.dataset.badge] = cb.checked;
        });
        if (!window._dashboardIsOwner && window._dashboardAdminEditOriginalBadges) {
          data.badges.staff = !!window._dashboardAdminEditOriginalBadges.staff;
        }
      }
      adminUpdateUserProfile(uid, data).then(function() {
        var modal = document.getElementById('dashboardAdminEditModal');
        if (modal) modal.classList.remove('on');
        showDashboardAdminToast('User updated.');
        loadDashboardAdmin();
      }).catch(function() { showDashboardAdminToast('Failed to save.', 'error'); });
    }

    function getBaseUrlDashboard() {
      return (window.location && window.location.origin)
        ? (window.location.origin + (window.location.pathname || '/').replace(/\/[^/]*$/, '/'))
        : '';
    }

    function switchDaSection(section) {
      document.querySelectorAll('.da-nav-item').forEach(function(n) {
        n.classList.toggle('active', n.dataset.section === section);
      });
      document.querySelectorAll('.da-section').forEach(function(s) {
        var id = s.id;
        var name = id ? id.replace('daSection', '').toLowerCase() : '';
        var first = name.charAt(0).toLowerCase();
        var rest = name.slice(1);
        s.classList.toggle('on', first + rest === section);
      });
      if (section === 'security' && typeof getAdminUids === 'function') loadDaSecurity();
      if (section === 'held') loadDaHeld();
    }

    function renderDaOverviewStats(users, banned) {
      var total = (users || []).length;
      var bannedCount = banned ? Object.keys(banned).filter(function(k) { return banned[k]; }).length : 0;
      var totalViews = 0;
      (users || []).forEach(function(u) { totalViews += (u.stats && u.stats.views) || 0; });
      var el = document.getElementById('daUserCount');
      if (el) el.textContent = total.toLocaleString();
      el = document.getElementById('daTotalViews');
      if (el) el.textContent = totalViews.toLocaleString();
      el = document.getElementById('daBannedCount');
      if (el) el.textContent = bannedCount.toLocaleString();
      el = document.getElementById('daActiveCount');
      if (el) el.textContent = (total - bannedCount).toLocaleString();
      el = document.getElementById('daOverviewLastUpdated');
      if (el) el.textContent = 'Last updated: ' + new Date().toLocaleString();
    }

    function renderDaOverviewTopUsers(users) {
      var list = (users || []).slice().sort(function(a, b) {
        var va = (a.stats && a.stats.views) || 0;
        var vb = (b.stats && b.stats.views) || 0;
        return vb - va;
      }).slice(0, 5);
      var el = document.getElementById('daOverviewTopUsers');
      if (!el) return;
      if (!list.length) {
        el.innerHTML = '<li class="admin-empty">No profile views yet.</li>';
        return;
      }
      var base = getBaseUrlDashboard();
      el.innerHTML = list.map(function(u, i) {
        var views = (u.stats && u.stats.views) || 0;
        var link = base ? '<a href="' + base + 'bio?u=' + encodeURIComponent(u.username) + '" target="_blank" rel="noopener" style="color: var(--purple-accent);">' + escapeHtmlDashboard(u.username || '—') + '</a>' : escapeHtmlDashboard(u.username || '—');
        return '<li><span class="rank">' + (i + 1) + '</span><span class="name">' + link + '</span><span class="value">' + views.toLocaleString() + ' views</span></li>';
      }).join('');
    }

    function renderDaAnalyticsTopUsers(users) {
      var list = (users || []).slice().sort(function(a, b) {
        var va = (a.stats && a.stats.views) || 0;
        var vb = (b.stats && b.stats.views) || 0;
        return vb - va;
      }).slice(0, 20);
      var el = document.getElementById('daAnalyticsTopUsers');
      if (!el) return;
      if (!list.length) {
        el.innerHTML = '<li class="admin-empty">No data yet.</li>';
        return;
      }
      var base = getBaseUrlDashboard();
      el.innerHTML = list.map(function(u, i) {
        var views = (u.stats && u.stats.views) || 0;
        var link = base ? '<a href="' + base + 'bio?u=' + encodeURIComponent(u.username) + '" target="_blank" rel="noopener" style="color: var(--purple-accent);">' + escapeHtmlDashboard(u.username || '—') + '</a>' : escapeHtmlDashboard(u.username || '—');
        return '<li><span class="rank">' + (i + 1) + '</span><span class="name">' + link + '</span><span class="value">' + views.toLocaleString() + '</span></li>';
      }).join('');
    }

    function renderDaActivityRecentSignups(users) {
      var list = (users || []).slice().filter(function(u) { return u.createdAt != null; }).sort(function(a, b) { return (b.createdAt || 0) - (a.createdAt || 0); }).slice(0, 25);
      var el = document.getElementById('daActivityRecentSignups');
      if (!el) return;
      if (!list.length) {
        el.innerHTML = '<li class="admin-empty">No signups with join date yet.</li>';
        return;
      }
      var base = getBaseUrlDashboard();
      el.innerHTML = list.map(function(u) {
        var date = u.createdAt ? (typeof u.createdAt === 'number' ? new Date(u.createdAt).toLocaleString() : String(u.createdAt)) : '—';
        var link = base ? '<a href="' + base + 'bio?u=' + encodeURIComponent(u.username) + '" target="_blank" rel="noopener" style="color: var(--purple-accent);">' + escapeHtmlDashboard(u.username || '—') + '</a>' : escapeHtmlDashboard(u.username || '—');
        return '<li><span class="name">' + link + '</span> <span class="admin-activity-date">' + escapeHtmlDashboard(date) + '</span></li>';
      }).join('');
    }

    function renderDaBannedList(users, banned) {
      var list = (users || []).filter(function(u) { return banned && banned[u.uid]; });
      var countLine = document.getElementById('daBannedCountLine');
      var ul = document.getElementById('daBannedUserList');
      var empty = document.getElementById('daBannedEmpty');
      if (countLine) countLine.textContent = list.length === 0 ? '0 banned users.' : list.length + ' banned user' + (list.length !== 1 ? 's' : '') + '.';
      if (!ul) return;
      if (list.length === 0) {
        ul.innerHTML = '';
        if (empty) empty.style.display = 'block';
        return;
      }
      if (empty) empty.style.display = 'none';
      ul.innerHTML = list.map(function(u) {
        var rawEmail = u.email || '';
        var emailPart = rawEmail ? ('<span class="admin-email-text" data-email="' + escapeHtmlDashboard(rawEmail) + '" data-masked="' + escapeHtmlDashboard(maskEmailDashboard(rawEmail)) + '">' + escapeHtmlDashboard(maskEmailDashboard(rawEmail)) + '</span>') : '';
        return '<li><span class="name">' + escapeHtmlDashboard(u.username || u.uid) + (emailPart ? ' — ' + emailPart : '') + '</span>' + (window._dashboardIsOwner && rawEmail ? '<button type="button" class="btn-icon admin-email-reveal" aria-label="Reveal email" title="Reveal email">👁</button>' : '') + '<button type="button" class="btn btn-ghost unban-list-btn" data-uid="' + escapeHtmlDashboard(u.uid) + '" style="font-size: 0.85rem;">Unban</button></li>';
      }).join('');
      ul.querySelectorAll('.unban-list-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
          if (typeof unbanUser !== 'function') return;
          unbanUser(btn.dataset.uid).then(function() {
            showDashboardAdminToast('User unbanned.');
            loadDashboardAdmin();
          }).catch(function() { showDashboardAdminToast('Failed to unban.', 'error'); });
        });
      });
      ul.querySelectorAll('.admin-email-reveal').forEach(function(btn) {
        btn.addEventListener('click', function() {
          var row = btn.closest('li');
          if (!row) return;
          var span = row.querySelector('.admin-email-text');
          if (!span) return;
          var full = span.dataset.email || '';
          var masked = span.dataset.masked || '***';
          var isRevealed = span.getAttribute('data-revealed') === '1';
          if (isRevealed) {
            span.textContent = masked;
            span.setAttribute('data-revealed', '0');
            btn.setAttribute('aria-label', 'Reveal email');
            btn.setAttribute('title', 'Reveal email');
          } else {
            span.textContent = full;
            span.setAttribute('data-revealed', '1');
            btn.setAttribute('aria-label', 'Hide email');
            btn.setAttribute('title', 'Hide email');
          }
        });
      });
    }

    function loadDaMaintenance() {
      if (typeof getSiteConfig !== 'function') return;
      getSiteConfig().then(function(c) {
        var t = document.getElementById('daMaintenanceToggle');
        var l = document.getElementById('daMaintenanceLabel');
        var m = document.getElementById('daMaintenanceMessage');
        if (t) { t.classList.toggle('on', c.maintenanceMode); t.setAttribute('aria-pressed', c.maintenanceMode); }
        if (l) l.textContent = c.maintenanceMode ? 'Maintenance mode is on' : 'Maintenance mode is off';
        if (m) m.value = c.maintenanceMessage || '';
      }).catch(function() {});
    }

    function loadDaSettings() {
      if (typeof getSiteConfig !== 'function') return;
      getSiteConfig().then(function(c) {
        var el = document.getElementById('daSettingsSiteName');
        if (el) el.value = c.siteName || 'nightbio';
        el = document.getElementById('daSettingsTagline');
        if (el) el.value = c.tagline || '';
        el = document.getElementById('daSettingsAllowSignups');
        if (el) el.checked = c.allowSignups !== false;
        el = document.getElementById('daSettingsAnnouncementEnabled');
        if (el) el.checked = !!c.announcementEnabled;
        el = document.getElementById('daSettingsAnnouncementText');
        if (el) el.value = c.announcementText || '';
      }).catch(function() {});
    }

    function loadDaSecurity() {
      if (typeof getAdminUids !== 'function') return;
      getAdminUids().then(function(uids) {
        var list = document.getElementById('daSecurityAdminList');
        if (!list) return;
        if (!uids.length) {
          list.innerHTML = '<li class="admin-empty">No admin UIDs in database. Add adminUids/&lt;uid&gt; = true in Firebase Console.</li>';
          return;
        }
        list.innerHTML = uids.map(function(uid) {
          return '<li><code class="admin-uid-code">' + escapeHtmlDashboard(uid) + '</code></li>';
        }).join('');
      }).catch(function() { showDashboardAdminToast('Failed to load admins.', 'error'); });
    }

    function loadDaHeld() {
      var db = window.firebaseDb;
      if (!db) return;
      db.ref('heldUsernames').once('value').then(function(snap) {
        var val = snap.val();
        var keys = val && typeof val === 'object' ? Object.keys(val) : [];
        renderDaHeldUsernameList(keys);
      }).catch(function() { showDashboardAdminToast('Failed to load held usernames.', 'error'); });
    }

    function renderDaHeldUsernameList(normalizedList) {
      var list = document.getElementById('daHeldUsernameList');
      var empty = document.getElementById('daHeldUsernameEmpty');
      if (!list) return;
      if (!normalizedList || normalizedList.length === 0) {
        list.innerHTML = '';
        if (empty) empty.style.display = 'block';
        return;
      }
      if (empty) empty.style.display = 'none';
      list.innerHTML = normalizedList.sort().map(function(normalized) {
        return '<li><span class="name">' + escapeHtmlDashboard(normalized) + '</span> <button type="button" class="btn btn-ghost btn-sm da-held-remove" data-held="' + escapeHtmlDashboard(normalized) + '" style="font-size: 0.85rem;">Remove</button></li>';
      }).join('');
      list.querySelectorAll('.da-held-remove').forEach(function(btn) {
        btn.addEventListener('click', function() {
          var n = this.getAttribute('data-held');
          if (!n) return;
          var db = window.firebaseDb;
          if (!db) return;
          db.ref('heldUsernames/' + n).remove().then(function() {
            showDashboardAdminToast('Removed from holding.');
            loadDaHeld();
          }).catch(function() { showDashboardAdminToast('Failed to remove.', 'error'); });
        });
      });
    }

    function exportDaCsv() {
      var rows = [['Username', 'Email', 'Display name', 'UID', 'Views', 'Joined']];
      (dashboardAdminAllUsers || []).forEach(function(u) {
        var joined = u.createdAt ? (typeof u.createdAt === 'number' ? new Date(u.createdAt).toISOString() : String(u.createdAt)) : '';
        rows.push([
          (u.username || '').replace(/"/g, '""'),
          (u.email || '').replace(/"/g, '""'),
          (u.displayName || '').replace(/"/g, '""'),
          u.userId != null ? u.userId : '',
          (u.stats && u.stats.views) || 0,
          joined
        ]);
      });
      var csv = rows.map(function(r) { return r.map(function(c) { return '"' + c + '"'; }).join(','); }).join('\n');
      var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'nightbio-users-' + (new Date().toISOString().slice(0, 10)) + '.csv';
      a.click();
      URL.revokeObjectURL(a.href);
      showDashboardAdminToast('CSV downloaded.');
    }

    function loadDashboardAdmin() {
      if (typeof getAllUsers !== 'function' || typeof getBannedUids !== 'function') return;
      getAllUsers().then(function(users) {
        dashboardAdminAllUsers = users || [];
        return Promise.all([getBannedUids().catch(function() { return {}; }), typeof getHardBannedUids === 'function' ? getHardBannedUids().catch(function() { return {}; }) : Promise.resolve({})]);
      }).then(function(res) {
        var banned = res[0] || {};
        var hardBanned = res[1] || {};
        dashboardAdminBanned = banned;
        dashboardAdminHardBanned = hardBanned;
        renderDaOverviewStats(dashboardAdminAllUsers, dashboardAdminBanned);
        renderDaOverviewTopUsers(dashboardAdminAllUsers);
        renderDaAnalyticsTopUsers(dashboardAdminAllUsers);
        renderDaActivityRecentSignups(dashboardAdminAllUsers);
        renderDaBannedList(dashboardAdminAllUsers, dashboardAdminBanned);
        renderDashboardAdminTable(dashboardAdminAllUsers, dashboardAdminBanned, dashboardAdminHardBanned);
        loadDaMaintenance();
        loadDaSettings();
        loadDaHeld();
      }).catch(function(err) {
        console.error(err);
        renderDashboardAdminTable([], {}, {});
        renderDaOverviewStats([], {});
        showDashboardAdminToast('Failed to load users.', 'error');
      });
    }
    window.loadDashboardAdmin = loadDashboardAdmin;

    if (!dashboardAdminWired) {
      dashboardAdminWired = true;
      var searchEl = document.getElementById('dashboardAdminUserSearch');
      var filterEl = document.getElementById('dashboardAdminUserFilter');
      var refreshBtn = document.getElementById('dashboardAdminRefresh');
      if (searchEl) searchEl.addEventListener('input', function() { renderDashboardAdminTable(dashboardAdminAllUsers, dashboardAdminBanned, dashboardAdminHardBanned); });
      if (filterEl) filterEl.addEventListener('change', function() { renderDashboardAdminTable(dashboardAdminAllUsers, dashboardAdminBanned, dashboardAdminHardBanned); });
      if (refreshBtn) refreshBtn.addEventListener('click', function() { loadDashboardAdmin(); showDashboardAdminToast('Data refreshed.'); });
      document.querySelectorAll('.da-nav-item').forEach(function(btn) {
        btn.addEventListener('click', function() { switchDaSection(btn.dataset.section); });
      });
      document.querySelectorAll('.da-quick').forEach(function(btn) {
        btn.addEventListener('click', function() { switchDaSection(btn.dataset.section); });
      });
      var maintToggle = document.getElementById('daMaintenanceToggle');
      if (maintToggle) {
        maintToggle.addEventListener('click', function() {
          this.classList.toggle('on');
          this.setAttribute('aria-pressed', this.classList.contains('on'));
          var lbl = document.getElementById('daMaintenanceLabel');
          if (lbl) lbl.textContent = this.classList.contains('on') ? 'Maintenance mode is on' : 'Maintenance mode is off';
        });
      }
      var maintSave = document.getElementById('daMaintenanceSave');
      if (maintSave) {
        maintSave.addEventListener('click', function() {
          var on = (document.getElementById('daMaintenanceToggle') || {}).classList && document.getElementById('daMaintenanceToggle').classList.contains('on');
          var msg = (document.getElementById('daMaintenanceMessage') && document.getElementById('daMaintenanceMessage').value) ? document.getElementById('daMaintenanceMessage').value.trim() : '';
          if (typeof setMaintenanceMode !== 'function') return;
          setMaintenanceMode(on, msg || "We'll be back soon.").then(function() {
            showDashboardAdminToast('Maintenance settings saved.');
            loadDaMaintenance();
          }).catch(function() { showDashboardAdminToast('Failed to save.', 'error'); });
        });
      }
      var settingsSave = document.getElementById('daSettingsSave');
      if (settingsSave) {
        settingsSave.addEventListener('click', function() {
          if (typeof setSiteConfig !== 'function') return;
          var siteName = (document.getElementById('daSettingsSiteName') && document.getElementById('daSettingsSiteName').value) ? document.getElementById('daSettingsSiteName').value.trim() : 'nightbio';
          var tagline = (document.getElementById('daSettingsTagline') && document.getElementById('daSettingsTagline').value) ? document.getElementById('daSettingsTagline').value.trim() : '';
          var allowSignups = (document.getElementById('daSettingsAllowSignups') && document.getElementById('daSettingsAllowSignups').checked);
          var announcementEnabled = !!(document.getElementById('daSettingsAnnouncementEnabled') && document.getElementById('daSettingsAnnouncementEnabled').checked);
          var announcementText = (document.getElementById('daSettingsAnnouncementText') && document.getElementById('daSettingsAnnouncementText').value) ? document.getElementById('daSettingsAnnouncementText').value.trim() : '';
          setSiteConfig({ siteName: siteName, tagline: tagline, allowSignups: allowSignups, announcementEnabled: announcementEnabled, announcementText: announcementText }).then(function() {
            showDashboardAdminToast('Settings saved.');
            loadDaSettings();
          }).catch(function() { showDashboardAdminToast('Failed to save settings.', 'error'); });
        });
      }
      var exportBtn = document.getElementById('daExportCsvBtn');
      if (exportBtn) exportBtn.addEventListener('click', exportDaCsv);

      var SITE_DATA_BACKUP_KEYS = ['users', 'usernames', 'aliases', 'siteConfig', 'heldUsernames', 'bannedUids', 'bannedIPs', 'hardBannedUids', 'profileViews', 'meta', 'adminUids'];
      var SITE_DATA_RESTORE_KEYS = ['users', 'usernames', 'aliases', 'siteConfig', 'heldUsernames', 'bannedUids', 'bannedIPs', 'hardBannedUids', 'profileViews', 'meta'];

      function downloadSiteDataBackup() {
        var db = window.firebaseDb;
        if (!db) {
          showDashboardAdminToast('Database not ready.', 'error');
          return;
        }
        var btn = document.getElementById('daSiteDataDownloadBtn');
        if (btn) btn.disabled = true;
        var promises = SITE_DATA_BACKUP_KEYS.map(function(key) {
          return db.ref(key).once('value').then(function(snap) { return { key: key, val: snap.val() }; });
        });
        Promise.all(promises).then(function(results) {
          var backup = { _exportedAt: new Date().toISOString(), _version: 1 };
          results.forEach(function(r) { backup[r.key] = r.val; });
          var json = JSON.stringify(backup, null, 2);
          var blob = new Blob([json], { type: 'application/json;charset=utf-8' });
          var a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = 'nightbio-site-backup-' + (new Date().toISOString().slice(0, 19).replace(/:/g, '-')) + '.json';
          a.click();
          URL.revokeObjectURL(a.href);
          showDashboardAdminToast('Backup downloaded.');
        }).catch(function(err) {
          console.error(err);
          showDashboardAdminToast('Failed to download backup.', 'error');
        }).then(function() {
          if (btn) btn.disabled = false;
        });
      }

      function restoreSiteDataFromFile() {
        var fileInput = document.getElementById('daSiteDataFileInput');
        var msgEl = document.getElementById('daSiteDataRestoreMsg');
        if (!fileInput || !fileInput.files || !fileInput.files.length) {
          if (msgEl) { msgEl.textContent = 'Choose a backup file first.'; msgEl.style.color = 'var(--error, #e11)'; }
          return;
        }
        var file = fileInput.files[0];
        var db = window.firebaseDb;
        if (!db) {
          if (msgEl) msgEl.textContent = 'Database not ready.';
          showDashboardAdminToast('Database not ready.', 'error');
          return;
        }
        if (!window.confirm('Restore will overwrite ALL current site data (users, usernames, settings, bans, etc.) with the contents of the backup file. Admin UIDs will not be changed. Continue?')) {
          return;
        }
        if (msgEl) { msgEl.textContent = 'Restoring…'; msgEl.style.color = ''; }
        var restoreBtn = document.getElementById('daSiteDataRestoreBtn');
        if (restoreBtn) restoreBtn.disabled = true;
        var reader = new FileReader();
        reader.onload = function() {
          var json = reader.result;
          var data;
          try {
            data = JSON.parse(json);
          } catch (e) {
            if (msgEl) { msgEl.textContent = 'Invalid JSON in file.'; msgEl.style.color = 'var(--error, #e11)'; }
            if (restoreBtn) restoreBtn.disabled = false;
            fileInput.value = '';
            showDashboardAdminToast('Invalid backup file.', 'error');
            return;
          }
          var promises = SITE_DATA_RESTORE_KEYS.map(function(key) {
            var val = data[key];
            return db.ref(key).set(val !== undefined ? val : null);
          });
          Promise.all(promises).then(function() {
            if (msgEl) { msgEl.textContent = 'Restore complete.'; msgEl.style.color = 'var(--success, #0a0)'; }
            fileInput.value = '';
            showDashboardAdminToast('Site data restored.');
            loadDashboardAdmin();
          }).catch(function(err) {
            console.error(err);
            if (msgEl) { msgEl.textContent = 'Restore failed. Check console.'; msgEl.style.color = 'var(--error, #e11)'; }
            showDashboardAdminToast('Restore failed.', 'error');
          }).then(function() {
            if (restoreBtn) restoreBtn.disabled = false;
          });
        };
        reader.onerror = function() {
          if (msgEl) msgEl.textContent = 'Could not read file.';
          if (restoreBtn) restoreBtn.disabled = false;
          showDashboardAdminToast('Could not read file.', 'error');
        };
        reader.readAsText(file, 'UTF-8');
      }

      var daSiteDataDownloadBtn = document.getElementById('daSiteDataDownloadBtn');
      var daSiteDataRestoreBtn = document.getElementById('daSiteDataRestoreBtn');
      if (daSiteDataDownloadBtn) daSiteDataDownloadBtn.addEventListener('click', downloadSiteDataBackup);
      if (daSiteDataRestoreBtn) daSiteDataRestoreBtn.addEventListener('click', restoreSiteDataFromFile);

      var heldAdd = document.getElementById('daHeldUsernameAdd');
      var heldInput = document.getElementById('daHeldUsernameInput');
      var heldMsg = document.getElementById('daHeldUsernameMsg');
      if (heldAdd && heldInput) {
        heldAdd.addEventListener('click', function() {
          var raw = heldInput.value.trim();
          if (heldMsg) heldMsg.textContent = '';
          if (!raw) {
            if (heldMsg) { heldMsg.textContent = 'Enter a username.'; heldMsg.style.color = ''; }
            return;
          }
          if (typeof isValidUsername !== 'function' || !isValidUsername(raw)) {
            if (heldMsg) { heldMsg.textContent = 'Username must be 3–20 characters, letters, numbers and underscores only.'; heldMsg.style.color = 'var(--text-error, #e11)'; }
            return;
          }
          var normalized = raw.toLowerCase();
          var db = window.firebaseDb;
          if (!db) { if (heldMsg) heldMsg.textContent = 'Database not ready.'; return; }
          heldAdd.disabled = true;
          db.ref('heldUsernames/' + normalized).set(true).then(function() {
            if (heldMsg) { heldMsg.textContent = 'Added.'; heldMsg.style.color = 'var(--success, #0a0)'; }
            heldInput.value = '';
            loadDaHeld();
          }).catch(function() {
            if (heldMsg) { heldMsg.textContent = 'Failed to add (check permissions).'; heldMsg.style.color = 'var(--text-error, #e11)'; }
            showDashboardAdminToast('Failed to add.', 'error');
          }).then(function() { heldAdd.disabled = false; });
        });
      }
      var editCancel = document.getElementById('dashboardAdminEditCancel');
      var editSave = document.getElementById('dashboardAdminEditSave');
      var editModal = document.getElementById('dashboardAdminEditModal');
      if (editCancel) editCancel.addEventListener('click', function() { if (editModal) editModal.classList.remove('on'); });
      if (editModal) editModal.addEventListener('click', function(e) { if (e.target === editModal) editModal.classList.remove('on'); });
      if (editSave) editSave.addEventListener('click', saveDashboardEditUser);
    }

    function syncMediaFromInputs() {
      if (avatarURLInput) {
        window._editorCurrentData.avatarURL = avatarURLInput.value.trim();
        if (avatarPreview && avatarPlaceholder) {
          if (window._editorCurrentData.avatarURL) {
            avatarPreview.src = window._editorCurrentData.avatarURL;
            avatarPreview.style.display = 'block';
            avatarPlaceholder.style.display = 'none';
          } else {
            avatarPreview.style.display = 'none';
            avatarPreview.removeAttribute('src');
            avatarPlaceholder.style.display = 'flex';
          }
        }
      }
      if (bannerURLInput) {
        window._editorCurrentData.bannerURL = bannerURLInput.value.trim();
        if (bannerPreview && bannerPlaceholder) {
          if (window._editorCurrentData.bannerURL) {
            bannerPreview.src = window._editorCurrentData.bannerURL;
            bannerPreview.style.display = 'block';
            bannerPlaceholder.style.display = 'none';
          } else {
            bannerPreview.style.display = 'none';
            bannerPreview.removeAttribute('src');
            bannerPlaceholder.style.display = 'flex';
          }
        }
      }
      if (songURLInput) window._editorCurrentData.songURL = songURLInput.value.trim();
          updatePreview();
    }
    if (avatarURLInput) {
      avatarURLInput.addEventListener('input', syncMediaFromInputs);
      avatarURLInput.addEventListener('change', syncMediaFromInputs);
    }
    if (bannerURLInput) {
      bannerURLInput.addEventListener('input', syncMediaFromInputs);
      bannerURLInput.addEventListener('change', syncMediaFromInputs);
    }
    if (songURLInput) {
      songURLInput.addEventListener('input', function() { window._editorCurrentData.songURL = songURLInput.value.trim(); updatePreview(); });
      songURLInput.addEventListener('change', function() { window._editorCurrentData.songURL = songURLInput.value.trim(); updatePreview(); });
    }

    if (displayName) {
      displayName.addEventListener('input', function() { updatePreview(); });
      displayName.addEventListener('change', function() { updatePreview(); });
    }

    var changeHandleBtn = document.getElementById('changeHandleBtn');
    var newHandleInput = document.getElementById('newHandleInput');
    var handleChangeMsg = document.getElementById('handleChangeMsg');
    if (changeHandleBtn && newHandleInput && typeof changeUsername === 'function' && typeof isValidUsername === 'function') {
      changeHandleBtn.addEventListener('click', function() {
        var raw = newHandleInput.value.trim();
        if (!raw) {
          if (handleChangeMsg) { handleChangeMsg.textContent = 'Enter a new handle.'; handleChangeMsg.style.color = ''; }
          return;
        }
        if (!isValidUsername(raw)) {
          if (handleChangeMsg) { handleChangeMsg.textContent = 'Handle must be 3–20 characters, letters, numbers and underscores only.'; handleChangeMsg.style.color = 'var(--text-error, #e11)'; }
          return;
        }
        if (handleChangeMsg) handleChangeMsg.textContent = '';
        changeHandleBtn.disabled = true;
        changeUsername(uid, raw).then(function(newUsername) {
          if (handleChangeMsg) { handleChangeMsg.textContent = 'Handle updated to @' + newUsername + '.'; handleChangeMsg.style.color = 'var(--success, #0a0)'; }
          newHandleInput.value = '';
          var currentHandleEl = document.getElementById('currentHandleDisplay');
          if (currentHandleEl) currentHandleEl.textContent = newUsername;
          setBioUrl(newUsername);
          window._editorCurrentData.username = newUsername;
          var cooldownEl = document.getElementById('handleCooldownMsg');
          if (cooldownEl) cooldownEl.textContent = 'Next change available in 7 days.';
          changeHandleBtn.disabled = false;
        }).catch(function(err) {
          if (handleChangeMsg) { handleChangeMsg.textContent = err && err.message ? err.message : 'Could not change handle.'; handleChangeMsg.style.color = 'var(--text-error, #e11)'; }
          changeHandleBtn.disabled = false;
        });
      });
    }

    var changeAliasBtn = document.getElementById('changeAliasBtn');
    var newAliasInput = document.getElementById('newAliasInput');
    var aliasChangeMsg = document.getElementById('aliasChangeMsg');
    if (changeAliasBtn && newAliasInput && typeof changeAlias === 'function' && typeof isValidUsername === 'function') {
      changeAliasBtn.addEventListener('click', function() {
        var raw = newAliasInput.value.trim();
        if (aliasChangeMsg) aliasChangeMsg.textContent = '';
        changeAliasBtn.disabled = true;
        changeAlias(uid, raw).then(function(newAlias) {
          if (aliasChangeMsg) {
            aliasChangeMsg.textContent = newAlias ? ('Alias updated to @' + newAlias + '.') : 'Alias removed.';
            aliasChangeMsg.style.color = 'var(--success, #0a0)';
          }
          newAliasInput.value = newAlias;
          var currentAliasEl = document.getElementById('currentAliasDisplay');
          if (currentAliasEl) currentAliasEl.textContent = newAlias || '—';
          window._editorCurrentData.alias = newAlias || '';
          var aliasCooldownEl = document.getElementById('aliasCooldownMsg');
          if (aliasCooldownEl) aliasCooldownEl.textContent = raw ? 'Next change available in 7 days.' : 'You can change your alias now.';
          updatePreview();
          changeAliasBtn.disabled = false;
        }).catch(function(err) {
          if (aliasChangeMsg) { aliasChangeMsg.textContent = err && err.message ? err.message : 'Could not change alias.'; aliasChangeMsg.style.color = 'var(--text-error, #e11)'; }
          changeAliasBtn.disabled = false;
        });
      });
    }

    if (bioText) {
      bioText.addEventListener('input', function() {
        if (bioCharCount) bioCharCount.textContent = bioText.value.length;
        updatePreview();
      });
      bioText.addEventListener('change', updatePreview);
    }
    if (accentColor) {
      accentColor.addEventListener('input', function() {
        if (accentColorHex) accentColorHex.value = accentColor.value;
        updatePreview();
      });
    }
    if (accentColorHex) {
      accentColorHex.addEventListener('input', function() {
        var v = accentColorHex.value.trim();
        if (/^#[0-9A-Fa-f]{6}$/.test(v) && accentColor) accentColor.value = v;
        updatePreview();
      });
    }

    if (addLinkBtn) {
      addLinkBtn.addEventListener('click', function() {
        if (linkList && linkList.querySelectorAll('.link-item').length >= MAX_LINKS) return;
        renderLinkItem(null);
        updateLinkCount();
        updatePreview();
      });
    }

    function getEditorDataForSave() {
        var fontSel = document.getElementById('fontFamily');
        var fontSizeIn = document.getElementById('fontSize');
        var letterSpacingIn = document.getElementById('letterSpacing');
        var typewriterCb = document.getElementById('typewriterBio');
        var bgEffect = document.getElementById('backgroundEffect');
        var btnStyle = document.getElementById('buttonStyle');
        var metaTitleIn = document.getElementById('metaTitle');
        var metaDescIn = document.getElementById('metaDescription');
        var metaImageIn = document.getElementById('metaImageURL');
        var badgeCommunityEl = document.getElementById('badgeCommunity');
      var showViewsCb = document.getElementById('showViewsOnBio');
      var avatarURLIn = document.getElementById('avatarURLInput');
      var bannerURLIn = document.getElementById('bannerURLInput');
      var songURLIn = document.getElementById('songURLInput');
      var payload = {
          displayName: displayName ? displayName.value.trim() : '',
          bio: bioText ? bioText.value.trim() : '',
        songURL: (songURLIn && songURLIn.value.trim()) || (window._editorCurrentData && window._editorCurrentData.songURL) || '',
        avatarURL: (avatarURLIn && avatarURLIn.value.trim()) || (window._editorCurrentData && window._editorCurrentData.avatarURL) || '',
        bannerURL: (bannerURLIn && bannerURLIn.value.trim()) || (window._editorCurrentData && window._editorCurrentData.bannerURL) || '',
          accentColor: accentColor ? accentColor.value : '#7c6bb8',
        layout: 'classic',
        profileAlignment: 'center',
        displayStyle: (document.getElementById('displayStyleSelect') && document.getElementById('displayStyleSelect').value) || 'default',
        modalOpacity: (function() { var el = document.getElementById('modalOpacity'); return el ? parseInt(el.value, 10) : 96; })(),
        modalBlur: (function() { var el = document.getElementById('modalBlur'); return el ? parseInt(el.value, 10) : 0; })(),
        modalBorderOpacity: (function() { var el = document.getElementById('modalBorderOpacity'); return el ? parseInt(el.value, 10) : 20; })(),
        modalRadius: (function() { var el = document.getElementById('modalRadius'); return el ? parseInt(el.value, 10) : 24; })(),
        cardWidth: (function() { var el = document.getElementById('cardWidth'); var v = el && el.value.trim() !== '' ? parseInt(el.value, 10) : null; return (v != null && v >= 260 && v <= 800) ? v : null; })(),
        cardHeight: (function() { var el = document.getElementById('cardHeight'); var v = el && el.value.trim() !== '' ? parseInt(el.value, 10) : null; return (v != null && v >= 0 && v <= 1200) ? v : null; })(),
        modalUseGradient: (function() { var el = document.getElementById('modalBackgroundMode'); return el ? el.value === 'gradient' : false; })(),
        modalBackgroundColor: (function() { var el = document.getElementById('modalBackgroundColor'); return el && /^#[0-9A-Fa-f]{6}$/.test(el.value) ? el.value : ''; })(),
        modalGradientColor1: (function() { var el = document.getElementById('modalGradientColor1'); return el && /^#[0-9A-Fa-f]{6}$/.test(el.value) ? el.value : ''; })(),
        modalGradientColor2: (function() { var el = document.getElementById('modalGradientColor2'); return el && /^#[0-9A-Fa-f]{6}$/.test(el.value) ? el.value : ''; })(),
          fontFamily: fontSel ? fontSel.value : 'Outfit',
          fontSize: fontSizeIn ? (parseInt(fontSizeIn.value, 10) || 16) : 16,
          letterSpacing: letterSpacingIn ? (parseFloat(letterSpacingIn.value) || 0) : 0,
        typewriterBio: (window._editorCurrentData && window._editorCurrentData.badges && window._editorCurrentData.badges.premium) ? (typewriterCb ? typewriterCb.checked : false) : false,
          backgroundEffect: bgEffect ? bgEffect.value : 'none',
          buttonStyle: btnStyle ? btnStyle.value : 'filled',
          metaTitle: metaTitleIn ? metaTitleIn.value.trim() : '',
          metaDescription: metaDescIn ? metaDescIn.value.trim() : '',
          metaImageURL: metaImageIn ? metaImageIn.value.trim() : '',
        showViewsOnBio: showViewsCb ? showViewsCb.checked : false,
        showVerifiedCheckmark: (function() { var el = document.getElementById('showVerifiedCheckmark'); return el ? el.checked : false; })(),
        badges: window._editorCurrentData.badges || { community: badgeCommunityEl ? badgeCommunityEl.checked : true },
        badgeVisibility: window._editorCurrentData.badgeVisibility || {},
        badgeColors: (window._editorCurrentData && window._editorCurrentData.badgeColors) || {},
          links: getLinksFromList()
        };
      if (window._editorCurrentData && window._editorCurrentData.badges && window._editorCurrentData.badges.premium) {
        var pBtnShape = document.getElementById('premiumButtonShape');
        var pLinkHover = document.getElementById('premiumLinkHoverEffect');
        var pLinkFs = document.getElementById('premiumLinkFontSize');
        var pLinkBr = document.getElementById('premiumLinkBorderRadius');
        var pNameColor = document.getElementById('premiumNameColor');
        var pNameColorHexEl = document.getElementById('premiumNameColorHex');
        var pBioFs = document.getElementById('premiumBioFontSize');
        var pVidBg = document.getElementById('premiumVideoBackground');
        var pBannerBlur = document.getElementById('premiumBannerBlur');
        var pAvatarBorder = document.getElementById('premiumAvatarBorder');
        var pHideBrand = document.getElementById('premiumHideBranding');
        var pCustomCSS = document.getElementById('premiumCustomCSS');
        var pCustomFont = document.getElementById('premiumCustomFontFamily');
        var pLayoutPreset = document.getElementById('premiumLayoutPreset');
        var pAnim = document.getElementById('premiumProfileAnimation');
        var pParallax = document.getElementById('premiumParallax');
        var pUsernameEffect = document.getElementById('premiumUsernameEffect');
        var pGlowUser = document.getElementById('premiumGlowUsername');
        var pGlowSocials = document.getElementById('premiumGlowSocials');
        var pGlowBadges = document.getElementById('premiumGlowBadges');
        var pGlowBio = document.getElementById('premiumGlowBio');
        payload.premiumButtonShape = pBtnShape ? pBtnShape.value.trim() : '';
        payload.premiumLinkHoverEffect = pLinkHover ? pLinkHover.value.trim() : '';
        payload.premiumLinkFontSize = pLinkFs && pLinkFs.value.trim() !== '' ? parseInt(pLinkFs.value, 10) : null;
        payload.premiumLinkBorderRadius = pLinkBr && pLinkBr.value.trim() !== '' ? parseInt(pLinkBr.value, 10) : null;
        payload.premiumUsernameEffect = pUsernameEffect ? pUsernameEffect.value.trim() : '';
        payload.premiumNameColor = (pNameColor && /^#[0-9A-Fa-f]{6}$/.test(pNameColor.value)) ? pNameColor.value : (pNameColorHexEl && /^#[0-9A-Fa-f]{6}$/.test(pNameColorHexEl.value.trim()) ? pNameColorHexEl.value.trim() : '');
        var pBioColor = document.getElementById('premiumBioColor');
        var pBioColorHexEl = document.getElementById('premiumBioColorHex');
        payload.premiumBioColor = (pBioColor && /^#[0-9A-Fa-f]{6}$/.test(pBioColor.value)) ? pBioColor.value : (pBioColorHexEl && /^#[0-9A-Fa-f]{6}$/.test(pBioColorHexEl.value.trim()) ? pBioColorHexEl.value.trim() : '';
        payload.premiumBioFontSize = pBioFs && pBioFs.value.trim() !== '' ? parseInt(pBioFs.value, 10) : null;
        var pBgEffect = document.getElementById('premiumBackgroundEffect');
        payload.premiumBackgroundEffect = (pBgEffect && pBgEffect.value === 'blurred') ? 'blurred' : '';
        payload.premiumVideoBackground = pVidBg ? pVidBg.value.trim() : '';
        payload.premiumBannerBlur = pBannerBlur && pBannerBlur.value.trim() !== '' ? parseInt(pBannerBlur.value, 10) : 0;
        payload.premiumAvatarBorder = pAvatarBorder ? pAvatarBorder.value.trim() : '';
        var pMonochromeBadges = document.getElementById('premiumMonochromeBadges');
        payload.premiumMonochromeBadges = pMonochromeBadges ? !!pMonochromeBadges.checked : false;
        payload.premiumHideBranding = pHideBrand ? pHideBrand.checked : false;
        payload.premiumGlowUsername = pGlowUser ? !!pGlowUser.checked : false;
        payload.premiumGlowSocials = pGlowSocials ? !!pGlowSocials.checked : false;
        payload.premiumGlowBadges = pGlowBadges ? !!pGlowBadges.checked : false;
        payload.premiumGlowBio = pGlowBio ? !!pGlowBio.checked : false;
        var pGlowColorEl = document.getElementById('premiumGlowColor');
        payload.premiumGlowColor = (pGlowColorEl && /^#[0-9A-Fa-f]{6}$/.test(pGlowColorEl.value)) ? pGlowColorEl.value : '';
        var pGlowStrengthEl = document.getElementById('premiumGlowStrength');
        payload.premiumGlowStrength = pGlowStrengthEl ? Math.min(200, Math.max(25, parseInt(pGlowStrengthEl.value, 10) || 100)) : 100;
        payload.premiumCustomCSS = pCustomCSS ? pCustomCSS.value.trim() : '';
        payload.premiumCustomFontFamily = pCustomFont ? pCustomFont.value.trim() : '';
        payload.premiumLayoutPreset = pLayoutPreset ? pLayoutPreset.value.trim() : '';
        payload.premiumProfileAnimation = pAnim ? pAnim.value.trim() : '';
        payload.premiumParallax = pParallax ? !!pParallax.checked : false;
      }
      return payload;
    }

    if (saveBtn) {
      saveBtn.addEventListener('click', function() {
        var data = getEditorDataForSave();
        saveBtn.disabled = true;
        clearMsg(msgEl);
        saveBio(uid, data).then(function() {
          showMsg(msgEl, 'Saved', 'success');
          saveBtn.disabled = false;
        }).catch(function() {
          showMsg(msgEl, 'Failed to save', 'error');
          saveBtn.disabled = false;
        });
      });
    }

    var templateSelect = document.getElementById('templateSelect');
    if (templateSelect) {
      templateSelect.addEventListener('change', function() {
        var v = templateSelect.value;
        if (!v) return;
        var fontSel = document.getElementById('fontFamily');
        var accentColorEl = document.getElementById('accentColor');
        var accentHex = document.getElementById('accentColorHex');
        var btnStyle = document.getElementById('buttonStyle');
        var bgEffect = document.getElementById('backgroundEffect');
        if (v === 'minimal') {
          if (fontSel) fontSel.value = 'Inter';
          if (accentColorEl) accentColorEl.value = '#64748b';
          if (accentHex) accentHex.value = '#64748b';
          if (btnStyle) btnStyle.value = 'outline';
          if (bgEffect) bgEffect.value = 'none';
        } else if (v === 'classic') {
          if (fontSel) fontSel.value = 'Outfit';
          if (accentColorEl) accentColorEl.value = '#7c6bb8';
          if (accentHex) accentHex.value = '#7c6bb8';
          if (btnStyle) btnStyle.value = 'filled';
          if (bgEffect) bgEffect.value = 'gradient';
        } else if (v === 'neon') {
          if (fontSel) fontSel.value = 'Space Mono';
          if (accentColorEl) accentColorEl.value = '#22d3ee';
          if (accentHex) accentHex.value = '#22d3ee';
          if (btnStyle) btnStyle.value = 'outline';
          if (bgEffect) bgEffect.value = 'gradient';
        } else if (v === 'warm') {
          if (fontSel) fontSel.value = 'Playfair Display';
          if (accentColorEl) accentColorEl.value = '#ea580c';
          if (accentHex) accentHex.value = '#ea580c';
          if (btnStyle) btnStyle.value = 'filled';
          if (bgEffect) bgEffect.value = 'gradient';
        }
        updatePreview();
      });
    }

    var displayStyleSel = document.getElementById('displayStyleSelect');
    if (displayStyleSel) {
      displayStyleSel.addEventListener('change', function() {
        var wrap = document.getElementById('modalOptionsWrap');
        if (wrap) wrap.style.display = this.value === 'card' ? 'block' : 'none';
        updatePreview();
      });
    }
    var modalBgModeEl = document.getElementById('modalBackgroundMode');
    if (modalBgModeEl) {
      modalBgModeEl.addEventListener('change', function() {
        var solidWrap = document.getElementById('modalSolidColorWrap');
        var gradWrap = document.getElementById('modalGradientWrap');
        if (solidWrap) solidWrap.style.display = this.value === 'solid' ? '' : 'none';
        if (gradWrap) gradWrap.style.display = this.value === 'gradient' ? '' : 'none';
        updatePreview();
      });
    }
    var premiumGlowColorEl = document.getElementById('premiumGlowColor');
    var premiumGlowColorHexEl = document.getElementById('premiumGlowColorHex');
    if (premiumGlowColorEl && premiumGlowColorHexEl) {
      premiumGlowColorEl.addEventListener('input', function() { premiumGlowColorHexEl.value = premiumGlowColorEl.value; });
      premiumGlowColorHexEl.addEventListener('input', function() {
        var v = premiumGlowColorHexEl.value.trim();
        if (/^#[0-9A-Fa-f]{6}$/.test(v)) premiumGlowColorEl.value = v;
      });
    }
    function syncModalColorPicker(colorId, hexId) {
      var colorEl = document.getElementById(colorId);
      var hexEl = document.getElementById(hexId);
      if (!colorEl || !hexEl) return;
      colorEl.addEventListener('input', function() { hexEl.value = colorEl.value; });
      hexEl.addEventListener('input', function() { if (/^#[0-9A-Fa-f]{6}$/.test(hexEl.value.trim())) colorEl.value = hexEl.value.trim(); });
    }
    syncModalColorPicker('modalBackgroundColor', 'modalBackgroundColorHex');
    syncModalColorPicker('modalGradientColor1', 'modalGradientColor1Hex');
    syncModalColorPicker('modalGradientColor2', 'modalGradientColor2Hex');
    syncModalColorPicker('premiumNameColor', 'premiumNameColorHex');
    syncModalColorPicker('premiumBioColor', 'premiumBioColorHex');
    var pBgEffectSelect = document.getElementById('premiumBackgroundEffect');
    if (pBgEffectSelect) pBgEffectSelect.addEventListener('change', updatePreview);
    var btnStyleEl = document.getElementById('buttonStyle');
    if (btnStyleEl) btnStyleEl.addEventListener('change', updatePreview);
    var showViewsCbEl = document.getElementById('showViewsOnBio');
    if (showViewsCbEl) showViewsCbEl.addEventListener('change', updatePreview);
    function bindModalRange(id, valueId, suffix) {
      var el = document.getElementById(id);
      var valEl = document.getElementById(valueId);
      if (!el || !valEl) return;
      el.addEventListener('input', function() { valEl.textContent = el.value + (suffix || ''); });
      el.addEventListener('change', function() { valEl.textContent = el.value + (suffix || ''); });
    }
    bindModalRange('modalOpacity', 'modalOpacityValue', '%');
    bindModalRange('modalBlur', 'modalBlurValue', '');
    bindModalRange('modalBorderOpacity', 'modalBorderOpacityValue', '%');
    bindModalRange('premiumGlowStrength', 'premiumGlowStrengthValue', '%');

    var metaDescIn = document.getElementById('metaDescription');
    if (metaDescIn) {
      metaDescIn.addEventListener('input', function() {
        var metaDescCount = document.getElementById('metaDescCount');
        if (metaDescCount) metaDescCount.textContent = metaDescIn.value.length;
      });
    }

    if (copyBioUrlBtn && bioUrlInput) {
      copyBioUrlBtn.addEventListener('click', function() {
        var toCopy = bioUrlInput.value;
        if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(toCopy).then(function() {
            copyBioUrlBtn.textContent = 'Copied!';
            setTimeout(function() { copyBioUrlBtn.textContent = 'Copy'; }, 1500);
          }).catch(function() { fallbackCopy(); });
        } else {
          fallbackCopy();
        }
        function fallbackCopy() {
          bioUrlInput.select();
          document.execCommand('copy');
          copyBioUrlBtn.textContent = 'Copied!';
          setTimeout(function() { copyBioUrlBtn.textContent = 'Copy'; }, 1500);
        }
      });
    }

    window.dashboardEditor = window.dashboardEditor || {};
    window.dashboardEditor.updateLinkCount = updateLinkCount;
    window.dashboardEditor.updatePreview = updatePreview;
  }

  window.dashboardEditor = window.dashboardEditor || {};
  window.dashboardEditor.init = init;

  /* Preview phone: 3D parallax (same as index) — run on DOM ready so it works regardless of init */
  function setupPreviewParallax() {
    var previewWrap = document.getElementById('dashboardPreviewWrap');
    var previewPhone = document.getElementById('dashboardPreviewPhone');
    if (!previewWrap || !previewPhone) return;
    var maxDeg = 6;
    function setPreviewTilt(rotY, rotX) {
      previewPhone.style.setProperty('--preview-tilt-y', rotY + 'deg');
      previewPhone.style.setProperty('--preview-tilt-x', rotX + 'deg');
    }
    function onPreviewMove(ev) {
      var r = previewPhone.getBoundingClientRect();
      var cx = ev.clientX - r.left;
      var cy = ev.clientY - r.top;
      var x = (cx / Math.max(1, r.width)) * 2 - 1;
      var y = (cy / Math.max(1, r.height)) * 2 - 1;
      setPreviewTilt((x * maxDeg).toFixed(2), ((-y) * maxDeg).toFixed(2));
    }
    function onPreviewEnter() {
      previewWrap.addEventListener('mousemove', onPreviewMove, { passive: true });
    }
    function onPreviewLeave() {
      previewWrap.removeEventListener('mousemove', onPreviewMove);
      setPreviewTilt(0, 0);
    }
    previewWrap.addEventListener('mouseenter', onPreviewEnter);
    previewWrap.addEventListener('mouseleave', onPreviewLeave);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupPreviewParallax);
  } else {
    setupPreviewParallax();
  }
})();
