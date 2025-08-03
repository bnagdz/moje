import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

// --- Konfiguracja Firebase ---
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
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

document.addEventListener('DOMContentLoaded', () => {
  // Elementy HTML
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const loginUsernameInput = document.getElementById('login-username');
  const loginPasswordInput = document.getElementById('login-password');
  const registerUsernameInput = document.getElementById('register-username');
  const registerEmailInput = document.getElementById('register-email');
  const registerPasswordInput = document.getElementById('register-password');
  const userPanel = document.getElementById('user-panel');
  const userNameDisplay = document.getElementById('user-name-display');
  const avatarPreview = document.getElementById('avatar-preview');
  const avatarUrlInput = document.getElementById('avatar-url');
  const saveAvatarBtn = document.getElementById('save-avatar');
  const logoutBtn = document.getElementById('logout-btn');
  const chatInput = document.getElementById('chat-input');
  const sendBtn = document.getElementById('send-btn');
  const chatLoginWarning = document.getElementById('chat-login-warning');
  const loginLink = document.getElementById('login-link');
  const registerLink = document.getElementById('register-link');
  const loginFormSection = document.getElementById('login-form-section');
  const registerFormSection = document.getElementById('register-form-section');
  const cancelLoginBtn = document.getElementById('cancel-login');
  const cancelRegisterBtn = document.getElementById('cancel-register');
  const authButtons = document.getElementById('auth-buttons');
  const adminPanel = document.getElementById('admin-panel');
  const chatMessagesContainer = document.getElementById('messages');

  // Pokazywanie/ukrywanie formularzy
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

  // Rejestracja
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = registerEmailInput.value.trim();
    const password = registerPasswordInput.value;
    const username = registerUsernameInput.value.trim();

    if (!username) {
      alert('Podaj nazwę użytkownika!');
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Zapisz nick i pusty avatar w Firestore
      await setDoc(doc(db, 'users', user.uid), {
        username: username,
        avatar: ''
      });

      alert('Zarejestrowano pomyślnie!');
      registerForm.reset();
      registerFormSection.style.display = 'none';
    } catch (error) {
      alert('Błąd rejestracji: ' + error.message);
    }
  });

  // Logowanie
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = loginUsernameInput.value.trim();
    const password = loginPasswordInput.value;

    try {
      await signInWithEmailAndPassword(auth, email, password);
      alert('Zalogowano pomyślnie!');
      loginForm.reset();
      loginFormSection.style.display = 'none';
    } catch (error) {
      alert('Błąd logowania: ' + error.message);
    }
  });

  // Wylogowanie
  logoutBtn.addEventListener('click', async () => {
    await signOut(auth);
  });

  // Zapis awatara
  saveAvatarBtn.addEventListener('click', async () => {
    const user = auth.currentUser;
    if (!user) return alert('Musisz być zalogowany!');

    const newAvatarUrl = avatarUrlInput.value.trim();
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        avatar: newAvatarUrl
      });
      avatarPreview.src = newAvatarUrl;
      alert('Awatar zapisany.');
    } catch (error) {
      alert('Błąd zapisu awatara: ' + error.message);
    }
  });

  // Obsługa czatu: wysyłanie wiadomości
  sendBtn.addEventListener('click', async () => {
    const user = auth.currentUser;
    if (!user) {
      alert('Musisz być zalogowany, aby pisać na czacie.');
      return;
    }
    const text = chatInput.value.trim();
    if (!text) return;

    // Pobierz username i avatar z Firestore
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    const userData = userDoc.exists() ? userDoc.data() : {};

    try {
      await addDoc(collection(db, 'chatMessages'), {
        uid: user.uid,
        username: userData.username || 'Anonim',
        avatar: userData.avatar || '',
        text: text,
        timestamp: serverTimestamp()
      });
      chatInput.value = '';
    } catch (error) {
      alert('Błąd wysyłania wiadomości: ' + error.message);
    }
  });

  // Wyświetlanie wiadomości na czacie - realtime
  const q = query(collection(db, 'chatMessages'), orderBy('timestamp', 'asc'));
  onSnapshot(q, (querySnapshot) => {
    chatMessagesContainer.innerHTML = ''; // czyść okno

    querySnapshot.forEach((doc) => {
      const msg = doc.data();
      const time = msg.timestamp ? msg.timestamp.toDate().toLocaleString() : '';
      const avatarImg = msg.avatar ? `<img src="${msg.avatar}" alt="avatar" class="chat-avatar" />` : '';
      chatMessagesContainer.innerHTML += `
        <div class="chat-message">
          ${avatarImg}
          <strong>${msg.username}</strong> <small>${time}</small><br/>
          <span>${msg.text}</span>
        </div>
      `;
    });

    // Scroll na dół czatu
    chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
  });

  // Aktualizacja widoku po zalogowaniu/wylogowaniu
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      // Pobierz dane użytkownika z Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.exists() ? userDoc.data() : {};

      userNameDisplay.textContent = userData.username || 'User';
      avatarPreview.src = userData.avatar || '';
      avatarUrlInput.value = userData.avatar || '';

      userPanel.style.display = 'block';
      chatInput.disabled = false;
      sendBtn.disabled = false;
      chatLoginWarning.style.display = 'none';
      authButtons.style.display = 'none';
      
      // Pokaż panel admina jeśli email to bnagdz@o2.pl
      if (user.email && user.email.toLowerCase() === 'bnagdz@o2.pl') {
        adminPanel.style.display = 'block';
      } else {
        adminPanel.style.display = 'none';
      }
      
      loginFormSection.style.display = 'none';
      registerFormSection.style.display = 'none';
    } else {
      // Użytkownik wylogowany
      userPanel.style.display = 'none';
      chatInput.disabled = true;
      sendBtn.disabled = true;
      chatLoginWarning.style.display = 'block';
      authButtons.style.display = 'block';
      adminPanel.style.display = 'none';
      userNameDisplay.textContent = '';
      avatarPreview.src = '';
      avatarUrlInput.value = '';
    }
  });
});
