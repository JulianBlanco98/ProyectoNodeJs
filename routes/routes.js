const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const dotenV = require('dotenv');
const verificarToken = require('./auth');

const Jugador = require('../model/jugador');
const Equipo = require('../model/equipo');
const Usuario = require('../model/usuario');

// Subir imagen a upload/jugadores
const jugadorStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads/jugadores');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const jugadorUpload = multer({ storage: jugadorStorage });

//pagina de inicio (login)
router.get('/', async (req, res) => {
    res.render('login', {
        titulo: "Login",
    });
});

//pagina de registro
router.get('/registro', async (req, res) => {
    res.render('registro', {
        titulo: "Registro",
    });
});
//registrar un usuario (POST)
router.post('/registro', async (req, res) => {

    try {
        const nuevoUsuario = new Usuario({
            nombre: req.body.nombre,
            password: req.body.password,
        });

        //ver si existe el nombre del usuario (no hay 2 usuarios con el mismo nombre)
        const usuarioEncontrado = await Usuario.findOne({ nombre: nuevoUsuario.nombre }); //buscar por nombre
        // console.log("Usuario encontrado: ", usuarioEncontrado);
        if (usuarioEncontrado) { //si se encuentra, alerta de error a registro
            req.session.message = {
                type: 'danger',
                message: 'Ya existe un usuario con este nombre.',
            };
            res.redirect("/registro")
        }
        else {

            //aplicar el módulo de bcrypt para encriptar la contraseña
            const saltRounds = 10;
            const passwordEncrypted = await bcrypt.hash(nuevoUsuario.password, saltRounds);
            nuevoUsuario.password = passwordEncrypted; //reemplazar por la contra encriptada
            await nuevoUsuario.save(); //insert a la coleccion
            req.session.message = {
                type: 'success',
                message: 'Usuario registrado correctamente',
            };

            // console.log("Contenido de req.session:", req.session);
            res.redirect("/");
        }
    } catch (err) {
        console.error("Error al registrar el usuario: ", err);
        res.json({ message: err.message, type: 'danger' });
    }
})

//Login de la página
router.post('/', async (req, res) => {
    try {
        const doLogin = await Usuario.findOne({ nombre: req.body.nombre }); //busco por nombre
        if (!doLogin) { //si no lo encuentra
            req.session.message = {
                type: 'danger',
                message: 'Usuario no encontrado',
            };
            res.redirect("/")
        }
        else {
            const passwordCorrecta = await bcrypt.compare(req.body.password, doLogin.password);
            if (!passwordCorrecta) { //Contra incorrecta
                req.session.message = {
                    type: 'danger',
                    message: 'Contraseña incorrecta',
                };
                res.redirect("/")
            }
            else { //Todo correcto

                const payload = { nombre: req.body.nombre };
                const secretkey = process.env.SECRET_KEY;
                const options = { expiresIn: '1h' };

                const token = jwt.sign(payload, secretkey, options);
                req.session.token = token; //guardo el token en la sesion
                req.session.message = {
                    type: 'success',
                    message: `Bienvenido, ${req.body.nombre}!`,
                };
                res.redirect("/inicio")
            }
        }
    } catch (err) {
        console.error("Error al hacer el login: ", err);
        res.json({ message: err.message, type: 'danger' });
    }
})

//Ruta para el inicio (GET)
//Get All Jugadores
router.get('/inicio', verificarToken, async (req, res) => {
    try {
        const jugadores = await Jugador.find(); //select * from jugador
        res.render('index', {
            titulo: 'Pagina de Inicio',
            jugadores: jugadores,
        });
    } catch (err) {
        res.json({ message: err.message });
    }
});
//Get All Equipos
router.get('/team', verificarToken, async (req, res) => {

    // const nombreUsuario = req.usuario.nombre;
    // const pUsuario = req.usuario.password;
    try {
        const equipos = await Equipo.find(); //select * from equipo
        res.render('team', {
            titulo: 'Equipos NBA',
            equipos: equipos,
        });
    } catch (err) {
        res.json({ message: err.message });
    }
});

//Ruta para ir a add equipo
router.get('/add', verificarToken, async (req, res) => {
    try {
        const equipos = await Equipo.find(); // Obtener todos los equipos disponibles
        res.render("add_jugador", {
            titulo: "Add Jugador",
            equipos: equipos // Pasar los equipos a la vista
        });
    } catch (err) {
        console.error("Error al obtener los equipos:", err);
        res.status(500).send("Error interno del servidor");
    }
})


