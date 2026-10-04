const { DataTypes } = require('sequelize');

function baseFields() {
  return {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
  };
}

function baseOptions(options = {}) {
  return {
    timestamps: true,
    underscored: true,
    ...options,
  };
}

module.exports = { baseFields, baseOptions };

