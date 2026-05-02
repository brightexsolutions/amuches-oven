// ============================================================
// Amuche's Oven — Homepage Logic (home.js)
// Loads featured cakes, business settings, WhatsApp links,
// counter animations, contact form, scroll-to-top
// ============================================================

import {
  fetchBusinessPhone,
  fetchSettingsMap,
  fetchFeaturedCakes,
} from './data-access.js';
import {
  formatCurrency, whatsappLink,
  toast, setButtonLoading, hidePageLoader
} from './utils.js';
import { addToCart, updateCartUI } from './cart.js';

document.addEventListener('DOMContentLoaded', async () => {
  hidePageLoader();
  updateCartUI();
  document.body.classList.add('loaded'); // CSS fallback to hide loader

  await Promise.all([
    loadSettings(),
    loadFeaturedCakes(),
  ]);

  initCounterAnimation();
  initScrollTop();
  initContactForm();
  initScrollReveal();
});

// ── Settings ─────────────────────────────────────────────────

async function loadSettings() {
  const settings = await fetchSettingsMap();
  applySettings(settings);
}

function applySettings(s) {
  const phone   = s.business_phone   || '+254700000000';
  const email   = s.business_email   || 'hello@amuchesoven.co.ke';
  const hours   = s.business_hours   || '8AM – 8PM (Mon–Sat)';
  const address = s.business_address || 'Nairobi, Kenya';
  const ig      = s.instagram_url    || '#';
  const fb      = s.facebook_url     || '#';

    // Contact section
    const phoneLinkEl = document.getElementById('contact-phone-link');
    const emailLinkEl = document.getElementById('contact-email-link');
    const hoursEl     = document.getElementById('contact-hours');
    const addressEl   = document.getElementById('contact-address');

    if (phoneLinkEl) { phoneLinkEl.textContent = phone; phoneLinkEl.href = `tel:${phone}`; }
    if (emailLinkEl) { emailLinkEl.textContent = email; emailLinkEl.href = `mailto:${email}`; }
    if (hoursEl)     hoursEl.textContent   = hours;
    if (addressEl)   addressEl.textContent = address;

    // Footer
    const fPhone   = document.getElementById('footer-phone');
    const fEmail   = document.getElementById('footer-email');
    const fHours   = document.getElementById('footer-hours');
    const fAddress = document.getElementById('footer-address');
    const fYear    = document.getElementById('footer-year');

    if (fPhone)   { fPhone.textContent = phone; fPhone.href = `tel:${phone}`; }
    if (fEmail)   { fEmail.textContent = email; fEmail.href = `mailto:${email}`; }
    if (fHours)   fHours.textContent   = hours;
    if (fAddress) fAddress.textContent = address;
    if (fYear)    fYear.textContent    = new Date().getFullYear();

    // Social links
    const igLink = document.getElementById('footer-instagram');
    const fbLink = document.getElementById('footer-facebook');
    if (igLink && ig !== '#') igLink.href = ig;
    if (fbLink && fb !== '#') fbLink.href = fb;

    // WhatsApp links
    const waGreeting = `Hello Amuche's Oven! 👋 I'd like to enquire about ordering a cake. Can you help me?`;
    const waHref = whatsappLink(phone, waGreeting);

    document.getElementById('home-whatsapp-btn')?.setAttribute('href', waHref);
    document.getElementById('custom-whatsapp-btn')?.setAttribute('href', waHref);
    document.getElementById('footer-whatsapp-social')?.setAttribute('href', waHref);
}

// ── Featured Cakes ───────────────────────────────────────────

async function loadFeaturedCakes() {
  const grid = document.getElementById('featured-grid');
  if (!grid) return;

  try {
    const cakes = await fetchFeaturedCakes(3);

    if (!cakes || cakes.length === 0) {
      grid.innerHTML = `
        <div class="no-results" style="grid-column:1/-1">
          <i class="fas fa-cake-candles"></i>
          <h3>Cakes coming soon</h3>
          <p>Check back shortly — we're adding to our menu.</p>
        </div>`;
      return;
    }

    grid.innerHTML = cakes.map(cake => renderCakeCard(cake)).join('');
    bindCakeCardEvents(grid);

  } catch (err) {
    console.error('Featured cakes error:', err);
    grid.innerHTML = '';
  }
}

