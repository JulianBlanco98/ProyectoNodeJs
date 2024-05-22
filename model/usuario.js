const mongoose = require('mongoose');
const usuarioSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
},
    { collection: 'usuario' });
module.exports = mongoose.model('usuario', usuarioSchema);