# HealthCare — Sistema de Triagem Hospitalar

Aplicação web acadêmica para registrar pacientes e triagens, acompanhar uma fila priorizada por classificação clínica e consultar o histórico. A fila usa categorias inspiradas em classificação de risco e apresenta tempos estimados apenas como referência. **Este projeto não é um sistema hospitalar validado; não substitui avaliação profissional e não deve ser usado em atendimento clínico real.** A carga de demonstração contém somente dados fictícios.

## Tecnologias

- Front-end: React 19, TypeScript, Vite, Lucide.
- Back-end: Node.js, Express, TypeScript, Zod.
- Dados: SQLite local e Prisma ORM.
- Testes: Vitest e Supertest.

## Estrutura

```text
client/                 Interface web
  src/main.tsx           Telas, navegação e integração REST
  src/style.css          Estilos responsivos
server/                 API, dados e testes
  prisma/schema.prisma   Modelo relacional
  prisma/seed.ts         Carga fictícia opcional
  src/index.ts           Rotas REST, validação e erros
  src/index.test.ts      Testes da API
```

## Requisitos e instalação (Windows)

Instale Node.js 20+ e Git. Na pasta do projeto:

```powershell
Copy-Item .env.example .env
npm.cmd install
```

O `.env.example` tem token de exemplo. Configure `APP_API_TOKEN` no `.env` e defina o mesmo valor em `VITE_API_TOKEN` (Vite carrega `.env` da raiz). Para ambiente estritamente local de avaliação, o token pode ficar vazio nos dois lados; nesse modo a API não exige autenticação. **Não use dados reais nem exponha o serviço em rede.**

## Banco e execução

```powershell
npm.cmd run db:push
npm.cmd run db:seed       # opcional; apenas paciente e triagem fictícios
npm.cmd run dev
```

Front-end: http://localhost:5173. API: http://localhost:3001/api. O banco SQLite é criado em `server/prisma/dev.db` e persiste entre reinicializações. `DATABASE_URL="file:./dev.db"` é relativo ao diretório `server/prisma`.

Para iniciar separadamente, use dois terminais PowerShell: `npm.cmd run dev -w server` e `npm.cmd run dev -w client`.

## Testes e build

```powershell
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
```

## API

Todas as rotas usam prefixo `/api`. Se `APP_API_TOKEN` estiver configurado, envie `Authorization: Bearer <token>`.

| Método | Rota | Ação |
|---|---|---|
| GET | `/health` | Verifica API |
| GET | `/patients?q=` | Pesquisa pacientes |
| POST | `/patients` | Cadastra; CPF validado e único |
| GET | `/patients/:id` | Consulta paciente |
| PUT | `/patients/:id` | Atualiza paciente |
| GET | `/patients/:id/history` | Histórico de triagens e atendimentos |
| GET | `/triages` | Lista triagens |
| POST | `/triages` | Registra triagem e cria atendimento aguardando |
| GET | `/queue?status=` | Lista fila ordenada por risco e antiguidade |
| PATCH | `/encounters/:id/status` | Atualiza situação |
| GET | `/docs` | Especificação OpenAPI resumida |

Riscos aceitos: `EMERGENCIA`, `MUITO_URGENTE`, `URGENTE`, `POUCO_URGENTE`, `NAO_URGENTE`. Situações: `AGUARDANDO`, `EM_ATENDIMENTO`, `CONCLUIDO`. Espera estimada atual: 0, 10, 60, 120 e 240 minutos conforme a categoria; são referências estáticas para demonstração, sem garantia de atendimento.

## Autenticação, dados e limitações

A API oferece um token Bearer compartilhado opcional, adequado apenas a demonstração local. Não há contas individuais, papéis de acesso, sessões, auditoria, criptografia do arquivo SQLite ou proteção para implantação pública. O token entregue ao front-end é público no navegador, portanto não é autenticação segura de produção. Não armazene dados pessoais ou médicos reais. CPF é validado por dígitos verificadores e restrição de unicidade; isso não verifica identidade. A classificação deve ser feita por profissional habilitado. Para produção são necessários revisão de segurança, privacidade e conformidade regulatória, autenticação individual e validação clínica.
