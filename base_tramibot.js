const mysql = require('mysql2');

// Crear la conexión a la base de datos
const connection = mysql.createConnection({
  host: 'localhost',  // Cambia esto según tu configuración
  user: 'root',       // Usuario de la base de datos
  password: '',  // Contraseña de la base de datos
  database: 'tramibotdb'  // Nombre de la base de datos
});

// Conectar a la base de datos
connection.connect((err) => {
  if (err) {
    console.error('Error conectando a la base de datos:', err.stack);
    return;
  }
  console.log('Conectado a la base de datos con el ID', connection.threadId);
});

// Exportar la conexión para usarla en otros módulos
module.exports = connection;
