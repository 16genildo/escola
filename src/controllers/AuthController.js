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
            
            // Buscar usuário
            const usuario = await Usuario.findOne({ username });
            
            // Verificar se usuário existe e senha está correta
            if (!usuario || !(await usuario.verificarSenha(password))) {
                req.flash('error', 'Usuário ou senha inválidos');
                return res.redirect('/login');
            }

            // Criar sessão
            req.session.userId = usuario._id;
            req.session.isAdmin = usuario.isAdmin;
            req.session.nome = usuario.nome;

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
    }
}; 