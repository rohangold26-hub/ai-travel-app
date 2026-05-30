# Elephant AI Travel

Hybrid AI-operated travel agency app with up to 90% automation for routine workflows and human oversight for high-risk decisions.

## What Is Built

- Mobile-first PWA frontend compatible with iOS and Android browsers.
- Node backend with API routes for bootstrapping data, consent, travel search, payment intents, alerts, and high-risk routing.
- Local JSON database seed under `database/travel-data.json`.
- Premium dark blue, white, and burgundy visual direction.
- Elephant AI pilot logo at `public/assets/elephant-ai-pilot-logo.png`.
- Admin dashboard for automation, escalation, booking, payment, SMS, customer satisfaction, and supplier health metrics.

## Automation Model

AI owns routine workflows:

- Flight, hotel, stay, package, rideshare, insurance, seat, and payment preference search.
- Personalized deal ranking when the user agrees to data use.
- Travel alerts, flight status messages, check-in reminders, and price drop notifications.
- Drafting support cases and preparing booking actions.

Humans own high-risk decisions:

- Visa/legal judgment.
- Emergency travel disruption.
- Refund disputes.
- Complex customer complaints.
- Supplier negotiation and final business strategy.

## Run Locally

Use the bundled Node runtime if system Node or npm is unavailable:

```powershell
& 'C:\Users\Administrator\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' server.js
```

Then open:

```text
http://localhost:4173
```

## Git Workflow

Use this routine whenever you finish a change:

```powershell
& "C:\Program Files\Git\cmd\git.exe" status
& "C:\Program Files\Git\cmd\git.exe" add .
& "C:\Program Files\Git\cmd\git.exe" commit -m "Describe the change"
& "C:\Program Files\Git\cmd\git.exe" push
```

Useful checks:

```powershell
& "C:\Program Files\Git\cmd\git.exe" status --short
& "C:\Program Files\Git\cmd\git.exe" log --oneline -5
```

If `status --short` shows nothing, the working tree is clean.

## Production Integration Targets

- Flights and seat maps: Amadeus Flight Offers, Seatmap Display, Duffel Offers/Orders, or Sabre Offers/Orders.
- Flight tracking: FlightAware AeroAPI.
- Card payments: Stripe Payment Intents or Revolut Merchant API.
- Mobile money: Flutterwave Mobile Money.
- SMS and WhatsApp: Twilio Programmable Messaging.
- CoteRun database: connect through `DATABASE_URL`, or set `COTERUN_GITHUB_REPO`, `COTERUN_DATABASE_PATH`, and `GITHUB_TOKEN` if the data lives in a private GitHub repository.

## Important Next Step

The current app uses demo data. To connect it to CoteRun, provide the GitHub repository URL, the path to the database/config file in that repository, and access permission if the repository is private.
