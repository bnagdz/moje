// Konfiguracja Firebase (wstaw swoją konfigurację)
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
const cancelLogin = document.getElementById('cancel-login');
const cancelRegister = document.getElementById('cancel-register');
const authButtons = document.getElementById('auth-buttons');

const userPanel = document.getElementById('user-panel');
const userNameDisplay = document.getElementById('user-name-display');
const avatarPreview = document.getElementById('avatar-preview');
const avatarUrlInput = document.getElementById('avatar-url');
const saveAvatarBtn = document.getElementById('save-avatar');
const logoutBtn = document.getElementById('logout-btn');

const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');
const messagesBox = document.getElementById('messages');
const chatLoginWarning = document.getElementById('chat-login-warning');

const adminPanel = document.getElementById('admin-panel');
const newsForm = document.getElementById('news-form');
const newsContainer = document.getElementById('news');
const chatAdminList = document.getElementById('chat-admin-list');
const closeAdminBtn = document.getElementById('close-admin');

// Pomocnicze zmienne
let currentUserData = null;
let unsubscribeMessages = null;
let unsubscribeNews = null;

// POKAŻ / UKRYJ formularze logowania/rejestracji
loginLink.onclick = () => {
  loginFormSection.style.display = 'block';
  registerFormSection.style.display = 'none';
};
registerLink.onclick = () => {
  registerFormSection.style.display = 'block';
  loginFormSection.style.display = 'none';
};
cancelLogin.onclick = () => {
  loginFormSection.style.display = 'none';
  loginForm.reset();
};
cancelRegister.onclick = () => {
  registerFormSection.style.display = 'none';
  registerForm.reset();
};

// REJESTRACJA
registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('register-username').value.trim();
  const email = document.getElementById('register-email').value.trim();
  const password = document.getElementById('register-password').value;

  if (!username || !email || !password) {
    alert('Wypełnij wszystkie pola!');
    return;
  }

  try {
    // Sprawdź, czy nick już istnieje
    const nickQuery = await db.collection('users').where('username', '==', username).get();
    if (!nickQuery.empty) {
      alert('Nazwa użytkownika jest już zajęta!');
      return;
    }

    // Utwórz konto Firebase Auth
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    const user = userCredential.user;

    // Zapisz dodatkowe dane w Firestore
    await db.collection('users').doc(user.uid).set({
      username: username,
      avatarUrl: '',
      email: email,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });

    alert('Rejestracja przebiegła pomyślnie!');
    registerForm.reset();
    registerFormSection.style.display = 'none';
  } catch (error) {
    alert('Błąd rejestracji: ' + error.message);
  }
});

// LOGOWANIE
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;

  if (!email || !password) {
    alert('Wypełnij wszystkie pola!');
    return;
  }

  try {
    await auth.signInWithEmailAndPassword(email, password);
    loginForm.reset();
    loginFormSection.style.display = 'none';
  } catch (error) {
    alert('Błąd logowania: ' + error.message);
  }
});

// WYLOGOWANIE
logoutBtn.addEventListener('click', () => {
  auth.signOut();
});

// OBSŁUGA AWATARA - zapisz w Firestore
saveAvatarBtn.addEventListener('click', async () => {
  if (!currentUserData) return alert('Brak danych użytkownika.');

  const newAvatarUrl = avatarUrlInput.value.trim();
  try {
    await db.collection('users').doc(auth.currentUser.uid).update({
      avatarUrl: newAvatarUrl
    });
    avatarPreview.src = newAvatarUrl || '';
    alert('Awatar został zapisany.');
  } catch (error) {
    alert('Błąd podczas zapisu awatara: ' + error.message);
  }
});

// OBSŁUGA CZATU
sendBtn.addEventListener('click', sendMessage);
chatInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') sendMessage();
});

