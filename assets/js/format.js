/* ===== Format helpers — ports React src/lib/format.ts =====
   Locale-aware currency/date/time + human duration. */
(function (global) {
  const LOCALE_MAP = {
    'pt-BR': { locale: 'pt-BR', currency: 'BRL' },
    en: { locale: 'en-US', currency: 'USD' },
    es: { locale: 'es-ES', currency: 'EUR' },
  };

  function cfgFor(lang) {
    return LOCALE_MAP[lang || 'pt-BR'] || LOCALE_MAP['pt-BR'];
  }

  /** Format a currency value respecting the active i18n language (BRL by default). */
  function formatCurrency(value, lang) {
    const cfg = cfgFor(lang);
    return new Intl.NumberFormat(cfg.locale, {
      style: 'currency',
      currency: cfg.currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }

  /** Compact number format, e.g. 2840 -> 2,8 mil */
  function formatCompact(value, lang) {
    return new Intl.NumberFormat(cfgFor(lang).locale, { notation: 'compact', maximumFractionDigits: 1 }).format(value);
  }

  /** Plain integer formatting (e.g. unit counts). */
  function formatNumber(value, lang) {
    return new Intl.NumberFormat(cfgFor(lang).locale).format(value);
  }

  /** Locale-aware date only (medium). */
  function formatDate(iso, lang) {
    return new Intl.DateTimeFormat(cfgFor(lang).locale, { dateStyle: 'medium' }).format(new Date(iso));
  }

  /** Locale-aware date + time (short). */
  function formatDateTime(iso, lang) {
    return new Intl.DateTimeFormat(cfgFor(lang).locale, { dateStyle: 'short', timeStyle: 'short' }).format(new Date(iso));
  }

  /** HH:mm only. */
  function formatTime(iso, lang) {
    return new Intl.DateTimeFormat(cfgFor(lang).locale, { timeStyle: 'short' }).format(new Date(iso));
  }

  /** Human duration from minutes, e.g. 90 -> "1h30", 45 -> "45min". */
  function formatDuration(mins) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) return `${m}min`;
    if (m === 0) return `${h}h`;
    return `${h}h${String(m).padStart(2, '0')}`;
  }

  global.Format = {
    formatCurrency,
    formatCompact,
    formatNumber,
    formatDate,
    formatDateTime,
    formatTime,
    formatDuration,
  };
})(window);
