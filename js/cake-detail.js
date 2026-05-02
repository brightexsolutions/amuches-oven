// ============================================================
// Amuche's Oven — Cake Detail Page (cake-detail.js)
// Image gallery, flavor/size variant selection, price update,
// add-to-cart, WhatsApp order, related cakes
// ============================================================

import {
  fetchBusinessPhone,
  fetchCakeBySlug,
  fetchRelatedCakes,
  fetchSettingsMap,
} from './data-access.js';
import {
  formatCurrency, whatsappLink, buildWhatsAppOrderMessage,
  generateRef, toast, setButtonLoading, setVisible,
  hidePageLoader, $, $$
} from './utils.js';
import { addToCart, updateCartUI } from './cart.js';

// ── State ─────────────────────────────────────────────────────
let cakeData       = null;
let selectedFlavor = null;
let selectedSize   = null;
let selectedVariant= null;
let quantity       = 1;

document.addEventListener('DOMContentLoaded', async () => {
  hidePageLoader();
  updateCartUI();
  document.body.classList.add('loaded');

  const slug = new URLSearchParams(window.location.search).get('slug');
  if (!slug) { showError(); return; }

  await Promise.all([
    loadCake(slug),
    loadFooterSettings(),
  ]);

  initScrollTop();
});

async function loadCake(slug) {
  try {
    const cake = await fetchCakeBySlug(slug);
    if (!cake) { showError(); return; }

    cakeData = cake;

    // Update page meta
    document.title = `${cake.name} — Amuche's Oven`;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.content = cake.description || `Order ${cake.name} from Amuche's Oven, Nairobi.`;
    document.getElementById('breadcrumb-name').textContent = cake.name;

    // Render
    renderCakeDetail(cake);
    loadRelatedCakes(cake.category, cake.id);

  } catch (err) {
    console.error('Load cake error:', err);
    showError();
  }
}

