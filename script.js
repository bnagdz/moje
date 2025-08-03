// --- Inicjalizacja Firebase ---
const firebaseConfig = {
  apiKey: "AIzaSyAvZ2ZdDjDLisZbMOqHCbcDNK5rMsXCgy8",
  authDomain: "strona-ed4f6.firebaseapp.com",
  projectId: "strona-ed4f6",
  storageBucket: "strona-ed4f6.appspot.com",
  messagingSenderId: "101656150028",
  appId: "1:101656150028:web:5830ca8a36c5b5250e6e29",
  measurementId: "G-EWYZQPTM5Y"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// --- ELEMENTY DOM ---
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
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');
const chatLoginWarning = document.getElementById('chat-login-warning');
const adminPanel = document.getElementById('admin-panel');
const newsForm = document.getElementById('news-form');
const chatAdminList = document.getElementById('chat-admin-list');
const closeAdminBtn = document.getElementById('close-admin');

// --- FUNKCJE POMOCNICZE ---

// Pokazuje formularz i ukrywa drugi
function showLoginForm() {
  loginFormSection.style.display = 'block';
  registerFormSection.style.display = 'none';
}

function showRegisterForm() {
  registerFormSection.style.display = 'block';
  loginFormSection.style.display = 'none';
}

function hideForms() {
  loginFormSection.style.display = 'none';
  registerFormSection.style.display = 'none';
}

// Aktualizuje UI po zalogowaniu lub wylogowaniu
function updateUI(user, userData) {
  if (user) {
    userNameDisplay.textContent = userData?.username || user.email || "Użytkownik";
    avatarPreview.src = userData?.avatarUrl || "";
    avatarUrlInput.value = userData?.avatarUrl || "";

    userPanel.style.display = 'block';
    loginLink.style.display = 'none';
    registerLink.style.display = 'none';

    chatInput.disabled = false;
    sendBtn.disabled = false;
    chatLoginWarning.style.display = 'none';

    // Dostęp do panelu admina jeśli username to 'admin'
    if (userData?.username === 'admin') {
      adminPanel.style.display = 'block';
    } else {
      adminPanel.style.display = 'none';
    }
  } else {
    userPanel.style.display = 'none';
    loginLink.style.display = 'inline-block';
    registerLink.style.display = 'inline-block';

    chatInput.disabled = true;
    sendBtn.disabled = true;
    chatLoginWarning.style.display = 'block';

    adminPanel.style.display = 'none';
  }
}

// --- OBSŁUGA ZDARZEŃ ---

// Pokaż/ukryj formularze
loginLink.addEventListener('click', () => {
  if (loginFormSection.style.display === 'block') {
    hideForms();
  } else {
    showLoginForm();
  }
});

registerLink.addEventListener('click', () => {
  if (registerFormSection.style.display === 'block') {
    hideForms();
  } else {
    showRegisterForm();
  }
});

cancelLoginBtn.addEventListener('click', (e) => {
  e.preventDefault();
  hideForms();
});

cancelRegisterBtn.addEventListener('click', (e) => {
  e.preventDefault();
  hideForms();
});

// Rejestracja
registerForm.addEventListener('submit', e => {
  e.preventDefault();
  const username = document.getElementById('register-username').value.trim();
  const email = document.getElementById('register-email').value.trim();
  const password = document.getElementById('register-password').value;

  if (!username) {
    alert('Podaj nazwę użytkownika!');
    return;
  }

  auth.createUserWithEmailAndPassword(email, password)
    .then(userCredential => {
      const user = userCredential.user;
      // zapis danych użytkownika w Firestore
      return db.collection('users').doc(user.uid).set({
        username: username,
        email: email,
        avatarUrl: '',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    })
    .then(() => {
      alert('Zarejestrowano pomyślnie!');
      hideForms();
      registerForm.reset();
    })
    .catch(error => {
      alert('Błąd rejestracji: ' + error.message);
    });
});

// Logowanie
loginForm.addEventListener('submit', e => {
  e.preventDefault();
  const email = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;

  auth.signInWithEmailAndPassword(email, password)
    .then(() => {
      alert('Zalogowano pomyślnie!');
      hideForms();
      loginForm.reset();
    })
    .catch(error => {
      alert('Błąd logowania: ' + error.message);
    });
});

// Wylogowanie
logoutBtn.addEventListener('click', () => {
  auth.signOut();
});

// Zapis awatara
saveAvatarBtn.addEventListener('click', () => {
  const user = auth.currentUser;
  if (!user) return alert('Musisz być zalogowany, aby zapisać awatar.');

  const newAvatarUrl = avatarUrlInput.value.trim();
  db.collection('users').doc(user.uid).update({
    avatarUrl: newAvatarUrl
  }).then(() => {
    avatarPreview.src = newAvatarUrl;
    alert('Awatar zapisany!');
  }).catch(err => {
    alert('Błąd zapisu awatara: ' + err.message);
  });
});

// --- OBSŁUGA AUTH STATE ---

auth.onAuthStateChanged(async (user) => {
  if (user) {
    // pobierz dane użytkownika z Firestore
    const doc = await db.collection('users').doc(user.uid).get();
    const userData = doc.exists ? doc.data() : null;
    updateUI(user, userData);
  } else {
    updateUI(null);
  }
});

// --- ADMIN: Dodawanie newsów ---
newsForm.addEventListener('submit', async e => {
  e.preventDefault();

  const user = auth.currentUser;
  if (!user) {
    alert('Musisz być zalogowany, aby dodać wiadomość!');
    return;
  }

  // Sprawdź czy user to admin
  const userDoc = await db.collection('users').doc(user.uid).get();
  if (!userDoc.exists || userDoc.data().username !== 'admin') {
    alert('Brak uprawnień!');
    return;
  }

  const title = document.getElementById('news-title').value.trim();
  const content = document.getElementById('news-content').value.trim();

  if (!title || !content) {
    alert('Podaj tytuł i treść wiadomości!');
    return;
  }

  db.collection('news').add({
    title: title,
    content: content,
    author: userDoc.data().username,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  }).then(() => {
    alert('Wiadomość dodana!');
    newsForm.reset();
  }).catch(err => {
    alert('Błąd dodawania wiadomości: ' + err.message);
  });
});

// --- ZAMYKANIE PANELU ADMINA ---
closeAdminBtn.addEventListener('click', () => {
  adminPanel.style.display = 'none';
});

// --- INICJALIZACJA CZATU ---
// Tu możesz dodać obsługę czatu w Firestore (np. pobieranie wiadomości, wysyłanie)

// Na start wyłącz pole czatu dla niezalogowanych:
chatInput.disabled = true;
sendBtn.disabled = true;
chatLoginWarning.style.display = 'block';

