# Aplicação de Acessibilidade

Uma aplicação moderna e inclusiva construída com **Next.js 15** e **Tailwind CSS 4**, focada em proporcionar uma experiência digital acessível para todos os usuários.

## 🚀 Tecnologias Utilizadas

- **Next.js 15.2.4** - Framework React com App Router
- **React 19** - Biblioteca de interface do usuário
- **Tailwind CSS 4** - Framework CSS utilitário
- **TypeScript 5** - Tipagem estática para JavaScript
- **Turbopack** - Bundler rápido para desenvolvimento

## ✨ Características

- 🎨 **Design Moderno**: Interface limpa e responsiva
- 📱 **Totalmente Responsivo**: Funciona perfeitamente em todos os dispositivos
- ♿ **Acessibilidade**: Desenvolvido seguindo as melhores práticas de acessibilidade
- ⚡ **Performance Otimizada**: Carregamento rápido com Turbopack
- 🎭 **Animações Suaves**: Transições e efeitos visuais elegantes
- 🔧 **Fácil Customização**: Sistema de design flexível com Tailwind CSS

## 🛠️ Instalação

1. **Clone o repositório**
   ```bash
   git clone <url-do-repositorio>
   cd acessibilidade
   ```

2. **Instale as dependências**
   ```bash
   npm install
   # ou
   yarn install
   # ou
   pnpm install
   ```

3. **Execute o servidor de desenvolvimento**
   ```bash
   npm run dev
   # ou
   yarn dev
   # ou
   pnpm dev
   ```

4. **Abra no navegador**
   ```
   http://localhost:3000
   ```

## 📁 Estrutura do Projeto

```
acessibilidade/
├── app/                    # App Router do Next.js
│   ├── globals.css        # Estilos globais e Tailwind
│   ├── layout.tsx         # Layout principal da aplicação
│   └── page.tsx           # Página inicial
├── components/             # Componentes React reutilizáveis
│   ├── Header.tsx         # Cabeçalho com navegação
│   ├── Hero.tsx           # Seção principal
│   ├── Features.tsx       # Recursos da aplicação
│   ├── ContactForm.tsx    # Formulário de contato
│   └── Footer.tsx         # Rodapé da aplicação
├── public/                 # Arquivos estáticos
├── package.json            # Dependências e scripts
├── tsconfig.json           # Configuração TypeScript
├── tailwind.config.ts      # Configuração Tailwind CSS
├── postcss.config.js       # Configuração PostCSS
└── next.config.js          # Configuração Next.js
```

## 🎯 Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento com Turbopack
- `npm run build` - Constrói a aplicação para produção
- `npm run build:homolog` - Constrói para ambiente de homologação
- `npm run build:prod` - Constrói para ambiente de produção
- `npm run start` - Inicia o servidor de produção
- `npm run start:homolog` - Inicia servidor de homologação
- `npm run start:prod` - Inicia servidor de produção
- `npm run lint` - Executa o linter ESLint

## 🎨 Personalização

### Cores
As cores podem ser personalizadas no arquivo `tailwind.config.ts`:

```typescript
colors: {
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    // ... outras variações
  }
}
```

### Componentes
Os componentes estão localizados em `components/` e podem ser facilmente modificados para atender às suas necessidades.

## 📱 Responsividade

A aplicação é totalmente responsiva e inclui:
- **Mobile First**: Design otimizado para dispositivos móveis
- **Breakpoints**: Adaptação para tablets e desktops
- **Navegação**: Menu hambúrguer para dispositivos móveis
- **Grid System**: Layout flexível que se adapta a diferentes tamanhos de tela

## ♿ Acessibilidade

A aplicação segue as melhores práticas de acessibilidade:
- **Semântica HTML**: Uso correto de tags e estrutura
- **Navegação por Teclado**: Suporte completo para navegação sem mouse
- **Contraste**: Cores com contraste adequado
- **ARIA Labels**: Atributos para leitores de tela
- **Foco Visual**: Indicadores claros de foco

## 🚀 Deploy

### Vercel (Recomendado)
```bash
npm run build
vercel --prod
```

### Outras Plataformas
```bash
npm run build
npm run start
```

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 📞 Suporte

Se você tiver alguma dúvida ou precisar de ajuda:
- 📧 Email: contato@acessibilidade.com
- 📱 Telefone: +55 (11) 99999-9999
- 🌐 Website: [acessibilidade.com](https://acessibilidade.com)

---

**Desenvolvido com ❤️ para tornar a web mais acessível para todos.** 