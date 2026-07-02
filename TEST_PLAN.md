# 🎯 Plan de test complet — DartsScore

Coche au fur et à mesure. **Attendu** = résultat attendu.
Testez de préférence sur le site en ligne **et** en local (`http://localhost:5173/`).

---

## 0. Préparation des données (via Admin)

- [ ] Se connecter à l'admin (voir §2).
- [ ] Créer **au moins 8 joueurs** (Admin → Players).
- [ ] Créer **2 équipes** (Admin → Teams) avec **≥ 4 joueurs chacune** (nécessaire pour le championnat).

---

## 1. Accueil & navigation

- [ ] L'accueil affiche : **New game**, **🏆 Championship match**, **Admin**.
- [ ] Aucune carte de reprise si aucune partie/rencontre en cours.
- [ ] Rafraîchir la page (F5) : l'app se recharge sans erreur.

---

## 2. Admin — accès & sécurité

- [ ] Cliquer **Admin** → écran de connexion (email + mot de passe).
- [ ] Tenter un mauvais mot de passe → **message d'erreur**, pas d'accès.
- [ ] Se connecter avec les bons identifiants → accès à l'admin.
- [ ] **Attendu** : les onglets **Players · Teams · Statistics · Championship** apparaissent.
- [ ] Ouvrir directement l'URL `#/admin/players` sans être connecté → **écran de login** (page protégée).
- [ ] **Sign out** → retour à l'écran de login.

---

## 3. Admin — Joueurs

- [ ] **Ajouter** un joueur (nom) → apparaît dans la liste.
- [ ] **Modifier** un nom (clic sur le nom, éditer, Entrée) → mis à jour.
- [ ] **Désactiver** un joueur → passe en « inactive » (grisé).
- [ ] **Réactiver** → redevient actif.
- [ ] **Rechercher** un joueur (champ recherche) → la liste filtre.
- [ ] **Trier** par Nom puis par Date (chips) → l'ordre change (▲/▼).
- [ ] **Supprimer** un joueur **sans match** → disparaît.
- [ ] Essayer de supprimer un joueur **ayant joué des matchs** → **bloqué** (désactiver à la place).

---

## 4. Admin — Équipes

- [ ] **Créer** une équipe (nom) → apparaît.
- [ ] **Renommer** une équipe → mis à jour.
- [ ] **Ouvrir** une équipe (Players) → **ajouter/retirer** des joueurs (les chips deviennent rouges).
- [ ] **Attendu** : un même joueur peut appartenir à **plusieurs équipes**.
- [ ] **Rechercher** une équipe → filtre.
- [ ] **Supprimer** une équipe → disparaît (ses joueurs restent dans Players).

---

## 5. Partie normale (X01) — création

- [ ] Accueil → **New game**.
- [ ] Choisir **501** puis **601** (Type de jeu).
- [ ] Choisir **Simple (1v1)** puis **Double (2v2)**.
- [ ] Choisir **Legs to win** (1 à 5).
- [ ] Sélectionner les joueurs (Simple : 2 ; Double : 2 par équipe).
- [ ] **Attendu** : seuls les joueurs **actifs** sont proposés.
- [ ] Départ **Pick manually** → choisir qui commence.
- [ ] Départ **Bull-up** → bouton « Continue — bull-up » → modal « Qui a gagné le bull ? » → choisir.
- [ ] **Attendu** : le starter alterne automatiquement à chaque manche.
- [ ] **Démarrer** → écran de jeu.

---

## 6. Partie normale — saisie & scoring

