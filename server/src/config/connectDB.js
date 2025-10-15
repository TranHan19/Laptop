require('dotenv').config();
const { Sequelize } = require('sequelize');

const connect = new Sequelize('computer', 'root', process.env.DB_PASSWORD, {
    host: "localhost",
    dialect: 'mysql',
    port: require('mysql2'),
});

const connectDB = async () => {
    try {
        await connect.authenticate();
        console.log('Connect Database Success!');
    } catch (error) {
        console.error('error connect database:', error);
    }
};

module.exports = { connectDB, connect };