// ── Render Main Detail ────────────────────────────────────────
function renderCakeDetail(cake) {
  const content  = document.getElementById('cake-content');
  const loading  = document.getElementById('cake-loading');

  const images   = cake.cake_images || [];
  const variants = cake.cake_variants || [];
  const avail    = variants.filter(v => v.is_available);
  const flavors  = [...new Set(avail.map(v => v.flavor).filter(Boolean))];
  const catLabel = cake.category.charAt(0).toUpperCase() + cake.category.slice(1);

  const primaryImg = images.find(i => i.is_primary) || images[0];
  const imgUrl = primaryImg?.public_url ||
    'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&q=80&auto=format&fit=crop';

  content.innerHTML = `
    <div class="cake-detail-grid">
      <!-- ── Gallery ── -->
      <div class="cake-gallery">
        <div class="gallery-main" id="gallery-main">
          <img
            id="gallery-main-img"
            src="${imgUrl}"
            alt="${primaryImg?.alt_text || cake.name}"
            fetchpriority="high"
            decoding="async"
          />
        </div>
        ${images.length > 1 ? `
          <div class="gallery-thumbs" id="gallery-thumbs" role="list" aria-label="Cake photos">
            ${images.map((img, i) => `
              <button
                class="gallery-thumb ${i === 0 ? 'active' : ''}"
                data-url="${img.public_url}"
                data-alt="${img.alt_text || cake.name}"
                role="listitem"
                aria-label="View photo ${i + 1}"
              >
                <img src="${img.public_url}" alt="${img.alt_text || cake.name}" loading="lazy" decoding="async" />
              </button>`).join('')}
          </div>` : ''}
      </div>

      <!-- ── Order Panel ── -->
      <div class="order-panel">
        <div class="order-panel-category">${catLabel}</div>
        <h1 class="order-panel-name">${cake.name}</h1>
        <p class="order-panel-desc">${cake.description || ''}</p>

        ${cake.allows_custom ? `
          <div class="custom-badge-inline">
            <i class="fas fa-wand-magic-sparkles"></i> Custom designs available on request
          </div>` : ''}

        <!-- Lead time notice -->
        <div class="lead-time-notice">
          <i class="fas fa-clock"></i>
          Requires at least <strong>${cake.min_order_days} day${cake.min_order_days !== 1 ? 's' : ''}</strong> advance notice. Plan ahead for your event!
        </div>

        <!-- ── Flavor Selection ── -->
        ${flavors.length ? `
          <div class="variant-section">
            <span class="variant-label">Choose Flavour</span>
            <div class="variant-options" id="flavor-options" role="group" aria-label="Flavour options">
              ${flavors.map(f => `
                <button class="variant-option" data-flavor="${f}" aria-pressed="false">
                  ${f}
                </button>`).join('')}
            </div>
          </div>` : ''}

        <!-- ── Size Selection (populated after flavor pick) ── -->
        <div class="variant-section" id="size-section" style="${flavors.length ? 'display:none' : ''}">
          <span class="variant-label">Choose Size</span>
          <div class="variant-options" id="size-options" role="group" aria-label="Size options"></div>
        </div>

        <!-- ── Serves info ── -->
        <div id="serves-info" class="serves-info hidden">
          <i class="fas fa-users"></i>
          <span id="serves-text">Serves —</span>
        </div>

        <!-- ── Price Display ── -->
        <div class="price-display" id="price-display">
          <div class="price-display-amount" id="price-amount">
            ${formatCurrency(avail.length ? Math.min(...avail.map(v => v.price)) : cake.base_price)}
          </div>
          <div class="price-display-desc" id="price-desc">
            ${avail.length ? 'from — select options above' : ''}
          </div>
        </div>

        <!-- ── Quantity ── -->
        <div class="qty-row">
          <span class="qty-label">Quantity</span>
          <div class="detail-qty-control">
            <button class="detail-qty-btn" id="qty-dec" aria-label="Decrease quantity">
              <i class="fas fa-minus"></i>
            </button>
            <span class="detail-qty-val" id="qty-val">1</span>
            <button class="detail-qty-btn" id="qty-inc" aria-label="Increase quantity">
              <i class="fas fa-plus"></i>
            </button>
          </div>
        </div>

        <!-- ── Special Note ── -->
        <div class="custom-note-section">
          <div class="custom-note-title">
            <i class="fas fa-pen"></i> Special Instructions (optional)
          </div>
          <textarea
            class="form-textarea"
            id="special-note"
            placeholder="E.g. name on cake, message, colour preference, dietary needs…"
            rows="3"
            style="margin:0"
          ></textarea>
        </div>

        <!-- ── CTA Buttons ── -->
        <div class="order-cta-row">
          <button class="btn btn--primary btn--lg" id="add-to-cart-btn" ${!avail.length ? 'disabled' : ''}>
            <i class="fas fa-bag-shopping"></i>
            ${avail.length ? 'Add to Cart' : 'Unavailable'}
          </button>
          <a
            id="whatsapp-order-btn"
            href="#"
            class="btn btn--whatsapp"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Order via WhatsApp"
            title="Order via WhatsApp"
            style="width:44px;height:44px;padding:0;border-radius:50%;font-size:1.2rem;flex-shrink:0"
          >
            <i class="fab fa-whatsapp"></i>
          </a>
        </div>

        <div style="display:flex;align-items:center;gap:var(--sp-2);margin-top:var(--sp-4);font-size:var(--fz-xs);color:var(--clr-stone-400)">
          <i class="fas fa-shield-halved" style="color:var(--clr-sage)"></i>
          Secure order · Fresh baked · Delivered in Nairobi
        </div>

        <!-- Share row -->
        <div class="cake-actions-row" style="margin-top:var(--sp-5)">
          <button class="cake-share-btn" id="share-btn">
            <i class="fas fa-share-nodes"></i> Share
          </button>
          <button class="cake-share-btn" id="copy-link-btn">
            <i class="fas fa-link"></i> Copy Link
          </button>
        </div>
      </div>
    </div>`;

  // Hide skeleton, show content
  if (loading)  loading.style.display  = 'none';
  content.classList.remove('hidden');

  // Bind all interactions
  bindGallery(images);
  bindVariantPicker(avail);
  bindQty();
  bindAddToCart(cake, avail);
  initializeDefaultVariant(avail, flavors);
  updateWhatsAppLink(cake, selectedVariant);
  bindShare(cake);
}

