import fs from "node:fs/promises";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const outputDir = "C:/Users/Administrator/OneDrive/Desktop/AI Travel App";
const outputPath = `${outputDir}/AI_Travel_Agency_90_Percent_Automation_Feasibility.xlsx`;

const statusStyles = {
  Yes: { fill: "#DCFCE7", font: "#166534" },
  Partly: { fill: "#FEF3C7", font: "#92400E" },
  No: { fill: "#FEE2E2", font: "#991B1B" },
};

const rows = [
  ["Customer inquiries", "Yes", "24/7 replies, fast answers, multilingual support", "Cannot perfectly handle highly emotional or unusual complaints", "Escalation support", 0.95, "High"],
  ["Trip planning", "Yes", "Builds itineraries, compares routes, suggests hotels and activities", "Needs enough customer history to understand deep preferences", "Review complex or premium trips", 0.9, "High"],
  ["Flight and hotel search", "Yes", "Compares many suppliers faster than a human agent", "Requires live supplier/API integrations to stay accurate", "Supplier oversight", 0.95, "High"],
  ["Booking assistance", "Partly", "Guides checkout, documents, confirmations, and payment steps", "Cannot own every failed payment, overbooking, or refund dispute", "Approve exceptions and refunds", 0.85, "Medium"],
  ["Visa and document guidance", "Partly", "Creates checklists, reminders, form guidance, and document reviews", "Cannot guarantee embassy outcomes or replace legal judgment", "Visa specialist review", 0.7, "Medium"],
  ["Customer follow-up", "Yes", "Automates reminders, feedback, loyalty messages, and upsells", "Cannot fully replace personal relationship-building", "Relationship management", 0.95, "High"],
  ["Marketing and sales", "Yes", "Creates campaigns, emails, ads, lead scoring, and audience segments", "Needs market testing and local cultural judgment", "Strategy approval", 0.9, "High"],
  ["Emergency support", "Partly", "Detects issues, sends alerts, suggests next steps, and routes cases", "Cannot take final responsibility during crises", "Human crisis team", 0.6, "Low"],
  ["Supplier management", "Partly", "Tracks pricing, availability, service quality, and contract dates", "Cannot fully negotiate trust-based partnerships or disputes", "Partnership manager", 0.7, "Medium"],
  ["Business operations", "Yes", "Handles CRM, reporting, invoices, analytics, and workflow routing", "Cannot fully own strategic accountability", "Management review", 0.9, "High"],
  ["Complex complaints", "Partly", "Summarizes cases, proposes resolutions, and drafts responses", "Cannot always judge legal, reputational, or emotional risk", "Senior human approval", 0.65, "Medium"],
  ["Final business strategy", "No", "Can analyze scenarios and recommend options", "Should not independently own company direction, risk appetite, or ethics", "Founder/leadership decision", 0.25, "Low"],
];

const workbook = Workbook.create();
const dashboard = workbook.worksheets.add("Dashboard");
const matrix = workbook.worksheets.add("AI Feasibility Matrix");
const legend = workbook.worksheets.add("Legend");

for (const sheet of [dashboard, matrix, legend]) {
  sheet.showGridLines = false;
}

dashboard.getRange("A1:F1").merge();
dashboard.getRange("A1").values = [["AI Travel Agency: 90% Automation Feasibility"]];
dashboard.getRange("A1").format = {
  fill: { color: "#111827" },
  font: { color: "#FFFFFF", bold: true, size: 18 },
  verticalAlignment: "center",
};
dashboard.getRange("A1:F1").format.rowHeightPx = 42;

dashboard.getRange("A3:F3").values = [["Target", "AI-ready functions", "Partly AI-ready", "Human-led", "Average automation", "Feasibility view"]];
dashboard.getRange("A4:F4").formulas = [[
  "90%",
  '=COUNTIF(\'AI Feasibility Matrix\'!B2:B13,"Yes")',
  '=COUNTIF(\'AI Feasibility Matrix\'!B2:B13,"Partly")',
  '=COUNTIF(\'AI Feasibility Matrix\'!B2:B13,"No")',
  "=AVERAGE('AI Feasibility Matrix'!F2:F13)",
  '=IF(E4>=A4,"On target","Needs human escalation layer")',
]];
dashboard.getRange("A3:F3").format = {
  fill: { color: "#E5E7EB" },
  font: { bold: true, color: "#111827" },
  horizontalAlignment: "center",
};
dashboard.getRange("A4:F4").format = {
  fill: { color: "#F9FAFB" },
  font: { bold: true, color: "#111827" },
  horizontalAlignment: "center",
};
dashboard.getRange("A4").setNumberFormat("0%");
dashboard.getRange("E4").setNumberFormat("0%");
dashboard.getRange("A3:F4").format.borders = {
  insideHorizontal: { style: "continuous", color: "#CBD5E1" },
  insideVertical: { style: "continuous", color: "#CBD5E1" },
  edgeBottom: { style: "continuous", color: "#CBD5E1" },
  edgeTop: { style: "continuous", color: "#CBD5E1" },
  edgeLeft: { style: "continuous", color: "#CBD5E1" },
  edgeRight: { style: "continuous", color: "#CBD5E1" },
};

