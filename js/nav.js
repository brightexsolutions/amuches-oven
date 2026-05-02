// ============================================================
// Amuche's Oven — Navigation (nav.js)
// Sticky header wrapper, transparent/scrolled states,
// mobile menu, cart drawer, active links
// ============================================================

import { renderCartDrawer, updateCartUI } from './cart.js';
import { fetchSettingsMap } from './data-access.js';

document.addEventListener('DOMContentLoaded', async () => {
  await initAnnouncementBar();
  initNav();
  initMobileMenu();
  initCartDrawer();
  setActiveNavLink();
  setFooterYear();
  updateCartUI();
});

// ── Announcement Bar ─────────────────────────────────────────
async function initAnnouncementBar() {
  const bar   = document.querySelector('.announcement-bar');
  const close = document.querySelector('.announcement-bar-close');
  if (!bar || !close) return;

  try {
    const settings = await fetchSettingsMap();
    const enabled = String(settings.announcement_enabled || 'false') === 'true';
    const text = settings.announcement_text?.trim() || '';
    const linkLabel = settings.announcement_link_label?.trim() || '';
    const linkUrl = settings.announcement_link_url?.trim() || '';
    const textEl = bar.querySelector('.announcement-bar-text');
    const linkEl = bar.querySelector('.announcement-bar-link');

    if (!enabled || !text) {
      bar.classList.add('hidden');
      return;
    }

    if (textEl) textEl.textContent = text;
    if (linkEl) {
      if (linkLabel && linkUrl) {
        linkEl.textContent = linkLabel;
        linkEl.href = linkUrl;
        linkEl.hidden = false;
      } else {
        linkEl.hidden = true;
      }
    }

    const contentKey = `${text}|${linkLabel}|${linkUrl}`;
    const dismissKey = `ann-dismissed:${contentKey}`;
    if (sessionStorage.getItem(dismissKey) === '1') {
      bar.classList.add('hidden');
      return;
    }

    close.addEventListener('click', () => {
      bar.classList.add('hidden');
      sessionStorage.setItem(dismissKey, '1');
      positionMobileNav();
    });
  } catch {
    bar.classList.remove('hidden');
  }
}

// ── Nav Scroll State ─────────────────────────────────────────
function initNav() {
  const nav     = document.querySelector('.site-nav');
  const header  = document.querySelector('.site-header');
  if (!nav) return;

  const hasHero = !!(document.querySelector('.home-hero') || document.querySelector('[data-hero]'));

  function updateNav() {
    if (!hasHero) {
      nav.classList.remove('transparent', 'scrolled');
      nav.classList.add('solid');
      return;
    }
    const scrolled = window.scrollY > 80;
    nav.classList.toggle('scrolled',    scrolled);
    nav.classList.toggle('transparent', !scrolled);
    nav.classList.remove('solid');
  }

  updateNav();

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => { updateNav(); ticking = false; });
      ticking = true;
    }
  }, { passive: true });
}

// ── Mobile Menu ───────────────────────────────────────────────
function positionMobileNav() {
  const header  = document.querySelector('.site-header');
  const mobileNav = document.querySelector('.mobile-nav');
  if (!mobileNav) return;
  const h = header ? header.getBoundingClientRect().bottom : 72;
  mobileNav.style.top = h + 'px';
}

function initMobileMenu() {
  const toggle    = document.querySelector('.menu-toggle');
  const mobileNav = document.querySelector('.mobile-nav');
  const overlay   = document.querySelector('.mobile-nav-overlay');
  if (!toggle || !mobileNav) return;

  // Set initial position
  positionMobileNav();
  window.addEventListener('resize', positionMobileNav);

  function openMenu() {
    positionMobileNav();
    toggle.classList.add('open');
    mobileNav.classList.add('open');
    overlay?.classList.add('open');
    document.body.style.overflow = 'hidden';
    toggle.setAttribute('aria-expanded','true');
    mobileNav.setAttribute('aria-hidden','false');
  }
  function closeMenu() {
    toggle.classList.remove('open');
    mobileNav.classList.remove('open');
    overlay?.classList.remove('open');
    document.body.style.overflow = '';
    toggle.setAttribute('aria-expanded','false');
    mobileNav.setAttribute('aria-hidden','true');
  }

  toggle.addEventListener('click', () => mobileNav.classList.contains('open') ? closeMenu() : openMenu());
  overlay?.addEventListener('click', closeMenu);
  mobileNav.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
  document.addEventListener('keydown', e => { if (e.key==='Escape' && mobileNav.classList.contains('open')) closeMenu(); });
}

// ── Cart Drawer ───────────────────────────────────────────────
function initCartDrawer() {
  const cartBtn = document.querySelector('.cart-btn');
  const drawer  = document.getElementById('cart-drawer');
  const closeBtn= document.getElementById('cart-drawer-close');
  const overlay = document.getElementById('cart-drawer-overlay');
  if (!drawer) return;

  function openDrawer() {
    drawer.classList.add('open');
    overlay?.classList.add('open');
    document.body.style.overflow = 'hidden';
    renderCartDrawer('cart-drawer-content');
  }
  function closeDrawer() {
    drawer.classList.remove('open');
    overlay?.classList.remove('open');
    document.body.style.overflow = '';
  }

  cartBtn?.addEventListener('click', openDrawer);
  closeBtn?.addEventListener('click', closeDrawer);
  overlay?.addEventListener('click', closeDrawer);
  document.addEventListener('keydown', e => { if (e.key==='Escape' && drawer.classList.contains('open')) closeDrawer(); });
  window.addEventListener('cart:updated', () => { if (drawer.classList.contains('open')) renderCartDrawer('cart-drawer-content'); });
}

// ── Active Link Detection ─────────────────────────────────────
function setActiveNavLink() {
  const currentPath = new URL(window.location.href).pathname.replace(/\/index\.html$/, '/');
  document.querySelectorAll('.nav-link, .mobile-nav-link').forEach(link => {
    const href = link.getAttribute('href');
    if (!href || href.startsWith('#')) return;
    const linkPath = new URL(href, window.location.href).pathname.replace(/\/index\.html$/, '/');
    const isActive =
      (linkPath === '/' && (currentPath === '/' || currentPath === '')) ||
      (linkPath !== '/' && currentPath.startsWith(linkPath.replace('.html','')));
    link.classList.toggle('active', isActive);
  });
}

function setFooterYear() {
  const el = document.getElementById('footer-year');
  if (el) el.textContent = new Date().getFullYear();
}
