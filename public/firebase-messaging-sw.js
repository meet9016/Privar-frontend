importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyExample',
  authDomain: 'parivar-18276.firebaseapp.com',
  projectId: 'parivar-18276',
  storageBucket: 'parivar-18276.appspot.com',
  messagingSenderId: 'YOUR_SENDER_ID',
  appId: 'YOUR_APP_ID',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body, imageUrl } = payload.notification || payload.data || {};
  self.registration.showNotification(title || 'Parivar', {
    body: body || '',
    icon: '/favicon.ico',
    image: imageUrl || '',
    badge: '/favicon.ico',
  });
});
