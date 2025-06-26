const Usuario = require('../models/Usuario');

module.exports = {
    // Renderizar página de login
    loginForm(req, res) {
        res.render('layout', {
            template: 'pages/login',
            error: req.flash('error')
        });
    },

    // Processar login
    async login(req, res) {
        try {
            const { username, password } = req.body;

            const usuario = await Usuario.findOne({ username });

            if (!usuario || !(await usuario.verificarSenha(password))) {
                req.flash('error', 'Usuário ou senha inválidos');
                return res.redirect('/login');
            }

            req.session.userId = usuario._id;
            req.session.isAdmin = usuario.isAdmin;
            req.session.nome = usuario.nome;

            // Verificar conteúdo da sessão
            console.log('Sessão após login:', req.session);

            res.redirect('/');
        } catch (error) {
            console.error('Erro no login:', error);
            req.flash('error', 'Erro ao fazer login');
            res.redirect('/login');
        }
    },

    // Logout
    logout(req, res) {
        req.session.destroy(() => {
            res.redirect('/login');
        });
    },

    // Middleware para verificar autenticação
    requireAuth(req, res, next) {
        if (!req.session.userId) {
            return res.redirect('/login');
        }
        next();
    },

    // Renderizar página de registro
    registerForm(req, res) {
        res.render('layout', {
            template: 'pages/register',
            error: req.flash('error')
        });
    },

    // Processar registro
    async register(req, res) {
        try {
            const { username, password, confirmPassword, nome } = req.body;

            if (password !== confirmPassword) {
                req.flash('error', 'As senhas não coincidem');
                return res.redirect('/register');
            }

            const existingUser = await Usuario.findOne({ username });
            if (existingUser) {
                req.flash('error', 'Nome de usuário já está em uso');
                return res.redirect('/register');
            }

            const newUser = new Usuario({
                username,
                password,
                nome
            });

            await newUser.save();

            req.flash('success', 'Registro realizado com sucesso! Faça login.');
            res.redirect('/login');
        } catch (error) {
            console.error('Erro ao registrar usuário:', error);
            req.flash('error', 'Erro ao registrar usuário');
            res.redirect('/register');
        }
    }
};
