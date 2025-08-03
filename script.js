import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import {
  getFirestore, collection, addDoc, getDocs, query, orderBy, onSnapshot,
  doc, setDoc, updateDoc, deleteDoc
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// Firebase config (wstaw swój config)
const firebaseConfig = {
  apiKey: "AIzaSyAvZ2ZdDjDLisZbMOqHCbcDNK5rMsXCgy8",
  authDomain: "strona-ed4f6.firebaseapp.com",
  projectId: "strona-ed4f6",
  storageBucket: "strona-ed4f6.appspot.com",
  messagingSenderId: "101656150028",
  appId: "1:101656150028:web:5830ca8a36c5b5250e6e29",
  measurementId: "G-EWYZQPTM5Y"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

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

const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');
const messagesDiv = document.getElementById('messages');
const chatLoginWarning = document.getElementById('chat-login-warning');

const adminPanel = document.getElementById('admin-panel');
const newsForm = document.getElementById('news-form');
const newsTitleInput = document.getElementById('news-title');
const newsContentInput = document.getElementById('news-content');
const newsContainer = document.getElementById('news');
const chatAdminList = document.getElementById('chat-admin-list');
const closeAdminBtn = document.getElementById('close-admin');

const authButtons = document.getElementById('auth-buttons');

let currentUser = null;
let currentUserData = null;

// Pokaż/ukryj formularze logowania i rejestracji
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
  const username = document.getElementById('register-username').value.trim();
  const email = document.getElementById('register-email').value.trim();
  const password = document.getElementById('register-password').value.trim();

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    // Zapisz nick i pusty avatar w Firestore
    await setDoc(doc(db, "users", user.uid), {
      username: username,
      avatar: "",
      email: email
    });
    alert("Rejestracja zakończona sukcesem. Możesz się teraz zalogować.");
    registerForm.reset();
    registerFormSection.style.display = 'none';
  } catch (error) {
    alert("Błąd rejestracji: " + error.message);
  }
});

// Logowanie użytkownika
loginForm.addEventListener('submit', async e => {
  e.preventDefault();
  const email = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value.trim();

  try {
    await signInWithEmailAndPassword(auth, email, password);
    loginForm.reset();
    loginFormSection.style.display = 'none';
  } catch (error) {
    alert("Błąd logowania: " + error.message);
  }
});

// Wylogowanie
logoutBtn.addEventListener('click', async () => {
  await signOut(auth);
});

// Zapisywanie avatara
saveAvatarBtn.addEventListener('click', async () => {
  const avatarUrl = avatarUrlInput.value.trim();
  if (!avatarUrl) {
    alert("Podaj link do avatara.");
    return;
  }
  if (!currentUser) return;
  try {
    await updateDoc(doc(db, "users", currentUser.uid), {
      avatar: avatarUrl
    });
    avatarPreview.src = avatarUrl;
    alert("Awatar zapisany.");
  } catch (error) {
    alert("Błąd zapisu avatara: " + error.message);
  }
});

// Pokazywanie/ukrywanie elementów po zmianie stanu logowania
onAuthStateChanged(auth, async user => {
  currentUser = user;
  if (user) {
    // Pobierz dane użytkownika z Firestore
    const userDoc = await getDocs(query(collection(db, "users"), 
      orderBy("username"))); // this is just to make sure users collection exists
    try {
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDocs(docRef);
    } catch {}
    const userDocSnap = await getDoc(doc(db, "users", user.uid));
    if (userDocSnap.exists()) {
      currentUserData = userDocSnap.data();
    } else {
      currentUserData = { username: "Anonim", avatar: "" };
    }

    // Aktualizacja panelu użytkownika
    userNameDisplay.textContent = currentUserData.username || user.email;
    avatarPreview.src = currentUserData.avatar || 'https://via.placeholder.com/80?text=Avatar';

    avatarUrlInput.value = currentUserData.avatar || '';
    userPanel.style.display = 'block';
    authButtons.style.display = 'none';

    chatInput.disabled = false;
    sendBtn.disabled = false;
    chatLoginWarning.style.display = 'none';

    // Pokaż panel admina tylko dla admina
    if (user.email === 'bnagdz@o2.pl') {
      adminPanel.style.display = 'block';
      loadAdminChatMessages();
    } else {
      adminPanel.style.display = 'none';
    }

    loadChatMessages();
    loadNewsMessages();

  } else {
    currentUserData = null;
    userPanel.style.display = 'none';
    authButtons.style.display = 'block';
    chatInput.disabled = true;
    sendBtn.disabled = true;
    chatLoginWarning.style.display = 'block';
    adminPanel.style.display = 'none';

    messagesDiv.innerHTML = "";
    newsContainer.innerHTML = "";
    chatAdminList.innerHTML = "";
  }
});

