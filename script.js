// Twoja dotychczasowa logika (np. czat, newsy) pozostaje na dole, ja daję na górę logowanie i rejestrację Firebase

// --- KONFIGURACJA FIREBASE ---
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

let currentUserData = null; // będzie obiekt { uid, email, username, avatarUrl }

// --- POKAŻ/UKRYJ FORMULARZE ---
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

// --- REJESTRACJA ---
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
    // Rejestracja Firebase
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    const user = userCredential.user;

    // Zapis dodatkowych danych w Firestore
    await db.collection('users').doc(user.uid).set({
      username: username,
      avatarUrl: ''
    });

    alert('Rejestracja zakończona sukcesem. Możesz się teraz zalogować.');
    registerFormSection.style.display = 'none';
    registerForm.reset();

  } catch (error) {
    alert('Błąd podczas rejestracji: ' + error.message);
  }
});

// --- LOGOWANIE ---
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;

  try {
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    const user = userCredential.user;

    // Pobierz dodatkowe dane użytkownika z Firestore
    const userDoc = await db.collection('users').doc(user.uid).get();
    if (!userDoc.exists) {
      alert('Nie znaleziono danych użytkownika!');
      return;
    }
    currentUserData = {
      uid: user.uid,
      email: user.email,
      username: userDoc.data().username,
      avatarUrl: userDoc.data().avatarUrl || ''
    };

    loginFormSection.style.display = 'none';
    loginForm.reset();

    updateUIAfterLogin();

  } catch (error) {
    alert('Błąd podczas logowania: ' + error.message);
  }
});

// --- WYLOGOWANIE ---
logoutBtn.addEventListener('click', async () => {
  await auth.signOut();
  currentUserData = null;
  updateUIAfterLogout();
});

// --- ZAPIS AWATARA ---
saveAvatarBtn.addEventListener('click', async () => {
  const newAvatarUrl = avatarUrlInput.value.trim();
  if (!newAvatarUrl) {
    alert('Podaj link do awatara!');
    return;
  }
  if (!currentUserData) return alert('Nie jesteś zalogowany!');

  try {
    await db.collection('users').doc(currentUserData.uid).update({
      avatarUrl: newAvatarUrl
    });
    currentUserData.avatarUrl = newAvatarUrl;
    avatarPreview.src = newAvatarUrl;
    alert('Awatar został zapisany!');
  } catch (error) {
    alert('Błąd podczas zapisywania awatara: ' + error.message);
  }
});

// --- AKTUALIZACJA UI PO ZALOGOWANIU ---
function updateUIAfterLogin() {
  // Ukryj formularze logowania/rejestracji
  loginFormSection.style.display = 'none';
  registerFormSection.style.display = 'none';

  // Ukryj linki do logowania i rejestracji
  document.getElementById('auth-buttons').style.display = 'none';

  // Pokaż panel użytkownika
  userPanel.style.display = 'block';
  userNameDisplay.textContent = currentUserData.username || currentUserData.email;
  avatarPreview.src = currentUserData.avatarUrl || '';
  avatarUrlInput.value = currentUserData.avatarUrl || '';

  // Odblokuj czat
  chatInput.disabled = false;
  sendBtn.disabled = false;
  chatLoginWarning.style.display = 'none';

  // Jeśli user to admin (username == "admin"), pokaż panel admina
  if (currentUserData.username.toLowerCase() === 'admin') {
    adminPanel.style.display = 'block';
  } else {
    adminPanel.style.display = 'none';
  }
}

// --- AKTUALIZACJA UI PO WYLOGOWANIU ---
function updateUIAfterLogout() {
  // Pokaż linki do logowania i rejestracji
  document.getElementById('auth-buttons').style.display = 'block';

  // Ukryj panel użytkownika
  userPanel.style.display = 'none';

  // Zablokuj czat
  chatInput.disabled = true;
  sendBtn.disabled = true;
  chatLoginWarning.style.display = 'block';

  // Ukryj panel admina
  adminPanel.style.display = 'none';
}

// --- OBSŁUGA STANU ZALOGOWANIA przy ładowaniu strony ---
auth.onAuthStateChanged(async (user) => {
  if (user) {
    // Pobierz dane z Firestore
    const userDoc = await db.collection('users').doc(user.uid).get();
    if (userDoc.exists) {
      currentUserData = {
        uid: user.uid,
        email: user.email,
        username: userDoc.data().username,
        avatarUrl: userDoc.data().avatarUrl || ''
      };
      updateUIAfterLogin();
    } else {
      // Jeśli nie ma dokumentu w Firestore, wyloguj
      await auth.signOut();
      updateUIAfterLogout();
    }
  } else {
    currentUserData = null;
    updateUIAfterLogout();
  }
});

// --- Poniżej wstaw swoją dotychczasową logikę do czatu, newsów itd ---
// np. funkcje do czatu, newsów, eventy itd.

// -- Twoja istniejąca logika --
// Tutaj zachowaj swój dotychczasowy kod do:
// - dodawania newsów do localStorage i wyświetlania
// - obsługi czatu i wiadomości w localStorage
// - panel admina usuwania wiadomości itp.

// Uwaga: pamiętaj, że teraz logowanie/rejestracja są na Firebase, więc nie korzystaj z localStorage do zapisywania użytkowników!

// --- Przykład blokady wysyłania wiadomości na czacie jeśli nie zalogowany ---
sendBtn.addEventListener('click', () => {
  if (!currentUserData) {
    alert('Musisz być zalogowany, aby pisać na czacie.');
    return;
  }
  const msgInput = document.getElementById('chat-input');
  const msg = msgInput.value.trim();
  if (!msg) return;
  
  // tutaj dodaj swoją logikę zapisywania i wyświetlania wiadomości czatu
  
  msgInput.value = '';
});

// Możesz też dodać obsługę Enter na polu czatu itd.

