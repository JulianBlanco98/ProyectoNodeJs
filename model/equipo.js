const mongoose = require('mongoose');
const equipoSchema = new mongoose.Schema({

    nombre: {
        type: String,
        required: true,
    },
    escudo: {
        type: String,
        required: true,
    },
    ciudad: {
        type: String,
        required: true,
    },
    estadio: {
        type: String,
        required: true,
    },

},
    { collection: 'equipo' });

module.exports = mongoose.model('equipo', equipoSchema); 