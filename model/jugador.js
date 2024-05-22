const mongoose = require('mongoose');
const jugadorSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: true,
    },
    equipo: {
        type: String,
        required: true,
    },
    posicion: {
        type: String,
        required: true,
    },
    dorsal: {
        type: String,
        required: true,
    },
    imagen: {
        type: String,
        required: true,
    },
    created: {
        type: Date,
        required: true,
        default: Date.now,
    },

},
    { collection: 'jugador' }); //nombre de la colección en MONGO (solo mínúsculas)

module.exports = mongoose.model('jugador', jugadorSchema); 