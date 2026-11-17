import { MigrationInterface, QueryRunner } from 'typeorm';

export class Init1794944057973 implements MigrationInterface {
  name = 'Init1794944057973';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL, "name" character varying(120) NOT NULL, "email" character varying(254) NOT NULL, "password_hash" character varying NOT NULL, "email_verified" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_users_email" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "external_identities" ("provider" character varying(255) NOT NULL, "provider_user_id" character varying(255) NOT NULL, "user_id" uuid NOT NULL, CONSTRAINT "UQ_098780ff321fb921486398851ab" UNIQUE ("provider", "user_id"), CONSTRAINT "PK_0064d3a1d339baf6e353aef0893" PRIMARY KEY ("provider", "provider_user_id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "auth_oidc_flows" ("id" character varying(64) NOT NULL, "kind" character varying(20) NOT NULL, "data" jsonb NOT NULL, "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "PK_2aece15bb4734df2c6ce031bf75" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_oidc_flow_expiry" ON "auth_oidc_flows"  ("expires_at") `,
    );
    await queryRunner.query(
      `ALTER TABLE "external_identities" ADD CONSTRAINT "FK_8320cffd2d6ca86003e23981668" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "external_identities" DROP CONSTRAINT "FK_8320cffd2d6ca86003e23981668"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_oidc_flow_expiry"`);
    await queryRunner.query(`DROP TABLE "auth_oidc_flows"`);
    await queryRunner.query(`DROP TABLE "external_identities"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
