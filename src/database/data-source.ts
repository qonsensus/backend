import { DataSource, type DataSourceOptions } from 'typeorm';
import { join } from 'node:path';
import { User } from '../entities/user.entity';
import { Profile } from '../entities/profile.entity';
import { Chat } from '../entities/chat.entity';
import { ChatMessage } from '../entities/conversationMessage.entity';
import { Server } from '../entities/server.entity';
import { UserToServer } from '../entities/userToServer.entity';
import { ChatChannel } from '../entities/chatChannel.entity';
import { UserToChat } from '../entities/userToChat.entity';
import { ChatChannelMessage } from '../entities/chatChannelMessage.entity';
import { UserToChatChannel } from '../entities/userToChatChannel.entity';
import { Friendship } from '../entities/friendship.entity';

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
  username: process.env.DB_USER ?? 'user',
  password: process.env.DB_PASSWORD ?? 'secret',
  database: process.env.DB_NAME ?? 'qonsensus',
  logging: false,
  synchronize: false,
  entities: [
    User,
    Profile,
    Chat,
    ChatMessage,
    Server,
    UserToServer,
    ChatChannel,
    UserToChat,
    ChatChannelMessage,
    UserToChatChannel,
    Friendship,
  ],
  migrations: [join(__dirname, '../migrations/*{.ts,.js}')],
  migrationsTableName: 'typeorm_migrations',
};

export const dataSource = new DataSource(dataSourceOptions);