function renderCakeCard(cake) {
  const primaryImg = cake.cake_images
    ?.sort((a, b) => a.display_order - b.display_order)
    .find(i => i.is_primary) || cake.cake_images?.[0];

  const imgUrl = primaryImg?.public_url ||
    'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&q=80&auto=format&fit=crop';

  const availableVariants = cake.cake_variants?.filter(v => v.is_available) || [];
  const lowestPrice = availableVariants.length
    ? Math.min(...availableVariants.map(v => v.price))
    : cake.base_price;

  const flavors  = [...new Set(availableVariants.map(v => v.flavor).filter(Boolean))].slice(0, 3);
  const catLabel = cake.category.charAt(0).toUpperCase() + cake.category.slice(1);

  return `
    <article class="cake-card" data-id="${cake.id}" data-slug="${cake.slug}" role="button" tabindex="0" aria-label="View ${cake.name}">
      <div class="cake-card-image">
        <img
          src="${imgUrl}"
          alt="${cake.name}"
          loading="lazy"
          decoding="async"
          width="400" height="300"
        />
        <div class="cake-card-badge">${catLabel}</div>
        <div class="cake-card-featured" title="Featured">
          <i class="fas fa-star"></i>
        </div>
      </div>
      <div class="cake-card-body">
        <div class="cake-card-category">${catLabel}</div>
        <h3 class="cake-card-name">${cake.name}</h3>
        <p class="cake-card-desc">${cake.description || ''}</p>
        ${flavors.length ? `
          <div class="cake-card-flavors">
            ${flavors.map(f => `<span class="cake-flavor-chip">${f}</span>`).join('')}
            ${availableVariants.length > flavors.length ? `<span class="cake-flavor-chip">+${availableVariants.length - flavors.length} more</span>` : ''}
          </div>` : ''}
        <div class="cake-card-footer">
          <div>
            <div class="cake-price-from">From</div>
            <div class="cake-price">${formatCurrency(lowestPrice)}</div>
          </div>
          <a href="./cake.html?slug=${cake.slug}" class="btn btn--primary btn--sm" onclick="event.stopPropagation()">
            Order <i class="fas fa-arrow-right"></i>
          </a>
        </div>
      </div>
    </article>`;
}

function bindCakeCardEvents(grid) {
  grid.querySelectorAll('.cake-card').forEach(card => {
    const slug = card.dataset.slug;

    card.addEventListener('click', (e) => {
      if (e.target.closest('.btn')) return;
      window.location.href = `./cake.html?slug=${slug}`;
    });

    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        window.location.href = `./cake.html?slug=${slug}`;
      }
    });
  });
}

// ── Counter Animation ─────────────────────────────────────────

function initCounterAnimation() {
  const counters = document.querySelectorAll('.hero-stat-num[data-count]');
  if (!counters.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el       = entry.target;
      const target   = parseInt(el.dataset.count, 10);
      const duration = 1800;
      const start    = performance.now();

      function tick(now) {
        const elapsed  = now - start;
        const progress = Math.min(elapsed / duration, 1);
        // Ease out cubic
        const eased    = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(eased * target);
        if (progress < 1) requestAnimationFrame(tick);
      }

      requestAnimationFrame(tick);
      observer.unobserve(el);
    });
  }, { threshold: 0.5 });

  counters.forEach(c => observer.observe(c));
}

// ── Scroll Reveal ─────────────────────────────────────────────

function initScrollReveal() {
  const targets = document.querySelectorAll(
    '.process-step, .testimonial-card, .flavour-item, .contact-item, .category-pill'
  );

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (!entry.isIntersecting) return;
      setTimeout(() => {
        entry.target.style.opacity   = '1';
        entry.target.style.transform = 'translateY(0)';
      }, i * 60);
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  targets.forEach(el => {
    el.style.opacity    = '0';
    el.style.transform  = 'translateY(20px)';
    el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    observer.observe(el);
  });
}

// ── Scroll To Top ─────────────────────────────────────────────

function initScrollTop() {
  const btn = document.getElementById('scroll-top');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 500);
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// ── Contact Form ──────────────────────────────────────────────

function initContactForm() {
  const form   = document.getElementById('contact-form');
  const submit = document.getElementById('contact-submit');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name    = form.querySelector('#contact-name')?.value.trim();
    const phone   = form.querySelector('#contact-phone-input')?.value.trim();
    const subject = form.querySelector('#contact-subject')?.value;
    const message = form.querySelector('#contact-message')?.value.trim();

    if (!name || !phone || !subject || !message) {
      toast.warning('Please fill in all required fields.');
      return;
    }

    setButtonLoading(submit, true, 'Sending…');

    try {
      const businessPhone = await fetchBusinessPhone();
      const waText =
        `📩 *New Message from Website*\n\n` +
        `Name: ${name}\nPhone: ${phone}\n` +
        `Subject: ${subject}\n\nMessage:\n${message}`;

      const waUrl = whatsappLink(businessPhone, waText);

      toast.success('Opening WhatsApp to send your message!');
      setTimeout(() => window.open(waUrl, '_blank', 'noopener'), 800);
      form.reset();

    } catch (err) {
      console.error('Contact form error:', err);
      toast.error('Something went wrong. Please try WhatsApp or email directly.');
    } finally {
      setButtonLoading(submit, false);
    }
  });
}
