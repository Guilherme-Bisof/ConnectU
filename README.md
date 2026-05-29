# ConnectU - Frontend

Interface web para a plataforma **ConnectU**, uma aplicação de rede profissional e gerenciamento de oportunidades.

## 📋 Sobre o Projeto

O **ConnectU** é uma plataforma que conecta profissionais, permitindo:
- Gerenciar perfil profissional
- Visualizar e aplicar em oportunidades de emprego
- Compartilhar e interagir com posts
- Gerenciar conexões profissionais

## 🛠️ Stack de Tecnologia

### Frontend
- **[Next.js 16](https://nextjs.org/)** - Framework React com SSR e SSG
- **[React 19](https://react.dev/)** - Biblioteca UI
- **[TypeScript](https://www.typescriptlang.org/)** - Tipagem estática
- **[Tailwind CSS 4](https://tailwindcss.com/)** - Utility-first CSS
- **[React Icons](https://react-icons.github.io/react-icons/)** - Biblioteca de ícones

### Backend (Complementar)
- **[Express.js](https://expressjs.com/)** - Framework web
- **[Prisma ORM](https://www.prisma.io/)** - ORM para banco de dados
- **[TypeScript](https://www.typescriptlang.org/)** - Tipagem estática

## 📁 Estrutura do Projeto

```
frontend/
├── src/
│   ├── app/
│   │   ├── globals.css           # Estilos globais
│   │   ├── layout.tsx            # Layout raiz
│   │   ├── page.tsx              # Home
│   │   ├── dashboard/            # Dashboard
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   └── perfil/           # Perfil do usuário
│   │   │       └── page.tsx
├── public/                        # Arquivos estáticos
└── package.json
```

## 🚀 Primeiros Passos

### Pré-requisitos
- Node.js 18+
- npm ou yarn

### Instalação

1. **Instalar dependências**
```bash
npm install
```

2. **Configurar variáveis de ambiente**
Crie um arquivo `.env.local` na raiz do projeto:
```env
NEXT_PUBLIC_API_URL=http://localhost:3333
```

3. **Executar em desenvolvimento**
```bash
npm run dev
```

A aplicação estará disponível em [http://localhost:3000](http://localhost:3000)

### Outros comandos

```bash
# Build para produção
npm run build

# Executar em produção
npm start

# Linting
npm run lint
```

## 📚 Rotas Principais

- `/` - Home
- `/dashboard` - Dashboard do usuário
- `/dashboard/perfil` - Perfil profissional

## 🔗 Integração com Backend

O backend roda na porta `3333` e expõe as seguintes rotas:

- `/users` - Gestão de usuários
- `/jobs` - Gestão de oportunidades
- `/links` - Gestão de conexões
- `/posts` - Gestão de posts
- `/login` - Autenticação

## 📖 Recursos Úteis

- [Documentação Next.js](https://nextjs.org/docs)
- [Documentação React](https://react.dev/)
- [Documentação Tailwind CSS](https://tailwindcss.com/docs)
- [Documentação Prisma](https://www.prisma.io/docs/)

## 🤝 Contribuição

Contribuições são bem-vindas! Sinta-se livre para abrir issues e pull requests.

## 📄 Licença

ISC