//Insertar jugador en la base de datos
// Ruta para agregar un jugador (POST)
router.post('/add', verificarToken, jugadorUpload.single('imagen'), async (req, res) => {
    try {
        const jugador = new Jugador({
            nombre: req.body.nombre,
            posicion: req.body.posicion,
            equipo: req.body.equipo,
            dorsal: req.body.dorsal,
            imagen: req.file.filename,
        });
        console.log("Datos recibidos en req.body:", req.body);
        await jugador.save();
        //console.log("Jugador añadido:", jugador);
        req.session.message = {
            type: 'success',
            message: 'Jugador añadido correctamente',
        };
        res.redirect("/inicio");
    } catch (err) {
        console.error("Error al agregar jugador:", err);
        res.json({ message: err.message, type: 'danger' });
    }
});



//Editar un usuario(GET)
router.get("/edit/:id", verificarToken, async (req, res) => {
    try {
        const id = req.params.id;
        const jugador = await Jugador.findById(id).exec();
        const equipos = await Equipo.find();
        if (!jugador) {
            return res.redirect('/inicio');
        }
        res.render("edit_jugador", {
            titulo: "Actualizar Jugador",
            jugador: jugador,
            equipos: equipos, //Pasar los equipos
        });
    } catch (err) {
        console.error("Error al buscar el jugador:", err);
        res.status(500).send("Error interno del servidor");
    }
});

//Actualizar usuario(POST)
router.post('/update/:id', verificarToken, jugadorUpload.single('imagen'), async (req, res) => {
    try {
        const id = req.params.id;
        let newImagen = "";

        if (req.file) {
            newImagen = req.file.filename;
            try {
                fs.unlinkSync("./uploads/jugadores/" + req.body.old_imagen);
            } catch (err) {
                console.log(err);
            }
        } else {
            newImagen = req.body.old_imagen;
        }

        const jugadorActualizado = await Jugador.findByIdAndUpdate(id, {
            nombre: req.body.nombre,
            equipo: req.body.equipo,
            posicion: req.body.posicion,
            dorsal: req.body.dorsal,
            imagen: newImagen,
        }).exec();

        if (!jugadorActualizado) {
            return res.json({ message: 'Jugador no encontrado', type: 'danger' });
        }

        req.session.message = {
            type: 'success',
            message: 'Jugador actualizado con éxito',
        };
        res.redirect("/inicio");
    } catch (err) {
        console.error("Error al actualizar el jugador:", err);
        res.status(500).send("Error interno del servidor");
    }
});

//borrar Jugador
router.get('/delete/:id', verificarToken, async (req, res) => {
    try {
        const id = req.params.id;
        const jugador = await Jugador.findOneAndDelete({ _id: id }).exec();

        if (jugador && jugador.imagen) {
            const filePath = "./uploads/jugadores/" + jugador.imagen;
            try {
                fs.unlinkSync(filePath);
                console.log('Archivo eliminado:', filePath);
            } catch (err) {
                console.error("Error al eliminar el archivo:", err);
            }
        } else {
            console.warn("No se encontró la imagen asociada al jugador.");
        }

        req.session.message = {
            type: 'info',
            message: 'Jugador borrado correctamente',
        };
        res.redirect("/inicio");
    } catch (err) {
        console.error("Error al borrar el jugador:", err);
        res.status(500).send("Error interno del servidor");
    }
});

//Desloguearse
router.get('/logout', async (req, res) => {
    req.session.destroy(err => { //al hacer el logout, destruyo la sesion
        if (err) {
            console.error("Error al destruir la sesión:", err);
            res.status(500).send("Error interno del servidor");
        } else {
            res.redirect("/");
        }
    });
});

router.get('/show', verificarToken, async (req, res) => {
    try {
        // Decodificar el token JWT para obtener el payload
        const decodedToken = jwt.verify(req.session.token, process.env.SECRET_KEY);      
        // Extraer el nombre de usuario del payload
        const nombreUsuario = decodedToken.nombre;
        console.log("Nombre usuario: ", nombreUsuario);
        // Ahora puedes usar el nombre de usuario en tu renderizado
        res.render('show_usuario', {
            titulo: "Ver usuario",
            nombreUsuario: nombreUsuario,
        });
    } catch (err) {
        console.error("Error al decodificar el token:", err);
        res.status(500).send("Error interno del servidor");
    }
});

module.exports = router;