import fs from "node:fs";

const sourcePath = "database/airports.csv";
const targetPath = "database/airports.json";

function parseCsvLine(line) {
  const values = [];
  let current = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === "\"") {
      if (quoted && line[index + 1] === "\"") {
        current += "\"";
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === "," && !quoted) {
      values.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  values.push(current);
  return values;
}

const [headerLine, ...rows] = fs.readFileSync(sourcePath, "utf8").trim().split(/\r?\n/);
const headers = parseCsvLine(headerLine);
const column = Object.fromEntries(headers.map((header, index) => [header, index]));

const airports = rows
  .map(parseCsvLine)
  .map((row) => ({
    code: row[column.iata_code],
    name: row[column.name],
    city: row[column.municipality],
    country: row[column.iso_country],
    type: row[column.type],
    scheduled: row[column.scheduled_service],
    lat: Number(row[column.latitude_deg]),
    lon: Number(row[column.longitude_deg])
  }))
  .filter((airport) => airport.code && airport.code.length === 3 && airport.type !== "closed")
  .sort((a, b) => (
    a.country.localeCompare(b.country)
    || a.city.localeCompare(b.city)
    || a.code.localeCompare(b.code)
  ));

fs.writeFileSync(targetPath, JSON.stringify({
  source: "OurAirports airports.csv",
  generatedAt: new Date().toISOString(),
  count: airports.length,
  airports
}, null, 2));

console.log(`Generated ${airports.length} airports at ${targetPath}`);
