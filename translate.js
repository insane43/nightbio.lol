/* Language dropdown + Google Translate — custom dropdown drives full-page translation */

function googleTranslateElementInit() {
  new google.translate.TranslateElement(
    { pageLanguage: 'en', layout: google.translate.TranslateElement.InlineLayout.SIMPLE, autoDisplay: false },
    'google_translate_element'
  );
  setTimeout(syncLangDropdown, 800);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() { setTimeout(syncLangDropdown, 1500); });
} else {
  setTimeout(syncLangDropdown, 1500);
}

var langDropdownSynced = false;

function syncLangDropdown() {
  var customSelect = document.getElementById('customLangSelect');
  if (!customSelect || langDropdownSynced) return;
  langDropdownSynced = true;

  // Restore dropdown from cookie so it shows current language after reload
  var cookie = document.cookie.replace(/\s/g, '').split(';').filter(function(c) { return c.indexOf('googtrans=') === 0; })[0];
  if (cookie) {
    var match = cookie.match(/googtrans=\/[^/]+\/([^;]+)/);
    if (match) customSelect.value = match[1];
  }

  customSelect.addEventListener('change', function() {
    var lang = customSelect.value;
    if (!lang) {
      document.cookie = 'googtrans=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      location.reload();
      return;
    }
    if (lang === 'en') {
      document.cookie = 'googtrans=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      location.reload();
      return;
    }
    var googleSelect = document.querySelector('.goog-te-combo');
    if (googleSelect) {
      googleSelect.value = lang;
      googleSelect.dispatchEvent(new Event('change'));
    } else {
      document.cookie = 'googtrans=/en/' + lang + '; path=/';
      location.reload();
    }
  });
}
