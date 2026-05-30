const state = {
  data: null,
  view: "travel",
  heroIndex: 0,
  search: {
    from: "ABJ",
    to: "CDG",
    date: "2026-06-17",
    travelers: 1,
    cabin: "Économique",
    seat: "Hublot",
    insurance: "Complète",
    arrivalRide: "Confort privé",
    payment: "Visa"
  }
};

const app = document.querySelector("#webApp");
const money = (value) => `$${Number(value).toLocaleString()}`;
const pct = (value) => `${Math.round(Number(value) * 100)}%`;
const modeLabel = (mode) => ({ demo: "démo", "live-ready": "prêt pour le direct" })[mode] || mode;
const stopsLabel = (stops) => (stops === 0 ? "sans escale" : `${stops} escale${stops > 1 ? "s" : ""}`);

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
  state.data = await api("/api/bootstrap");
  render();
  window.setInterval(() => {
    if (!state.data) return;
    state.heroIndex = (state.heroIndex + 1) % state.data.inventory.destinations.length;
    render();
  }, 7000);
}

function render() {
  if (!state.data) {
    app.innerHTML = `<section class="web-shell"><div class="web-main">Chargement...</div></section>`;
    return;
  }

  app.innerHTML = `
    <section class="web-shell">
      ${header()}
      <div class="web-main">
        ${hero()}
        ${workspace()}
      </div>
    </section>
  `;
  bind();
}

function header() {
  return `
    <header class="web-header">
      <div class="brand">
        <img src="/assets/elephant-ai-pilot-logo.png" alt="Elephant Travel logo" />
        <div>
          <strong>Elephant Travel</strong>
          <span>Conciergerie de voyage premium</span>
        </div>
      </div>
      <nav class="web-nav" aria-label="Sections du site">
        ${["travel", "deals", "alerts", "agents", "admin"].map((view) => `
          <button class="${state.view === view ? "active" : ""}" data-view="${view}">${label(view)}</button>
        `).join("")}
      </nav>
      <div class="auth-actions">
        <button data-scroll-auth>Connexion</button>
        <button class="primary" data-scroll-search>Préparer un voyage</button>
      </div>
    </header>
  `;
}

function label(view) {
  return ({ travel: "Bureau de voyage", deals: "Offres", alerts: "Alertes", agents: "Agents IA", admin: "Admin agence" })[view];
}

function hero() {
  const destination = state.data.inventory.destinations[state.heroIndex];
  return `
    <section class="hero-band" style="background-image: url('${destination.image}')">
      <div class="hero-copy">
        <span>${destination.time}</span>
        <h1>${destination.name}</h1>
        <p>${destination.caption}</p>
      </div>
    </section>
  `;
}

function workspace() {
  if (state.view === "alerts") return alertsView();
  if (state.view === "agents") return agentsView();
  if (state.view === "admin") return adminView();
  return travelView();
}

function travelView() {
  return `
    <section class="workspace">
      <div>
        <div class="surface surface-pad" id="authPanel">
          <h2 class="section-title">Connexion ou création de compte</h2>
          <div class="auth-strip">
            <label>
              Adresse e-mail
              <input id="authEmail" type="email" placeholder="vous@exemple.com" value="${state.data.user.contact || ""}" />
            </label>
            <button class="primary" id="authBtn">Continuer</button>
          </div>
          <p class="auth-status" id="authStatus">L'inscription et la connexion se font par e-mail. Le SMS sert uniquement à la vérification en deux étapes.</p>
        </div>

        <div class="surface surface-pad" id="searchPanel" style="margin-top: 14px;">
          <h2 class="section-title">Préparer un voyage complet</h2>
          <div class="search-grid">
            ${input("from", "Départ")}
            ${input("to", "Arrivée")}
            ${input("date", "Date", "date")}
            ${input("travelers", "Voyageurs", "number")}
            ${select("cabin", "Cabine", ["Économique", "Économie Premium", "Affaires", "Première"])}
            ${select("seat", "Siège", ["Hublot", "Couloir", "Espace supplémentaire pour les jambes", "Sans préférence"])}
            ${select("insurance", "Assurance", ["Basique", "Complète", "Médicale + annulation", "Aucune"])}
            ${select("arrivalRide", "Trajet à l'arrivée", ["Confort privé", "VTC", "SUV exécutif", "Aucun trajet nécessaire"])}
            ${select("payment", "Paiement", ["Visa", "Mastercard", "Revolut", "Mobile Money", "Carte de débit"], "wide")}
            <button class="primary wide" id="searchBtn">Rechercher vols, hôtels, trajets et forfaits</button>
          </div>
        </div>

        ${dealsView()}
      </div>
      ${sidebar()}
    </section>
  `;
}

function input(id, labelText, type = "text") {
  return `
    <label>
      ${labelText}
      <input id="${id}" type="${type}" value="${state.search[id]}" />
    </label>
  `;
}

