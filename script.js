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
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  updateDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAvZ2ZdDjDLisZbMOqHCbcDNK5rMsXCgy8",
  authDomain: "strona-ed4f6.firebaseapp.com",
  projectId: "strona-ed4f6",
  storageBucket: "strona-ed4f6.firebasestorage.app",
  messagingSenderId: "101656150028",
  appId: "1:101656150028:web:5830ca8a36c5b5250e6e29",
  measurementId: "G-EWYZQPTM5Y"
};

// Inicjalizacja Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

document.addEventListener('DOMContentLoaded', function () {
    // Elementy DOM
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const loginSection = document.getElementById('login-form-section');
    const registerSection = document.getElementById('register-form-section');
    const authButtons = document.getElementById('auth-buttons');
    const userPanel = document.getElementById('user-panel');
    const adminPanel = document.getElementById('admin-panel');
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');
    const chatWarning = document.getElementById('chat-login-warning');
    const messagesBox = document.getElementById('messages');
    const avatarPreview = document.getElementById('avatar-preview');
    const saveAvatarBtn = document.getElementById('save-avatar');
    const avatarUrlInput = document.getElementById('avatar-url');

    let currentUser = null;  // Będzie obiektem { uid, username, email, avatar }

    // --- FUNKCJE ---

    async function showUserPanel(userData) {
        // userData: { uid, username, email, avatar }
        document.getElementById('user-name-display').textContent = userData.username;
        avatarPreview.src = userData.avatar || 'https://via.placeholder.com/80';
        userPanel.style.display = 'block';
        authButtons.style.display = 'none';
        currentUser = userData;

        if(userData.username === 'admin'){
            adminPanel.style.display = 'block';
            loadAdminChatMessages();
            loadAdminNews();
        } else {
            adminPanel.style.display = 'none';
        }
        enableChat();
        loadMessages();
        loadNews();
    }

    function enableChat() {
        chatInput.disabled = false;
        sendBtn.disabled = false;
        chatWarning.style.display = 'none';
    }

    function disableChat() {
        chatInput.disabled = true;
        sendBtn.disabled = true;
        chatWarning.style.display = 'block';
    }

    function formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleString('pl-PL');
    }

    // Pobierz avatar użytkownika z Firestore po username
    async function getUserAvatar(username) {
        const q = query(collection(db, "users"));
        const querySnapshot = await getDocs(q);
        let avatar = null;
        querySnapshot.forEach(docSnap => {
            const data = docSnap.data();
            if(data.username === username){
                avatar = data.avatar || 'https://via.placeholder.com/32';
            }
        });
        return avatar || 'https://via.placeholder.com/32';
    }

    // --- REJESTRACJA ---
    registerForm?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = document.getElementById('register-username').value.trim();
        const email = document.getElementById('register-email').value.trim();
        const password = document.getElementById('register-password').value;

        if (!username || !email || !password) {
            alert('Proszę wypełnić wszystkie pola.');
            return;
        }

        // Sprawdź unikalność username
        const usersSnap = await getDocs(collection(db, "users"));
        if(usersSnap.docs.some(d => d.data().username === username)){
            alert('Taka nazwa użytkownika już istnieje.');
            return;
        }

        // Sprawdź unikalność email - Firebase Auth i tak nie pozwoli zduplikować email
        try {
            // Tworzymy użytkownika Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const uid = userCredential.user.uid;

            // Zapisz dodatkowe dane do Firestore
            await setDoc(doc(db, "users", uid), {
                username,
                email,
                avatar: ''
            });

            alert('Rejestracja zakończona sukcesem! Możesz się teraz zalogować.');
            registerSection.style.display = 'none';
            loginSection.style.display = 'block';

        } catch (error) {
            alert('Błąd rejestracji: ' + error.message);
        }
    });

    // --- LOGOWANIE ---
    loginForm?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;

        if (!email || !password) {
            alert('Proszę wypełnić wszystkie pola.');
            return;
        }

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const uid = userCredential.user.uid;
            const userDoc = await getDoc(doc(db, "users", uid));
            if (!userDoc.exists()) {
                alert('Brak danych użytkownika w bazie!');
                return;
            }
            const userData = userDoc.data();
            currentUser = { uid, ...userData };
            localStorage.setItem('currentUserUid', uid);  // Do odświeżania strony
            showUserPanel(currentUser);
            loginSection.style.display = 'none';
        } catch (error) {
            alert('Błąd logowania: ' + error.message);
        }
    });

    // --- WYLOGOWANIE ---
    document.getElementById('logout-btn')?.addEventListener('click', async () => {
        await signOut(auth);
        localStorage.removeItem('currentUserUid');
        location.reload();
    });

    // --- AUTOLOGOWANIE PRZY ODŚWIEŻENIU STRONY ---
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            // Pobierz dane z Firestore
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists()) {
                currentUser = { uid: user.uid, ...userDoc.data() };
                showUserPanel(currentUser);
                loginSection.style.display = 'none';
                registerSection.style.display = 'none';
            }
        } else {
            // Nie zalogowany
            currentUser = null;
            userPanel.style.display = 'none';
            authButtons.style.display = 'block';
            adminPanel.style.display = 'none';
            disableChat();
        }
    });

    // --- ZAPIS I WYŚWIETLANIE AVATARA ---
    saveAvatarBtn?.addEventListener('click', async () => {
        if (!currentUser) return;
        const url = avatarUrlInput.value.trim();
        if (!url) return;
        try {
            await updateDoc(doc(db, "users", currentUser.uid), { avatar: url });
            currentUser.avatar = url;
            avatarPreview.src = url;
            avatarUrlInput.value = '';
        } catch (error) {
            alert('Błąd zapisu avatara: ' + error.message);
        }
    });

    // --- CZAT ---

    // Załaduj wiadomości czatu z Firestore i wyświetl
    async function loadMessages() {
        messagesBox.innerHTML = '';
        const q = query(collection(db, "chatMessages"), orderBy("time"));
        const querySnapshot = await getDocs(q);

        for (const docSnap of querySnapshot.docs) {
            const msg = docSnap.data();
            const row = document.createElement('div');

            const message = document.createElement('div');
            message.className = 'chat-message';

            const avatar = document.createElement('img');
            avatar.className = 'avatar';
            avatar.src = await getUserAvatar(msg.user);

            const textNode = document.createElement('span');
            textNode.textContent = `${msg.user}: ${msg.text}`;

            message.appendChild(avatar);
            message.appendChild(textNode);

            const meta = document.createElement('div');
            meta.className = 'chat-meta';
            meta.textContent = `Dodano: ${formatTimestamp(msg.time)}`;

            row.appendChild(message);
            row.appendChild(meta);
            messagesBox.appendChild(row);
        }
        messagesBox.scrollTop = messagesBox.scrollHeight;
    }

    sendBtn.addEventListener('click', async () => {
        if (!currentUser) return;
        const text = chatInput.value.trim();
        if (!text) return;

        try {
            await addDoc(collection(db, "chatMessages"), {
                user: currentUser.username,
                text,
                time: Date.now()
            });
            chatInput.value = '';
            loadMessages();
            if(currentUser.username === 'admin'){
                loadAdminChatMessages();
            }
        } catch (error) {
            alert('Błąd wysłania wiadomości: ' + error.message);
        }
    });

    // --- PANEL ADMINA: EDYCJA I USUWANIE WIADOMOŚCI CZATU ---

    async function loadAdminChatMessages() {
        const list = document.getElementById('chat-admin-list');
        if (!list) return;
        list.innerHTML = '';

        const q = query(collection(db, "chatMessages"), orderBy("time"));
        const querySnapshot = await getDocs(q);

        for (const docSnap of querySnapshot.docs) {
            const msg = docSnap.data();
            const row = document.createElement('div');
            row.className = 'chat-admin-row';
            row.dataset.docId = docSnap.id;

            const textInput = document.createElement('input');
            textInput.type = 'text';
            textInput.value = msg.text;
            textInput.className = 'chat-admin-input';

            const userSpan = document.createElement('span');
            userSpan.textContent = msg.user;

            const timeSpan = document.createElement('span');
            timeSpan.textContent = formatTimestamp(msg.time);
            timeSpan.className = 'chat-admin-time';

            const saveBtn = document.createElement('button');
            saveBtn.textContent = 'Zapisz';
            saveBtn.addEventListener('click', async () => {
                try {
                    await updateDoc(doc(db, "chatMessages", docSnap.id), {
                        text: textInput.value
                    });
                    alert('Wiadomość zaktualizowana');
                    loadMessages();
                    loadAdminChatMessages();
                } catch (error) {
                    alert('Błąd zapisu wiadomości: ' + error.message);
                }
            });

            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Usuń';
            deleteBtn.addEventListener('click', async () => {
                if(confirm('Na pewno usunąć tę wiadomość?')){
                    try {
                        await deleteDoc(doc(db, "chatMessages", docSnap.id));
                        loadMessages();
                        loadAdminChatMessages();
                    } catch (error) {
                        alert('Błąd usuwania wiadomości: ' + error.message);
                    }
                }
            });

            row.appendChild(userSpan);
            row.appendChild(timeSpan);
            row.appendChild(textInput);
            row.appendChild(saveBtn);
            row.appendChild(deleteBtn);

            list.appendChild(row);
        }
    }

    // --- NEWSY ---

    const newsList = document.getElementById('news-list');
    const adminNewsList = document.getElementById('news-admin-list');
    const newsInput = document.getElementById('news-input');
    const newsAuthorInput = document.getElementById('news-author-input');
    const newsDateInput = document.getElementById('news-date-input');
    const newsTimeInput = document.getElementById('news-time-input');
    const addNewsBtn = document.getElementById('add-news-btn');

    // Załaduj newsy z Firestore i wyświetl
    async function loadNews() {
        if(!newsList) return;
        newsList.innerHTML = '';
        const q = query(collection(db, "news"), orderBy("time", "desc"));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach(docSnap => {
            const n = docSnap.data();
            const row = document.createElement('div');
            row.className = 'news-row';
            row.textContent = `[${formatTimestamp(n.time)}] ${n.author}: ${n.text}`;
            newsList.appendChild(row);
        });
    }

    // Załaduj newsy do panelu admina
    async function loadAdminNews() {
        if(!adminNewsList) return;
        adminNewsList.innerHTML = '';
        const q = query(collection(db, "news"), orderBy("time", "desc"));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach(docSnap => {
            const n = docSnap.data();
            const row = document.createElement('div');
            row.className = 'news-admin-row';
            row.dataset.docId = docSnap.id;

            const textInput = document.createElement('textarea');
            textInput.value = n.text;
            textInput.className = 'news-admin-textarea';

            const authorSpan = document.createElement('span');
            authorSpan.textContent = n.author;

            const timeSpan = document.createElement('span');
            timeSpan.textContent = formatTimestamp(n.time);
            timeSpan.className = 'news-admin-time';

            const saveBtn = document.createElement('button');
            saveBtn.textContent = 'Zapisz';
            saveBtn.addEventListener('click', async () => {
                try {
                    await updateDoc(doc(db, "news", docSnap.id), {
                        text: textInput.value
                    });
                    alert('Newsy zaktualizowane');
                    loadNews();
                    loadAdminNews();
                } catch (error) {
                    alert('Błąd zapisu newsów: ' + error.message);
                }
            });

            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Usuń';
            deleteBtn.addEventListener('click', async () => {
                if(confirm('Na pewno usunąć ten news?')){
                    try {
                        await deleteDoc(doc(db, "news", docSnap.id));
                        loadNews();
                        loadAdminNews();
                    } catch (error) {
                        alert('Błąd usuwania newsów: ' + error.message);
                    }
                }
            });

            row.appendChild(authorSpan);
            row.appendChild(timeSpan);
            row.appendChild(textInput);
            row.appendChild(saveBtn);
            row.appendChild(deleteBtn);

            adminNewsList.appendChild(row);
        });
    }

    // Dodaj news (tylko admin)
    addNewsBtn?.addEventListener('click', async () => {
        if(!currentUser || currentUser.username !== 'admin') {
            alert('Brak uprawnień');
            return;
        }
        const text = newsInput.value.trim();
        if(!text) return;

        try {
            await addDoc(collection(db, "news"), {
                author: currentUser.username,
                text,
                time: Date.now()
            });
            newsInput.value = '';
            loadNews();
            loadAdminNews();
        } catch (error) {
            alert('Błąd dodawania newsa: ' + error.message);
        }
    });

    // --- POKAŻ / UKRYJ FORMULARZE LOGOWANIA I REJESTRACJI ---
    document.getElementById('login-link')?.addEventListener('click', () => {
        loginSection.style.display = 'block';
        registerSection.style.display = 'none';
    });
    document.getElementById('register-link')?.addEventListener('click', () => {
        registerSection.style.display = 'block';
        loginSection.style.display = 'none';
    });

    // --- Inicjuj ---
    disableChat();
});