dashboard.getRange("A7:C7").values = [["Status", "Meaning", "Action"]];
dashboard.getRange("A8:C10").values = [
  ["Yes", "Can be mostly AI-operated", "Automate first"],
  ["Partly", "AI can assist but needs escalation", "Build human-in-the-loop workflow"],
  ["No", "Should remain human-owned", "Use AI for analysis only"],
];
dashboard.getRange("A7:C7").format = {
  fill: { color: "#111827" },
  font: { color: "#FFFFFF", bold: true },
};
for (let r = 8; r <= 10; r++) {
  const value = dashboard.getRange(`A${r}`).values[0][0];
  const style = statusStyles[value];
  dashboard.getRange(`A${r}:C${r}`).format = {
    fill: { color: style.fill },
    font: { color: style.font },
  };
}
dashboard.getRange("A7:C10").format.borders = {
  insideHorizontal: { style: "continuous", color: "#CBD5E1" },
  insideVertical: { style: "continuous", color: "#CBD5E1" },
  edgeBottom: { style: "continuous", color: "#CBD5E1" },
  edgeTop: { style: "continuous", color: "#CBD5E1" },
  edgeLeft: { style: "continuous", color: "#CBD5E1" },
  edgeRight: { style: "continuous", color: "#CBD5E1" },
};

dashboard.getRange("A13:F13").merge();
dashboard.getRange("A13").values = [["Recommendation"]];
dashboard.getRange("A14:F16").merge();
dashboard.getRange("A14").values = [["The model can aim for 90% automation by letting AI own high-volume digital workflows while keeping humans responsible for emergencies, legal/visa judgment, complex complaints, supplier relationships, and final strategic decisions."]];
dashboard.getRange("A13").format = {
  fill: { color: "#1F2937" },
  font: { color: "#FFFFFF", bold: true },
};
dashboard.getRange("A14:F16").format = {
  fill: { color: "#F8FAFC" },
  font: { color: "#111827" },
  wrapText: true,
  verticalAlignment: "top",
};

const headers = ["Travel Agency Function", "Can AI Handle It?", "Pros Of Using AI", "What AI Can't Fully Do", "Human Role Needed", "Automation Potential", "Priority"];
matrix.getRange("A1:G1").values = [headers];
matrix.getRange("A2:G13").values = rows;
matrix.getRange("A1:G1").format = {
  fill: { color: "#111827" },
  font: { color: "#FFFFFF", bold: true },
  horizontalAlignment: "center",
  verticalAlignment: "center",
  wrapText: true,
};
matrix.getRange("A1:G13").format.borders = {
  insideHorizontal: { style: "continuous", color: "#E5E7EB" },
  insideVertical: { style: "continuous", color: "#E5E7EB" },
  edgeBottom: { style: "continuous", color: "#CBD5E1" },
  edgeTop: { style: "continuous", color: "#CBD5E1" },
  edgeLeft: { style: "continuous", color: "#CBD5E1" },
  edgeRight: { style: "continuous", color: "#CBD5E1" },
};
matrix.getRange("A2:G13").format = {
  wrapText: true,
  verticalAlignment: "top",
};
matrix.getRange("F2:F13").setNumberFormat("0%");
matrix.freezePanes.freezeRows(1);
matrix.tables.add("A1:G13", true, "AIFeasibilityTable");
matrix.getRange("B2:B13").dataValidation = { rule: { type: "list", values: ["Yes", "Partly", "No"] } };

for (let r = 2; r <= 13; r++) {
  const status = rows[r - 2][1];
  const style = statusStyles[status];
  matrix.getRange(`B${r}`).format = {
    fill: { color: style.fill },
    font: { color: style.font, bold: true },
    horizontalAlignment: "center",
  };
}

legend.getRange("A1:D1").merge();
legend.getRange("A1").values = [["Color Coding Rules"]];
legend.getRange("A1").format = {
  fill: { color: "#111827" },
  font: { color: "#FFFFFF", bold: true, size: 16 },
};
legend.getRange("A3:D3").values = [["Status", "Color", "Use When", "Automation Decision"]];
legend.getRange("A4:D6").values = [
  ["Yes", "Green", "AI can handle the workflow with limited oversight", "Automate now"],
  ["Partly", "Amber", "AI can handle the workflow but needs human escalation", "Automate with guardrails"],
  ["No", "Red", "AI should support analysis only, not own the decision", "Keep human-led"],
];
legend.getRange("A3:D3").format = {
  fill: { color: "#E5E7EB" },
  font: { bold: true },
};
for (let r = 4; r <= 6; r++) {
  const status = legend.getRange(`A${r}`).values[0][0];
  const style = statusStyles[status];
  legend.getRange(`A${r}:D${r}`).format = {
    fill: { color: style.fill },
    font: { color: style.font },
    wrapText: true,
  };
}

for (const sheet of [dashboard, matrix, legend]) {
  sheet.getUsedRange().format.autofitColumns();
  sheet.getUsedRange().format.autofitRows();
}

matrix.getRange("A:A").format.columnWidthPx = 170;
matrix.getRange("C:E").format.columnWidthPx = 260;
matrix.getRange("F:G").format.columnWidthPx = 120;
dashboard.getRange("A:F").format.columnWidthPx = 150;
legend.getRange("A:D").format.columnWidthPx = 190;

await fs.mkdir(outputDir, { recursive: true });
await workbook.render({ sheetName: "Dashboard", autoCrop: "all", scale: 1, format: "png" });
await workbook.render({ sheetName: "AI Feasibility Matrix", autoCrop: "all", scale: 1, format: "png" });
await workbook.render({ sheetName: "Legend", autoCrop: "all", scale: 1, format: "png" });

const xlsx = await SpreadsheetFile.exportXlsx(workbook);
await xlsx.save(outputPath);

console.log(outputPath);
