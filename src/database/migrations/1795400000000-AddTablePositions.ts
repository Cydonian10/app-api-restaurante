import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTablePositions1795400000000 implements MigrationInterface {
  name = 'AddTablePositions1795400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "dining_tables" ADD "position_x" integer`);
    await queryRunner.query(`ALTER TABLE "dining_tables" ADD "position_y" integer`);
    await queryRunner.query(`
      WITH ranked AS (
        SELECT id, row_number() OVER (PARTITION BY zone_id ORDER BY number, id) - 1 AS slot
        FROM dining_tables
      )
      UPDATE dining_tables AS tables
      SET position_x = 20 + (ranked.slot % 6) * 140,
          position_y = 20 + (ranked.slot / 6) * 120
      FROM ranked WHERE tables.id = ranked.id
    `);
    await queryRunner.query(`ALTER TABLE "dining_tables" ALTER COLUMN "position_x" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "dining_tables" ALTER COLUMN "position_y" SET NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "dining_tables" DROP COLUMN "position_y"`);
    await queryRunner.query(`ALTER TABLE "dining_tables" DROP COLUMN "position_x"`);
  }
}