// ── Gallery ───────────────────────────────────────────────────
function bindGallery(images) {
  const mainImg = document.getElementById('gallery-main-img');
  if (!mainImg) return;

  document.querySelectorAll('.gallery-thumb').forEach(thumb => {
    thumb.addEventListener('click', () => {
      document.querySelectorAll('.gallery-thumb').forEach(t => t.classList.remove('active'));
      thumb.classList.add('active');
      mainImg.style.opacity = '0';
      setTimeout(() => {
        mainImg.src     = thumb.dataset.url;
        mainImg.alt     = thumb.dataset.alt;
        mainImg.style.opacity = '1';
      }, 150);
    });
  });

  // Add smooth transition to main image
  if (mainImg) mainImg.style.transition = 'opacity 0.15s ease';
}

// ── Variant Picker ────────────────────────────────────────────
function bindVariantPicker(availableVariants) {
  const flavorBtns = $$('#flavor-options .variant-option');
  const sizeSection = document.getElementById('size-section');
  const sizeOptions = document.getElementById('size-options');

  if (!sizeOptions) return;

  flavorBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      flavorBtns.forEach((b) => {
        b.classList.remove('selected');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('selected');
      btn.setAttribute('aria-pressed', 'true');
      selectedFlavor = btn.dataset.flavor;
      selectedSize = null;
      selectedVariant = null;

      const sizes = availableVariants
        .filter((v) => v.flavor === selectedFlavor)
        .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

      renderSizeOptions(sizes, sizeSection, sizeOptions);
      updatePriceDisplay();
    });
  });

  if (!flavorBtns.length) {
    renderSizeOptions(availableVariants, sizeSection, sizeOptions);
  }
}

function renderSizeOptions(variants, sizeSection, sizeOptions) {
  if (!sizeOptions) return;

  sizeOptions.innerHTML = variants.map((variant) => `
    <button class="variant-option" data-variant-id="${variant.id}" aria-pressed="false">
      ${variant.size || variant.flavor || 'Standard'}
      <span style="display:block;font-size:var(--fz-xs);opacity:0.75;margin-top:2px">
        ${formatCurrency(variant.price)}${variant.serves ? ` · serves ${variant.serves}` : ''}
      </span>
    </button>`).join('');

  if (sizeSection) {
    sizeSection.style.display = variants.length ? 'block' : 'none';
  }

  $$('#size-options .variant-option').forEach((button) => {
    button.addEventListener('click', () => {
      $$('#size-options .variant-option').forEach((b) => {
        b.classList.remove('selected');
        b.setAttribute('aria-pressed', 'false');
      });
      button.classList.add('selected');
      button.setAttribute('aria-pressed', 'true');
      selectedVariant = variants.find((variant) => String(variant.id) === String(button.dataset.variantId)) || null;
      selectedSize = selectedVariant?.size || null;
      updatePriceDisplay();
      updateWhatsAppLink(cakeData, selectedVariant);
    });
  });
}

function initializeDefaultVariant(availableVariants, flavors) {
  selectedFlavor = null;
  selectedSize = null;
  selectedVariant = null;
  quantity = 1;

  if (!availableVariants.length) {
    updatePriceDisplay();
    return;
  }

  if (flavors.length === 1) {
    const flavorBtn = document.querySelector('#flavor-options .variant-option');
    flavorBtn?.click();

    const sizeButtons = $$('#size-options .variant-option');
    if (sizeButtons.length === 1) {
      sizeButtons[0].click();
    }
    return;
  }

  if (!flavors.length) {
    const sizeButtons = $$('#size-options .variant-option');
    if (sizeButtons.length === 1) {
      sizeButtons[0].click();
    } else if (availableVariants.length === 1) {
      selectedVariant = availableVariants[0];
      selectedSize = selectedVariant?.size || null;
      updatePriceDisplay();
      updateWhatsAppLink(cakeData, selectedVariant);
    }
  }
}