- [ ] **Décrément dynamique** : taper un score (ex. 20) → le score central passe à (reste − 20) en direct.
- [ ] **Clavier** : ordre **1 en haut, 9 en bas**.
- [ ] **VALIDATE** (ou ✓) : valide le score joué → tour au joueur suivant.
- [ ] **Toucher le score central** : le nombre tapé devient le **score restant** (visite = avant − tapé) et est **enregistré dans l'historique**.
- [ ] **Scores rapides** (26/41/45/59 · 60/81/99/100 · 140/180) : validation immédiate.
- [ ] **Nombre de fléchettes** affiché par joueur (« X darts »).
- [ ] **Erreurs de saisie** (message clair, pas d'enregistrement) :
  - [ ] score **> 180** → « Score must be between 0 and 180 ».
  - [ ] score **> reste** → « Score is higher than what's left ».
  - [ ] laisse **1** → « Cannot leave 1 ».
  - [ ] checkout impossible (ex. rester sur 169) → refusé.
- [ ] **BUST** : visible seulement si reste **≤ 180**, disparaît si > 180. Clic → 0 point, tour suivant, log « BUST ».
- [ ] **En finish** (reste ≤ 170 checkoutable) : les touches **1/2/3 deviennent vertes**.
  - [ ] **Appui long** sur 1/2/3 → termine la manche avec ce nb de fléchettes.
  - [ ] Cases impossibles grisées (ex. 102 → seul 3 possible).
  - [ ] Bouton **Miss** apparaît → 0 point, pas de bust, tour suivant.
- [ ] **Historique** (façon DartConnect) sous le score : par joueur, score / reste / fléchettes.
  - [ ] Cliquer une visite → **modifier** le score → recalcul immédiat.
  - [ ] Cliquer une visite → **supprimer** → recalcul immédiat (les tours se décalent).
- [ ] **↩ Undo** : annule la dernière action.
- [ ] **Abandon manche** (Forfeit leg) → confirmation → la manche va à l'adversaire.
- [ ] **Abandon partie** (Forfeit match) → confirmation → fin immédiate, vainqueur déclaré.

---

## 7. Partie normale — fin de manche / partie

- [ ] Faire un **checkout** (reste = 0) → modal « How many darts? » (cases impossibles grisées).
- [ ] Valider → **manche gagnée**, score des manches incrémenté, nouvelle manche (starter alterné).
- [ ] Gagner le nombre de manches requis → **écran final** : confettis, vainqueur, **tableau de stats comparatif** (moyenne 3D, First 9, 180/140+/100+, busts, meilleure/pire manche…).
- [ ] **New game** → retour au flux.

---

## 8. Sauvegarde auto & reprise (partie normale)

- [ ] Pendant une partie, **rafraîchir** la page → l'accueil propose « **Game in progress** » → **Resume** → la partie reprend au bon état.
- [ ] Marquer quelques visites, **fermer l'onglet**, rouvrir → reprise possible.
- [ ] **Changement d'appareil** : sur un **autre navigateur/appareil connecté à la même base**, la partie en cours apparaît en reprise (données cloud).
- [ ] (Résilience) Couper le réseau, marquer un score, le rétablir → pas de perte (cache local + resync).

---

## 9. Dashboard stats (Admin → Statistics)

Jouer **au moins 2 parties complètes** avant.

- [ ] Le tableau liste les joueurs avec toutes les stats (P, W, Win%, moyenne 3D, First 9/3, CO%, Avg/Best CO, 180/140+/100+/60+, busts, meilleure visite, meilleure manche, total fléchettes).
- [ ] **Trier** en cliquant une colonne (▲/▼).
- [ ] **Filtres** : Saison · Joueur · Simple/Double · 501/601 · Période (Today / 7 days / month / year / **Custom** avec dates).
- [ ] Sélectionner **un joueur** → apparaît « **{joueur} — match history** » : liste de ses matchs (W/L, adversaire, date, score, moyenne).
- [ ] Cliquer un match → **détail complet** : résumé, stats par joueur, **déroulé leg par leg** (score/reste/fléchettes).
- [ ] **Attendu** : les matchs de **championnat n'apparaissent PAS** dans ce dashboard normal.

---

## 10. Championnat — création & composition

Pré-requis : 2 équipes de ≥ 4 joueurs.

- [ ] Accueil → **🏆 Championship match** (demande le login si pas connecté).
- [ ] Choisir **Team A** et **Team B** (différentes, ≥ 4 joueurs).
- [ ] **Continue — Compose first singles**.
- [ ] Écran **Compose the first singles** : 4 simples, un joueur par équipe (valeurs par défaut préremplies, modifiables).
- [ ] **Attendu** : le **score de rencontre** est visible en haut (A x · MATCH n/10 · B y).

---

## 11. Championnat — pré-match (bull + ordre)

- [ ] **Start encounter** → écran **Bull-up** (avant le match 1).
- [ ] Choisir qui a gagné le bull (2 boutons) → **Start match**.
- [ ] **Attendu** : dans le match, le joueur choisi **commence** (« … to throw · Leg 1 · … starts »).
- [ ] (Aux doubles) l'écran Bull-up affiche aussi **Throwing order** avec **↕ Swap** par équipe.
- [ ] **Attendu** : l'ordre choisi est **conservé pour tout le match** (alternance des 2 joueurs dans cet ordre).

---

## 12. Championnat — déroulement automatique

- [ ] Le **match 1 démarre** automatiquement (moteur de scoring normal, embarqué sous le score de rencontre).
- [ ] Terminer le match (jouer OU **Forfeit match**) → **écran de stats du match** (vainqueur, legs, table de stats tous joueurs).
- [ ] Le **score de rencontre se met à jour**.
- [ ] Bouton **▶ Match suivant** → pré-match du match 2 (bull), etc.
- [ ] Après les 4 simples → **Compose the doubles** (2 doubles, par défaut A1/A2 vs B1/B2, A3/A4 vs B3/B4).
- [ ] Après les 2 doubles → **Compose the last singles** (4 simples).
- [ ] **Attendu** : enchaînement **fluide**, aucune création manuelle de match.

---

## 13. Championnat — configurer la rencontre (à tout moment)

- [ ] Cliquer **⚙ Configure** (dans le bandeau de score).
- [ ] Modifier **Legs to win**, **Starts** (équipe qui commence), **Start mode** (Bull/Fixed/Alternate).
- [ ] Modifier les **joueurs** d'un match **non encore lancé**.
- [ ] **Réordonner** des matchs non joués (▲/▼).
- [ ] **Attendu** : les matchs **déjà joués / en cours** sont **verrouillés** (🔒, non modifiables).
- [ ] **Save** → sauvegarde immédiate ; les changements s'appliquent aux matchs suivants.

---

## 14. Championnat — écran final

- [ ] Terminer les **10 matchs** → **écran final** avec confettis.
- [ ] Affiche : **vainqueur**, score final, **stats d'équipe** (moyenne…), **records** (MVP, meilleur checkout, meilleur First 9, plus de 180), **stats individuelles** de chaque joueur.
- [ ] **Finish encounter** → retour à l'accueil.

---

## 15. Championnat — reprise

- [ ] En pleine rencontre (ex. match 3), **rafraîchir** / fermer → l'accueil affiche « **🏆 Championship in progress** » → **Resume**.
- [ ] **Attendu** : reprise **exactement** au bon match/score/phase.
- [ ] Reprise possible depuis un **autre appareil connecté**.

---

## 16. Admin — stats championnat (détail match/leg, forfait)

- [ ] Admin → **Championship** : liste des rencontres (statut Final/Live, score, vainqueur, date).
- [ ] Ouvrir une rencontre → **liste des 10 matchs** (Single/Double #, joueurs, vainqueur, legs, tag **forfeit** si applicable).
- [ ] Cliquer un match → **détail leg par leg** (comme le scoring normal).
- [ ] Cliquer un match **forfait** → détail s'ouvre sans erreur, affiche « **… won (forfeit)** ».
- [ ] **← Encounters** pour revenir.

---

## 17. Responsive

- [ ] **Mobile** (portrait) : historique visible **sous le score**, clavier en bas, rien de tronqué, boutons tactiles.
- [ ] **Tablette** (paysage) : mise en page **2 colonnes** (scores/historique à gauche, clavier à droite).
- [ ] Aucune zone ne nécessite de zoom.

---

## 18. Sécurité / permissions (RLS)

- [ ] **Sans être connecté** (anonyme) : on peut **créer et scorer une partie normale** (X01).
- [ ] **Sans être connecté** : impossible d'accéder à **gérer joueurs/équipes** ou au **dashboard** (login requis).
- [ ] **Sans être connecté** : impossible de créer/scorer un **match de championnat** (login requis).
- [ ] Seul l'**admin** peut **supprimer** des matchs.

---

## 19. Non-régression (rappel)

- [ ] Après avoir touché au championnat : les **parties normales** (simples/doubles, stats, reprise) fonctionnent **toujours** à l'identique.
- [ ] L'admin (joueurs/dashboard) fonctionne toujours.

---

### En cas de bug
Note : l'action faite, le **résultat attendu**, le **résultat obtenu**, l'écran (mobile/tablette), et si possible une capture. Je corrige ensuite.
