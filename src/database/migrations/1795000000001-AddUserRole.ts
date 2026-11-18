import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserRole1795000000001 implements MigrationInterface {
  name = 'AddUserRole1795000000001';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "user_role_enum" AS ENUM ('ADMIN', 'COCINA', 'ATENCION', 'MOZO', 'CLIENTE')`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "role" "user_role_enum" NOT NULL DEFAULT 'CLIENTE'`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "role"`);
    await queryRunner.query(`DROP TYPE "user_role_enum"`);
  }
}
