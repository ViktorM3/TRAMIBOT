const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function generarIncidencia(chatId, quincena, trabajadorId, connection, bot) {
  const query = `
        SELECT 
            fecha, 
            motivo 
        FROM 
            incidencias 
        WHERE 
            quincena = ? 
            AND trabajador_id = ?
    `;

  console.log(`Consultando incidencias para la quincena: ${quincena}`); // Diagnóstico

  connection.query(query, [quincena, trabajadorId], async (err, results) => {
    if (err) {
      console.error("Error en la consulta:", err);
      await bot.sendMessage(chatId, "Error al obtener datos de incidencias. Por favor, inténtelo más tarde.");
      return;
    }

    if (results.length === 0) {
      await bot.sendMessage(chatId, "No hay incidencias registradas para esta quincena.");
      return;
    }

    const incidencias = results.map(inc => `Fecha: ${inc.fecha}, Motivo: ${inc.motivo}`).join('<br>');

    const templatePath = path.join(__dirname, '..', 'plantillas', 'incidencias_plantilla.html');
    let content = fs.readFileSync(templatePath, 'utf8');

    // Reemplazar marcadores de posición
    content = content
      .replace('{{quincena}}', quincena)
      .replace('{{incidencias}}', incidencias || 'No hay incidencias registradas.');

    // Generar el PDF con Puppeteer
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(content);
    const pdfBuffer = await page.pdf({ format: 'A4' });
    await browser.close();

    // Guardar el PDF en un archivo temporal
    const filename = `Incidencia_${quincena}.pdf`; // Cambié el nombre del archivo a "Incidencia" y utilicé "quincena"
    fs.writeFileSync(filename, pdfBuffer);

    // Enviar el documento al usuario
    await bot.sendDocument(chatId, filename, {
      caption: 'Aquí está tu reporte de incidencias',
      contentType: 'application/pdf'
    });
    fs.unlinkSync(filename); // Eliminar el archivo después de enviarlo
  });
}

module.exports = generarIncidencia;
