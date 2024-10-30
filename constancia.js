const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function generarConstancia(chatId, clave, connection, bot) {
  try {
    const query = "SELECT * FROM trabajadores WHERE tipo = 'FONE'";
    const [results] = await connection.promise().query(query);

    if (results.length === 0) {
      await bot.sendMessage(chatId, "Error al obtener datos del trabajador o clave no encontrada.");
      return;
    }

    const trabajador = results[0];
    const templatePath = path.join(__dirname, '..', 'plantillas', 'constancia_plantilla.html');
    let content = fs.readFileSync(templatePath, 'utf8');

    // Reemplazar marcadores de posición
    content = content
      .replace('{{nombre}}', trabajador.Nombre)
      .replace('{{rfc}}', trabajador.RFC)
      .replace('{{clavePresupuestal}}', trabajador.ClavePresupuestal)
      .replace('{{fechaRegistro}}', trabajador.FechaRegistro);

    let informacionAdicional = '';

    switch (clave) {
      case "10":
      case "CS10":
        // No hay información adicional
        break;
      case "20":
      case "CS20":
        informacionAdicional = `Sueldo que cotiza al ISSSTE: ${trabajador.SueldoISSSTE}`;
        break;
      case "30":
      case "CS30":
        informacionAdicional = `Sueldo Neto: ${trabajador.SueldoNeto}`;
        break;
      case "40":
      case "CS40":
        informacionAdicional = `Sueldo Neto: ${trabajador.SueldoNeto}`;
        break;
      case "80":
      case "CS80":
        informacionAdicional = `Sueldo Total: ${trabajador.SueldoTotal}<br>Fotografía:<br><img src="ruta/a/fotografia/${trabajador.Fotografia}" width="150" height="150">`;
        break;
      default:
        await bot.sendMessage(chatId, "Clave no válida.");
        return;
    }

    // Reemplazar información adicional en el contenido
    content = content.replace('{{informacionAdicional}}', informacionAdicional);

    // Generar el PDF con Puppeteer
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(content);
    const pdfBuffer = await page.pdf({ format: 'A4' });
    await browser.close();

    // Guardar el PDF en un archivo temporal
    const filename = `Constancia_${clave}.pdf`;
    fs.writeFileSync(filename, pdfBuffer);

    // Enviar el documento al usuario
    await bot.sendDocument(chatId, filename, {
      caption: 'Aquí está tu constancia',
      contentType: 'application/pdf'
    });
    fs.unlinkSync(filename); // Eliminar el archivo después de enviarlo

  } catch (error) {
    console.error("Error inesperado:", error);
    await bot.sendMessage(chatId, "Ocurrió un error inesperado. Intente de nuevo más tarde.");
  }
}

module.exports = generarConstancia;
