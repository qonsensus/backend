import { MigrationInterface, QueryRunner } from 'typeorm';

export class TrigramSearchForDisplayName1775474545262 implements MigrationInterface {
  name = 'TrigramSearchForDisplayName1775474545262';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP INDEX "public"."IDX_963eb0a3184ae150f3346445ba"
        `);
    await queryRunner.query(`
            CREATE EXTENSION IF NOT EXISTS pg_trgm;
        `);
    await queryRunner.query(`
            CREATE INDEX "displayName_trgmidx" ON "profiles" USING gin ("displayName" gin_trgm_ops)
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE INDEX "IDX_963eb0a3184ae150f3346445ba" ON "profiles" ("displayName")
        `);
    await queryRunner.query(`
            DROP INDEX "public"."displayName_trgmidx"
    `);
  }
}
