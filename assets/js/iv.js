/* ===== Store de faturamento — porta de React stores/billing.ts + stores/editor.ts =====
   Domínio persistido em "iv-data"; rascunho do editor em "iv-editor".
   Regra de ouro: `vencida` nunca é gravada — ver query.js. */
(function (global) {
  const STORAGE_KEY = 'iv-data';
  const EDITOR_KEY = 'iv-editor';
  const Q = global.Query;

  function clone(v) {
    return JSON.parse(JSON.stringify(v));
  }

  const nextId = (rows) => (rows.length ? Math.max(...rows.map((r) => r.id)) + 1 : 1);

  function addDays(iso, days) {
    const d = new Date(iso);
    d.setDate(d.getDate() + days);
    return d.toISOString();
  }

  function seed() {
    return {
      company: clone(Data.COMPANY),
      clients: clone(Data.CLIENTS),
      invoices: clone(Data.INVOICES),
      quotes: clone(Data.QUOTES),
      recurrings: clone(Data.RECURRINGS),
      expenses: clone(Data.EXPENSES),
    };
  }

  let state = seed();
  const listeners = new Set();

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const p = JSON.parse(raw);
        state = {
          company: p.company || state.company,
          clients: p.clients || state.clients,
          invoices: p.invoices || state.invoices,
          quotes: p.quotes || state.quotes,
          recurrings: p.recurrings || state.recurrings,
          expenses: p.expenses || state.expenses,
        };
      }
    } catch (_) {}
  }

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (_) {}
  }

  function emit() {
    persist();
    listeners.forEach((cb) => cb(state));
  }

  function get() {
    return state;
  }

  function subscribe(cb) {
    listeners.add(cb);
    return () => listeners.delete(cb);
  }

  /* ── Consultas rápidas ─────────────────────────────────────────────────── */
  function clientById(id) {
    return state.clients.find((c) => c.id === id) || null;
  }
  function clientName(id) {
    const c = clientById(id);
    return c ? c.name : '—';
  }
  function invoiceById(id) {
    return state.invoices.find((i) => i.id === id) || null;
  }
  function quoteById(id) {
    return state.quotes.find((q) => q.id === id) || null;
  }

  /* ── Empresa ───────────────────────────────────────────────────────────── */
  function updateCompany(patch) {
    state.company = { ...state.company, ...patch };
    emit();
  }

  /* ── Clientes ──────────────────────────────────────────────────────────── */
  function addClient(data) {
    const client = { ...data, id: nextId(state.clients) };
    state.clients = [...state.clients, client];
    emit();
    return client;
  }
  function updateClient(id, patch) {
    state.clients = state.clients.map((c) => (c.id === id ? { ...c, ...patch } : c));
    emit();
  }
  function removeClient(id) {
    state.clients = state.clients.filter((c) => c.id !== id);
    emit();
  }

  /* ── Faturas ───────────────────────────────────────────────────────────── */
  function addInvoice(data) {
    const company = state.company;
    const invoice = {
      status: 'rascunho',
      payments: [],
      ...data,
      id: nextId(state.invoices),
      number: Q.nextInvoiceNumber(company),
    };
    state.invoices = [invoice, ...state.invoices];
    state.company = { ...company, nextNumber: company.nextNumber + 1 };
    emit();
    return invoice;
  }
  function updateInvoice(id, patch) {
    state.invoices = state.invoices.map((i) => (i.id === id ? { ...i, ...patch } : i));
    emit();
  }
  function removeInvoice(id) {
    state.invoices = state.invoices.filter((i) => i.id !== id);
    emit();
  }
  function sendInvoice(id) {
    state.invoices = state.invoices.map((i) =>
      i.id === id && i.status === 'rascunho' ? { ...i, status: 'enviada' } : i
    );
    emit();
  }
  function cancelInvoice(id) {
    state.invoices = state.invoices.map((i) => (i.id === id ? { ...i, status: 'cancelada' } : i));
    emit();
  }
  function duplicateInvoice(id) {
    const source = invoiceById(id);
    if (!source) return null;
    const company = state.company;
    const issuedAt = new Date().toISOString();
    const client = clientById(source.clientId);
    const copy = {
      ...source,
      id: nextId(state.invoices),
      number: Q.nextInvoiceNumber(company),
      issuedAt,
      dueAt: addDays(issuedAt, client ? client.paymentTermDays : company.defaultTermDays),
      status: 'rascunho',
      payments: [],
      items: source.items.map((it) => ({ ...it })),
      recurringId: null,
    };
    state.invoices = [copy, ...state.invoices];
    state.company = { ...company, nextNumber: company.nextNumber + 1 };
    emit();
    return copy;
  }
  /** Quita o saldo restante e marca como paga. */
  function markPaid(id, method) {
    method = method || 'pix';
    const invoice = invoiceById(id);
    if (!invoice) return;
    const balance = Q.invoiceBalance(invoice);
    const payments =
      balance > 0
        ? [
            ...invoice.payments,
            {
              id: nextId(invoice.payments),
              at: new Date().toISOString(),
              amount: balance,
              method,
              note: '',
            },
          ]
        : invoice.payments;
    state.invoices = state.invoices.map((i) => (i.id === id ? { ...i, payments, status: 'paga' } : i));
    emit();
  }
  /** Pagamento parcial mantém a fatura como enviada; quitação total marca paga. */
  function registerPayment(id, data) {
    state.invoices = state.invoices.map((invoice) => {
      if (invoice.id !== id) return invoice;
      const payment = { ...data, id: nextId(invoice.payments), amount: Q.round2(data.amount) };
      const payments = [...invoice.payments, payment];
      const paid = Q.round2(payments.reduce((sum, p) => sum + p.amount, 0));
      // Parcial mantém a fatura enviada; só quita quando cobre o total.
      const status = paid >= Q.invoiceTotal(invoice) ? 'paga' : 'enviada';
      return { ...invoice, payments, status };
    });
    emit();
  }
  function removePayment(invoiceId, paymentId) {
    state.invoices = state.invoices.map((invoice) => {
      if (invoice.id !== invoiceId) return invoice;
      const payments = invoice.payments.filter((p) => p.id !== paymentId);
      const paid = Q.round2(payments.reduce((sum, p) => sum + p.amount, 0));
      const status =
        invoice.status === 'cancelada' || invoice.status === 'rascunho'
          ? invoice.status
          : paid >= Q.invoiceTotal(invoice)
            ? 'paga'
            : 'enviada';
      return { ...invoice, payments, status };
    });
    emit();
  }

  /* ── Orçamentos ────────────────────────────────────────────────────────── */
  function addQuote(data) {
    const quote = { ...data, id: nextId(state.quotes), number: Q.nextQuoteNumber(state.company, state.quotes) };
    state.quotes = [quote, ...state.quotes];
    emit();
    return quote;
  }
  function updateQuote(id, patch) {
    state.quotes = state.quotes.map((q) => (q.id === id ? { ...q, ...patch } : q));
    emit();
  }
  function removeQuote(id) {
    state.quotes = state.quotes.filter((q) => q.id !== id);
    emit();
  }
  function acceptQuote(id) {
    state.quotes = state.quotes.map((q) => (q.id === id ? { ...q, status: 'aceito' } : q));
    emit();
  }
  function rejectQuote(id) {
    state.quotes = state.quotes.map((q) => (q.id === id ? { ...q, status: 'recusado' } : q));
    emit();
  }
  /** Gera a fatura a partir do orçamento e o marca como aceito. */
  function convertQuoteToInvoice(id) {
    const quote = quoteById(id);
    if (!quote) return null;
    const company = state.company;
    const client = clientById(quote.clientId);
    const issuedAt = new Date().toISOString();
    const invoice = {
      id: nextId(state.invoices),
      number: Q.nextInvoiceNumber(company),
      clientId: quote.clientId,
      issuedAt,
      dueAt: addDays(issuedAt, client ? client.paymentTermDays : company.defaultTermDays),
      items: quote.items.map((it) => ({ ...it })),
      discount: quote.discount,
      discountKind: quote.discountKind,
      status: 'rascunho',
      payments: [],
      notes: quote.notes,
      terms: `Origem: orçamento ${quote.number}.`,
      recurringId: null,
    };
    state.invoices = [invoice, ...state.invoices];
    state.quotes = state.quotes.map((q) => (q.id === id ? { ...q, status: 'aceito' } : q));
    state.company = { ...company, nextNumber: company.nextNumber + 1 };
    emit();
    return invoice;
  }

  /* ── Recorrentes ───────────────────────────────────────────────────────── */
  function addRecurring(data) {
    const recurring = { ...data, id: nextId(state.recurrings), generatedInvoiceIds: [] };
    state.recurrings = [...state.recurrings, recurring];
    emit();
    return recurring;
  }
  function updateRecurring(id, patch) {
    state.recurrings = state.recurrings.map((r) => (r.id === id ? { ...r, ...patch } : r));
    emit();
  }
  function removeRecurring(id) {
    state.recurrings = state.recurrings.filter((r) => r.id !== id);
    emit();
  }
  function toggleRecurringActive(id) {
    state.recurrings = state.recurrings.map((r) => (r.id === id ? { ...r, active: !r.active } : r));
    emit();
  }
  /** Emite a próxima fatura da assinatura e avança o ciclo. */
  function generateInvoiceFromRecurring(id) {
    const recurring = state.recurrings.find((r) => r.id === id);
    if (!recurring) return null;
    const company = state.company;
    const client = clientById(recurring.clientId);
    const issuedAt = new Date().toISOString();
    const invoice = {
      id: nextId(state.invoices),
      number: Q.nextInvoiceNumber(company),
      clientId: recurring.clientId,
      issuedAt,
      dueAt: addDays(issuedAt, client ? client.paymentTermDays : company.defaultTermDays),
      items: recurring.items.map((it) => ({ ...it })),
      discount: 0,
      discountKind: 'valor',
      status: 'enviada',
      payments: [],
      notes: '',
      terms: `Assinatura ${recurring.cycle}.`,
      recurringId: recurring.id,
    };
    state.invoices = [invoice, ...state.invoices];
    state.company = { ...company, nextNumber: company.nextNumber + 1 };
    state.recurrings = state.recurrings.map((r) =>
      r.id === id
        ? {
            ...r,
            nextIssueAt: Q.advanceCycle(r.nextIssueAt, r.cycle),
            generatedInvoiceIds: [...r.generatedInvoiceIds, invoice.id],
          }
        : r
    );
    emit();
    return invoice;
  }

  /* ── Despesas ──────────────────────────────────────────────────────────── */
  function addExpense(data) {
    const expense = { ...data, id: nextId(state.expenses) };
    state.expenses = [expense, ...state.expenses];
    emit();
    return expense;
  }
  function updateExpense(id, patch) {
    state.expenses = state.expenses.map((e) => (e.id === id ? { ...e, ...patch } : e));
    emit();
  }
  function removeExpense(id) {
    state.expenses = state.expenses.filter((e) => e.id !== id);
    emit();
  }
  function toggleDeductible(id) {
    state.expenses = state.expenses.map((e) => (e.id === id ? { ...e, deductible: !e.deductible } : e));
    emit();
  }

  function reset() {
    state = seed();
    emit();
  }

  load();

  /* ══════════════════════════════════════════════════════════════════════════
     Editor de documento (fatura ou orçamento) — chave "iv-editor".
     Fatura e orçamento têm a mesma estrutura de itens, então compartilham o
     mesmo rascunho.
     ═════════════════════════════════════════════════════════════════════════ */

  function isoDate(value) {
    const d = typeof value === 'string' ? new Date(value) : value;
    return d.toISOString().slice(0, 10);
  }

  function isoInDays(days) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return isoDate(d);
  }

  let editor = { draft: null, open: false };
  const editorListeners = new Set();

  try {
    const raw = localStorage.getItem(EDITOR_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      editor = { draft: p.draft || null, open: !!p.open };
    }
  } catch (_) {}

  function editorPersist() {
    try {
      localStorage.setItem(EDITOR_KEY, JSON.stringify(editor));
    } catch (_) {}
  }
  function editorEmit() {
    editorPersist();
    editorListeners.forEach((cb) => cb(editor));
  }

  const Editor = {
    get: () => editor,
    subscribe(cb) {
      editorListeners.add(cb);
      return () => editorListeners.delete(cb);
    },

    startInvoice(company, client) {
      const term = client ? client.paymentTermDays : company.defaultTermDays;
      editor = {
        open: true,
        draft: {
          kind: 'fatura',
          id: null,
          clientId: client ? client.id : 0,
          issuedAt: isoDate(new Date()),
          endAt: isoInDays(term),
          items: [{ description: '', quantity: 1, unitPrice: 0, taxRate: company.defaultTaxRate }],
          discount: 0,
          discountKind: 'valor',
          notes: '',
          terms: `Pagamento em até ${term} dias corridos.`,
        },
      };
      editorEmit();
    },

    startQuote(company, client) {
      editor = {
        open: true,
        draft: {
          kind: 'orcamento',
          id: null,
          clientId: client ? client.id : 0,
          issuedAt: isoDate(new Date()),
          endAt: isoInDays(15),
          items: [{ description: '', quantity: 1, unitPrice: 0, taxRate: company.defaultTaxRate }],
          discount: 0,
          discountKind: 'valor',
          notes: '',
          terms: '',
        },
      };
      editorEmit();
    },

    editInvoice(invoice) {
      editor = {
        open: true,
        draft: {
          kind: 'fatura',
          id: invoice.id,
          clientId: invoice.clientId,
          issuedAt: isoDate(invoice.issuedAt),
          endAt: isoDate(invoice.dueAt),
          items: invoice.items.map((it) => ({ ...it })),
          discount: invoice.discount,
          discountKind: invoice.discountKind,
          notes: invoice.notes,
          terms: invoice.terms,
        },
      };
      editorEmit();
    },

    editQuote(quote) {
      editor = {
        open: true,
        draft: {
          kind: 'orcamento',
          id: quote.id,
          clientId: quote.clientId,
          issuedAt: isoDate(quote.issuedAt),
          endAt: isoDate(quote.validUntil),
          items: quote.items.map((it) => ({ ...it })),
          discount: quote.discount,
          discountKind: quote.discountKind,
          notes: quote.notes,
          terms: '',
        },
      };
      editorEmit();
    },

    /** Trocar o cliente reprograma o vencimento pelo prazo padrão dele. */
    setClient(clientId, client) {
      if (!editor.draft) return;
      const endAt =
        editor.draft.kind === 'fatura' && client ? isoInDays(client.paymentTermDays) : editor.draft.endAt;
      editor = { ...editor, draft: { ...editor.draft, clientId, endAt } };
      editorEmit();
    },

    setField(key, value) {
      if (!editor.draft) return;
      const draft = { ...editor.draft };
      draft[key] = value;
      editor = { ...editor, draft };
      editorEmit();
    },

    setItems(items) {
      if (!editor.draft) return;
      editor = { ...editor, draft: { ...editor.draft, items } };
      editorEmit();
    },

    addItem(defaultTaxRate) {
      if (!editor.draft) return;
      editor = {
        ...editor,
        draft: {
          ...editor.draft,
          items: [...editor.draft.items, { description: '', quantity: 1, unitPrice: 0, taxRate: defaultTaxRate }],
        },
      };
      editorEmit();
    },

    updateItem(index, patch) {
      if (!editor.draft) return;
      editor = {
        ...editor,
        draft: {
          ...editor.draft,
          items: editor.draft.items.map((item, i) => (i === index ? { ...item, ...patch } : item)),
        },
      };
      editorEmit();
    },

    removeItem(index) {
      if (!editor.draft) return;
      editor = { ...editor, draft: { ...editor.draft, items: editor.draft.items.filter((_, i) => i !== index) } };
      editorEmit();
    },

    close() {
      editor = { ...editor, open: false };
      editorEmit();
    },

    discard() {
      editor = { open: false, draft: null };
      editorEmit();
    },
  };

  global.IV = {
    get,
    subscribe,
    clientById,
    clientName,
    invoiceById,
    quoteById,
    updateCompany,
    addClient,
    updateClient,
    removeClient,
    addInvoice,
    updateInvoice,
    removeInvoice,
    sendInvoice,
    cancelInvoice,
    duplicateInvoice,
    markPaid,
    registerPayment,
    removePayment,
    addQuote,
    updateQuote,
    removeQuote,
    acceptQuote,
    rejectQuote,
    convertQuoteToInvoice,
    addRecurring,
    updateRecurring,
    removeRecurring,
    toggleRecurringActive,
    generateInvoiceFromRecurring,
    addExpense,
    updateExpense,
    removeExpense,
    toggleDeductible,
    reset,
    Editor,
  };
})(window);
