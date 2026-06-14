const CACHE='mofunote-v12-petaddfix3';
const ASSETS=['./','./index.html','./style.css','./app.js','./manifest.json','./icon.png','./animal_chinchilla.png','./animal_degu.png','./animal_guineapig.png','./animal_hamster.png','./animal_rabbit.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))));
self.addEventListener('fetch',e=>e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request))));
