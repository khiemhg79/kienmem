const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize(process.env.DB_URL || 'postgresql://souser:sopassword@localhost:5432/so_auth', {
  dialect: 'postgres', logging: false,
  pool: { max: 5, min: 0, acquire: 30000, idle: 10000 },
  retry: { max: 10 },
});

const Role = sequelize.define('Role', {
  id:          { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  permissions: { type: DataTypes.JSONB, defaultValue: {} },
  description: { type: DataTypes.TEXT },
}, { tableName: 'roles' });

const User = sequelize.define('User', {
  id:            { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name:          { type: DataTypes.STRING, allowNull: false },
  email:         { type: DataTypes.STRING, allowNull: false, unique: true },
  password_hash: { type: DataTypes.STRING, allowNull: false },
  role_id:       { type: DataTypes.UUID },
  assigned_room: { type: DataTypes.STRING, allowNull: true },
  assigned_floor: { type: DataTypes.INTEGER, allowNull: true },
  is_active:     { type: DataTypes.BOOLEAN, defaultValue: true },
  last_login:    { type: DataTypes.DATE },
}, { tableName: 'users' });

const RefreshToken = sequelize.define('RefreshToken', {
  id:          { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  user_id:     { type: DataTypes.UUID, allowNull: false },
  token_hash:  { type: DataTypes.STRING, allowNull: false },
  expires_at:  { type: DataTypes.DATE, allowNull: false },
  revoked:     { type: DataTypes.BOOLEAN, defaultValue: false },
}, { tableName: 'refresh_tokens' });

Role.hasMany(User, { foreignKey: 'role_id' });
User.belongsTo(Role, { foreignKey: 'role_id' });

module.exports = { sequelize, Role, User, RefreshToken };
