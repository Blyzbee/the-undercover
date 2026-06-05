const CACHE_NAME = "undercover-v1";
const urlsToCache = [
	"/",
	"index.html",
	"src/script.js",
	"src/styles.css",
	"data/words.json",
];

// Mise à jour du cache à chaque installation
self.addEventListener("install", (event) => {
	event.waitUntil(
		caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache)),
	);
});

// Gérer les requêtes
self.addEventListener("fetch", (event) => {
	const requestUrl = new URL(event.request.url);

	// Pour les fichiers de données (comme words.json)
	if (requestUrl.pathname.endsWith("words.json")) {
		event.respondWith(
			// Priorité : réseau → cache → erreur
			fetch(event.request)
				.then((response) => {
					// Clone la réponse pour la mettre dans le cache
					const responseClone = response.clone();
					caches.open(CACHE_NAME).then((cache) => {
						cache.put(event.request, responseClone);
					});
					return response;
				})
				.catch(() => {
					// Si échec réseau, retourne la version en cache
					return caches.match(event.request);
				}),
		);
	} else {
		// Pour les autres fichiers : cache-first, puis réseau
		event.respondWith(
			caches.match(event.request).then((response) => {
				return response || fetch(event.request);
			}),
		);
	}
});

// Nettoyer les anciens caches à l'activation
self.addEventListener("activate", (event) => {
	event.waitUntil(
		caches.keys().then((cacheNames) => {
			return Promise.all(
				cacheNames.map((cacheName) => {
					if (cacheName !== CACHE_NAME) {
						return caches.delete(cacheName);
					}
				}),
			);
		}),
	);
});
