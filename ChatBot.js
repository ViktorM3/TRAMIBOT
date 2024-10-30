const TelegramBot = require('node-telegram-bot-api');
const connection = require("./base_tramibot");
const generarComprobante = require('./pdfs/comprobante');
const generarConstancia = require('./pdfs/constancia');
const generarIncidencia = require('./pdfs/incidencias');
const generarRegistroHora = require('./pdfs/registrohora');
const expedienteDigital = require('./expediente_digital');

const token = '';
const bot = new TelegramBot(token, { polling: true });

bot.on('polling_error', (error) => {
  console.error('Polling error code:', error.code);
  console.error('Polling error message:', error.message);
});

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, "Bienvenido a TramiBot. Por favor, ingresa tu ID de trabajador");

  bot.once("message", (msg) => {
    const usuarioId = msg.text.trim();
    verificarusuario(chatId, usuarioId);
  });
});

function verificarusuario(chatId, usuarioId) {
  const query = "SELECT * FROM trabajadores WHERE id = ?";

  connection.query(query, [usuarioId], (err, results) => {
    if (err) {
      bot.sendMessage(chatId, "Error al verificar ID. Inténtelo de nuevo");
      console.error("Error ejecutando consulta:", err);
      return;
    }

    if (results.length > 0) {
      const trabajador = results[0];
      bot.sendMessage(chatId, `Bienvenido ${trabajador.Nombre} ${trabajador.Apellidopat}, ID de trabajador ha sido verificado correctamente`);
      mostrarTramites(chatId);
    } else {
      bot.sendMessage(chatId, "ID de trabajador no encontrado. Por favor, intente de nuevo");
    }
  });
}

bot.on('message', (msg) => {
  console.log("ID del trabajador:", msg.from.id);
});


function mostrarTramites(chatId) {
  const tramites = 
    `Lista de trámites disponibles:
    /comprobante - Solicitar comprobante de pago
    /constancia - Solicitar constancia de servicio
    /incidencia - Solicitar Reporte de incidencias en asistencias
    /registro_hora - Solicitar registro de hora de checada
    /expediente - funciones relacionadas al expediente digital
  `;
  bot.sendMessage(chatId, tramites);
}

function mostrarExpediente(chatId) {
  const funcionesExpediente = 
    `Lista de funciones disponibles:
    /subir_documento - Solicitar subir un documento
    /eliminar_documento - Solicitar eliminar un documento
    /revisar_documento - Revisar los documentos almacenados
    /descargar_documento - Solicitar descargar un documento almacenado
  `;
  bot.sendMessage(chatId, funcionesExpediente);
}

bot.onText(/\/expediente/, (msg) => {
  const chatId = msg.chat.id;
  mostrarExpediente(chatId);
})

// Manejador para el comando /comprobante
bot.onText(/\/comprobante/, (msg) => {
  const chatId = msg.chat.id;
  const trabajadorId = msg.from.id;
  bot.sendMessage(chatId, "Por favor, proporciona el año y número de quincena (e.g., CP202401).");

  // Espera la siguiente entrada del usuario
  bot.once('message', (msg) => {
    const quincena = msg.text.trim();
    if (/^CP\d{6}$/.test(quincena)) { // Asegúrate de que este formato coincide
      generarComprobante(chatId, quincena, connection, bot, trabajadorId);
    } else {
      bot.sendMessage(chatId, "Formato de quincena inválido. Por favor, proporciona el año y número de quincena en formato CPYYYYQQ (e.g., CP202401).");
    }
  });
});

// Manejador para el comando /constancia
bot.onText(/\/constancia/, (msg) => {
  const chatId = msg.chat.id;

  bot.sendMessage(chatId, "Por favor, proporciona la clave de su constancia requerida.\nSi no conoce la clave requerida, escriba o presione sobre el comando /clave");

  // Espera la siguiente entrada del usuario
  bot.once('message', (msg) => {
    const clave = msg.text.trim();
    let descripcion;

    switch (clave) {
      case "10":
        descripcion = "Generando constancia de servicios";
        break;
      case "20":
        descripcion = "Generando constancia de servicios para FOVISSSTE";
        break;
      case "30":
        descripcion = "Generando constancia de servicios para beca";
        break;
      case "40":
        descripcion = "Generando constancia de servicios para crédito";
        break;
      case "80":
        descripcion = "Generando constancia de servicios para visa";
        break;
      default:
        descripcion = "Clave no válida";
        bot.sendMessage(chatId, descripcion);
        return;
    }

    bot.sendMessage(chatId, descripcion);
    generarConstancia(chatId, clave, connection, bot);
  });
});

bot.onText(/\/clave/, (msg) => {
  const clave = 
  `Clave de constancia requerida:
    "10", para constancia de servicios  
    "20", constancia de servicios para FOVISSTE 
    "30", constancia de servicios para beca 
    "40", constancia de servicios para Crédito 
    "80", constancia de servicios para visa
  `;
  bot.sendMessage(msg.chat.id, clave);
});

bot.onText(/\/incidencia/, (msg) => {
  const chatId = msg.chat.id;  // Definir chatId aquí
  const trabajadorId = msg.from.id;
  bot.sendMessage(chatId, "Por favor, proporciona el año y número de quincena (e.g., IA202401).");

  // Espera la siguiente entrada del usuario
  bot.once('message', (msg) => {
    const quincena = msg.text.trim();

    if (/^IA\d{6}$/.test(quincena)) {
      bot.sendMessage(chatId, `Generando reporte para la quincena: ${quincena}`);
      generarIncidencia(chatId, quincena, trabajadorId, connection, bot);  // Usar chatId aquí
    } else {
      bot.sendMessage(chatId, "Formato de quincena inválido");
    }
  });
});

bot.onText(/\/registro_hora/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(msg.chat.id, "Por favor, proporciona el año y número de quincena (e.g., RC202401).");

  // Espera la siguiente entrada del usuario
  bot.once('message', (msg) => {
    const quincena = msg.text.trim();

    if (/^RC\d{6}$/.test(quincena)) {
      const año = quincena.substring(2, 6);
      const mes = quincena.substring(6, 8);
      bot.sendMessage(chatId, `Generando registro de checada para la quincena: ${quincena}`);

      generarRegistroHora(chatId, quincena, connection, bot);
    } else {
      bot.sendMessage(chatId, "Formato de quincena inválido");
    }
  });
});

bot.on('polling_error', (error) => {
  console.error('Polling error code:', error.code);

  if (error.response && error.response.body) {
    console.error('Polling error body:', error.response.body);
  } else {
    console.error('No additional error information available.');
  }
});

bot.onText(/\/subir_documento/,(msg) =>{
  expedienteDigital.subirdocumento(bot, msg);
});

bot.onText(/\/eliminar_documento/,(msg) =>{
  expedienteDigital.eliminardocumento(bot, msg);
});

bot.onText(/\/revisar_documento/,(msg) =>{
  expedienteDigital.revisardocumento(bot, msg);
});

bot.onText(/\/descargar_documento/,(msg) =>{
  expedienteDigital.descargardocumento(bot, msg);
});


console.log('Bot está corriendo...');
