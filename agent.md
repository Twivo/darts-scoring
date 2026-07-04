# Guide agent IA

Ce fichier sert de repere rapide pour les LLM qui travaillent sur GenevaDartsConnect.

## Projet

- Application React 18 + TypeScript + Vite, avec routage en `HashRouter`.
- UI organisee par fonctionnalite dans `src/features`.
- Logique metier pure dans `src/domain`.
- Etat et persistence dans `src/store`.
- Acces donnees via l'abstraction `src/data` avec backend local ou Supabase.
- Textes visibles FR/EN dans `src/store/LangContext.tsx`.

## Commandes utiles

```bash
npm run dev
npx tsc -b
npm run build
npm test
```

Avant de terminer une modification UI ou metier, lancer au minimum :

```bash
npx tsc -b
npm run build
```

Pour une modification de logique darts, championnat ou stats, lancer aussi :

```bash
npm test
```

## Conventions de travail

- Faire des changements minimaux et scopes a la demande.
- Ne pas refactoriser globalement sans demande explicite.
- Ne jamais casser la compatibilite des donnees existantes.
- Verifier `git status --short` avant de modifier, puis avant de repondre.
- Ne pas ecraser ni annuler des changements locaux non lies.
- Ne jamais stocker de token, secret ou identifiant prive dans le code ou la config Git.

## Internationalisation

- Aucun texte visible ne doit etre hardcode dans les composants.
- Ajouter les libelles dans `DICT` de `src/store/LangContext.tsx`.
- Utiliser `useT()` et `t('cle')` dans les composants.
- Verifier que le switch FR/EN ne cree pas de melange de langues dans l'interface.

## Logique match

- Les matchs sont reconstruits depuis `config + events`.
- La logique de score doit rester dans `src/domain`.
- Eviter de dupliquer les regles de darts dans les composants UI.
- Les visites doivent rester modifiables si l'UI le permet, mais ne pas reintroduire une suppression de visite en match sans demande explicite.
- Conserver les formats de `MatchRecord`, `GameEvent`, equipes, saisons et rencontres existants.

## Zones importantes

- Accueil : `src/features/home/HomeScreen.tsx`
- Nouvelle partie d'entrainement : `src/features/setup/SetupScreen.tsx`
- Match en cours : `src/features/game`
- Live : `src/features/live`
- Championnat : `src/features/championship`
- Statistiques/admin : `src/features/admin`
- Composants UI communs : `src/components/ui`

## UX et donnees

- L'application vise surtout les matchs a domicile des Jedis, mais les choix manuels doivent rester possibles.
- Les ecrans doivent rester utilisables sur mobile.
- Les changements de texte, filtres et dialogues ne doivent pas modifier les donnees stockees.
- Pour les listes de joueurs, preferer une recherche instantanee et une selection directe quand la liste devient longue.
