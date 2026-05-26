const { Sequelize, DataTypes } = require('sequelize')

const sequelize = new Sequelize(process.env.DB_URL, {
  dialect: 'postgres', logging: false,
  dialectOptions: { connectTimeout: 10000 }
})

const Rule = sequelize.define('Rule', {
  id:          { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name:        { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.STRING },
  trigger_type:{ type: DataTypes.STRING, defaultValue: 'sensor' },
  condition:   { type: DataTypes.JSONB, allowNull: false },
  // condition = { sensor_type: 'temperature', operator: '>', threshold: 29 }
  action:      { type: DataTypes.JSONB, allowNull: false },
  // action = { device_id: 'uuid', command: 'ON', params: {} }
  notify:           { type: DataTypes.BOOLEAN, defaultValue: true },
  notify_message:   { type: DataTypes.STRING },
  is_active:        { type: DataTypes.BOOLEAN, defaultValue: true },
  last_triggered:   { type: DataTypes.DATE },
  trigger_count:    { type: DataTypes.INTEGER, defaultValue: 0 },
}, { tableName: 'automation_rules', underscored: true })

module.exports = { sequelize, Rule }