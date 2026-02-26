/* main.js — Portfolio Interactivity */

document.addEventListener('DOMContentLoaded', function () {
  initThemeToggle();
  initNavbar();
  initScrollReveal();
  initActiveNavLink();
  initGitHub();
  initChatbot();
});

/* ============================================
   1. THEME TOGGLE
   ============================================ */
function initThemeToggle() {
  var toggle = document.getElementById('theme-toggle');
  if (!toggle) return;

  var stored = localStorage.getItem('theme');
  if (stored) {
    document.documentElement.setAttribute('data-theme', stored);
  }

  toggle.addEventListener('click', function () {
    var current = document.documentElement.getAttribute('data-theme');
    var next = current === 'light' ? 'dark' : 'light';
    if (next === 'dark') {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('theme', 'light');
    }
  });
}

/* ============================================
   2. NAVBAR
   ============================================ */
function initNavbar() {
  var nav = document.getElementById('nav');
  var hamburger = document.getElementById('hamburger');
  var mobileMenu = document.getElementById('mobile-menu');
  var mobileLinks = mobileMenu ? mobileMenu.querySelectorAll('.mobile-link') : [];
  var mobileBreakpoint = window.matchMedia('(max-width: 767px)');

  // Keep the mobile menu outside nav/backdrop stacking context to avoid visual glitches.
  if (mobileMenu && mobileMenu.parentNode !== document.body) {
    document.body.appendChild(mobileMenu);
  }

  function closeMobileMenu() {
    if (!mobileMenu || !hamburger) return;
    mobileMenu.classList.remove('open');
    hamburger.classList.remove('active');
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('menu-open');
  }

  function syncMobileMenuState() {
    if (!mobileBreakpoint.matches) closeMobileMenu();
  }

  // Scroll effect
  var ticking = false;
  window.addEventListener('scroll', function () {
    if (!ticking) {
      requestAnimationFrame(function () {
        nav.classList.toggle('scrolled', window.scrollY > 0);
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

  // Hamburger toggle
  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', function () {
      var isOpen = mobileMenu.classList.toggle('open');
      hamburger.classList.toggle('active', isOpen);
      hamburger.setAttribute('aria-expanded', isOpen);
      document.body.classList.toggle('menu-open', isOpen);
    });

    // Close on link click
    mobileLinks.forEach(function (link) {
      link.addEventListener('click', function () {
        closeMobileMenu();
      });
    });

    // Close on Escape
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && mobileMenu.classList.contains('open')) {
        closeMobileMenu();
      }
    });

    window.addEventListener('resize', syncMobileMenuState);
    syncMobileMenuState();
  }
}

/* ============================================
   3. SCROLL REVEAL
   ============================================ */
function initScrollReveal() {
  var reveals = document.querySelectorAll('.reveal');
  if (!reveals.length || !('IntersectionObserver' in window)) {
    reveals.forEach(function (el) { el.classList.add('active'); });
    return;
  }

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  reveals.forEach(function (el) { observer.observe(el); });
}

/* ============================================
   4. ACTIVE NAV LINK
   ============================================ */
function initActiveNavLink() {
  var sections = document.querySelectorAll('main .section, .hero');
  var navLinks = document.querySelectorAll('.nav-link');
  if (!sections.length || !navLinks.length) return;

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        var id = entry.target.getAttribute('id');
        navLinks.forEach(function (link) {
          link.classList.toggle('active', link.getAttribute('href') === '#' + id);
        });
      }
    });
  }, { rootMargin: '-20% 0px -70% 0px' });

  sections.forEach(function (section) { observer.observe(section); });
}

/* ============================================
   5. GITHUB API
   ============================================ */
var GITHUB_USERNAME = 'mohd-musheer';
var GITHUB_CACHE_KEY = 'gh_repos';
var GITHUB_CACHE_TTL = 30 * 60 * 1000; // 30 minutes

var HIDDEN_REPOS = [
  'githubtest', 'Githubtest', 'Githubtest2', 'githubtest2',
  'Temp', 'temp', 'Skills-Copilot-Codespaces-Vscode',
  'skills-copilot-codespaces-vscode', 'mohd-musheer.github.io',
  'Mohd-Musheer.github.io', 'LLM-Started', 'LLM-Internship-Data',
  'LLM-Internship-data', '3Games', 'BG-Removerak', 'BGRemoveral',
  'BackendChat', 'MultiplayerRockPaperScissor', 'TicTacToe',
  'LiveTicTacToe', 'TicTacToeOnline4x4', 'KingOfDiamond',
  'TypingClubKids', 'CurrencyConverter', 'MyAPI'
];

