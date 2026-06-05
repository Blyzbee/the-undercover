const CACHE_NAME = "undercover-v1";
const urlsToCache = [
	"/",
	"/index.html",
	"/script.js",
	"/styles.css",
	"/words.json",
];

// Mise à jour du cache à chaque installation
self.addEventListener("install", (event) => {
	event.waitUntil(
		caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache)),
	);
});

// Gérer les requêtes en ligne
self.addEventListener("fetch", (event) => {
	const requestUrl = new URL(event.request.url);

	// Si c'est un fichier de données (comme words.json), on le met à jour
	if (requestUrl.pathname.endsWith("words.json")) {
		event.respondWith(
			fetch(event.request)
				.then((response) => {
					// Mettre à jour le cache
					caches
						.open(CACHE_NAME)
						.then((cache) => cache.put(event.request, response.clone()));
					return response;
				})
				.catch(() => {
					// Si échec réseau, retourner la version en cache
					return caches.match(event.request);
				}),
		);
	} else {
		// Pour les autres fichiers : priorité cache, puis réseau
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
