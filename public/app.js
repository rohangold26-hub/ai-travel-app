const state = {
  tab: "home",
  data: null,
  airports: [],
  search: {
    from: "ABJ",
    to: "CDG",
    tripType: "round-trip",
    date: "2026-06-17",
    returnDate: "2026-06-24",
    travelers: 1,
    cabin: "Économique",
    seat: "Hublot",
    insurance: "Complète",
    arrivalRide: "Confort privé",
    payment: "Visa"
  }
};

const app = document.querySelector("#app");

const money = (value) => `$${Number(value).toLocaleString()}`;
const pct = (value) => `${Math.round(Number(value) * 100)}%`;
const modeLabel = (mode) => ({ demo: "démo", "live-ready": "prêt pour le direct" })[mode] || mode;
const paymentStatusLabel = (status) => ({
  demo_intent_created: "intention de paiement créée en mode démo",
  provider_intent_required: "intention de paiement à créer chez le fournisseur"
})[status] || status;
const stopsLabel = (stops) => (stops === 0 ? "sans escale" : `${stops} escale${stops > 1 ? "s" : ""}`);
const hubAirportCodes = new Set(["ABJ", "AMS", "ATL", "CDG", "DFW", "DOH", "DXB", "FCO", "FRA", "HND", "IST", "JFK", "LAX", "LHR", "MAD", "MIA", "NRT", "ORD", "ORY", "SFO", "SIN"]);
const preferredCityAirports = {
  abidjan: "ABJ",
  amsterdam: "AMS",
  atlanta: "ATL",
  dubai: "DXB",
  istanbul: "IST",
  london: "LHR",
  losangeles: "LAX",
  madrid: "MAD",
  miami: "MIA",
  newyork: "JFK",
  paris: "CDG",
  rome: "FCO",
  sanfrancisco: "SFO",
  singapore: "SIN",
  tokyo: "HND"
};

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return response.json();
}

async function load() {
  const [bootstrap, airports] = await Promise.all([
    api("/api/bootstrap"),
    api("/api/airports")
  ]);
  state.data = bootstrap;
  state.airports = airports.airports || [];
  render();
}

function topbar() {
  return `
    <header class="topbar">
      <div class="brand">
        <img src="/assets/elephant-ai-pilot-logo.png" alt="Elephant Travel logo" />
        <div>
          <strong>Elephant Travel</strong>
          <span>Conciergerie de voyage premium</span>
        </div>
      </div>
      <div class="pill">Tarifs membres</div>
    </header>
  `;
}

function nav() {
  const items = [
    ["home", "Accueil"],
    ["deals", "Offres"],
    ["alerts", "Alertes"],
    ["agents", "Agents"],
    ["admin", "Admin"]
  ];
  return `
    <nav class="bottom-nav">
      ${items.map(([id, label]) => `
        <button class="${state.tab === id ? "active" : ""}" data-tab="${id}" aria-label="${label}">
          <span>${label}</span>
        </button>
      `).join("")}
    </nav>
  `;
}

