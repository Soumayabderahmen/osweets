import assert from "node:assert/strict";

const tables = [
  "products",
  "collections",
  "settings",
  "seasons",
  "families",
  "page_banners",
  "product_slug_history",
  "patisserie_waitlist",
];
const snapshot = async (client) => {
  const result = {};
  for (const table of tables)
    result[table] = (
      await client.query(
        `SELECT to_jsonb(t) AS row FROM public.${table} t ORDER BY to_jsonb(t)::text`,
      )
    ).rows.map((r) => r.row);
  return result;
};
const business = (rows) =>
  rows.map(({ updated_at: _timestamp, ...rest }) => JSON.stringify(rest)).sort();

export async function guardTestData(client) {
  const conflicts = await client.query(`SELECT
    EXISTS(SELECT 1 FROM collections WHERE slug = 'validation') OR
    EXISTS(SELECT 1 FROM families WHERE key = 'validation') OR
    EXISTS(SELECT 1 FROM seasons WHERE label = 'Contrôle de validation') OR
    EXISTS(SELECT 1 FROM media_files WHERE path LIKE 'recette-temoin-%') AS conflict`);
  assert.equal(
    conflicts.rows[0].conflict,
    false,
    "Existing data uses a test identifier; refusing to overwrite it",
  );
  const before = await snapshot(client);
  return async () => {
    await client.query("BEGIN");
    try {
      await client.query(
        `LOCK TABLE ${tables.map((t) => `public.${t}`).join(", ")} IN SHARE ROW EXCLUSIVE MODE`,
      );
      const after = await snapshot(client);
      for (const table of tables)
        assert.deepEqual(
          business(after[table]),
          business(before[table]),
          `Business data was not restored: ${table}`,
        );
      // Only timestamps of unchanged rows are restored, with the touch trigger
      // suspended inside this locked transaction. All business triggers stay on.
      for (const table of tables) {
        const changed = before[table].filter(
          (row) =>
            row.updated_at &&
            !after[table].some((current) => JSON.stringify(row) === JSON.stringify(current)),
        );
        if (!changed.length) continue;
        const trigger = (
          await client.query(
            `SELECT tgname FROM pg_trigger WHERE tgrelid = $1::regclass AND tgfoid = 'public.touch_updated_at()'::regprocedure`,
            [`public.${table}`],
          )
        ).rows[0]?.tgname;
        if (trigger) await client.query(`ALTER TABLE public.${table} DISABLE TRIGGER "${trigger}"`);
        for (const row of changed) {
          const key = row.id ? "id" : "key";
          await client.query(`UPDATE public.${table} SET updated_at = $1 WHERE ${key} = $2`, [
            row.updated_at,
            row[key],
          ]);
        }
        if (trigger) await client.query(`ALTER TABLE public.${table} ENABLE TRIGGER "${trigger}"`);
      }
      assert.deepEqual(
        await snapshot(client),
        before,
        "Full restoration including timestamps failed",
      );
      await client.query("COMMIT");
      console.log(
        "RESTORATION VERIFIED: business rows and timestamps unchanged; no test witnesses remain.",
      );
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  };
}
