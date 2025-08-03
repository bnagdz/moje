// script.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

// Konfiguracja Firebase
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

// -----------------------
// Obsługa formularzy logowania i rejestracji

// Pokaż/ukryj formularze logowania/rejestracji
const loginLink = document.getElementById("login-link");
const registerLink = document.getElementById("register-link");
const loginFormSection = document.getElementById("login-form-section");
const registerFormSection = document.getElementById("register-form-section");
const cancelLoginBtn = document.getElementById("cancel-login");
const cancelRegisterBtn = document.getElementById("cancel-register");

loginLink.addEventListener("click", () => {
  loginFormSection.style.display = "block";
  registerFormSection.style.display = "none";
});

registerLink.addEventListener("click", () => {
  registerFormSection.style.display = "block";
  loginFormSection.style.display = "none";
});

cancelLoginBtn.addEventListener("click", () => {
  loginFormSection.style.display = "none";
});

cancelRegisterBtn.addEventListener("click", () => {
  registerFormSection.style.display = "none";
});

// Rejestracja użytkownika
document.getElementById("register-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("register-email").value;
  const password = document.getElementById("register-password").value;
  const username = document.getElementById("register-username").value;

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Zapis nicku i avatar (pusty) do Firestore
    await setDoc(doc(db, "users", user.uid), {
      username: username,
      email: email,
      avatar: ""
    });

    alert("Rejestracja udana!");
    registerFormSection.style.display = "none";
  } catch (error) {
    alert("Błąd rejestracji: " + error.message);
  }
});

// Logowanie użytkownika
document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;

  try {
    await signInWithEmailAndPassword(auth, email, password);
    alert("Zalogowano pomyślnie!");
    loginFormSection.style.display = "none";
  } catch (error) {
    alert("Błąd logowania: " + error.message);
  }
});

// Wylogowanie
document.getElementById("logout-btn").addEventListener("click", async () => {
  await signOut(auth);
});

// Panel użytkownika i aktualizacja awatara
const userPanel = document.getElementById("user-panel");
const userNameDisplay = document.getElementById("user-name-display");
const avatarPreview = document.getElementById("avatar-preview");
const avatarUrlInput = document.getElementById("avatar-url");
const saveAvatarBtn = document.getElementById("save-avatar");

saveAvatarBtn.addEventListener("click", async () => {
  const user = auth.currentUser;
  if (!user) return alert("Nie jesteś zalogowany!");

  const newAvatarUrl = avatarUrlInput.value.trim();

  try {
    await updateDoc(doc(db, "users", user.uid), { avatar: newAvatarUrl });
    avatarPreview.src = newAvatarUrl || "";
    alert("Awatar zapisany!");
  } catch (error) {
    alert("Błąd zapisu awatara: " + error.message);
  }
});

// Nasłuchiwanie na zmianę stanu zalogowania
onAuthStateChanged(auth, async (user) => {
  const authButtons = document.getElementById("auth-buttons");
  if (user) {
    // Pobierz dane użytkownika z Firestore
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      userNameDisplay.textContent = userData.username;
      avatarPreview.src = userData.avatar || "";
      avatarUrlInput.value = userData.avatar || "";
    } else {
      userNameDisplay.textContent = "Anonim";
      avatarPreview.src = "";
      avatarUrlInput.value = "";
    }

    // Pokaż panel użytkownika
    userPanel.style.display = "block";
    // Ukryj formularze i linki logowania/rejestracji
    authButtons.style.display = "none";
    loginFormSection.style.display = "none";
    registerFormSection.style.display = "none";

    // Włącz input do czatu i przycisk
    document.getElementById("chat-input").disabled = false;
    document.getElementById("send-btn").disabled = false;
    document.getElementById("chat-login-warning").style.display = "none";

    // Sprawdź, czy jest admin (np. login email: admin@twojadomena.pl)
    if (user.email === "admin@twojadomena.pl") {
      document.getElementById("admin-panel").style.display = "block";
    } else {
      document.getElementById("admin-panel").style.display = "none";
    }

  } else {
    // Użytkownik wylogowany
    userPanel.style.display = "none";
    authButtons.style.display = "block";

    document.getElementById("chat-input").disabled = true;
    document.getElementById("send-btn").disabled = true;
    document.getElementById("chat-login-warning").style.display = "block";

    document.getElementById("admin-panel").style.display = "none";
  }
});


// -----------------------
// Tutaj możesz dopisać swoją obsługę czatu, komentarzy, newsów itp. tak jak miałeś wcześniej.
// Pamiętaj, że teraz dostęp do usera masz przez auth.currentUser

