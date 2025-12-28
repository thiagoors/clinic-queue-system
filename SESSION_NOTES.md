# Notas da Sessão - Sistema de Senhas para Clínica Médica

**Data:** 28/12/2024
**Repositório:** https://github.com/thiagoors/clinic-queue-system

---

## O que foi desenvolvido

Sistema completo de gerenciamento de filas/senhas para clínica médica com as seguintes funcionalidades:

### Telas/Módulos

1. **Totem** (`/`) - Paciente tira senha
   - Escolhe tipo: Consulta, Pronto Atendimento, Prioridade
   - Digita 5 primeiros dígitos do CPF
   - Recebe senha (ex: C001, A002, P003)

2. **Painel Recepção** (`/reception`) - Atendentes
   - Vê fila de pacientes aguardando
   - Chama paciente (aparece no Display)
   - Preenche nome e encaminha para setor/médico

3. **Painel Setor/Médico** (`/sector`) - Médicos
   - Vê pacientes encaminhados para seu setor
   - Chama paciente (aparece no Display)
   - Finaliza atendimento

4. **Painel TV/Display** (`/display`) - Público
   - Mostra chamadas da recepção (senha + CPF + guichê)
   - Mostra chamadas dos setores (nome + sala + médico)
   - Atualização em tempo real via WebSocket
   - Som de notificação

5. **Painel Admin** (`/admin`) - Administrador
   - Dashboard com estatísticas
   - CRUD de usuários
   - CRUD de setores

---

## Stack Tecnológica

- **Frontend:** React 18 + Vite + TailwindCSS
- **Backend:** Node.js + Express + Socket.IO
- **Banco:** SQLite (via Prisma ORM)
- **Autenticação:** JWT + bcrypt

---

## Estrutura do Projeto

```
password_manager/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma    # Modelo de dados
│   │   └── seed.js          # Dados iniciais
│   ├── src/
│   │   ├── routes/          # APIs REST
│   │   ├── middleware/      # Auth JWT
│   │   ├── socket/          # WebSocket handlers
│   │   └── index.js         # Servidor
│   └── .env                 # Configurações
│
└── frontend/
    └── src/
        ├── pages/           # Telas
        ├── contexts/        # Auth + Socket
        ├── hooks/           # useSound
        └── services/        # API client
```

---

## Como Rodar

### Backend
```bash
cd backend
npm install
npx prisma db push
npm run db:seed
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## Credenciais de Teste

| Perfil | Email | Senha |
|--------|-------|-------|
| Admin | admin@clinica.com | admin123 |
| Recepcionista | recepcionista1@clinica.com | recep123 |
| Médico | dr.silva@clinica.com | doctor123 |

---

## Correções Realizadas

1. **PostgreSQL → SQLite:** Alterado para simplificar (sem necessidade de servidor de banco)
2. **Enums removidos:** SQLite não suporta enums, convertidos para String
3. **WebSocket fix:** Corrigido problema onde o socket tentava entrar na sala antes de conectar

---

## Pendências/Melhorias Futuras

- [ ] Testes automatizados
- [ ] Deploy na nuvem (sugestão: Railway, Render, Vercel)
- [ ] Impressão de senha no totem
- [ ] Histórico de atendimentos
- [ ] Relatórios gerenciais
- [ ] Múltiplos guichês por recepcionista
