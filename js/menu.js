// ============================================================
// Amuche's Oven — Menu Page (menu.js)
// Fetches all available cakes, handles filter tabs,
// search, sort, URL params and WhatsApp CTA
// ============================================================

import { fetchSettingsMap, fetchAvailableCakes } from './data-access.js';
import {
  formatCurrency, whatsappLink, generateRef,
  buildWhatsAppOrderMessage, toast, hidePageLoader,
  $, $$
} from './utils.js';
import { addToCart, updateCartUI } from './cart.js';

// ── State ─────────────────────────────────────────────────────
let allCakes   = [];
let activeCategory = 'all';
let searchQuery    = '';
let sortBy         = 'display_order';

document.addEventListener('DOMContentLoaded', async () => {
  hidePageLoader();
  updateCartUI();
  document.body.classList.add('loaded');
  readUrlParams();
  await Promise.all([loadCakes(), loadFooterSettings()]);
  initFilters();
  initSearch();
  initSort();
  initScrollTop();
  initScrollReveal();
});

// ── URL Param Reading ─────────────────────────────────────────
function readUrlParams() {
  const params = new URLSearchParams(window.location.search);
  const cat    = params.get('cat');
  if (cat) activeCategory = cat;
}

// ── Load All Cakes ────────────────────────────────────────────
async function loadCakes() {
  try {
    allCakes = await fetchAvailableCakes();
    renderCakes();

    // Activate any URL-specified tab button
    if (activeCategory !== 'all') {
      const tab = document.querySelector(`.filter-tab[data-cat="${activeCategory}"]`);
      if (tab) {
        $$('.filter-tab').forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected','false'); });
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');
      }
    }

  } catch (err) {
    console.error('Load cakes error:', err);
    allCakes = [];
    renderCakes();
  }
}

