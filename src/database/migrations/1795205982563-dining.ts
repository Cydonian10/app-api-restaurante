import { MigrationInterface, QueryRunner } from "typeorm";

export class Dining1795205982563 implements MigrationInterface {
    name = 'Dining1795205982563'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "persons" DROP CONSTRAINT "FK_persons_user"`);
        await queryRunner.query(`CREATE TABLE "table_sessions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "table_id" uuid NOT NULL, "party_size" integer NOT NULL, "opened_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "closed_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "chk_table_sessions_close_after_open" CHECK ("closed_at" IS NULL OR "closed_at" >= "opened_at"), CONSTRAINT "chk_table_sessions_party_size_positive" CHECK ("party_size" > 0), CONSTRAINT "PK_41bb063768931e959eb1f86daa3" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "uq_table_sessions_open_table" ON "table_sessions"  ("table_id") WHERE "closed_at" IS NULL`);
        await queryRunner.query(`CREATE TABLE "dining_tables" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "zone_id" uuid NOT NULL, "number" integer NOT NULL, "capacity" integer NOT NULL, "active" boolean NOT NULL DEFAULT true, "out_of_service" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "uq_dining_tables_zone_number" UNIQUE ("zone_id", "number"), CONSTRAINT "chk_dining_tables_capacity_positive" CHECK ("capacity" > 0), CONSTRAINT "chk_dining_tables_number_positive" CHECK ("number" > 0), CONSTRAINT "PK_30bc22c71f39a9d32b7f7617757" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "zones" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(120) NOT NULL, "active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_880484a43ca311707b05895bd4a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "table_sessions" ADD CONSTRAINT "FK_73328bc5dcedce124fa829375bb" FOREIGN KEY ("table_id") REFERENCES "dining_tables"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "dining_tables" ADD CONSTRAINT "FK_caaad012c7e3f5b681a958e1cf9" FOREIGN KEY ("zone_id") REFERENCES "zones"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "persons" ADD CONSTRAINT "FK_114ed4a43ad36502663f8fde31a" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "persons" DROP CONSTRAINT "FK_114ed4a43ad36502663f8fde31a"`);
        await queryRunner.query(`ALTER TABLE "dining_tables" DROP CONSTRAINT "FK_caaad012c7e3f5b681a958e1cf9"`);
        await queryRunner.query(`ALTER TABLE "table_sessions" DROP CONSTRAINT "FK_73328bc5dcedce124fa829375bb"`);
        await queryRunner.query(`DROP TABLE "zones"`);
        await queryRunner.query(`DROP TABLE "dining_tables"`);
        await queryRunner.query(`DROP INDEX "public"."uq_table_sessions_open_table"`);
        await queryRunner.query(`DROP TABLE "table_sessions"`);
        await queryRunner.query(`ALTER TABLE "persons" ADD CONSTRAINT "FK_persons_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
