module.exports = function(sequelize, DataTypes) {
    return sequelize.define('users', {
        id: {
            type: DataTypes.BIGINT(20),
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        company_name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        user_logo: {
            type: DataTypes.STRING,
            allowNull: true
        },
        user_type: {
            type: DataTypes.INTEGER(3),
            allowNull: false,
            defaultValue: 1
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false
        },
        date_created: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: sequelize.fn('current_timestamp')
        },
        date_modified: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: sequelize.fn('current_timestamp')
        }
    }, {
        tableName: 'users',
        freezeTableName: true,
        underscored: true,
        timestamps: false
    });
};