async function sendMessage() {
  const text = chatInput.value.trim();
  if (!text) return;

  if (!currentUserData) {
    alert('Musisz być zalogowany, aby pisać na czacie.');
    return;
  }

  try {
    await db.collection('chatMessages').add({
      text,
      uid: auth.currentUser.uid,
      username: currentUserData.username,
      avatarUrl: currentUserData.avatarUrl || '',
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    chatInput.value = '';
  } catch (error) {
    alert('Błąd podczas wysyłania wiadomości: ' + error.message);
  }
}

// WYŚWIETLANIE WIADOMOŚCI Z CZATU
function startChatListener() {
  if (unsubscribeMessages) unsubscribeMessages();

  unsubscribeMessages = db.collection('chatMessages')
    .orderBy('createdAt', 'asc')
    .limit(100)
    .onSnapshot(snapshot => {
      messagesBox.innerHTML = '';
      snapshot.forEach(doc => {
        const msg = doc.data();
        const dateStr = msg.createdAt ? msg.createdAt.toDate().toLocaleString() : '';
        const li = document.createElement('div');
        li.classList.add('chat-message');
        li.innerHTML = `
          <img src="${msg.avatarUrl || 'https://via.placeholder.com/30'}" alt="Avatar" class="chat-avatar"/>
          <b>${msg.username}</b> <small>${dateStr}</small><br/>
          <span>${escapeHtml(msg.text)}</span>
        `;

        // Jeśli admin, dodaj przycisk usuwania
        if (currentUserData && currentUserData.username === 'admin') {
          const delBtn = document.createElement('button');
          delBtn.textContent = 'Usuń';
          delBtn.style.marginLeft = '10px';
          delBtn.onclick = () => deleteChatMessage(doc.id);
          li.appendChild(delBtn);
        }

        messagesBox.appendChild(li);
      });

      // Scroll do dołu czatu
      messagesBox.scrollTop = messagesBox.scrollHeight;
    });
}

// USUWANIE WIADOMOŚCI Z CZATU (admin)
async function deleteChatMessage(id) {
  if (!confirm('Na pewno chcesz usunąć tę wiadomość?')) return;
  try {
    await db.collection('chatMessages').doc(id).delete();
  } catch (error) {
    alert('Błąd usuwania wiadomości: ' + error.message);
  }
}

// WYŚWIETLANIE NEWSÓW
function startNewsListener() {
  if (unsubscribeNews) unsubscribeNews();

  unsubscribeNews = db.collection('news')
    .orderBy('createdAt', 'desc')
    .onSnapshot(snapshot => {
      newsContainer.innerHTML = '';
      snapshot.forEach(doc => {
        const news = doc.data();
        const dateStr = news.createdAt ? news.createdAt.toDate().toLocaleString() : '';
        const div = document.createElement('div');
        div.classList.add('news-item');
        div.innerHTML = `
          <h3>${escapeHtml(news.title)}</h3>
          <small>Autor: ${escapeHtml(news.author)} | ${dateStr}</small>
          <p>${escapeHtml(news.content)}</p>
        `;
        newsContainer.appendChild(div);
      });
    });
}

// PANEL ADMINA - dodawanie newsów
newsForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  if (!currentUserData || currentUserData.username !== 'admin') {
    alert('Brak dostępu do panelu administracyjnego.');
    return;
  }

  const title = document.getElementById('news-title').value.trim();
  const content = document.getElementById('news-content').value.trim();
  if (!title || !content) {
    alert('Wypełnij wszystkie pola.');
    return;
  }

  try {
    await db.collection('news').add({
      title,
      content,
      author: currentUserData.username,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    newsForm.reset();
    alert('Wiadomość została dodana.');
  } catch (error) {
    alert('Błąd dodawania wiadomości: ' + error.message);
  }
});

// OBSŁUGA PANELU ADMINA (listowanie wiadomości z czatu)
function startAdminChatListListener() {
  chatAdminList.innerHTML = '';

  db.collection('chatMessages')
    .orderBy('createdAt', 'desc')
    .limit(50)
    .onSnapshot(snapshot => {
      chatAdminList.innerHTML = '';
      snapshot.forEach(doc => {
        const msg = doc.data();
        const li = document.createElement('li');
        li.textContent = `${msg.username}: ${msg.text}`;
        // Przycisk usuwania
        if (currentUserData && currentUserData.username === 'admin') {
          const delBtn = document.createElement('button');
          delBtn.textContent = 'Usuń';
          delBtn.onclick = () => deleteChatMessage(doc.id);
          li.appendChild(delBtn);
        }
        chatAdminList.appendChild(li);
      });
    });
}

// WYŚWIETLANIE PANELU ADMINA I USERA
function updateUI(user, userData) {
  if (user) {
    authButtons.style.display = 'none';
    userPanel.style.display = 'block';
    userNameDisplay.textContent = userData.username;
    avatarPreview.src = userData.avatarUrl || '';
    avatarUrlInput.value = userData.avatarUrl || '';

    chatInput.disabled = false;
    sendBtn.disabled = false;
    chatLoginWarning.style.display = 'none';

    // Jeśli admin, pokaż panel admina
    if (userData.username === 'admin') {
      adminPanel.style.display = 'block';
      startAdminChatListListener();
    } else {
      adminPanel.style.display = 'none';
    }

  } else {
    authButtons.style.display = 'block';
    loginFormSection.style.display = 'none';
    registerFormSection.style.display = 'none';

    userPanel.style.display = 'none';
    adminPanel.style.display = 'none';

    chatInput.disabled = true;
    sendBtn.disabled = true;
    chatLoginWarning.style.display = 'block';
  }
}

// ODSŁUCHIWANIE ZMIANY STANU AUTH
auth.onAuthStateChanged(async (user) => {
  if (user) {
    // Pobierz dane użytkownika