function home() {
  const user = state.data.user;
  return `
    <section class="screen">
      ${destinationSlideshow()}

      <div class="panel auth-panel">
        <h2>Connexion ou création de compte</h2>
        <div class="auth-row">
          <input id="authContact" type="email" placeholder="vous@exemple.com" value="${user.contact || ""}" />
          <button class="primary" id="authBtn">Continuer</button>
        </div>
        <p class="small" id="authStatus">${user.contact ? `Connecté avec ${user.contact}` : "L'inscription et la connexion se font par e-mail. Le SMS sert uniquement à la vérification en deux étapes."}</p>
      </div>

      <div class="panel consent">
        <button class="switch ${user.dataConsent ? "on" : ""}" id="consentToggle" aria-label="Activer ou désactiver l'utilisation des données"></button>
        <div>
          <h2>Recommandations personnalisées</h2>
          <p class="small">Autorisez l'application à utiliser vos préférences, votre historique de voyage, votre budget, vos choix de fidélité et votre localisation afin de mieux classer les offres. Vous pouvez désactiver cette option à tout moment.</p>
        </div>
      </div>

      <div class="panel">
        <h2>Préparer un voyage complet</h2>
        <div class="search-grid">
          ${airportSelect("from", "Départ")}
          ${airportSelect("to", "Arrivée")}
          ${select("tripType", "Type de vol", [["round-trip", "Aller-retour"], ["one-way", "Aller simple"]])}
          ${input("date", "Date", "date")}
          ${state.search.tripType === "round-trip" ? input("returnDate", "Retour", "date") : ""}
          ${input("travelers", "Voyageurs", "number")}
          ${select("cabin", "Cabine", ["Économique", "Économie Premium", "Affaires", "Première"])}
          ${select("seat", "Siège", ["Hublot", "Couloir", "Espace supplémentaire pour les jambes", "Sans préférence"])}
          ${select("insurance", "Assurance", ["Basique", "Complète", "Médicale + annulation", "Aucune"])}
          ${select("arrivalRide", "Trajet à l'arrivée", ["Confort privé", "VTC", "SUV exécutif", "Aucun trajet nécessaire"])}
          ${select("payment", "Paiement", ["Visa", "Mastercard", "Revolut", "Mobile Money", "Carte de débit"])}
          <button class="primary wide" id="searchBtn">Rechercher vols, hôtels, trajets et forfaits</button>
        </div>
      </div>

      <div class="panel">
        <h2>Services de voyage</h2>
        <div class="quick-row">
          ${state.data.inventory.services.map((service) => `<button>${service}</button>`).join("")}
        </div>
      </div>
    </section>
  `;
}

function destinationSlideshow() {
  return `
    <section class="destination-slider" aria-label="Destinations à la une">
      ${state.data.inventory.destinations.map((destination, index) => `
        <article class="destination-slide ${index === 0 ? "is-first" : ""}" style="background-image: url('${destination.image}')">
          <div>
            <span>${destination.time}</span>
            <h1>${destination.name}</h1>
            <p>${destination.caption}</p>
          </div>
        </article>
      `).join("")}
    </section>
  `;
}

function input(id, label, type = "text") {
  return `
    <label>
      ${label}
      <input id="${id}" type="${type}" value="${state.search[id]}" />
    </label>
  `;
}

function airportSelect(id, label) {
  const listId = `${id}AirportList`;
  return `
    <label>
      ${label}
      <input
        id="${id}"
        list="${listId}"
        value="${airportInputValue(state.search[id])}"
        placeholder="Tapez une ville, un pays, un code ou un aéroport"
        autocomplete="off"
      />
      <datalist id="${listId}">
        ${state.airports.map((airport) => `
          <option value="${airportLabel(airport)}"></option>
        `).join("")}
      </datalist>
    </label>
  `;
}

function airportInputValue(code) {
  const airport = state.airports.find((item) => item.code === code);
  return airport ? airportLabel(airport) : code;
}

function airportLabel(airport) {
  const city = airport.city ? `${airport.city} - ` : "";
  return `${airport.code} - ${city}${airport.name}, ${airport.country}`;
}

function airportCode(value) {
  const trimmed = String(value || "").trim();
  const codeMatch = trimmed.match(/^([A-Z0-9]{3})\b/i);
  if (codeMatch && state.airports.some((item) => item.code === codeMatch[1].toUpperCase())) {
    return codeMatch[1].toUpperCase();
  }

  const normalized = normalizeAirportSearch(trimmed);
  const preferredCode = preferredCityAirports[normalized.replace(/\s+/g, "")];
  if (preferredCode && state.airports.some((item) => item.code === preferredCode)) return preferredCode;

  const airport = state.airports.find((item) => normalizeAirportSearch(airportLabel(item)) === normalized)
    || bestAirportMatch((item) => normalizeAirportSearch(item.city).startsWith(normalized), normalized)
    || bestAirportMatch((item) => normalizeAirportSearch(item.name).startsWith(normalized), normalized)
    || bestAirportMatch((item) => normalizeAirportSearch(airportLabel(item)).includes(normalized), normalized);
  return airport?.code || trimmed.toUpperCase();
}

function bestAirportMatch(predicate, query) {
  return state.airports
    .filter(predicate)
    .sort((a, b) => airportPriority(b, query) - airportPriority(a, query) || a.code.localeCompare(b.code))[0];
}