var LANG_COLORS = {
  'Python': '#3572A5', 'C++': '#f34b7d', 'R': '#198CE7',
  'JavaScript': '#f1e05a', 'Jupyter Notebook': '#DA5B0B',
  'HTML': '#e34c26', 'CSS': '#563d7c', 'Shell': '#89e051',
  'TypeScript': '#3178c6', 'C': '#555555', 'Dockerfile': '#384d54'
};

function initGitHub() {
  var container = document.getElementById('github-repos');
  var fallback = document.getElementById('github-fallback');
  if (!container) return;

  var cached = getCache();
  if (cached) {
    renderRepos(container, cached);
    return;
  }

  fetch('https://api.github.com/users/' + GITHUB_USERNAME + '/repos?per_page=100&sort=updated', {
    headers: { 'Accept': 'application/vnd.github.v3+json' }
  })
    .then(function (res) {
      if (!res.ok) throw new Error(res.status);
      return res.json();
    })
    .then(function (repos) {
      setCache(repos);
      renderRepos(container, repos);
    })
    .catch(function () {
      container.innerHTML = '';
      if (fallback) fallback.hidden = false;
    });
}

function renderRepos(container, repos) {
  var hiddenSet = {};
  HIDDEN_REPOS.forEach(function (r) { hiddenSet[r.toLowerCase()] = true; });

  var filtered = repos.filter(function (r) {
    return !r.fork && !hiddenSet[r.name.toLowerCase()];
  });

  var shown = filtered.slice(0, 8);
  container.innerHTML = shown.map(function (repo) {
    var lang = repo.language || '';
    var color = LANG_COLORS[lang] || '#636363';
    var desc = repo.description || 'No description provided.';
    if (desc.length > 100) desc = desc.substring(0, 97) + '...';
    var stars = repo.stargazers_count || 0;
    var updated = timeAgo(repo.updated_at);

    return '<a href="' + repo.html_url + '" target="_blank" rel="noopener" class="repo-card">' +
      '<span class="repo-name">' + sanitize(repo.name) + '</span>' +
      '<p class="repo-desc">' + sanitize(desc) + '</p>' +
      '<div class="repo-meta">' +
        (lang ? '<span class="repo-meta-item"><span class="repo-lang-dot" style="background:' + color + '"></span> ' + sanitize(lang) + '</span>' : '') +
        (stars > 0 ? '<span class="repo-meta-item">&#9733; ' + stars + '</span>' : '') +
        '<span class="repo-meta-item">' + updated + '</span>' +
      '</div>' +
    '</a>';
  }).join('');
}

function getCache() {
  try {
    var item = localStorage.getItem(GITHUB_CACHE_KEY);
    if (!item) return null;
    var parsed = JSON.parse(item);
    if (Date.now() - parsed.timestamp > GITHUB_CACHE_TTL) {
      localStorage.removeItem(GITHUB_CACHE_KEY);
      return null;
    }
    return parsed.data;
  } catch (e) { return null; }
}

function setCache(data) {
  try {
    localStorage.setItem(GITHUB_CACHE_KEY, JSON.stringify({ data: data, timestamp: Date.now() }));
  } catch (e) { /* storage full */ }
}

function sanitize(str) {
  var el = document.createElement('div');
  el.textContent = str;
  return el.innerHTML;
}

function timeAgo(dateStr) {
  var seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  var intervals = [
    [31536000, 'year'], [2592000, 'month'], [86400, 'day'],
    [3600, 'hour'], [60, 'minute']
  ];
  for (var i = 0; i < intervals.length; i++) {
    var count = Math.floor(seconds / intervals[i][0]);
    if (count >= 1) return count + ' ' + intervals[i][1] + (count > 1 ? 's' : '') + ' ago';
  }
  return 'just now';
}

/* ============================================
   6. AI CHATBOT
   ============================================
   Lightweight keyword-matching chatbot.
   To replace with a real LLM API later, swap
   the getResponse() function body with a fetch
   call to your endpoint. The UI stays the same.
   ============================================ */
