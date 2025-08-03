// Firebase konfiguracja (podstaw Twoją konfigurację)
const firebaseConfig = {
  apiKey: "AIzaSyAvZ2ZdDjDLisZbMOqHCbcDNK5rMsXCgy8",
  authDomain: "strona-ed4f6.firebaseapp.com",
  projectId: "strona-ed4f6",
  storageBucket: "strona-ed4f6.appspot.com",
  messagingSenderId: "101656150028",
  appId: "1:101656150028:web:5830ca8a36c5b5250e6e29",
  measurementId: "G-EWYZQPTM5Y"
};

// Inicjalizacja Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Elementy DOM
const loginLink = document.getElementById('login-link');
const registerLink = document.getElementById('register-link');
const loginFormSection = document.getElementById('login-form-section');
const registerFormSection = document.getElementById('register-form-section');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const cancelLoginBtn = document.getElementById('cancel-login');
const cancelRegisterBtn = document.getElementById('cancel-register');

const userPanel = document.getElementById('user-panel');
const userNameDisplay = document.getElementById('user-name-display');
const avatarPreview = document.getElementById('avatar-preview');
const avatarUrlInput = document.getElementById('avatar-url');
const saveAvatarBtn = document.getElementById('save-avatar');
const logoutBtn = document.getElementById('logout-btn');

const chatLoginWarning = document.getElementById('chat-login-warning');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');
const messagesDiv = document.getElementById('messages');

const adminPanel = document.getElementById('admin-panel');
const newsForm = document.getElementById('news-form');
const newsTitleInput = document.getElementById('news-title');
const newsContentInput = document.getElementById('news-content');
const newsDiv = document.getElementById('news');

const chatAdminList = document.getElementById('chat-admin-list');
const closeAdminBtn = document.getElementById('close-admin');

let currentUser = null;

// Pokaż / Ukryj formularze logowania i rejestracji
loginLink.addEventListener('click', () => {
  loginFormSection.style.display = 'block';
  registerFormSection.style.display = 'none';
});
registerLink.addEventListener('click', () => {
  registerFormSection.style.display = 'block';
  loginFormSection.style.display = 'none';
});
cancelLoginBtn.addEventListener('click', () => {
  loginFormSection.style.display = 'none';
});
cancelRegisterBtn.addEventListener('click', () => {
  registerFormSection.style.display = 'none';
});

// Rejestracja użytkownika
registerForm.addEventListener('submit', async e => {
  e.preventDefault();
  const username = registerForm['register-username'].value.trim();
  const email = registerForm['register-email'].value.trim();
  const password = registerForm['register-password'].value;

  try {
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    const user = userCredential.user;

    // Dodaj dodatkowe dane do Firestore
    await db.collection('users').doc(user.uid).set({
      username: username,
      avatar: '',
      email: email,
      isAdmin: username.toLowerCase() === 'admin' // jeśli nazwa to admin - przyznaj admina
    });

    alert('Rejestracja przebiegła pomyślnie. Możesz się zalogować.');
    registerForm.reset();
    registerFormSection.style.display = 'none';
  } catch (error) {
    alert('Błąd rejestracji: ' + error.message);
  }
});

// Logowanie użytkownika
loginForm.addEventListener('submit', async e => {
  e.preventDefault();
  const email = loginForm['login-email'].value.trim();
  const password = loginForm['login-password'].value;

  try {
    await auth.signInWithEmailAndPassword(email, password);
    loginForm.reset();
    loginFormSection.style.display = 'none';
  } catch (error) {
    alert('Błąd logowania: ' + error.message);
  }
});

// Wylogowanie
logoutBtn.addEventListener('click', () => {
  auth.signOut();
});

// Zapis awatara
saveAvatarBtn.addEventListener('click', async () => {
  const url = avatarUrlInput.value.trim();
  if (!url) {
    alert('Podaj URL do awatara.');
    return;
  }
  try {
    await db.collection('users').doc(currentUser.uid).update({ avatar: url });
    avatarPreview.src = url;
    avatarUrlInput.value = '';
    alert('Awatar zapisany.');
  } catch (error) {
    alert('Błąd zapisu awatara: ' + error.message);
  }
});

