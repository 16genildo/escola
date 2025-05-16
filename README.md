# Sistema de Designação - Escola do Ministério Teocrático

Sistema web para gerenciar as designações de partes para estudantes da Escola do Ministério Teocrático.

## Funcionalidades

- Cadastro e gerenciamento de estudantes
- Cadastro e gerenciamento de partes
- Criação de designações semanais
- Visualização do histórico de designações
- Controle de repetição de estudantes em semanas consecutivas
- Organização por salas (A e B)

## Tecnologias Utilizadas

- Node.js
- Express
- MongoDB
- EJS (Embedded JavaScript templates)
- Bootstrap 5
- JavaScript

## Pré-requisitos

- Node.js (v14 ou superior)
- MongoDB (v4.4 ou superior)

## Instalação

1. Clone o repositório:
```bash
git clone [URL_DO_REPOSITORIO]
cd designacao
```

2. Instale as dependências:
```bash
npm install
```

3. Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/escola_ministerio
```

4. Inicie o servidor:
```bash
npm start
```

Para desenvolvimento, você pode usar:
```bash
npm run dev
```

## Estrutura do Projeto

```
designacao/
├── src/
│   ├── controllers/
│   │   ├── EstudanteController.js
│   │   ├── ParteController.js
│   │   └── DesignacaoController.js
│   ├── models/
│   │   ├── Estudante.js
│   │   ├── Parte.js
│   │   └── Designacao.js
│   ├── public/
│   │   ├── css/
│   │   │   └── style.css
│   │   └── js/
│   │       └── main.js
│   ├── routes/
│   │   ├── estudantes.js
│   │   ├── partes.js
│   │   └── designacoes.js
│   ├── views/
│   │   ├── layout.ejs
│   │   ├── index.ejs
│   │   ├── estudantes/
│   │   ├── partes/
│   │   └── designacoes/
│   └── app.js
├── package.json
└── README.md
```

## Uso

1. Acesse o sistema em `http://localhost:3000`
2. Primeiro, cadastre os estudantes em "Estudantes"
3. Em seguida, cadastre as partes disponíveis em "Partes"
4. Por fim, crie as designações semanais em "Designações"

## Contribuição

1. Faça um Fork do projeto
2. Crie uma Branch para sua Feature (`git checkout -b feature/AmazingFeature`)
3. Faça o Commit das suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Faça o Push para a Branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## Licença

Este projeto está sob a licença ISC. 