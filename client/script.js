const bouquets = [
  ['Senja Merah Muda', 'Dusty Rose Sunset', 'Rp485.000', 'images/bouquet-dusty-rose.png', 'Mawar taman merah muda pudar dan ranunculus blush, dibungkus kertas krem. Sehangat senja pertama bersama.', ['Romantis', 'Hangat'], true],
  ['Salju Damai', 'Peaceful Snow', 'Rp560.000', 'images/bouquet-white-peony.png', 'Peony putih dan mawar dengan dedaunan sage. Ketenangan yang berbicara tanpa kata.', ['Tenang', 'Elegan'], false],
  ['Taman Lavender', 'Lavender Garden', 'Rp445.000', 'images/bouquet-lavender.png', 'Lavender, lisianthus ungu, dan rerumputan kering. Aroma ketenangan dalam satu genggaman.', ['Menenangkan', 'Lembut'], false],
  ['Cahaya Pagi', 'Morning Light', 'Rp510.000', 'images/bouquet-golden.png', 'Ranunculus kuning lembut dan mawar krem. Awal yang cerah untuk setiap kabar baik.', ['Ceria', 'Optimis'], true],
  ['Rahasia Anggrek', 'Orchid Secret', 'Rp725.000', 'images/bouquet-orchid.png', 'Anggrek phalaenopsis putih dalam vas keramik minimalis. Kemewahan yang bertahan berminggu-minggu.', ['Mewah', 'Berkelas'], false],
  ['Kebun Rahasia', 'Secret Garden', 'Rp595.000', 'images/bouquet-garden.png', 'Mawar blush, peony koral, astilbe putih, dan eucalyptus. Sebuah kebun yang dirangkai untukmu.', ['Romantis', 'Mewah'], true],
];

const grid = document.getElementById('bouquetGrid');
const header = document.getElementById('header');
const menuButton = document.getElementById('menuBtn');
const mobileMenu = document.getElementById('mobileMenu');
const chat = document.getElementById('chat');
const launcher = document.getElementById('launcher');
const messages = document.getElementById('messages');
const input = document.getElementById('chatInput');
const closeChatButton = document.getElementById('closeChat');
const chatForm = document.getElementById('chatForm');
const sendButton = chatForm?.querySelector('.send');
const apiUrl =
  window.location.port === '3000'
    ? '/api/chat'
    : 'http://localhost:3000/api/chat';
const conversation = [];

if (grid) {
  grid.innerHTML = bouquets
    .map(
      (bouquet) => `
        <article class="card">
          <div class="bouquet-img">
            <img src="${bouquet[3]}" alt="Buket ${bouquet[0]}">
            ${bouquet[6] ? '<span class="tag-best">Terlaris</span>' : ''}
          </div>
          <div class="card-body">
            <div class="card-top">
              <div>
                <h3>${bouquet[0]}</h3>
                <div class="name-en">${bouquet[1]}</div>
              </div>
              <div class="price">${bouquet[2]}</div>
            </div>
            <p class="desc">${bouquet[4]}</p>
            <div class="moods">${bouquet[5].map((mood) => `<span>${mood}</span>`).join('')}</div>
            <div class="card-actions">
              <button class="order-btn">Pesan sekarang</button>
              <button class="spark-btn" data-prompt='Ceritakan lebih lanjut tentang buket "${bouquet[0]}". Cocok untuk momen apa?'>✨</button>
            </div>
          </div>
        </article>
      `,
    )
    .join('');
}

if (header) {
  window.addEventListener(
    'scroll',
    () => header.classList.toggle('header-scrolled', scrollY > 24),
    { passive: true },
  );
}

if (menuButton && mobileMenu) {
  menuButton.onclick = () => mobileMenu.classList.toggle('open');
  document.querySelectorAll('#mobileMenu a').forEach((anchor) => {
    anchor.onclick = () => mobileMenu.classList.remove('open');
  });
}

if (messages) {
  const saved = JSON.parse(localStorage.getItem('bunga-cerita-chat') || '[]');
  saved.forEach((message) => {
    addBubble(message.text, message.role, false);
    conversation.push({
      role: message.role === 'user' ? 'user' : 'model',
      text: message.text,
    });
  });
}

if (launcher) {
  launcher.onclick = () => openChat();
}

if (closeChatButton) {
  closeChatButton.onclick = closeChat;
}

document.querySelectorAll('.open-assistant').forEach((button) => {
  button.onclick = () => openChat();
});

document.addEventListener('click', (event) => {
  const prompt = event.target.closest('[data-prompt]')?.dataset.prompt;
  if (prompt) {
    openChat(prompt);
  }
});

if (chatForm) {
  chatForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    await sendPrompt();
  });
}

function openChat(prompt) {
  if (!chat || !launcher || !input) return;

  chat.classList.add('open');
  launcher.style.display = 'none';

  if (prompt) {
    sendPrompt(prompt);
  }

  setTimeout(() => input.focus(), 100);
}

function closeChat() {
  if (!chat || !launcher) return;

  chat.classList.remove('open');
  launcher.style.display = 'flex';
}

function addBubble(text, role = 'bot', save = true) {
  if (!messages) return;

  const bubble = document.createElement('div');
  bubble.className = `bubble ${role === 'user' ? 'user' : 'bot'}`;
  bubble.textContent = text;
  messages.appendChild(bubble);
  messages.scrollTop = messages.scrollHeight;

  if (save) {
    const history = JSON.parse(localStorage.getItem('bunga-cerita-chat') || '[]');
    history.push({ role, text });
    localStorage.setItem('bunga-cerita-chat', JSON.stringify(history.slice(-20)));
  }
}

function addPendingBubble(text = 'Thinking...') {
  if (!messages) return null;

  const bubble = document.createElement('div');
  bubble.className = 'bubble bot';
  bubble.textContent = text;
  messages.appendChild(bubble);
  messages.scrollTop = messages.scrollHeight;
  return bubble;
}

async function sendPrompt(text) {
  if (!input) return;

  const value = (text || input.value).trim();
  if (!value) return;

  addBubble(value, 'user');
  conversation.push({ role: 'user', text: value });
  input.value = '';
  setChatDisabled(true);
  const pendingBubble = addPendingBubble();

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ conversation }),
    });
    const contentType = response.headers.get('content-type') || '';

    if (!contentType.includes('application/json')) {
      const rawResponse = await response.text();
      throw new Error(
        `Server returned non-JSON response: ${rawResponse.slice(0, 80)}`,
      );
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to get response from server');
    }

    const replyText = data.result?.trim() || 'Sorry, no response received.';

    if (pendingBubble) {
      pendingBubble.textContent = replyText;
    } else {
      addBubble(replyText, 'bot', false);
    }

    conversation.push({ role: 'model', text: replyText });
    persistConversation(replyText, 'bot');
  } catch (error) {
    const errorText = error.message === 'Failed to get response from server'
      ? error.message
      : `Terjadi error: ${error.message}`;

    if (pendingBubble) {
      pendingBubble.textContent = errorText;
    } else {
      addBubble(errorText, 'bot', false);
    }

    persistConversation(errorText, 'bot');
  } finally {
    setChatDisabled(false);
    input.focus();
  }
}

function setChatDisabled(disabled) {
  input.disabled = disabled;
  if (sendButton) {
    sendButton.disabled = disabled;
  }
}

function persistConversation(text, role) {
  const history = JSON.parse(localStorage.getItem('bunga-cerita-chat') || '[]');
  history.push({ role, text });
  localStorage.setItem('bunga-cerita-chat', JSON.stringify(history.slice(-20)));
}
