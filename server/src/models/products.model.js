const { DataTypes } = require('sequelize');
const { connect } = require('../config/connectDB');

const product = connect.define('product', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    nameProduct: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    priceProduct: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    descriptionProduct: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    imagesProduct: {
        type: DataTypes.JSON,
        allowNull: false,
    },
    discountProduct: {
        type: DataTypes.FLOAT,
        allowNull: true,
        defaultValue: 0,
    },
    categoryProduct: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    stockProduct: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
    },
    specsProduct: {
        type: DataTypes.JSON,
        allowNull: false,
    },
    categoryId: {   // cột UUID để quan hệ foreign key
        type: DataTypes.UUID,
        allowNull: true,  // cho phép null nếu chưa map category
        references: {
            model: 'categories',
            key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
    },
});

module.exports = product;
