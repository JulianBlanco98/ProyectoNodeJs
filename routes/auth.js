const jwt = require('jsonwebtoken');

function verificarToken(req, res, next) {
    const token = req.session.token;    
    //console.log("Contenido cabecera: ",token)
    if (!token) {
        // return res.status(403).json({ message: 'Token no proporcionado' });
        return res.status(403).json({ message: 'No se puede acceder a esta página.' });
    }
    jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Token inválido' });
        }
        req.usuario = decoded;
        next(); // Pasar al siguiente middleware si la verificación es exitosa
    });
}
module.exports = verificarToken;
