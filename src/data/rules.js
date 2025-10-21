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
        "priority": "A particulièrement anticiper",
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
    "id": "rule4",
    "name": "Rémunération PDS",
    "conditions": [
      {
        "type": "question",
        "question": "q10",
        "operator": "equals",
        "value": "Professionnel de santé (via contrat à mettre en place)"
      }
    ],
    "conditionGroups": [
      {
        "logic": "all",
        "conditions": [
          {
            "type": "question",
            "question": "q10",
            "operator": "equals",
            "value": "Professionnel de santé (via contrat à mettre en place)"
          }
        ]
      }
    ],
    "conditionLogic": "all",
    "teams": [
      "Ethics"
    ],
    "questions": {},
    "risks": [
      {
        "description": "Déclaration/Autorisation du contrat avec un PDS",
        "level": "Moyen",
        "mitigation": "Si le contrat avec le PDS est > à 2000€, il convient de soumettre la demande l'autorisation à l'instance ordinale au moins 8 semaines avant le début du contrat. En dessous de 2000€, c'est un régime de déclaration (8 jours ouvrables).",
        "priority": "A particulièrement anticiper",
        "teamId": "Ethics",
        "timingConstraint": {
          "enabled": true,
          "startQuestion": "campaignKickoffDate",
          "endQuestion": "launchDate",
          "minimumWeeks": 10
        }
      }
    ]
  },
  {
    "id": "rule5",
    "name": "Données de santé",
    "conditions": [
      {
        "type": "question",
        "question": "q3",
        "operator": "equals",
        "value": "Oui - Données de santé"
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
        "description": "Contraites spécifiques en cas de données de santé",
        "level": "Élevé",
        "mitigation": "En cas de collecte/traitement de données de santé, des déclarations 6 mois avant le lancement peuvent être requises, sauf à rentrer dans des référentiels déjà définis. Pensez à contacter au plus vite le DPO",
        "priority": "A particulièrement anticiper",
        "teamId": "privacy",
        "timingConstraint": {
          "enabled": true,
          "startQuestion": "campaignKickoffDate",
          "endQuestion": "launchDate",
          "minimumWeeks": 26
        }
      }
    ]
  }
];
