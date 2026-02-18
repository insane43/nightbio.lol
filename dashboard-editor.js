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
        links.push({
          label: (labelIn && labelIn.value ? labelIn.value.trim() : '') || url,
          url: url,
          icon: icon
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
      layout: (document.getElementById('layoutSelect') && document.getElementById('layoutSelect').value) || 'classic',
      displayStyle: (document.getElementById('displayStyleSelect') && document.getElementById('displayStyleSelect').value) || 'default',
      fontFamily: (document.getElementById('fontFamily') && document.getElementById('fontFamily').value) || 'Outfit',
      fontSize: parseInt(document.getElementById('fontSize') && document.getElementById('fontSize').value, 10) || 16,
      letterSpacing: parseFloat(document.getElementById('letterSpacing') && document.getElementById('letterSpacing').value) || 0,
      typewriterBio: !!(document.getElementById('typewriterBio') && document.getElementById('typewriterBio').checked),
      backgroundEffect: (document.getElementById('backgroundEffect') && document.getElementById('backgroundEffect').value) || 'none',
      buttonStyle: (document.getElementById('buttonStyle') && document.getElementById('buttonStyle').value) || 'filled',
      metaTitle: (document.getElementById('metaTitle') && document.getElementById('metaTitle').value.trim()) || '',
      metaDescription: (document.getElementById('metaDescription') && document.getElementById('metaDescription').value.trim()) || '',
      metaImageURL: (document.getElementById('metaImageURL') && document.getElementById('metaImageURL').value.trim()) || '',
      links: getLinksFromList()
    };
  }

  function updatePreview(data) {
    data = data || getEditorData();
    var banner = document.getElementById('previewBanner');
    var avatarWrap = document.getElementById('previewAvatarWrap');
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

    if (data.accentColor && document.body) {
      document.getElementById('previewScreen').style.setProperty('--preview-accent', data.accentColor);
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
        var viewHref = 'bio?u=' + encodeURIComponent(username);
        if (bioUrlInput) bioUrlInput.value = fullUrl;
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

    function renderBadgesList(badges) {
      var grid = document.getElementById('badgesList');
      if (!grid || typeof window.BIO_BADGES === 'undefined') return;
      var icons = window.BADGE_ICONS || {};
      grid.innerHTML = '';
      var b = badges || {};
      Object.keys(window.BIO_BADGES).forEach(function(key) {
        var info = window.BIO_BADGES[key];
        var hasBadge = !!b[key];
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
            '<input type="checkbox" class="badge-toggle" id="badge' + key.charAt(0).toUpperCase() + key.slice(1) + '" ' + (hasBadge ? 'checked' : '') + '> ' +
            '<span class="badge-action-label">' + (hasBadge ? 'On profile' : 'Show on profile') + '</span></label>';
        } else {
          action = '<span class="badge-card-action badge-card-action-status">Granted by admin</span>';
        }
        card.innerHTML = iconHtml + '<div class="badge-card-body">' + title + desc + '</div><div class="badge-card-action-wrap">' + action + '</div>';
        grid.appendChild(card);
        var toggle = card.querySelector('.badge-toggle');
        if (toggle) {
          toggle.addEventListener('change', function() {
            window._editorCurrentData.badges = window._editorCurrentData.badges || {};
            window._editorCurrentData.badges[key] = this.checked;
            var lbl = card.querySelector('.badge-action-label');
            if (lbl) lbl.textContent = this.checked ? 'On profile' : 'Show on profile';
            card.classList.toggle('badge-card-owned', this.checked);
          });
        }
      });
      var filterSel = document.getElementById('badgesFilter');
      if (filterSel) {
        filterSel.onchange = function() {
          var v = filterSel.value;
          grid.querySelectorAll('.badge-card').forEach(function(card) {
            var key = card.dataset.badgeKey;
            var owned = !!(window._editorCurrentData.badges && window._editorCurrentData.badges[key]);
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
      if (displayName) displayName.value = d.displayName || '';
      if (bioText) {
        bioText.value = d.bio || '';
        if (bioCharCount) bioCharCount.textContent = (d.bio || '').length;
      }
      if (accentColor) accentColor.value = d.accentColor || '#7c6bb8';
      if (accentColorHex) accentColorHex.value = d.accentColor || '#7c6bb8';

      var layoutSel = document.getElementById('layoutSelect');
      if (layoutSel) layoutSel.value = d.layout || 'classic';
      var profileAlignSel = document.getElementById('profileAlignmentSelect');
      if (profileAlignSel) profileAlignSel.value = (/^(left|right|center)$/i.test(d.profileAlignment) ? d.profileAlignment.toLowerCase() : 'center');
      var displayStyleSel = document.getElementById('displayStyleSelect');
      if (displayStyleSel) displayStyleSel.value = (d.displayStyle === 'card') ? 'card' : 'default';
      var modalWrap = document.getElementById('modalOptionsWrap');
      if (modalWrap) modalWrap.style.display = (d.displayStyle === 'card') ? 'block' : 'none';
      var modalOpacityIn = document.getElementById('modalOpacity');
      var modalBlurIn = document.getElementById('modalBlur');
      var modalBorderOpacityIn = document.getElementById('modalBorderOpacity');
      var modalRadiusIn = document.getElementById('modalRadius');
      if (modalOpacityIn) { modalOpacityIn.value = d.modalOpacity != null ? d.modalOpacity : 96; }
      if (modalBlurIn) { modalBlurIn.value = d.modalBlur != null ? d.modalBlur : 0; }
      if (modalBorderOpacityIn) { modalBorderOpacityIn.value = d.modalBorderOpacity != null ? d.modalBorderOpacity : 20; }
      if (modalRadiusIn) { modalRadiusIn.value = d.modalRadius != null ? d.modalRadius : 24; }
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
      renderBadgesList(window._editorCurrentData.badges);

      var showViewsCb = document.getElementById('showViewsOnBio');
      if (showViewsCb) showViewsCb.checked = !!d.showViewsOnBio;
      var clickToEnterCb = document.getElementById('clickToEnter');
      if (clickToEnterCb) clickToEnterCb.checked = !!d.clickToEnter;
      refreshProfileViews();

      if (avatarURLInput) avatarURLInput.value = d.avatarURL || '';
      if (bannerURLInput) bannerURLInput.value = d.bannerURL || '';
      if (songURLInput) songURLInput.value = d.songURL || '';
      if (avatarPreview && d.avatarURL) {
        avatarPreview.src = d.avatarURL;
        avatarPreview.style.display = 'block';
        if (avatarPlaceholder) avatarPlaceholder.style.display = 'none';
      } else if (avatarPlaceholder) avatarPlaceholder.style.display = '';
      if (bannerPreview && d.bannerURL) {
        bannerPreview.src = d.bannerURL;
        bannerPreview.style.display = 'block';
        if (bannerPlaceholder) bannerPlaceholder.style.display = 'none';
      } else if (bannerPlaceholder) bannerPlaceholder.style.display = '';

      var tabPremium = document.getElementById('tabPremium');
      if (tabPremium) tabPremium.style.display = (d.badges && d.badges.premium) ? '' : 'none';
      var tabAdminPanel = document.getElementById('tabAdminPanel');
      if (tabAdminPanel) tabAdminPanel.style.display = (d.badges && d.badges.staff) ? '' : 'none';
      if (d.badges && d.badges.premium) {
        var set = function(id, val) { var el = document.getElementById(id); if (el) el.value = val != null && val !== '' ? val : ''; };
        set('premiumButtonShape', d.premiumButtonShape);
        set('premiumLinkHoverEffect', d.premiumLinkHoverEffect);
        set('premiumLinkFontSize', d.premiumLinkFontSize != null ? d.premiumLinkFontSize : '');
        set('premiumLinkBorderRadius', d.premiumLinkBorderRadius != null ? d.premiumLinkBorderRadius : '');
        set('premiumNameGradient', d.premiumNameGradient);
        set('premiumBioFontSize', d.premiumBioFontSize != null ? d.premiumBioFontSize : '');
        set('premiumCustomFontFamily', d.premiumCustomFontFamily);
        set('premiumLayoutPreset', d.premiumLayoutPreset);
        set('premiumProfileAnimation', d.premiumProfileAnimation);
        var pPar = document.getElementById('premiumParallax');
        if (pPar) pPar.checked = !!d.premiumParallax;
        set('premiumVideoBackground', d.premiumVideoBackground);
        set('premiumBannerBlur', d.premiumBannerBlur != null ? d.premiumBannerBlur : '');
        set('premiumAvatarBorder', d.premiumAvatarBorder);
        document.getElementById('premiumHideBranding').checked = !!d.premiumHideBranding;
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
    var dashboardAdminWired = false;
    var DASHBOARD_BADGE_KEYS = ['community', 'og', 'owner', 'staff', 'verified', 'premium'];

    function escapeHtmlDashboard(s) {
      if (s == null) return '';
      var div = document.createElement('div');
      div.textContent = s;
      return div.innerHTML;
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

    function renderDashboardAdminTable(users, banned) {
      var list = getDashboardAdminFilteredList(users || [], banned || {});
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
        var profileUrl = base ? base + 'bio?u=' + encodeURIComponent(u.username) : '#';
        var uidTitle = 'UID ' + (u.userId != null ? u.userId : (u.uid || ''));
        var tr = document.createElement('tr');
        tr.title = uidTitle;
        tr.innerHTML =
          '<td><span class="user-name" title="' + escapeHtmlDashboard(uidTitle) + '">' + escapeHtmlDashboard(u.displayName || u.username || '—') + '</span></td>' +
          '<td><a href="' + profileUrl + '" target="_blank" rel="noopener" style="color: var(--purple-accent);" title="' + escapeHtmlDashboard(uidTitle) + '">' + escapeHtmlDashboard(u.username || '—') + '</a></td>' +
          '<td>' + escapeHtmlDashboard((u.email || '').slice(0, 40)) + (u.email && u.email.length > 40 ? '…' : '') + '</td>' +
          '<td>' + ((u.stats && u.stats.views) || 0).toLocaleString() + '</td>' +
          '<td>' + badgeHtml + '</td>' +
          '<td>' + (isBanned ? '<span class="badge-pill badge-banned">Banned</span>' : '<span class="badge-pill">Active</span>') + '</td>' +
          '<td class="actions">' +
            '<button type="button" class="btn-icon edit-user-btn" data-uid="' + escapeHtmlDashboard(u.uid) + '" title="Edit">✎</button>' +
            '<a href="' + profileUrl + '" target="_blank" rel="noopener" class="btn-icon" title="View profile">↗</a>' +
            (isBanned
              ? '<button type="button" class="btn-icon unban-btn" data-uid="' + escapeHtmlDashboard(u.uid) + '" title="Unban">↩</button>'
              : '<button type="button" class="btn-icon danger ban-btn" data-uid="' + escapeHtmlDashboard(u.uid) + '" title="Ban">⊗</button>') +
          '</td>';
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
      tbody.querySelectorAll('.unban-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
          if (typeof unbanUser !== 'function') return;
          unbanUser(btn.dataset.uid).then(function() {
            showDashboardAdminToast('User unbanned.');
            loadDashboardAdmin();
          }).catch(function() { showDashboardAdminToast('Failed to unban.', 'error'); });
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
        var listEl = document.getElementById('dashboardAdminEditBadgesList');
        if (listEl) {
          listEl.innerHTML = '';
          var badges = data.badges || {};
          DASHBOARD_BADGE_KEYS.forEach(function(k) {
            var label = document.createElement('label');
            label.className = 'admin-edit-badge-label';
            label.innerHTML = '<input type="checkbox" class="edit-badge-cb" data-badge="' + k + '" ' + (badges[k] ? 'checked' : '') + '> ' + k;
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
      }
      adminUpdateUserProfile(uid, data).then(function() {
        var modal = document.getElementById('dashboardAdminEditModal');
        if (modal) modal.classList.remove('on');
        showDashboardAdminToast('User updated.');
        loadDashboardAdmin();
      }).catch(function() { showDashboardAdminToast('Failed to save.', 'error'); });
    }

    function loadDashboardAdmin() {
      if (typeof getAllUsers !== 'function' || typeof getBannedUids !== 'function') return;
      getAllUsers().then(function(users) {
        dashboardAdminAllUsers = users || [];
        return getBannedUids().catch(function() { return {}; });
      }).then(function(banned) {
        dashboardAdminBanned = banned || {};
        renderDashboardAdminTable(dashboardAdminAllUsers, dashboardAdminBanned);
      }).catch(function(err) {
        console.error(err);
        renderDashboardAdminTable([], {});
        showDashboardAdminToast('Failed to load users.', 'error');
      });
    }
    window.loadDashboardAdmin = loadDashboardAdmin;

    if (!dashboardAdminWired) {
      dashboardAdminWired = true;
      var searchEl = document.getElementById('dashboardAdminUserSearch');
      var filterEl = document.getElementById('dashboardAdminUserFilter');
      var refreshBtn = document.getElementById('dashboardAdminRefresh');
      if (searchEl) searchEl.addEventListener('input', function() { renderDashboardAdminTable(dashboardAdminAllUsers, dashboardAdminBanned); });
      if (filterEl) filterEl.addEventListener('change', function() { renderDashboardAdminTable(dashboardAdminAllUsers, dashboardAdminBanned); });
      if (refreshBtn) refreshBtn.addEventListener('click', function() { loadDashboardAdmin(); });
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
        if (avatarPreview) {
          if (window._editorCurrentData.avatarURL) {
            avatarPreview.src = window._editorCurrentData.avatarURL;
            avatarPreview.style.display = 'block';
            if (avatarPlaceholder) avatarPlaceholder.style.display = 'none';
          } else {
            avatarPreview.style.display = 'none';
            avatarPreview.removeAttribute('src');
            if (avatarPlaceholder) avatarPlaceholder.style.display = '';
          }
        }
      }
      if (bannerURLInput) {
        window._editorCurrentData.bannerURL = bannerURLInput.value.trim();
        if (bannerPreview) {
          if (window._editorCurrentData.bannerURL) {
            bannerPreview.src = window._editorCurrentData.bannerURL;
            bannerPreview.style.display = 'block';
            if (bannerPlaceholder) bannerPlaceholder.style.display = 'none';
          } else {
            bannerPreview.style.display = 'none';
            bannerPreview.removeAttribute('src');
            if (bannerPlaceholder) bannerPlaceholder.style.display = '';
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
      var layoutSel = document.getElementById('layoutSelect');
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
        layout: layoutSel ? layoutSel.value : 'classic',
        profileAlignment: (document.getElementById('profileAlignmentSelect') && document.getElementById('profileAlignmentSelect').value) || 'center',
        displayStyle: (document.getElementById('displayStyleSelect') && document.getElementById('displayStyleSelect').value) || 'default',
        modalOpacity: (function() { var el = document.getElementById('modalOpacity'); return el ? parseInt(el.value, 10) : 96; })(),
        modalBlur: (function() { var el = document.getElementById('modalBlur'); return el ? parseInt(el.value, 10) : 0; })(),
        modalBorderOpacity: (function() { var el = document.getElementById('modalBorderOpacity'); return el ? parseInt(el.value, 10) : 20; })(),
        modalRadius: (function() { var el = document.getElementById('modalRadius'); return el ? parseInt(el.value, 10) : 24; })(),
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
        clickToEnter: (function() { var el = document.getElementById('clickToEnter'); return el ? el.checked : false; })(),
        badges: window._editorCurrentData.badges || { community: badgeCommunityEl ? badgeCommunityEl.checked : true },
        links: getLinksFromList()
      };
      if (window._editorCurrentData && window._editorCurrentData.badges && window._editorCurrentData.badges.premium) {
        var pBtnShape = document.getElementById('premiumButtonShape');
        var pLinkHover = document.getElementById('premiumLinkHoverEffect');
        var pLinkFs = document.getElementById('premiumLinkFontSize');
        var pLinkBr = document.getElementById('premiumLinkBorderRadius');
        var pNameGrad = document.getElementById('premiumNameGradient');
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
        payload.premiumButtonShape = pBtnShape ? pBtnShape.value.trim() : '';
        payload.premiumLinkHoverEffect = pLinkHover ? pLinkHover.value.trim() : '';
        payload.premiumLinkFontSize = pLinkFs && pLinkFs.value.trim() !== '' ? parseInt(pLinkFs.value, 10) : null;
        payload.premiumLinkBorderRadius = pLinkBr && pLinkBr.value.trim() !== '' ? parseInt(pLinkBr.value, 10) : null;
        payload.premiumNameGradient = pNameGrad ? pNameGrad.value.trim() : '';
        payload.premiumBioFontSize = pBioFs && pBioFs.value.trim() !== '' ? parseInt(pBioFs.value, 10) : null;
        payload.premiumVideoBackground = pVidBg ? pVidBg.value.trim() : '';
        payload.premiumBannerBlur = pBannerBlur && pBannerBlur.value.trim() !== '' ? parseInt(pBannerBlur.value, 10) : 0;
        payload.premiumAvatarBorder = pAvatarBorder ? pAvatarBorder.value.trim() : '';
        payload.premiumHideBranding = pHideBrand ? pHideBrand.checked : false;
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
        var layoutSel = document.getElementById('layoutSelect');
        var fontSel = document.getElementById('fontFamily');
        var accentColorEl = document.getElementById('accentColor');
        var accentHex = document.getElementById('accentColorHex');
        var btnStyle = document.getElementById('buttonStyle');
        var bgEffect = document.getElementById('backgroundEffect');
        if (v === 'minimal') {
          if (layoutSel) layoutSel.value = 'minimal';
          if (fontSel) fontSel.value = 'Inter';
          if (accentColorEl) accentColorEl.value = '#64748b';
          if (accentHex) accentHex.value = '#64748b';
          if (btnStyle) btnStyle.value = 'outline';
          if (bgEffect) bgEffect.value = 'none';
        } else if (v === 'classic') {
          if (layoutSel) layoutSel.value = 'classic';
          if (fontSel) fontSel.value = 'Outfit';
          if (accentColorEl) accentColorEl.value = '#7c6bb8';
          if (accentHex) accentHex.value = '#7c6bb8';
          if (btnStyle) btnStyle.value = 'filled';
          if (bgEffect) bgEffect.value = 'gradient';
        } else if (v === 'neon') {
          if (layoutSel) layoutSel.value = 'classic';
          if (fontSel) fontSel.value = 'Space Mono';
          if (accentColorEl) accentColorEl.value = '#22d3ee';
          if (accentHex) accentHex.value = '#22d3ee';
          if (btnStyle) btnStyle.value = 'outline';
          if (bgEffect) bgEffect.value = 'gradient';
        } else if (v === 'warm') {
          if (layoutSel) layoutSel.value = 'wide';
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

    var metaDescIn = document.getElementById('metaDescription');
    if (metaDescIn) {
      metaDescIn.addEventListener('input', function() {
        var metaDescCount = document.getElementById('metaDescCount');
        if (metaDescCount) metaDescCount.textContent = metaDescIn.value.length;
      });
    }

    if (copyBioUrlBtn && bioUrlInput) {
      copyBioUrlBtn.addEventListener('click', function() {
        bioUrlInput.select();
        document.execCommand('copy');
        copyBioUrlBtn.textContent = 'Copied!';
        setTimeout(function() { copyBioUrlBtn.textContent = 'Copy'; }, 1500);
      });
    }

    window.dashboardEditor = window.dashboardEditor || {};
    window.dashboardEditor.updateLinkCount = updateLinkCount;
    window.dashboardEditor.updatePreview = updatePreview;
  }

  window.dashboardEditor = window.dashboardEditor || {};
  window.dashboardEditor.init = init;
})();
