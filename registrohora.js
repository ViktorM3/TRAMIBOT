const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function generarRegistroHora(chatId, quincena, connection, bot) {
    const query = 
        `SELECT 
            fecha, 
            hora_entrada, 
            hora_salida 
        FROM 
            registros_hora 
        WHERE 
            quincena = ? 
            AND trabajador_id IN (SELECT id FROM trabajadores);
    `;
  
    connection.query(query, [quincena], async (err, results) => {
        if (err || results.length === 0) {
            await bot.sendMessage(chatId, "Error al obtener datos del registro de hora o quincena no encontrada.");
            console.error("Error de consulta SQL:", err);
            return;
        }

        console.log("Resultados de la consulta SQL:", results);

        const registros = results.map(reg => `Fecha: ${reg.fecha}, Hora Entrada: ${reg.hora_entrada}, Hora Salida: ${reg.hora_salida}`).join('<br>');

        const templatePath = path.join(__dirname, '..', 'plantillas', 'horas_plantilla.html');
        let content = fs.readFileSync(templatePath, 'utf8');

        // Reemplazar marcadores de posición
        content = content
            .replace('{{quincena}}', quincena)
            .replace('{{registros}}', registros || 'No hay registros de hora.');

        console.log("Contenido del HTML para el PDF:", content);

        // Generar el PDF con Puppeteer
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.setContent(content);
        const pdfBuffer = await page.pdf({ format: 'A4' });
        await browser.close();

        // Guardar el PDF en un archivo temporal
        const filename = `RegistroHora_${quincena}.pdf`;
        fs.writeFileSync(filename, pdfBuffer);

        // Enviar el documento al usuario
        await bot.sendDocument(chatId, filename, {
            caption: 'Aquí está tu registro de horas de checada',
            contentType: 'application/pdf'
        });
        fs.unlinkSync(filename); // Eliminar el archivo después de enviarlo
    });
}

module.exports = generarRegistroHora;