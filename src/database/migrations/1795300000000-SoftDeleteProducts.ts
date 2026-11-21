import { MigrationInterface, QueryRunner } from 'typeorm';

export class SoftDeleteProducts1795300000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "products" ADD "deleted_at" TIMESTAMPTZ',
    );
  }
  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "products" DROP COLUMN "deleted_at"');
  }
}
