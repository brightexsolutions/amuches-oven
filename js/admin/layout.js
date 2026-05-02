// ============================================================
// Amuche's Oven — Admin Shared Layout (admin-layout.js)
// Call renderAdminLayout(activePage) at top of each admin page
// ============================================================

import { supabaseClient, signOut, requireAdmin } from '../config.js';

const NAV_ITEMS = [
  { section: 'Main', items: [
    { href: './index.html',    icon: 'fa-gauge',          label: 'Dashboard'  },
    { href: './orders.html',   icon: 'fa-list-check',     label: 'Orders',    badge: true },
    { href: './schedule.html', icon: 'fa-calendar-days',  label: 'Schedule'   },
  ]},
  { section: 'Catalogue', items: [
    { href: './cakes.html',    icon: 'fa-cake-candles',   label: 'Cakes'      },
  ]},
  { section: 'System', items: [
    { href: './settings.html', icon: 'fa-gear',           label: 'Settings'   },
    { href: '../index.html',    icon: 'fa-arrow-up-right-from-square', label: 'View Site', external: true },
  ]},
];

export async function initAdminLayout(activePage) {
  const session = await requireAdmin();
  if (!session) return null;

  const email    = session.user?.email || 'admin@amuchesoven.co.ke';
  const initials = email.substring(0, 2).toUpperCase();

  // Inject sidebar HTML
  const sidebarEl = document.getElementById('admin-sidebar');
  if (sidebarEl) {
    sidebarEl.setAttribute('aria-label', 'Admin sidebar');
    sidebarEl.innerHTML = `
      <div class="admin-sidebar-header">
        <div class="admin-logo-name">Amuche's Oven</div>
        <div class="admin-logo-tag">Admin Dashboard</div>
        <button class="admin-sidebar-close" id="admin-sidebar-close" aria-label="Close navigation">
          <i class="fas fa-xmark"></i>
        </button>
      </div>
      <nav class="admin-nav" aria-label="Admin navigation">
        ${NAV_ITEMS.map(group => `
          <div class="admin-nav-section">
            <div class="admin-nav-section-label">${group.section}</div>
            ${group.items.map(item => `
              <a href="${item.href}"
                class="admin-nav-link ${activePage === item.href ? 'active' : ''}"
                ${item.external ? 'target="_blank" rel="noopener"' : ''}
              >
                <i class="fas ${item.icon}"></i>
                ${item.label}
                ${item.badge ? `<span class="admin-nav-badge" id="nav-pending-count">…</span>` : ''}
              </a>`).join('')}
          </div>`).join('')}
      </nav>
      <div class="admin-sidebar-footer">
        <div class="admin-user-info">
          <div class="admin-avatar">${initials}</div>
          <div>
            <div class="admin-user-name">${email.split('@')[0]}</div>
            <div class="admin-user-role">Administrator</div>
          </div>
        </div>
        <button class="admin-logout-btn" id="logout-btn">
          <i class="fas fa-arrow-right-from-bracket"></i> Sign Out
        </button>
      </div>`;
  }

  // Mobile sidebar toggle
  const mobileToggle = document.getElementById('sidebar-mobile-toggle');
  const floatingToggle = document.getElementById('sidebar-mobile-toggle-fab');
  const setSidebarOpen = (open) => {
    sidebarEl?.classList.toggle('open', open);
    document.body.classList.toggle('admin-sidebar-open', open);

    [mobileToggle, floatingToggle].forEach((toggle) => {
      if (!toggle) return;
      toggle.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Close sidebar' : 'Open sidebar');

      const icon = toggle.querySelector('i');
      if (icon) {
        icon.classList.toggle('fa-bars', !open);
        icon.classList.toggle('fa-xmark', open);
      }
    });
  };

  mobileToggle?.addEventListener('click', () => {
    setSidebarOpen(!sidebarEl?.classList.contains('open'));
  });
  floatingToggle?.addEventListener('click', () => {
    setSidebarOpen(!sidebarEl?.classList.contains('open'));
  });
  document.getElementById('admin-sidebar-close')?.addEventListener('click', () => {
    setSidebarOpen(false);
  });
  window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
      setSidebarOpen(false);
    }
  });
  setSidebarOpen(false);

  // Logout
  document.getElementById('logout-btn')?.addEventListener('click', async () => {
    await signOut();
    window.location.href = './login.html';
  });

  // Load pending badge count
  loadPendingCount();

  return session;
}

async function loadPendingCount() {
  try {
    const { count } = await supabaseClient
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending');

    const el = document.getElementById('nav-pending-count');
    if (el) {
      el.textContent = count || 0;
      el.style.display = count ? '' : 'none';
    }
  } catch(e) {}
}

// Mobile sidebar overlay close
document.addEventListener('click', (e) => {
  const sidebar = document.getElementById('admin-sidebar');
  const toggle  = document.getElementById('sidebar-mobile-toggle');
  const fab = document.getElementById('sidebar-mobile-toggle-fab');
  if (
    sidebar?.classList.contains('open') &&
    !sidebar.contains(e.target) &&
    !toggle?.contains(e.target) &&
    !fab?.contains(e.target)
  ) {
    sidebar.classList.remove('open');
    document.body.classList.remove('admin-sidebar-open');
    [toggle, fab].forEach((button) => {
      if (!button) return;
      button.classList.remove('is-open');
      button.setAttribute('aria-expanded', 'false');
      button.setAttribute('aria-label', 'Open sidebar');
      const icon = button.querySelector('i');
      if (icon) {
        icon.classList.add('fa-bars');
        icon.classList.remove('fa-xmark');
      }
    });
  }
});
