# Risques potentiels de bugs

## 1. Questions de type « number », « url » ou « file » non prises en charge dans le questionnaire
Le back-office permet de créer des questions avec les types `number`, `url` ou `file`, mais l'écran de questionnaire ne rend que les types `date`, `choice`, `multi_choice`, `text` et `long_text`.【F:src/components/BackOffice.jsx†L10-L43】【F:src/components/QuestionnaireScreen.jsx†L272-L368】

**Impact possible :** lorsqu'un administrateur ajoute une question d'un type non géré, l'utilisateur final n'aura aucun champ pour répondre et ne pourra pas valider une question éventuellement obligatoire, bloquant le parcours.

## 2. Risque de collision d'identifiants lors de l'ajout après suppression
L'ajout d'une question, d'une règle ou d'une équipe génère un identifiant basé uniquement sur la longueur actuelle des listes (`q${questions.length + 1}`, `rule${rules.length + 1}`, `team${teams.length + 1}`).【F:src/components/BackOffice.jsx†L220-L304】 Si un élément intermédiaire est supprimé, le prochain ajout réutilise un identifiant déjà présent (ex. suppression de `q3` puis création d'une nouvelle question -> ID `q8` alors qu'elle existe déjà). 

**Impact possible :** les identifiants sont utilisés comme clés pour les réponses, conditions et règles. Une collision peut provoquer l'écrasement d'une question existante, des incohérences de règles ou un affichage incorrect des réponses persistées.

## 3. Priorité d'équipe calculée à partir du premier risque arbitraire
Dans le rapport de synthèse, la fonction `getTeamPriority` recherche un risque associé à une équipe, mais la condition fournie à `Array.prototype.find` n'utilise pas la variable de boucle `risk` : elle retourne simplement la vérité de `analysis.questions?.[teamId]`. Dès qu'une équipe possède des questions, le premier risque de la liste est renvoyé, quel que soit son lien réel avec l'équipe.【F:src/components/SynthesisReport.jsx†L103-L109】

**Impact possible :** l'interface peut afficher une priorité erronée (ex. « Critique ») pour des équipes qui ne sont pas concernées par les risques identifiés, induisant les utilisateurs en erreur sur l'urgence des actions à mener.

## 4. Type `milestone_list` mal identifié dans le back-office
La table de correspondance `QUESTION_TYPE_META` ne déclare pas le type `milestone_list`. Lorsqu'une question vitrine de type jalons est affichée dans le back-office, `getQuestionTypeMeta` retombe sur la définition par défaut « Liste de choix », avec un libellé et une description incohérents avec le véritable comportement du champ.【F:src/components/BackOffice.jsx†L10-L47】

**Impact possible :** les administrateurs risquent de retirer ou modifier ces questions en pensant qu'il s'agit de simples listes déroulantes, ce qui compromet l'expérience vitrine et peut conduire à supprimer des attributs indispensables à la génération de la feuille de route.

## 5. Conditions basées sur les jalons jamais satisfaites
Les réponses `milestone_list` sont persistées comme tableaux d'objets `{ date, description }`. Le constructeur de conditions du back-office capture pourtant des valeurs textuelles pour ces questions, puis l'évaluation (`shouldShowQuestion`) vérifie l'appartenance avec `Array.prototype.includes`, impossible à satisfaire avec des objets et des chaînes mélangés.【F:src/components/QuestionEditor.jsx†L767-L858】【F:src/components/QuestionnaireScreen.jsx†L71-L156】【F:src/utils/questions.js†L30-L109】

**Impact possible :** toute logique conditionnelle ou règle qui dépend de jalons ne se déclenchera jamais, empêchant l'affichage progressif de questions ou l'application de règles métiers fondées sur les délais planifiés.
