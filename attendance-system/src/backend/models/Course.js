const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db');

class Course extends Model {}

Course.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    courseName: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    courseCode: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    facultyId: {
        type: DataTypes.INTEGER,
        references: {
            model: 'Faculty',
            key: 'id',
        },
        allowNull: false,
    },
    createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
    updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
}, {
    sequelize,
    modelName: 'Course',
    tableName: 'Courses',
    timestamps: true,
});

module.exports = Course;