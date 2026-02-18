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
    return {
      displayName: displayName ? displayName.value.trim() : '',
      bio: bioText ? bioText.value.trim() : '',
      avatarURL: window._editorCurrentData && window._editorCurrentData.avatarURL || '',
      bannerURL: window._editorCurrentData && window._editorCurrentData.bannerURL || '',
      accentColor: accentColor ? accentColor.value : '#7c6bb8',
      layout: (document.getElementById('layoutSelect') && document.getElementById('layoutSelect').value) || 'classic',
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
    var avatarFile = document.getElementById('avatarFile');
    var bannerFile = document.getElementById('bannerFile');
    var avatarUploadBtn = document.getElementById('avatarUploadBtn');
    var bannerUploadBtn = document.getElementById('bannerUploadBtn');
    var avatarPreview = document.getElementById('avatarPreview');
    var bannerPreview = document.getElementById('bannerPreview');
    var avatarPlaceholder = document.getElementById('avatarPlaceholder');
    var bannerPlaceholder = document.getElementById('bannerPlaceholder');
    var displayName = document.getElementById('displayName');
    var bioText = document.getElementById('bioText');
    var bioCharCount = document.getElementById('bioCharCount');
    var songURL = document.getElementById('songURL');
    var accentColor = document.getElementById('accentColor');
    var accentColorHex = document.getElementById('accentColorHex');
    var linkList = document.getElementById('linkList');

    function setBioUrl(username) {
      if (username) {
        var url = BASE_URL + '/' + encodeURIComponent(username);
        if (bioUrlInput) bioUrlInput.value = url;
        if (bioUrlStrip) bioUrlStrip.style.display = 'flex';
        if (viewBioBtn) viewBioBtn.href = url;
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
        if (info.userCanToggle) {
          action = '<label class="badge-card-action badge-card-action-toggle">' +
            '<input type="checkbox" class="badge-toggle" id="badge' + key.charAt(0).toUpperCase() + key.slice(1) + '" ' + (hasBadge ? 'checked' : '') + '> ' +
            '<span class="badge-action-label">' + (hasBadge ? 'On profile' : 'Show on profile') + '</span></label>';
        } else {
          action = '<span class="badge-card-action badge-card-action-status ' + (hasBadge ? 'badge-status-on' : '') + '">' + (hasBadge ? 'On profile' : 'Granted by admin') + '</span>';
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
      if (songURL) songURL.value = d.songURL || '';
      if (accentColor) accentColor.value = d.accentColor || '#7c6bb8';
      if (accentColorHex) accentColorHex.value = d.accentColor || '#7c6bb8';

      var layoutSel = document.getElementById('layoutSelect');
      if (layoutSel) layoutSel.value = d.layout || 'classic';
      var fontSel = document.getElementById('fontFamily');
      if (fontSel) fontSel.value = d.fontFamily || 'Outfit';
      var fontSizeIn = document.getElementById('fontSize');
      if (fontSizeIn) fontSizeIn.value = d.fontSize != null ? d.fontSize : 16;
      var letterSpacingIn = document.getElementById('letterSpacing');
      if (letterSpacingIn) letterSpacingIn.value = d.letterSpacing != null ? d.letterSpacing : 0;
      var typewriterCb = document.getElementById('typewriterBio');
      if (typewriterCb) typewriterCb.checked = !!d.typewriterBio;
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

      if (avatarPreview && d.avatarURL) {
        avatarPreview.src = d.avatarURL;
        avatarPreview.style.display = 'block';
        if (avatarPlaceholder) avatarPlaceholder.style.display = 'none';
      }
      if (bannerPreview && d.bannerURL) {
        bannerPreview.src = d.bannerURL;
        bannerPreview.style.display = 'block';
        if (bannerPlaceholder) bannerPlaceholder.style.display = 'none';
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

    // File upload triggers
    if (avatarUploadBtn && avatarFile) {
      avatarUploadBtn.addEventListener('click', function() { avatarFile.click(); });
    }
    if (bannerUploadBtn && bannerFile) {
      bannerUploadBtn.addEventListener('click', function() { bannerFile.click(); });
    }

    if (avatarFile) {
      avatarFile.addEventListener('change', function() {
        var file = avatarFile.files && avatarFile.files[0];
        if (!file) return;
        uploadBioImage(uid, file, 'avatar').then(function(url) {
          window._editorCurrentData.avatarURL = url;
          if (avatarPreview) {
            avatarPreview.src = url;
            avatarPreview.style.display = 'block';
          }
          if (avatarPlaceholder) avatarPlaceholder.style.display = 'none';
          clearMsg(msgEl);
          updatePreview();
        }).catch(function() {
          showMsg(msgEl, 'Failed to upload photo.', 'error');
        });
      });
    }
    if (bannerFile) {
      bannerFile.addEventListener('change', function() {
        var file = bannerFile.files && bannerFile.files[0];
        if (!file) return;
        uploadBioImage(uid, file, 'banner').then(function(url) {
          window._editorCurrentData.bannerURL = url;
          if (bannerPreview) {
            bannerPreview.src = url;
            bannerPreview.style.display = 'block';
          }
          if (bannerPlaceholder) bannerPlaceholder.style.display = 'none';
          clearMsg(msgEl);
          updatePreview();
        }).catch(function() {
          showMsg(msgEl, 'Failed to upload cover.', 'error');
        });
      });
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

    if (saveBtn) {
      saveBtn.addEventListener('click', function() {
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
        var data = {
          displayName: displayName ? displayName.value.trim() : '',
          bio: bioText ? bioText.value.trim() : '',
          songURL: songURL ? songURL.value.trim() : '',
          avatarURL: window._editorCurrentData.avatarURL || '',
          bannerURL: window._editorCurrentData.bannerURL || '',
          accentColor: accentColor ? accentColor.value : '#7c6bb8',
          layout: layoutSel ? layoutSel.value : 'classic',
          fontFamily: fontSel ? fontSel.value : 'Outfit',
          fontSize: fontSizeIn ? (parseInt(fontSizeIn.value, 10) || 16) : 16,
          letterSpacing: letterSpacingIn ? (parseFloat(letterSpacingIn.value) || 0) : 0,
          typewriterBio: typewriterCb ? typewriterCb.checked : false,
          backgroundEffect: bgEffect ? bgEffect.value : 'none',
          buttonStyle: btnStyle ? btnStyle.value : 'filled',
          metaTitle: metaTitleIn ? metaTitleIn.value.trim() : '',
          metaDescription: metaDescIn ? metaDescIn.value.trim() : '',
          metaImageURL: metaImageIn ? metaImageIn.value.trim() : '',
          badges: { community: badgeCommunityEl ? badgeCommunityEl.checked : true },
          links: getLinksFromList()
        };
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
