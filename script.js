document.addEventListener('DOMContentLoaded', function () {
    let users = JSON.parse(localStorage.getItem('users')) || [];
    if (!users.find(u => u.username === 'admin')) {
        users.push({ username: 'admin', email: 'admin@example.com', password: 'admin', avatar: '' });
        localStorage.setItem('users', JSON.stringify(users));
    }

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

    let currentUser = localStorage.getItem('currentUser') || null;

    if (currentUser) {
        showUserPanel(currentUser);
        if (currentUser === 'admin') {
            adminPanel.style.display = 'block';
            updateAdminChatMessages();
        }
        enableChat();
    } else {
        disableChat();
    }

    // Logowanie
    loginForm?.addEventListener('submit', function (e) {
        e.preventDefault();
        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value;
        const users = JSON.parse(localStorage.getItem('users')) || [];
        const user = users.find(u => u.username === username && u.password === password);
        if (user) {
            localStorage.setItem('currentUser', user.username);
            location.reload();
        } else {
            alert('Nieprawidłowa nazwa użytkownika lub hasło!');
        }
    });

    // Rejestracja
    registerForm?.addEventListener('submit', function (e) {
        e.preventDefault();
        const username = document.getElementById('register-username').value.trim();
        const email = document.getElementById('register-email').value.trim();
        const password = document.getElementById('register-password').value;
        let users = JSON.parse(localStorage.getItem('users')) || [];

        if (users.some(u => u.username === username)) {
            alert('Taka nazwa użytkownika już istnieje.');
            return;
        }

        if (users.some(u => u.email === email)) {
            alert('Ten email jest już zarejestrowany.');
            return;
        }

        users.push({ username, email, password, avatar: '' });
        localStorage.setItem('users', JSON.stringify(users));
        alert('Rejestracja zakończona sukcesem! Możesz się teraz zalogować.');
        registerSection.style.display = 'none';
    });

    // Pokaż / ukryj formularze
    document.getElementById('login-link')?.addEventListener('click', () => {
        loginSection.style.display = loginSection.style.display === 'none' ? 'block' : 'none';
        registerSection.style.display = 'none';
    });

    document.getElementById('register-link')?.addEventListener('click', () => {
        registerSection.style.display = registerSection.style.display === 'none' ? 'block' : 'none';
        loginSection.style.display = 'none';
    });

    document.getElementById('cancel-login')?.addEventListener('click', () => {
        loginSection.style.display = 'none';
    });

    document.getElementById('cancel-register')?.addEventListener('click', () => {
        registerSection.style.display = 'none';
    });

    document.getElementById('close-admin')?.addEventListener('click', () => {
        adminPanel.style.display = 'none';
    });

    document.getElementById('logout-btn')?.addEventListener('click', () => {
        localStorage.removeItem('currentUser');
        location.reload();
    });

    function showUserPanel(username) {
        const users = JSON.parse(localStorage.getItem('users')) || [];
        const user = users.find(u => u.username === username);
        document.getElementById('user-name-display').textContent = username;
        userPanel.style.display = 'block';
        authButtons.style.display = 'none';
        document.getElementById('avatar-preview').src = user?.avatar || 'https://via.placeholder.com/80';
    }

    document.getElementById('save-avatar')?.addEventListener('click', () => {
        const url = document.getElementById('avatar-url').value.trim();
        if (!currentUser || !url) return;
        let users = JSON.parse(localStorage.getItem('users')) || [];
        const user = users.find(u => u.username === currentUser);
        if (user) {
            user.avatar = url;
            localStorage.setItem('users', JSON.stringify(users));
            showUserPanel(currentUser);
        }
    });

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

    function getUserAvatar(username) {
        const users = JSON.parse(localStorage.getItem('users')) || [];
        const user = users.find(u => u.username === username);
        return user?.avatar || 'https://via.placeholder.com/32';
    }

    function formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleString('pl-PL');
    }

    function loadMessages() {
        const messages = JSON.parse(localStorage.getItem('chatMessages')) || [];
        messagesBox.innerHTML = '';
        messages.forEach(({ user, text, time }) => {
            const row = document.createElement('div');

            const message = document.createElement('div');
            message.className = 'chat-message';

            const avatar = document.createElement('img');
            avatar.src = getUserAvatar(user);
            avatar.className = 'avatar';

            const textNode = document.createElement('span');
            textNode.textContent = `${user}: ${text}`;

            message.appendChild(avatar);
            message.appendChild(textNode);

            const meta = document.createElement('div');
            meta.className = 'chat-meta';
            meta.textContent = `Dodano: ${formatTimestamp(time)}`;

            row.appendChild(message);
            row.appendChild(meta);
            messagesBox.appendChild(row);
        });
    }

    sendBtn.addEventListener('click', () => {
        const text = chatInput.value.trim();
        if (currentUser && text) {
            const messages = JSON.parse(localStorage.getItem('chatMessages')) || [];
            messages.push({ user: currentUser, text, time: Date.now() });
            localStorage.setItem('chatMessages', JSON.stringify(messages));
            chatInput.value = '';
            loadMessages();
            updateAdminChatMessages();
        }
    });

    function updateAdminChatMessages() {
        const list = document.getElementById('chat-admin-list');
        if (!list) return;
        list.innerHTML = '';
        const messages = JSON.parse(localStorage.getItem('chatMessages')) || [];

        messages.forEach((msg, index) => {
            const li = document.createElement('li');
            const span = document.createElement('span');
            span.textContent = `${msg.user}: ${msg.text} (${formatTimestamp(msg.time)})`;

            const editBtn = document.createElement('button');
            editBtn.textContent = '✏️';
            editBtn.addEventListener('click', () => {
                const newText = prompt('Nowa treść wiadomości:', msg.text);
                if (newText !== null && newText.trim() !== '') {
                    messages[index].text = newText.trim();
                    localStorage.setItem('chatMessages', JSON.stringify(messages));
                    loadMessages();
                    updateAdminChatMessages();
                }
            });

            const delBtn = document.createElement('button');
            delBtn.textContent = '🗑️';
            delBtn.addEventListener('click', () => {
                messages.splice(index, 1);
                localStorage.setItem('chatMessages', JSON.stringify(messages));
                loadMessages();
                updateAdminChatMessages();
            });

            li.appendChild(span);
            li.appendChild(editBtn);
            li.appendChild(delBtn);
            list.appendChild(li);
        });
    }

    function loadNews() {
        const news = JSON.parse(localStorage.getItem('news')) || [];
        const newsContainer = document.getElementById('news');
        newsContainer.innerHTML = '';

        news.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = 'news-item';
            div.innerHTML = `
                <h3>${item.title}</h3>
                <p>${item.content}</p>
                <p class="news-meta">Dodano przez: ${item.author} dnia ${formatTimestamp(item.time)}</p>
                ${currentUser === 'admin' ? `<button class="delete-news" data-index="${index}">Usuń wiadomość</button>` : ''}
            `;
            newsContainer.appendChild(div);
        });

        document.querySelectorAll('.delete-news').forEach(btn => {
            btn.addEventListener('click', () => {
                const index = btn.getAttribute('data-index');
                const news = JSON.parse(localStorage.getItem('news')) || [];
                news.splice(index, 1);
                localStorage.setItem('news', JSON.stringify(news));
                loadNews();
            });
        });
    }

    document.getElementById('news-form')?.addEventListener('submit', function (e) {
        e.preventDefault();
        const title = document.getElementById('news-title').value.trim();
        const content = document.getElementById('news-content').value.trim();
        const news = JSON.parse(localStorage.getItem('news')) || [];
        news.push({ title, content, author: currentUser, time: Date.now() });
        localStorage.setItem('news', JSON.stringify(news));
        document.getElementById('news-title').value = '';
        document.getElementById('news-content').value = '';
        loadNews();
    });

    loadMessages();
    loadNews();
});
