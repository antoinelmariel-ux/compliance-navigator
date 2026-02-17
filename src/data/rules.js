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
            "value": "Présence de champs libres dans ma solution"
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
      "dpo"
    ],
    "questions": {
      "dpo": [
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
      "dpo"
    ],
    "questions": {
      "dpo": [
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
      "dpo"
    ],
    "questions": {
      "dpo": [
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
      "dpo"
    ],
    "questions": {
      "dpo": [
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
      "dpo"
    ],
    "questions": {
      "dpo": [
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
            "value": "true"
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
      "dpo"
    ],
    "questions": {
      "dpo": [
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
    "risks": [],
    "teamRoutingRules": []
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
      "dpo"
    ],
    "questions": {
      "dpo": [
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
        "teamId": "dpo",
        "timingConstraint": {
          "enabled": false,
          "startQuestion": "",
          "endQuestion": ""
        }
      }
    ],
    "teamRoutingRules": []
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
      "dpo"
    ],
    "questions": {
      "dpo": [
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
        "teamId": "dpo",
        "timingConstraint": {
          "enabled": false,
          "startQuestion": "",
          "endQuestion": ""
        }
      }
    ],
    "teamRoutingRules": []
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
      "achats"
    ],
    "questions": {
      "achats": [
        {
          "text": "Si le budget envisagé avec l'agence qui vous accompagnera dépasse 5K, contactez les achats pour vous faire accompagner dans le processus de sélection. Pour les montants supérieur à 20K, merci d'utiliser&nbsp;<a href=\"https://apps.powerapps.com/play/e/f54022e7-8f36-43e6-9d8e-d7d4a4cde7bf/a/f79d5a77-e547-463d-ab2e-673040672dad?tenantId=ec5406f0-238e-4d3f-b91c-73e26a5831e9&amp;hint=41f32323-9b10-4eba-81db-9e8b3efc1be4&amp;sourcetime=1758035097208&amp;source=portal\" target=\"_blank\" rel=\"noopener noreferrer\">EasyConsult</a>",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        }
      ]
    },
    "risks": [],
    "teamRoutingRules": []
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
      "communication_externe"
    ],
    "questions": {
      "communication_externe": [
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
    "risks": [],
    "teamRoutingRules": []
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
      "communication_externe"
    ],
    "questions": {
      "communication_externe": [
        {
          "text": "Pour l'utilisation des réseaux sociaux du LFB, merci de suivre&nbsp;<a href=\"https://lfb1.sharepoint.com/sites/lfb-daily-life/fr-FR/toolbox/LFB%20-%20Documents%20Process/Forms/Ordre%20alpha.aspx?id=%2Fsites%2Flfb%2Ddaily%2Dlife%2Ffr%2DFR%2Ftoolbox%2FLFB%20%2D%20Documents%20Process%2FCommunication%20Aff%5FPubliques%2FCO07%5FFR%20Charte%20utilisation%20reseaux%20sociaux%2Epdf&amp;parent=%2Fsites%2Flfb%2Ddaily%2Dlife%2Ffr%2DFR%2Ftoolbox%2FLFB%20%2D%20Documents%20Process%2FCommunication%20Aff%5FPubliques\" target=\"_blank\" rel=\"noopener noreferrer\">notre charte d'utilisation des réseaux sociaux</a>",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        }
      ]
    },
    "risks": [],
    "teamRoutingRules": []
  },
  {
    "id": "rule11_copy2",
    "name": "Site corporate - Com externe",
    "conditions": [
      {
        "type": "question",
        "question": "q14",
        "operator": "equals",
        "value": "Site internet corporate du LFB"
      }
    ],
    "conditionGroups": [
      {
        "logic": "any",
        "conditions": [
          {
            "type": "question",
            "question": "q14",
            "operator": "equals",
            "value": "Site internet corporate du LFB"
          }
        ]
      }
    ],
    "conditionLogic": "any",
    "teams": [
      "communication_externe"
    ],
    "questions": {
      "communication_externe": [
        {
          "text": "Rapprochez vous de la communication externe qui est en charge de la publication sur notre site internet corporate",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        }
      ]
    },
    "risks": [],
    "teamRoutingRules": []
  },
  {
    "id": "rule11_copy2_copy",
    "name": "Site filiale - Com externe",
    "conditions": [
      {
        "type": "question",
        "question": "q14",
        "operator": "equals",
        "value": "Site internet des filiales du LFB"
      }
    ],
    "conditionGroups": [
      {
        "logic": "any",
        "conditions": [
          {
            "type": "question",
            "question": "q14",
            "operator": "equals",
            "value": "Site internet des filiales du LFB"
          }
        ]
      }
    ],
    "conditionLogic": "any",
    "teams": [
      "communication_externe"
    ],
    "questions": {
      "communication_externe": [
        {
          "text": "Rapprochez vous des filiales qui ont la responsabilité de la publication sur leurs sites internet",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        }
      ]
    },
    "risks": [],
    "teamRoutingRules": []
  },
  {
    "id": "rule11_copy",
    "name": "Média - Com externe",
    "conditions": [
      {
        "type": "question",
        "question": "q11",
        "operator": "equals",
        "value": "Images de tiers ou issues de banques d'images"
      }
    ],
    "conditionGroups": [
      {
        "logic": "any",
        "conditions": [
          {
            "type": "question",
            "question": "q11",
            "operator": "equals",
            "value": "Images de tiers ou issues de banques d'images"
          }
        ]
      }
    ],
    "conditionLogic": "any",
    "teams": [
      "communication_externe"
    ],
    "questions": {
      "communication_externe": [
        {
          "text": "Nous vous rappelons que nous disposons d'une banque d'images pouvant être utilisée librement :&nbsp;<a href=\"https://lfb1.sharepoint.com/sites/lfb-daily-life/fr-FR/toolbox/sitepages/Medias-and-Communication-ressources.aspx#Default=%7B%22r%22%3A%5B%7B%22k%22%3Afalse%2C%22m%22%3Anull%2C%22n%22%3A%22RefinableString104%22%2C%22o%22%3A%22or%22%2C%22t%22%3A%5B%22%C7%82%C7%8250617469656e7473%22%5D%7D%5D%7D\" target=\"_blank\" rel=\"noopener noreferrer\">Médiathèque</a>",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        }
      ]
    },
    "risks": [],
    "teamRoutingRules": []
  },
  {
    "id": "rule12",
    "name": "Charte graphique - Com Externe",
    "conditions": [
      {
        "type": "question",
        "question": "ProjectType",
        "operator": "equals",
        "value": "Projet du LFB"
      }
    ],
    "conditionGroups": [
      {
        "logic": "all",
        "conditions": [
          {
            "type": "question",
            "question": "ProjectType",
            "operator": "equals",
            "value": "Projet du LFB"
          }
        ]
      }
    ],
    "conditionLogic": "all",
    "teams": [
      "communication_externe"
    ],
    "questions": {
      "communication_externe": [
        {
          "text": "Pensez à bien respecter et partager aux éventuels prestataires notre chartre graphique et nos logos. Ces éléments sont disponibles ici :&nbsp;<a href=\"https://lfb1.sharepoint.com/sites/lfb-daily-life/fr-FR/toolbox/SitePages/Communication-tools.aspx#environnement-graphique%E2%80%8B%E2%80%8B%E2%80%8B%E2%80%8B\" target=\"_blank\" rel=\"noopener noreferrer\">Charte graphique corporate</a>",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        }
      ]
    },
    "risks": [],
    "teamRoutingRules": []
  },
  {
    "id": "rule12_copy",
    "name": "Sujets sensibles - Com Externe",
    "conditions": [
      {
        "type": "question",
        "question": "q24",
        "operator": "equals",
        "value": "Partager des informations liés à l'historique du LFB avant 1994"
      },
      {
        "type": "question",
        "question": "q24",
        "operator": "equals",
        "value": "Partager des informations sur des sujets sensibles (ex : défaillance industrielle, tension d'approvisionnement, augmentation de capital, ...)"
      }
    ],
    "conditionGroups": [
      {
        "logic": "any",
        "conditions": [
          {
            "type": "question",
            "question": "q24",
            "operator": "equals",
            "value": "Partager des informations liés à l'historique du LFB avant 1994"
          },
          {
            "type": "question",
            "question": "q24",
            "operator": "equals",
            "value": "Partager des informations sur des sujets sensibles (ex : défaillance industrielle, tension d'approvisionnement, augmentation de capital, ...)"
          }
        ]
      }
    ],
    "conditionLogic": "any",
    "teams": [
      "communication_externe"
    ],
    "questions": {
      "communication_externe": [
        {
          "text": "Quel est l'objectif de la communication sur des sujets sensibles concernant le LFB ?",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        },
        {
          "text": "Sur ces communications, partez vous des éléments de communication institutionnels déjà validés ?",
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
        "description": "Sensibilité des sujets",
        "level": "Moyen",
        "mitigation": "Certains sujets concernant le LFB peuvent être à risque en terme de communication : Un mauvais choix de terme peut amener à des interprétations erronées. Une relecture pour validation par la communication externe est donc requise",
        "priority": "A anticiper",
        "teamId": "communication_externe",
        "timingConstraint": {
          "enabled": false,
          "startQuestion": "",
          "endQuestion": ""
        }
      }
    ],
    "teamRoutingRules": []
  },
  {
    "id": "rule13",
    "name": "Nom / Logo - PI",
    "conditions": [
      {
        "type": "question",
        "question": "projectName__extra_checkbox",
        "operator": "equals",
        "value": "true"
      }
    ],
    "conditionGroups": [
      {
        "logic": "all",
        "conditions": [
          {
            "type": "question",
            "question": "projectName__extra_checkbox",
            "operator": "equals",
            "value": "true"
          }
        ]
      }
    ],
    "conditionLogic": "all",
    "teams": [
      "pi"
    ],
    "questions": {
      "pi": [
        {
          "text": "Contactez nous pour étudier la liberté d'exploitation sur le nom et/ou logo préssenti. Sur cette base, nous définirons ensemble la stratégie de protection (dépôt éventuel de marque par exemple)",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        }
      ]
    },
    "risks": [],
    "teamRoutingRules": []
  },
  {
    "id": "rule13_copy",
    "name": "Cession de droit Nom / Logo - PI ",
    "conditions": [
      {
        "type": "question",
        "question": "q21",
        "operator": "equals",
        "value": "Oui"
      }
    ],
    "conditionGroups": [
      {
        "logic": "all",
        "conditions": [
          {
            "type": "question",
            "question": "q21",
            "operator": "equals",
            "value": "Oui"
          }
        ]
      }
    ],
    "conditionLogic": "all",
    "teams": [
      "pi"
    ],
    "questions": {
      "pi": [
        {
          "text": "Pensez à bien faire signer à l'agence - une fois le logo / nom reçu - le contrat suivant : XXXXXXX (version française) ; XXXXX (version anglaise)",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        }
      ]
    },
    "risks": [],
    "teamRoutingRules": []
  },
  {
    "id": "rule13_copy_copy",
    "name": "Visuels créés  - PI",
    "conditions": [
      {
        "type": "question",
        "question": "q11",
        "operator": "equals",
        "value": "Visuels créés spécifiquement pour le projet"
      }
    ],
    "conditionGroups": [
      {
        "logic": "all",
        "conditions": [
          {
            "type": "question",
            "question": "q11",
            "operator": "equals",
            "value": "Visuels créés spécifiquement pour le projet"
          }
        ]
      }
    ],
    "conditionLogic": "all",
    "teams": [
      "pi"
    ],
    "questions": {
      "pi": [
        {
          "text": "Contactez-nous pour établir une étude de liberté d'exploitation des visuels créés pour le projet.&nbsp;<br>Si ce visuel a été créé par une personne externe au LFB, il conviendra de lui faire signer un contrat de cession de droit d'auteur : XXXXXX (version française) ; XXXX (version anglaise)",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        }
      ]
    },
    "risks": [],
    "teamRoutingRules": []
  },
  {
    "id": "rule13_copy_copy_copy",
    "name": "Informations confidentielles  - PI",
    "conditions": [
      {
        "type": "question",
        "question": "q24",
        "operator": "equals",
        "value": "Partager des informations sur nos procédés de fabrication, nos installations ou des éléments techniques"
      }
    ],
    "conditionGroups": [
      {
        "logic": "all",
        "conditions": [
          {
            "type": "question",
            "question": "q24",
            "operator": "equals",
            "value": "Partager des informations sur nos procédés de fabrication, nos installations ou des éléments techniques"
          }
        ]
      }
    ],
    "conditionLogic": "all",
    "teams": [
      "pi"
    ],
    "questions": {
      "pi": [
        {
          "text": "Sur le partage d'informations sur nos procédés de fabrication, installations ou éléments techniques, suivez ces recommandations - du fait du caractère sensible de ces éléments",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        },
        {
          "text": "Si un stagiaire travaille sur le projet, assurez-vous de maintenir la confidentialité des rapport de stage / d'alternance s'il partage des informations sur nos procédés de fabrication, installations ou éléments techniques",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        }
      ]
    },
    "risks": [],
    "teamRoutingRules": []
  },
  {
    "id": "rule13_copy_copy_copy_copy2",
    "name": "Publication  - PI",
    "conditions": [
      {
        "type": "question",
        "question": "q19",
        "operator": "equals",
        "value": "Rédaction d’abstract / de poster / articles scientifiques"
      }
    ],
    "conditionGroups": [
      {
        "logic": "all",
        "conditions": [
          {
            "type": "question",
            "question": "q19",
            "operator": "equals",
            "value": "Rédaction d’abstract / de poster / articles scientifiques"
          }
        ]
      }
    ],
    "conditionLogic": "all",
    "teams": [
      "pi"
    ],
    "questions": {
      "pi": []
    },
    "risks": [
      {
        "description": "CELLCOS",
        "level": "Moyen",
        "mitigation": "Les projets prévoyant des publications nécessitent un passage en CELLCOS",
        "priority": "A anticiper",
        "teamId": "pi",
        "timingConstraint": {
          "enabled": false,
          "startQuestion": "",
          "endQuestion": ""
        }
      }
    ],
    "teamRoutingRules": []
  },
  {
    "id": "rule13_copy_copy_copy_copy",
    "name": "Logo tiers  - PI",
    "conditions": [
      {
        "type": "question",
        "question": "q24",
        "operator": "equals",
        "value": "Partager des informations sur nos procédés de fabrication, nos installations ou des éléments techniques"
      }
    ],
    "conditionGroups": [
      {
        "logic": "all",
        "conditions": [
          {
            "type": "question",
            "question": "q24",
            "operator": "equals",
            "value": "Partager des informations sur nos procédés de fabrication, nos installations ou des éléments techniques"
          }
        ]
      }
    ],
    "conditionLogic": "all",
    "teams": [
      "pi"
    ],
    "questions": {
      "pi": [
        {
          "text": "Pour l'utilisation de logo de tiers, pensez à obtenir leur autorisation écrite. Concernant les associations de patients, voici la liste des associations nous permettant de communiquer sur notre soutien auprès d'elles pour l'année en cours : XXXXX",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        }
      ]
    },
    "risks": [],
    "teamRoutingRules": []
  },
  {
    "id": "rule13_copy_copy_copy_copy_copy_copy2",
    "name": "Banque images - PI",
    "conditions": [
      {
        "type": "question",
        "question": "q11",
        "operator": "equals",
        "value": "Images de tiers ou issues de banques d'images"
      }
    ],
    "conditionGroups": [
      {
        "logic": "all",
        "conditions": [
          {
            "type": "question",
            "question": "q11",
            "operator": "equals",
            "value": "Images de tiers ou issues de banques d'images"
          }
        ]
      }
    ],
    "conditionLogic": "all",
    "teams": [
      "pi"
    ],
    "questions": {
      "pi": [
        {
          "text": "Vérifiez que les images utilisées dans le cadre du projet sont bien libre de droit pour l'utilisation envisagée (contrat et/ou mentions légales). Vous pouvez vous appuyer sur le pôle PI pour cette vérification",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        }
      ]
    },
    "risks": [],
    "teamRoutingRules": []
  },
  {
    "id": "rule13_copy_copy_copy_copy_copy_copy",
    "name": "Extraits publications - PI",
    "conditions": [
      {
        "type": "question",
        "question": "q11",
        "operator": "equals",
        "value": "Extrait de publications ou utilisation d'échelles scientifiques"
      }
    ],
    "conditionGroups": [
      {
        "logic": "all",
        "conditions": [
          {
            "type": "question",
            "question": "q11",
            "operator": "equals",
            "value": "Extrait de publications ou utilisation d'échelles scientifiques"
          }
        ]
      }
    ],
    "conditionLogic": "all",
    "teams": [
      "pi"
    ],
    "questions": {
      "pi": [
        {
          "text": "Si les extraits de publications ont été intégrés tel quel sans modification ni paraphrase, vérifiez si la publication est intégré au périmètre de la licence CFC (Centre Français de Copie) / BioMed et les droits qui sont accordés, en utilisant&nbsp;<a href=\"https://v1.cfcopies.com/biomed/index.html\" target=\"_blank\" rel=\"noopener noreferrer\">ce lien</a><br>",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        },
        {
          "text": "Si l'intégration des extraits de publication se fait avec retravaillant de manière substantielle les textes, schémas ou figure, intégrez la référence de l'article dans le rendu de votre projet",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        }
      ]
    },
    "risks": [],
    "teamRoutingRules": []
  },
  {
    "id": "rule13_copy_copy_copy_copy_copy_copy_copy2",
    "name": "Diffusion publication - PI",
    "conditions": [
      {
        "type": "question",
        "question": "q24",
        "operator": "equals",
        "value": "Joindre et/ou diffuser des exemplaires papiers ou électroniques de publications"
      }
    ],
    "conditionGroups": [
      {
        "logic": "all",
        "conditions": [
          {
            "type": "question",
            "question": "q24",
            "operator": "equals",
            "value": "Joindre et/ou diffuser des exemplaires papiers ou électroniques de publications"
          }
        ]
      }
    ],
    "conditionLogic": "all",
    "teams": [
      "pi"
    ],
    "questions": {
      "pi": [
        {
          "text": "Vérifiez, en fonction d'une diffusion électronique ou physique de la publication partagée, si&nbsp; elle est intégrée au périmètre de la licence CFC (Centre Français de Copie) / BioMed et les droits qui sont accordés, en utilisant&nbsp;<a href=\"https://v1.cfcopies.com/biomed/index.html\" target=\"_blank\" rel=\"noopener noreferrer\">ce lien</a><br>",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        }
      ]
    },
    "risks": [],
    "teamRoutingRules": []
  },
  {
    "id": "rule13_copy_copy_copy_copy_copy_copy_copy",
    "name": "Extrait site - PI",
    "conditions": [
      {
        "type": "question",
        "question": "q11",
        "operator": "equals",
        "value": "Extrait de de sites internet"
      }
    ],
    "conditionGroups": [
      {
        "logic": "all",
        "conditions": [
          {
            "type": "question",
            "question": "q11",
            "operator": "equals",
            "value": "Extrait de de sites internet"
          }
        ]
      }
    ],
    "conditionLogic": "all",
    "teams": [
      "pi"
    ],
    "questions": {
      "pi": [
        {
          "text": "Pour l'extrait du site internet, vérifiez que les mentions légales du dit site autorise la reproduction",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        }
      ]
    },
    "risks": [],
    "teamRoutingRules": []
  },
  {
    "id": "rule13_copy_copy_copy_copy_copy_copy_copy_copy",
    "name": "Nom de domaine Site  - PI",
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
            "question": "q19",
            "operator": "equals",
            "value": "Site internet"
          }
        ]
      }
    ],
    "conditionLogic": "all",
    "teams": [
      "pi"
    ],
    "questions": {
      "pi": [
        {
          "text": "Contactez le pôle PI pour vérifier la disponibilité des noms de domaine s'il s'agit d'un nouveau site internet",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        }
      ]
    },
    "risks": [],
    "teamRoutingRules": []
  },
  {
    "id": "rule14",
    "name": "Généralité - Contrôle pub",
    "conditions": [
      {
        "type": "question",
        "question": "q19",
        "operator": "not_equals",
        "value": "Création / achat / manipulation de base de données"
      }
    ],
    "conditionGroups": [
      {
        "logic": "all",
        "conditions": [
          {
            "type": "question",
            "question": "q19",
            "operator": "not_equals",
            "value": "Création / achat / manipulation de base de données"
          }
        ]
      }
    ],
    "conditionLogic": "all",
    "teams": [
      "controle_pub"
    ],
    "questions": {
      "controle_pub": [
        {
          "text": "Est-ce qu'il y a mention dans le projet d'éléments hors AMM ?",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        },
        {
          "text": "Avez-vous déjà réfléchi aux autres supports qui seraient associé au projet, par exemple dans le cadre de son lancement (brochure, email, ...)",
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
    "id": "rule14_copy",
    "name": "Evenement - Contrôle pub",
    "conditions": [
      {
        "type": "question",
        "question": "q19",
        "operator": "equals",
        "value": "Evenement"
      },
      {
        "type": "question",
        "question": "q19",
        "operator": "equals",
        "value": "Webconférence"
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
            "value": "Evenement"
          },
          {
            "type": "question",
            "question": "q19",
            "operator": "equals",
            "value": "Webconférence"
          }
        ]
      }
    ],
    "conditionLogic": "any",
    "teams": [
      "controle_pub"
    ],
    "questions": {
      "controle_pub": [
        {
          "text": "En quoi consiste l'événement ?",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        },
        {
          "text": "Quel est le programme ?",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        },
        {
          "text": "L'événement sera-t-il disponible en replay ?",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        },
        {
          "text": "Qui pourra participer ?",
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
    "id": "rule14_copy_copy",
    "name": "Evenement tiers - Contrôle pub",
    "conditions": [
      {
        "type": "question",
        "question": "q18_copy",
        "operator": "equals",
        "value": "Parrainage d'événément"
      }
    ],
    "conditionGroups": [
      {
        "logic": "all",
        "conditions": [
          {
            "type": "question",
            "question": "q18_copy",
            "operator": "equals",
            "value": "Parrainage d'événément"
          }
        ]
      }
    ],
    "conditionLogic": "all",
    "teams": [
      "controle_pub"
    ],
    "questions": {
      "controle_pub": [
        {
          "text": "Qui est l'organisateur de l'événement ?",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        },
        {
          "text": "L'événement dispose-t-il d'un comité scientifique ?",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        },
        {
          "text": "Quel est le programme ?",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        },
        {
          "text": "Qui pourra participer ?",
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
    "id": "rule14_copy_copy_copy",
    "name": "Site - Contrôle pub",
    "conditions": [
      {
        "type": "question",
        "question": "q19",
        "operator": "equals",
        "value": "Site internet"
      }
    ],
    "conditionGroups": [
      {
        "logic": "all",
        "conditions": [
          {
            "type": "question",
            "question": "q19",
            "operator": "equals",
            "value": "Site internet"
          }
        ]
      }
    ],
    "conditionLogic": "all",
    "teams": [
      "controle_pub"
    ],
    "questions": {
      "controle_pub": [
        {
          "text": "Pouvez-vous décrire l'arborescence du site ?",
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
    "id": "rule14_copy_copy_copy_copy",
    "name": "Accès digital promo - Contrôle pub",
    "conditions": [],
    "conditionGroups": [
      {
        "logic": "all",
        "conditions": [
          {
            "type": "question",
            "question": "showcaseTheme",
            "operator": "equals",
            "value": "Produit"
          }
        ]
      },
      {
        "logic": "all",
        "conditions": [
          {
            "type": "question",
            "question": "q19",
            "operator": "equals",
            "value": "Site internet"
          }
        ]
      }
    ],
    "conditionLogic": "all",
    "teams": [
      "controle_pub"
    ],
    "questions": {
      "controle_pub": [
        {
          "text": "Comment vous assurez-vous que seuls les professionnels de santé habilités à prescrire puissent accéder aux informations promotionnelles ?",
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
    "id": "rule15",
    "name": "Contrats PS - E&C",
    "conditions": [
      {
        "type": "question",
        "question": "q10",
        "operator": "equals",
        "value": "Association de patients / Patients"
      },
      {
        "type": "question",
        "question": "q10",
        "operator": "equals",
        "value": "Professionnel de santé (hors France) (ou association de PdS / Société savante)"
      },
      {
        "type": "question",
        "question": "q10",
        "operator": "equals",
        "value": "Professionnel de santé français (ou association de PdS / Société savante)"
      },
      {
        "type": "question",
        "question": "q10",
        "operator": "equals",
        "value": "Expert français non professionnels de santé"
      },
      {
        "type": "question",
        "question": "q10",
        "operator": "equals",
        "value": "Etablissements hospitaliers"
      }
    ],
    "conditionGroups": [
      {
        "logic": "any",
        "conditions": [
          {
            "type": "question",
            "question": "q10",
            "operator": "equals",
            "value": "Association de patients / Patients"
          },
          {
            "type": "question",
            "question": "q10",
            "operator": "equals",
            "value": "Professionnel de santé (hors France) (ou association de PdS / Société savante)"
          },
          {
            "type": "question",
            "question": "q10",
            "operator": "equals",
            "value": "Professionnel de santé français (ou association de PdS / Société savante)"
          },
          {
            "type": "question",
            "question": "q10",
            "operator": "equals",
            "value": "Expert français non professionnels de santé"
          },
          {
            "type": "question",
            "question": "q10",
            "operator": "equals",
            "value": "Etablissements hospitaliers"
          }
        ]
      }
    ],
    "conditionLogic": "any",
    "teams": [
      "ethique_compliance"
    ],
    "questions": {
      "ethique_compliance": [
        {
          "text": "Avec qui va-t-on contractualiser ? (statut exact du partenaire)",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        },
        {
          "text": "Une rémunération des partenaires est-elle prévue ? Comment se répartit-elle ? Comment justifiez-vous le montant / nombre d'heures ? Pour connaitre le taux horaire adapté, vous pouvez utiliser FMV Navigator<br>",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        },
        {
          "text": "Quel sera le rôle des personnes avec qui nous collaborons ? Des livrables sont-ils attendus de leur part ?",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        }
      ]
    },
    "risks": [],
    "teamRoutingRules": []
  },
  {
    "id": "rule15_copy",
    "name": "Contrats asso patients avec PS - E&C",
    "conditions": [
      {
        "type": "question",
        "question": "q10",
        "operator": "equals",
        "value": "Association de patients / Patients"
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
            "value": "Association de patients / Patients"
          }
        ]
      }
    ],
    "conditionLogic": "all",
    "teams": [
      "ethique_compliance"
    ],
    "questions": {
      "ethique_compliance": [
        {
          "text": "Y-a-t-il des professionnels de santé dans le board de l'association ?",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        }
      ]
    },
    "risks": [],
    "teamRoutingRules": []
  },
  {
    "id": "rule15_copy_copy2",
    "name": "App - E&C",
    "conditions": [
      {
        "type": "question",
        "question": "q19",
        "operator": "equals",
        "value": "Applications mobiles"
      }
    ],
    "conditionGroups": [
      {
        "logic": "all",
        "conditions": [
          {
            "type": "question",
            "question": "q19",
            "operator": "equals",
            "value": "Applications mobiles"
          }
        ]
      }
    ],
    "conditionLogic": "all",
    "teams": [
      "ethique_compliance"
    ],
    "questions": {
      "ethique_compliance": [
        {
          "text": "Est-ce que le même type d'application est déjà disponible sur l'AppStore ? Si oui, est-elle gratuite ou payante ?",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        }
      ]
    },
    "risks": [],
    "teamRoutingRules": []
  },
  {
    "id": "rule15_copy_copy2_copy",
    "name": "Evénement LFB - E&C",
    "conditions": [
      {
        "type": "question",
        "question": "q19",
        "operator": "equals",
        "value": "Evenement"
      }
    ],
    "conditionGroups": [
      {
        "logic": "all",
        "conditions": [
          {
            "type": "question",
            "question": "q19",
            "operator": "equals",
            "value": "Evenement"
          }
        ]
      }
    ],
    "conditionLogic": "all",
    "teams": [
      "ethique_compliance"
    ],
    "questions": {
      "ethique_compliance": [
        {
          "text": "Quel est le programme de l'événement ?",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        },
        {
          "text": "Où se déroulera l'événement ?",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        },
        {
          "text": "Un repas / café / ... est il prévu ?",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        },
        {
          "text": "Avez-vous prévu de prendre en charge une nuitée ? le transport ?",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        }
      ]
    },
    "risks": [],
    "teamRoutingRules": []
  },
  {
    "id": "rule15_copy_copy",
    "name": "Parrainage / partenariat - E&C",
    "conditions": [
      {
        "type": "question",
        "question": "ProjectType",
        "operator": "equals",
        "value": "Projet d'un tiers soutenu par le LFB"
      }
    ],
    "conditionGroups": [
      {
        "logic": "all",
        "conditions": [
          {
            "type": "question",
            "question": "ProjectType",
            "operator": "equals",
            "value": "Projet d'un tiers soutenu par le LFB"
          }
        ]
      }
    ],
    "conditionLogic": "all",
    "teams": [
      "ethique_compliance"
    ],
    "questions": {
      "ethique_compliance": [
        {
          "text": "Avec qui va-t-on contractualiser dans le cadre du parrainage ? (statut exact du partenaire) Présence de PS dans le board du parrainé ?",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        },
        {
          "text": "Pouvez-vous nous fournir les statuts du parrainé ? Vous pouvez trouver&nbsp;<a href=\"https://www.pappers.fr/\" target=\"_blank\" rel=\"noopener noreferrer\">ce type de document ici</a>",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        },
        {
          "text": "Quel est le montant exact du soutien ? Que vient-il financer ?",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        },
        {
          "text": "Quelles sont les contreparties pour le LFB ? En quoi cela a-t-il de la valeur pour le LFB ?",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        },
        {
          "text": "Y-a-t-il d'autres sponsors ?<br>",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        }
      ]
    },
    "risks": [],
    "teamRoutingRules": []
  },
  {
    "id": "rule15_copy_copy_copy",
    "name": "Parrainage événement - E&C",
    "conditions": [
      {
        "type": "question",
        "question": "ProjectType",
        "operator": "equals",
        "value": "Projet d'un tiers soutenu par le LFB"
      },
      {
        "type": "question",
        "question": "q18_copy",
        "operator": "equals",
        "value": "Parrainage d'événément"
      }
    ],
    "conditionGroups": [
      {
        "logic": "all",
        "conditions": [
          {
            "type": "question",
            "question": "ProjectType",
            "operator": "equals",
            "value": "Projet d'un tiers soutenu par le LFB"
          },
          {
            "type": "question",
            "question": "q18_copy",
            "operator": "equals",
            "value": "Parrainage d'événément"
          }
        ]
      }
    ],
    "conditionLogic": "all",
    "teams": [
      "ethique_compliance"
    ],
    "questions": {
      "ethique_compliance": [
        {
          "text": "Quel est le programme de l'événement ?",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        },
        {
          "text": "Qui sont les participants ?",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        },
        {
          "text": "Y-a-t-il un comité scientifique associé à l'événement ?",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        },
        {
          "text": "Dans quel lieu se déroulera l'événement ?",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        }
      ]
    },
    "risks": [],
    "teamRoutingRules": []
  },
  {
    "id": "rule15_copy_copy_copy_copy",
    "name": "Don - E&C",
    "conditions": [
      {
        "type": "question",
        "question": "ProjectType",
        "operator": "equals",
        "value": "Don / bourse / Appel à projets"
      }
    ],
    "conditionGroups": [
      {
        "logic": "all",
        "conditions": [
          {
            "type": "question",
            "question": "ProjectType",
            "operator": "equals",
            "value": "Don / bourse / Appel à projets"
          }
        ]
      }
    ],
    "conditionLogic": "all",
    "teams": [
      "ethique_compliance"
    ],
    "questions": {
      "ethique_compliance": [
        {
          "text": "Quel est le montant exact du don ?",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        },
        {
          "text": "Qui est le bénéficiaire du don ? Quel est son statut ? Y-a-il des PS dans son board ?",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        },
        {
          "text": "Quel est la rationnel du don pour le LFB ? (intérêt général, scientifique, institutionnel ?)",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        },
        {
          "text": "Qui est à l'origine du contact avec le demandeur du don ?",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        }
      ]
    },
    "risks": [],
    "teamRoutingRules": []
  },
  {
    "id": "rule15_copy_copy_copy_copy_copy",
    "name": "Rémunération PS France - E&C",
    "conditions": [],
    "conditionGroups": [
      {
        "logic": "all",
        "conditions": [
          {
            "type": "question",
            "question": "BUDGET",
            "operator": "gte",
            "value": "2"
          }
        ]
      },
      {
        "logic": "any",
        "conditions": [
          {
            "type": "question",
            "question": "q10",
            "operator": "equals",
            "value": "Professionnel de santé français (ou association de PdS / Société savante)"
          }
        ]
      }
    ],
    "conditionLogic": "all",
    "teams": [
      "ethique_compliance"
    ],
    "questions": {
      "ethique_compliance": [
        {
          "text": "Quel est le statut des Pds ? PH / PUPH ?",
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
        "description": "Demande d'autorisation",
        "level": "Moyen",
        "mitigation": "Si le contrat des professionnels de santé français est supérieur à 2K€, il convient en amont du début de la prestation d'obtenir l'autorisation de l'ordre auquel ils sont rattachés",
        "priority": "A anticiper",
        "teamId": "ethique_compliance",
        "timingConstraint": {
          "enabled": false,
          "startQuestion": "",
          "endQuestion": ""
        }
      }
    ],
    "teamRoutingRules": []
  },
  {
    "id": "rule15_copy_copy_copy_copy_copy_copy",
    "name": "Rémunération Expert non PS France - E&C",
    "conditions": [],
    "conditionGroups": [
      {
        "logic": "all",
        "conditions": [
          {
            "type": "question",
            "question": "BUDGET",
            "operator": "gte",
            "value": "1"
          }
        ]
      },
      {
        "logic": "any",
        "conditions": [
          {
            "type": "question",
            "question": "q10",
            "operator": "equals",
            "value": "Expert français non professionnels de santé"
          }
        ]
      }
    ],
    "conditionLogic": "all",
    "teams": [
      "ethique_compliance"
    ],
    "questions": {
      "ethique_compliance": [
        {
          "text": "<br>",
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
        "description": "Modalités de rémunération particulière",
        "level": "Moyen",
        "mitigation": "Si l'expert français sollicité (travaillant au sein d'un établissement public) n'est ni chercheur ni PdS, il ne pourra être rémunéré que s'il est inscrit à l'URSSAF ou dispose de sa propre société de conseil. A défaut, il ne pourra pas être rémunéré. Nous passerons alors par un contrat à titre gracieux ou avec un versement à son institution de rattachement",
        "priority": "A anticiper",
        "teamId": "ethique_compliance",
        "timingConstraint": {
          "enabled": false,
          "startQuestion": "",
          "endQuestion": ""
        }
      }
    ],
    "teamRoutingRules": []
  },
  {
    "id": "rule15_copy_copy_copy_copy_copy_copy_copy",
    "name": "IA - E&C",
    "conditions": [
      {
        "type": "question",
        "question": "q19",
        "operator": "equals",
        "value": "Bot IA"
      },
      {
        "type": "question",
        "question": "q24",
        "operator": "equals",
        "value": "Utiliser l'IA"
      },
      {
        "type": "question",
        "question": "q11",
        "operator": "equals",
        "value": "Contenu généré via de l'IA"
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
            "value": "Bot IA"
          },
          {
            "type": "question",
            "question": "q24",
            "operator": "equals",
            "value": "Utiliser l'IA"
          },
          {
            "type": "question",
            "question": "q11",
            "operator": "equals",
            "value": "Contenu généré via de l'IA"
          }
        ]
      }
    ],
    "conditionLogic": "any",
    "teams": [
      "ethique_compliance"
    ],
    "questions": {
      "ethique_compliance": [
        {
          "text": "Pouvez-vous préciser comment l'IA est précisément intégrée dans votre projet ?",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        }
      ]
    },
    "risks": [],
    "teamRoutingRules": []
  },
  {
    "id": "rule15_copy_copy_copy_copy_copy_copy_copy_copy2",
    "name": "IA - Juridique France IT",
    "conditions": [
      {
        "type": "question",
        "question": "q19",
        "operator": "equals",
        "value": "Bot IA"
      },
      {
        "type": "question",
        "question": "q24",
        "operator": "equals",
        "value": "Utiliser l'IA"
      },
      {
        "type": "question",
        "question": "q11",
        "operator": "equals",
        "value": "Contenu généré via de l'IA"
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
            "value": "Bot IA"
          },
          {
            "type": "question",
            "question": "q24",
            "operator": "equals",
            "value": "Utiliser l'IA"
          },
          {
            "type": "question",
            "question": "q11",
            "operator": "equals",
            "value": "Contenu généré via de l'IA"
          }
        ]
      }
    ],
    "conditionLogic": "any",
    "teams": [
      "juridique_france"
    ],
    "questions": {
      "ethique_compliance": [
        {
          "text": "Quel type d’IA est utilisé pour le projet : Outil en ligne ? IA installé sur le système d'information du LFB ? Développement sur mesure ?<br>",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        },
        {
          "text": "Quel contenu sera traité par l’IA",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        }
      ]
    },
    "risks": [],
    "teamRoutingRules": []
  },
  {
    "id": "rule15_copy_copy_copy_copy_copy_copy_copy_copy",
    "name": "Génération contenu IA  - E&C",
    "conditions": [
      {
        "type": "question",
        "question": "q24",
        "operator": "equals",
        "value": "Oui, pour générer du contenu pour le projet"
      },
      {
        "type": "question",
        "question": "q11",
        "operator": "equals",
        "value": "Contenu généré via de l'IA"
      }
    ],
    "conditionGroups": [
      {
        "logic": "any",
        "conditions": [
          {
            "type": "question",
            "question": "q24",
            "operator": "equals",
            "value": "Oui, pour générer du contenu pour le projet"
          },
          {
            "type": "question",
            "question": "q11",
            "operator": "equals",
            "value": "Contenu généré via de l'IA"
          }
        ]
      }
    ],
    "conditionLogic": "any",
    "teams": [
      "ethique_compliance"
    ],
    "questions": {
      "ethique_compliance": [
        {
          "text": "Les contenus générés par IA doivent être indiqués comme ayant été générés via de tels outils",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        }
      ]
    },
    "risks": [],
    "teamRoutingRules": []
  },
  {
    "id": "rule15_copy_copy_copy_copy_copy_copy_copy_copy_copy",
    "name": "Risque IA - E&C",
    "conditions": [
      {
        "type": "question",
        "question": "q19",
        "operator": "equals",
        "value": "Bot IA"
      },
      {
        "type": "question",
        "question": "q24",
        "operator": "equals",
        "value": "Oui, le projet permettra aux utilisateurs d'utiliser l'IA"
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
            "value": "Bot IA"
          },
          {
            "type": "question",
            "question": "q24",
            "operator": "equals",
            "value": "Oui, le projet permettra aux utilisateurs d'utiliser l'IA"
          }
        ]
      }
    ],
    "conditionLogic": "any",
    "teams": [
      "ethique_compliance"
    ],
    "questions": {
      "ethique_compliance": [
        {
          "text": "Comment fonctionne votre modèle d'IA ? Sur quoi se base-t-il ? Que permet il ?",
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
        "description": "Outil intégrant de l'IA",
        "level": "Élevé",
        "mitigation": "L'utilisation de l'IA dans un outil doit amener une analyse fine afin de nous assurer de respecter les exigences de l'IA Act",
        "priority": "A particulièrement anticiper",
        "teamId": "ethique_compliance",
        "timingConstraint": {
          "enabled": false,
          "startQuestion": "",
          "endQuestion": ""
        }
      }
    ],
    "teamRoutingRules": []
  },
  {
    "id": "rule16",
    "name": "Contractualisation - Juridique International",
    "conditions": [],
    "conditionGroups": [
      {
        "logic": "any",
        "conditions": [
          {
            "type": "question",
            "question": "q27",
            "operator": "equals",
            "value": "Grande-Bretagne"
          },
          {
            "type": "question",
            "question": "q27",
            "operator": "equals",
            "value": "Benelux"
          },
          {
            "type": "question",
            "question": "q27",
            "operator": "equals",
            "value": "Allemagne"
          },
          {
            "type": "question",
            "question": "q27",
            "operator": "equals",
            "value": "Mexique"
          },
          {
            "type": "question",
            "question": "q27",
            "operator": "equals",
            "value": "Autre"
          }
        ]
      },
      {
        "logic": "all",
        "conditions": [
          {
            "type": "question",
            "question": "q10",
            "operator": "not_equals",
            "value": "Aucune collaboration prévue avec l'externe"
          }
        ]
      }
    ],
    "conditionLogic": "all",
    "teams": [
      "juridique_international"
    ],
    "questions": {
      "juridique_international": [
        {
          "text": "Avec qui contracte-t-on ? Quelle est sa nature (association, société privée, …) ?",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        },
        {
          "text": "Qui contracte ? (HQ ou filiale)",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        },
        {
          "text": "Quelle est la roadmap du projet ? Date de lancement souhaitée ? Pilote ? Date de fin identifiée ?",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        },
        {
          "text": "Quel est le montant du projet ? et comment se répartit il ? y compris dans le temps",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        }
      ]
    },
    "risks": [],
    "teamRoutingRules": []
  },
  {
    "id": "rule16_copy2",
    "name": "Parrainage - Juridique France X International",
    "conditions": [
      {
        "type": "question",
        "question": "ProjectType",
        "operator": "equals",
        "value": "Projet d'un tiers soutenu par le LFB"
      }
    ],
    "conditionGroups": [
      {
        "logic": "all",
        "conditions": [
          {
            "type": "question",
            "question": "ProjectType",
            "operator": "equals",
            "value": "Projet d'un tiers soutenu par le LFB"
          }
        ]
      }
    ],
    "conditionLogic": "all",
    "teams": [
      "juridique_france"
    ],
    "questions": {
      "juridique_international": [
        {
          "text": "Avec qui contracte-t-on ? Quelle est sa nature (association, société privée, …) ?",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        },
        {
          "text": "Qui contracte ? (HQ ou filiale)",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        },
        {
          "text": "A quelle hauteur le LFB contribue au projet ?",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        },
        {
          "text": "Quelles sont les contreparties prévues pour le LFB ?",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        },
        {
          "text": "Y-a-t-il d'autres partenaires qui financent le projet ?",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        }
      ],
      "juridique_france": [
        {
          "text": "Avec qui contracte-t-on ?<br>",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        },
        {
          "text": "Quelle est sa nature (association, société privée, …) ?",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        },
        {
          "text": "Qui contracte ? (HQ ou filiale)",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        },
        {
          "text": "A quelle hauteur le LFB contribue au projet ?",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        },
        {
          "text": "Quelles sont les contreparties prévues pour le LFB ?&nbsp;",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        },
        {
          "text": "Y-a-t-il d'autres partenaires qui financent le projet ?",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        }
      ]
    },
    "risks": [],
    "teamRoutingRules": [
      {
        "id": "route_1771362249252_cg79",
        "targetTeamId": "juridique_international",
        "conditionGroups": [
          {
            "logic": "any",
            "conditions": [
              {
                "type": "question",
                "question": "q27",
                "operator": "equals",
                "value": "Pays liés à des filiales hors France"
              },
              {
                "type": "question",
                "question": "q27",
                "operator": "equals",
                "value": "Autre"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "rule16_copy",
    "name": "DM - Juridique France IT",
    "conditions": [
      {
        "type": "question",
        "question": "q22",
        "operator": "equals",
        "value": "Une application / instrument / outil destiné à être utilisé à des fins médicales (prévention, diagnostic, traitement, suivi de la maladie. "
      }
    ],
    "conditionGroups": [
      {
        "logic": "all",
        "conditions": [
          {
            "type": "question",
            "question": "q22",
            "operator": "equals",
            "value": "Une application / instrument / outil destiné à être utilisé à des fins médicales (prévention, diagnostic, traitement, suivi de la maladie. "
          }
        ]
      }
    ],
    "conditionLogic": "all",
    "teams": [
      "juridique_france"
    ],
    "questions": {
      "juridique_international": [
        {
          "text": "Qui est le partenaire en charge du développement de l'application/ instrument/outil destiné à être utilisé à des fins médicales ?&nbsp;<br>",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        },
        {
          "text": "Quel est notre rôle dans le projet ? promotion ?&nbsp;",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        },
        {
          "text": "Volonté d’acheter l'application/ instrument/outil destiné à être utilisé à des fins médicales ?&nbsp;",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        },
        {
          "text": "Volonté de le proposer dans le cadre d’Appels d’Offre l'application/ instrument/outil destiné à être utilisé à des fins médicales ?&nbsp;",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        }
      ],
      "juridique_france": [
        {
          "text": "Qui est le partenaire (fabricant) en charge du développement du dispositif utilisé à des fins médicales ?",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        },
        {
          "text": "Quel est notre rôle dans le projet ? promotion ?",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        },
        {
          "text": "Avez vous la volonté d'avoir la propriété du dispositif utilisé à des fins médicales ?",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        },
        {
          "text": "Voulez vous proposer ce dispositif dans le cadre d’Appels d’Offre ?",
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
        "description": "Dispositif Médical",
        "level": "Moyen",
        "mitigation": "Si votre application/instrument/outil est qualifié de dispositif médical, de nombreuses obligations s'appliqueront. Il est donc essentiel d'identifier si votre projet tombe dans la qualification de dispositif médical",
        "priority": "A réaliser",
        "teamId": "juridique_france",
        "timingConstraint": {
          "enabled": false,
          "startQuestion": "",
          "endQuestion": ""
        }
      }
    ],
    "teamRoutingRules": []
  },
  {
    "id": "rule16_copy_copy3",
    "name": "PSP - Juridique France X International",
    "conditions": [
      {
        "type": "question",
        "question": "q22",
        "operator": "equals",
        "value": "Un dispositif structuré d’accompagnement du patient ou de son entourage (par ex. aidant) pour l’accompagner notamment dans la compréhension de sa pathologie, l’usage de son traitement (initiation, observance, gestion des effets indésirables, compréhension de la maladie, soutien pratique ou financier)"
      }
    ],
    "conditionGroups": [
      {
        "logic": "any",
        "conditions": [
          {
            "type": "question",
            "question": "q22",
            "operator": "equals",
            "value": "Un dispositif structuré d’accompagnement du patient ou de son entourage (par ex. aidant) pour l’accompagner notamment dans la compréhension de sa pathologie, l’usage de son traitement (initiation, observance, gestion des effets indésirables, compréhension de la maladie, soutien pratique ou financier)"
          }
        ]
      }
    ],
    "conditionLogic": "any",
    "teams": [
      "juridique_france"
    ],
    "questions": {
      "juridique_international": [],
      "juridique_france": [
        {
          "text": "Ce projet est-il adossé à un programme d'éducation thérapeutique ?",
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
        "description": "Programme d'accompagnement patient",
        "level": "Élevé",
        "mitigation": "Les actions d'accompagnement patient et les programmes d'éducation thérapeutique - s'ils sont qualifiés de tels - sont soumis à des règles très précises et contraignantes. Vérifiez avec le juridique la bonne qualification du projet",
        "priority": "A réaliser",
        "teamId": "juridique_france",
        "timingConstraint": {
          "enabled": false,
          "startQuestion": "",
          "endQuestion": ""
        }
      }
    ],
    "teamRoutingRules": [
      {
        "id": "route_1771330027633_euae",
        "targetTeamId": "juridique_international",
        "conditionGroups": [
          {
            "logic": "any",
            "conditions": [
              {
                "type": "question",
                "question": "q27",
                "operator": "equals",
                "value": "Pays liés à des filiales hors France"
              },
              {
                "type": "question",
                "question": "q27",
                "operator": "equals",
                "value": "Autre"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "rule16_copy_copy2",
    "name": "App / Site / Bot - Juridique France X International",
    "conditions": [
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
        "value": "Site internet"
      },
      {
        "type": "question",
        "question": "q19",
        "operator": "equals",
        "value": "Bot IA"
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
            "value": "Applications mobiles"
          },
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
            "value": "Bot IA"
          }
        ]
      }
    ],
    "conditionLogic": "any",
    "teams": [
      "juridique_france"
    ],
    "questions": {
      "juridique_international": [
        {
          "text": "Qui est le partenaire en charge du développement de l'application/ instrument/outil destiné à être utilisé à des fins médicales ?&nbsp;<br>",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        },
        {
          "text": "Quel est notre rôle dans le projet ? promotion ?&nbsp;",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        },
        {
          "text": "Volonté d’acheter l'application/ instrument/outil destiné à être utilisé à des fins médicales ?&nbsp;",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        },
        {
          "text": "Volonté de le proposer dans le cadre d’Appels d’Offre l'application/ instrument/outil destiné à être utilisé à des fins médicales ?&nbsp;",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        }
      ],
      "juridique_france": [
        {
          "text": "Quel est le partenaire en charge de développement du site / app ? Agence de communication our SSII ?<br>",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        },
        {
          "text": "Le site / app serait il hébergé sur les serveurs existants du LFB ?&nbsp;",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        },
        {
          "text": "Quels droits sont les droits souhaités / autonomie du LFB par rapport à l'outil développé ?",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        }
      ]
    },
    "risks": [],
    "teamRoutingRules": [
      {
        "id": "route_1771362458226_y1kl",
        "targetTeamId": "juridique_international",
        "conditionGroups": [
          {
            "logic": "any",
            "conditions": [
              {
                "type": "question",
                "question": "q27",
                "operator": "equals",
                "value": "Pays liés à des filiales hors France"
              },
              {
                "type": "question",
                "question": "q27",
                "operator": "equals",
                "value": "Autre"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "rule16_copy_copy",
    "name": "Etude - Juridique France X International",
    "conditions": [
      {
        "type": "question",
        "question": "q18_copy",
        "operator": "equals",
        "value": "Pour une enquête / étude"
      },
      {
        "type": "question",
        "question": "q19",
        "operator": "equals",
        "value": "Liée aux pratiques médicales"
      },
      {
        "type": "question",
        "question": "q19",
        "operator": "equals",
        "value": "Liée à la vie avec la maladie"
      }
    ],
    "conditionGroups": [
      {
        "logic": "any",
        "conditions": [
          {
            "type": "question",
            "question": "q18_copy",
            "operator": "equals",
            "value": "Pour une enquête / étude"
          },
          {
            "type": "question",
            "question": "q19",
            "operator": "equals",
            "value": "Liée aux pratiques médicales"
          },
          {
            "type": "question",
            "question": "q19",
            "operator": "equals",
            "value": "Liée à la vie avec la maladie"
          }
        ]
      }
    ],
    "conditionLogic": "any",
    "teams": [
      "juridique_france"
    ],
    "questions": {
      "juridique_international": [
        {
          "text": "Qui est le partenaire en charge du développement de l'application/ instrument/outil destiné à être utilisé à des fins médicales ?&nbsp;<br>",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        },
        {
          "text": "Quel est notre rôle dans le projet ? promotion ?&nbsp;",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        },
        {
          "text": "Volonté d’acheter l'application/ instrument/outil destiné à être utilisé à des fins médicales ?&nbsp;",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        },
        {
          "text": "Volonté de le proposer dans le cadre d’Appels d’Offre l'application/ instrument/outil destiné à être utilisé à des fins médicales ?&nbsp;",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        }
      ],
      "juridique_france": [
        {
          "text": "Pouvez-vous nous décrire les modalités de l'étude et ses finalités ?",
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
        "description": "Etudes cliniques",
        "level": "Moyen",
        "mitigation": "Attention, si vous étude est requalifiée d'étude clinique un process spécifique doit être suivi",
        "priority": "A réaliser",
        "teamId": "juridique_france",
        "timingConstraint": {
          "enabled": false,
          "startQuestion": "",
          "endQuestion": ""
        }
      }
    ],
    "teamRoutingRules": [
      {
        "id": "route_1771329196642_yxa1",
        "targetTeamId": "juridique_international",
        "conditionGroups": [
          {
            "logic": "all",
            "conditions": [
              {
                "type": "question",
                "question": "q27",
                "operator": "equals",
                "value": "Pays liés à des filiales hors France"
              },
              {
                "type": "question",
                "question": "q27",
                "operator": "equals",
                "value": "Autre"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "rule16_copy_copy_copy2",
    "name": "Etude NDA - Juridique France X International",
    "conditions": [
      {
        "type": "question",
        "question": "q19",
        "operator": "equals",
        "value": "Enquête / étude de marché"
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
            "value": "Enquête / étude de marché"
          }
        ]
      }
    ],
    "conditionLogic": "any",
    "teams": [
      "juridique_france"
    ],
    "questions": {
      "juridique_international": [
        {
          "text": "Qui est le partenaire en charge du développement de l'application/ instrument/outil destiné à être utilisé à des fins médicales ?&nbsp;<br>",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        },
        {
          "text": "Quel est notre rôle dans le projet ? promotion ?&nbsp;",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        },
        {
          "text": "Volonté d’acheter l'application/ instrument/outil destiné à être utilisé à des fins médicales ?&nbsp;",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        },
        {
          "text": "Volonté de le proposer dans le cadre d’Appels d’Offre l'application/ instrument/outil destiné à être utilisé à des fins médicales ?&nbsp;",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        }
      ],
      "juridique_france": [
        {
          "text": "Si pertinent, avant de partager des informations sensibles avec un tiers en charge d'une de marché, pensez à lui faire signer un NDA (disponible en self service sur Legisway)",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        }
      ]
    },
    "risks": [],
    "teamRoutingRules": [
      {
        "id": "route_1771329196642_yxa1",
        "targetTeamId": "juridique_international",
        "conditionGroups": [
          {
            "logic": "all",
            "conditions": [
              {
                "type": "question",
                "question": "q27",
                "operator": "equals",
                "value": "Pays liés à des filiales hors France"
              },
              {
                "type": "question",
                "question": "q27",
                "operator": "equals",
                "value": "Autre"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "rule16_copy_copy_copy",
    "name": "Don de produits - Juridique France X International",
    "conditions": [
      {
        "type": "question",
        "question": "q18",
        "operator": "equals",
        "value": "Don de produits"
      }
    ],
    "conditionGroups": [
      {
        "logic": "any",
        "conditions": [
          {
            "type": "question",
            "question": "q18",
            "operator": "equals",
            "value": "Don de produits"
          }
        ]
      }
    ],
    "conditionLogic": "any",
    "teams": [
      "juridique_france"
    ],
    "questions": {
      "juridique_international": [
        {
          "text": "Qui est le partenaire en charge du développement de l'application/ instrument/outil destiné à être utilisé à des fins médicales ?&nbsp;<br>",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        },
        {
          "text": "Quel est notre rôle dans le projet ? promotion ?&nbsp;",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        },
        {
          "text": "Volonté d’acheter l'application/ instrument/outil destiné à être utilisé à des fins médicales ?&nbsp;",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        },
        {
          "text": "Volonté de le proposer dans le cadre d’Appels d’Offre l'application/ instrument/outil destiné à être utilisé à des fins médicales ?&nbsp;",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        }
      ],
      "juridique_france": [
        {
          "text": "Qui a réceptionné la demande ? DAP, Médial, Marketing ?<br>",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        },
        {
          "text": "Transmettez le courrier de sollicitation avec l’ensemble des éléments (quel produit (DCI) , quel dosage, quels hôpitaux / pays, si demandé par l’association quelle péremption, quel établissement pour le stockage des produits en attendant leur mise à disposition à un PdS habilité à administrer le produit) ?",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        },
        {
          "text": "Est-ce que l’association est habilitée à solliciter et recevoir un don de produit ?",
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
        "description": "Don de produits",
        "level": "Élevé",
        "mitigation": "Le don de produits est particulièrement encadré : une validation du comité Don de Produits est nécessaire",
        "priority": "A anticiper",
        "teamId": "juridique_france",
        "timingConstraint": {
          "enabled": false,
          "startQuestion": "",
          "endQuestion": ""
        }
      }
    ],
    "teamRoutingRules": [
      {
        "id": "route_1771329403892_64oz",
        "targetTeamId": "juridique_international",
        "conditionGroups": [
          {
            "logic": "any",
            "conditions": [
              {
                "type": "question",
                "question": "q27",
                "operator": "equals",
                "value": "Pays liés à des filiales hors France"
              },
              {
                "type": "question",
                "question": "q27",
                "operator": "equals",
                "value": "Autre"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "rule16_copy_copy_copy_copy",
    "name": "ISS - Juridique France IT",
    "conditions": [
      {
        "type": "question",
        "question": "q18_copy",
        "operator": "equals",
        "value": "Etude interventionnelle (IIS)"
      },
      {
        "type": "question",
        "question": "q18_copy",
        "operator": "equals",
        "value": "Etude non-interventionnelle (NIS)"
      }
    ],
    "conditionGroups": [
      {
        "logic": "any",
        "conditions": [
          {
            "type": "question",
            "question": "q18_copy",
            "operator": "equals",
            "value": "Etude interventionnelle (IIS)"
          },
          {
            "type": "question",
            "question": "q18_copy",
            "operator": "equals",
            "value": "Etude non-interventionnelle (NIS)"
          }
        ]
      }
    ],
    "conditionLogic": "any",
    "teams": [
      "juridique_france"
    ],
    "questions": {
      "juridique_international": [
        {
          "text": "Qui est le partenaire en charge du développement de l'application/ instrument/outil destiné à être utilisé à des fins médicales ?&nbsp;<br>",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        },
        {
          "text": "Quel est notre rôle dans le projet ? promotion ?&nbsp;",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        },
        {
          "text": "Volonté d’acheter l'application/ instrument/outil destiné à être utilisé à des fins médicales ?&nbsp;",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        },
        {
          "text": "Volonté de le proposer dans le cadre d’Appels d’Offre l'application/ instrument/outil destiné à être utilisé à des fins médicales ?&nbsp;",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        }
      ],
      "juridique_france": [
        {
          "text": "De quel type d'étude s'agit-il ? (NI/RNI/In vitro/ Registre) ?&nbsp;",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        },
        {
          "text": "Quel montant ou quantité de produits est demandé ? et sur quel durée ?",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        },
        {
          "text": "Que représente le soutien du LFB vs les autres financeurs ? (en %)",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        },
        {
          "text": "Souhaitez vous accéder aux résultats de l'étude ?",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        },
        {
          "text": "Souhaitez-vous réutiliser les données ? et si oui, pour quoi ?",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        }
      ]
    },
    "risks": [],
    "teamRoutingRules": []
  },
  {
    "id": "rule16_copy_copy_copy_copy_copy",
    "name": "Publication - Juridique France IT ",
    "conditions": [],
    "conditionGroups": [
      {
        "logic": "all",
        "conditions": [
          {
            "type": "question",
            "question": "q19",
            "operator": "equals",
            "value": "Rédaction d’abstract / de poster / articles scientifiques"
          }
        ]
      },
      {
        "logic": "any",
        "conditions": [
          {
            "type": "question",
            "question": "q10",
            "operator": "equals",
            "value": "Professionnel de santé (hors France) (ou association de PdS / Société savante)"
          },
          {
            "type": "question",
            "question": "q10",
            "operator": "equals",
            "value": "Professionnel de santé français (ou association de PdS / Société savante)"
          }
        ]
      }
    ],
    "conditionLogic": "all",
    "teams": [
      "juridique_france"
    ],
    "questions": {
      "juridique_international": [
        {
          "text": "Qui est le partenaire en charge du développement de l'application/ instrument/outil destiné à être utilisé à des fins médicales ?&nbsp;<br>",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        },
        {
          "text": "Quel est notre rôle dans le projet ? promotion ?&nbsp;",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        },
        {
          "text": "Volonté d’acheter l'application/ instrument/outil destiné à être utilisé à des fins médicales ?&nbsp;",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        },
        {
          "text": "Volonté de le proposer dans le cadre d’Appels d’Offre l'application/ instrument/outil destiné à être utilisé à des fins médicales ?&nbsp;",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        }
      ],
      "juridique_france": [
        {
          "text": "Quel est le rôle du / des PS dans le cadre de la rédaction de l'article / abstract / poster ?",
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
        "description": "Indépendance de l'expert",
        "level": "Faible",
        "mitigation": "Si l'article / abstract / poster est rédigé par un Medical Writter, le travail de relecture par le PS devra être réalisé à titre gracieux",
        "priority": "A réaliser",
        "teamId": "juridique_france",
        "timingConstraint": {
          "enabled": false,
          "startQuestion": "",
          "endQuestion": ""
        }
      }
    ],
    "teamRoutingRules": [
      {
        "id": "route_1771363595274_yype",
        "targetTeamId": "juridique_international",
        "conditionGroups": [
          {
            "logic": "all",
            "conditions": [
              {
                "type": "question",
                "question": "q27",
                "operator": "equals",
                "value": "Pays liés à des filiales hors France"
              },
              {
                "type": "question",
                "question": "q27",
                "operator": "equals",
                "value": "Autre"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "rule17",
    "name": "Enquête Etude - PV",
    "conditions": [
      {
        "type": "question",
        "question": "q19",
        "operator": "equals",
        "value": "Liée aux pratiques médicales"
      },
      {
        "type": "question",
        "question": "q19",
        "operator": "equals",
        "value": "Liée à la vie avec la maladie"
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
            "value": "Liée aux pratiques médicales"
          },
          {
            "type": "question",
            "question": "q19",
            "operator": "equals",
            "value": "Liée à la vie avec la maladie"
          }
        ]
      }
    ],
    "conditionLogic": "any",
    "teams": [
      "pharmacovigilance"
    ],
    "questions": {
      "pharmacovigilance": [
        {
          "text": "Comment se déroule l'étude / l'enquête ? Qui sera en charge de la menée ? N'hésitez pas à partager un support de l'agence qui pourrait vous accompagner",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        },
        {
          "text": "Pouvez-vous transmettre la liste des questions qui seront posées dans le cadre de l'étude /enquête ?",
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
        "description": "Formation PV du prestataire éventuel",
        "level": "Faible",
        "mitigation": "Si le prestataire qui réalise l'étude n'a pas été formé à la PV ou a été formé depuis plus d'un an, il doit réaliser une formation avant le début de l'étude / de l'enquête. Merci de transmettre le nom du prestataire et les mails des personnes concernées. Il faut compter 15 jours",
        "priority": "A réaliser",
        "teamId": "pharmacovigilance",
        "timingConstraint": {
          "enabled": false,
          "startQuestion": "",
          "endQuestion": ""
        }
      }
    ],
    "teamRoutingRules": []
  },
  {
    "id": "rule17_copy",
    "name": "PSP  - PV",
    "conditions": [
      {
        "type": "question",
        "question": "q22",
        "operator": "equals",
        "value": "Un dispositif structuré d’accompagnement du patient ou de son entourage (par ex. aidant) pour l’accompagner notamment dans la compréhension de sa pathologie, l’usage de son traitement (initiation, observance, gestion des effets indésirables, compréhension de la maladie, soutien pratique ou financier)"
      }
    ],
    "conditionGroups": [
      {
        "logic": "any",
        "conditions": [
          {
            "type": "question",
            "question": "q22",
            "operator": "equals",
            "value": "Un dispositif structuré d’accompagnement du patient ou de son entourage (par ex. aidant) pour l’accompagner notamment dans la compréhension de sa pathologie, l’usage de son traitement (initiation, observance, gestion des effets indésirables, compréhension de la maladie, soutien pratique ou financier)"
          }
        ]
      }
    ],
    "conditionLogic": "any",
    "teams": [
      "pharmacovigilance"
    ],
    "questions": {
      "pharmacovigilance": []
    },
    "risks": [
      {
        "description": "Formation PV du prestataire éventuel",
        "level": "Moyen",
        "mitigation": "Si le projet est qualité de PSP, le prestataire en charge de programme patient n'a pas été formé à la PV ou a été formé depuis plus d'un an, il doit réaliser une formation avant le début de l'étude / de l'enquête. Merci de transmettre le nom du prestataire et les mails des personnes concernées. Il faut compter 15 jours",
        "priority": "A réaliser",
        "teamId": "pharmacovigilance",
        "timingConstraint": {
          "enabled": false,
          "startQuestion": "",
          "endQuestion": ""
        }
      }
    ],
    "teamRoutingRules": []
  },
  {
    "id": "rule17_copy_copy",
    "name": "Champs libres - PV",
    "conditions": [
      {
        "type": "question",
        "question": "q3",
        "operator": "equals",
        "value": "Présence de champs libres dans ma solution"
      }
    ],
    "conditionGroups": [
      {
        "logic": "any",
        "conditions": [
          {
            "type": "question",
            "question": "q3",
            "operator": "equals",
            "value": "Présence de champs libres dans ma solution"
          }
        ]
      }
    ],
    "conditionLogic": "any",
    "teams": [
      "pharmacovigilance"
    ],
    "questions": {
      "pharmacovigilance": [
        {
          "text": "Pouvez-vous nous préciser les champs libres présents dans le cadre du projet ? Quels sont les intitulés ?",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        }
      ]
    },
    "risks": [],
    "teamRoutingRules": []
  },
  {
    "id": "rule17_copy_copy_copy",
    "name": "ISS avec administration - PV",
    "conditions": [
      {
        "type": "question",
        "question": "q18_copy",
        "operator": "equals",
        "value": "Avec administration de produit"
      }
    ],
    "conditionGroups": [
      {
        "logic": "any",
        "conditions": [
          {
            "type": "question",
            "question": "q18_copy",
            "operator": "equals",
            "value": "Avec administration de produit"
          }
        ]
      }
    ],
    "conditionLogic": "any",
    "teams": [
      "pharmacovigilance"
    ],
    "questions": {
      "pharmacovigilance": [
        {
          "text": "Pouvez-vous nous transmettre le synopsis de l'étude, le nombre de patients prévus et les pays concernées ?",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        }
      ]
    },
    "risks": [],
    "teamRoutingRules": []
  },
  {
    "id": "rule17_copy_copy_copy_copy",
    "name": "NIS - PV",
    "conditions": [
      {
        "type": "question",
        "question": "q18_copy",
        "operator": "equals",
        "value": "Etude non-interventionnelle (NIS)"
      }
    ],
    "conditionGroups": [
      {
        "logic": "any",
        "conditions": [
          {
            "type": "question",
            "question": "q18_copy",
            "operator": "equals",
            "value": "Etude non-interventionnelle (NIS)"
          }
        ]
      }
    ],
    "conditionLogic": "any",
    "teams": [
      "pharmacovigilance"
    ],
    "questions": {
      "pharmacovigilance": [
        {
          "text": "Quel type de données sont utilisées dans le cadre de la NIS ? Données rétrospectives ?",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        }
      ]
    },
    "risks": [],
    "teamRoutingRules": []
  },
  {
    "id": "rule17_copy_copy_copy_copy_copy",
    "name": "IIS sans administration - PV",
    "conditions": [
      {
        "type": "question",
        "question": "q18_copy",
        "operator": "equals",
        "value": "Sans administration de produit"
      }
    ],
    "conditionGroups": [
      {
        "logic": "any",
        "conditions": [
          {
            "type": "question",
            "question": "q18_copy",
            "operator": "equals",
            "value": "Sans administration de produit"
          }
        ]
      }
    ],
    "conditionLogic": "any",
    "teams": [
      "pharmacovigilance"
    ],
    "questions": {
      "pharmacovigilance": [
        {
          "text": "Merci d'utiliser cette clause dans le cadre du contrat ISS : XXXXX",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        }
      ]
    },
    "risks": [],
    "teamRoutingRules": []
  },
  {
    "id": "rule19",
    "name": "Association de patients - AP",
    "conditions": [],
    "conditionGroups": [
      {
        "logic": "any",
        "conditions": [
          {
            "type": "question",
            "question": "q10",
            "operator": "equals",
            "value": "Association de patients / Patients"
          },
          {
            "type": "question",
            "question": "q10_copy",
            "operator": "equals",
            "value": "Association de patients"
          }
        ]
      },
      {
        "logic": "all",
        "conditions": [
          {
            "type": "question",
            "question": "teamLeadTeam",
            "operator": "not_equals",
            "value": "Affaires Publiques"
          }
        ]
      }
    ],
    "conditionLogic": "all",
    "teams": [
      "affaires_publiques"
    ],
    "questions": {
      "affaires_publiques": [
        {
          "text": "Avec quelle association / patients allez-vous collaborer ?",
          "timingConstraint": {
            "enabled": false,
            "startQuestion": "",
            "endQuestion": ""
          }
        }
      ]
    },
    "risks": [],
    "teamRoutingRules": []
  },
  {
    "id": "rule19_copy",
    "name": "Intégration association patients - AP",
    "conditions": [
      {
        "type": "question",
        "question": "targetAudience",
        "operator": "equals",
        "value": "Patients / Association de patients"
      },
      {
        "type": "question",
        "question": "q10",
        "operator": "not_equals",
        "value": "Association de patients / Patients"
      }
    ],
    "conditionGroups": [
      {
        "logic": "all",
        "conditions": [
          {
            "type": "question",
            "question": "targetAudience",
            "operator": "equals",
            "value": "Patients / Association de patients"
          },
          {
            "type": "question",
            "question": "q10",
            "operator": "not_equals",
            "value": "Association de patients / Patients"
          }
        ]
      }
    ],
    "conditionLogic": "all",
    "teams": [
      "affaires_publiques"
    ],
    "questions": {
      "affaires_publiques": []
    },
    "risks": [
      {
        "description": "Intrégration des associations",
        "level": "Faible",
        "mitigation": "Pour tout projet à destination de patients, nous vous incitons fortement à collaborer avec une association afin de vous assurer que votre projet correspond à un besoin réel ",
        "priority": "A réaliser",
        "teamId": "affaires_publiques",
        "timingConstraint": {
          "enabled": false,
          "startQuestion": "",
          "endQuestion": ""
        }
      }
    ],
    "teamRoutingRules": []
  }
];
