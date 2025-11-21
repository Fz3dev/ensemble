# Design Update: Gestion des Événements Multi-Dates

## Contexte
L'objectif est de permettre la création d'événements se déroulant sur plusieurs dates non contiguës (ex: 12, 15, 18 janvier) sans utiliser de récurrence complexe.

## Étape A — Propositions de modélisation alternative

### Option 1 : Modèle Relationnel Strict (Parent/Enfant)
On sépare la définition de l'événement de ses occurrences.
- **EventDefinition** : `id`, `title`, `description`, `category`, `householdId`.
- **EventOccurrence** : `id`, `definitionId`, `startTime`, `endTime`.

*   **Avantages** : Normalisation propre. Pas de duplication de données. Modification du titre instantanée pour toutes les dates.
*   **Inconvénients** : "Breaking change" important. Toutes les requêtes existantes (`prisma.event.findMany`) et le frontend (`event.title`) doivent être réécrits pour faire des jointures.

### Option 2 : Modèle "Linked Events" (Clones liés)
On conserve le modèle `Event` actuel comme unité atomique, mais on ajoute un lien entre eux.
- **Event** : conserve tous les champs actuels (`title`, `start`, `end`...).
- **Ajout** : champ `seriesId` (String, indexé) ou relation vers une table `EventSeries`.

*   **Avantages** :
    *   **Non-breaking** : Le code actuel (calendrier, listes) continue de fonctionner tel quel car il lit des `Event`.
    *   **Flexibilité** : On peut exceptionnellement changer l'heure d'une seule date sans casser le modèle.
*   **Inconvénients** : Duplication du titre et de la description sur chaque ligne. L'édition "de la série" demande un `updateMany`.

### Option 3 : Modèle JSON / Array (Postgres only)
- **Event** : Ajout d'un champ `dates: DateTime[]`.
*   **Avantages** : Simple à écrire.
*   **Inconvénients** : Très difficile à requêter efficacement ("quels événements ce jour ?") sans fonctionnalités spécifiques DB. Incompatible avec SQLite (dev actuel).

---

## Choix Recommandé : Option 2 (Linked Events)

Je recommande l'**Option 2** pour respecter la contrainte "sans casser ce que tu as déjà construit".

**Pourquoi ?**
1.  **Continuité** : Le frontend actuel affiche des listes d'`Event`. Avec l'Option 2, une "occurrence" EST un `Event`. Rien à réécrire pour l'affichage.
2.  **Simplicité MVP** : Gérer la duplication de texte est trivial pour un MVP comparé à la refonte de toute l'architecture de lecture.
3.  **Evolution** : On pourra migrer vers l'Option 1 plus tard si le besoin de normalisation devient critique.

### Mise à jour du Schéma Prisma

```prisma
model Event {
  // ... champs existants
  
  // Nouveau champ pour lier les événements multiples
  seriesId    String?   @default(cuid()) // Ou relation vers un modèle EventSeries optionnel
  
  // ...
}
```

Pour faire les choses proprement, je vais introduire un modèle léger `EventSeries` pour grouper ces événements, mais garder `Event` "autonome" pour la lecture.

```prisma
model EventSeries {
  id          String   @id @default(cuid())
  createdAt   DateTime @default(now())
  events      Event[]
}

model Event {
  // ...
  seriesId    String?
  series      EventSeries? @relation(fields: [seriesId], references: [id], onDelete: SetNull)
}
```

## UX Mobile : Sélection Multiple

1.  **Écran Création** : Au lieu d'un seul champ date, un composant "Sélecteur de dates".
2.  **Interaction** :
    *   L'utilisateur tape sur une date -> Sélectionnée.
    *   Tape sur une autre -> Ajoutée à la liste (ex: "12 jan", "15 jan").
    *   Un switch "Horaires identiques ?" (activé par défaut).
3.  **Validation** : Crée N entrées `Event` liées par un même `seriesId`.

## Mise à jour du Plan

1.  **Schema** : Ajouter `EventSeries` et la relation dans `Event`.
2.  **Backend** : Mettre à jour `createEvent` pour accepter un tableau de dates et générer une série.
3.  **Frontend** :
    *   Mettre à jour le formulaire de création (`NewEventPage`) avec un `Calendar` en mode `multiple`.
    *   Adapter l'UI de détail pour proposer "Modifier cet événement" ou "Modifier toute la série".