// Nasłuchuj zmiany stanu uwierzytelnienia
auth.onAuthStateChanged(async user => {
  currentUser = user;
  if (user) {
    // Pobierz dane użytkownika z Firestore
    const userDoc = await db.collection('users').doc(user.uid).get();
    if (!userDoc.exists) {
      alert('Błąd: brak danych użytkownika.');
      return;
    }
    const userData = userDoc.data();

    // Pokaż panel użytkownika
    userNameDisplay.textContent = userData.username;
    avatarPreview.src = userData.avatar || 'default-avatar.png';
    avatarUrlInput.value = '';

    userPanel.style.display = 'block';
    document.getElementById('auth-buttons').style.display = 'none';

    // Włącz czat
    chatInput.disabled = false;
    sendBtn.disabled = false;
    chatLoginWarning.style.display = 'none';

    // Pokaż panel admina jeśli admin
    if (userData.isAdmin) {
      adminPanel.style.display = 'block';
      loadNews();
      loadChatMessagesAdmin();
    } else {
      adminPanel.style.display = 'none';
    }

    loadChatMessages();
  } else {
    currentUser = null;
    userPanel.style.display = 'none';
    document.getElementById('auth-buttons').style.display = 'block';

    chatInput.disabled = true;
    sendBtn.disabled = true;
    chatLoginWarning.style.display = 'block';

    adminPanel.style.display = 'none';

    // Wyczyść wiadomości czatu i newsów
    messagesDiv.innerHTML = '';
    newsDiv.innerHTML = '';
  }
});

// Dodawanie newsów (panel admina)
newsForm.addEventListener('submit', async e => {
  e.preventDefault();
  const title = newsTitleInput.value.trim();
  const content = newsContentInput.value.trim();
  if (!title || !content) return;

  try {
    await db.collection('news').add({
      title,
      content,
      author: currentUser.email,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    newsTitleInput.value = '';
    newsContentInput.value = '';
    loadNews();
  } catch (error) {
    alert('Błąd dodawania wiadomości: ' + error.message);
  }
});

// Ładowanie newsów i wyświetlanie
function loadNews() {
  db.collection('news').orderBy('createdAt', 'desc').onSnapshot(snapshot => {
    newsDiv.innerHTML = '';
    snapshot.forEach(doc => {
      const news = doc.data();
      const dateStr = news.createdAt ? news.createdAt.toDate().toLocaleString() : '';
      const div = document.createElement('div');
      div.classList.add('news-item');
      div.innerHTML = `<h3>${news.title}</h3><p>${news.content}</p><small>Autor: ${news.author} | ${dateStr}</small>`;
      newsDiv.appendChild(div);
    });
  });
}

// CZAT

// Wysyłanie wiadomości czatu
sendBtn.addEventListener('click', async () => {
  const text = chatInput.value.trim();
  if (!text) return;

  try {
    await db.collection('chat').add({
      userId: currentUser.uid,
      username: userNameDisplay.textContent,
      message: text,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    chatInput.value = '';
  } catch (error) {
    alert('Błąd wysyłania wiadomości: ' + error.message);
  }
});

// Nasłuchuj nowych wiadomości i wyświetlaj
function loadChatMessages() {
  db.collection('chat').orderBy('createdAt').limit(50).onSnapshot(snapshot => {
    messagesDiv.innerHTML = '';
    snapshot.forEach(doc => {
      const msg = doc.data();
      const dateStr = msg.createdAt ? msg.createdAt.toDate().toLocaleString() : '';
      const div = document.createElement('div');
      div.classList.add('chat-message');
      div.innerHTML = `<strong>${msg.username}:</strong> ${msg.message} <small>${dateStr}</small>`;
      messagesDiv.appendChild(div);
    });
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  });
}

// Ładowanie wiadomości czatu do panelu admina (lista z możliwością usuwania)
function loadChatMessagesAdmin() {
  chatAdminList.innerHTML = '';
  db.collection('chat').orderBy('createdAt').limit(100).onSnapshot(snapshot => {
    chatAdminList.innerHTML = '';
    snapshot.forEach(doc => {
      const msg = doc.data();
      const li = document.createElement('li');
      const dateStr = msg.createdAt ? msg.createdAt.toDate().toLocaleString() : '';
      li.textContent = `${msg.username}: ${msg.message} (${dateStr})`;
      // Dodaj przycisk usuwania wiadomości
      const delBtn = document.createElement('button');
      delBtn.textContent = 'Usuń';
      delBtn.style.marginLeft = '10px';
      delBtn.addEventListener('click', async () => {
        if (confirm('Na pewno usunąć tę wiadomość?')) {
          try {
            await db.collection('chat').doc(doc.id).delete();
          } catch (error) {
            alert('Błąd usuwania wiadomości: ' + error.message);
          }
        }
      });
      li.appendChild(delBtn);
      chatAdminList.appendChild(li);
    });
  });
}

// Zamknięcie panelu admina
closeAdminBtn.addEventListener('click', () => {
  adminPanel.style.display = 'none';
});

