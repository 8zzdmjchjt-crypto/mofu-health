const CACHE='mofunote-v17-simplegraph';
const ASSETS=['./','./index.html','./style.css','./app.js','./manifest.json','./icon.png','./animal_chinchilla.png','./animal_degu.png','./animal_guineapig.png','./animal_hamster.png','./animal_rabbit.png'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim();});
self.addEventListener('fetch',e=>e.respondWith(fetch(e.request).catch(()=>caches.match(e.request))));
