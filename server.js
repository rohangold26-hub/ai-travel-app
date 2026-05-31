import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, "public");
const dbPath = path.join(__dirname, "database", "travel-data.json");
const airportsPath = path.join(__dirname, "database", "airports.json");
const port = Number(process.env.PORT || 4173);

const providerStatus = {
  flights: {
    primary: "Adaptateur Amadeus / Duffel / Sabre",
    mode: process.env.AMADEUS_API_KEY || process.env.DUFFEL_API_KEY ? "live-ready" : "demo"
  },
  stays: {
    primary: "Adaptateur Hotelbeds / Expedia / inventaire partenaire",
    mode: process.env.HOTEL_API_KEY ? "live-ready" : "demo"
  },
  tracking: {
    primary: "Adaptateur FlightAware AeroAPI",
    mode: process.env.FLIGHTAWARE_API_KEY ? "live-ready" : "demo"
  },
  payments: {
    primary: "Adaptateur Stripe + Revolut + Flutterwave / mobile money",
    mode: process.env.STRIPE_SECRET_KEY || process.env.FLUTTERWAVE_SECRET_KEY ? "live-ready" : "demo"
  },
  sms: {
    primary: "Passerelle Twilio / SMS régional pour la vérification en deux étapes",
    mode: process.env.TWILIO_AUTH_TOKEN ? "live-ready" : "demo"
  }
};

async function readDb() {
  return JSON.parse(await fs.readFile(dbPath, "utf8"));
}

async function readAirports() {
  return JSON.parse(await fs.readFile(airportsPath, "utf8"));
}

async function writeDb(data) {
  await fs.writeFile(dbPath, JSON.stringify(data, null, 2));
}

function json(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}

async function parseBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function scoreDeals(db, user, consent) {
  const cabinBonus = user?.preferences?.cabin === "Économique" ? 4 : 0;
  const seatBonus = user?.preferences?.seat ? 2 : 0;
  return db.inventory.flights
    .map((flight) => ({
      ...flight,
      personalizedScore: consent ? Math.min(99, flight.score + cabinBonus + seatBonus) : flight.score,
      recommendation: consent
        ? `Adapté à votre préférence de siège ${user.preferences.seat.toLowerCase()}, à votre assurance ${user.preferences.insurance.toLowerCase()} et à votre recherche du ${user.preferences.budgetSensitivity.toLowerCase()}.`
        : "Classement général. Activez l'utilisation des données pour obtenir des recommandations personnalisées."
    }))
    .sort((a, b) => b.personalizedScore - a.personalizedScore);
}

function scoreStays(db, user, consent) {
  const boutiqueBonus = user?.preferences?.hotelStyle === "Boutique" ? 3 : 0;
  return db.inventory.stays
    .map((stay) => ({
      ...stay,
      personalizedScore: consent ? Math.min(99, stay.dealScore + boutiqueBonus) : stay.dealScore,
      recommendation: consent
        ? `Adapté à votre préférence d'hébergement ${user.preferences.hotelStyle.toLowerCase()} et à votre recherche du ${user.preferences.budgetSensitivity.toLowerCase()}.`
        : "Classé selon le prix par nuit, la note, l'emplacement, les équipements et la qualité du fournisseur."
    }))
    .sort((a, b) => b.personalizedScore - a.personalizedScore);
}

function scoreRides(db, user, consent) {
  const privateBonus = user?.preferences?.arrivalRide === "Confort privé" ? 5 : 0;
  return db.inventory.rides
    .map((ride, index) => ({
      ...ride,
      score: consent ? Math.min(99, 90 - index * 4 + privateBonus) : 90 - index * 4,
      recommendation: consent
        ? `Préparé pour une arrivée en mode ${user.preferences.arrivalRide.toLowerCase()}, avec suivi en direct des retards de vol.`
        : "Classé selon la rapidité de prise en charge, la capacité des bagages, la couverture aéroportuaire et le prix."
    }))
    .sort((a, b) => b.score - a.score);
}

function automationDecision(task) {
  const highRisk = ["visa", "refund", "emergency", "legal", "complaint", "dispute", "remboursement", "urgence", "juridique", "réclamation", "litige"];
  const requiresHuman = highRisk.some((word) => task.toLowerCase().includes(word));
  return {
    automation: requiresHuman ? "revue_humaine" : "traitement_instantané",
    confidence: requiresHuman ? 0.72 : 0.94,
    nextStep: requiresHuman
      ? "Transmettre le dossier à un expert voyage certifié après préparation automatique du cas."
      : "Le flux courant peut être finalisé immédiatement et le voyageur peut être notifié."
  };
}

function runOperationsAgent(agent) {
  const elevated = agent.autonomyLevel < 2 ? "validation requise" : "prêt pour l'autonomie";
  return {
    id: `run_${agent.id}_${Date.now()}`,
    agentId: agent.id,
    status: elevated,
    checkedAt: new Date().toISOString(),
    summary: agent.report,
    nextAction: agent.nextAction,
    escalation: agent.guardrails[0],
    recommendedTasks: agent.kpis.map((kpi) => `Suivre : ${kpi}`)
  };
}