// ── Render Cakes ──────────────────────────────────────────────
function renderCakes() {
  const grid        = document.getElementById('cakes-grid');
  const resultCount = document.getElementById('results-count');
  if (!grid) return;

  let filtered = allCakes.filter(c => {
    const matchCat    = activeCategory === 'all' || c.category === activeCategory;
    const matchSearch = !searchQuery   ||
      c.name.toLowerCase().includes(searchQuery)        ||
      (c.description || '').toLowerCase().includes(searchQuery) ||
      c.category.toLowerCase().includes(searchQuery);
    return matchCat && matchSearch;
  });

  // Sort
  filtered = sortCakes(filtered, sortBy);

  if (resultCount) {
    resultCount.textContent = filtered.length
      ? `Showing ${filtered.length} cake${filtered.length !== 1 ? 's' : ''}`
      : '';
  }

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="no-results" style="grid-column:1/-1">
        <i class="fas fa-cake-candles"></i>
        <h3>No cakes found</h3>
        <p>${searchQuery ? `No results for "${searchQuery}". Try a different search.` : 'No cakes in this category yet — check back soon!'}</p>
        <button class="btn btn--outline" style="margin-top:var(--sp-4)" onclick="window.location.href='./menu.html'">
          <i class="fas fa-refresh"></i> Clear Filters
        </button>
      </div>`;
    return;
  }

  grid.innerHTML = filtered.map(cake => renderCakeCard(cake)).join('');
  bindCardEvents(grid);
  initScrollReveal();
}

function sortCakes(cakes, method) {
  const c = [...cakes];
  switch (method) {
    case 'price-asc':
      return c.sort((a,b) => minPrice(a) - minPrice(b));
    case 'price-desc':
      return c.sort((a,b) => minPrice(b) - minPrice(a));
    case 'name-asc':
      return c.sort((a,b) => a.name.localeCompare(b.name));
    default:
      return c; // display_order from DB
  }
}

function minPrice(cake) {
  const variants = cake.cake_variants?.filter(v => v.is_available) || [];
  return variants.length
    ? Math.min(...variants.map(v => v.price))
    : cake.base_price;
}

// ── Cake Card HTML ────────────────────────────────────────────
function renderCakeCard(cake) {
  const primaryImg = cake.cake_images
    ?.sort((a,b) => a.display_order - b.display_order)
    .find(i => i.is_primary) || cake.cake_images?.[0];

  const imgUrl = primaryImg?.public_url ||
    'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&q=80&auto=format&fit=crop';

  const availableVariants = cake.cake_variants?.filter(v => v.is_available) || [];
  const lowestPrice = minPrice(cake);
  const flavors = [...new Set(availableVariants.map(v => v.flavor).filter(Boolean))].slice(0, 3);
  const catLabel = cake.category.charAt(0).toUpperCase() + cake.category.slice(1);
  const leadText = cake.min_order_days === 1
    ? '1 day notice'
    : `${cake.min_order_days}+ days notice`;

  return `
    <article class="cake-card reveal-item"
      data-id="${cake.id}"
      data-slug="${cake.slug}"
      role="article"
      tabindex="0"
      aria-label="View ${cake.name}"
    >
      <div class="cake-card-image">
        <img
          src="${imgUrl}"
          alt="${cake.name}"
          loading="lazy"
          decoding="async"
          width="400" height="300"
        />
        <div class="cake-card-badge">${catLabel}</div>
        ${cake.is_featured ? `<div class="cake-card-featured" title="Featured"><i class="fas fa-star"></i></div>` : ''}
      </div>
      <div class="cake-card-body">
        <div class="cake-card-category">${catLabel}</div>
        <h3 class="cake-card-name">${cake.name}</h3>
        <p class="cake-card-desc">${cake.description || ''}</p>
        ${flavors.length ? `
          <div class="cake-card-flavors">
            ${flavors.map(f => `<span class="cake-flavor-chip">${f}</span>`).join('')}
            ${availableVariants.length > flavors.length
              ? `<span class="cake-flavor-chip">+${availableVariants.length - flavors.length} more</span>`
              : ''}
          </div>` : ''}
        <div class="cake-card-footer">
          <div>
            <div class="cake-price-from">From</div>
            <div class="cake-price">${formatCurrency(lowestPrice)}</div>
          </div>
          <a
            href="./cake.html?slug=${cake.slug}"
            class="btn btn--primary btn--sm"
            onclick="event.stopPropagation()"
            aria-label="View and order ${cake.name}"
          >
            View &amp; Order <i class="fas fa-arrow-right"></i>
          </a>
        </div>
        <div class="cake-lead-time">
          <i class="fas fa-clock"></i> ${leadText} required
        </div>
      </div>
    </article>`;
}

function bindCardEvents(grid) {
  grid.querySelectorAll('.cake-card').forEach(card => {
    const slug = card.dataset.slug;
    card.addEventListener('click', e => {
      if (e.target.closest('a, button')) return;
      window.location.href = `./cake.html?slug=${slug}`;
    });
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        window.location.href = `./cake.html?slug=${slug}`;
      }
    });
  });
}

// ── Filter Tabs ───────────────────────────────────────────────
function initFilters() {
  const tabs = $$('.filter-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected','false'); });
      tab.classList.add('active');
      tab.setAttribute('aria-selected','true');
      activeCategory = tab.dataset.cat;
      renderCakes();
      // Smooth scroll to grid on mobile
      if (window.innerWidth < 768) {
        document.getElementById('cakes-grid')
          ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

// ── Search ────────────────────────────────────────────────────
function initSearch() {
  const input = document.getElementById('cake-search');
  if (!input) return;
  let debounceTimer;
  input.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      searchQuery = input.value.trim().toLowerCase();
      renderCakes();
    }, 280);
  });
  input.addEventListener('search', () => {
    if (!input.value) { searchQuery = ''; renderCakes(); }
  });
}

// ── Sort ──────────────────────────────────────────────────────
function initSort() {
  const sel = document.getElementById('sort-select');
  if (!sel) return;
  sel.addEventListener('change', () => {
    sortBy = sel.value;
    renderCakes();
  });
}

// ── Footer Settings ───────────────────────────────────────────
async function loadFooterSettings() {
  const settings = await fetchSettingsMap();
  applyFooterSettings(settings);
}

function applyFooterSettings(s) {
  const phone = s.business_phone || '+254700000000';
  const email = s.business_email || 'hello@amuchesoven.co.ke';
  const hours = s.business_hours || '8AM – 8PM (Mon–Sat)';

  const fPhone = document.getElementById('footer-phone');
  const fEmail = document.getElementById('footer-email');
  const fHours = document.getElementById('footer-hours');
  const fYear  = document.getElementById('footer-year');

  if (fPhone) { fPhone.textContent = phone; fPhone.href = `tel:${phone}`; }
  if (fEmail) { fEmail.textContent = email; fEmail.href = `mailto:${email}`; }
  if (fHours) fHours.textContent = hours;
  if (fYear)  fYear.textContent  = new Date().getFullYear();

  const waGreeting = `Hello Amuche's Oven! 👋 I'd like to enquire about ordering a cake.`;
  const waHref = whatsappLink(phone, waGreeting);
  document.getElementById('menu-whatsapp-btn')?.setAttribute('href', waHref);
  document.getElementById('footer-whatsapp-social')?.setAttribute('href', waHref);
}

// ── Scroll Reveal ─────────────────────────────────────────────
function initScrollReveal() {
  const items = document.querySelectorAll('.reveal-item');
  if (!items.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (!entry.isIntersecting) return;
      setTimeout(() => {
        entry.target.style.opacity   = '1';
        entry.target.style.transform = 'translateY(0)';
      }, (i % 3) * 80);
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.08 });

  items.forEach(el => {
    el.style.opacity    = '0';
    el.style.transform  = 'translateY(18px)';
    el.style.transition = 'opacity 0.45s ease, transform 0.45s ease';
    observer.observe(el);
  });
}

// ── Scroll Top ────────────────────────────────────────────────
function initScrollTop() {
  const btn = document.getElementById('scroll-top');
  if (!btn) return;
  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 500);
  }, { passive: true });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}
