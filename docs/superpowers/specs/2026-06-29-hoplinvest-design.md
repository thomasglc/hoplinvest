# HoplInvest — Design Spec
*Date : 2026-06-29*

## Vue d'ensemble

Application mobile-first (PWA) de suivi d'investissements ETF, utilisable également sur desktop. Permet de suivre les achats mensuels d'un ETF (iShares MSCI World Swap PEA UCITS ETF — WPEA.PA), de visualiser l'argent investi et la plus-value latente, et d'importer des relevés Boursobank au format CSV.

---

## Stack technique

| Élément | Choix |
|---|---|
| Framework | Vue 3 + Vite + TypeScript |
| Style | Tailwind CSS |
| State | Pinia + `pinia-plugin-persistedstate` |
| Graphiques | ApexCharts |
| PWA | `vite-plugin-pwa` |
| Prix ETF | Yahoo Finance API (ticker `WPEA.PA`) |
| Stockage | `localStorage` (migration Directus prévue) |

---

## Design visuel

- **Thème :** Dark glassmorphism — fond dégradé `#0f0c29 → #302b63 → #24243e`, cartes translucides avec `backdrop-filter: blur`
- **Couleur primaire :** `#7c3aed` (violet)
- **Couleur succès / plus-value :** `#10b981` (vert émeraude)
- **Couleur erreur / mois manqué :** `#ef4444` (rouge)
- **Navigation :** Bottom tabs fixe — 4 onglets : Dashboard · Mois · Ajouter · Config

---

## Pages & fonctionnalités

### Dashboard (`/`)
- Badge prix ETF temps réel (WPEA.PA, cache 15 min) en haut à droite
- Carte principale : valeur totale du portefeuille (`totalShares × prixActuel`), plus-value en € et en %
- 2 cartes secondaires : montant total investi / nombre total de parts
- Graphique aires empilées (ApexCharts) :
  - Axe X = mois chronologiques
  - Zone violette = montant investi cumulé
  - Zone verte = plus-value latente (par-dessus)
- Alerte si le mois en cours n'a pas encore de transaction

### Vue Mois (`/mois`)
- Sélecteur d'année en haut (`< 2025 | 2026 >`)
- Grille 4×3 des 12 mois — chaque case affiche :
  - Nom du mois abrégé
  - Montant total investi ce mois (ou `—`)
  - Indicateur couleur : vert (investi ✓) · orange (mois courant sans transaction encore) · rouge (mois passé sans investissement ✗) · gris (mois futur)
- Tap sur une case → panneau détail en bas :
  - Liste des transactions du mois (date, quantité, prix d'exécution, montant net)
  - Total du mois et courtage total prélevé

### Formulaire Ajout (`/ajouter`)
- Champs : Date (datepicker, défaut = aujourd'hui) · Quantité · Prix d'exécution
- Calcul automatique en temps réel :
  - Montant brut = quantité × prix
  - Courtage = montant brut × 0,35% si |montant brut| > 500€, sinon 0
  - Montant net = montant brut − courtage
- Bouton "Enregistrer" → Pinia + localStorage

### Import CSV (`/import`)
- Drag & drop ou sélection de fichier `.csv` (format Boursobank : tabulation comme séparateur)
- Colonnes attendues : `Libellé | Opération | Place | Date | Qté | Prix d'éxé | Montant brut | Courtage/Prélèvement | Montant net | Devise`
- Déduplication : clé composite = `date + quantité + prixExécution` (évite les doubles imports)
- Aperçu avant confirmation : tableau des N transactions détectées + bouton "Importer"

### Config (`/config`)
- Champ : ticker Yahoo Finance (défaut `WPEA.PA`)
- Champ : prix manuel de l'ETF (utilisé si l'API est indisponible)
- Affichage de la dernière mise à jour du prix

---

## Modèle de données

### `Transaction`
```ts
interface Transaction {
  id: string              // UUID
  date: string            // "YYYY-MM-DD"
  label: string           // nom de l'ETF
  quantity: number        // nombre de parts
  executionPrice: number  // prix par part
  grossAmount: number     // montant brut (négatif = achat)
  brokerage: number       // courtage (négatif ou 0)
  netAmount: number       // montant net (négatif = achat)
  currency: string        // "EUR"
  source: "csv" | "manual"
}
```

### Store `investments` (Pinia)
- `transactions: Transaction[]` — triées par date décroissante
- Getters :
  - `totalShares` — somme des quantités
  - `totalInvested` — somme des `|netAmount|`
  - `monthlyGroups` — transactions groupées par `YYYY-MM`
  - `portfolioValue` — `totalShares × currentPrice`
  - `unrealizedGain` — `portfolioValue − totalInvested`

### Store `settings` (Pinia)
```ts
interface Settings {
  ticker: string           // défaut: "WPEA.PA"
  manualPrice: number | null
  lastFetchedPrice: number | null
  lastFetchedAt: string | null  // ISO datetime
}
```

### Règle courtage
```
si |grossAmount| > 500 → brokerage = |grossAmount| × 0.0035
sinon                  → brokerage = 0
netAmount = grossAmount − brokerage
```

### Calcul plus-value (jamais stocké, toujours calculé)
```
portfolioValue  = totalShares × currentPrice
unrealizedGain  = portfolioValue − totalInvested
gainPercent     = (unrealizedGain / totalInvested) × 100
```

---

## Récupération du prix ETF

- Source : Yahoo Finance API (`https://query1.finance.yahoo.com/v8/finance/chart/WPEA.PA`)
- Appel au chargement de l'app + bouton refresh manuel
- Cache localStorage 15 minutes (évite les appels excessifs)
- **CORS :** L'app tente l'appel direct ; si CORS bloque, bascule automatiquement sur le proxy public `https://api.allorigins.win/get?url=<encoded_url>`
- Fallback final : prix saisi manuellement dans Config si API et proxy sont indisponibles
- Note : l'API Yahoo Finance est non-officielle mais stable pour cet usage

---

## Persistance & migration future

- Toutes les données sont stockées dans `localStorage` via `pinia-plugin-persistedstate`
- Architecture Pinia découplée du stockage : migration vers Directus (ou autre backend) = remplacement des actions de persistence uniquement, sans toucher aux composants Vue

---

## Ce qui est hors scope (v1)

- Authentification utilisateur
- Support de plusieurs ETF / portefeuilles
- Notifications / rappels mensuels
- Historique des prix ETF (courbe de performance de l'ETF lui-même)
- Export des données
