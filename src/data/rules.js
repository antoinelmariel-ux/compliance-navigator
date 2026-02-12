export const initialRules = [
  {
    "id": "rule5",
    "name": "Collectes de données - DPO",
    "conditions": [],
    "conditionGroups": [
      {
        "logic": "any",
        "conditions": [
          {
            "type": "question",
            "question": "q3",
            "operator": "not_equals",
            "value": "Présence de champs libre dans ma solution"
          },
          {
            "type": "question",
            "question": "q3",
            "operator": "not_equals",
            "value": "Non"
          },
          {
            "type": "question",
            "question": "q19",
            "operator": "equals",
            "value": "Enquête / étude de marché"
          },
          {
            "type": "question",
            "question": "q19",
            "operator": "equals",
            "value": "Création / achat / manipulation de base de données"
          },
          {
            "type": "question",
            "question": "q23",
            "operator": "equals",
            "value": "Questionnaire de satisfaction"
          }
        ]
      },
      {
        "logic": "any",
        "conditions": [
          {
            "type": "question",
            "question": "ProjectType",
            "operator": "equals",
            "value": "Projet du LFB"
          },
          {
            "type": "question",
            "question": "ProjectType",
            "operator": "equals",
            "value": "Projet co-construit entre le LFB et un partenaire"
          }
        ]
      }
    ],
    "conditionLogic": "all",
    "teams": [
      "procurement"
    ],
    "questions": {
      "procurement": [
        {
          "text": "Quelles sont les personnes dont les données vont être collectées ?",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        },
        {
          "text": "Quelles types de données souhaitez-vous collecter ? et pourquoi ?",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        },
        {
          "text": "Comment allez-vous utiliser les données ?",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        },
        {
          "text": "Où sont hébergées les données ? hors Union Européenne ?",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        }
      ]
    },
    "risks": []
  },
  {
    "id": "rule6",
    "name": "Projet digital - DPO",
    "conditions": [],
    "conditionGroups": [
      {
        "logic": "any",
        "conditions": [
          {
            "type": "question",
            "question": "ProjectType",
            "operator": "equals",
            "value": "Projet du LFB"
          },
          {
            "type": "question",
            "question": "ProjectType",
            "operator": "equals",
            "value": "Projet co-construit entre le LFB et un partenaire"
          }
        ]
      },
      {
        "logic": "any",
        "conditions": [
          {
            "type": "question",
            "question": "q19",
            "operator": "equals",
            "value": "Site internet"
          },
          {
            "type": "question",
            "question": "q19",
            "operator": "equals",
            "value": "Webconférence"
          },
          {
            "type": "question",
            "question": "q19",
            "operator": "equals",
            "value": "Applications mobiles"
          },
          {
            "type": "question",
            "question": "q19",
            "operator": "equals",
            "value": "Bot IA"
          },
          {
            "type": "question",
            "question": "q19",
            "operator": "equals",
            "value": "Elearning"
          }
        ]
      }
    ],
    "conditionLogic": "all",
    "teams": [
      "procurement"
    ],
    "questions": {
      "procurement": [
        {
          "text": "L'accès à l'interface digitale nécessite-t-il une connexion ?",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        }
      ]
    },
    "risks": []
  },
  {
    "id": "rule6_copy",
    "name": "Emailing - DPO",
    "conditions": [],
    "conditionGroups": [
      {
        "logic": "any",
        "conditions": [
          {
            "type": "question",
            "question": "ProjectType",
            "operator": "equals",
            "value": "Projet du LFB"
          },
          {
            "type": "question",
            "question": "ProjectType",
            "operator": "equals",
            "value": "Projet co-construit entre le LFB et un partenaire"
          }
        ]
      },
      {
        "logic": "any",
        "conditions": [
          {
            "type": "question",
            "question": "q19",
            "operator": "equals",
            "value": "Campagne d'emailing"
          },
          {
            "type": "question",
            "question": "q14",
            "operator": "equals",
            "value": "Emailing"
          }
        ]
      }
    ],
    "conditionLogic": "all",
    "teams": [
      "procurement"
    ],
    "questions": {
      "procurement": [
        {
          "text": "Comment avez-vous ou allez-vous obtenir les adresses email pour l'emailing ?",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        },
        {
          "text": "Avez-vous obtenu un opt-in ?",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        }
      ]
    },
    "risks": []
  },
  {
    "id": "rule6_copy_copy",
    "name": "Tracking - DPO",
    "conditions": [],
    "conditionGroups": [
      {
        "logic": "any",
        "conditions": [
          {
            "type": "question",
            "question": "ProjectType",
            "operator": "equals",
            "value": "Projet du LFB"
          },
          {
            "type": "question",
            "question": "ProjectType",
            "operator": "equals",
            "value": "Projet co-construit entre le LFB et un partenaire"
          }
        ]
      },
      {
        "logic": "any",
        "conditions": [
          {
            "type": "question",
            "question": "q23",
            "operator": "equals",
            "value": "Trackers digitaux (nombre d'ouverture, taux de lecture, ...)"
          }
        ]
      }
    ],
    "conditionLogic": "all",
    "teams": [
      "procurement"
    ],
    "questions": {
      "procurement": [
        {
          "text": "Pouvez-vous décrire les KPIs de suivi ?",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        }
      ]
    },
    "risks": []
  },
  {
    "id": "rule6_copy_copy_copy",
    "name": "Présentation cas clinique - DPO",
    "conditions": [],
    "conditionGroups": [
      {
        "logic": "any",
        "conditions": [
          {
            "type": "question",
            "question": "ProjectType",
            "operator": "equals",
            "value": "Projet du LFB"
          },
          {
            "type": "question",
            "question": "ProjectType",
            "operator": "equals",
            "value": "Projet co-construit entre le LFB et un partenaire"
          }
        ]
      },
      {
        "logic": "any",
        "conditions": [
          {
            "type": "question",
            "question": "q19",
            "operator": "equals",
            "value": "Présentation de cas cliniques"
          }
        ]
      }
    ],
    "conditionLogic": "all",
    "teams": [
      "procurement"
    ],
    "questions": {
      "procurement": [
        {
          "text": "Quelles sont les données sur le patient partagées dans le cas clinique ?",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        }
      ]
    },
    "risks": []
  },
  {
    "id": "rule7",
    "name": "Recours prestataire - DPO",
    "conditions": [],
    "conditionGroups": [
      {
        "logic": "all",
        "conditions": [
          {
            "type": "question",
            "question": "q10",
            "operator": "equals",
            "value": "Agence"
          }
        ]
      },
      {
        "logic": "all",
        "conditions": [
          {
            "type": "question",
            "question": "q23__extra_checkbox",
            "operator": "equals",
            "value": ""
          },
          {
            "type": "question",
            "question": "q3",
            "operator": "not_equals",
            "value": "Non"
          }
        ]
      }
    ],
    "conditionLogic": "all",
    "teams": [
      "procurement"
    ],
    "questions": {
      "procurement": [
        {
          "text": "Le prestataire va-t-il avoir accès / utiliser / collecter des données personnelles ? (y compris en transmettant des rapports, des KPIs, ...)",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        },
        {
          "text": "Où est situé le prestataire ? UE ou reste du monde ?",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        }
      ]
    },
    "risks": []
  },
  {
    "id": "rule8",
    "name": "Données de santé - DPO",
    "conditions": [],
    "conditionGroups": [
      {
        "logic": "any",
        "conditions": [
          {
            "type": "question",
            "question": "ProjectType",
            "operator": "equals",
            "value": "Projet du LFB"
          },
          {
            "type": "question",
            "question": "ProjectType",
            "operator": "equals",
            "value": "Projet co-construit entre le LFB et un partenaire"
          }
        ]
      },
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
      "procurement"
    ],
    "questions": {
      "procurement": [
        {
          "text": "Savez-vous si l'hébergeur des données est habilité à stocker des donnés de santé ?",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        }
      ]
    },
    "risks": [
      {
        "description": "Projet contenant des données de santé",
        "level": "Élevé",
        "mitigation": "Les projets avec des données de santé nécessitent une analyse approfondie des règles applicables selon les pays, des conditions d’hébergement, des transferts internationaux et des exigences de sécurité renforcées et peuvent être impossibles à mettre en œuvre pour des raisons légales ou avec des délais significatifs.",
        "priority": "A particulièrement anticiper",
        "teamId": "procurement",
        "timingConstraint": {
          "enabled": false,
          "startQuestion": "",
          "endQuestion": ""
        }
      }
    ]
  },
  {
    "id": "rule8_copy",
    "name": "Données sensibles - DPO",
    "conditions": [],
    "conditionGroups": [
      {
        "logic": "any",
        "conditions": [
          {
            "type": "question",
            "question": "ProjectType",
            "operator": "equals",
            "value": "Projet du LFB"
          },
          {
            "type": "question",
            "question": "ProjectType",
            "operator": "equals",
            "value": "Projet co-construit entre le LFB et un partenaire"
          }
        ]
      },
      {
        "logic": "all",
        "conditions": [
          {
            "type": "question",
            "question": "q3",
            "operator": "equals",
            "value": "Oui - Autre données sensibles (ex : origine ethnique, orientation sexuelle, ...)"
          }
        ]
      }
    ],
    "conditionLogic": "all",
    "teams": [
      "procurement"
    ],
    "questions": {
      "procurement": [
        {
          "text": "Pourquoi avez-vous besoin de collecter ces données sensibles ? Sont-elles réellement indispensables ?",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        }
      ]
    },
    "risks": [
      {
        "description": "Projet contenant des données sensibles",
        "level": "Élevé",
        "mitigation": "Les projets avec des données sensibles présentent un risque élevé pour les droits et libertés des personnes concernées et nécessitent une analyse approfondie en amont afin d’évaluer leur licéité, leur proportionnalité et les mesures de sécurité adaptées, et peuvent être impossibles à mettre en œuvre pour des raisons légales ou avec des délais significatifs.",
        "priority": "A particulièrement anticiper",
        "teamId": "procurement",
        "timingConstraint": {
          "enabled": false,
          "startQuestion": "",
          "endQuestion": ""
        }
      }
    ]
  },
  {
    "id": "rule9",
    "name": "Prestation de service intellectuelle - Achat",
    "conditions": [],
    "conditionGroups": [
      {
        "logic": "any",
        "conditions": [
          {
            "type": "question",
            "question": "ProjectType",
            "operator": "equals",
            "value": "Projet du LFB"
          },
          {
            "type": "question",
            "question": "ProjectType",
            "operator": "equals",
            "value": "Projet co-construit entre le LFB et un partenaire"
          }
        ]
      },
      {
        "logic": "all",
        "conditions": [
          {
            "type": "question",
            "question": "q10",
            "operator": "equals",
            "value": "Agence"
          }
        ]
      },
      {
        "logic": "all",
        "conditions": [
          {
            "type": "question",
            "question": "BUDGET",
            "operator": "gte",
            "value": "5"
          }
        ]
      }
    ],
    "conditionLogic": "all",
    "teams": [
      "team2"
    ],
    "questions": {
      "team2": [
        {
          "text": "Si le budget envisagé avec l'agence qui vous accompagnera dépasse 5K, contactez les achats pour vous faire accompagner dans le processus de sélection",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        }
      ]
    },
    "risks": []
  },
  {
    "id": "rule10",
    "name": "Communiqué de presse - Com Externe",
    "conditions": [
      {
        "type": "question",
        "question": "q14",
        "operator": "equals",
        "value": "Communiqué de presse"
      }
    ],
    "conditionGroups": [
      {
        "logic": "all",
        "conditions": [
          {
            "type": "question",
            "question": "q14",
            "operator": "equals",
            "value": "Communiqué de presse"
          }
        ]
      }
    ],
    "conditionLogic": "all",
    "teams": [
      "com"
    ],
    "questions": {
      "com": [
        {
          "text": "Pour les communiqués de presse, rapprochez-vous du service Com Externe qui vous accompagnera dans la rédaction",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        }
      ]
    },
    "risks": []
  },
  {
    "id": "rule11",
    "name": "Réseaux sociaux - Com externe",
    "conditions": [
      {
        "type": "question",
        "question": "q19",
        "operator": "equals",
        "value": "Campagne réseaux sociaux"
      },
      {
        "type": "question",
        "question": "q14",
        "operator": "equals",
        "value": "Réseaux sociaux du LFB"
      }
    ],
    "conditionGroups": [
      {
        "logic": "any",
        "conditions": [
          {
            "type": "question",
            "question": "q19",
            "operator": "equals",
            "value": "Campagne réseaux sociaux"
          },
          {
            "type": "question",
            "question": "q14",
            "operator": "equals",
            "value": "Réseaux sociaux du LFB"
          }
        ]
      }
    ],
    "conditionLogic": "any",
    "teams": [
      "com"
    ],
    "questions": {
      "com": [
        {
          "text": "",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        }
      ]
    },
    "risks": []
  }
];
