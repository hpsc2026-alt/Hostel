// ══ HMS হেরিটেজ — সার্ভিস ওয়ার্কার ══
// প্রতিবার অ্যাপে বড় পরিবর্তন আনলে CACHE_NAME-এর ভার্সন নম্বর বাড়িয়ে দিন
// (যেমন v1 → v2), তাহলে পুরনো ক্যাশে বাতিল হয়ে নতুন ফাইল সবার কাছে পৌঁছাবে।
const CACHE_NAME = "hms-heritage-cache-v1";

const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
];

// ইনস্টলেশন — মূল ফাইলগুলো ক্যাশে রাখা
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

// অ্যাক্টিভেশন — পুরনো ক্যাশে মুছে ফেলা
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ফেচ — নেটওয়ার্ক আগে চেষ্টা করবে, না পেলে ক্যাশ থেকে দেখাবে (অফলাইন সাপোর্ট)
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)).catch(() => {});
        return response;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || caches.match("./index.html")))
  );
});

// নতুন ভার্সন সাথে সাথে চালু করার নির্দেশ (অ্যাপ থেকে পাঠানো হয়)
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
