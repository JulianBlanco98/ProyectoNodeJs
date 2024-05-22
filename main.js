//imports
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 4000;

//conexión a la base de datos en mongo
mongoose.connect(process.env.DB_URI);
const db = mongoose.connection;
db.on('error', (error) => console.log(error));
db.once('open', () => console.log("Conectado a la base de datos"));

//middleware
app.use(express.urlencoded({extended: false}));
app.use(express.json());

app.use(session({
    secret: 'llave secreta',
    saveUninitialized: true,
    resave: false,
}));

app.use((req, res, next) => {
    res.locals.message = req.session.message;
    delete req.session.message;
    next();
});

//ruta donde se guarda todos los recursos
app.use(express.static("uploads"));

//set template engine
app.set("view engine", "ejs");

//prefijo de la ruta
app.use("", require('./routes/routes'));

app.listen(PORT, () => {
    console.log(`Server se ha ejecutado en http://localhost:${PORT}`);
});