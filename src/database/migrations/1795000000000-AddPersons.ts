import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPersons1795000000000 implements MigrationInterface {
  name = 'AddPersons1795000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "persons" ("id" uuid NOT NULL, "user_id" uuid NOT NULL, "name" character varying(120) NOT NULL, "lastName" character varying(120), "phone" character varying(30), "document" character varying(50), "birthDate" date, "residence" character varying(200), CONSTRAINT "PK_persons" PRIMARY KEY ("id"), CONSTRAINT "UQ_persons_user_id" UNIQUE ("user_id"), CONSTRAINT "FK_persons_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE)`,
    );
    await queryRunner.query(
      `INSERT INTO "persons" ("id", "user_id", "name") SELECT "id", "id", "name" FROM "users"`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "name"`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "name" character varying(120)`,
    );
    await queryRunner.query(
      `UPDATE "users" SET "name" = "persons"."name" FROM "persons" WHERE "persons"."user_id" = "users"."id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "name" SET NOT NULL`,
    );
    await queryRunner.query(`DROP TABLE "persons"`);
  }
}
