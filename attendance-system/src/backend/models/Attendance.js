const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db');

class Attendance extends Model {}

Attendance.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    studentId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Users',
            key: 'id'
        }
    },
    courseId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Courses',
            key: 'id'
        }
    },
    date: {
        type: DataTypes.DATE,
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('present', 'absent', 'late'),
        allowNull: false
    }
}, {
    sequelize,
    modelName: 'Attendance',
    tableName: 'Attendance',
    timestamps: false
});

module.exports = Attendance;