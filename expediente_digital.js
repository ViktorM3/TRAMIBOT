const fs = require('fs');
const connection = require ('./base_tramibot');
const path = require('path');


function subirdocumento(bot, msg) {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, "Por favor, envíe el documento que desea subir.");

    bot.once('document', (msg) => {
        const documento = msg.document;
        const trabajadorId = msg.from.id;
        const rutaDocumentos = path.join(__dirname, 'documentos'); // Ruta para la carpeta documentos

        // Verifica si la carpeta existe, si no, la crea
        if (!fs.existsSync(rutaDocumentos)) {
            fs.mkdirSync(rutaDocumentos);
        }

        // Define la ruta del archivo usando la estructura que ya tenías
        const ruta = path.join(rutaDocumentos, `${trabajadorId}_${documento.file_name}`);

        // Descarga el archivo
        bot.downloadFile(documento.file_id, rutaDocumentos).then((filePath) => {
            const query = "INSERT INTO documentos (trabajador_id, nombre_documento, ruta_documento) VALUES (?,?,?)";
            connection.query(query, [trabajadorId, documento.file_name, ruta], (err) => {
                if (err) {
                    bot.sendMessage(chatId, "Error al subir el documento. Intente de nuevo.");
                    console.error("Error ejecutando consulta:", err);
                    return;
                }
                bot.sendMessage(chatId, "Documento subido correctamente.");
            });
        }).catch((error) => {
            bot.sendMessage(chatId, "Error al descargar el documento.");
            console.error("Error al descargar el archivo:", error);
        });
    });
}


function eliminardocumento(bot, msg) {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, "Por favor, proporcione el nombre del documento que desea eliminar.");

    bot.once('message', (msg) => {
        const nombreDocumento = msg.text.trim();
        const trabajadorId = msg.from.id;

        const query = "DELETE FROM documentos WHERE trabajador_id = ? AND nombre_documento = ?";
        connection.query(query, [trabajadorId, nombreDocumento], (err, results) => {
            if (err) {
                bot.sendMessage(chatId, "Error al eliminar el documento. Inténtelo de nuevo.");
                console.error("Error ejecutando consulta:", err);
                return;
            }
            if (results.affectedRows > 0) {
                fs.unlinkSync(`./documentos/${trabajadorId}_${nombreDocumento}`); // Asegúrate de que el nombre sea correcto
                bot.sendMessage(chatId, "Documento eliminado exitosamente.");
            } else {
                bot.sendMessage(chatId, "No se encontró el documento especificado.");
            }
        });
    });
}

function revisardocumento(bot, msg) {
    const chatId = msg.chat.id;
    const trabajadorId = msg.from.id;

    const query = "SELECT nombre_documento, ruta_documento FROM documentos WHERE trabajador_id = ?";
    connection.query(query, [trabajadorId], (err, results) => {
        if (err) {
            console.error("Error al consultar documentos:", err);
            bot.sendMessage(chatId, "Error al consultar documentos.");
            return;
        }

        if (results.length === 0) {
            bot.sendMessage(chatId, "No hay documentos disponibles.");
        } else {
            results.forEach(doc => {
                bot.sendMessage(chatId, `Documento: ${doc.nombre_documento}\nRuta: ${doc.ruta_documento}`);
            });
        }
    });
}

function descargardocumento(bot, msg) {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, "Por favor, proporcione el nombre del documento que desea descargar.");

    bot.once('message', (msg) => {
        const nombreDocumento = msg.text.trim();
        const trabajadorId = msg.from.id;

        const query = "SELECT ruta_documento FROM documentos WHERE trabajador_id = ? AND nombre_documento = ?";
        connection.query(query, [trabajadorId, nombreDocumento], (err, results) => {
            if (err) {
                bot.sendMessage(chatId, "Error al obtener el documento. Inténtelo de nuevo.");
                console.error("Error ejecutando consulta:", err);
                return;
            }
            if (results.length > 0) {
                const rutaDocumento = results[0].ruta_documento;
                bot.sendDocument(chatId, rutaDocumento).catch(err => {
                    bot.sendMessage(chatId, "Error al enviar el documento. Puede que no exista.");
                    console.error("Error enviando el documento:", err);
                });
            } else {
                bot.sendMessage(chatId, "No se encontró el documento especificado.");
            }
        });
    });
}

module.exports = {
    subirdocumento,
    eliminardocumento,
    revisardocumento,
    descargardocumento
};
