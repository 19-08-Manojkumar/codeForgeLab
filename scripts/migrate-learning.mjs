import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { legacyMigrationSql } from "../lib/legacy-migration.mjs";

const args = process.argv.slice(2), option = name => args[args.indexOf(name) + 1];
if (!["--source", "--mapping", "--output"].every(name => args.includes(name) && option(name) && !option(name).startsWith("--"))) {
  console.error("Usage: npm run db:migrate-legacy -- --source learning-export.json --mapping account-map.json --output reviewed-import.sql [--events learning-events.json]");
  process.exitCode = 1;
} else {
  try {
    const rows = JSON.parse(await readFile(resolve(option("--source")), "utf8"));
    const mapping = JSON.parse(await readFile(resolve(option("--mapping")), "utf8"));
    const events=args.includes("--events")?JSON.parse(await readFile(resolve(option("--events")),"utf8")):[];
    await writeFile(resolve(option("--output")), legacyMigrationSql(rows, mapping,events), { flag: "wx" });
    console.log(`Prepared migration for ${rows.length} account(s). Review the SQL before applying it. No database was changed.`);
  } catch (error) { console.error(error.code === "EEXIST" ? "The output file already exists. Choose a new filename." : error.message); process.exitCode = 1; }
}
