import { MigrationInterface, QueryRunner } from 'typeorm';

export class ConversationToChat1774997980147 implements MigrationInterface {
  name = 'ConversationToChat1774997980147';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "chat_messages" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "content" character varying NOT NULL,
                "chatId" uuid,
                "authorId" uuid,
                CONSTRAINT "PK_40c55ee0e571e268b0d3cd37d10" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_a6f359922fb93e42d1b2daf38d" ON "chat_messages" ("createdAt")
        `);
    await queryRunner.query(`
            CREATE TABLE "chats" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "participantsHash" character varying,
                CONSTRAINT "PK_0117647b3c4a4e5ff198aeb6206" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_a9289f4b536ad16d4ff0bd7486" ON "chats" ("participantsHash")
        `);
    await queryRunner.query(`
            CREATE TABLE "user_to_chat" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "lastReadAt" TIMESTAMP WITH TIME ZONE NOT NULL,
                "userId" uuid NOT NULL,
                "chatId" uuid NOT NULL,
                CONSTRAINT "PK_6dfa7d9501dab858fc3f1880d27" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            ALTER TABLE "chat_messages"
            ADD CONSTRAINT "FK_e82334881c89c2aef308789c8be" FOREIGN KEY ("chatId") REFERENCES "chats"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "chat_messages"
            ADD CONSTRAINT "FK_fe2f91e973181fcab44f6405815" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "user_to_chat"
            ADD CONSTRAINT "FK_f321bfb45d74fb0bd05f3ef2a69" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "user_to_chat"
            ADD CONSTRAINT "FK_9bc649a84fe3f8feaebf4b9ad5e" FOREIGN KEY ("chatId") REFERENCES "chats"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "user_to_chat" DROP CONSTRAINT "FK_9bc649a84fe3f8feaebf4b9ad5e"
        `);
    await queryRunner.query(`
            ALTER TABLE "user_to_chat" DROP CONSTRAINT "FK_f321bfb45d74fb0bd05f3ef2a69"
        `);
    await queryRunner.query(`
            ALTER TABLE "chat_messages" DROP CONSTRAINT "FK_fe2f91e973181fcab44f6405815"
        `);
    await queryRunner.query(`
            ALTER TABLE "chat_messages" DROP CONSTRAINT "FK_e82334881c89c2aef308789c8be"
        `);
    await queryRunner.query(`
            DROP TABLE "user_to_chat"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_a9289f4b536ad16d4ff0bd7486"
        `);
    await queryRunner.query(`
            DROP TABLE "chats"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_a6f359922fb93e42d1b2daf38d"
        `);
    await queryRunner.query(`
            DROP TABLE "chat_messages"
        `);
  }
}
