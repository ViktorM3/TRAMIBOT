// pdfs/comprobante.js
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function generarComprobante(chatId, quincena, connection, bot) {
  const query = `
    SELECT t.Nombre, t.Apellidopat, p.percepciones, p.deducciones, p.sueldo_neto 
    FROM trabajadores t
    JOIN pagos p ON t.id = p.trabajador_id
    WHERE p.quincena = ?
  `;

  connection.query(query, [quincena], async (err, results) => {
    if (err) {
      bot.sendMessage(chatId, "Error al obtener los datos del trabajador o de la quincena solicitada");
      console.error("Error ejecutando la consulta:", err);
      return;
    }

    if (results.length === 0) {
      bot.sendMessage(chatId, "No se encontraron registros para la quincena solicitada");
      console.log("Quincena no encontrada:", quincena);
      return;
    }

    const pago = results[0];
    console.log("Datos del pago:", pago);

    // Leer el archivo HTML
    const templatePath = path.join(__dirname, '..', 'plantillas', 'comprobante_plantilla.html');

    let content = fs.readFileSync(templatePath, 'utf8');

    // Reemplazar los marcadores de posición con los datos reales
    content = content
      .replace('{{nombre}}', pago.Nombre)
      .replace('{{apellido}}', pago.Apellidopat)
      .replace('{{quincena}}', quincena)
      .replace('{{percepciones}}', pago.percepciones)
      .replace('{{deducciones}}', pago.deducciones)
      .replace('{{sueldo_neto}}', pago.sueldo_neto);

    // Generar el PDF con Puppeteer
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(content);
    const pdfBuffer = await page.pdf({ format: 'A4' });
    await browser.close();

    // Guardar el PDF en un archivo temporal
    const filename = `comprobante_${quincena}.pdf`;
    fs.writeFileSync(filename, pdfBuffer);

    // Enviar el documento al usuario
    bot.sendDocument(chatId, filename, {}, { contentType: 'application/pdf' })
      .then(() => {
        fs.unlinkSync(filename); // Eliminar el archivo después de enviarlo
      })
      .catch(sendError => {
        console.error("Error al enviar el documento:", sendError);
        bot.sendMessage(chatId, "Error al enviar el comprobante. Intente de nuevo más tarde.");
      });
  });
}

module.exports = generarComprobante;
