const express = require('express');
const { engine } = require('express-handlebars');
const session = require('express-session');
const fs = require('fs');
const path = require('path');
const app = express();

const users = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/users.json')));
const payments = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/payments.json')));

const checkUser = (req, res, next) => {
    const username = req.body.username;
    const password = req.body.password;

    const user = users.find(item => item.username === username)

    if (!username || !password) {
        req.error = 'Login yoki parol yuborilmagan';
        next();
        return
    }

    if (!user) {
        req.error = 'Ushbu foydalanuvchi topilmadi!';
        next();
        return
    }

    if (user.password !== password) {
        req.error = 'Parol xato!';
        next();
        return
    }
    next()
}

app.engine('hbs', engine({
    extname: 'hbs',
})); // .hbs larni render qilish uchun

app.set('view engine', 'hbs'); // .hbs yozmasa ham hbs ishlasin

app.use(session({
    secret: "123123",
    resave: false ,
    saveUninitialized: true,
    cookie: {
        maxAge: 1000*60*60*24*7,
    }
}));

const checkLogin = (req, res, next) => {
    if (!req.session.authorized) {
        res.redirect('/login');
        return;
    }
    const user = users.find(item => item.username === req.session.username)
    if (!user) {
        res.redirect('/login');
        return;
    }

    next();
}

app.get('/', checkLogin, (req, res) => {
    res.render('home');
})
app.get('/home', checkLogin, (req, res) => {
    res.render('home');
})
app.get('/groups', checkLogin, (req, res) => {
    res.render('groups');
})
app.get('/payments(/index)?', checkLogin, (req, res) => {
    res.render('payments/index', {
        payments: payments,
        helpers: {
            userName(data) {
                let {id, name} = data.hash;
                const user = users.find(item => item.id===id);
                return (user) ? user.full_name : "Noma'lum o'quvchi";
            },
            amountWithType(data) {
                let {type, amount} = data.hash;
                return (type === 'credit' ? '-' : '+') + amount;
            },
            formattedDate(timestamp) {
                const date = new Date(timestamp*1000);
                return date.toLocaleDateString();
            },
        },
    });
})

app.get('/payments/add', checkLogin, (req, res) => {
    res.render('payments/add')
})

app.get('/logout', (req, res) => {
    if (req.session.authorized) {
        // req.session.authorized = false;
        // req.session.username = undefined;
        delete req.session.authorized;
        delete req.session.username;
    }
    res.redirect('/login');
})

app.get('/login', (req, res) => {
    if (req.session.authorized) {
        res.redirect('/');
        return;
    }

    res.render('login', {
        title: "Kirish",
        layout: 'login',
        error: req.session.error
    });
    delete req.session.error;
})
app.use(express.urlencoded({extended: true}));

app.post('/login', checkUser, (req, res) => {
    if(req.error) {
        req.session.error = req.error;
        res.redirect('/login');
        return;
    }

    req.session.authorized = true;
    req.session.username = req.body.username;
    res.redirect('/');
    return
})

app.listen(5555, () => {
    console.log("Sayt http://localhost:5555 linkida ishga tushdi");
})