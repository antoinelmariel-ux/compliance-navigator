export const initialRules = [
  {
    "id": "rule1",
    "name": "Projet externe digital avec professionnels de santé",
    "conditions": [
      {
        "type": "question",
        "question": "targetAudience",
        "operator": "equals",
        "value": "Professionnels de santé"
      },
      {
        "type": "question",
        "question": "q11",
        "operator": "equals",
        "value": "Site internet"
      }
    ],
    "teams": [
      "bpp",
      "it",
      "legal",
      "privacy"
    ],
    "questions": {
      "bpp": [
        "Le contenu a-t-il été validé médicalement ?",
        "Le site internet contient-t-il des mentions de nos produits ? ",
        "Y-a-t-il un contrôle d'accès pour le limiter aux PDS ? "
      ],
      "it": [
        "Où le site sera hébergé ?"
      ],
      "legal": [
        "Il conviendra d'utiliser le modèle de mentions légales disponibles ici : https://google.fr"
      ],
      "privacy": [
        "Pensez bien à ajouter le bandeau cookie"
      ]
    },
    "risks": [
      {
        "description": "Communication non conforme aux bonnes pratiques promotionnelles",
        "level": "Moyen",
        "mitigation": "Validation BPP avant tout déploiement",
        "priority": "Critique",
        "teamId": "bpp"
      }
    ],
    "conditionLogic": "all",
    "conditionGroups": [
      {
        "logic": "all",
        "conditions": [
          {
            "type": "question",
            "question": "targetAudience",
            "operator": "equals",
            "value": "Professionnels de santé"
          },
          {
            "type": "question",
            "question": "q11",
            "operator": "equals",
            "value": "Site internet"
          }
        ]
      }
    ]
  },
  {
    "id": "rule3",
    "name": "Données de santé",
    "conditions": [
      {
        "type": "question",
        "question": "q3",
        "operator": "equals",
        "value": "Oui - Données de santé"
      },
      {
        "type": "timing",
        "startQuestion": "campaignKickoffDate",
        "endQuestion": "launchDate",
        "minimumWeeks": 26,
        "complianceProfiles": []
      }
    ],
    "conditionGroups": [
      {
        "logic": "all",
        "conditions": [
          {
            "type": "question",
            "question": "q3",
            "operator": "equals",
            "value": "Oui - Données de santé"
          },
          {
            "type": "timing",
            "startQuestion": "campaignKickoffDate",
            "endQuestion": "launchDate",
            "minimumWeeks": 26,
            "complianceProfiles": []
          }
        ]
      }
    ],
    "conditionLogic": "all",
    "teams": [
      "privacy"
    ],
    "questions": {},
    "risks": [
      {
        "description": "Déclaration hors délai",
        "level": "Élevé",
        "mitigation": "",
        "priority": "Critique",
        "teamId": "privacy"
      }
    ]
  }
];