function select(id, labelText, options, className = "") {
  return `
    <label class="${className}">
      ${labelText}
      <select id="${id}">
        ${options.map((option) => `<option ${state.search[id] === option ? "selected" : ""}>${option}</option>`).join("")}
      </select>
    </label>
  `;
}

function dealsView() {
  return `
    <section class="content-grid">
      <div>
        <h2 class="section-title">Meilleures offres de vols</h2>
        <div class="stack">${state.data.deals.map(flightCard).join("")}</div>
      </div>
      <div>
        <h2 class="section-title">Suggestions d'hôtels et de séjours</h2>
        <div class="stack">${state.data.stays.map(stayCard).join("")}</div>
      </div>
      <div>
        <h2 class="section-title">Trajets à l'arrivée</h2>
        <div class="stack">${state.data.rides.map(rideCard).join("")}</div>
      </div>
      <div>
        <h2 class="section-title">Forfaits complets</h2>
        <div class="stack">${state.data.inventory.packages.map(packageCard).join("")}</div>
      </div>
    </section>
  `;
}

function flightCard(deal) {
  return `
    <article class="result-card">
      <div class="result-head">
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
      <p class="small">${deal.recommendation}</p>
    </article>
  `;
}

function stayCard(stay) {
  return `
    <article class="media-card">
      <div class="media-image" style="background-image: url('${stay.image}')"></div>
      <div class="media-body">
        <div class="result-head">
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
      </div>
    </article>
  `;
}

function rideCard(ride) {
  return `
    <article class="result-card">
      <div class="result-head">
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
    </article>
  `;
}

function packageCard(pkg) {
  return `
    <article class="result-card">
      <div class="result-head">
        <div>
          <h3>${pkg.name}</h3>
          <span>${pkg.includes.join(" - ")}</span>
        </div>
        <div class="price">${money(pkg.price)}</div>
      </div>
      <div class="tag-row">
        <span class="tag best">${money(pkg.aiSavings)} d'économies estimées</span>
        <span class="tag">Assistance experte disponible</span>
      </div>
    </article>
  `;
}

function sidebar() {
  const m = state.data.adminMetrics;
  return `
    <aside class="sidebar">
      <div class="surface surface-pad">
        <h2 class="section-title">Fiabilité du voyage</h2>
        <div class="metric-grid">
          ${metric("Économies moyennes", `${m.averageSavings}%`)}
          ${metric("Paiements réussis", `${m.paymentSuccess}%`)}
          ${metric("SMS délivrés", `${m.smsDelivery}%`)}
          ${metric("CSAT", `${m.customerSatisfaction}/5`)}
        </div>
      </div>
      <div class="surface surface-pad">
        <h2 class="section-title">Alertes en direct</h2>
        <div class="stack">
          ${state.data.alerts.slice(0, 3).map((alert) => `<div class="alert-card"><strong>${alert.type} - ${alert.priority}</strong><p class="small">${alert.message}</p></div>`).join("")}
        </div>
      </div>
    </aside>
  `;
}

function alertsView() {
  return `
    <section class="workspace">
      <div class="surface surface-pad">
        <h2 class="section-title">Alertes de voyage</h2>
        <div class="stack">
          ${state.data.alerts.map((alert) => `<article class="alert-card"><strong>${alert.type} - ${alert.priority}</strong><p class="small">${alert.message}</p><span class="small">${alert.channel}</span></article>`).join("")}
        </div>
      </div>
      ${sidebar()}
    </section>
  `;
}

function agentsView() {
  const agents = state.data.operationsAgents || [];
  return `
    <section class="workspace agents-workspace">
      <div>
        <div class="surface surface-pad">
          <div class="section-head">
            <div>
              <h2 class="section-title">Centre de contrôle des agents IA</h2>
              <p class="small">Chaque agent gère un périmètre du site et de l'application avec des limites d'autonomie définies.</p>
            </div>
            <button class="primary compact-btn" id="runAllAgents">Lancer le cycle</button>
          </div>
          <div class="agent-grid">
            ${agents.map(agentCard).join("")}
          </div>
        </div>
        <div class="surface surface-pad agent-run-panel" id="agentRunPanel">
          <h2 class="section-title">Dernier rapport autonome</h2>
          <p class="small">Lance un agent ou le cycle complet pour générer le rapport opérationnel.</p>
        </div>
      </div>
      <aside class="sidebar">
        <div class="surface surface-pad">
          <h2 class="section-title">Niveaux d'autonomie</h2>
          <div class="stack">
            <div class="link-item"><span>Niveau 1</span><strong>Observe</strong></div>
            <div class="link-item"><span>Niveau 2</span><strong>Propose</strong></div>
            <div class="link-item"><span>Niveau 3</span><strong>Exécute</strong></div>
          </div>
        </div>
        <div class="surface surface-pad">
          <h2 class="section-title">Règles de sécurité</h2>
          <div class="stack">
            <div class="alert-card"><strong>Validation humaine</strong><p class="small">Les prix, les remboursements, les paiements, les données personnelles et les incidents de sécurité restent contrôlés.</p></div>
            <div class="alert-card"><strong>Journalisation</strong><p class="small">Chaque cycle produit un rapport, une prochaine action et une condition d'escalade.</p></div>
          </div>
        </div>
      </aside>
    </section>
  `;
}

