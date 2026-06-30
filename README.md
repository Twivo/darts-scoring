# 🎯 DartsScore — Scoring Fléchettes (501 / 601 Double Out)

Application web de scoring de fléchettes, tactile-first, pensée pour la
compétition. Moteur **déterministe basé sur un event log** : tout l'état
(score restant, moyennes, statistiques, manches) est **recalculé** depuis
l'historique des événements. Rien d'autre n'est stocké.

## Stack

React 18 · TypeScript strict · Vite 6 · TailwindCSS 4 · React Router 6 ·
LocalStorage (zéro backend) · Vitest.

## Démarrer

```bash
npm install
npm run dev      # serveur de dev (http://localhost:5173)
npm run build    # build de production (tsc + vite)
npm test         # tests unitaires du moteur
```

> Node.js (LTS) est requis. Il a été installé via winget dans ce projet.
> Un nouveau terminal voit `node`/`npm` automatiquement (ajouté au PATH
> utilisateur). Pour l'aperçu intégré, `scripts/dev.cmd` injecte le PATH.

## Architecture

Règle de dépendance stricte : `domain` ← `store` ← `features`. Le domaine
ne connaît ni React ni le stockage.

```
src/
├── domain/              ⚙️ Cœur pur, testable, sans React
│   ├── types.ts         Types persistés (config, events) + dérivés (state, stats)
│   ├── events.ts        Constructeurs d'événements
│   ├── engine.ts        buildGameState(config, events) → GameState  ← fonction reine
│   ├── stats.ts         Statistiques dérivées
│   ├── presentation.ts  Helpers d'affichage (noms)
│   ├── rules/
│   │   ├── bust.ts      Bust & checkout (Double Out)
│   │   └── turnOrder.ts Ordre de jeu, starter, alternance
│   └── __tests__/       Tests du moteur (Vitest)
│
├── store/               🗄️ State management
│   ├── reducer.ts       Manipule UNIQUEMENT { config, events }
│   ├── GameContext.tsx  Provider : reducer + engine (mémo) + auto-save
│   ├── RosterContext.tsx CRUD joueurs persisté
│   └── persistence.ts   LocalStorage (versionné, anti-corruption)
│
├── features/            🎨 UI par domaine
│   ├── home/            Accueil + détection de reprise
│   ├── players/         CRUD + réorganisation des joueurs
│   ├── setup/           Création de partie (type, mode, équipes, starter)
│   ├── game/            Écran de jeu (header, scoreboard, keypad, historique…)
│   └── stats/           Écran de fin + confettis
│
└── components/ui/       Boutons, Modal, Confirm (promesse)
```

## Principes clés

- **Source de vérité unique** — seuls `{ config, events }` sont persistés.
  `GameState` (score, moyennes, stats, manches, joueur actif) est **toujours
  recalculé** par `buildGameState`.
- **Édition robuste** — l'appartenance d'une visite (quel joueur/équipe) est
  **re-dérivée par position** dans l'ordre de jeu, pas lue depuis l'événement.
  Supprimer/éditer une visite au milieu décale automatiquement tous les tours.
- **Persistance totale** — sauvegarde après chaque action ; reprise au refresh.

## Fonctionnalités

501/601 Double Out · Simple (1v1) & Double (2v2) · choix du starter
(bull/manuel) + alternance · saisie tactile + scores rapides · **BUST** ·
**mode finish rapide** (saisie du reste) · **checkout** avec nombre de
fléchettes · historique **éditable/supprimable** (recalcul immédiat) · undo ·
abandon manche/partie · stats complètes (moy 3D, first 9, checkout %, 180/140+,
busts, meilleure/pire manche, moyenne par manche) · confettis.
