// Link platform icons (guns.lol-style) — nightbio.lol
window.LINK_PLATFORMS = [
  { value: '', label: 'No icon' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'twitter', label: 'X / Twitter' },
  { value: 'discord', label: 'Discord' },
  { value: 'spotify', label: 'Spotify' },
  { value: 'github', label: 'GitHub' },
  { value: 'twitch', label: 'Twitch' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'paypal', label: 'PayPal' },
  { value: 'snapchat', label: 'Snapchat' },
  { value: 'telegram', label: 'Telegram' },
  { value: 'reddit', label: 'Reddit' },
  { value: 'link', label: 'Link' }
];

// Detect platform from URL for "auto" or default
function detectPlatformFromUrl(url) {
  if (!url || !url.trim()) return '';
  var u = url.trim().toLowerCase();
  if (u.indexOf('instagram.com') !== -1) return 'instagram';
  if (u.indexOf('youtube.com') !== -1 || u.indexOf('youtu.be') !== -1) return 'youtube';
  if (u.indexOf('tiktok.com') !== -1) return 'tiktok';
  if (u.indexOf('twitter.com') !== -1 || u.indexOf('x.com') !== -1) return 'twitter';
  if (u.indexOf('discord.gg') !== -1 || u.indexOf('discord.com') !== -1) return 'discord';
  if (u.indexOf('spotify.com') !== -1) return 'spotify';
  if (u.indexOf('github.com') !== -1) return 'github';
  if (u.indexOf('twitch.tv') !== -1) return 'twitch';
  if (u.indexOf('linkedin.com') !== -1) return 'linkedin';
  if (u.indexOf('paypal.com') !== -1) return 'paypal';
  if (u.indexOf('snapchat.com') !== -1) return 'snapchat';
  if (u.indexOf('t.me') !== -1 || u.indexOf('telegram') !== -1) return 'telegram';
  if (u.indexOf('reddit.com') !== -1) return 'reddit';
  return 'link';
}