function airportPriority(airport, query) {
  const typeScore = { large_airport: 30, medium_airport: 20, small_airport: 10 }[airport.type] || 0;
  const serviceScore = airport.scheduled === "yes" ? 15 : 0;
  const nameScore = normalizeAirportSearch(airport.name).startsWith(query) ? 20 : 0;
  const hubScore = hubAirportCodes.has(airport.code) ? 40 : 0;
  return typeScore + serviceScore + nameScore + hubScore;
}

function normalizeAirportSearch(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function select(id, label, options) {
  return `
    <label>
      ${label}
      <select id="${id}">
        ${options.map((option) => {
          const value = Array.isArray(option) ? option[0] : option;
          const text = Array.isArray(option) ? option[1] : option;
          return `<option value="${value}" ${state.search[id] === value ? "selected" : ""}>${text}</option>`;
        }).join("")}
      </select>
    </label>
  `;
}

function flightCard(deal) {
  return `
    <article class="deal-card">
      <div class="deal-head">
        <div>
          <h3>${deal.airline}</h3>
          <span>${deal.from} vers ${deal.to} - ${stopsLabel(deal.stops)}</span>
        </div>
        <div class="price">${money(deal.price)}</div>
      </div>
      <div class="tag-row">
        <span class="tag best">${deal.personalizedScore || deal.score}/100 de compatibilité</span>
        <span class="tag">${deal.status}</span>
        <span class="tag">${deal.carbonKg} kg CO2</span>
      </div>
      <p class="small">${deal.recommendation || "Classé selon le prix, les horaires, les escales, la fiabilité du fournisseur et les préférences du voyageur."}</p>
      <div class="split">
        <button class="primary" data-pay="${deal.price}">Réserver</button>
        <button class="secondary" data-risk="litige de remboursement pour ${deal.id}">Aide d'un expert</button>
      </div>
    </article>
  `;
}

function stayCard(stay) {
  return `
    <article class="media-card">
      <div class="media-image" style="background-image: url('${stay.image}')"></div>
      <div class="media-body">
        <div class="deal-head">
          <div>
            <h3>${stay.name}</h3>
            <span>${stay.type} à ${stay.city} - ${stay.rating}/5</span>
          </div>
          <div class="price">${money(stay.nightly)}</div>
        </div>
        <div class="tag-row">
          <span class="tag best">${stay.personalizedScore}/100 de compatibilité</span>
          ${stay.amenities.map((item) => `<span class="tag">${item}</span>`).join("")}
        </div>
        <p class="small">${stay.recommendation}</p>
      </div>
    </article>
  `;
}

function rideCard(ride) {
  return `
    <article class="deal-card">
      <div class="deal-head">
        <div>
          <h3>${ride.provider}</h3>
          <span>${ride.airport} vers ${ride.destination} - ${ride.vehicle}</span>
        </div>
        <div class="price">${money(ride.price)}</div>
      </div>
      <div class="tag-row">
        <span class="tag best">${ride.score}/100 pour la prise en charge</span>
        <span class="tag">${ride.etaMinutes} min d'attente estimée</span>
        ${ride.included.map((item) => `<span class="tag">${item}</span>`).join("")}
      </div>
      <p class="small">${ride.recommendation}</p>
    </article>
  `;
}

function deals() {
  return `
    <section class="screen">
      <h2 class="section-title">Meilleures offres de vols</h2>
      ${state.data.deals.map(flightCard).join("")}

      <h2 class="section-title">Suggestions d'hôtels et de séjours</h2>
      ${state.data.stays.map(stayCard).join("")}

      <h2 class="section-title">Trajets à l'arrivée</h2>
      ${state.data.rides.map(rideCard).join("")}

      <h2 class="section-title">Forfaits complets</h2>
      ${state.data.inventory.packages.map((pkg) => `
        <article class="deal-card">
          <div class="deal-head">
            <div>
              <h3>${pkg.name}</h3>
              <span>${pkg.includes.join(" - ")}</span>
            </div>
            <div class="price">${money(pkg.price)}</div>
          </div>
          <div class="tag-row">
            <span class="tag best">${money(pkg.aiSavings)} d'économies estimées</span>
            <span class="tag human">Assistance experte disponible</span>
          </div>
        </article>
      `).join("")}
    </section>
  `;
}

function alerts() {
  return `
    <section class="screen">
      <h2 class="section-title">Alertes de voyage</h2>
      ${state.data.alerts.map((alert) => `
        <article class="alert-card">
          <strong>${alert.type} - ${alert.priority}</strong>
          <span class="light">${alert.message}</span>
          <span class="small">${alert.channel}</span>
        </article>
      `).join("")}

      <div class="panel">
        <h2>Créer une alerte de test</h2>
        <button class="primary" id="alertBtn">Envoyer une mise à jour de vol par notification + SMS</button>
      </div>

      <div class="panel">
        <h2>Orientation vers un spécialiste</h2>
        <div class="risk-list">
          <div><span>Risque de refus de visa</span><strong>Expert</strong></div>
          <div><span>Nouvelle réservation en urgence</span><strong>Expert</strong></div>
          <div><span>Offre courante la moins chère</span><strong>Instantané</strong></div>
          <div><span>Préférence de siège et d'assurance</span><strong>Instantané</strong></div>
        </div>
      </div>
    </section>
  `;
}

function agents() {
  const agents = state.data.operationsAgents || [];
  return `
    <section class="screen">
      <div class="panel">
        <h2>Agents IA autonomes</h2>
        <p class="small">Pilotage du site web et de l'application avec validation humaine pour les actions sensibles.</p>
        <button class="primary" id="runAllAgents">Lancer le cycle autonome</button>
      </div>

      <div id="agentRunPanel" class="panel">
        <h2>Rapport</h2>
        <p class="small">Lance le cycle complet ou un agent précis pour afficher son rapport.</p>
      </div>

      ${agents.map(agentMobileCard).join("")}
    </section>
  `;
}

function agentMobileCard(agent) {
  return `
    <article class="panel agent-card">
      <div class="deal-head">
        <div>
          <h3>${agent.name}</h3>
          <span>${agent.role}</span>
        </div>
        <span class="tag best">Niveau ${agent.autonomyLevel}</span>
      </div>
      <p class="small">${agent.mission}</p>
      <div class="tag-row">
        <span class="tag">${agent.status}</span>
        <span class="tag">${agent.cadence}</span>
      </div>
      <div class="risk-list">
        <div><span>Action suivante</span><strong>${agent.nextAction}</strong></div>
        <div><span>Limite</span><strong>${agent.guardrails[0]}</strong></div>
      </div>
      <button class="secondary" data-run-agent="${agent.id}">Exécuter cet agent</button>
    </article>
  `;
}

function renderAgentRuns(runs) {
  return `
    <h2>Rapport</h2>
    <div class="risk-list">
      ${runs.map((run) => {
        const agent = state.data.operationsAgents.find((item) => item.id === run.agentId);
        return `
          <div>
            <span>${agent?.name || run.agentId}: ${run.summary}</span>
            <strong>${run.status}</strong>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

function admin() {
  const m = state.data.adminMetrics;
  const providers = state.data.providerStatus;
  const projectUrl = `${window.location.origin}/`;
  return `
    <section class="screen">
      <h2 class="section-title">Tableau de bord administrateur</h2>
      <div class="metric-grid">
        ${metric("Automatisation courante", pct(m.automationRate))}
        ${metric("Escalade vers un expert", pct(m.humanEscalationRate))}
        ${metric("Réservations", m.monthlyBookings)}
        ${metric("Économies moyennes", `${m.averageSavings}%`)}
        ${metric("Paiements réussis", `${m.paymentSuccess}%`)}
        ${metric("SMS délivrés", `${m.smsDelivery}%`)}
        ${metric("CSAT", `${m.customerSatisfaction}/5`)}
        ${metric("Santé fournisseurs", `${m.supplierHealth}%`)}
      </div>

      <div class="panel">
        <h2>Adaptateurs fournisseurs</h2>
        <div class="risk-list">
          ${Object.entries(providers).map(([key, value]) => `
            <div><span>${key}: ${value.primary}</span><strong>${modeLabel(value.mode)}</strong></div>
          `).join("")}
        </div>
      </div>

      <div class="panel">
        <h2>Liens du projet</h2>
        <div class="link-list">
          <a href="${projectUrl}" target="_blank" rel="noreferrer">
            <span>Agent de voyage Elephant Travel</span>
            <strong>Ouvrir l'application</strong>
          </a>
          <div>
            <span>Lien GitHub de l'autre projet</span>
            <strong>URL du dépôt requise</strong>
          </div>
        </div>
      </div>
    </section>
  `;
}

function metric(label, value) {
  return `<div class="metric-card"><strong>${value}</strong><span class="small">${label}</span></div>`;
}

function render() {
  if (!state.data) {
    app.innerHTML = `<div class="phone-frame"><section class="screen"><p>Chargement...</p></section></div>`;
    return;
  }

  const screens = { home, deals, alerts, agents, admin };
  app.innerHTML = `<div class="phone-frame">${topbar()}${screens[state.tab]()}${nav()}</div>`;
  bind();
}

function readSearchForm() {
  for (const key of Object.keys(state.search)) {
    const field = document.querySelector(`#${key}`);
    if (field) state.search[key] = field.value;
  }
  state.search.from = airportCode(state.search.from);
  state.search.to = airportCode(state.search.to);
}

function bind() {
  document.querySelectorAll("[data-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      state.tab = button.dataset.tab;
      render();
    });
  });

  document.querySelector("#authBtn")?.addEventListener("click", async () => {
    const contact = document.querySelector("#authContact").value;
    try {
      const result = await api("/api/auth", { method: "POST", body: { contact } });
      state.data.user = result.user;
      document.querySelector("#authStatus").textContent = result.message;
    } catch {
      document.querySelector("#authStatus").textContent = "Veuillez saisir une adresse e-mail valide.";
    }
  });

  document.querySelector("#consentToggle")?.addEventListener("click", async () => {
    const nextConsent = !state.data.user.dataConsent;
    const result = await api("/api/consent", { method: "POST", body: { dataConsent: nextConsent } });
    state.data.user = result.user;
    state.data.deals = result.deals;
    state.data.stays = result.stays;
    state.data.rides = result.rides;
    render();
  });

  document.querySelector("#tripType")?.addEventListener("change", () => {
    readSearchForm();
    if (state.search.tripType === "one-way") state.search.returnDate = "";
    render();
  });

  document.querySelector("#searchBtn")?.addEventListener("click", async () => {
    readSearchForm();
    if (state.search.tripType === "one-way") state.search.returnDate = "";
    const result = await api("/api/search", { method: "POST", body: state.search });
    state.data.deals = result.flights;
    state.data.stays = result.stays;
    state.data.rides = result.rides;
    state.tab = "deals";
    render();
  });

  document.querySelectorAll("[data-pay]").forEach((button) => {
    button.addEventListener("click", async () => {
      const intent = await api("/api/payment-intent", {
        method: "POST",
        body: { amount: Number(button.dataset.pay), currency: "USD", method: state.search.payment }
      });
      window.alert(`Paiement : ${paymentStatusLabel(intent.status)}. Moyens acceptés : ${intent.acceptedMethods.join(", ")}.`);
    });
  });

  document.querySelectorAll("[data-risk]").forEach((button) => {
    button.addEventListener("click", async () => {
      const decision = await api("/api/automation-decision", {
        method: "POST",
        body: { task: button.dataset.risk }
      });
      window.alert(`${decision.automation}: ${decision.nextStep}`);
    });
  });

  document.querySelector("#alertBtn")?.addEventListener("click", async () => {
    const result = await api("/api/alerts", {
      method: "POST",
      body: {
        type: "Vol",
        priority: "Élevée",
        message: "La porte a changé. Votre trajet à l'arrivée a été ajusté automatiquement.",
        channel: "Notification + SMS"
      }
    });
    state.data.alerts.unshift(result.alert);
    render();
  });

  document.querySelector("#runAllAgents")?.addEventListener("click", async () => {
    const result = await api("/api/agents/run", { method: "POST", body: {} });
    document.querySelector("#agentRunPanel").innerHTML = renderAgentRuns(result.runs);
  });

  document.querySelectorAll("[data-run-agent]").forEach((button) => {
    button.addEventListener("click", async () => {
      const result = await api("/api/agents/run", { method: "POST", body: { agentId: button.dataset.runAgent } });
      document.querySelector("#agentRunPanel").innerHTML = renderAgentRuns(result.runs);
    });
  });
}

load().catch((error) => {
  app.innerHTML = `<section class="screen"><p>${error.message}</p></section>`;
});