function updatePriceDisplay() {
  const amountEl = document.getElementById('price-amount');
  const descEl   = document.getElementById('price-desc');
  const servesEl = document.getElementById('serves-info');
  const servesText = document.getElementById('serves-text');
  if (!amountEl) return;

  if (selectedVariant) {
    const total = selectedVariant.price * quantity;
    amountEl.textContent = formatCurrency(total);
    descEl.textContent   = quantity > 1
      ? `${formatCurrency(selectedVariant.price)} × ${quantity}`
      : '';
    if (selectedVariant.serves && servesEl && servesText) {
      servesText.textContent = `Serves approx. ${selectedVariant.serves * quantity} people`;
      servesEl.classList.remove('hidden');
    }
  } else {
    const avail = cakeData.cake_variants?.filter(v => v.is_available) || [];
    const low   = avail.length ? Math.min(...avail.map(v => v.price)) : cakeData.base_price;
    amountEl.textContent = formatCurrency(low);
    descEl.textContent   = avail.length ? 'from — select options above' : '';
    servesEl?.classList.add('hidden');
  }
}

// ── Quantity ──────────────────────────────────────────────────
function bindQty() {
  const decBtn = document.getElementById('qty-dec');
  const incBtn = document.getElementById('qty-inc');
  const valEl  = document.getElementById('qty-val');

  decBtn?.addEventListener('click', () => {
    if (quantity > 1) { quantity--; valEl.textContent = quantity; updatePriceDisplay(); }
  });
  incBtn?.addEventListener('click', () => {
    quantity++;
    valEl.textContent = quantity;
    updatePriceDisplay();
  });
}

// ── Add to Cart ───────────────────────────────────────────────
function bindAddToCart(cake, availableVariants) {
  const btn = document.getElementById('add-to-cart-btn');
  if (!btn || !availableVariants.length) return;

  btn.addEventListener('click', () => {
    const fallbackVariant = availableVariants.length === 1 ? availableVariants[0] : null;

    // Enforce variant selection if variants exist
    if (availableVariants.length > 0 && !selectedVariant && !fallbackVariant) {
      toast.warning('Please select a flavour and size first.');
      (document.getElementById('size-section') || document.getElementById('flavor-options'))
        ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      return;
    }

    const chosenVariant = selectedVariant || fallbackVariant;

    const primaryImg = cake.cake_images?.find(i => i.is_primary) || cake.cake_images?.[0];
    const note = document.getElementById('special-note')?.value.trim();

    addToCart({
      cake_id:            cake.id,
      variant_id:         chosenVariant?.id || null,
      cake_name:          cake.name,
      flavor:             chosenVariant?.flavor || null,
      size:               chosenVariant?.size   || null,
      unit_price:         chosenVariant?.price  || cake.base_price,
      image_url:          primaryImg?.public_url  || null,
      quantity,
      custom_description: note || null,
    });

    toast.success(`${cake.name} added to cart!`);

    // Animate button
    btn.innerHTML = '<i class="fas fa-check"></i> Added!';
    btn.style.background = 'var(--clr-success)';
    btn.style.borderColor = 'var(--clr-success)';
    setTimeout(() => {
      btn.innerHTML = '<i class="fas fa-bag-shopping"></i> Add to Cart';
      btn.style.background = '';
      btn.style.borderColor = '';
    }, 2000);
  });
}

// ── WhatsApp Order Button ─────────────────────────────────────
function updateWhatsAppLink(cake, variant) {
  const btn = document.getElementById('whatsapp-order-btn');
  if (!btn) return;

  fetchBusinessPhone()
    .then((phone) => {
      const ref   = generateRef();
      const msg   = buildWhatsAppOrderMessage(cake, variant, ref);
      btn.href    = whatsappLink(phone, msg);

      // Also update the CTA button at bottom of page
      const ctaBtn = document.getElementById('cake-whatsapp-cta');
      if (ctaBtn) ctaBtn.href = whatsappLink(phone, `Hello Amuche's Oven! 👋 I'd like to learn more about your cakes.`);
    });
}

