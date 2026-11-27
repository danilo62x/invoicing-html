/* ═══════════════════════════════════════════════════════════════════════════
   Núcleo de cálculo — porta de React src/data/query.ts.

   Toda a interface (lista, documento, KPIs, relatórios) passa por aqui — é a
   única fonte da verdade dos números.

   Regras adotadas:
   • total do item  = quantity × unitPrice × (1 + taxRate/100)
   • bruto          = Σ total dos itens  ( = subtotal + impostos )
   • desconto       = valor fixo, ou percentual aplicado sobre o BRUTO
   • total          = bruto − desconto   (nunca negativo)
   • saldo          = total − Σ pagamentos  (nunca negativo)

   Regra de ouro: `vencida` NUNCA é gravada. Ela é derivada de
   (status === 'enviada' && dueAt < agora) por isOverdue()/effectiveStatus().
   ══════════════════════════════════════════════════════════════════════════ */
(function (global) {
  /** Arredonda para centavos evitando o ruído de ponto flutuante. */
  function round2(value) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  /* ── Item ──────────────────────────────────────────────────────────────── */

  /** `quantity × unitPrice × (1 + taxRate/100)` — o item já com imposto. */
  function lineTotal(item) {
    return round2(item.quantity * item.unitPrice * (1 + item.taxRate / 100));
  }

  /** Base do item, sem imposto. */
  function lineBase(item) {
    return round2(item.quantity * item.unitPrice);
  }

  /** Imposto do item isolado. */
  function lineTax(item) {
    return round2((item.quantity * item.unitPrice * item.taxRate) / 100);
  }

  /* ── Documento ─────────────────────────────────────────────────────────── */

  /** Soma das bases (sem imposto e sem desconto). */
  function invoiceSubtotal(doc) {
    return round2(doc.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0));
  }

  /** Soma dos impostos de todos os itens. */
  function invoiceTax(doc) {
    return round2(
      doc.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice * item.taxRate) / 100, 0)
    );
  }

  /** Bruto: subtotal + impostos, antes do desconto. */
  function invoiceGross(doc) {
    return round2(invoiceSubtotal(doc) + invoiceTax(doc));
  }

  /**
   * Desconto em reais. Quando `discountKind === 'percentual'` a alíquota incide
   * sobre o bruto (subtotal + impostos); quando é `'valor'`, o próprio número.
   * Nunca passa do bruto.
   */
  function invoiceDiscountValue(doc) {
    const gross = invoiceGross(doc);
    const raw = doc.discountKind === 'percentual' ? (gross * doc.discount) / 100 : doc.discount;
    return round2(Math.min(Math.max(raw, 0), gross));
  }

  /** Total a pagar: bruto − desconto. */
  function invoiceTotal(doc) {
    return round2(Math.max(invoiceGross(doc) - invoiceDiscountValue(doc), 0));
  }

  /** Soma dos pagamentos registrados. */
  function invoicePaid(invoice) {
    return round2(invoice.payments.reduce((sum, p) => sum + p.amount, 0));
  }

  /** Saldo em aberto: total − pagamentos (nunca negativo). */
  function invoiceBalance(invoice) {
    return round2(Math.max(invoiceTotal(invoice) - invoicePaid(invoice), 0));
  }

  /** Quanto do total já foi quitado, 0–100. */
  function invoicePaidPercent(invoice) {
    const total = invoiceTotal(invoice);
    if (total <= 0) return 0;
    return Math.min(100, Math.round((invoicePaid(invoice) / total) * 100));
  }

  /** Pagamento parcial: tem pagamento, mas ainda sobra saldo. */
  function isPartiallyPaid(invoice) {
    return invoice.payments.length > 0 && invoiceBalance(invoice) > 0;
  }

  /* ── Vencimento (derivado, nunca gravado) ──────────────────────────────── */

  /** Fatura enviada cujo vencimento já passou. */
  function isOverdue(invoice, ref) {
    ref = ref || new Date();
    return invoice.status === 'enviada' && new Date(invoice.dueAt).getTime() < ref.getTime();
  }

  /** Status mostrado na interface — `vencida` entra aqui, nunca no store. */
  function effectiveStatus(invoice, ref) {
    return isOverdue(invoice, ref) ? 'vencida' : invoice.status;
  }

  /** Dias de atraso (0 quando não está vencida). */
  function daysOverdue(invoice, ref) {
    ref = ref || new Date();
    if (!isOverdue(invoice, ref)) return 0;
    const ms = ref.getTime() - new Date(invoice.dueAt).getTime();
    return Math.max(1, Math.floor(ms / 86400000));
  }

  /** Dias que faltam para vencer (negativo quando já venceu). */
  function daysUntilDue(invoice, ref) {
    ref = ref || new Date();
    const ms = new Date(invoice.dueAt).getTime() - ref.getTime();
    return Math.ceil(ms / 86400000);
  }

  /** Faturas em aberto que vencem nos próximos `days` dias, da mais próxima. */
  function upcomingDue(invoices, days, ref) {
    days = days == null ? 15 : days;
    ref = ref || new Date();
    return invoices
      .filter((inv) => inv.status === 'enviada' && !isOverdue(inv, ref) && daysUntilDue(inv, ref) <= days)
      .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());
  }

  /* ── Totais de carteira ────────────────────────────────────────────────── */

  /** A receber: saldo de tudo que está enviado (inclui o que já venceu). */
  function receivable(invoices) {
    return round2(
      invoices.filter((inv) => inv.status === 'enviada').reduce((sum, inv) => sum + invoiceBalance(inv), 0)
    );
  }

  /** Vencido: saldo apenas das faturas em atraso. */
  function overdueTotal(invoices, ref) {
    ref = ref || new Date();
    return round2(
      invoices.filter((inv) => isOverdue(inv, ref)).reduce((sum, inv) => sum + invoiceBalance(inv), 0)
    );
  }

  /** Chave `YYYY-MM` de uma data. */
  function monthKey(date) {
    const d = typeof date === 'string' ? new Date(date) : date;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }

  /** Recebido no mês: soma dos pagamentos com data dentro do mês. */
  function receivedInMonth(invoices, year, month) {
    const key = `${year}-${String(month + 1).padStart(2, '0')}`;
    return round2(
      invoices.reduce(
        (sum, inv) =>
          sum + inv.payments.filter((p) => monthKey(p.at) === key).reduce((s, p) => s + p.amount, 0),
        0
      )
    );
  }

  /** Despesas lançadas no mês. */
  function expensesInMonth(expenses, year, month) {
    const key = `${year}-${String(month + 1).padStart(2, '0')}`;
    return round2(expenses.filter((e) => monthKey(e.at) === key).reduce((sum, e) => sum + e.amount, 0));
  }

  /** Saldo projetado: caixa recebido no mês + a receber − despesas do mês. */
  function projectedBalance(invoices, expenses, ref) {
    ref = ref || new Date();
    const received = receivedInMonth(invoices, ref.getFullYear(), ref.getMonth());
    const spent = expensesInMonth(expenses, ref.getFullYear(), ref.getMonth());
    return round2(received + receivable(invoices) - spent);
  }

  /* ── Séries e agrupamentos ─────────────────────────────────────────────── */

  const MONTH_FORMAT = { 'pt-BR': 'pt-BR', en: 'en-US', es: 'es-ES' };

  function monthLabel(date, lang) {
    const locale = MONTH_FORMAT[lang] || 'pt-BR';
    const month = new Intl.DateTimeFormat(locale, { month: 'short' }).format(date).replace('.', '');
    return `${month}/${String(date.getFullYear()).slice(2)}`;
  }

  /** Entradas (pagamentos recebidos) × saídas (despesas) nos últimos N meses. */
  function revenueByMonth(invoices, expenses, months, lang, ref) {
    months = months == null ? 6 : months;
    lang = lang || 'pt-BR';
    ref = ref || new Date();
    const points = [];
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(ref.getFullYear(), ref.getMonth() - i, 1);
      const revenue = receivedInMonth(invoices, d.getFullYear(), d.getMonth());
      const spent = expensesInMonth(expenses, d.getFullYear(), d.getMonth());
      points.push({
        key: monthKey(d),
        label: monthLabel(d, lang),
        revenue,
        expenses: spent,
        net: round2(revenue - spent),
      });
    }
    return points;
  }

  function inRange(iso, range) {
    if (!range) return true;
    const t = new Date(iso).getTime();
    if (range.from && t < new Date(range.from).getTime()) return false;
    if (range.to && t > new Date(range.to).getTime()) return false;
    return true;
  }

  /** Faturas que contam como receita: emitidas e não canceladas. */
  function billable(invoices, range) {
    return invoices.filter(
      (inv) => inv.status !== 'rascunho' && inv.status !== 'cancelada' && inRange(inv.issuedAt, range)
    );
  }

  /** Receita faturada por cliente, ordenada do maior para o menor. */
  function revenueByClient(invoices, clients, range) {
    const rows = new Map();
    for (const inv of billable(invoices, range)) {
      const row = rows.get(inv.clientId) || { amount: 0, invoices: 0 };
      row.amount += invoiceTotal(inv);
      row.invoices += 1;
      rows.set(inv.clientId, row);
    }
    const total = [...rows.values()].reduce((sum, r) => sum + r.amount, 0);
    return [...rows.entries()]
      .map(([clientId, row]) => {
        const client = clients.find((c) => c.id === clientId);
        return {
          clientId,
          name: client ? client.name : '—',
          amount: round2(row.amount),
          share: total > 0 ? Math.round((row.amount / total) * 100) : 0,
          invoices: row.invoices,
        };
      })
      .sort((a, b) => b.amount - a.amount);
  }

  /** Receita por serviço (descrição do item), ordenada do maior para o menor. */
  function revenueByService(invoices, range) {
    const rows = new Map();
    for (const inv of billable(invoices, range)) {
      for (const item of inv.items) {
        const key = item.description.trim();
        const row = rows.get(key) || { amount: 0, quantity: 0 };
        row.amount += lineTotal(item);
        row.quantity += item.quantity;
        rows.set(key, row);
      }
    }
    const total = [...rows.values()].reduce((sum, r) => sum + r.amount, 0);
    return [...rows.entries()]
      .map(([description, row]) => ({
        description,
        amount: round2(row.amount),
        quantity: round2(row.quantity),
        share: total > 0 ? Math.round((row.amount / total) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }

  /** Despesas somadas por categoria. */
  function expensesByCategory(expenses, range) {
    const rows = new Map();
    for (const e of expenses) {
      if (!inRange(e.at, range)) continue;
      const row = rows.get(e.category) || { amount: 0, count: 0 };
      row.amount += e.amount;
      row.count += 1;
      rows.set(e.category, row);
    }
    const total = [...rows.values()].reduce((sum, r) => sum + r.amount, 0);
    return [...rows.entries()]
      .map(([category, row]) => ({
        category,
        amount: round2(row.amount),
        share: total > 0 ? Math.round((row.amount / total) * 100) : 0,
        count: row.count,
      }))
      .sort((a, b) => b.amount - a.amount);
  }

  /**
   * DRE simplificada do período. Receita = faturas emitidas e não canceladas
   * (regime de competência); despesas separadas entre dedutíveis e não dedutíveis.
   */
  function simplifiedIncomeStatement(invoices, expenses, range) {
    const rows = billable(invoices, range);
    const revenue = round2(rows.reduce((sum, inv) => sum + invoiceTotal(inv), 0));
    const taxes = round2(rows.reduce((sum, inv) => sum + invoiceTax(inv), 0));

    const period = expenses.filter((e) => inRange(e.at, range));
    const deductibleExpenses = round2(
      period.filter((e) => e.deductible).reduce((sum, e) => sum + e.amount, 0)
    );
    const nonDeductibleExpenses = round2(
      period.filter((e) => !e.deductible).reduce((sum, e) => sum + e.amount, 0)
    );
    const totalExpenses = round2(deductibleExpenses + nonDeductibleExpenses);

    const grossProfit = round2(revenue - taxes);
    const netProfit = round2(grossProfit - totalExpenses);

    return {
      revenue,
      taxes,
      deductibleExpenses,
      nonDeductibleExpenses,
      totalExpenses,
      grossProfit,
      netProfit,
      margin: revenue > 0 ? round2((netProfit / revenue) * 100) : 0,
    };
  }

  /**
   * Impostos estimados do período: o que foi destacado nos itens mais a
   * provisão do Simples Nacional sobre o faturamento.
   */
  function estimatedTaxes(invoices, range, simplesRate) {
    simplesRate = simplesRate == null ? 6 : simplesRate;
    const rows = billable(invoices, range);
    const base = round2(rows.reduce((sum, inv) => sum + invoiceTotal(inv), 0));
    const itemTaxes = round2(rows.reduce((sum, inv) => sum + invoiceTax(inv), 0));
    const simples = round2((base * simplesRate) / 100);
    return { base, itemTaxes, simples, simplesRate, total: round2(itemTaxes + simples) };
  }

  /* ── Numeração ─────────────────────────────────────────────────────────── */

  /** `invoicePrefix` + `nextNumber` com 4 dígitos — ex.: `CC-0042`. */
  function nextInvoiceNumber(profile) {
    return `${profile.invoicePrefix}${String(profile.nextNumber).padStart(4, '0')}`;
  }

  /** Numeração dos orçamentos, derivada do mesmo prefixo. */
  function nextQuoteNumber(profile, quotes) {
    const seq = quotes.length + 1;
    return `${profile.invoicePrefix.replace(/^[A-Z]+/, 'ORC')}${String(seq).padStart(4, '0')}`;
  }

  /* ── Datas ─────────────────────────────────────────────────────────────── */

  function addDays(iso, days) {
    const d = new Date(iso);
    d.setDate(d.getDate() + days);
    return d.toISOString();
  }

  const CYCLE_MONTHS = { mensal: 1, trimestral: 3, semestral: 6, anual: 12 };

  /** Próxima emissão de uma assinatura a partir da data informada. */
  function advanceCycle(iso, cycle) {
    const d = new Date(iso);
    d.setMonth(d.getMonth() + CYCLE_MONTHS[cycle]);
    return d.toISOString();
  }

  /** Valor anualizado de uma assinatura (para o MRR/ARR da tela de recorrentes). */
  function recurringAnnualValue(items, cycle) {
    const perCycle = items.reduce((sum, item) => sum + lineTotal(item), 0);
    return round2((perCycle * 12) / CYCLE_MONTHS[cycle]);
  }

  /** Receita recorrente mensal equivalente. */
  function monthlyRecurringRevenue(items, cycle) {
    return round2(recurringAnnualValue(items, cycle) / 12);
  }

  /* ── Filtros de lista ──────────────────────────────────────────────────── */

  /** Filtro da tela de faturas — `status: 'vencida'` usa o status efetivo. */
  function filterInvoices(invoices, clients, filter, ref) {
    filter = filter || {};
    ref = ref || new Date();
    const term = (filter.search || '').trim().toLowerCase();
    return invoices.filter((inv) => {
      if (filter.status && filter.status !== 'todas' && effectiveStatus(inv, ref) !== filter.status) {
        return false;
      }
      if (filter.clientId && filter.clientId !== 'todos' && inv.clientId !== filter.clientId) return false;
      if (filter.from && new Date(inv.issuedAt).getTime() < new Date(filter.from).getTime()) return false;
      if (filter.to && new Date(inv.issuedAt).getTime() > new Date(filter.to).getTime()) return false;
      if (term) {
        const client = clients.find((c) => c.id === inv.clientId);
        const haystack = [inv.number, client ? client.name : '', client ? client.legalName : '', inv.notes]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
  }

  /** Extrato do cliente: faturas + total faturado, recebido e em aberto. */
  function clientStatement(invoices, clientId, ref) {
    ref = ref || new Date();
    const rows = invoices
      .filter((inv) => inv.clientId === clientId)
      .sort((a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime());
    const billedRows = rows.filter((inv) => inv.status !== 'rascunho' && inv.status !== 'cancelada');
    return {
      invoices: rows,
      billed: round2(billedRows.reduce((sum, inv) => sum + invoiceTotal(inv), 0)),
      received: round2(rows.reduce((sum, inv) => sum + invoicePaid(inv), 0)),
      open: round2(
        rows.filter((inv) => inv.status === 'enviada').reduce((sum, inv) => sum + invoiceBalance(inv), 0)
      ),
      overdue: round2(
        rows.filter((inv) => isOverdue(inv, ref)).reduce((sum, inv) => sum + invoiceBalance(inv), 0)
      ),
    };
  }

  /** Contagem por status efetivo, para os chips de filtro. */
  function invoiceStatusCounts(invoices, ref) {
    ref = ref || new Date();
    const counts = { rascunho: 0, enviada: 0, paga: 0, vencida: 0, cancelada: 0 };
    for (const inv of invoices) counts[effectiveStatus(inv, ref)] += 1;
    return counts;
  }

  global.Query = {
    round2,
    lineTotal,
    lineBase,
    lineTax,
    invoiceSubtotal,
    invoiceTax,
    invoiceGross,
    invoiceDiscountValue,
    invoiceTotal,
    invoicePaid,
    invoiceBalance,
    invoicePaidPercent,
    isPartiallyPaid,
    isOverdue,
    effectiveStatus,
    daysOverdue,
    daysUntilDue,
    upcomingDue,
    receivable,
    overdueTotal,
    monthKey,
    receivedInMonth,
    expensesInMonth,
    projectedBalance,
    revenueByMonth,
    revenueByClient,
    revenueByService,
    expensesByCategory,
    simplifiedIncomeStatement,
    estimatedTaxes,
    nextInvoiceNumber,
    nextQuoteNumber,
    addDays,
    advanceCycle,
    recurringAnnualValue,
    monthlyRecurringRevenue,
    filterInvoices,
    clientStatement,
    invoiceStatusCounts,
  };
})(window);