// CZAT

async function loadChatMessages() {
  const chatCol = collection(db, "chatMessages");
  const q = query(chatCol, orderBy("timestamp", "asc"));
  onSnapshot(q, (snapshot) => {
    messagesDiv.innerHTML = "";
    snapshot.forEach(doc => {
      const msg = doc.data();
      displayChatMessage(msg.author, msg.avatar, msg.text, msg.timestamp);
    });
  });
}

function displayChatMessage(author, avatar, text, timestamp) {
  const msgDiv = document.createElement('div');
  msgDiv.classList.add('message');

  const authorSpan = document.createElement('span');
  authorSpan.classList.add('author');
  authorSpan.textContent = author;

  const timeSpan = document.createElement('span');
  timeSpan.classList.add('time');
  timeSpan.textContent = new Date(timestamp?.toDate ? timestamp.toDate() : timestamp).toLocaleString();

  const avatarImg = document.createElement('img');
  avatarImg.classList.add('avatar-small');
  avatarImg.src = avatar || 'https://via.placeholder.com/30?text=U';

  const textSpan = document.createElement('span');
  textSpan.classList.add('text');
  textSpan.textContent = text;

  msgDiv.appendChild(avatarImg);
  msgDiv.appendChild(authorSpan);
  msgDiv.appendChild(timeSpan);
  msgDiv.appendChild(document.createElement('br'));
  msgDiv.appendChild(textSpan);

  messagesDiv.appendChild(msgDiv);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Wysyłanie wiadomości czatu
sendBtn.addEventListener('click', async () => {
  if (!currentUser || !currentUserData) return alert("Musisz być zalogowany.");
  const text = chatInput.value.trim();
  if (!text) return;
  try {
    await addDoc(collection(db, "chatMessages"), {
      author: currentUserData.username,
      avatar: currentUserData.avatar,
      text: text,
      timestamp: new Date()
    });
    chatInput.value = "";
  } catch (error) {
    alert("Błąd wysyłania wiadomości: " + error.message);
  }
});

// NEWSY

newsForm.addEventListener('submit', async e => {
  e.preventDefault();
  if (!currentUser || currentUser.email !== 'bnagdz@o2.pl') return alert("Brak dostępu.");
  const title = newsTitleInput.value.trim();
  const content = newsContentInput.value.trim();
  if (!title || !content) return alert("Wypełnij tytuł i treść.");
  try {
    await addDoc(collection(db, "news"), {
      title: title,
      content: content,
      author: currentUserData.username,
      timestamp: new Date()
    });
    newsTitleInput.value = "";
    newsContentInput.value = "";
  } catch (error) {
    alert("Błąd dodawania newsa: " + error.message);
  }
});

async function loadNewsMessages() {
  const newsCol = collection(db, "news");
  const q = query(newsCol, orderBy("timestamp", "desc"));
  onSnapshot(q, (snapshot) => {
    newsContainer.innerHTML = "";
    snapshot.forEach(doc => {
      const news = doc.data();
      displayNews(news.title, news.content, news.author, news.timestamp);
    });
  });
}

function displayNews(title, content, author, timestamp) {
  const newsDiv = document.createElement('div');
  newsDiv.classList.add('news-item');

  const titleEl = document.createElement('h3');
  titleEl.textContent = title;

  const metaEl = document.createElement('small');
  metaEl.textContent = `Dodane przez ${author} — ${new Date(timestamp?.toDate ? timestamp.toDate() : timestamp).toLocaleString()}`;

  const contentEl = document.createElement('p');
  contentEl.textContent = content;

  newsDiv.appendChild(titleEl);
  newsDiv.appendChild(metaEl);
  newsDiv.appendChild(contentEl);

  newsContainer.appendChild(newsDiv);
}

// PANEL ADMINISTRACYJNY CZAT

async function loadAdminChatMessages() {
  const chatCol = collection(db, "chatMessages");
  const q = query(chatCol, orderBy("timestamp", "asc"));
  onSnapshot(q, (snapshot) => {
    chatAdminList.innerHTML = "";
    snapshot.forEach(doc => {
      const msg = doc.data();
      const li = document.createElement('li');
      li.textContent = `[${new Date(msg.timestamp?.toDate ? msg.timestamp.toDate() : msg.timestamp).toLocaleString()}] ${msg.author}: ${msg.text}`;
      // Dodaj przycisk usuń
      const delBtn = document.createElement('button');
      delBtn.textContent = 'Usuń';
      delBtn.style.marginLeft = '10px';
      delBtn.addEventListener('click', async () => {
        try {
          await deleteDoc(doc(db, "chatMessages", doc.id));
        } catch (error) {
          alert("Błąd usuwania wiadomości: " + error.message);
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
