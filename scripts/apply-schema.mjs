import { readFile } from "node:fs/promises";

const projectRef = "sgfgsmoclawrjkdzgyqa";
const token = process.env.SUPABASE_ACCESS_TOKEN;
if (!token) {
  console.error("Set SUPABASE_ACCESS_TOKEN");
  process.exit(1);
}

const query = await readFile(new URL("../supabase/schema.sql", import.meta.url), "utf8");
const response = await fetch(
  `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  },
);

const text = await response.text();
console.log(response.status, text.slice(0, 2000));
if (!response.ok) process.exit(1);
