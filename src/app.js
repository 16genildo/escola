require('dotenv').config();
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const session = require('express-session');
const flash = require('connect-flash');
const MongoStore = require('connect-mongo');
const Usuario = require('./models/Usuario');
const connectDB = require('./config/database');

const app = express();

// Configuração do EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middlewares
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

// Configuração da sessão - APENAS UMA VEZ
app.use(session({
    secret: process.env.SESSION_SECRET || 'uma_chave_secreta_muito_segura',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ 
        mongoUrl: process.env.MONGODB_URI,
        ttl: 24 * 60 * 60 // 1 dia
    }),
    cookie: {
        // Use secure true somente em produção (https)
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 1 dia
    }
}));

// Flash messages
app.use(flash());

// Middleware para variáveis globais
app.use((req, res, next) => {
    // Sempre definir um usuário padrão na sessão
    if (!req.session.userId) {
        req.session.userId = 'default';
        req.session.nome = 'Usuário';
        req.session.isAdmin = true;
    }
    
    res.locals.user = {
        id: req.session.userId,
        nome: req.session.nome,
        isAdmin: req.session.isAdmin
    };
    next();
});

// Função para criar usuário padrão
async function createDefaultUser() {
    try {
        const existingAdmin = await Usuario.findOne({ username: 'admin' });
        
        if (!existingAdmin) {
            const defaultUser = new Usuario({
                username: 'admin',
                password: 'admin123',
                nome: 'Administrador',
                isAdmin: true
            });

            await defaultUser.save();
            console.log('Usuário padrão criado com sucesso');
        }
    } catch (error) {
        console.error('Erro ao criar usuário padrão:', error);
    }
}

// Conexão com o MongoDB e inicialização
connectDB()
    .then(async () => {
        await createDefaultUser();
        
        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => {
            console.log(`Servidor rodando na porta ${PORT}`);
        });
    })
    .catch(err => {
        console.error('Erro ao inicializar a aplicação:', err);
        process.exit(1);
    });

// Rotas
const estudantesRoutes = require('./routes/estudantes');
const partesRoutes = require('./routes/partes');
const designacoesRoutes = require('./routes/designacoes');

app.use('/estudantes', estudantesRoutes);
app.use('/partes', partesRoutes);
app.use('/designacoes', designacoesRoutes);

// Rota principal
app.get('/', (req, res) => {
    res.redirect('/designacoes');
});
