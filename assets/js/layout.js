/* ===== Conta Certa — shells (public / app / blank) + biblioteca de componentes =====
   Escolhe o shell por <body data-shell>. Expõe os helpers de render em UI.* e
   liga tema, idioma, menus, modais e toasts. Espelha os layouts e componentes
   do React (components/layout, components/ui, components/iv). */
(function (global) {
  const SHELL = (document.body.getAttribute('data-shell') || 'public').toLowerCase();

  function t(key, opts) {
    return global.I18n ? global.I18n.t(key, opts) : key;
  }
  function tArr(key) {
    return global.I18n ? global.I18n.tArr(key) : [];
  }
  function lang() {
    return global.I18n ? global.I18n.getLang() : 'pt-BR';
  }
  const F = global.Format;
  const fmt = (v) => F.formatCurrency(v, lang());
  const fmtCompact = (v) => F.formatCompact(v, lang());
  const fmtNumber = (v) => F.formatNumber(v, lang());
  const fmtDate = (v) => F.formatDate(v, lang());
  const fmtDateTime = (v) => F.formatDateTime(v, lang());
  const fmtTime = (v) => F.formatTime(v, lang());

  const LANGS = global.I18n ? global.I18n.LANGUAGES : [{ code: 'pt-BR', flag: '🇧🇷', label: 'Português' }];

  // Load shared scripts once (pwa).
  (function loadScriptsOnce() {
    ['assets/js/pwa.js'].forEach((src) => {
      if (!document.querySelector(`script[src="${src}"]`)) {
        const sc = document.createElement('script');
        sc.src = src;
        document.head.appendChild(sc);
      }
    });
  })();

  /** Escape a value before injecting it into markup. */
  function esc(v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /** Página atual (app-fatura.html marca app-faturas via data-nav). */
  function here() {
    return document.body.getAttribute('data-nav') || window.location.pathname.split('/').pop() || 'index.html';
  }

  // ============================================================
  // Shared render helpers
  // ============================================================
  function langMenu() {
    return LANGS.map(
      (l) =>
        `<button type="button" class="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 ${
          l.code === lang() ? 'font-medium text-brand-600' : 'text-body'
        }" data-action="set-lang" data-lang="${l.code}"><span>${l.flag}</span> ${l.label}${
          l.code === lang() ? icon('check', { size: 14, className: 'ml-auto' }) : ''
        }</button>`
    ).join('');
  }

  function langDropdown(id) {
    const current = LANGS.find((l) => l.code === lang()) || LANGS[0];
    return (
      `<div class="relative" id="${id}"><button type="button" data-action="toggle-lang" data-menu="#${id}-menu" aria-label="Language" title="${esc(
        current.label
      )}" class="flex h-10 w-10 items-center justify-center rounded-full border border-themed text-base hover:bg-gray-50 dark:hover:bg-gray-800">${
        current.flag
      }</button><div id="${id}-menu" class="surface-card absolute right-0 mt-3 w-44 rounded-xl border py-1 shadow-theme-lg hidden z-50">${langMenu()}</div></div>`
    );
  }

  function initials(name) {
    return String(name || '?')
      .split(' ')
      .slice(0, 2)
      .map((w) => (w[0] || '').toUpperCase())
      .join('');
  }

  function avatar(name, size) {
    const dims = { xs: 'h-7 w-7 text-[10px]', sm: 'h-9 w-9 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-14 w-14 text-base' };
    return `<span class="flex ${dims[size] || dims.md} shrink-0 items-center justify-center rounded-full bg-brand-500 font-semibold text-white">${esc(
      initials(name)
    )}</span>`;
  }

  const BADGE_SOFT = {
    brand: 'bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400',
    success: 'bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-500',
    warning: 'bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-warning-500',
    error: 'bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-500',
    gray: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  };
  const BADGE_SOLID = {
    brand: 'bg-brand-500 text-white',
    success: 'bg-success-500 text-white',
    warning: 'bg-warning-500 text-white',
    error: 'bg-error-500 text-white',
    gray: 'bg-gray-500 text-white',
  };
  const BADGE_DOT = {
    brand: 'bg-brand-500',
    success: 'bg-success-500',
    warning: 'bg-warning-500',
    error: 'bg-error-500',
    gray: 'bg-gray-400',
  };

  // badge(label, color, opts) — opts: { variant:'soft'|'solid', dot:bool, icon:string }
  function badge(label, color, opts) {
    color = color || 'brand';
    opts = opts || {};
    const styles = opts.variant === 'solid' ? BADGE_SOLID[color] || BADGE_SOLID.gray : BADGE_SOFT[color] || BADGE_SOFT.gray;
    const dot = opts.dot
      ? `<span class="h-1.5 w-1.5 rounded-full ${opts.variant === 'solid' ? 'bg-white' : BADGE_DOT[color] || BADGE_DOT.gray}"></span>`
      : '';
    const ic = opts.icon ? icon(opts.icon, { size: 12, strokeWidth: 2.2 }) : '';
    return `<span class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${styles}">${dot}${ic}${label}</span>`;
  }

  // ---- Pills de status (porta de components/iv/StatusPill) ----
  const INVOICE_COLOR = { rascunho: 'gray', enviada: 'brand', paga: 'success', vencida: 'error', cancelada: 'gray' };
  const INVOICE_ICON = { rascunho: 'edit', enviada: 'mail', paga: 'check-circle', vencida: 'alert-triangle', cancelada: 'x' };
  const QUOTE_COLOR = { rascunho: 'gray', enviado: 'brand', aceito: 'success', recusado: 'error', expirado: 'warning' };
  const METHOD_ICON = { pix: 'pix', transferencia: 'banknote', cartao: 'credit-card', boleto: 'barcode' };

  /** Status já resolvido — passe `Query.effectiveStatus(invoice)`, não `invoice.status`. */
  function invoicePill(status) {
    return badge(t('invoiceStatuses.' + status), INVOICE_COLOR[status] || 'gray', { icon: INVOICE_ICON[status] });
  }
  function quotePill(status) {
    return badge(t('quoteStatuses.' + status), QUOTE_COLOR[status] || 'gray', { dot: true });
  }
  function cyclePill(cycle) {
    return badge(t('cycles.' + cycle), 'brand', { icon: 'refresh-cw' });
  }
  function methodPill(method) {
    return badge(t('paymentMethods.' + method), 'gray', { icon: METHOD_ICON[method] });
  }
  function activePill(active) {
    return badge(t(active ? 'recurring.active' : 'recurring.paused'), active ? 'success' : 'gray', { dot: true });
  }

  const STATS_ACCENT = {
    brand: 'bg-brand-50 dark:bg-brand-500/15',
    success: 'bg-success-50 dark:bg-success-500/15',
    warning: 'bg-warning-50 dark:bg-warning-500/15',
    error: 'bg-error-50 dark:bg-error-500/15',
    info: 'bg-blue-light-50 dark:bg-blue-light-500/15',
  };
  const STATS_COLOR = {
    brand: 'text-brand-500',
    success: 'text-success-600',
    warning: 'text-warning-600',
    error: 'text-error-500',
    info: 'text-blue-light-500',
  };

  // kpiCard(o) — o: { title, value, icon, accent, hint, trend, trendValue }
  function kpiCard(o) {
    const up = o.trend === 'up';
    const trend = o.trend
      ? `<span class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
          up
            ? 'bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500'
            : 'bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-500'
        }">${icon(up ? 'arrow-up' : 'arrow-down', { size: 12, strokeWidth: 2.5 })}${o.trendValue || ''}</span>`
      : '';
    return (
      `<div class="rounded-2xl border border-themed surface-card p-5 shadow-theme-sm md:p-6">` +
      `<div class="flex items-start justify-between">` +
      `<div class="flex h-12 w-12 items-center justify-center rounded-xl ${STATS_ACCENT[o.accent] || STATS_ACCENT.brand}">${icon(
        o.icon,
        { size: 22, className: STATS_COLOR[o.accent] || STATS_COLOR.brand }
      )}</div>${trend}</div>` +
      `<div class="mt-5"><span class="text-sm text-muted">${o.title}</span>` +
      `<h4 class="mt-2 font-bold text-heading text-title-sm">${o.value}</h4>` +
      (o.hint ? `<p class="mt-1 text-xs text-muted">${o.hint}</p>` : '') +
      `</div></div>`
    );
  }

  // summaryCard(o) — o: { label, value, icon, accent } (faixa de resumo das listas)
  function summaryCard(o) {
    return (
      `<div class="surface-card flex items-center gap-4 rounded-xl border p-4">` +
      `<span class="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 ${o.accent || 'text-brand-500'}">${icon(
        o.icon,
        { size: 18 }
      )}</span>` +
      `<div><p class="text-xs text-muted">${o.label}</p><p class="text-base font-semibold text-heading">${o.value}</p></div>` +
      `</div>`
    );
  }

  function emptyState(o) {
    o = o || {};
    return (
      `<div class="flex flex-col items-center justify-center py-16 text-center">` +
      `<span class="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-500 dark:bg-brand-500/15">${icon(
        o.icon || 'package',
        { size: 28 }
      )}</span>` +
      `<h3 class="mt-5 text-lg font-semibold text-heading">${o.title || ''}</h3>` +
      (o.description ? `<p class="mt-2 max-w-sm text-sm text-muted">${o.description}</p>` : '') +
      (o.action ? `<div class="mt-6">${o.action}</div>` : '') +
      `</div>`
    );
  }

  function breadcrumb(items) {
    const lis = items
      .map((item, i) => {
        const last = i === items.length - 1;
        const ic = item.icon ? icon(item.icon, { size: 15 }) : '';
        const content =
          item.href && !last
            ? `<a href="${item.href}" class="inline-flex items-center gap-1.5 text-muted transition hover:text-brand-600 dark:hover:text-brand-400">${ic}${item.label}</a>`
            : `<span ${last ? 'aria-current="page"' : ''} class="inline-flex items-center gap-1.5 ${
                last ? 'font-medium text-heading' : 'text-muted'
              }">${ic}${item.label}</span>`;
        const sep = !last ? icon('chevron-right', { size: 14, className: 'text-gray-400' }) : '';
        return `<li class="flex items-center gap-1.5">${content}${sep}</li>`;
      })
      .join('');
    return `<nav aria-label="Breadcrumb"><ol class="flex flex-wrap items-center gap-1.5 text-sm">${lis}</ol></nav>`;
  }

  function pageHeader(o) {
    return (
      `<div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">` +
      `<div>` +
      (o.crumbs && o.crumbs.length ? `<div class="mb-2">${breadcrumb(o.crumbs)}</div>` : '') +
      `<h1 class="text-2xl font-bold text-heading">${o.title}</h1>` +
      (o.subtitle ? `<p class="mt-1 text-sm text-muted">${o.subtitle}</p>` : '') +
      `</div>` +
      (o.action ? `<div class="shrink-0">${o.action}</div>` : '') +
      `</div>`
    );
  }

  // switchToggle(checked, attrs, size)
  function switchToggle(checked, attrs, size) {
    const sm = size === 'sm';
    return (
      `<button type="button" role="switch" aria-checked="${!!checked}" ${attrs || ''} class="relative inline-flex shrink-0 items-center rounded-full transition ${
        sm ? 'h-5 w-9' : 'h-6 w-11'
      } ${checked ? 'bg-brand-500' : 'bg-gray-200 dark:bg-gray-700'}"><span class="inline-block transform rounded-full bg-white shadow-theme-xs transition ${
        sm ? 'h-4 w-4' : 'h-5 w-5'
      } ${checked ? (sm ? 'translate-x-4' : 'translate-x-5') : 'translate-x-1'}"></span></button>`
    );
  }

  // filterBar(o) — o: { search, placeholder, controls, action }
  function filterBar(o) {
    o = o || {};
    const searchBox =
      o.search !== undefined
        ? `<div class="relative w-full lg:max-w-xs">` +
          `<span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">${icon('search', { size: 16 })}</span>` +
          `<input data-filter-search value="${esc(o.search)}" placeholder="${esc(o.placeholder || t('common.search'))}" ` +
          `class="focus-ring w-full rounded-lg border border-themed bg-transparent py-2 pr-3 pl-9 text-sm text-body"/></div>`
        : '';
    return (
      `<div class="surface-card mb-5 flex flex-col gap-3 rounded-xl border p-4 lg:flex-row lg:items-center">` +
      searchBox +
      (o.controls ? `<div class="flex flex-wrap items-center gap-3">${o.controls}</div>` : '') +
      (o.action ? `<div class="lg:ml-auto">${o.action}</div>` : '') +
      `</div>`
    );
  }

  // filterSelect(label, attrs, optionsHtml)
  function filterSelect(label, attrs, optionsHtml) {
    return (
      `<label class="flex items-center gap-2 text-sm text-muted">` +
      (label ? `<span class="whitespace-nowrap">${label}</span>` : '') +
      `<select ${attrs || ''} class="focus-ring rounded-lg border border-themed bg-transparent px-3 py-2 text-sm text-body">${optionsHtml}</select>` +
      `</label>`
    );
  }

  // pageNav(page, totalPages) — botões carregam data-page; a página liga o clique.
  function pageNav(page, totalPages) {
    if (totalPages <= 1) return '';
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) pages.push(i);
      else if (pages[pages.length - 1] !== '...') pages.push('...');
    }
    const btn =
      'flex h-10 min-w-10 items-center justify-center rounded-lg border border-themed px-3 text-sm font-medium transition disabled:opacity-40';
    const cells = pages
      .map((p) =>
        p === '...'
          ? `<span class="px-1 text-muted">…</span>`
          : `<button type="button" data-page="${p}" class="${btn} ${
              p === page ? 'border-brand-500 bg-brand-500 text-white' : 'text-body hover:text-heading'
            }">${p}</button>`
      )
      .join('');
    return (
      `<nav class="flex items-center justify-center gap-2" aria-label="Pagination">` +
      `<button type="button" data-page="${page - 1}" ${page <= 1 ? 'disabled' : ''} aria-label="${t(
        'common.previous'
      )}" class="${btn} text-muted hover:text-heading">${icon('chevron-left', { size: 16 })}</button>` +
      cells +
      `<button type="button" data-page="${page + 1}" ${page >= totalPages ? 'disabled' : ''} aria-label="${t(
        'common.next'
      )}" class="${btn} text-muted hover:text-heading">${icon('chevron-right', { size: 16 })}</button>` +
      `</nav>`
    );
  }

  // ============================================================
  // Modal / drawer / tabs
  // ============================================================
  const MODAL_SIZE = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-2xl', xl: 'max-w-4xl' };
  function modal(id, opts) {
    opts = opts || {};
    return (
      `<div id="${id}" class="fixed inset-0 z-[80] hidden" data-modal>` +
      `<div class="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" data-modal-close></div>` +
      `<div class="relative flex min-h-full items-center justify-center p-4"><div class="surface-card w-full ${
        MODAL_SIZE[opts.size] || MODAL_SIZE.md
      } overflow-hidden rounded-2xl border shadow-theme-xl">` +
      `<header class="flex items-center justify-between border-b border-themed px-5 py-4"><div><h3 class="text-base font-semibold text-heading">${
        opts.title || ''
      }</h3>${opts.subtitle ? `<p class="mt-0.5 text-xs text-muted">${opts.subtitle}</p>` : ''}</div>` +
      `<button type="button" data-modal-close aria-label="${t('common.close')}" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">${icon('x', { size: 20 })}</button></header>` +
      `<div class="max-h-[75vh] overflow-y-auto px-5 py-5" data-modal-body>${opts.body || ''}</div>` +
      (opts.footer
        ? `<footer class="flex items-center justify-end gap-2 border-t border-themed px-5 py-3" data-modal-footer>${opts.footer}</footer>`
        : '') +
      `</div></div></div>`
    );
  }
  function openModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('hidden');
  }
  function closeModal(id) {
    const el = typeof id === 'string' ? document.getElementById(id) : id;
    if (el) el.classList.add('hidden');
  }

  function drawer(id, opts) {
    opts = opts || {};
    return (
      `<div id="${id}" class="fixed inset-0 z-[70] hidden" data-drawer>` +
      `<div class="absolute inset-0 bg-gray-900/50" data-drawer-close></div>` +
      `<aside class="surface-card absolute right-0 top-0 flex h-full w-full ${
        opts.width || 'max-w-md'
      } flex-col border-l shadow-theme-xl" role="dialog">` +
      `<div class="flex items-start justify-between border-b border-themed px-5 py-4"><div>` +
      `<h2 class="text-lg font-semibold text-heading">${opts.title || ''}</h2>` +
      `<p class="mt-0.5 text-xs text-muted">${opts.subtitle || ''}</p></div>` +
      `<button type="button" data-drawer-close aria-label="${t('common.close')}" class="flex h-9 w-9 items-center justify-center rounded-full text-muted hover:text-heading">${icon('x', { size: 20 })}</button></div>` +
      `<div class="flex-1 overflow-y-auto px-5 py-4">${opts.body || ''}</div>` +
      (opts.footer ? `<div class="border-t border-themed px-5 py-4">${opts.footer}</div>` : '') +
      `</aside></div>`
    );
  }
  function openDrawer(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('hidden');
  }
  function closeDrawer(id) {
    const el = typeof id === 'string' ? document.getElementById(id) : id;
    if (el) el.classList.add('hidden');
  }

  // tabs(items, active) — items: [{ label, icon, content }]. onTabChange fica na página.
  function tabs(items, active) {
    active = active || 0;
    const heads = items
      .map(
        (it, i) =>
          `<button type="button" role="tab" aria-selected="${i === active}" data-tab="${i}" class="-mb-px inline-flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition ${
            i === active
              ? 'border-brand-500 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-muted hover:border-gray-300 hover:text-body dark:hover:border-gray-700'
          }">${it.icon ? icon(it.icon, { size: 16 }) : ''}${it.label}</button>`
      )
      .join('');
    return (
      `<div data-tabs><div class="flex gap-1 overflow-x-auto border-b border-themed no-scrollbar" role="tablist">${heads}</div>` +
      `<div data-tab-panel class="pt-5 text-sm text-body" role="tabpanel">${items[active] ? items[active].content : ''}</div></div>`
    );
  }

  // ============================================================
  // Componentes do site público (porta de components/iv)
  // ============================================================
  function featureCard(o) {
    const bullets =
      o.bullets && o.bullets.length
        ? `<ul class="mt-4 space-y-1.5">${o.bullets
            .map(
              (b) =>
                `<li class="flex items-start gap-2 text-sm text-muted">${icon('check', {
                  size: 15,
                  className: 'mt-0.5 shrink-0 text-success-500',
                })}${b}</li>`
            )
            .join('')}</ul>`
        : '';
    return (
      `<div class="surface-card flex h-full flex-col rounded-2xl border p-6 transition hover:shadow-theme-md">` +
      `<span class="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-500 dark:bg-brand-500/15">${icon(o.icon, { size: 22 })}</span>` +
      `<h3 class="mt-5 text-base font-semibold text-heading">${o.title}</h3>` +
      `<p class="mt-2 flex-1 text-sm text-muted">${o.description}</p>` +
      bullets +
      `</div>`
    );
  }

  // planCard(plan, price, yearly)
  function planCard(plan, price, yearly) {
    return (
      `<div class="surface-card relative flex h-full flex-col rounded-2xl border p-6 ${
        plan.featured ? 'border-brand-500 shadow-theme-lg' : ''
      }">` +
      (plan.featured
        ? `<span class="absolute -top-3 left-6 rounded-full bg-brand-500 px-3 py-1 text-xs font-medium text-white">${t('pricing.mostPopular')}</span>`
        : '') +
      `<h3 class="text-lg font-semibold text-heading">${t('plans.' + plan.key + '.name')}</h3>` +
      `<p class="mt-1 text-sm text-muted">${t('plans.' + plan.key + '.pitch')}</p>` +
      `<p class="mt-6 flex items-end gap-1"><span class="text-title-sm font-bold text-heading">${fmt(price)}</span>` +
      `<span class="pb-1.5 text-sm text-muted">${t('pricing.perMonth')}</span></p>` +
      (yearly ? `<p class="mt-1 text-xs text-success-600">${t('pricing.yearlyNote')}</p>` : '') +
      `<p class="mt-4 text-sm font-medium text-body">${t('pricing.invoicesIncluded', { count: plan.invoices })}</p>` +
      `<ul class="mt-5 flex-1 space-y-2">${plan.featureKeys
        .map(
          (key) =>
            `<li class="flex items-start gap-2 text-sm text-muted">${icon('check-circle', {
              size: 16,
              className: 'mt-0.5 shrink-0 text-success-500',
            })}${t('planFeatures.' + key)}</li>`
        )
        .join('')}</ul>` +
      `<a href="registro.html" class="mt-6 flex h-11 items-center justify-center rounded-xl text-sm font-medium transition ${
        plan.featured
          ? 'bg-brand-500 text-white hover:bg-brand-600'
          : 'border border-themed text-body hover:bg-gray-50 dark:hover:bg-gray-800'
      }">${t('pricing.choose')}</a>` +
      `</div>`
    );
  }

  // faqAccordion(keys, openKey) — a página controla o aberto via data-faq
  function faqAccordion(keys, openKey) {
    const rows = keys
      .map((key) => {
        const expanded = openKey === key;
        return (
          `<div>` +
          `<button type="button" data-faq="${key}" aria-expanded="${expanded}" class="flex w-full items-center justify-between gap-4 px-5 py-4 text-left">` +
          `<span class="text-sm font-medium text-heading">${t('faq.' + key + '.q')}</span>` +
          icon('chevron-down', { size: 18, className: `shrink-0 text-muted transition-transform ${expanded ? 'rotate-180' : ''}` }) +
          `</button>` +
          (expanded ? `<p class="px-5 pb-5 text-sm text-muted">${t('faq.' + key + '.a')}</p>` : '') +
          `</div>`
        );
      })
      .join('');
    return `<div class="divide-y divide-[color:var(--tx-border)] overflow-hidden rounded-2xl border border-themed surface-card">${rows}</div>`;
  }

  function teamCard(member) {
    return (
      `<div class="surface-card rounded-2xl border p-5 text-center">` +
      `<img src="${Data.ivImage(member.seed, 200, 200)}" alt="${esc(t('team.' + member.key + '.name'))}" loading="lazy" class="mx-auto h-20 w-20 rounded-full object-cover"/>` +
      `<h3 class="mt-4 text-sm font-semibold text-heading">${t('team.' + member.key + '.name')}</h3>` +
      `<p class="text-xs text-brand-600 dark:text-brand-400">${t('team.' + member.key + '.role')}</p>` +
      `<p class="mt-2 text-xs text-muted">${t('team.' + member.key + '.bio')}</p>` +
      `</div>`
    );
  }

  // ============================================================
  // Editor de itens (porta de components/iv/InvoiceItemsEditor)
  // Linhas carregam data-item-index; campos data-item-field.
  // Os totais são nós marcados (data-line-total / data-subtotal / …) para que
  // a página os atualize *no lugar*, sem re-render — o cursor não pula.
  // ============================================================
  function itemsEditor(doc, opts) {
    opts = opts || {};
    const readOnly = !!opts.readOnly;
    const Q = global.Query;
    const cell = 'h-9 w-full rounded-lg border border-themed bg-transparent px-3 text-sm text-body focus-ring';

    const rows = doc.items.length
      ? doc.items
          .map(
            (item, index) =>
              `<tr data-item-index="${index}">` +
              `<td class="px-4 py-2">${
                readOnly
                  ? `<span class="text-body">${esc(item.description)}</span>`
                  : `<input value="${esc(item.description)}" placeholder="${esc(t('items.descriptionPlaceholder'))}" data-item-field="description" class="${cell}"/>`
              }</td>` +
              `<td class="px-4 py-2">${
                readOnly
                  ? `<span class="text-body">${item.quantity}</span>`
                  : `<input type="number" min="0" step="1" value="${item.quantity}" data-item-field="quantity" class="${cell}"/>`
              }</td>` +
              `<td class="px-4 py-2">${
                readOnly
                  ? `<span class="text-body">${fmt(item.unitPrice)}</span>`
                  : `<input type="number" min="0" step="10" value="${item.unitPrice}" data-item-field="unitPrice" class="${cell}"/>`
              }</td>` +
              `<td class="px-4 py-2">${
                readOnly
                  ? `<span class="text-body">${item.taxRate}%</span>`
                  : `<div class="relative"><input type="number" min="0" max="100" step="0.5" value="${item.taxRate}" data-item-field="taxRate" class="${cell} pr-7"/>` +
                    `<span class="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-xs text-muted">%</span></div>`
              }</td>` +
              `<td class="px-4 py-2 text-right font-medium text-heading" data-line-total>${fmt(Q.lineTotal(item))}</td>` +
              (readOnly
                ? ''
                : `<td class="px-2 py-2"><button type="button" data-item-remove="${index}" aria-label="${esc(
                    t('common.remove')
                  )}" class="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition hover:text-error-500">${icon('trash', { size: 16 })}</button></td>`) +
              `</tr>`
          )
          .join('')
      : `<tr><td colspan="${readOnly ? 5 : 6}" class="px-4 py-6 text-center text-sm text-muted">${t('items.empty')}</td></tr>`;

    const discountValue = Q.invoiceDiscountValue(doc);

    return (
      `<div class="space-y-4" data-items-editor>` +
      `<div class="overflow-x-auto rounded-xl border border-themed"><table class="w-full min-w-[680px] text-sm">` +
      `<thead><tr class="border-b border-themed text-left text-xs uppercase tracking-wider text-muted">` +
      `<th class="px-4 py-3 font-medium">${t('items.description')}</th>` +
      `<th class="w-24 px-4 py-3 font-medium">${t('items.quantity')}</th>` +
      `<th class="w-36 px-4 py-3 font-medium">${t('items.unitPrice')}</th>` +
      `<th class="w-28 px-4 py-3 font-medium">${t('items.taxRate')}</th>` +
      `<th class="w-36 px-4 py-3 text-right font-medium">${t('items.lineTotal')}</th>` +
      (readOnly ? '' : '<th class="w-12 px-2 py-3"></th>') +
      `</tr></thead>` +
      `<tbody class="divide-y divide-[color:var(--tx-border)]">${rows}</tbody></table></div>` +
      (readOnly
        ? ''
        : `<button type="button" data-item-add class="inline-flex h-9 items-center gap-2 rounded-lg border border-themed px-3 text-sm font-medium text-body transition hover:bg-gray-50 dark:hover:bg-gray-800">${icon(
            'plus',
            { size: 16 }
          )}${t('items.add')}</button>`) +
      `<div class="ml-auto w-full max-w-sm space-y-2 rounded-xl border border-themed p-4 text-sm">` +
      `<div class="flex justify-between text-muted"><span>${t('items.subtotal')}</span><span data-subtotal>${fmt(Q.invoiceSubtotal(doc))}</span></div>` +
      `<div class="flex justify-between text-muted"><span>${t('items.taxes')}</span><span data-tax>${fmt(Q.invoiceTax(doc))}</span></div>` +
      `<div class="flex items-center justify-between gap-3 text-muted"><span>${t('items.discount')}</span>` +
      (readOnly
        ? `<span data-discount-readonly>${
            doc.discountKind === 'percentual' ? `${doc.discount}% · ${fmt(discountValue)}` : fmt(discountValue)
          }</span>`
        : `<span class="flex items-center gap-2">` +
          `<input type="number" min="0" step="${doc.discountKind === 'percentual' ? 1 : 10}" value="${doc.discount}" data-discount class="h-8 w-24 rounded-lg border border-themed bg-transparent px-2 text-right text-sm text-body focus-ring"/>` +
          `<select data-discount-kind class="h-8 rounded-lg border border-themed bg-transparent px-2 text-sm text-body focus-ring">` +
          `<option value="valor" ${doc.discountKind === 'valor' ? 'selected' : ''}>${t('items.discountValue')}</option>` +
          `<option value="percentual" ${doc.discountKind === 'percentual' ? 'selected' : ''}>%</option>` +
          `</select></span>`) +
      `</div>` +
      (readOnly
        ? ''
        : `<p class="text-right text-xs text-muted" data-discount-hint>${
            doc.discountKind === 'percentual' && discountValue > 0 ? '−' + fmt(discountValue) : ''
          }</p>`) +
      `<div class="flex justify-between border-t border-themed pt-2 text-base font-bold text-heading"><span>${t('items.total')}</span><span data-total>${fmt(
        Q.invoiceTotal(doc)
      )}</span></div>` +
      `</div></div>`
    );
  }

  /** Atualiza só os nós de total do editor — sem re-render, o cursor fica onde está. */
  function refreshItemsTotals(scope, doc) {
    const root = typeof scope === 'string' ? document.querySelector(scope) : scope;
    if (!root) return;
    const Q = global.Query;
    root.querySelectorAll('[data-line-total]').forEach((cellEl, i) => {
      if (doc.items[i]) cellEl.textContent = fmt(Q.lineTotal(doc.items[i]));
    });
    const set = (sel, value) => {
      const el = root.querySelector(sel);
      if (el) el.textContent = value;
    };
    const discountValue = Q.invoiceDiscountValue(doc);
    set('[data-subtotal]', fmt(Q.invoiceSubtotal(doc)));
    set('[data-tax]', fmt(Q.invoiceTax(doc)));
    set('[data-total]', fmt(Q.invoiceTotal(doc)));
    set('[data-discount-readonly]', doc.discountKind === 'percentual' ? `${doc.discount}% · ${fmt(discountValue)}` : fmt(discountValue));
    set('[data-discount-hint]', doc.discountKind === 'percentual' && discountValue > 0 ? '−' + fmt(discountValue) : '');
  }

  /**
   * Liga o editor de itens. `api`: { get(), setItems(items), setDiscount(v),
   * setDiscountKind(v), rerender() }. Digitar em um campo NÃO re-renderiza:
   * só os totais são reescritos (ver refreshItemsTotals).
   */
  function wireItemsEditor(scope, api) {
    const root = typeof scope === 'string' ? document.querySelector(scope) : scope;
    if (!root) return;

    root.querySelectorAll('[data-item-field]').forEach((el) => {
      el.addEventListener('input', () => {
        const index = Number(el.closest('[data-item-index]').getAttribute('data-item-index'));
        const field = el.getAttribute('data-item-field');
        const items = api.get().items.map((item, i) => {
          if (i !== index) return item;
          if (field === 'quantity') return { ...item, quantity: Math.max(0, Number(el.value) || 0) };
          if (field === 'unitPrice') return { ...item, unitPrice: Math.max(0, Number(el.value) || 0) };
          if (field === 'taxRate') return { ...item, taxRate: Math.min(100, Math.max(0, Number(el.value) || 0)) };
          return { ...item, description: el.value };
        });
        api.setItems(items);
        refreshItemsTotals(root, api.get());
      });
    });

    const discount = root.querySelector('[data-discount]');
    if (discount && api.setDiscount) {
      discount.addEventListener('input', () => {
        api.setDiscount(Math.max(0, Number(discount.value) || 0));
        refreshItemsTotals(root, api.get());
      });
    }

    const kind = root.querySelector('[data-discount-kind]');
    if (kind && api.setDiscountKind) {
      kind.addEventListener('change', () => {
        api.setDiscountKind(kind.value);
        refreshItemsTotals(root, api.get());
      });
    }

    const add = root.querySelector('[data-item-add]');
    if (add) {
      add.addEventListener('click', () => {
        const rate = IV.get().company.defaultTaxRate;
        api.setItems([...api.get().items, { description: '', quantity: 1, unitPrice: 0, taxRate: rate }]);
        api.rerender();
      });
    }

    root.querySelectorAll('[data-item-remove]').forEach((el) => {
      el.addEventListener('click', () => {
        const index = Number(el.getAttribute('data-item-remove'));
        api.setItems(api.get().items.filter((_, i) => i !== index));
        api.rerender();
      });
    });
  }

  // ============================================================
  // Documento imprimível (porta de components/iv/InvoiceDocument)
  // A classe `print-document` é o alvo do @media print em app.css.
  // ============================================================
  function invoiceDocument(invoice, client, company) {
    const Q = global.Query;
    const subtotal = Q.invoiceSubtotal(invoice);
    const tax = Q.invoiceTax(invoice);
    const discount = Q.invoiceDiscountValue(invoice);
    const total = Q.invoiceTotal(invoice);
    const paid = Q.invoicePaid(invoice);
    const balance = Q.invoiceBalance(invoice);
    const status = Q.effectiveStatus(invoice);

    const items = invoice.items
      .map(
        (item) =>
          `<tr>` +
          `<td class="py-3 pr-4 text-body">${esc(item.description)}</td>` +
          `<td class="py-3 pr-4 text-right text-body">${item.quantity}</td>` +
          `<td class="py-3 pr-4 text-right text-body">${fmt(item.unitPrice)}</td>` +
          `<td class="py-3 pr-4 text-right text-muted">${item.taxRate}%</td>` +
          `<td class="py-3 text-right font-medium text-heading">${fmt(Q.lineTotal(item))}</td>` +
          `</tr>`
      )
      .join('');

    const footer =
      invoice.terms || invoice.notes
        ? `<footer class="space-y-3 border-t border-themed pt-6 text-xs text-muted">` +
          (invoice.terms
            ? `<div><p class="font-semibold text-heading">${t('document.terms')}</p><p class="mt-1">${esc(invoice.terms)}</p></div>`
            : '') +
          (invoice.notes
            ? `<div><p class="font-semibold text-heading">${t('document.notes')}</p><p class="mt-1">${esc(invoice.notes)}</p></div>`
            : '') +
          `<p class="flex items-center gap-1.5 pt-2">${icon('shield-check', { size: 13 })}${t('document.legalNote')}</p>` +
          `</footer>`
        : '';

    return (
      `<article class="print-document surface-card rounded-2xl border p-6 shadow-theme-sm md:p-10">` +
      // Cabeçalho: emitente × número
      `<header class="flex flex-col gap-6 border-b border-themed pb-6 sm:flex-row sm:items-start sm:justify-between">` +
      `<div class="flex gap-4">` +
      `<span class="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-brand-500 text-lg font-bold text-white">${esc(company.logoText)}</span>` +
      `<div><h2 class="text-lg font-bold text-heading">${esc(company.name)}</h2>` +
      `<p class="text-xs text-muted">${esc(company.legalName)}</p>` +
      `<p class="mt-1 text-xs text-muted">${t('document.taxId')}: ${esc(company.taxId)}</p>` +
      `<p class="max-w-xs text-xs text-muted">${esc(company.address)}</p>` +
      `<p class="text-xs text-muted">${esc(company.email)} · ${esc(company.phone)}</p></div>` +
      `</div>` +
      `<div class="sm:text-right">` +
      `<p class="text-xs uppercase tracking-wider text-muted">${t('document.invoice')}</p>` +
      `<p class="text-title-sm font-bold text-heading">${esc(invoice.number)}</p>` +
      `<div class="mt-2 flex sm:justify-end">${invoicePill(status)}</div>` +
      `<dl class="mt-3 space-y-0.5 text-xs text-muted">` +
      `<div class="flex gap-2 sm:justify-end"><dt>${t('document.issuedAt')}:</dt><dd class="font-medium text-body">${fmtDate(invoice.issuedAt)}</dd></div>` +
      `<div class="flex gap-2 sm:justify-end"><dt>${t('document.dueAt')}:</dt><dd class="font-medium text-body">${fmtDate(invoice.dueAt)}</dd></div>` +
      `</dl></div></header>` +
      // Tomador
      `<section class="grid gap-6 border-b border-themed py-6 sm:grid-cols-2">` +
      `<div><p class="text-xs uppercase tracking-wider text-muted">${t('document.billTo')}</p>` +
      `<p class="mt-2 text-base font-semibold text-heading">${esc(client ? client.name : '—')}</p>` +
      (client
        ? `<p class="text-xs text-muted">${esc(client.legalName)}</p>` +
          `<p class="mt-1 text-xs text-muted">${t('document.taxId')}: ${esc(client.taxId)}</p>` +
          `<p class="max-w-xs text-xs text-muted">${esc(client.address)}</p>` +
          `<p class="text-xs text-muted">${esc(client.email)} · ${esc(client.phone)}</p>`
        : '') +
      `</div>` +
      `<div class="sm:text-right"><p class="text-xs uppercase tracking-wider text-muted">${t('document.amountDue')}</p>` +
      `<p class="mt-2 text-title-sm font-bold text-heading">${fmt(balance)}</p>` +
      (paid > 0 && balance > 0
        ? `<p class="mt-1 text-xs text-warning-600 dark:text-warning-500">${t('document.partialNotice', {
            paid: fmt(paid),
            total: fmt(total),
          })}</p>`
        : '') +
      (balance === 0 && total > 0 ? `<p class="mt-1 text-xs text-success-600">${t('document.settled')}</p>` : '') +
      `</div></section>` +
      // Itens
      `<section class="py-6"><div class="overflow-x-auto"><table class="w-full min-w-[560px] text-sm">` +
      `<thead><tr class="border-b border-themed text-left text-xs uppercase tracking-wider text-muted">` +
      `<th class="py-2 pr-4 font-medium">${t('items.description')}</th>` +
      `<th class="w-20 py-2 pr-4 text-right font-medium">${t('items.quantity')}</th>` +
      `<th class="w-32 py-2 pr-4 text-right font-medium">${t('items.unitPrice')}</th>` +
      `<th class="w-20 py-2 pr-4 text-right font-medium">${t('items.taxRate')}</th>` +
      `<th class="w-36 py-2 text-right font-medium">${t('items.lineTotal')}</th>` +
      `</tr></thead><tbody class="divide-y divide-[color:var(--tx-border)]">${items}</tbody></table></div>` +
      `<div class="mt-6 flex justify-end"><dl class="w-full max-w-xs space-y-2 text-sm">` +
      `<div class="flex justify-between text-muted"><dt>${t('items.subtotal')}</dt><dd>${fmt(subtotal)}</dd></div>` +
      `<div class="flex justify-between text-muted"><dt>${t('items.taxes')}</dt><dd>${fmt(tax)}</dd></div>` +
      (discount > 0
        ? `<div class="flex justify-between text-muted"><dt>${t('items.discount')}${
            invoice.discountKind === 'percentual' ? ` (${invoice.discount}%)` : ''
          }</dt><dd>−${fmt(discount)}</dd></div>`
        : '') +
      `<div class="flex justify-between border-t border-themed pt-2 text-base font-bold text-heading"><dt>${t('items.total')}</dt><dd>${fmt(total)}</dd></div>` +
      (paid > 0
        ? `<div class="flex justify-between text-success-600"><dt>${t('document.paid')}</dt><dd>−${fmt(paid)}</dd></div>` +
          `<div class="flex justify-between border-t border-themed pt-2 font-semibold text-heading"><dt>${t('document.balance')}</dt><dd>${fmt(balance)}</dd></div>`
        : '') +
      `</dl></div></section>` +
      footer +
      `</article>`
    );
  }

  // ============================================================
  // Modal do editor de documento (porta de components/iv/DocumentEditorModal)
  // O rascunho vive em IV.Editor ("iv-editor"), então sobrevive ao re-render.
  // ============================================================
  const EDITOR_MODAL_ID = 'iv-editor-modal';

  /** `YYYY-MM-DD` do input date → ISO no meio-dia (evita virar o dia por fuso). */
  function toIso(date) {
    return new Date(`${date}T12:00:00`).toISOString();
  }

  function documentEditorModal() {
    const ed = IV.Editor.get();
    if (!ed.open || !ed.draft) return modal(EDITOR_MODAL_ID, { size: 'xl' });

    const draft = ed.draft;
    const st = IV.get();
    const isInvoice = draft.kind === 'fatura';
    const control = 'h-11 w-full rounded-lg border border-themed bg-transparent px-3 text-sm text-body focus-ring';

    const clientOptions =
      `<option value="">${t('editor.pickClient')}</option>` +
      st.clients
        .map((c) => `<option value="${c.id}" ${c.id === draft.clientId ? 'selected' : ''}>${esc(c.name)}</option>`)
        .join('');

    const body =
      `<div class="space-y-5">` +
      `<div class="grid gap-4 sm:grid-cols-3">` +
      `<div><label class="mb-1.5 block text-sm font-medium text-heading">${t('editor.client')}</label>` +
      `<select data-editor-client class="${control}">${clientOptions}</select></div>` +
      `<div><label class="mb-1.5 block text-sm font-medium text-heading">${t('editor.issuedAt')}</label>` +
      `<input type="date" data-editor-field="issuedAt" value="${esc(draft.issuedAt)}" class="${control}"/></div>` +
      `<div><label class="mb-1.5 block text-sm font-medium text-heading">${
        isInvoice ? t('editor.dueAt') : t('editor.validUntil')
      }</label><input type="date" data-editor-field="endAt" value="${esc(draft.endAt)}" class="${control}"/></div>` +
      `</div>` +
      itemsEditor(draft) +
      `<div class="grid gap-4 sm:grid-cols-2">` +
      `<div><label class="mb-1.5 block text-sm font-medium text-heading">${t('editor.notes')}</label>` +
      `<textarea rows="3" data-editor-field="notes" placeholder="${esc(t('editor.notesPlaceholder'))}" class="w-full rounded-lg border border-themed bg-transparent px-3 py-2 text-sm text-body focus-ring">${esc(
        draft.notes
      )}</textarea></div>` +
      (isInvoice
        ? `<div><label class="mb-1.5 block text-sm font-medium text-heading">${t('editor.terms')}</label>` +
          `<textarea rows="3" data-editor-field="terms" placeholder="${esc(t('editor.termsPlaceholder'))}" class="w-full rounded-lg border border-themed bg-transparent px-3 py-2 text-sm text-body focus-ring">${esc(
            draft.terms
          )}</textarea></div>`
        : '') +
      `</div></div>`;

    const footer =
      `<button type="button" data-editor-cancel class="h-10 rounded-lg border border-themed px-4 text-sm font-medium text-body transition hover:bg-gray-50 dark:hover:bg-gray-800">${t('common.cancel')}</button>` +
      `<button type="button" data-editor-save class="h-10 rounded-lg bg-brand-500 px-4 text-sm font-medium text-white transition hover:bg-brand-600">${t('common.save')}</button>`;

    const title = isInvoice
      ? draft.id
        ? t('editor.editInvoice')
        : t('editor.newInvoice')
      : draft.id
        ? t('editor.editQuote')
        : t('editor.newQuote');

    return modal(EDITOR_MODAL_ID, {
      size: 'xl',
      title,
      subtitle: t('editor.subtitle', { total: fmt(global.Query.invoiceTotal(draft)) }),
      body,
      footer,
    });
  }

  /** Liga o modal do editor. `onSaved(id, kind)` é opcional. */
  function wireDocumentEditor(onSaved) {
    const ed = IV.Editor.get();
    const root = document.getElementById(EDITOR_MODAL_ID);
    if (!root) return;
    if (!ed.open || !ed.draft) {
      closeModal(EDITOR_MODAL_ID);
      return;
    }
    openModal(EDITOR_MODAL_ID);

    const rerender = () => typeof global.renderPage === 'function' && global.renderPage();

    const clientSel = root.querySelector('[data-editor-client]');
    if (clientSel) {
      clientSel.addEventListener('change', () => {
        const id = Number(clientSel.value);
        IV.Editor.setClient(id, IV.clientById(id));
        rerender();
      });
    }

    root.querySelectorAll('[data-editor-field]').forEach((el) => {
      el.addEventListener('input', () => IV.Editor.setField(el.getAttribute('data-editor-field'), el.value));
    });

    wireItemsEditor(root.querySelector('[data-items-editor]'), {
      get: () => IV.Editor.get().draft,
      setItems: (items) => IV.Editor.setItems(items),
      setDiscount: (v) => IV.Editor.setField('discount', v),
      setDiscountKind: (v) => IV.Editor.setField('discountKind', v),
      rerender,
    });

    const cancel = root.querySelector('[data-editor-cancel]');
    if (cancel) cancel.addEventListener('click', () => { IV.Editor.discard(); rerender(); });

    root.querySelectorAll('[data-modal-close]').forEach((el) =>
      el.addEventListener('click', () => { IV.Editor.discard(); rerender(); })
    );

    const save = root.querySelector('[data-editor-save]');
    if (save) {
      save.addEventListener('click', () => {
        const draft = IV.Editor.get().draft;
        if (!draft) return;
        if (!draft.clientId) {
          notify(t('editor.pickClient'), 'error');
          return;
        }
        if (draft.items.length === 0 || draft.items.every((i) => !i.description.trim())) {
          notify(t('editor.needItems'), 'error');
          return;
        }
        let savedId = draft.id;
        if (draft.kind === 'fatura') {
          const payload = {
            clientId: draft.clientId,
            issuedAt: toIso(draft.issuedAt),
            dueAt: toIso(draft.endAt),
            items: draft.items,
            discount: draft.discount,
            discountKind: draft.discountKind,
            notes: draft.notes,
            terms: draft.terms,
          };
          if (draft.id) {
            IV.updateInvoice(draft.id, payload);
            notify(t('editor.savedInvoice'), 'success');
          } else {
            const created = IV.addInvoice({ ...payload, recurringId: null, status: 'rascunho' });
            savedId = created.id;
            notify(t('editor.createdInvoice', { number: created.number }), 'success');
          }
        } else {
          const payload = {
            clientId: draft.clientId,
            issuedAt: toIso(draft.issuedAt),
            validUntil: toIso(draft.endAt),
            items: draft.items,
            discount: draft.discount,
            discountKind: draft.discountKind,
            notes: draft.notes,
          };
          if (draft.id) {
            IV.updateQuote(draft.id, payload);
            notify(t('editor.savedQuote'), 'success');
          } else {
            const created = IV.addQuote({ ...payload, status: 'rascunho' });
            savedId = created.id;
            notify(t('editor.createdQuote', { number: created.number }), 'success');
          }
        }
        const kind = draft.kind;
        IV.Editor.discard();
        if (typeof onSaved === 'function') onSaved(savedId, kind);
        rerender();
      });
    }
  }

  // ============================================================
  // Modal de pagamento (porta de components/iv/PaymentModal)
  // ============================================================
  const PAYMENT_MODAL_ID = 'iv-payment-modal';
  const METHODS = ['pix', 'transferencia', 'cartao', 'boleto'];

  function paymentModal(invoice) {
    if (!invoice) return modal(PAYMENT_MODAL_ID, { size: 'md' });
    const Q = global.Query;
    const balance = Q.invoiceBalance(invoice);
    const control = 'h-11 w-full rounded-lg border border-themed bg-transparent px-3 text-sm text-body focus-ring';
    const today = new Date().toISOString().slice(0, 10);

    const body =
      `<div class="space-y-4">` +
      `<div class="rounded-xl border border-themed bg-gray-50 p-4 text-sm dark:bg-gray-900/40">` +
      `<div class="flex justify-between text-muted"><span>${t('document.balance')}</span>` +
      `<span class="font-semibold text-heading">${fmt(balance)}</span></div></div>` +
      `<div><label class="mb-1.5 block text-sm font-medium text-heading">${t('payments.amount')}</label>` +
      `<input type="number" min="0" max="${balance}" step="10" value="${balance}" data-pay-amount class="${control}"/>` +
      `<div class="mt-2 flex flex-wrap gap-2">` +
      [0.25, 0.5, 1]
        .map(
          (fraction) =>
            `<button type="button" data-pay-fraction="${fraction}" class="rounded-lg border border-themed px-2.5 py-1 text-xs font-medium text-muted transition hover:text-brand-600">${
              fraction === 1 ? t('payments.full') : `${fraction * 100}%`
            }</button>`
        )
        .join('') +
      `</div>` +
      `<p class="mt-2 hidden items-center gap-1.5 text-xs text-warning-600 dark:text-warning-500" data-pay-hint>${icon('info', {
        size: 13,
      })}<span data-pay-hint-text></span></p>` +
      `</div>` +
      `<div class="grid gap-4 sm:grid-cols-2">` +
      `<div><label class="mb-1.5 block text-sm font-medium text-heading">${t('payments.date')}</label>` +
      `<input type="date" value="${today}" data-pay-date class="${control}"/></div>` +
      `<div><label class="mb-1.5 block text-sm font-medium text-heading">${t('payments.method')}</label>` +
      `<select data-pay-method class="${control}">${METHODS.map((m) => `<option value="${m}">${t('paymentMethods.' + m)}</option>`).join('')}</select></div>` +
      `</div>` +
      `<div><label class="mb-1.5 block text-sm font-medium text-heading">${t('payments.note')}</label>` +
      `<input data-pay-note placeholder="${esc(t('payments.notePlaceholder'))}" class="${control}"/></div>` +
      `</div>`;

    const footer =
      `<button type="button" data-modal-close class="h-10 rounded-lg border border-themed px-4 text-sm font-medium text-body transition hover:bg-gray-50 dark:hover:bg-gray-800">${t('common.cancel')}</button>` +
      `<button type="button" data-pay-confirm class="h-10 rounded-lg bg-brand-500 px-4 text-sm font-medium text-white transition hover:bg-brand-600 disabled:opacity-50">${t('payments.confirm')}</button>`;

    return modal(PAYMENT_MODAL_ID, {
      size: 'md',
      title: t('payments.title'),
      subtitle: t('payments.subtitle', { number: invoice.number, total: fmt(Q.invoiceTotal(invoice)) }),
      body,
      footer,
    });
  }

  /** Liga o modal de pagamento. `onConfirm({at, amount, method, note})`, `onClose()`. */
  function wirePaymentModal(invoice, onConfirm, onClose) {
    const root = document.getElementById(PAYMENT_MODAL_ID);
    if (!root) return;
    if (!invoice) {
      closeModal(PAYMENT_MODAL_ID);
      return;
    }
    openModal(PAYMENT_MODAL_ID);

    const Q = global.Query;
    const balance = Q.invoiceBalance(invoice);
    const amountEl = root.querySelector('[data-pay-amount]');
    const hintEl = root.querySelector('[data-pay-hint]');
    const hintText = root.querySelector('[data-pay-hint-text]');
    const confirmEl = root.querySelector('[data-pay-confirm]');

    function currentValue() {
      return Q.round2(Math.min(Math.max(Number(amountEl.value) || 0, 0), balance));
    }
    function refresh() {
      const value = currentValue();
      const remaining = Q.round2(balance - value);
      confirmEl.disabled = value <= 0;
      if (remaining > 0 && value > 0) {
        hintEl.classList.remove('hidden');
        hintEl.classList.add('flex');
        hintText.textContent = t('payments.partialHint', { remaining: fmt(remaining) });
      } else {
        hintEl.classList.add('hidden');
        hintEl.classList.remove('flex');
      }
    }

    amountEl.addEventListener('input', refresh);
    root.querySelectorAll('[data-pay-fraction]').forEach((el) =>
      el.addEventListener('click', () => {
        amountEl.value = Q.round2(balance * Number(el.getAttribute('data-pay-fraction')));
        refresh();
      })
    );
    root.querySelectorAll('[data-modal-close]').forEach((el) =>
      el.addEventListener('click', () => typeof onClose === 'function' && onClose())
    );
    confirmEl.addEventListener('click', () => {
      const value = currentValue();
      if (value <= 0) return;
      onConfirm({
        at: new Date(`${root.querySelector('[data-pay-date]').value}T12:00:00`).toISOString(),
        amount: value,
        method: root.querySelector('[data-pay-method]').value,
        note: root.querySelector('[data-pay-note]').value,
      });
      if (typeof onClose === 'function') onClose();
    });
    refresh();
  }

  // ============================================================
  // ApexCharts (porta de components/ui/ApexChart) — CDN, opcional
  // ============================================================
  function apexChart(elOrId, cfg) {
    const el = typeof elOrId === 'string' ? document.getElementById(elOrId) : elOrId;
    if (!el || typeof ApexCharts === 'undefined') return null;
    const dark = UIState.get().darkMode;
    const fg = dark ? '#98a2b3' : '#667085';
    const grid = dark ? '#1f2937' : '#e4e7ec';
    const options = cfg.options || {};
    const merged = Object.assign(
      {
        chart: Object.assign(
          { type: cfg.type, height: cfg.height || 300, fontFamily: 'Outfit, sans-serif', foreColor: fg, toolbar: { show: false }, zoom: { enabled: false } },
          options.chart
        ),
        series: cfg.series,
        colors: options.colors || ['#465fff', '#12b76a', '#f79009', '#f04438', '#0ba5ec'],
        grid: Object.assign({ borderColor: grid, strokeDashArray: 4 }, options.grid),
        tooltip: Object.assign({ theme: dark ? 'dark' : 'light' }, options.tooltip),
        legend: Object.assign({ labels: { colors: fg } }, options.legend),
        dataLabels: Object.assign({ enabled: false }, options.dataLabels),
        stroke: Object.assign({ curve: 'smooth', width: 2 }, options.stroke),
      },
      options
    );
    merged.chart.type = cfg.type;
    merged.chart.height = cfg.height || 300;
    merged.series = cfg.series;
    const chart = new ApexCharts(el, merged);
    chart.render();
    return chart;
  }

  // ============================================================
  // Chrome: navbar / footer do site público
  // ============================================================
  const PUBLIC_LINKS = [
    { href: 'recursos.html', key: 'nav.features' },
    { href: 'precos.html', key: 'nav.pricing' },
    { href: 'sobre.html', key: 'nav.about' },
    { href: 'contato.html', key: 'nav.contact' },
  ];

  function brandLogo(size, rounded) {
    return `<span class="flex h-9 w-9 items-center justify-center ${
      rounded || 'rounded-xl'
    } bg-brand-500 text-white shadow-theme-md">${icon('receipt', { size: size || 18 })}</span>`;
  }

  function renderPublicNavbar() {
    const dark = UIState.get().darkMode;
    const isAuth = Auth.isAuthenticated();
    const page = here();
    const links = PUBLIC_LINKS.map(
      (l) =>
        `<a href="${l.href}" class="rounded-lg px-3 py-2 text-sm font-medium transition ${
          l.href === page ? 'text-brand-600 dark:text-brand-400' : 'text-body hover:text-heading'
        }">${t(l.key)}</a>`
    ).join('');
    const mobileLinks = PUBLIC_LINKS.map(
      (l) =>
        `<a href="${l.href}" class="rounded-lg px-3 py-2.5 text-sm font-medium text-body hover:bg-gray-50 dark:hover:bg-gray-800">${t(l.key)}</a>`
    ).join('');

    const account = isAuth
      ? `<a href="app.html" class="hidden h-10 items-center rounded-lg bg-brand-500 px-4 text-sm font-medium text-white transition hover:bg-brand-600 sm:flex">${t('nav.dashboard')}</a>`
      : `<a href="login.html" class="hidden h-10 items-center rounded-lg border border-themed px-4 text-sm font-medium text-body transition hover:bg-gray-50 dark:hover:bg-gray-800 sm:flex">${t(
          'nav.login'
        )}</a><a href="registro.html" class="hidden h-10 items-center gap-2 rounded-lg bg-brand-500 px-4 text-sm font-medium text-white transition hover:bg-brand-600 sm:flex">${icon(
          'rocket',
          { size: 16 }
        )}${t('nav.trial')}</a>`;

    const mobileAccount = isAuth
      ? `<a href="app.html" class="flex h-11 items-center justify-center rounded-lg bg-brand-500 text-sm font-medium text-white">${t('nav.dashboard')}</a>`
      : `<a href="login.html" class="flex h-11 items-center justify-center rounded-lg border border-themed text-sm font-medium text-body">${t(
          'nav.login'
        )}</a><a href="registro.html" class="flex h-11 items-center justify-center rounded-lg bg-brand-500 text-sm font-medium text-white">${t('nav.trial')}</a>`;

    return (
      `<div class="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">` +
      `<a href="index.html" class="flex items-center gap-2.5">${brandLogo()}<span class="text-lg font-bold text-heading">${t('brand')}</span></a>` +
      `<nav class="ml-6 hidden items-center gap-1 lg:flex">${links}</nav>` +
      `<div class="ml-auto flex items-center gap-1 sm:gap-2">` +
      `<button type="button" data-action="toggle-dark" aria-label="${t('common.theme')}" class="flex h-10 w-10 items-center justify-center rounded-full border border-themed text-body transition hover:bg-gray-50 dark:hover:bg-gray-800">${icon(
        dark ? 'sun' : 'moon',
        { size: 18 }
      )}</button>` +
      langDropdown('tx-lang') +
      account +
      `<button type="button" data-action="toggle-mobile-menu" class="flex h-10 w-10 items-center justify-center rounded-lg text-body lg:hidden" aria-label="Menu">${icon('menu', { size: 22 })}</button>` +
      `</div></div>` +
      `<div id="tx-mobile-menu" class="surface-card border-t border-themed lg:hidden hidden"><nav class="flex flex-col gap-1 px-4 py-4 sm:px-6">${mobileLinks}<div class="mt-2 flex flex-col gap-2 border-t border-themed pt-3">${mobileAccount}</div></nav></div>`
    );
  }

  function renderPublicFooter() {
    const year = new Date().getFullYear();
    const links = [
      ['nav.features', 'recursos.html'],
      ['nav.pricing', 'precos.html'],
      ['nav.about', 'sobre.html'],
      ['nav.contact', 'contato.html'],
      ['nav.login', 'login.html'],
    ]
      .map(([key, href]) => `<a href="${href}" class="text-muted transition hover:text-brand-600">${t(key)}</a>`)
      .join('');
    const legal = ['landing.footer.docs', 'landing.footer.help', 'landing.footer.privacy']
      .map((key) => `<a href="#" class="hover:text-brand-500">${t(key)}</a>`)
      .join('');
    return (
      `<div class="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">` +
      `<div class="flex flex-col items-start justify-between gap-8 lg:flex-row">` +
      `<div class="max-w-sm"><a href="index.html" class="flex items-center gap-2.5">${brandLogo()}<span class="text-lg font-bold text-heading">${t(
        'brand'
      )}</span></a><p class="mt-4 text-sm text-muted">${t('landing.footer.tagline')}</p></div>` +
      `<div class="flex flex-wrap gap-x-10 gap-y-2 text-sm">${links}</div>` +
      `</div>` +
      `<div class="mt-10 flex flex-col items-center justify-between gap-4 border-t border-themed pt-6 sm:flex-row"><p class="text-xs text-muted">© ${year} ${t(
        'brand'
      )}. ${t('landing.footer.rights')}</p><div class="flex items-center gap-4 text-xs text-muted">${legal}</div></div>` +
      `</div>`
    );
  }

  // ============================================================
  // Chrome: sidebar / topbar / rodapé do app
  // ============================================================
  const APP_SECTIONS = [
    {
      titleKey: 'appNav.billing',
      items: [
        { href: 'app.html', labelKey: 'appNav.dashboard', icon: 'dashboard' },
        { href: 'app-faturas.html', labelKey: 'appNav.invoices', icon: 'receipt' },
        { href: 'app-orcamentos.html', labelKey: 'appNav.quotes', icon: 'file-text' },
        { href: 'app-recorrentes.html', labelKey: 'appNav.recurring', icon: 'refresh-cw' },
      ],
    },
    {
      titleKey: 'appNav.finance',
      items: [
        { href: 'app-clientes.html', labelKey: 'appNav.clients', icon: 'users' },
        { href: 'app-despesas.html', labelKey: 'appNav.expenses', icon: 'banknote' },
        { href: 'app-relatorios.html', labelKey: 'appNav.reports', icon: 'bar-chart' },
      ],
    },
    {
      titleKey: 'appNav.settingsSection',
      items: [{ href: 'app-configuracoes.html', labelKey: 'appNav.settings', icon: 'settings' }],
    },
  ];

  function renderSidebar() {
    const collapsed = UIState.get().sidebarCollapsed;
    const page = here();
    const navCls = (active) =>
      `group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${collapsed ? 'justify-center' : ''} ${
        active ? 'is-sidebar-active' : 'is-sidebar-inactive'
      }`;

    const sections = APP_SECTIONS.map(
      (section) =>
        `<nav>${
          collapsed ? '' : `<h3 class="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider">${t(section.titleKey)}</h3>`
        }<ul class="flex flex-col gap-1">${section.items
          .map((item) => {
            const active = item.href === page;
            return `<li><a href="${item.href}" class="${navCls(active)}" ${
              collapsed ? `title="${t(item.labelKey)}"` : ''
            }>${icon(item.icon, { size: 20 })}${collapsed ? '' : `<span class="flex-1">${t(item.labelKey)}</span>`}</a></li>`;
          })
          .join('')}</ul></nav>`
    ).join('');

    return (
      `<div class="flex items-center pt-7 pb-6 ${collapsed ? 'justify-center' : 'justify-between'}">` +
      `<a href="app.html" class="flex items-center gap-2.5"><span class="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500 text-white shadow-theme-sm">${icon(
        'receipt',
        { size: 18 }
      )}</span>${collapsed ? '' : `<span data-brand-text class="text-lg font-semibold">${t('brand')}</span>`}</a>` +
      (collapsed
        ? ''
        : `<button type="button" data-action="toggle-sidebar" class="is-sidebar-inactive hidden h-8 w-8 items-center justify-center rounded-lg border border-themed lg:flex" title="${t(
            'appNav.collapse'
          )}">${icon('chevron-right', { size: 14, className: 'rotate-180' })}</button>`) +
      `</div>` +
      `<div class="flex flex-col gap-5 overflow-y-auto no-scrollbar pb-4">${sections}</div>` +
      `<div class="mt-auto space-y-3 border-t border-themed py-4">` +
      (collapsed
        ? ''
        : `<div class="rounded-xl bg-brand-50 p-4 dark:bg-brand-500/10"><p class="text-xs font-medium text-muted">${t(
            'appNav.proTitle'
          )}</p><p class="mt-0.5 text-sm font-semibold text-heading">${t(
            'appNav.proDesc'
          )}</p><a href="app-faturas.html" class="mt-3 flex h-9 w-full items-center justify-center rounded-lg bg-brand-500 text-xs font-medium text-white transition hover:bg-brand-600">${t(
            'appNav.openInvoices'
          )}</a></div>`) +
      `<button type="button" data-action="logout" class="${navCls(false)} w-full" ${
        collapsed ? `title="${t('appNav.logout')}"` : ''
      }>${icon('logout', { size: 20 })}${collapsed ? '' : `<span>${t('appNav.logout')}</span>`}</button>` +
      `</div>`
    );
  }

  const NOTIFICATIONS = [
    { id: 1, key: 'paymentReceived', name: 'CC-0017', timeKey: 'time.minutes', timeCount: 6, read: false },
    { id: 2, key: 'invoiceOverdue', name: 'CC-0018', timeKey: 'time.hours', timeCount: 3, read: false },
    { id: 3, key: 'quoteAccepted', name: 'ORC-0004', timeKey: 'time.days', timeCount: 1, read: true },
  ];

  function renderTopbar() {
    const dark = UIState.get().darkMode;
    const user = Auth.getUser();
    const notifs = NOTIFICATIONS.map(
      (n) =>
        `<li class="flex gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800"><span class="mt-1 flex h-2 w-2 shrink-0 rounded-full ${
          n.read ? 'bg-gray-300' : 'bg-brand-500'
        }"></span><div class="flex-1"><p class="text-sm font-medium text-heading">${t('notifications.' + n.key, {
          name: n.name,
        })}</p><p class="text-xs text-muted">${t(n.timeKey, { count: n.timeCount })}</p></div></li>`
    ).join('');

    return (
      `<div class="flex flex-grow items-center justify-between gap-4 px-4 py-3 md:px-6 2xl:px-10">` +
      `<div class="flex items-center gap-3">` +
      `<button type="button" data-action="toggle-sidebar-responsive" class="flex h-10 w-10 items-center justify-center rounded-lg border border-themed text-muted hover:bg-gray-50 dark:hover:bg-gray-800" aria-label="Toggle sidebar">${icon(
        'menu',
        { size: 20 }
      )}</button>` +
      `<a href="app-faturas.html" class="hidden h-10 items-center gap-2 rounded-lg bg-brand-500 px-4 text-sm font-medium text-white transition hover:bg-brand-600 sm:flex">${icon(
        'plus',
        { size: 18 }
      )}${t('appNav.newInvoice')}</a>` +
      `</div>` +
      `<div class="flex items-center gap-2">` +
      langDropdown('tx-app-lang') +
      `<button type="button" data-action="toggle-dark" class="flex h-10 w-10 items-center justify-center rounded-full border border-themed text-muted hover:bg-gray-50 dark:hover:bg-gray-800" aria-label="${t(
        'common.theme'
      )}">${icon(dark ? 'sun' : 'moon', { size: 18 })}</button>` +
      `<div class="relative" id="tx-notif"><button type="button" data-action="toggle-menu" data-menu="#tx-notif-menu" class="relative flex h-10 w-10 items-center justify-center rounded-full border border-themed text-muted hover:bg-gray-50 dark:hover:bg-gray-800" aria-label="${t(
        'appNav.notifications'
      )}">${icon('bell', {
        size: 18,
      })}<span class="absolute top-1.5 right-1.5 flex h-2 w-2"><span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-error-400 opacity-75"></span><span class="relative inline-flex h-2 w-2 rounded-full bg-error-500"></span></span></button>` +
      `<div id="tx-notif-menu" class="surface-card absolute right-0 mt-3 w-80 rounded-xl border shadow-theme-lg hidden z-50"><div class="flex items-center justify-between border-b border-themed px-4 py-3"><p class="text-sm font-semibold text-heading">${t(
        'appNav.notifications'
      )}</p></div><ul class="max-h-72 divide-y divide-[color:var(--tx-border)] overflow-y-auto">${notifs}</ul></div></div>` +
      `<div class="relative" id="tx-profile"><button type="button" data-action="toggle-menu" data-menu="#tx-profile-menu" class="ml-1 flex items-center gap-3"><span class="hidden text-right lg:block"><span class="block text-sm font-medium text-heading">${esc(
        (user && user.name) || t('common.guest')
      )}</span><span class="block text-xs text-muted">${esc((user && user.role) || '—')}</span></span>${avatar(
        (user && user.name) || '?',
        'md'
      )}${icon('chevron-down', { size: 16, className: 'text-muted' })}</button>` +
      `<div id="tx-profile-menu" class="surface-card absolute right-0 mt-3 w-56 rounded-xl border shadow-theme-lg hidden z-50"><div class="border-b border-themed px-4 py-3"><p class="text-sm font-medium text-heading">${esc(
        (user && user.name) || t('common.guest')
      )}</p><p class="text-xs text-muted">${esc((user && user.email) || '')}</p></div>` +
      `<ul class="py-1"><li><a href="app-configuracoes.html" class="flex items-center gap-2 px-4 py-2 text-sm text-body hover:bg-gray-50 dark:hover:bg-gray-800">${icon(
        'settings',
        { size: 16 }
      )} ${t('appNav.settings')}</a></li></ul>` +
      `<div class="border-t border-themed py-1"><button type="button" data-action="logout" class="flex w-full items-center gap-2 px-4 py-2 text-sm text-error-600 hover:bg-error-50 dark:hover:bg-error-500/10">${icon(
        'logout',
        { size: 16 }
      )} ${t('appNav.logout')}</button></div></div></div>` +
      `</div></div>`
    );
  }

  function renderAppFooter() {
    const year = new Date().getFullYear();
    const legal = ['landing.footer.docs', 'landing.footer.help', 'landing.footer.privacy']
      .map((key) => `<a href="#" class="hover:text-brand-500">${t(key)}</a>`)
      .join('');
    return (
      `<div class="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">` +
      `<p class="text-xs text-muted">© ${year} ${t('brand')}. ${t('landing.footer.rights')}</p>` +
      `<div class="flex items-center gap-4 text-xs text-muted">${legal}</div></div>`
    );
  }

  // ============================================================
  // Cookie banner + toasts
  // ============================================================
  function renderCookieBanner() {
    const ui = UIState.get();
    if (!ui.showCookieBanner) return '';
    return (
      `<div class="fixed inset-x-0 bottom-0 z-[60] p-4"><div class="surface-card mx-auto flex max-w-3xl flex-col gap-4 rounded-2xl border p-5 shadow-theme-xl sm:flex-row sm:items-center">` +
      `<span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-500 dark:bg-brand-500/15">${icon('cookie', { size: 22 })}</span>` +
      `<div class="flex-1"><p class="text-sm font-semibold text-heading">${t('cookie.title')}</p>` +
      `<p class="mt-0.5 text-xs text-muted">${t('cookie.desc')} <a href="#" class="font-medium text-brand-500 hover:text-brand-600">${t(
        'cookie.policy'
      )}</a></p></div>` +
      `<div class="flex shrink-0 items-center gap-2">` +
      `<button type="button" data-action="decline-cookies" class="focus-ring rounded-lg border border-themed px-4 py-2 text-sm font-medium text-body transition hover:bg-gray-50 dark:hover:bg-gray-800">${t(
        'cookie.decline'
      )}</button>` +
      `<button type="button" data-action="accept-cookies" class="focus-ring rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-600">${t(
        'cookie.accept'
      )}</button>` +
      `</div></div></div>`
    );
  }
  function updateCookieBanner() {
    const el = document.getElementById('tx-cookie');
    if (el) el.innerHTML = renderCookieBanner();
  }

  const TOAST_STYLES = {
    success: { border: 'border-success-200 dark:border-success-500/30', icon: 'check', color: 'text-success-500' },
    error: { border: 'border-error-200 dark:border-error-500/30', icon: 'x', color: 'text-error-500' },
    warning: { border: 'border-warning-200 dark:border-warning-500/30', icon: 'bell', color: 'text-warning-500' },
    info: { border: 'border-blue-light-200 dark:border-blue-light-500/30', icon: 'bell', color: 'text-blue-light-500' },
  };
  function notify(message, type, duration) {
    type = type || 'info';
    duration = duration || 4000;
    const s = TOAST_STYLES[type] || TOAST_STYLES.info;
    const stack = document.getElementById('tx-toast-stack');
    if (!stack) {
      console.log('[notify]', message);
      return;
    }
    const el = document.createElement('div');
    el.className =
      'pointer-events-auto flex w-80 items-start gap-3 rounded-lg border bg-white p-4 shadow-theme-md dark:bg-gray-dark ' + s.border;
    el.innerHTML =
      '<span class="' + s.color + '">' + icon(s.icon, { size: 20 }) + '</span>' +
      '<div class="flex-1"><p class="text-sm font-medium text-heading">' + esc(message) + '</p></div>' +
      '<button type="button" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">' + icon('x', { size: 16 }) + '</button>';
    el.querySelector('button').addEventListener('click', () => el.remove());
    stack.appendChild(el);
    setTimeout(() => el.remove(), duration);
  }

  // ============================================================
  // DOM update helpers
  // ============================================================
  function updateNavbar() {
    const el = document.getElementById('tx-navbar');
    if (el) el.innerHTML = renderPublicNavbar();
  }
  function updateFooter() {
    const el = document.getElementById('tx-footer');
    if (el) el.innerHTML = renderPublicFooter();
  }
  function updateSidebar() {
    const el = document.getElementById('tx-sidebar');
    if (!el) return;
    el.style.width = UIState.get().sidebarCollapsed ? '90px' : '280px';
    el.innerHTML = renderSidebar();
  }
  function updateTopbar() {
    const el = document.getElementById('tx-topbar');
    if (el) el.innerHTML = renderTopbar();
  }
  function updateAppFooter() {
    const el = document.getElementById('tx-app-footer');
    if (el) el.innerHTML = renderAppFooter();
  }
  function updateSidebarMobile() {
    const el = document.getElementById('tx-sidebar');
    const overlay = document.getElementById('tx-sidebar-overlay');
    if (!el) return;
    const open = UIState.get().sidebarMobileOpen;
    el.classList.toggle('translate-x-0', open);
    el.classList.toggle('-translate-x-full', !open);
    if (overlay) overlay.classList.toggle('hidden', !open);
  }

  // ============================================================
  // Event delegation
  // ============================================================
  function closeAllMenus(except) {
    document.querySelectorAll('[id$="-menu"]').forEach((m) => {
      if (m !== except) m.classList.add('hidden');
    });
  }

  function handleClick(e) {
    const trigger = e.target.closest('[data-action], [data-tab], [data-modal-close], [data-drawer-close]');

    if (
      !trigger ||
      ((trigger.getAttribute('data-action') || '').indexOf('toggle-menu') === -1 &&
        trigger.getAttribute('data-action') !== 'toggle-lang')
    ) {
      closeAllMenus();
    }
    if (!trigger) return;

    if (trigger.hasAttribute('data-tab')) {
      const wrap = trigger.closest('[data-tabs]');
      if (wrap && typeof global.onTabChange === 'function') global.onTabChange(Number(trigger.getAttribute('data-tab')), wrap);
      return;
    }

    if (trigger.hasAttribute('data-modal-close')) {
      closeModal(trigger.closest('[data-modal]'));
      return;
    }
    if (trigger.hasAttribute('data-drawer-close')) {
      closeDrawer(trigger.closest('[data-drawer]'));
      return;
    }

    const action = trigger.getAttribute('data-action');
    switch (action) {
      case 'toggle-dark':
        UIState.toggleDarkMode();
        if (SHELL === 'public') updateNavbar();
        else if (SHELL === 'app') updateTopbar();
        if (typeof global.onThemeChange === 'function') setTimeout(global.onThemeChange, 50);
        break;
      case 'toggle-lang':
      case 'toggle-menu': {
        e.stopPropagation();
        const sel = trigger.getAttribute('data-menu');
        const menu = sel && document.querySelector(sel);
        closeAllMenus(menu);
        if (menu) menu.classList.toggle('hidden');
        break;
      }
      case 'set-lang':
        e.stopPropagation();
        closeAllMenus();
        if (global.I18n) global.I18n.setLang(trigger.getAttribute('data-lang'));
        break;
      case 'toggle-mobile-menu':
        if (document.getElementById('tx-mobile-menu')) document.getElementById('tx-mobile-menu').classList.toggle('hidden');
        break;
      case 'toggle-sidebar':
        UIState.toggleSidebar();
        updateSidebar();
        break;
      case 'toggle-sidebar-responsive':
        if (window.innerWidth < 1024) UIState.toggleSidebarMobile();
        else {
          UIState.toggleSidebar();
          updateSidebar();
        }
        break;
      case 'close-sidebar-mobile':
        UIState.toggleSidebarMobile(false);
        break;
      case 'logout':
        Auth.logout();
        window.location.href = 'login.html';
        break;
      case 'accept-cookies':
        UIState.acceptCookies();
        updateCookieBanner();
        break;
      case 'decline-cookies':
        UIState.declineCookies();
        updateCookieBanner();
        break;
      case 'open-cookie-banner':
        UIState.openCookieBanner();
        updateCookieBanner();
        break;
    }
  }

  // ============================================================
  // Init
  // ============================================================
  function buildPublicShell(inner) {
    return (
      `<div class="flex min-h-screen flex-col" style="background-color:var(--tx-body-bg)">` +
      `<header id="tx-navbar" class="surface-header sticky top-0 z-40 border-b border-themed backdrop-blur"></header>` +
      `<main id="tx-main" class="flex-1">${inner}</main>` +
      `<footer id="tx-footer" class="border-t border-themed surface-card"></footer>` +
      `<div id="tx-cookie"></div>` +
      `<div id="tx-toast-stack" class="pointer-events-none fixed top-4 right-4 z-[100] flex flex-col gap-2"></div>` +
      `</div>`
    );
  }

  function buildAppShell(inner) {
    return (
      `<div class="app-shell flex h-screen overflow-hidden" style="background-color:var(--tx-body-bg)">` +
      `<aside id="tx-sidebar" class="no-print surface-sidebar fixed left-0 top-0 z-50 flex h-screen flex-col overflow-y-hidden border-r px-4 transition-transform duration-300 -translate-x-full lg:static lg:translate-x-0" style="width:280px"></aside>` +
      `<div id="tx-sidebar-overlay" class="no-print fixed inset-0 z-40 bg-gray-900/50 lg:hidden hidden" data-action="close-sidebar-mobile"></div>` +
      `<div class="app-scroll relative flex flex-1 flex-col overflow-x-hidden overflow-y-auto">` +
      `<header id="tx-topbar" class="no-print surface-header sticky top-0 z-30 flex w-full border-b"></header>` +
      `<main class="flex-1"><div class="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">${inner}</div></main>` +
      `<footer id="tx-app-footer" class="no-print surface-header border-t px-4 py-4 md:px-6 2xl:px-10"></footer>` +
      `</div>` +
      // Sem banner de cookies aqui: no React ele vive só no PublicLayout, e no
      // painel ele cobriria o rodapé dos modais (z-[90] × z-[80]).
      `<div id="tx-toast-stack" class="no-print pointer-events-none fixed top-4 right-4 z-[100] flex flex-col gap-2"></div>` +
      `</div>`
    );
  }

  function buildBlankShell(inner) {
    return inner + `<div id="tx-toast-stack" class="pointer-events-none fixed top-4 right-4 z-[100] flex flex-col gap-2"></div>`;
  }

  function init() {
    const app = document.getElementById('app');
    if (!app) return;

    if (SHELL === 'app' || document.body.getAttribute('data-guard') === 'true') {
      if (!Auth.requireAuth()) return;
    }

    const inner = app.innerHTML;
    if (SHELL === 'app') app.outerHTML = buildAppShell(inner);
    else if (SHELL === 'blank') app.outerHTML = buildBlankShell(inner);
    else app.outerHTML = buildPublicShell(inner);

    global.UIToast = notify;
    global.notify = notify;

    const renderChrome = () => {
      if (SHELL === 'public') {
        updateNavbar();
        updateFooter();
        updateCookieBanner();
      } else if (SHELL === 'app') {
        updateSidebar();
        updateTopbar();
        updateAppFooter();
        updateSidebarMobile();
      }
    };
    renderChrome();

    // Surface the cookie banner on first visit (no choice persisted yet).
    if (SHELL === 'public' && !UIState.get().cookiesAccepted) {
      setTimeout(() => {
        UIState.openCookieBanner();
        updateCookieBanner();
      }, 800);
    }

    document.addEventListener('i18n:changed', () => {
      renderChrome();
      if (typeof global.renderPage === 'function') global.renderPage();
    });

    UIState.subscribe(() => {
      if (SHELL === 'app') updateSidebarMobile();
    });

    document.addEventListener('click', handleClick);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeAllMenus();
        document.querySelectorAll('[data-modal]:not(.hidden)').forEach((m) => m.classList.add('hidden'));
        document.querySelectorAll('[data-drawer]:not(.hidden)').forEach((m) => m.classList.add('hidden'));
        if (UIState.get().sidebarMobileOpen) UIState.toggleSidebarMobile(false);
      }
    });

    if (global.I18n) global.I18n.whenReady(() => typeof global.renderPage === 'function' && global.renderPage());
    else if (typeof global.renderPage === 'function') global.renderPage();
  }

  // Expose helpers for pages.
  global.UI = {
    t,
    tArr,
    lang,
    esc,
    fmt,
    fmtCompact,
    fmtNumber,
    fmtDate,
    fmtDateTime,
    fmtTime,
    icon,
    notify,
    avatar,
    badge,
    invoicePill,
    quotePill,
    cyclePill,
    methodPill,
    activePill,
    kpiCard,
    summaryCard,
    emptyState,
    breadcrumb,
    pageHeader,
    switchToggle,
    filterBar,
    filterSelect,
    pageNav,
    modal,
    openModal,
    closeModal,
    drawer,
    openDrawer,
    closeDrawer,
    tabs,
    featureCard,
    planCard,
    faqAccordion,
    teamCard,
    itemsEditor,
    refreshItemsTotals,
    wireItemsEditor,
    invoiceDocument,
    documentEditorModal,
    wireDocumentEditor,
    paymentModal,
    wirePaymentModal,
    apexChart,
    brandLogo,
    EDITOR_MODAL_ID,
    PAYMENT_MODAL_ID,
  };
  global.Layout = { init, updateNavbar, updateFooter, updateSidebar, updateTopbar };

  if (document.getElementById('app')) init();
  else document.addEventListener('DOMContentLoaded', init);
})(window);