function initChatbot() {
  var toggle = document.getElementById('chatbot-toggle');
  var window_ = document.getElementById('chatbot-window');
  var close = document.getElementById('chatbot-close');
  var input = document.getElementById('chatbot-input');
  var sendBtn = document.getElementById('chatbot-send');
  var messages = document.getElementById('chatbot-messages');
  if (!toggle || !window_ || !messages) return;

  // Toggle window
  toggle.addEventListener('click', function () {
    window_.classList.toggle('open');
    if (window_.classList.contains('open')) {
      toggle.classList.add('hidden');
      input.focus();
    }
  });

  close.addEventListener('click', function () {
    window_.classList.remove('open');
    toggle.classList.remove('hidden');
  });

  // Send on button or Enter
  sendBtn.addEventListener('click', sendMessage);
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') sendMessage();
  });

  // Quick action buttons
  messages.addEventListener('click', function (e) {
    var btn = e.target.closest('.chatbot-quick-btn');
    if (btn) {
      var query = btn.getAttribute('data-query');
      if (query) {
        input.value = query;
        sendMessage();
      }
    }
  });

  function sendMessage() {
    var text = input.value.trim();
    if (!text) return;
    appendMsg(text, 'user');
    input.value = '';
    showTyping();
    setTimeout(function () {
      removeTyping();
      appendMsg(getResponse(text), 'bot');
      messages.scrollTop = messages.scrollHeight;
    }, 600 + Math.random() * 400);
  }

  function appendMsg(text, sender) {
    var div = document.createElement('div');
    div.className = 'chatbot-msg chatbot-msg-' + sender;
    div.textContent = text;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }

  function showTyping() {
    var div = document.createElement('div');
    div.className = 'chatbot-msg chatbot-msg-bot chatbot-msg-typing';
    div.id = 'chatbot-typing';
    div.innerHTML = '<div class="typing-dots"><span></span><span></span><span></span></div>';
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }

  function removeTyping() {
    var el = document.getElementById('chatbot-typing');
    if (el) el.remove();
  }
}

/* ========================================
   Chatbot Knowledge Base
   Replace this function with an API call
   to upgrade to a real LLM backend.
   ======================================== */
var CHATBOT_KB = [
  {
    keys: ['vectorforge', 'framework', 'c++ ml', 'blas', 'lapack', 'openmp'],
    reply: 'VectorForgeML is Musheer\'s flagship project: a production-grade ML framework built from scratch in C++ with BLAS/LAPACK acceleration, OpenMP parallelism, 9+ algorithms, and zero-copy R integration via Rcpp.'
  },
  {
    keys: ['skill', 'tech', 'language', 'tool', 'stack'],
    reply: 'Musheer works with Python, C++, R, JavaScript, and SQL. His ML stack includes PyTorch, Scikit-learn, Transformers, TF-IDF, and ensemble methods. For deployment: FastAPI, Docker, CI/CD, and Google Cloud.'
  },
  {
    keys: ['intern', 'future interns', 'experience', 'work'],
    reply: 'Musheer completed a Machine Learning internship at Future Interns in January 2026, delivering AI Resume Ranking, Support Ticket Classification, and Sales Demand Forecasting projects, and received a Letter of Recommendation.'
  },
  {
    keys: ['research', 'paper', 'publish', 'publication'],
    reply: 'Musheer authored the published paper "VectorForgeML: A Production-Grade Machine Learning Framework in C++", covering modular design, BLAS/LAPACK acceleration, OpenMP parallelism, and zero-copy Rcpp integration.'
  },
  {
    keys: ['project', 'portfolio', 'built'],
    reply: 'Musheer has built 25+ ML/AI projects spanning NLP, computer vision, healthcare AI, and predictive analytics. The flagship is VectorForgeML, focused on systems-level ML performance and production readiness.'
  },
  {
    keys: ['education', 'college', 'university', 'degree', 'study'],
    reply: 'Musheer is pursuing a BCA at Sant Gadge Baba Amravati University, Maharashtra, India, with expected graduation in May 2026.'
  },
  {
    keys: ['contact', 'email', 'reach', 'hire'],
    reply: 'You can reach Musheer at musheerayan@gmail.com. He is also active on GitHub (mohd-musheer), LinkedIn (mohdmusheer), and Kaggle (almusheer).'
  },
  {
    keys: ['hello', 'hi', 'hey'],
    reply: 'Hi, I\'m Musheer AI. Ask me about skills, VectorForgeML, internship work, or research.'
  }
];

var CHATBOT_DEFAULT_REPLY = 'I can help with Musheer\'s skills, VectorForgeML, internship experience, research, and major projects. What would you like to explore?';

function getResponse(query) {
  var q = query.toLowerCase();
  for (var i = 0; i < CHATBOT_KB.length; i++) {
    if (matchesAny(q, CHATBOT_KB[i].keys)) {
      return CHATBOT_KB[i].reply;
    }
  }
  return CHATBOT_DEFAULT_REPLY;
}

function matchesAny(text, keys) {
  for (var i = 0; i < keys.length; i++) {
    if (text.indexOf(keys[i]) !== -1) return true;
  }
  return false;
}
