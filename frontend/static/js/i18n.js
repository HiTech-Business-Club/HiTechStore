const I18N = {
  currentLang: 'fr',
  translations: {},
  supportedLangs: ['fr', 'en', 'ar'],

  async init() {
    const saved = localStorage.getItem('lang');
    const browserLang = navigator.language?.substring(0, 2);
    const lang = saved || (this.supportedLangs.includes(browserLang) ? browserLang : 'fr');
    await this.setLang(lang);
  },

  async loadLang(lang) {
    if (this.translations[lang]) return this.translations[lang];
    try {
      const res = await fetch(`/static/i18n/${lang}.json`);
      this.translations[lang] = await res.json();
      return this.translations[lang];
    } catch (e) {
      console.error('Failed to load language:', lang, e);
      return {};
    }
  },

  async setLang(lang) {
    if (!this.supportedLangs.includes(lang)) lang = 'fr';
    this.currentLang = lang;
    localStorage.setItem('lang', lang);
    this.translations[lang] = await this.loadLang(lang);
    this.applyTranslations();
    this.applyDirection(lang);
    this.updateLangSwitcher(lang);
  },

  t(key) {
    return this.translations[this.currentLang]?.[key] || key;
  },

  applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const text = this.t(key);
      if (text !== key) {
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
          el.placeholder = text;
        } else {
          el.textContent = text;
        }
      }
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      const text = this.t(key);
      if (text !== key) el.placeholder = text;
    });
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      const text = this.t(key);
      if (text !== key) el.title = text;
    });
  },

  applyDirection(lang) {
    const html = document.documentElement;
    if (lang === 'ar') {
      html.setAttribute('dir', 'rtl');
      html.setAttribute('lang', 'ar');
      html.style.fontFamily = "'Tajawal', 'Inter', sans-serif";
    } else {
      html.setAttribute('dir', 'ltr');
      html.setAttribute('lang', lang);
      html.style.fontFamily = "'Inter', -apple-system, sans-serif";
    }
  },

  updateLangSwitcher(lang) {
    const btn = document.getElementById('langCurrent');
    if (btn) {
      const labels = { fr: 'FR', en: 'EN', ar: 'AR' };
      btn.textContent = labels[lang] || 'FR';
    }
    document.querySelectorAll('.lang-option').forEach(el => {
      el.classList.toggle('active', el.dataset.lang === lang);
    });
  },

  createSwitcher() {
    const langs = [
      { code: 'fr', label: 'Français', flag: '🇫🇷' },
      { code: 'en', label: 'English', flag: '🇬🇧' },
      { code: 'ar', label: 'العربية', flag: '🇹🇳' },
    ];
    return `
      <div class="dropdown">
        <button class="btn btn-glass btn-sm dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
          <i class="bi bi-globe2"></i> <span id="langCurrent">FR</span>
        </button>
        <ul class="dropdown-menu dropdown-menu-end glass-dropdown">
          ${langs.map(l => `<li><a class="dropdown-item lang-option" href="#" data-lang="${l.code}" onclick="I18N.setLang('${l.code}');return false">${l.flag} ${l.label}</a></li>`).join('')}
        </ul>
      </div>`;
  }
};

// Initialize on load
document.addEventListener('DOMContentLoaded', () => I18N.init());

// Helper for JS code
function t(key) { return I18N.t(key); }
