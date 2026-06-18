  import { DataTypes } from 'sequelize';
  import { sequelize } from '../config/database.js';
  import Document from './Document.js';
  import User from './User.js';

  const ChatMessage = sequelize.define('ChatMessage', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    documentId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: Document,
        key: 'id',
      },
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: User,
        key: 'id',
      },
    },
    role: {
      type: DataTypes.ENUM('user', 'ai'), // 'user' = the question, 'ai' = the answer
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT('long'), // Support long messages
      allowNull: false,
    },
  }, {
    timestamps: true,
  });

  // Setup Relationships
  // This allows us to say "Find all messages for this Document"
  Document.hasMany(ChatMessage, { foreignKey: 'documentId' });
  ChatMessage.belongsTo(Document, { foreignKey: 'documentId' });

  export default ChatMessage;