/* ===== Dados mock — porta de React src/data/mock.ts =====
   Mesmos clientes, faturas, orçamentos, recorrentes e despesas. As datas são
   relativas a hoje, então o mock nunca envelhece. Depende de `Query`
   (query.js precisa ser carregado antes deste arquivo). */
(function (global) {
  const Q = global.Query;

  /* ── Imagens ─────────────────────────────────────────────────────────────
     Faturamento não tem foto de produto: só avatar de pessoa. IDs Unsplash já
     verificados no monorepo, endereçados por seed para o mesmo nome cair sempre
     na mesma foto.                                                          */

  const PEOPLE = [
    '1500648767791-00dcc994a43e',
    '1494790108377-be9c29b29330',
    '1507003211169-0a1dd7228f2d',
    '1438761681033-6461ffad8d80',
    '1633332755192-727a05c4013d',
    '1573496359142-b8d87734a5a2',
  ];

  function imgHash(s) {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return h;
  }

  /** Avatar determinístico por seed. */
  function ivImage(seed, w, h) {
    w = w || 160;
    h = h || 160;
    const id = PEOPLE[imgHash('iv-' + seed) % PEOPLE.length];
    return `https://images.unsplash.com/photo-${id}?w=${w}&h=${h}&fit=crop&q=70&auto=format`;
  }

  /* ── Datas ───────────────────────────────────────────────────────────────
     Tudo é relativo a hoje: `at(2, 14)` é o dia 14 de dois meses atrás. No mês
     corrente o dia é limitado a hoje, então nenhuma emissão cai no futuro.   */

  const NOW = new Date();

  function at(monthsAgo, day, hour) {
    hour = hour == null ? 10 : hour;
    const d = new Date(NOW.getFullYear(), NOW.getMonth() - monthsAgo, 1, hour, 30, 0, 0);
    const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    let target = Math.min(day, lastDay);
    if (monthsAgo <= 0) target = Math.min(target, NOW.getDate());
    d.setDate(target);
    return d.toISOString();
  }

  function plusDays(iso, days) {
    const d = new Date(iso);
    d.setDate(d.getDate() + days);
    return d.toISOString();
  }

  /* ── Perfil da empresa (emitente) ──────────────────────────────────────── */

  const COMPANY = {
    name: 'Conta Certa Serviços',
    legalName: 'Conta Certa Serviços Digitais Ltda',
    taxId: '18.472.905/0001-64',
    address: 'Av. Paulista, 1842 — cj. 156, Bela Vista, São Paulo/SP, 01310-200',
    email: 'financeiro@contacerta.com',
    phone: '+55 11 4003-2210',
    logoText: 'CC',
    invoicePrefix: 'CC-',
    nextNumber: 25,
    defaultTaxRate: 5,
    defaultTermDays: 15,
  };

  /* ── Clientes ──────────────────────────────────────────────────────────── */

  const CLIENTS = [
    {
      id: 1,
      name: 'Padaria Pão de Ouro',
      legalName: 'Pão de Ouro Alimentos Ltda',
      taxId: '07.418.226/0001-31',
      email: 'contato@paodeouro.com.br',
      phone: '(11) 3255-8140',
      address: 'Rua Sete de Abril, 220 — República, São Paulo/SP',
      paymentTermDays: 15,
      notes: 'Fecha o mês no dia 25. Prefere PIX.',
    },
    {
      id: 2,
      name: 'Clínica Vida Plena',
      legalName: 'Vida Plena Serviços Médicos S/S',
      taxId: '19.664.503/0001-08',
      email: 'administrativo@vidaplena.com.br',
      phone: '(11) 3812-7744',
      address: 'Av. Angélica, 1980 — Higienópolis, São Paulo/SP',
      paymentTermDays: 30,
      notes: 'Nota fiscal precisa do número do contrato no corpo.',
    },
    {
      id: 3,
      name: 'Advocacia Ribeiro & Sousa',
      legalName: 'Ribeiro e Sousa Sociedade de Advogados',
      taxId: '23.905.771/0001-55',
      email: 'financeiro@ribeirosousa.adv.br',
      phone: '(11) 3061-2290',
      address: 'Rua Bela Cintra, 934 — Consolação, São Paulo/SP',
      paymentTermDays: 30,
      notes: 'Retém ISS na fonte. Confirmar antes de emitir.',
    },
    {
      id: 4,
      name: 'Mercado Bom Preço',
      legalName: 'Bom Preço Comércio de Alimentos Eireli',
      taxId: '11.238.640/0001-77',
      email: 'compras@mercadobompreco.com.br',
      phone: '(11) 2954-6633',
      address: 'Av. Guilherme Cotching, 1450 — Vila Maria, São Paulo/SP',
      paymentTermDays: 30,
      notes: 'Pagamento só às sextas-feiras.',
    },
    {
      id: 5,
      name: 'Studio Alfa Arquitetura',
      legalName: 'Alfa Projetos e Arquitetura Ltda',
      taxId: '30.117.489/0001-12',
      email: 'contato@studioalfa.arq.br',
      phone: '(11) 3384-9012',
      address: 'Rua Harmonia, 512 — Vila Madalena, São Paulo/SP',
      paymentTermDays: 20,
      notes: 'Aprova orçamento por e-mail antes da emissão.',
    },
    {
      id: 6,
      name: 'Transportes Andrade',
      legalName: 'Andrade Logística e Transportes Ltda',
      taxId: '08.556.302/0001-49',
      email: 'financeiro@transportesandrade.com.br',
      phone: '(11) 4412-0088',
      address: 'Rod. Anhanguera, km 26 — Cajamar/SP',
      paymentTermDays: 15,
      notes: 'Boleto com 3 dias de antecedência.',
    },
    {
      id: 7,
      name: 'Café Serra Azul',
      legalName: 'Serra Azul Cafés Especiais Ltda',
      taxId: '35.720.118/0001-90',
      email: 'ola@cafeserraazul.com.br',
      phone: '(35) 3721-4455',
      address: 'Praça Barão do Rio Branco, 88 — Poços de Caldas/MG',
      paymentTermDays: 15,
      notes: 'Sazonal: concentra investimento entre março e agosto.',
    },
    {
      id: 8,
      name: 'Óptica Visão Clara',
      legalName: 'Visão Clara Comércio Óptico Ltda',
      taxId: '14.883.067/0001-24',
      email: 'gerencia@visaoclara.com.br',
      phone: '(11) 2088-3311',
      address: 'Rua Voluntários da Pátria, 1360 — Santana, São Paulo/SP',
      paymentTermDays: 30,
      notes: 'Duas lojas, faturamento centralizado no CNPJ matriz.',
    },
    {
      id: 9,
      name: 'TechNova Sistemas',
      legalName: 'TechNova Desenvolvimento de Software Ltda',
      taxId: '41.209.336/0001-06',
      email: 'contas@technova.dev',
      phone: '(11) 3090-7788',
      address: 'Rua Fidêncio Ramos, 300 — Vila Olímpia, São Paulo/SP',
      paymentTermDays: 20,
      notes: 'Portal de fornecedores próprio; anexar XML da NFS-e.',
    },
    {
      id: 10,
      name: 'Academia Corpo & Movimento',
      legalName: 'Corpo e Movimento Atividades Físicas Ltda',
      taxId: '27.640.915/0001-83',
      email: 'financeiro@corpoemovimento.fit',
      phone: '(11) 5044-1902',
      address: 'Av. Adolfo Pinheiro, 1001 — Santo Amaro, São Paulo/SP',
      paymentTermDays: 30,
      notes: 'Contrato anual com reajuste em janeiro.',
    },
  ];

  /* ── Catálogo de serviços usados nos itens ─────────────────────────────── */

  function it(description, quantity, unitPrice, taxRate) {
    return { description, quantity, unitPrice, taxRate };
  }

  const S = {
    contabil: () => it('Consultoria contábil — mensalidade', 1, 890, 5),
    manutencao: () => it('Manutenção de sistema — plano Essencial', 1, 1250, 3),
    suporte: (h) => it('Suporte técnico avulso (hora)', h == null ? 6 : h, 140, 5),
    erp: () => it('Integração com ERP', 1, 2750, 5),
    identidade: () => it('Identidade visual — pacote completo', 1, 4500, 5),
    trafego: () => it('Gestão de tráfego pago', 1, 1800, 2),
    emailMkt: () => it('Campanha de e-mail marketing', 1, 1150, 2),
    seo: () => it('Consultoria de SEO', 1, 1600, 2),
    rede: () => it('Instalação de rede e cabeamento', 1, 3900, 3),
    foto: (d) => it('Fotografia de produto (diária)', d == null ? 2 : d, 950, 5),
    agendamento: () => it('Sistema de agendamento — implantação', 1, 5200, 5),
    fiscal: () => it('Relatório fiscal trimestral', 1, 640, 5),
    juridico: () => it('Assessoria jurídica — retainer', 1, 2400, 5),
    auditoria: () => it('Auditoria de processos', 1, 3200, 3),
    treinamento: (h) => it('Treinamento de equipe (hora)', h == null ? 8 : h, 180, 5),
    licenca: (u) => it('Licença de software — por usuário', u == null ? 5 : u, 89, 0),
    hospedagem: (m) => it('Hospedagem gerenciada (mês)', m == null ? 12 : m, 129, 0),
    site: () => it('Desenvolvimento de site institucional', 1, 6800, 5),
  };

  const TERMS_15 = 'Pagamento em até 15 dias corridos. Após o vencimento, multa de 2% e juros de 1% ao mês.';
  const TERMS_30 = 'Pagamento em até 30 dias corridos. Após o vencimento, multa de 2% e juros de 1% ao mês.';

  /* ── Faturas ─────────────────────────────────────────────────────────────
     As parcelas são declaradas em FRAÇÃO do total e convertidas em reais pelo
     próprio `invoiceTotal()`. A última parcela recebe a diferença, então
     Σ pagamentos == total, sempre, sem sobra de centavo.                     */

  const INVOICE_SEEDS = [
    // ── 5 meses atrás ────────────────────────────────────────────────────────
    {
      id: 1, number: 'CC-0001', clientId: 1, monthsAgo: 5, day: 4, termDays: 15,
      items: [S.contabil()], discount: 0, discountKind: 'valor', status: 'paga',
      notes: 'Competência do mês anterior.', recurringId: null,
      payments: [{ fraction: 1, monthsAgo: 5, day: 16, method: 'pix' }],
    },
    {
      id: 2, number: 'CC-0002', clientId: 3, monthsAgo: 5, day: 8, termDays: 30,
      items: [S.manutencao(), S.suporte(6)], discount: 0, discountKind: 'valor', status: 'paga',
      notes: 'Inclui 6h de suporte fora do plano.', recurringId: 1,
      payments: [{ fraction: 1, monthsAgo: 4, day: 2, method: 'transferencia' }],
    },
    {
      id: 3, number: 'CC-0003', clientId: 9, monthsAgo: 5, day: 15, termDays: 20,
      items: [S.erp()], discount: 250, discountKind: 'valor', status: 'paga',
      notes: 'Desconto acordado pela antecipação do escopo.', recurringId: null,
      payments: [{ fraction: 1, monthsAgo: 5, day: 28, method: 'boleto' }],
    },
    {
      id: 4, number: 'CC-0004', clientId: 5, monthsAgo: 5, day: 22, termDays: 30,
      items: [S.identidade()], discount: 10, discountKind: 'percentual', status: 'paga',
      notes: 'Projeto fechado em duas parcelas.', recurringId: null,
      payments: [
        { fraction: 0.5, monthsAgo: 4, day: 6, method: 'pix', note: 'Entrada' },
        { fraction: 0.5, monthsAgo: 4, day: 20, method: 'transferencia', note: 'Parcela final' },
      ],
    },

    // ── 4 meses atrás ────────────────────────────────────────────────────────
    {
      id: 5, number: 'CC-0005', clientId: 2, monthsAgo: 4, day: 3, termDays: 30,
      items: [S.manutencao()], discount: 0, discountKind: 'valor', status: 'paga',
      notes: 'Contrato 2024/117.', recurringId: 1,
      payments: [{ fraction: 1, monthsAgo: 4, day: 28, method: 'pix' }],
    },
    {
      id: 6, number: 'CC-0006', clientId: 4, monthsAgo: 4, day: 9, termDays: 15,
      items: [S.trafego()], discount: 0, discountKind: 'valor', status: 'paga',
      notes: 'Verba de mídia cobrada à parte pelo cliente.', recurringId: null,
      payments: [{ fraction: 1, monthsAgo: 4, day: 23, method: 'pix' }],
    },
    {
      id: 7, number: 'CC-0007', clientId: 7, monthsAgo: 4, day: 17, termDays: 30,
      items: [S.emailMkt(), S.seo()], discount: 100, discountKind: 'valor', status: 'cancelada',
      notes: 'Cancelada a pedido do cliente — escopo adiado para o próximo semestre.',
      recurringId: null, payments: [],
    },
    {
      id: 8, number: 'CC-0008', clientId: 6, monthsAgo: 4, day: 24, termDays: 30,
      items: [S.rede()], discount: 0, discountKind: 'valor', status: 'paga',
      notes: 'Obra do CD de Cajamar.', recurringId: null,
      payments: [{ fraction: 1, monthsAgo: 3, day: 20, method: 'transferencia' }],
    },

    // ── 3 meses atrás ────────────────────────────────────────────────────────
    {
      id: 9, number: 'CC-0009', clientId: 8, monthsAgo: 3, day: 5, termDays: 15,
      items: [S.foto(2)], discount: 0, discountKind: 'valor', status: 'paga',
      notes: 'Duas diárias para o catálogo de armações.', recurringId: null,
      payments: [{ fraction: 1, monthsAgo: 3, day: 16, method: 'pix' }],
    },
    {
      id: 10, number: 'CC-0010', clientId: 10, monthsAgo: 3, day: 11, termDays: 30,
      items: [S.agendamento()], discount: 5, discountKind: 'percentual', status: 'paga',
      notes: 'Implantação concluída com treinamento incluso.', recurringId: null,
      payments: [
        { fraction: 0.4, monthsAgo: 3, day: 23, method: 'boleto', note: 'Sinal de 40%' },
        { fraction: 0.6, monthsAgo: 2, day: 9, method: 'transferencia', note: 'Saldo na entrega' },
      ],
    },
    {
      id: 11, number: 'CC-0011', clientId: 1, monthsAgo: 3, day: 18, termDays: 15,
      items: [S.contabil()], discount: 0, discountKind: 'valor', status: 'enviada',
      notes: 'Cliente pediu segunda via por e-mail.', recurringId: null, payments: [],
    },
    {
      id: 12, number: 'CC-0012', clientId: 3, monthsAgo: 3, day: 26, termDays: 30,
      items: [S.fiscal(), S.juridico()], discount: 0, discountKind: 'valor', status: 'paga',
      notes: 'Fechamento do trimestre.', recurringId: 3,
      payments: [{ fraction: 1, monthsAgo: 2, day: 22, method: 'boleto' }],
    },

    // ── 2 meses atrás ────────────────────────────────────────────────────────
    {
      id: 13, number: 'CC-0013', clientId: 2, monthsAgo: 2, day: 2, termDays: 30,
      items: [S.manutencao()], discount: 0, discountKind: 'valor', status: 'cancelada',
      notes: 'Emitida em duplicidade — substituída pela CC-0021.', recurringId: 1, payments: [],
    },
    {
      id: 14, number: 'CC-0014', clientId: 9, monthsAgo: 2, day: 10, termDays: 20,
      items: [S.auditoria()], discount: 0, discountKind: 'valor', status: 'enviada',
      notes: 'Cliente pagou 40% e negociou o saldo para o fechamento do trimestre.',
      recurringId: null,
      payments: [{ fraction: 0.4, monthsAgo: 0, day: 10, method: 'pix', note: 'Pagamento parcial' }],
    },
    {
      id: 15, number: 'CC-0015', clientId: 5, monthsAgo: 2, day: 16, termDays: 30,
      items: [S.treinamento(8)], discount: 0, discountKind: 'valor', status: 'paga',
      notes: 'Turma de 12 pessoas, presencial.', recurringId: null,
      payments: [{ fraction: 1, monthsAgo: 1, day: 9, method: 'transferencia' }],
    },
    {
      id: 16, number: 'CC-0016', clientId: 6, monthsAgo: 2, day: 23, termDays: 15,
      items: [S.suporte(6)], discount: 0, discountKind: 'valor', status: 'enviada',
      notes: 'Chamados do mês fora do contrato.', recurringId: null, payments: [],
    },

    // ── 1 mês atrás ──────────────────────────────────────────────────────────
    {
      id: 17, number: 'CC-0017', clientId: 4, monthsAgo: 1, day: 4, termDays: 30,
      items: [S.licenca(5), S.hospedagem(12)], discount: 0, discountKind: 'valor', status: 'paga',
      notes: 'Renovação anual de licenças e hospedagem.', recurringId: 4,
      payments: [{ fraction: 1, monthsAgo: 0, day: 5, method: 'boleto' }],
    },
    {
      id: 18, number: 'CC-0018', clientId: 7, monthsAgo: 1, day: 6, termDays: 15,
      items: [S.seo()], discount: 0, discountKind: 'valor', status: 'enviada',
      notes: 'Segunda cobrança enviada; sem retorno até agora.', recurringId: null, payments: [],
    },
    {
      id: 19, number: 'CC-0019', clientId: 10, monthsAgo: 1, day: 19, termDays: 30,
      items: [S.manutencao()], discount: 0, discountKind: 'valor', status: 'rascunho',
      notes: 'Aguardando confirmação do reajuste contratual.', recurringId: 1, payments: [],
    },
    {
      id: 20, number: 'CC-0020', clientId: 8, monthsAgo: 1, day: 8, termDays: 15,
      items: [S.site()], discount: 500, discountKind: 'valor', status: 'enviada',
      notes: 'Entrada de 35% recebida; saldo previsto para a entrega da segunda fase.',
      recurringId: null,
      payments: [{ fraction: 0.35, monthsAgo: 1, day: 22, method: 'transferencia', note: 'Entrada de 35%' }],
    },

    // ── Mês corrente ─────────────────────────────────────────────────────────
    {
      id: 21, number: 'CC-0021', clientId: 2, monthsAgo: 0, day: 20, termDays: 15,
      items: [S.manutencao()], discount: 0, discountKind: 'valor', status: 'enviada',
      notes: 'Substitui a CC-0013.', recurringId: 1, payments: [],
    },
    {
      id: 22, number: 'CC-0022', clientId: 9, monthsAgo: 0, day: 24, termDays: 30,
      items: [S.suporte(6), S.hospedagem(3)], discount: 0, discountKind: 'valor', status: 'enviada',
      notes: 'Anexar XML da NFS-e no portal do cliente.', recurringId: 2, payments: [],
    },
    {
      id: 23, number: 'CC-0023', clientId: 5, monthsAgo: 0, day: 26, termDays: 20,
      items: [S.foto(2)], discount: 5, discountKind: 'percentual', status: 'enviada',
      notes: 'Metade paga no ato; saldo combinado para a entrega dos arquivos.',
      recurringId: null,
      payments: [{ fraction: 0.5, monthsAgo: 0, day: 28, method: 'pix', note: 'Metade no ato' }],
    },
    {
      id: 24, number: 'CC-0024', clientId: 7, monthsAgo: 0, day: 28, termDays: 30,
      items: [S.emailMkt()], discount: 0, discountKind: 'valor', status: 'rascunho',
      notes: 'Retomada da campanha adiada em CC-0007.', recurringId: null, payments: [],
    },
  ];

  let paymentSeq = 0;

  function buildInvoice(seed) {
    const issuedAt = at(seed.monthsAgo, seed.day);
    const total = Q.invoiceTotal({
      items: seed.items,
      discount: seed.discount,
      discountKind: seed.discountKind,
    });

    const fullyPaid = Q.round2(seed.payments.reduce((sum, p) => sum + p.fraction, 0)) === 1;
    let allocated = 0;
    const payments = seed.payments.map((p, index) => {
      const isLast = index === seed.payments.length - 1;
      const amount = isLast && fullyPaid ? Q.round2(total - allocated) : Q.round2(total * p.fraction);
      allocated = Q.round2(allocated + amount);
      return {
        id: ++paymentSeq,
        at: at(p.monthsAgo, p.day, 15),
        amount,
        method: p.method,
        note: p.note == null ? '' : p.note,
      };
    });

    return {
      id: seed.id,
      number: seed.number,
      clientId: seed.clientId,
      issuedAt,
      dueAt: plusDays(issuedAt, seed.termDays),
      items: seed.items,
      discount: seed.discount,
      discountKind: seed.discountKind,
      status: seed.status,
      payments,
      notes: seed.notes,
      terms: seed.termDays >= 30 ? TERMS_30 : TERMS_15,
      recurringId: seed.recurringId,
    };
  }

  const INVOICES = INVOICE_SEEDS.map(buildInvoice);

  /* ── Orçamentos ────────────────────────────────────────────────────────── */

  const QUOTES = [
    {
      id: 1,
      number: 'ORC-0001',
      clientId: 8,
      issuedAt: at(2, 12),
      validUntil: at(1, 12),
      items: [S.site(), S.seo()],
      discount: 500,
      discountKind: 'valor',
      status: 'aceito',
      notes: 'Aprovado por e-mail; virou a fatura CC-0020.',
    },
    {
      id: 2,
      number: 'ORC-0002',
      clientId: 4,
      issuedAt: at(1, 14),
      validUntil: at(0, 14),
      items: [S.agendamento(), S.treinamento(8)],
      discount: 0,
      discountKind: 'valor',
      status: 'recusado',
      notes: 'Cliente optou por manter o sistema atual neste ano.',
    },
    {
      id: 3,
      number: 'ORC-0003',
      clientId: 6,
      issuedAt: at(2, 26),
      validUntil: at(1, 26),
      items: [S.rede(), S.suporte(10)],
      discount: 0,
      discountKind: 'valor',
      status: 'expirado',
      notes: 'Prazo de validade venceu sem retorno do setor de compras.',
    },
    {
      id: 4,
      number: 'ORC-0004',
      clientId: 10,
      issuedAt: at(0, 6),
      validUntil: plusDays(at(0, 6), 20),
      items: [S.identidade(), S.foto(3)],
      discount: 8,
      discountKind: 'percentual',
      status: 'enviado',
      notes: 'Rebranding da academia com ensaio nas duas unidades.',
    },
    {
      id: 5,
      number: 'ORC-0005',
      clientId: 2,
      issuedAt: at(0, 12),
      validUntil: plusDays(at(0, 12), 15),
      items: [S.erp(), S.treinamento(6)],
      discount: 0,
      discountKind: 'valor',
      status: 'enviado',
      notes: 'Integração do prontuário com o financeiro.',
    },
    {
      id: 6,
      number: 'ORC-0006',
      clientId: 7,
      issuedAt: at(0, 18),
      validUntil: plusDays(at(0, 18), 30),
      items: [S.emailMkt(), S.trafego()],
      discount: 0,
      discountKind: 'valor',
      status: 'rascunho',
      notes: 'Falta confirmar a verba de mídia com o cliente.',
    },
  ];

  /* ── Recorrentes ───────────────────────────────────────────────────────── */

  const RECURRINGS = [
    {
      id: 1,
      clientId: 2,
      items: [S.manutencao()],
      cycle: 'mensal',
      nextIssueAt: plusDays(NOW.toISOString(), 12),
      active: true,
      generatedInvoiceIds: [2, 5, 13, 19, 21],
    },
    {
      id: 2,
      clientId: 9,
      items: [S.suporte(6), S.hospedagem(3)],
      cycle: 'mensal',
      nextIssueAt: plusDays(NOW.toISOString(), 21),
      active: true,
      generatedInvoiceIds: [22],
    },
    {
      id: 3,
      clientId: 3,
      items: [S.fiscal()],
      cycle: 'trimestral',
      nextIssueAt: plusDays(NOW.toISOString(), 38),
      active: true,
      generatedInvoiceIds: [12],
    },
    {
      id: 4,
      clientId: 4,
      items: [S.licenca(5), S.hospedagem(12)],
      cycle: 'anual',
      nextIssueAt: plusDays(NOW.toISOString(), 320),
      active: false,
      generatedInvoiceIds: [17],
    },
  ];

  /* ── Despesas ──────────────────────────────────────────────────────────── */

  const EXPENSE_SEEDS = [
    // Fixas de todo mês: aluguel, pró-labore e DAS. Mais duas variáveis por mês.
    { monthsAgo: 5, day: 3, description: 'Aluguel do escritório', category: 'escritorio', amount: 1450, deductible: true, receipt: 'recibo-aluguel-01.pdf', supplier: 'Imobiliária Central' },
    { monthsAgo: 5, day: 5, description: 'Pró-labore dos sócios', category: 'pessoal', amount: 3200, deductible: true, receipt: 'folha-01.pdf', supplier: 'Folha interna' },
    { monthsAgo: 5, day: 11, description: 'Honorários da contabilidade', category: 'servicos', amount: 780, deductible: true, receipt: 'nfse-3120.pdf', supplier: 'Contábil Nova Era' },
    { monthsAgo: 5, day: 19, description: 'DAS — Simples Nacional', category: 'impostos', amount: 512.4, deductible: false, receipt: 'das-competencia.pdf', supplier: 'Receita Federal' },
    { monthsAgo: 5, day: 26, description: 'Assinatura da suíte de design', category: 'software', amount: 289.9, deductible: true, receipt: 'nf-adobe-4471.pdf', supplier: 'Adobe do Brasil' },

    { monthsAgo: 4, day: 3, description: 'Aluguel do escritório', category: 'escritorio', amount: 1450, deductible: true, receipt: 'recibo-aluguel-02.pdf', supplier: 'Imobiliária Central' },
    { monthsAgo: 4, day: 5, description: 'Pró-labore dos sócios', category: 'pessoal', amount: 3200, deductible: true, receipt: 'folha-02.pdf', supplier: 'Folha interna' },
    { monthsAgo: 4, day: 7, description: 'Anúncios Google Ads', category: 'marketing', amount: 680, deductible: true, receipt: 'nf-google-8812.pdf', supplier: 'Google Brasil' },
    { monthsAgo: 4, day: 18, description: 'DAS — Simples Nacional', category: 'impostos', amount: 586.2, deductible: false, receipt: 'das-competencia.pdf', supplier: 'Receita Federal' },
    { monthsAgo: 4, day: 24, description: 'Internet dedicada 300 Mbps', category: 'escritorio', amount: 349, deductible: true, receipt: 'fatura-vivo.pdf', supplier: 'Vivo Empresas' },

    { monthsAgo: 3, day: 3, description: 'Aluguel do escritório', category: 'escritorio', amount: 1450, deductible: true, receipt: 'recibo-aluguel-03.pdf', supplier: 'Imobiliária Central' },
    { monthsAgo: 3, day: 5, description: 'Pró-labore dos sócios', category: 'pessoal', amount: 3200, deductible: true, receipt: 'folha-03.pdf', supplier: 'Folha interna' },
    { monthsAgo: 3, day: 15, description: 'Servidores e CDN', category: 'software', amount: 742.5, deductible: true, receipt: 'invoice-aws.pdf', supplier: 'Amazon Web Services' },
    { monthsAgo: 3, day: 21, description: 'DAS — Simples Nacional', category: 'impostos', amount: 604.15, deductible: false, receipt: 'das-competencia.pdf', supplier: 'Receita Federal' },
    { monthsAgo: 3, day: 27, description: 'Combustível e pedágio (visitas técnicas)', category: 'transporte', amount: 486.3, deductible: true, receipt: null, supplier: 'Posto Ipiranga' },

    { monthsAgo: 2, day: 3, description: 'Aluguel do escritório', category: 'escritorio', amount: 1450, deductible: true, receipt: 'recibo-aluguel-04.pdf', supplier: 'Imobiliária Central' },
    { monthsAgo: 2, day: 5, description: 'Pró-labore dos sócios', category: 'pessoal', amount: 3200, deductible: true, receipt: 'folha-04.pdf', supplier: 'Folha interna' },
    { monthsAgo: 2, day: 8, description: 'Anúncios Meta Ads', category: 'marketing', amount: 520, deductible: true, receipt: 'nf-meta-2210.pdf', supplier: 'Meta Platforms' },
    { monthsAgo: 2, day: 17, description: 'Freelancer de conteúdo', category: 'servicos', amount: 900, deductible: true, receipt: 'rpa-0182.pdf', supplier: 'Marina Toledo ME' },
    { monthsAgo: 2, day: 24, description: 'DAS — Simples Nacional', category: 'impostos', amount: 496.8, deductible: false, receipt: 'das-competencia.pdf', supplier: 'Receita Federal' },

    { monthsAgo: 1, day: 3, description: 'Aluguel do escritório', category: 'escritorio', amount: 1450, deductible: true, receipt: 'recibo-aluguel-05.pdf', supplier: 'Imobiliária Central' },
    { monthsAgo: 1, day: 5, description: 'Pró-labore dos sócios', category: 'pessoal', amount: 3200, deductible: true, receipt: 'folha-05.pdf', supplier: 'Folha interna' },
    { monthsAgo: 1, day: 13, description: 'Notebook para o time de suporte', category: 'equipamento', amount: 4290, deductible: true, receipt: 'nf-9921.pdf', supplier: 'Kabum Empresas' },
    { monthsAgo: 1, day: 20, description: 'Uber e táxi (reuniões)', category: 'transporte', amount: 312.75, deductible: false, receipt: null, supplier: 'Uber do Brasil' },
    { monthsAgo: 1, day: 23, description: 'DAS — Simples Nacional', category: 'impostos', amount: 533.5, deductible: false, receipt: 'das-competencia.pdf', supplier: 'Receita Federal' },

    { monthsAgo: 0, day: 2, description: 'Aluguel do escritório', category: 'escritorio', amount: 1450, deductible: true, receipt: 'recibo-aluguel-06.pdf', supplier: 'Imobiliária Central' },
    { monthsAgo: 0, day: 4, description: 'Pró-labore dos sócios', category: 'pessoal', amount: 3200, deductible: true, receipt: 'folha-06.pdf', supplier: 'Folha interna' },
    { monthsAgo: 0, day: 5, description: 'Assinatura da suíte de design', category: 'software', amount: 289.9, deductible: true, receipt: 'nf-adobe-4790.pdf', supplier: 'Adobe do Brasil' },
    { monthsAgo: 0, day: 6, description: 'DAS — Simples Nacional', category: 'impostos', amount: 574.3, deductible: false, receipt: 'das-competencia.pdf', supplier: 'Receita Federal' },
    { monthsAgo: 0, day: 8, description: 'Café, água e material de copa', category: 'escritorio', amount: 268.4, deductible: false, receipt: null, supplier: 'Atacadão Distribuição' },
  ];

  const EXPENSES = EXPENSE_SEEDS.map((seed, index) => ({
    id: index + 1,
    at: at(seed.monthsAgo, seed.day, 11),
    description: seed.description,
    category: seed.category,
    amount: seed.amount,
    deductible: seed.deductible,
    receipt: seed.receipt,
    supplier: seed.supplier,
  }));

  /* ── Conteúdo do site público ──────────────────────────────────────────── */

  const PLANS = [
    {
      key: 'solo',
      price: 39,
      invoices: '20',
      featured: false,
      featureKeys: ['invoices', 'clients', 'quotes', 'export'],
    },
    {
      key: 'pro',
      price: 89,
      invoices: '200',
      featured: true,
      featureKeys: ['invoices', 'clients', 'quotes', 'recurring', 'expenses', 'reports', 'export'],
    },
    {
      key: 'empresa',
      price: 189,
      invoices: '∞',
      featured: false,
      featureKeys: ['invoices', 'clients', 'quotes', 'recurring', 'expenses', 'reports', 'multiUser', 'api', 'support'],
    },
  ];

  const FEATURE_KEYS = ['invoices', 'recurring', 'expenses', 'reports', 'taxes', 'reconciliation'];

  const FEATURE_ICONS = {
    invoices: 'receipt',
    recurring: 'refresh-cw',
    expenses: 'banknote',
    reports: 'bar-chart',
    taxes: 'percent',
    reconciliation: 'check-circle',
  };

  const FAQ_KEYS = ['nfe', 'migrate', 'cancel', 'accountant', 'security', 'trial'];

  const TEAM = [
    { key: 'ana', seed: 'ana-financeiro' },
    { key: 'rafael', seed: 'rafael-produto' },
    { key: 'juliana', seed: 'juliana-contabil' },
    { key: 'marcos', seed: 'marcos-suporte' },
  ];

  const TIMELINE_KEYS = ['founded', 'firstThousand', 'recurring', 'today'];

  global.Data = {
    ivImage,
    COMPANY,
    CLIENTS,
    INVOICES,
    QUOTES,
    RECURRINGS,
    EXPENSES,
    PLANS,
    FEATURE_KEYS,
    FEATURE_ICONS,
    FAQ_KEYS,
    TEAM,
    TIMELINE_KEYS,
  };
})(window);