function agentCard(agent) {
  return `
    <article class="agent-card">
      <div class="agent-topline">
        <div>
          <h3>${agent.name}</h3>
          <span>${agent.role}</span>
        </div>
        <span class="agent-status">${agent.status}</span>
      </div>
      <p>${agent.mission}</p>
      <div class="tag-row">
        <span class="tag best">Niveau ${agent.autonomyLevel}</span>
        <span class="tag">${agent.cadence}</span>
        ${agent.scope.slice(0, 2).map((item) => `<span class="tag">${item}</span>`).join("")}
      </div>
      <div class="agent-columns">
        <div>
          <strong>Permissions</strong>
          ${agent.permissions.map((item) => `<span>${item}</span>`).join("")}
        </div>
        <div>
          <strong>Garde-fous</strong>
          ${agent.guardrails.map((item) => `<span>${item}</span>`).join("")}
        </div>
      </div>
      <div class="agent-action">
        <span class="small">${agent.nextAction}</span>
        <button class="secondary compact-btn" data-run-agent="${agent.id}">Exécuter</button>
      </div>
    </article>
  `;
}

function renderAgentRuns(runs) {
  return `
    <h2 class="section-title">Dernier rapport autonome</h2>
    <div class="stack">
      ${runs.map((run) => {
        const agent = state.data.operationsAgents.find((item) => item.id === run.agentId);
        return `
          <article class="alert-card">
            <strong>${agent?.name || run.agentId} - ${run.status}</strong>
            <p class="small">${run.summary}</p>
            <span class="small">Action suivante : ${run.nextAction}</span>
            <span class="small">Escalade : ${run.escalation}</span>
          </article>
        `;
      }).join("")}
    </div>
  `;
}

function adminView() {
  const m = state.data.adminMetrics;
  const providers = state.data.providerStatus;
  return `
    <section class="workspace">
      <div class="surface surface-pad">
        <h2 class="section-title">Tableau de bord administrateur</h2>
        <div class="metric-grid">
          ${metric("Automatisation courante", pct(m.automationRate))}
          ${metric("Escalade vers un expert", pct(m.humanEscalationRate))}
          ${metric("Réservations", m.monthlyBookings)}
          ${metric("Santé fournisseurs", `${m.supplierHealth}%`)}
          ${metric("Paiements réussis", `${m.paymentSuccess}%`)}
          ${metric("SMS délivrés", `${m.smsDelivery}%`)}
        </div>
      </div>
      <aside class="sidebar">
        <div class="surface surface-pad">
          <h2 class="section-title">Adaptateurs fournisseurs</h2>
          <div class="stack">
            ${Object.entries(providers).map(([key, value]) => `<div class="link-item"><span>${key}: ${value.primary}</span><strong>${modeLabel(value.mode)}</strong></div>`).join("")}
          </div>
        </div>
        <div class="surface surface-pad">
          <h2 class="section-title">Liens du projet</h2>
          <div class="stack">
            <a class="link-item" href="/" target="_blank" rel="noreferrer"><span>Application mobile</span><strong>Ouvrir</strong></a>
            <a class="link-item" href="/web.html" target="_blank" rel="noreferrer"><span>Version web</span><strong>Ouvrir</strong></a>
          </div>
        </div>
      </aside>
    </section>
  `;
}

function metric(labelText, value) {
  return `<div class="metric-card"><strong>${value}</strong><span class="small">${labelText}</span></div>`;
}

function readSearchForm() {
  for (const key of Object.keys(state.search)) {
    const field = document.querySelector(`#${key}`);
    if (field) state.search[key] = field.value;
  }
}

function bind() {
  document.querySelectorAll("[data-view]").forEach((button) => {
    button.addEventListener("click", () => {
      state.view = button.dataset.view;
      render();
    });
  });

  document.querySelector("[data-scroll-auth]")?.addEventListener("click", () => {
    document.querySelector("#authPanel")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  document.querySelector("[data-scroll-search]")?.addEventListener("click", () => {
    document.querySelector("#searchPanel")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  document.querySelector("#authBtn")?.addEventListener("click", async () => {
    const contact = document.querySelector("#authEmail").value;
    try {
      const result = await api("/api/auth", { method: "POST", body: { contact } });
      state.data.user = result.user;
      document.querySelector("#authStatus").textContent = result.message;
    } catch {
      document.querySelector("#authStatus").textContent = "Veuillez saisir une adresse e-mail valide.";
    }
  });

  document.querySelector("#searchBtn")?.addEventListener("click", async () => {
    readSearchForm();
    const result = await api("/api/search", { method: "POST", body: state.search });
    state.data.deals = result.flights;
    state.data.stays = result.stays;
    state.data.rides = result.rides;
    state.view = "deals";
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
  app.innerHTML = `<section class="web-shell"><div class="web-main">${error.message}</div></section>`;
});
