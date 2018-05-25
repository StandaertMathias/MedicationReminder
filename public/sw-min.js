const version = 'v12';

self.addEventListener('install', function (event) {
    event.waitUntil(caches.open(version)
        .then(function (cache) {
            return cache.addAll(['offline.html',
                 'assets/css/bootstrap.min.css',
                 'assets/css/screen.css',
                 '../public/manifest.json',
                 'assets/images/logo.jpeg',
                 'assets/images/offline.gif',
                 'assets/js/jquery-3.3.1.min.js',
                 'assets/js/bootstrap.min.js',
                'assets/js/script.js'])                                                                                //add resources
        }));
});

self.addEventListener('activate', function (event) {
    event.waitUntil(
        caches.keys()
            .then(function (keys) {
                return Promise.all(keys.filter(function (key) {
                    return key !== version;
                }).map(function (key) {
                    return caches.delete(key);
                }));
            }));
});

self.addEventListener('fetch', function (event) {
    if (event.request.method === "POST") {
        event.respondWith(fetch(event.request))
    } else {
        if (!navigator.onLine) {
            event.respondWith(
                caches.match(event.request)
                    .then(function (res) {
                        if (res) {
                            return res;
                        } else {
                            return caches.match(new Request('offline.html'))
                        }
                    })
            )
        } else {
            event.respondWith(
                caches.match(event.request)
                    .then(function (res) {
                        return fetchAndUpdate(event.request);
                    })
            )
        }

    }
});
self.addEventListener('push', function(event) {

    const title = 'Re:Medic';
    const options = {
        body: 'It is time to take your medication',
        icon: 'assets/images/logo.jpeg',
        badge: 'assets/images/logo.jpeg'
    };

    event.waitUntil(self.registration.showNotification(title, options));
});
self.addEventListener('notificationclick', function(event) {

    event.notification.close();

    event.waitUntil(
        clients.openWindow('https://www.remedic.be')
    );
});
function fetchAndUpdate(request) {
    return fetch(request)
        .then(function (res) {
            if (res) {
                return caches.open(version)
                    .then(function (cache) {
                        return cache.put(request, res.clone())
                            .then(function () {
                                return res;
                            })
                    })
            }
        })
}
//
// function showNotification() {
//     setTimeout(function () {
//         self.registration.showNotification('Title', {
//             body: 'body blablabla',
//             badge: 'assets/images/logo.jpeg',
//             icon: 'assets/images/logo.jpeg',
//             renotify: false,
//             requireInteraction: true,
//             silent: false,
//             vibrate: [200, 100, 200],
//             dir: 'ltr',
//             lang: 'en-US'
//         });
//     }, 3000);
//
// }
//
// showNotification();
