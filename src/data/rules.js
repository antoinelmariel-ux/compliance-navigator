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
        "mitigation": "Validation BPP avant tout déploiement"
      }
    ],
    "priority": "Critique",
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
    "id": "rule2",
    "name": "Projet avec données de santé",
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
    "teams": [
      "privacy",
      "it",
      "quality",
      "legal"
    ],
    "questions": {
      "privacy": [
        "Une DPIA a-t-elle été réalisée ?",
        "Les consentements sont-ils conformes RGPD ?",
        "Il conviendra de mettre à jour le registre des traitements de données",
        "Où sont hébergés les données ? (Europe ?)"
      ],
      "it": [
        "L'hébergement est-il certifié HDS ?",
        "Le chiffrement des données est-il implémenté ?"
      ],
      "quality": [
        "Les processus respectent-ils les GxP applicables ?"
      ],
      "legal": [
        "Les clauses contractuelles incluent-elles les garanties RGPD ?"
      ]
    },
    "risks": [
      {
        "description": "Non-conformité RGPD - Données de santé sensibles",
        "level": "Élevé",
        "mitigation": "Si le traitement de données se fait en dehors d'un référentiel existant, un délai de 6 mois minimum sera nécessaire avant de lancer le projet"
      }
    ],
    "priority": "Critique",
    "conditionLogic": "all",
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
    ]
  }
];