async function handleApi(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const db = await readDb();

  if (req.method === "GET" && url.pathname === "/api/bootstrap") {
    const user = db.users[0];
    return json(res, 200, {
      user,
      inventory: db.inventory,
      alerts: db.alerts,
      adminMetrics: db.adminMetrics,
      operationsAgents: db.operationsAgents || [],
      providerStatus,
      deals: scoreDeals(db, user, user.dataConsent),
      stays: scoreStays(db, user, user.dataConsent),
      rides: scoreRides(db, user, user.dataConsent)
    });
  }

  if (req.method === "GET" && url.pathname === "/api/airports") {
    return json(res, 200, await readAirports());
  }

  if (req.method === "POST" && url.pathname === "/api/auth") {
    const body = await parseBody(req);
    const contact = String(body.contact || "").trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact)) {
      return json(res, 400, { error: "Une adresse e-mail valide est requise." });
    }
    db.users[0].contact = contact;
    db.users[0].authMethod = "email";
    db.users[0].lastLoginAt = new Date().toISOString();
    await writeDb(db);
    return json(res, 200, { user: db.users[0], message: "Connexion par e-mail lancée. Le SMS est réservé à la vérification en deux étapes." });
  }

  if (req.method === "POST" && url.pathname === "/api/consent") {
    const body = await parseBody(req);
    db.users[0].dataConsent = Boolean(body.dataConsent);
    await writeDb(db);
    return json(res, 200, {
      user: db.users[0],
      deals: scoreDeals(db, db.users[0], db.users[0].dataConsent),
      stays: scoreStays(db, db.users[0], db.users[0].dataConsent),
      rides: scoreRides(db, db.users[0], db.users[0].dataConsent)
    });
  }

  if (req.method === "POST" && url.pathname === "/api/search") {
    const body = await parseBody(req);
    const user = db.users[0];
    return json(res, 200, {
      query: body,
      flights: scoreDeals(db, user, user.dataConsent),
      stays: scoreStays(db, user, user.dataConsent),
      rides: scoreRides(db, user, user.dataConsent),
      packages: db.inventory.packages,
      automation: automationDecision("routine trip search and package comparison")
    });
  }

  if (req.method === "POST" && url.pathname === "/api/payment-intent") {
    const body = await parseBody(req);
    return json(res, 200, {
      id: `pay_${Date.now()}`,
      amount: body.amount,
      currency: body.currency || "USD",
      acceptedMethods: ["Visa", "Mastercard", "Revolut", "Mobile Money", "Carte de débit"],
      mode: providerStatus.payments.mode,
      status: providerStatus.payments.mode === "demo" ? "demo_intent_created" : "provider_intent_required"
    });
  }

  if (req.method === "POST" && url.pathname === "/api/alerts") {
    const body = await parseBody(req);
    const alert = {
      id: `alt_${Date.now()}`,
      type: body.type || "Voyage",
      priority: body.priority || "Moyenne",
      message: body.message || "Alerte de voyage créée.",
      channel: body.channel || "Notification + SMS"
    };
    db.alerts.unshift(alert);
    await writeDb(db);
    return json(res, 201, { alert, smsMode: providerStatus.sms.mode });
  }

  if (req.method === "POST" && url.pathname === "/api/automation-decision") {
    const body = await parseBody(req);
    return json(res, 200, automationDecision(body.task || ""));
  }

  if (req.method === "POST" && url.pathname === "/api/agents/run") {
    const body = await parseBody(req);
    const agents = db.operationsAgents || [];
    const selected = body.agentId ? agents.filter((agent) => agent.id === body.agentId) : agents;
    if (!selected.length) return json(res, 404, { error: "Agent not found" });
    return json(res, 200, { runs: selected.map(runOperationsAgent) });
  }

  return json(res, 404, { error: "API route not found" });
}

async function serveStatic(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const safePath = url.pathname === "/" ? "/index.html" : decodeURIComponent(url.pathname);
  const filePath = path.normalize(path.join(publicDir, safePath));

  if (!filePath.startsWith(publicDir)) {
    res.writeHead(403);
    return res.end("Forbidden");
  }

  try {
    const file = await fs.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const type = {
      ".html": "text/html; charset=utf-8",
      ".css": "text/css; charset=utf-8",
      ".js": "text/javascript; charset=utf-8",
      ".json": "application/json; charset=utf-8",
      ".png": "image/png",
      ".svg": "image/svg+xml"
    }[ext] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": type });
    res.end(file);
  } catch {
    res.writeHead(404);
    res.end("Not found");
  }
}

const server = http.createServer((req, res) => {
  if (req.url.startsWith("/api/")) {
    handleApi(req, res).catch((error) => json(res, 500, { error: error.message }));
  } else {
    serveStatic(req, res).catch((error) => {
      res.writeHead(500);
      res.end(error.message);
    });
  }
});

server.listen(port, () => {
  console.log(`Hybrid AI Travel Agency running at http://localhost:${port}`);
});
