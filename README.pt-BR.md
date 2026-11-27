# Faturamento & Financeiro / HTML

[Read in English](./README.md)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE) ![Free](https://img.shields.io/badge/price-free-brightgreen)

Faturamento para prestador de serviço em HTML + Tailwind: site público e financeiro com visão geral (a receber, vencido, recebido no mês, despesas), faturas com documento imprimível e pagamentos parciais, orçamentos que viram fatura, assinaturas recorrentes por ciclo, clientes com dados fiscais e extrato, despesas por categoria e relatórios com DRE simplificada e impostos estimados. Os números fecham por construção e "vencida" é derivado da data, não gravado. i18n pt-BR/en/es, PWA, dark mode.

## Destaques

- Fatura imprimível com pagamento parcial
- Orçamento que vira fatura
- Assinaturas recorrentes por ciclo
- DRE simplificada e impostos estimados
- i18n pt-BR/en/es, PWA, dark mode

## Telas em destaque

- Visão geral: A receber e vencido
- Fatura: Documento e pagamentos
- Recorrentes: Ciclo e próxima emissão
- Relatórios: DRE e impostos

## Stack

- HTML5
- JavaScript
- Tailwind CSS v4
- ApexCharts

## Requisitos

- Node.js 20 ou mais novo, com npm

## Como rodar

```bash
npm install
npm run dev
```

O servidor de desenvolvimento mostra a URL local para abrir.

Conta de demonstração:

- `financeiro@contacerta.com` / `demo123`

## Build de produção

```bash
npm run build
```

Gera o pacote de produção em `dist/`; para conferir localmente, `npm run preview`. Qualquer hospedagem estática serve; para as rotas no cliente, redirecione caminhos desconhecidos para `index.html`.
Gera as páginas e assets otimizados em `dist/`. Os arquivos HTML também funcionam servidos direto por qualquer servidor estático.

## Estrutura do projeto

```
18 HTML pages at the root
assets/
```

## Outras tecnologias

Este template também existe em outras 4 tecnologias, com as mesmas telas e a mesma identidade visual. Todas são gratuitas:

- React 19: https://github.com/danilo62x/invoicing-react
- Vue 3: https://github.com/danilo62x/invoicing-vue3
- Angular 19: https://github.com/danilo62x/invoicing-angular
- Laravel 11: https://github.com/danilo62x/invoicing-laravel

Mais templates gratuitos (painéis admin, sistemas por segmento e apps Flutter): https://github.com/danilo62x?tab=repositories

## Licença

[MIT](./LICENSE), copyright 2026 Danilo Quinelato.
