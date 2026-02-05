export const initialQuestions = [
  {
    "id": "partnerProspectId",
    "type": "searchable_select",
    "question": "Souhaitez-vous sélectionner un prospect existant ?",
    "options": [
      "Autre"
    ],
    "required": false,
    "conditions": [],
    "conditionLogic": "all",
    "guidance": {
      "objective": "Réutiliser les informations déjà collectées lors de la prospection.",
      "details": "Si vous sélectionnez un prospect, les champs suivants seront pré-remplis automatiquement.",
      "tips": [
        "Choisissez un prospect pour gagner du temps.",
        "Laissez ce champ sur « Autre » si vous ne souhaitez pas réutiliser de données existantes."
      ]
    },
    "placeholder": "Rechercher un prospect",
    "conditionGroups": []
  },
  {
    "id": "projectName",
    "type": "text",
    "question": "Quel est le nom de l'entreprise partenaire ?",
    "options": [],
    "required": true,
    "conditions": [
      {
        "question": "partnerProspectId",
        "operator": "equals",
        "value": "Autre"
      }
    ],
    "conditionLogic": "all",
    "guidance": {
      "objective": "Identifier clairement le partenaire pour structurer les échanges dès les premières secondes.",
      "details": "Le nom affiché dans la synthèse sert de repère pour toutes les équipes qui contribuent au dossier.",
      "tips": [
        "Renseignez le nom officiel ou celui utilisé dans vos échanges internes.",
        "Si un acronyme existe, ajoutez-le entre parenthèses pour faciliter le suivi."
      ]
    },
    "showcase": {
      "sections": [
        "hero"
      ],
      "usage": "Titre principal affiché dans la vitrine du projet."
    },
    "conditionGroups": [
      {
        "logic": "all",
        "conditions": [
          {
            "question": "partnerProspectId",
            "operator": "equals",
            "value": "Autre"
          }
        ]
      }
    ]
  },
  {
    "id": "contactName",
    "type": "text",
    "question": "Nom du contact (personne physique)",
    "options": [],
    "required": true,
    "conditions": [],
    "conditionLogic": "all",
    "placeholder": "Prénom Nom",
    "conditionGroups": []
  },
  {
    "id": "email",
    "type": "text",
    "question": "Email",
    "options": [],
    "required": true,
    "conditions": [],
    "conditionLogic": "all",
    "placeholder": "contact@partenaire.com",
    "conditionGroups": []
  },
  {
    "id": "website",
    "type": "url",
    "question": "Site internet",
    "options": [],
    "required": false,
    "conditions": [],
    "conditionLogic": "all",
    "placeholder": "https://...",
    "conditionGroups": []
  },
  {
    "id": "role",
    "type": "text",
    "question": "Rôle",
    "options": [],
    "required": true,
    "conditions": [],
    "conditionLogic": "all",
    "placeholder": "Directeur commercial",
    "conditionGroups": []
  },
  {
    "id": "countries",
    "type": "searchable_select",
    "question": "Pays",
    "options": [
      "Allemagne",
      "Arabie saoudite",
      "Belgique",
      "Brésil",
      "Canada",
      "Espagne",
      "États-Unis",
      "Finlande",
      "France",
      "Italie",
      "Luxembourg",
      "Maroc",
      "Mexique",
      "Norvège",
      "Portugal",
      "Royaume-Uni",
      "Singapour",
      "Suède"
    ],
    "required": true,
    "conditions": [],
    "conditionLogic": "all",
    "placeholder": "Rechercher un pays",
    "conditionGroups": []
  },
  {
    "id": "qertResult",
    "type": "file",
    "question": "Insérer le résultat du QERT",
    "options": [],
    "required": false,
    "conditions": [],
    "conditionLogic": "all",
    "conditionGroups": []
  },
  {
    "id": "antiCorruptionProgram",
    "type": "file",
    "question": "Inserer les éléments du programme anti-corruption",
    "options": [],
    "required": false,
    "conditions": [],
    "conditionLogic": "all",
    "conditionGroups": []
  }
];
