import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";

const EXCLUDE_BASE = new Set(["types", "registry", "index"]);

export function GET() {
  const dir = path.join(process.cwd(), "src", "ai");
  if (!fs.existsSync(dir)) {
    return NextResponse.json({ engines: [] });
  }

  const engines = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".ts") || f.endsWith(".tsx"))
    .map((f) => f.replace(/\.tsx?$/, ""))
    .filter((base) => !EXCLUDE_BASE.has(base))
    .sort();

  return NextResponse.json({ engines });
}