// ── Share ─────────────────────────────────────────────────────
function bindShare(cake) {
  const shareBtn    = document.getElementById('share-btn');
  const copyLinkBtn = document.getElementById('copy-link-btn');

  shareBtn?.addEventListener('click', async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: cake.name, text: cake.description, url });
      } catch {}
    } else {
      await copyToClipboard(url);
      toast.success('Link copied to clipboard!');
    }
  });

  copyLinkBtn?.addEventListener('click', async () => {
    await copyToClipboard(window.location.href);
    toast.success('Link copied to clipboard!');
  });
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity  = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  }
}

// ── Related Cakes ─────────────────────────────────────────────
async function loadRelatedCakes(category, excludeId) {
  const section = document.getElementById('related-section');
  const grid    = document.getElementById('related-grid');
  if (!grid) return;

  try {
    const cakes = await fetchRelatedCakes(category, excludeId, 3);

    if (!cakes || !cakes.length) { section?.style && (section.style.display = 'none'); return; }

    grid.innerHTML = cakes.map(c => renderRelatedCard(c)).join('');

    bindRelatedCardEvents(grid);

  } catch(e) { section?.style && (section.style.display = 'none'); }
}

function bindRelatedCardEvents(grid) {
  grid.querySelectorAll('.cake-card').forEach(card => {
    card.addEventListener('click', e => {
      if (e.target.closest('a,button')) return;
      window.location.href = `./cake.html?slug=${card.dataset.slug}`;
    });
  });
}

function renderRelatedCard(cake) {
  const primaryImg = cake.cake_images
    ?.sort((a,b) => a.display_order - b.display_order)
    .find(i => i.is_primary) || cake.cake_images?.[0];

  const imgUrl = primaryImg?.public_url ||
    'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&q=80&auto=format&fit=crop';

  const avail = cake.cake_variants?.filter(v => v.is_available) || [];
  const low   = avail.length ? Math.min(...avail.map(v => v.price)) : cake.base_price;
  const catLabel = cake.category.charAt(0).toUpperCase() + cake.category.slice(1);

  return `
    <article class="cake-card" data-slug="${cake.slug}" tabindex="0" aria-label="View ${cake.name}">
      <div class="cake-card-image">
        <img src="${imgUrl}" alt="${cake.name}" loading="lazy" decoding="async" width="400" height="300" />
        <div class="cake-card-badge">${catLabel}</div>
      </div>
      <div class="cake-card-body">
        <div class="cake-card-category">${catLabel}</div>
        <h3 class="cake-card-name">${cake.name}</h3>
        <p class="cake-card-desc">${cake.description || ''}</p>
        <div class="cake-card-footer">
          <div>
            <div class="cake-price-from">From</div>
            <div class="cake-price">${formatCurrency(low)}</div>
          </div>
          <a href="./cake.html?slug=${cake.slug}" class="btn btn--primary btn--sm" onclick="event.stopPropagation()">
            View &amp; Order <i class="fas fa-arrow-right"></i>
          </a>
        </div>
      </div>
    </article>`;
}

// ── Error State ───────────────────────────────────────────────
function showError() {
  document.getElementById('cake-loading')?.style && (document.getElementById('cake-loading').style.display = 'none');
  document.getElementById('cake-error')?.classList.remove('hidden');
  document.getElementById('related-section')?.style && (document.getElementById('related-section').style.display = 'none');
}

// ── Footer Settings ───────────────────────────────────────────
async function loadFooterSettings() {
  const settings = await fetchSettingsMap();
  applyCakeFooterSettings(settings);
}

function applyCakeFooterSettings(s) {
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

  const waLink = whatsappLink(phone, `Hello Amuche's Oven! 👋 I'd like to enquire about a cake.`);
  document.getElementById('footer-whatsapp-social')?.setAttribute('href', waLink);
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
