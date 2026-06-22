import dotenv from "dotenv";
import mysql from "mysql2/promise";

dotenv.config();

async function testConnection() {
    try {
        const pool = mysql.createPool({
            uri: process.env.DATABASE_URL,
            ssl: {
                rejectUnauthorized: true
            }
        });
        console.log("Intentando conectar a la base de datos...");
        const [rows] = await pool.query("SHOW TABLES;");
        console.log("¡Conexión exitosa!");
        console.log("Tablas encontradas en la base de datos:");
        console.log(rows);
        process.exit(0);
    } catch (error) {
        console.error("Error al conectar a la base de datos:");
        console.error(error.message);
        process.exit(1);
    }
}

testConnection();
