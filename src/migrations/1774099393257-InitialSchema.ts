import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1774099393257 implements MigrationInterface {
  name = 'InitialSchema1774099393257';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TYPE "public"."profiles_status_enum" AS ENUM('default', 'suspended', 'banned')
        `);
    await queryRunner.query(`
            CREATE TABLE "profiles" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "displayName" character varying NOT NULL,
                "handle" character varying NOT NULL,
                "bio" character varying,
                "motd" character varying,
                "status" "public"."profiles_status_enum" NOT NULL DEFAULT 'default',
                "avatarUrl" character varying,
                "bannerUrl" character varying,
                "ownerId" uuid,
                CONSTRAINT "UQ_3ee6d864c8aad787db7ceb76ed2" UNIQUE ("handle"),
                CONSTRAINT "REL_c37303d3b952614569fcb8e12a" UNIQUE ("ownerId"),
                CONSTRAINT "PK_8e520eb4da7dc01d0e190447c8e" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_963eb0a3184ae150f3346445ba" ON "profiles" ("displayName")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_3ee6d864c8aad787db7ceb76ed" ON "profiles" ("handle")
        `);
    await queryRunner.query(`
            CREATE TABLE "chat_channel_messages" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "content" character varying NOT NULL,
                "channelId" uuid,
                "authorId" uuid,
                CONSTRAINT "PK_d0edfbb8547e61cac48044b5dfb" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "users_to_chat_channels" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "chatChannelId" uuid NOT NULL,
                "userId" uuid NOT NULL,
                "lastReadAt" TIMESTAMP NOT NULL,
                CONSTRAINT "PK_798e17411c137349c5bc546202a" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "chat_channels" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "serverId" uuid,
                CONSTRAINT "PK_efecd102855fb96e1428306ec6f" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "servers" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "name" character varying NOT NULL,
                "description" character varying NOT NULL,
                "motd" character varying NOT NULL,
                "avatarUrl" character varying NOT NULL,
                "bannerUrl" character varying NOT NULL,
                CONSTRAINT "PK_c0947efd9f3db2dcc010164d20b" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "users_to_servers" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "userId" uuid,
                "serverId" uuid,
                CONSTRAINT "PK_94ebfb0d48d3231445660b7c3ce" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "conversation_messages" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "content" character varying NOT NULL,
                "conversationId" uuid,
                "authorId" uuid,
                CONSTRAINT "PK_113248f25c4c0a7c179b3f5a609" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "conversations" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "participantsHash" character varying,
                CONSTRAINT "PK_ee34f4f7ced4ec8681f26bf04ef" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_6119c1f27dfdc0960d577988dd" ON "conversations" ("participantsHash")
        `);
    await queryRunner.query(`
            CREATE TABLE "user_to_conversations" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "lastReadAt" TIMESTAMP WITH TIME ZONE NOT NULL,
                "userId" uuid NOT NULL,
                "conversationId" uuid NOT NULL,
                CONSTRAINT "PK_681671f806145c552e10630ff5f" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE TYPE "public"."friendships_status_enum" AS ENUM('pending', 'accepted', 'rejected')
        `);
    await queryRunner.query(`
            CREATE TABLE "friendships" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "status" "public"."friendships_status_enum" NOT NULL,
                "requesterId" uuid NOT NULL,
                "recipientId" uuid NOT NULL,
                CONSTRAINT "PK_08af97d0be72942681757f07bc8" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_4864bfab7fad9a34292e12bdb0" ON "friendships" ("status")
        `);
    await queryRunner.query(`
            CREATE TABLE "users" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "email" character varying NOT NULL,
                "passwordHash" character varying NOT NULL,
                CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"),
                CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_97672ac88f789774dd47f7c8be" ON "users" ("email")
        `);
    await queryRunner.query(`
            ALTER TABLE "profiles"
            ADD CONSTRAINT "FK_c37303d3b952614569fcb8e12a7" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "chat_channel_messages"
            ADD CONSTRAINT "FK_f84b7a727adf47d2d618d2d5015" FOREIGN KEY ("channelId") REFERENCES "chat_channels"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "chat_channel_messages"
            ADD CONSTRAINT "FK_13eeb1d62856d877213c41803d6" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "users_to_chat_channels"
            ADD CONSTRAINT "FK_fba44701544a260a028fa37e02c" FOREIGN KEY ("chatChannelId") REFERENCES "chat_channels"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "users_to_chat_channels"
            ADD CONSTRAINT "FK_e4e81c5188851ce0bb515586227" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "chat_channels"
            ADD CONSTRAINT "FK_38ca111e10ff8afff04aa7e5a08" FOREIGN KEY ("serverId") REFERENCES "servers"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "users_to_servers"
            ADD CONSTRAINT "FK_8301f5ed9762e64593512e49d01" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "users_to_servers"
            ADD CONSTRAINT "FK_e0afd3bc298a3caa4dc209a2640" FOREIGN KEY ("serverId") REFERENCES "servers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "conversation_messages"
            ADD CONSTRAINT "FK_f5045a77718bdb593f309a1e258" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "conversation_messages"
            ADD CONSTRAINT "FK_88f701e182950a56754a10427d6" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "user_to_conversations"
            ADD CONSTRAINT "FK_abf07679ee013a104479deb9ed8" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "user_to_conversations"
            ADD CONSTRAINT "FK_55042447a416fc5718a887746bf" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "friendships"
            ADD CONSTRAINT "FK_4f47ed519abe1ced044af260420" FOREIGN KEY ("requesterId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "friendships"
            ADD CONSTRAINT "FK_7f76394c99676ef3f8e15d00632" FOREIGN KEY ("recipientId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "friendships" DROP CONSTRAINT "FK_7f76394c99676ef3f8e15d00632"
        `);
    await queryRunner.query(`
            ALTER TABLE "friendships" DROP CONSTRAINT "FK_4f47ed519abe1ced044af260420"
        `);
    await queryRunner.query(`
            ALTER TABLE "user_to_conversations" DROP CONSTRAINT "FK_55042447a416fc5718a887746bf"
        `);
    await queryRunner.query(`
            ALTER TABLE "user_to_conversations" DROP CONSTRAINT "FK_abf07679ee013a104479deb9ed8"
        `);
    await queryRunner.query(`
            ALTER TABLE "conversation_messages" DROP CONSTRAINT "FK_88f701e182950a56754a10427d6"
        `);
    await queryRunner.query(`
            ALTER TABLE "conversation_messages" DROP CONSTRAINT "FK_f5045a77718bdb593f309a1e258"
        `);
    await queryRunner.query(`
            ALTER TABLE "users_to_servers" DROP CONSTRAINT "FK_e0afd3bc298a3caa4dc209a2640"
        `);
    await queryRunner.query(`
            ALTER TABLE "users_to_servers" DROP CONSTRAINT "FK_8301f5ed9762e64593512e49d01"
        `);
    await queryRunner.query(`
            ALTER TABLE "chat_channels" DROP CONSTRAINT "FK_38ca111e10ff8afff04aa7e5a08"
        `);
    await queryRunner.query(`
            ALTER TABLE "users_to_chat_channels" DROP CONSTRAINT "FK_e4e81c5188851ce0bb515586227"
        `);
    await queryRunner.query(`
            ALTER TABLE "users_to_chat_channels" DROP CONSTRAINT "FK_fba44701544a260a028fa37e02c"
        `);
    await queryRunner.query(`
            ALTER TABLE "chat_channel_messages" DROP CONSTRAINT "FK_13eeb1d62856d877213c41803d6"
        `);
    await queryRunner.query(`
            ALTER TABLE "chat_channel_messages" DROP CONSTRAINT "FK_f84b7a727adf47d2d618d2d5015"
        `);
    await queryRunner.query(`
            ALTER TABLE "profiles" DROP CONSTRAINT "FK_c37303d3b952614569fcb8e12a7"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_97672ac88f789774dd47f7c8be"
        `);
    await queryRunner.query(`
            DROP TABLE "users"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_4864bfab7fad9a34292e12bdb0"
        `);
    await queryRunner.query(`
            DROP TABLE "friendships"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."friendships_status_enum"
        `);
    await queryRunner.query(`
            DROP TABLE "user_to_conversations"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_6119c1f27dfdc0960d577988dd"
        `);
    await queryRunner.query(`
            DROP TABLE "conversations"
        `);
    await queryRunner.query(`
            DROP TABLE "conversation_messages"
        `);
    await queryRunner.query(`
            DROP TABLE "users_to_servers"
        `);
    await queryRunner.query(`
            DROP TABLE "servers"
        `);
    await queryRunner.query(`
            DROP TABLE "chat_channels"
        `);
    await queryRunner.query(`
            DROP TABLE "users_to_chat_channels"
        `);
    await queryRunner.query(`
            DROP TABLE "chat_channel_messages"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_3ee6d864c8aad787db7ceb76ed"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_963eb0a3184ae150f3346445ba"
        `);
    await queryRunner.query(`
            DROP TABLE "profiles"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."profiles_status_enum"
        `);
  }
}
