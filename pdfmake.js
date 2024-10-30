const PdfPrinter = require('pdfmake');

// Define las fuentes que usarás
const fonts = {
    Roboto: {
        normal: 'node_modules/pdfmake/examples/fonts/Roboto-Regular.ttf',
        bold: 'node_modules/pdfmake/examples/fonts/Roboto-Medium.ttf',
        italics: 'node_modules/pdfmake/examples/fonts/Roboto-Italic.ttf',
        bolditalics: 'node_modules/pdfmake/examples/fonts/Roboto-MediumItalic.ttf'
    }
};

const printer = new PdfPrinter(fonts);

module.exports = printer;
