/* ── হোস্টেল ম্যানেজমেন্ট সিস্টেম — Service Worker (রিফ্যাক্টর ধাপ ৬) ──
   কৌশল: অ্যাপ-শেল (index.html) ও CDN স্ক্রিপ্ট ক্যাশ করা হয়,
   ফলে ইন্টারনেট না থাকলেও অ্যাপ খুলবে; Firebase নিজস্ব রিয়েল-টাইম
   সংযোগ ব্যবস্থাপনা করে, তাই ডেটা-রিকোয়েস্ট ক্যাশ করা হয় না।
   নতুন ভার্সন ডিপ্লয়ের সময় CACHE_NAME-এর নম্বর বাড়ান। */

const CACHE_NAME = 'hms-shell-v1';
const SHELL = [
  './',
  './index.html',
  'https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.13.0/firebase-database-compat.js',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(c => c.addAll(SHELL).catch(()=>{}))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Firebase রিয়েল-টাইম/ডেটা রিকোয়েস্ট — কখনো ক্যাশ নয়
  if (url.hostname.includes('firebasedatabase.app') || url.hostname.includes('firebaseio.com')) return;

  // অ্যাপ-শেল ও CDN: network-first, ব্যর্থ হলে ক্যাশ (অফলাইন fallback)
  if (e.request.mode === 'navigate' || SHELL.some(s => e.request.url.includes(s.replace('./','')))) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, copy)).catch(()=>{});
          return res;
        })
        .catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
    );
  }
});

// অ্যাপের আপডেট-ব্যানার "এখনই আপডেট করুন" চাপলে এই মেসেজ আসে
self.addEventListener('message', e => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});
