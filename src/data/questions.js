export const initialQuestions = [
  {
    "id": "projectName",
    "type": "text",
    "question": "Quel est le nom du projet ?",
    "options": [],
    "required": true,
    "conditions": [],
    "conditionLogic": "all",
    "guidance": {
      "objective": "Nommer clairement l'initiative pour qu'elle soit mémorisée dès les premières secondes.",
      "details": "Le nom affiché dans la vitrine du projet sert de repère pour toutes les équipes qui contribuent au pitch.",
      "tips": [
        "Renseignez le nom officiel ou celui que vous souhaitez tester auprès des parties prenantes.",
        "Si un nom de code interne existe, ajoutez-le entre parenthèses pour faciliter le suivi."
      ]
    },
    "showcase": {
      "sections": [
        "hero"
      ],
      "usage": "Titre principal affiché dans la vitrine du projet."
    },
    "extraCheckbox": {
      "enabled": true,
      "label": "J'aurais besoin d'un nom / un logo (non encore protégé) pour communiquer à l'externe sur mon projet"
    },
    "otherOption": {
      "enabled": false,
      "label": "Autre",
      "placeholder": ""
    },
    "placeholder": "",
    "numberUnit": "",
    "rankingConfig": {
      "title": "Base de données",
      "criteria": [
        {
          "id": "critere-1",
          "label": "Critère 1"
        },
        {
          "id": "critere-2",
          "label": "Critère 2"
        },
        {
          "id": "critere-3",
          "label": "Critère 3"
        }
      ],
      "entries": []
    },
    "conditionGroups": []
  },
  {
    "id": "teamLead",
    "type": "text",
    "question": "Qui lead ce projet ?",
    "options": [],
    "required": true,
    "conditions": [],
    "conditionLogic": "all",
    "guidance": {
      "objective": "Identifier l'interlocuteur principal pour les échanges compliance",
      "details": "Cette information permet aux équipes expertes de contacter la bonne personne pour clarifier les éléments du dossier.",
      "tips": [
        "Renseignez le prénom et le nom"
      ]
    },
    "showcase": {
      "sections": [
        "team"
      ],
      "usage": "Bloc « Lead du projet » dans la section équipe."
    },
    "placeholder": "",
    "conditionGroups": [],
    "extraCheckbox": {
      "enabled": false,
      "label": ""
    },
    "otherOption": {
      "enabled": false,
      "label": "Autre",
      "placeholder": ""
    },
    "numberUnit": "",
    "rankingConfig": {
      "title": "Base de données",
      "criteria": [
        {
          "id": "critere-1",
          "label": "Critère 1"
        },
        {
          "id": "critere-2",
          "label": "Critère 2"
        },
        {
          "id": "critere-3",
          "label": "Critère 3"
        }
      ],
      "entries": []
    }
  },
  {
    "id": "teamLeadTeam",
    "type": "choice",
    "question": "A quelle équipe est-il rattaché ? ",
    "options": [
      {
        "label": "Marketing DOI",
        "visibility": "always",
        "subType": null,
        "subOptions": [],
        "conditionGroups": [],
        "conditions": [],
        "conditionLogic": "all"
      },
      {
        "label": "Médical DOI",
        "visibility": "always",
        "subType": null,
        "subOptions": [],
        "conditionGroups": [],
        "conditions": [],
        "conditionLogic": "all"
      },
      {
        "label": "Marketing DOF",
        "visibility": "always",
        "subType": null,
        "subOptions": [],
        "conditionGroups": [],
        "conditions": [],
        "conditionLogic": "all"
      },
      {
        "label": "Médical DOI",
        "visibility": "always",
        "subType": null,
        "subOptions": [],
        "conditionGroups": [],
        "conditions": [],
        "conditionLogic": "all"
      },
      {
        "label": "Affaires Publiques",
        "visibility": "always",
        "conditionGroups": [],
        "conditions": [],
        "conditionLogic": "all"
      }
    ],
    "required": true,
    "conditions": [],
    "conditionLogic": "all",
    "guidance": {
      "objective": "Préciser le rattachement du lead pour fluidifier les validations.",
      "details": "Cette information s’affiche en complément du lead pour aider les interlocuteurs à identifier le bon canal.",
      "tips": [
        "Sélectionnez l’équipe principale du lead.",
        "Précisez une double appartenance dans vos notes internes si nécessaire."
      ]
    },
    "showcase": {
      "sections": [
        "team"
      ],
      "usage": "Mention du rattachement du lead dans la section équipe."
    },
    "placeholder": "",
    "conditionGroups": [],
    "extraCheckbox": {
      "enabled": false,
      "label": ""
    },
    "otherOption": {
      "enabled": true,
      "label": "Autre",
      "placeholder": "Uniquement si le projet n'est pas rattaché au Médical / Marketing DOF/DOI"
    },
    "numberUnit": "",
    "rankingConfig": {
      "title": "Base de données",
      "criteria": [
        {
          "id": "critere-1",
          "label": "Critère 1"
        },
        {
          "id": "critere-2",
          "label": "Critère 2"
        },
        {
          "id": "critere-3",
          "label": "Critère 3"
        }
      ],
      "entries": []
    }
  },
  {
    "id": "teamCoreMembers",
    "type": "long_text",
    "question": "Quels sont les membres de l'équipe projet ?",
    "options": [],
    "required": false,
    "conditions": [],
    "conditionLogic": "all",
    "guidance": {
      "objective": "Mettre en avant la complémentarité de l’équipe.",
      "details": "Chaque ligne sera affichée comme un membre du “collectif moteur”.",
      "tips": [
        "Mentionnez pour chaque personne le rôle ou l’expertise apportée.",
        "Incluez éventuellement les partenaires ou experts externes essentiels."
      ]
    },
    "showcase": {
      "sections": [
        "team"
      ],
      "usage": "Liste « Collectif moteur » dans la section équipe."
    },
    "placeholder": "Prénom Nom - Poste de la personne\nPrénom Nom - Poste de la personne",
    "conditionGroups": []
  },
  {
    "id": "ProjectType",
    "type": "multi_choice",
    "question": "De quel type de projet s'agit-il ?",
    "options": [
      {
        "label": "Projet du LFB",
        "visibility": "always",
        "subType": null,
        "subOptions": [],
        "conditionGroups": [],
        "conditions": [],
        "conditionLogic": "all"
      },
      {
        "label": "Projet co-construit entre le LFB et un partenaire",
        "visibility": "always",
        "subType": null,
        "subOptions": [],
        "conditionGroups": [],
        "conditions": [],
        "conditionLogic": "all"
      },
      {
        "label": "Projet d'un tiers soutenu par le LFB",
        "visibility": "always",
        "subType": null,
        "subOptions": [],
        "conditionGroups": [],
        "conditions": [],
        "conditionLogic": "all"
      },
      {
        "label": "Don / bourse / Appel à projets",
        "visibility": "always",
        "subType": null,
        "subOptions": [],
        "conditionGroups": [],
        "conditions": [],
        "conditionLogic": "all"
      }
    ],
    "required": true,
    "conditions": [],
    "conditionLogic": "all",
    "conditionGroups": [],
    "placeholder": "",
    "guidance": {
      "objective": "Identifier le type de projet pour connaitre les procédures applicables",
      "details": "En fonction de la catégorie du projet sélectionné, nous vous poserons des questions supplémentaires pour affiner le projet et ainsi vous guider au mieux",
      "tips": [
        "En cas de doute, sélectionner les différentes catégories applicables"
      ]
    },
    "extraCheckbox": {
      "enabled": true,
      "label": "Il s'agit d'un simple renouvellement d'un projet déjà validé"
    },
    "otherOption": {
      "enabled": false,
      "label": "Autre",
      "placeholder": ""
    },
    "numberUnit": "",
    "rankingConfig": {
      "title": "Base de données",
      "criteria": [
        {
          "id": "critere-1",
          "label": "Critère 1"
        },
        {
          "id": "critere-2",
          "label": "Critère 2"
        },
        {
          "id": "critere-3",
          "label": "Critère 3"
        }
      ],
      "entries": []
    }
  },
  {
    "id": "targetAudience",
    "type": "multi_choice",
    "question": "À qui s'adresse votre projet ?",
    "options": [
      {
        "label": "Grand public",
        "visibility": "always",
        "subType": null,
        "subOptions": [],
        "conditionGroups": [],
        "conditions": [],
        "conditionLogic": "all"
      },
      {
        "label": "Patients / Association de patients",
        "visibility": "always",
        "subType": null,
        "subOptions": [],
        "conditionGroups": [],
        "conditions": [],
        "conditionLogic": "all"
      },
      {
        "label": "Professionnels de santé",
        "visibility": "always",
        "subType": null,
        "subOptions": [],
        "conditionGroups": [],
        "conditions": [],
        "conditionLogic": "all"
      },
      {
        "label": "Institutionnels",
        "visibility": "always",
        "subType": null,
        "subOptions": [],
        "conditionGroups": [],
        "conditions": [],
        "conditionLogic": "all"
      },
      {
        "label": "Collaborateurs du LFB",
        "visibility": "always",
        "subType": null,
        "subOptions": [],
        "conditionGroups": [],
        "conditions": [],
        "conditionLogic": "all"
      }
    ],
    "required": true,
    "conditions": [],
    "conditionLogic": "all",
    "guidance": {
      "objective": "Identifier les destinataires du projet",
      "details": "En fonction de la cible, les règles de validation ne seront pas les mêmes",
      "tips": [
        "Choisissez l'ensemble des personnes auxquelles votre projet s'adresse",
        "Ne sélectionnez \"Interne à LFB\" que si le projet s'adresse aux collaborateurs du LFB (ex : un site intranet)"
      ]
    },
    "showcase": {
      "sections": [
        "hero"
      ],
      "usage": "Badge « Audience principale » dans le bandeau de la vitrine."
    },
    "placeholder": "",
    "conditionGroups": [],
    "extraCheckbox": {
      "enabled": false,
      "label": ""
    },
    "otherOption": {
      "enabled": true,
      "label": "Autre",
      "placeholder": ""
    },
    "numberUnit": "",
    "rankingConfig": {
      "title": "Base de données",
      "criteria": [
        {
          "id": "critere-1",
          "label": "Critère 1"
        },
        {
          "id": "critere-2",
          "label": "Critère 2"
        },
        {
          "id": "critere-3",
          "label": "Critère 3"
        }
      ],
      "entries": []
    }
  },
  {
    "id": "showcaseTheme",
    "type": "choice",
    "question": "S'agit-il d'un projet produit ou environnement ?",
    "options": [
      {
        "label": "Projet produit",
        "visibility": "always",
        "subType": null,
        "subOptions": [
          {
            "label": "Alfalstin"
          },
          {
            "label": "Fibclot"
          },
          {
            "label": "Wilfactin"
          },
          {
            "label": "Cevenfacta"
          },
          {
            "label": "IqYmune"
          }
        ],
        "conditionGroups": [],
        "conditions": [],
        "conditionLogic": "all"
      },
      {
        "label": "Projet environnement",
        "visibility": "always",
        "subType": null,
        "subOptions": [
          {
            "label": "Immunologie"
          },
          {
            "label": "Hémostase"
          },
          {
            "label": "Soins intensifs"
          },
          {
            "label": "Pneumologie"
          },
          {
            "label": "Cross aire thérapeutique"
          }
        ],
        "conditionGroups": [],
        "conditions": [],
        "conditionLogic": "all"
      }
    ],
    "required": true,
    "conditions": [],
    "conditionLogic": "all",
    "guidance": {
      "objective": "Sélectionner la palette de couleurs qui servira de base à la vitrine du projet.",
      "details": "Chaque thème peut être ajusté dans le back-office grâce aux color-pickers (fond, dégradés, accents). Choisissez celui qui correspond le mieux à votre projet.",
      "tips": [
        "Universel : reprend l'identité visuelle actuelle de la vitrine.",
        "Produit : palette solaire et contrastée pour valoriser une offre produit.",
        "Cupertino : minimalisme lumineux inspiré d’Apple.",
        "Lumen : dégradés néon et profondeur façon Stripe.",
        "Voyage : chaleur AirBnB, accent corail et accueil doux.",
        "Arena : contrastes sportifs et énergie Nike.",
        "Prism : gradients vibrants inspirés d’Instagram."
      ]
    },
    "showcase": {
      "sections": [
        "hero"
      ],
      "usage": "Pilote les couleurs et dégradés utilisés dans l'ensemble de la vitrine."
    },
    "placeholder": "",
    "conditionGroups": [],
    "extraCheckbox": {
      "enabled": false,
      "label": ""
    },
    "otherOption": {
      "enabled": false,
      "label": "Autre",
      "placeholder": ""
    },
    "numberUnit": "",
    "rankingConfig": {
      "title": "Base de données",
      "criteria": [
        {
          "id": "critere-1",
          "label": "Critère 1"
        },
        {
          "id": "critere-2",
          "label": "Critère 2"
        },
        {
          "id": "critere-3",
          "label": "Critère 3"
        }
      ],
      "entries": []
    }
  },
  {
    "id": "projectSlogan",
    "type": "text",
    "question": "Quel slogan pour votre projet ?",
    "options": [],
    "required": false,
    "conditions": [],
    "conditionLogic": "all",
    "guidance": {
      "objective": "Résumer l'accroche en moins de 10 mots pour capter l'attention immédiatement.",
      "details": "Le slogan apparaît dans la hero section et doit être simple, mémorable et orienté bénéfice.",
      "tips": [
        "Utilisez un verbe d’action qui évoque le résultat attendu.",
        "Préférez un ton conversationnel : adressez-vous directement à votre audience."
      ]
    },
    "showcase": {
      "sections": [
        "hero"
      ],
      "usage": "Promesse courte située sous le nom du projet."
    }
  },
  {
    "id": "problemPainPoints",
    "type": "long_text",
    "question": "Listez 2 à 3 besoins concrets vécus par vos utilisateurs et que votre projet vient solutionner.",
    "options": [],
    "required": true,
    "conditions": [],
    "conditionLogic": "all",
    "guidance": {
      "objective": "Montrer que vous comprenez les besoins prioritaires de votre audience.",
      "details": "Chaque besoin s’affichera comme un bullet point pour renforcer l’empathie.",
      "tips": [
        "Utilisez une ligne par besoin pour faciliter la lecture.",
        "Décrivez la situation vécue plutôt que la solution souhaitée."
      ]
    },
    "showcase": {
      "sections": [
        "problem"
      ],
      "usage": "Liste des irritants principaux affichée dans la colonne de gauche."
    }
  },
  {
    "id": "solutionDescription",
    "type": "long_text",
    "question": "Décrivez en quoi consiste votre solution.",
    "options": [],
    "required": true,
    "conditions": [],
    "conditionLogic": "all",
    "guidance": {
      "objective": "Clarifier l’expérience proposée avant de détailler les bénéfices.",
      "details": "Cette description introduit la section “Solution” et doit rester simple à comprendre.",
      "tips": [
        "Structurez en 2-3 phrases : quoi, pour qui, comment.",
        "Évitez le vocabulaire interne : imaginez que vous présentez le concept à un prospect."
      ]
    },
    "showcase": {
      "sections": [
        "solution"
      ],
      "usage": "Bloc « Expérience proposée » dans la partie solution."
    }
  },
  {
    "id": "q19",
    "type": "choice",
    "question": "Quelles sont les composantes du projet ?",
    "options": [
      {
        "label": "Enquête / étude de marché",
        "visibility": "always",
        "subType": "multi_choice",
        "subOptions": [],
        "conditionGroups": [],
        "conditions": [],
        "conditionLogic": "all"
      },
      {
        "label": "Digital",
        "visibility": "always",
        "subType": "multi_choice",
        "subOptions": [
          {
            "label": "Site internet",
            "visibility": "always",
            "subType": null,
            "subOptions": [],
            "conditionGroups": [],
            "conditions": [],
            "conditionLogic": "all"
          },
          {
            "label": "Campagne réseaux sociaux",
            "visibility": "always",
            "subType": null,
            "subOptions": [],
            "conditionGroups": [],
            "conditions": [],
            "conditionLogic": "all"
          },
          {
            "label": "Applications mobiles",
            "visibility": "always",
            "subType": null,
            "subOptions": [],
            "conditionGroups": [],
            "conditions": [],
            "conditionLogic": "all"
          },
          {
            "label": "Campagne d'emailing",
            "visibility": "always",
            "subType": null,
            "subOptions": [],
            "conditionGroups": [],
            "conditions": [],
            "conditionLogic": "all"
          },
          {
            "label": "Webconférence",
            "visibility": "always",
            "subType": null,
            "subOptions": [],
            "conditionGroups": [],
            "conditions": [],
            "conditionLogic": "all"
          },
          {
            "label": "Podcast",
            "visibility": "always",
            "subType": null,
            "subOptions": [],
            "conditionGroups": [],
            "conditions": [],
            "conditionLogic": "all"
          },
          {
            "label": "Elearning",
            "visibility": "always",
            "subType": null,
            "subOptions": [],
            "conditionGroups": [],
            "conditions": [],
            "conditionLogic": "all"
          },
          {
            "label": "Bot IA",
            "visibility": "always",
            "subType": null,
            "subOptions": [],
            "conditionGroups": [],
            "conditions": [],
            "conditionLogic": "all"
          }
        ],
        "conditionGroups": [],
        "conditions": [],
        "conditionLogic": "all"
      },
      {
        "label": "Print",
        "visibility": "always",
        "conditionGroups": [],
        "conditions": [],
        "conditionLogic": "all",
        "subType": null,
        "subOptions": []
      },
      {
        "label": "Evenement",
        "visibility": "always",
        "conditionGroups": [],
        "conditions": [],
        "conditionLogic": "all",
        "subType": null,
        "subOptions": []
      },
      {
        "label": "Présentation de cas cliniques",
        "visibility": "always",
        "conditionGroups": [],
        "conditions": [],
        "conditionLogic": "all"
      }
    ],
    "required": true,
    "conditions": [],
    "conditionLogic": "all",
    "conditionGroups": [],
    "placeholder": "",
    "numberUnit": "",
    "guidance": {
      "objective": "",
      "details": "",
      "tips": []
    },
    "extraCheckbox": {
      "enabled": false,
      "label": ""
    },
    "otherOption": {
      "enabled": false,
      "label": "Autre",
      "placeholder": ""
    },
    "rankingConfig": {
      "title": "Base de données",
      "criteria": [
        {
          "id": "critere-1",
          "label": "Critère 1"
        },
        {
          "id": "critere-2",
          "label": "Critère 2"
        },
        {
          "id": "critere-3",
          "label": "Critère 3"
        }
      ],
      "entries": []
    }
  },
  {
    "id": "q20",
    "type": "choice",
    "question": "Dans le cadre du projet, allez-vous recourir à l'IA",
    "options": [
      {
        "label": "Oui pour générer des éléments (texte, image, ...)",
        "visibility": "always",
        "subType": null,
        "subOptions": [],
        "conditionGroups": [],
        "conditions": [],
        "conditionLogic": "all"
      },
      {
        "label": "Oui pour analyser des résultats et prendre des décisions",
        "visibility": "always",
        "subType": null,
        "subOptions": [],
        "conditionGroups": [],
        "conditions": [],
        "conditionLogic": "all"
      },
      {
        "label": "Oui, pour la mettre à disposition de l'utilisateur",
        "visibility": "always",
        "conditionGroups": [],
        "conditions": [],
        "conditionLogic": "all"
      }
    ],
    "required": true,
    "conditions": [],
    "conditionLogic": "all",
    "conditionGroups": [],
    "placeholder": "",
    "numberUnit": "",
    "guidance": {
      "objective": "",
      "details": "",
      "tips": []
    },
    "extraCheckbox": {
      "enabled": false,
      "label": ""
    },
    "otherOption": {
      "enabled": false,
      "label": "Autre",
      "placeholder": ""
    },
    "rankingConfig": {
      "title": "Base de données",
      "criteria": [
        {
          "id": "critere-1",
          "label": "Critère 1"
        },
        {
          "id": "critere-2",
          "label": "Critère 2"
        },
        {
          "id": "critere-3",
          "label": "Critère 3"
        }
      ],
      "entries": []
    }
  },
  {
    "id": "q10",
    "type": "multi_choice",
    "question": "Dans le cadre du projet, allez-vous collaborer avec ...",
    "options": [
      {
        "label": "Association de patients / Patients",
        "visibility": "always",
        "subType": null,
        "subOptions": [],
        "conditionGroups": [],
        "conditions": [],
        "conditionLogic": "all"
      },
      {
        "label": "Professionnels de santé (hors France) (ou association de PdS / Société savante)",
        "visibility": "always",
        "subType": null,
        "subOptions": [],
        "conditionGroups": [],
        "conditions": [],
        "conditionLogic": "all"
      },
      {
        "label": "Professionnel de santé français (ou association de PdS / Société savante)",
        "visibility": "always",
        "subType": null,
        "subOptions": [],
        "conditionGroups": [],
        "conditions": [],
        "conditionLogic": "all"
      },
      {
        "label": "Expert français non professionnels de santé",
        "visibility": "always",
        "conditionGroups": [],
        "conditions": [],
        "conditionLogic": "all",
        "subType": null,
        "subOptions": []
      },
      {
        "label": "Etablissement hospitalier",
        "visibility": "always",
        "subType": null,
        "subOptions": [],
        "conditionGroups": [],
        "conditions": [],
        "conditionLogic": "all"
      },
      {
        "label": "Institutionnel",
        "visibility": "always",
        "subType": null,
        "subOptions": [],
        "conditionGroups": [],
        "conditions": [],
        "conditionLogic": "all"
      },
      {
        "label": "Agence",
        "visibility": "always",
        "conditionGroups": [],
        "conditions": [],
        "conditionLogic": "all",
        "subType": null,
        "subOptions": []
      },
      {
        "label": "Un autre industriel",
        "visibility": "always",
        "conditionGroups": [],
        "conditions": [],
        "conditionLogic": "all"
      },
      {
        "label": "Aucune collaboration prévue avec l'externe",
        "visibility": "always",
        "conditionGroups": [],
        "conditions": [],
        "conditionLogic": "all"
      }
    ],
    "required": false,
    "conditions": [],
    "conditionLogic": "all",
    "conditionGroups": [],
    "placeholder": "",
    "guidance": {
      "objective": "Anticiper l'implication de prestataires externes et les contrôles associés",
      "details": "Les partenariats imposent une revue juridique des contrats, et parfois des délais supplémentaires liés à des obligations de déclaration / demande d'autorisation aux autorités",
      "tips": []
    },
    "extraCheckbox": {
      "enabled": false,
      "label": ""
    },
    "otherOption": {
      "enabled": true,
      "label": "Autre",
      "placeholder": ""
    },
    "numberUnit": "",
    "rankingConfig": {
      "title": "Base de données",
      "criteria": [
        {
          "id": "critere-1",
          "label": "Critère 1"
        },
        {
          "id": "critere-2",
          "label": "Critère 2"
        },
        {
          "id": "critere-3",
          "label": "Critère 3"
        }
      ],
      "entries": []
    }
  },
  {
    "id": "q17",
    "type": "multi_choice",
    "question": "Avez-vous des attentes particulières vis-à-vis de votre ou vos partenaires ?",
    "options": [
      {
        "label": "Exclusivité",
        "visibility": "always",
        "subType": null,
        "subOptions": [],
        "conditionGroups": [],
        "conditions": [],
        "conditionLogic": "all"
      },
      {
        "label": "Collaboration pour plus de 3 ans négociée dès maintenant",
        "visibility": "always",
        "subType": null,
        "subOptions": [],
        "conditionGroups": [],
        "conditions": [],
        "conditionLogic": "all"
      },
      {
        "label": "Possibilité de renouveler facilement ce type de projets dans le temps",
        "visibility": "conditional",
        "conditionGroups": [
          {
            "logic": "any",
            "conditions": [
              {
                "question": "q10",
                "operator": "equals",
                "value": "Agence"
              },
              {
                "question": "q10",
                "operator": "equals",
                "value": "Un autre industriel"
              }
            ]
          }
        ],
        "conditions": [
          {
            "question": "q10",
            "operator": "equals",
            "value": "Agence"
          },
          {
            "question": "q10",
            "operator": "equals",
            "value": "Un autre industriel"
          }
        ],
        "conditionLogic": "any"
      }
    ],
    "required": false,
    "conditions": [
      {
        "question": "q10",
        "operator": "not_equals",
        "value": "Aucune collaboration prévue avec l'externe"
      }
    ],
    "conditionLogic": "all",
    "conditionGroups": [
      {
        "logic": "all",
        "conditions": [
          {
            "question": "q10",
            "operator": "not_equals",
            "value": "Aucune collaboration prévue avec l'externe"
          }
        ]
      }
    ],
    "placeholder": "",
    "numberUnit": "",
    "guidance": {
      "objective": "",
      "details": "",
      "tips": []
    },
    "extraCheckbox": {
      "enabled": false,
      "label": ""
    },
    "otherOption": {
      "enabled": false,
      "label": "Autre",
      "placeholder": ""
    },
    "rankingConfig": {
      "title": "Base de données",
      "criteria": [
        {
          "id": "critere-1",
          "label": "Critère 1"
        },
        {
          "id": "critere-2",
          "label": "Critère 2"
        },
        {
          "id": "critere-3",
          "label": "Critère 3"
        }
      ],
      "entries": []
    }
  },
  {
    "id": "q21",
    "type": "choice",
    "question": "Concernant l'élaboration du logo / du nom, allez-vous faire appel à un prestataire ?",
    "options": [
      {
        "label": "Oui",
        "visibility": "always",
        "subType": null,
        "subOptions": [],
        "conditionGroups": [],
        "conditions": [],
        "conditionLogic": "all"
      },
      {
        "label": "Non",
        "visibility": "always",
        "subType": null,
        "subOptions": [],
        "conditionGroups": [],
        "conditions": [],
        "conditionLogic": "all"
      }
    ],
    "required": true,
    "conditions": [
      {
        "question": "projectName__extra_checkbox",
        "operator": "equals",
        "value": "true"
      },
      {
        "question": "q10",
        "operator": "equals",
        "value": "Agence"
      }
    ],
    "conditionLogic": "all",
    "conditionGroups": [
      {
        "logic": "all",
        "conditions": [
          {
            "question": "projectName__extra_checkbox",
            "operator": "equals",
            "value": "true"
          },
          {
            "question": "q10",
            "operator": "equals",
            "value": "Agence"
          }
        ]
      }
    ],
    "placeholder": "",
    "numberUnit": "",
    "guidance": {
      "objective": "",
      "details": "",
      "tips": []
    },
    "extraCheckbox": {
      "enabled": false,
      "label": ""
    },
    "otherOption": {
      "enabled": false,
      "label": "Autre",
      "placeholder": ""
    },
    "rankingConfig": {
      "title": "Base de données",
      "criteria": [
        {
          "id": "critere-1",
          "label": "Critère 1"
        },
        {
          "id": "critere-2",
          "label": "Critère 2"
        },
        {
          "id": "critere-3",
          "label": "Critère 3"
        }
      ],
      "entries": []
    }
  },
  {
    "id": "q14",
    "type": "multi_choice",
    "question": "Comment allez-vous communiquer sur votre projet ?",
    "options": [
      {
        "label": "Via les canaux digitaux du LFB",
        "visibility": "always",
        "subType": "multi_choice",
        "subOptions": [
          {
            "label": "Site internet corporate du LFB",
            "visibility": "always",
            "subType": null,
            "subOptions": [],
            "conditionGroups": [],
            "conditions": [],
            "conditionLogic": "all"
          },
          {
            "label": "Site internet Agora",
            "visibility": "always",
            "subType": null,
            "subOptions": [],
            "conditionGroups": [],
            "conditions": [],
            "conditionLogic": "all"
          },
          {
            "label": "Site internet des filiales du LFB",
            "visibility": "always",
            "subType": null,
            "subOptions": [],
            "conditionGroups": [],
            "conditions": [],
            "conditionLogic": "all"
          },
          {
            "label": "Réseaux sociaux du LFB",
            "visibility": "always",
            "subType": null,
            "subOptions": [],
            "conditionGroups": [],
            "conditions": [],
            "conditionLogic": "all"
          },
          {
            "label": "Emailing",
            "visibility": "always",
            "subType": null,
            "subOptions": [],
            "conditionGroups": [],
            "conditions": [],
            "conditionLogic": "all"
          }
        ],
        "conditionGroups": [],
        "conditions": [],
        "conditionLogic": "all"
      },
      {
        "label": "Via les canaux physique du LFB",
        "visibility": "always",
        "subType": "multi_choice",
        "subOptions": [
          {
            "label": "Remis (flyer, affiche, ...)",
            "visibility": "always",
            "subType": null,
            "subOptions": [],
            "conditionGroups": [],
            "conditions": [],
            "conditionLogic": "all"
          },
          {
            "label": "Equipe vente",
            "visibility": "always",
            "subType": null,
            "subOptions": [],
            "conditionGroups": [],
            "conditions": [],
            "conditionLogic": "all"
          },
          {
            "label": "Equipe médical",
            "visibility": "always",
            "subType": null,
            "subOptions": [],
            "conditionGroups": [],
            "conditions": [],
            "conditionLogic": "all"
          },
          {
            "label": "Evénements (via stand, kakémono, ...)",
            "visibility": "always",
            "subType": null,
            "subOptions": [],
            "conditionGroups": [],
            "conditions": [],
            "conditionLogic": "all"
          }
        ],
        "conditionGroups": [],
        "conditions": [],
        "conditionLogic": "all"
      },
      {
        "label": "Via notre partenaire",
        "visibility": "conditional",
        "conditionGroups": [
          {
            "logic": "all",
            "conditions": [
              {
                "question": "q10",
                "operator": "not_equals",
                "value": "Aucune collaboration prévue avec l'externe"
              }
            ]
          }
        ],
        "conditions": [
          {
            "question": "q10",
            "operator": "not_equals",
            "value": "Aucune collaboration prévue avec l'externe"
          }
        ],
        "conditionLogic": "all",
        "subType": null,
        "subOptions": []
      },
      {
        "label": "Via un tiers",
        "visibility": "always",
        "conditionGroups": [],
        "conditions": [],
        "conditionLogic": "all",
        "subType": null,
        "subOptions": []
      }
    ],
    "required": true,
    "conditions": [],
    "conditionLogic": "all",
    "conditionGroups": [],
    "placeholder": "",
    "numberUnit": "",
    "guidance": {
      "objective": "",
      "details": "",
      "tips": []
    },
    "extraCheckbox": {
      "enabled": false,
      "label": ""
    },
    "otherOption": {
      "enabled": false,
      "label": "Autre",
      "placeholder": ""
    },
    "rankingConfig": {
      "title": "Base de données",
      "criteria": [
        {
          "id": "critere-1",
          "label": "Critère 1"
        },
        {
          "id": "critere-2",
          "label": "Critère 2"
        },
        {
          "id": "critere-3",
          "label": "Critère 3"
        }
      ],
      "entries": []
    }
  },
  {
    "id": "q11",
    "type": "multi_choice",
    "question": "Les livrables du projet intègrent ils les éléments suivants ?",
    "options": [
      {
        "label": "Visuels créés spécifiquement pour le projet",
        "visibility": "conditional",
        "subType": null,
        "subOptions": [],
        "conditionGroups": [
          {
            "logic": "all",
            "conditions": [
              {
                "question": "q10",
                "operator": "equals",
                "value": "Agence"
              }
            ]
          }
        ],
        "conditions": [
          {
            "question": "q10",
            "operator": "equals",
            "value": "Agence"
          }
        ],
        "conditionLogic": "all"
      },
      {
        "label": "Logo de tiers (ex : logos d'associations de patients, de sociétés savantes, ...)",
        "visibility": "always",
        "subType": null,
        "subOptions": [],
        "conditionGroups": [],
        "conditions": [],
        "conditionLogic": "all"
      },
      {
        "label": "Images de tiers ou issues de banques d'images",
        "visibility": "always",
        "subType": null,
        "subOptions": [],
        "conditionGroups": [],
        "conditions": [],
        "conditionLogic": "all"
      },
      {
        "label": "Extrait de publications (sans modification ni paraphrase par le LFB) ou utilisation d'échelles scientifiques",
        "visibility": "always",
        "subType": null,
        "subOptions": [],
        "conditionGroups": [],
        "conditions": [],
        "conditionLogic": "all"
      },
      {
        "label": "Extrait de de sites internet",
        "visibility": "always",
        "subType": null,
        "subOptions": [],
        "conditionGroups": [],
        "conditions": [],
        "conditionLogic": "all"
      }
    ],
    "required": false,
    "conditions": [
      {
        "question": "ProjectType",
        "operator": "equals",
        "value": "Projet du LFB"
      },
      {
        "question": "ProjectType",
        "operator": "equals",
        "value": "Projet co-construit entre le LFB et un partenaire"
      }
    ],
    "conditionLogic": "any",
    "conditionGroups": [
      {
        "logic": "any",
        "conditions": [
          {
            "question": "ProjectType",
            "operator": "equals",
            "value": "Projet du LFB"
          },
          {
            "question": "ProjectType",
            "operator": "equals",
            "value": "Projet co-construit entre le LFB et un partenaire"
          }
        ]
      }
    ],
    "placeholder": "",
    "guidance": {
      "objective": "",
      "details": "",
      "tips": []
    },
    "extraCheckbox": {
      "enabled": false,
      "label": ""
    },
    "otherOption": {
      "enabled": false,
      "label": "Autre",
      "placeholder": ""
    },
    "numberUnit": "",
    "rankingConfig": {
      "title": "Base de données",
      "criteria": [
        {
          "id": "critere-1",
          "label": "Critère 1"
        },
        {
          "id": "critere-2",
          "label": "Critère 2"
        },
        {
          "id": "critere-3",
          "label": "Critère 3"
        }
      ],
      "entries": []
    }
  },
  {
    "id": "solutionComparison",
    "type": "long_text",
    "question": "En quoi cette solution se distingue-t-elle des alternatives actuelles ?",
    "options": [],
    "required": false,
    "conditions": [],
    "conditionLogic": "all",
    "guidance": {
      "objective": "Souligner la différenciation sans dénigrer la concurrence.",
      "details": "Cette réponse apparaît dans la section “Solution” comme une comparaison subtile.",
      "tips": [
        "Comparez-vous à un comportement ou à une solution existante plutôt qu’à un concurrent direct.",
        "Appuyez-vous sur un bénéfice mesurable ou une expérience utilisateur plus fluide."
      ]
    },
    "showcase": {
      "sections": [
        "solution"
      ],
      "usage": "Bloc « Pourquoi c’est différent » dans la section solution."
    }
  },
  {
    "id": "q3",
    "type": "multi_choice",
    "question": "Collectez-vous / manipulez-vous des données personnelles dans le cadre de votre projet / solution ?",
    "options": [
      {
        "label": "Oui - Données de santé",
        "visibility": "always",
        "subType": null,
        "subOptions": [],
        "conditionGroups": [],
        "conditions": [],
        "conditionLogic": "all"
      },
      {
        "label": "Oui - Autre données sensibles",
        "visibility": "always",
        "subType": null,
        "subOptions": [],
        "conditionGroups": [],
        "conditions": [],
        "conditionLogic": "all"
      },
      {
        "label": "Oui - Données personnelles standard (ex : email)",
        "visibility": "always",
        "subType": null,
        "subOptions": [],
        "conditionGroups": [],
        "conditions": [],
        "conditionLogic": "all"
      },
      {
        "label": "Non",
        "visibility": "always",
        "subType": null,
        "subOptions": [],
        "conditionGroups": [],
        "conditions": [],
        "conditionLogic": "all"
      }
    ],
    "required": true,
    "conditions": [
      {
        "question": "q11",
        "operator": "contains",
        "value": "Site internet"
      },
      {
        "question": "q11",
        "operator": "contains",
        "value": "Application mobile / web app"
      }
    ],
    "guidance": {
      "objective": "Qualifier la nature des données personnelles manipulées.",
      "details": "Les données de santé impliquent une analyse d'impact renforcée (DPIA), un hébergement certifié HDS et des clauses contractuelles spécifiques.",
      "tips": [
        "Si la collecte est incertaine, retenez l'hypothèse la plus protectrice pour planifier les validations."
      ]
    },
    "placeholder": "",
    "conditionGroups": [
      {
        "logic": "any",
        "conditions": [
          {
            "question": "q11",
            "operator": "contains",
            "value": "Site internet"
          },
          {
            "question": "q11",
            "operator": "contains",
            "value": "Application mobile / web app"
          }
        ]
      }
    ],
    "conditionLogic": "any",
    "extraCheckbox": {
      "enabled": false,
      "label": ""
    },
    "otherOption": {
      "enabled": false,
      "label": "Autre",
      "placeholder": ""
    },
    "numberUnit": "",
    "rankingConfig": {
      "title": "Base de données",
      "criteria": [
        {
          "id": "critere-1",
          "label": "Critère 1"
        },
        {
          "id": "critere-2",
          "label": "Critère 2"
        },
        {
          "id": "critere-3",
          "label": "Critère 3"
        }
      ],
      "entries": []
    }
  },
  {
    "id": "q13",
    "type": "choice",
    "question": "Votre solution contiendra-t-elle des champs libres ?",
    "options": [
      "Oui",
      "Non"
    ],
    "required": true,
    "conditions": [],
    "conditionLogic": "all",
    "conditionGroups": [
      {
        "logic": "any",
        "conditions": [
          {
            "question": "targetAudience",
            "operator": "equals",
            "value": "Grand public"
          },
          {
            "question": "targetAudience",
            "operator": "equals",
            "value": "Patients"
          },
          {
            "question": "targetAudience",
            "operator": "equals",
            "value": "Professionnels de santé"
          },
          {
            "question": "targetAudience",
            "operator": "equals",
            "value": "Acheteurs"
          }
        ]
      },
      {
        "logic": "any",
        "conditions": [
          {
            "question": "q11",
            "operator": "equals",
            "value": "Site internet"
          },
          {
            "question": "q11",
            "operator": "equals",
            "value": "Application mobile / web app"
          },
          {
            "question": "q11",
            "operator": "equals",
            "value": "Matériel promotionnel"
          },
          {
            "question": "q11",
            "operator": "equals",
            "value": "Matériel environnement"
          }
        ]
      }
    ],
    "placeholder": "",
    "guidance": {
      "objective": "Les champs libres peuvent créer des obligations de PV",
      "details": "Dès lors qu'un champs libre est présent, il convient de mettre en place un système de monitoring",
      "tips": [
        "Les champs libres ne sont pas problématiques en soi ! Il convient juste de mettre les bons contrôles en place"
      ]
    }
  },
  {
    "id": "roadmapMilestones",
    "type": "milestone_list",
    "question": "Quels jalons clés souhaitez-vous mettre en avant ?",
    "options": [],
    "required": false,
    "conditions": [],
    "conditionLogic": "all",
    "guidance": {
      "objective": "Projeter les étapes majeures à venir pour synchroniser les parties prenantes.",
      "details": "Chaque jalon affichera une date et un descriptif dans la section feuille de route de la vitrine.",
      "tips": [
        "Utilisez un format AAAA-MM-JJ pour les dates afin de faciliter la lecture.",
        "Formulez des descriptions actionnables : validation, lancement partiel, publication clé, etc."
      ]
    },
    "showcase": {
      "sections": [
        "timeline"
      ],
      "usage": "Liste de jalons personnalisés dans la section « Les prochains jalons »."
    }
  },
  {
    "id": "solutionBenefits",
    "type": "long_text",
    "question": "Quels bénéfices tangibles votre solution apporte-t-elle ?",
    "options": [],
    "required": true,
    "conditions": [],
    "conditionLogic": "all",
    "guidance": {
      "objective": "Mettre en avant les résultats obtenus plutôt que les fonctionnalités.",
      "details": "Chaque ligne sera transformée en bénéfice clé dans la vitrine.",
      "tips": [
        "Rédigez une phrase par bénéfice, orientée résultat (“Gain de 2h par semaine”).",
        "Priorisez les bénéfices les plus différenciants pour votre audience."
      ]
    },
    "showcase": {
      "sections": [
        "solution"
      ],
      "usage": "Liste des bénéfices clés dans la section solution."
    }
  },
  {
    "id": "BUDGET",
    "type": "number",
    "question": "Quel est le coût estimé du projet ? (en K€)",
    "options": [],
    "required": true,
    "conditions": [],
    "conditionLogic": "all",
    "conditionGroups": [],
    "placeholder": "",
    "numberUnit": "K€",
    "guidance": {
      "objective": "",
      "details": "",
      "tips": []
    },
    "showcase": {
      "sections": [
        "impact"
      ],
      "usage": "Carte « Budget estimé » dans la section impact."
    }
  },
  {
    "id": "innovationProcess",
    "type": "long_text",
    "question": "Quels sont vos objectifs derrières ce projet ?",
    "options": [],
    "required": false,
    "conditions": [],
    "conditionLogic": "all",
    "guidance": {
      "objective": "Identifier l'intérêt business du projet",
      "details": "Cette réponse vous permet de mettre en avant la valeur générée du projet pour le LFB",
      "tips": [
        "Soyez précis dans la description de votre objectif"
      ]
    },
    "showcase": {
      "sections": [
        "innovation"
      ],
      "usage": "Encart explicatif sur le fonctionnement de l’innovation."
    },
    "placeholder": "",
    "conditionGroups": []
  },
  {
    "id": "visionStatement",
    "type": "long_text",
    "question": "Quels indicateurs allez-vous suivre pour mesurer l'impact du projet ?",
    "options": [],
    "required": false,
    "conditions": [],
    "conditionLogic": "all",
    "guidance": {
      "objective": "Montrer comment vous suivrez concrètement la création de valeur.",
      "details": "Chaque indicateur s’affichera comme un point clé dans la section impact pour rassurer les parties prenantes.",
      "tips": [
        "Listez une métrique par ligne (quantitative ou qualitative).",
        "Précisez la cible ou la fréquence de suivi lorsque c’est pertinent."
      ]
    },
    "showcase": {
      "sections": [
        "impact"
      ],
      "usage": "Citation de conclusion dans la section impact."
    }
  },
  {
    "id": "campaignKickoffDate",
    "type": "date",
    "question": "À quelle date allez-vous soumettre ce projet à la compliance ?",
    "options": [],
    "required": false,
    "conditions": [],
    "conditionLogic": "all",
    "guidance": {
      "objective": "Poser le jalon officiel de passage en revue compliance.",
      "details": "Cette date permet d’anticiper les échanges de validation et le temps de traitement.",
      "tips": [
        "Indiquez la date d’envoi du dossier complet à la compliance.",
        "Mettez à jour la date dès qu’un nouveau créneau est confirmé."
      ]
    },
    "showcase": {
      "sections": [
        "timeline"
      ],
      "usage": "Point de départ utilisé pour calculer le runway et les prochaines étapes."
    }
  },
  {
    "id": "launchDate",
    "type": "date",
    "question": "Quelle est la date de lancement souhaitée ?",
    "options": [],
    "required": false,
    "conditions": [],
    "conditionLogic": "all",
    "guidance": {
      "objective": "Aligner toutes les parties prenantes sur la cible de lancement.",
      "details": "Associée à la date de soumission compliance, cette information permet de vérifier la faisabilité du planning.",
      "tips": [
        "Renseignez la première date de mise en avant (événement, publication, annonce).",
        "Si la date n’est pas figée, indiquez l’hypothèse la plus réaliste pour planifier les ressources."
      ]
    },
    "showcase": {
      "sections": [
        "timeline"
      ],
      "usage": "Date cible utilisée pour le calcul du runway et du calendrier."
    }
  },
  {
    "id": "q15",
    "type": "long_text",
    "question": "Souhaitez-vous partager une autre information clef sur ce projet ?",
    "options": [],
    "required": false,
    "conditions": [],
    "conditionLogic": "all",
    "conditionGroups": [],
    "placeholder": "Renseignez ici les informations détaillées...",
    "numberUnit": "",
    "guidance": {
      "objective": "",
      "details": "",
      "tips": []
    },
    "extraCheckbox": {
      "enabled": false,
      "label": ""
    },
    "otherOption": {
      "enabled": false,
      "label": "Autre",
      "placeholder": ""
    },
    "rankingConfig": {
      "title": "Base de données",
      "criteria": [
        {
          "id": "critere-1",
          "label": "Critère 1"
        },
        {
          "id": "critere-2",
          "label": "Critère 2"
        },
        {
          "id": "critere-3",
          "label": "Critère 3"
        }
      ],
      "entries": []
    }
  },
  {
    "id": "q15_copy",
    "type": "long_text",
    "question": "Avez-vous un document que vous souhaiteriez partager ?",
    "options": [],
    "required": false,
    "conditions": [],
    "conditionLogic": "all",
    "conditionGroups": [],
    "placeholder": "Renseignez ici les informations détaillées...",
    "numberUnit": "",
    "guidance": {
      "objective": "",
      "details": "",
      "tips": [
        "Pensez à donner un nom intelligible à votre fichier"
      ]
    },
    "extraCheckbox": {
      "enabled": false,
      "label": ""
    },
    "otherOption": {
      "enabled": false,
      "label": "Autre",
      "placeholder": ""
    },
    "rankingConfig": {
      "title": "Base de données",
      "criteria": [
        {
          "id": "critere-1",
          "label": "Critère 1"
        },
        {
          "id": "critere-2",
          "label": "Critère 2"
        },
        {
          "id": "critere-3",
          "label": "Critère 3"
        }
      ],
      "entries": []
    }
  },
  {
    "id": "q18",
    "type": "choice",
    "question": "Pouvez-vous préciser le type de don dont il s'agit ?",
    "options": [
      {
        "label": "Don financier",
        "visibility": "always",
        "subType": "multi_choice",
        "subOptions": [
          {
            "label": "Pour un projet défini"
          },
          {
            "label": "Pour un projet non encore défini (appel à projets)"
          },
          {
            "label": "Pour l'activité générale"
          }
        ],
        "conditionGroups": [],
        "conditions": [],
        "conditionLogic": "all"
      },
      {
        "label": "Don de produits",
        "visibility": "always",
        "subType": null,
        "subOptions": [],
        "conditionGroups": [],
        "conditions": [],
        "conditionLogic": "all"
      }
    ],
    "required": true,
    "conditions": [
      {
        "question": "ProjectType",
        "operator": "equals",
        "value": "Don / bourse / Appel à projets"
      }
    ],
    "conditionLogic": "all",
    "conditionGroups": [
      {
        "logic": "all",
        "conditions": [
          {
            "question": "ProjectType",
            "operator": "equals",
            "value": "Don / bourse / Appel à projets"
          }
        ]
      }
    ],
    "placeholder": "",
    "numberUnit": "",
    "guidance": {
      "objective": "",
      "details": "",
      "tips": []
    },
    "extraCheckbox": {
      "enabled": false,
      "label": ""
    },
    "otherOption": {
      "enabled": false,
      "label": "Autre",
      "placeholder": ""
    },
    "rankingConfig": {
      "title": "Base de données",
      "criteria": [
        {
          "id": "critere-1",
          "label": "Critère 1"
        },
        {
          "id": "critere-2",
          "label": "Critère 2"
        },
        {
          "id": "critere-3",
          "label": "Critère 3"
        }
      ],
      "entries": []
    }
  },
  {
    "id": "q18_copy",
    "type": "choice",
    "question": "Pouvez-vous préciser le type de soutien dont il s'agit ?",
    "options": [
      {
        "label": "Parrainage d'événément",
        "visibility": "always",
        "subType": "multi_choice",
        "subOptions": [
          {
            "label": "Stand",
            "visibility": "always",
            "subType": null,
            "subOptions": [],
            "conditionGroups": [],
            "conditions": [],
            "conditionLogic": "all"
          },
          {
            "label": "Autre soutien à un événément ",
            "visibility": "always",
            "subType": null,
            "subOptions": [],
            "conditionGroups": [],
            "conditions": [],
            "conditionLogic": "all"
          }
        ],
        "conditionGroups": [],
        "conditions": [],
        "conditionLogic": "all"
      },
      {
        "label": "Etude interventionnelle (IIS)",
        "visibility": "always",
        "subType": null,
        "subOptions": [],
        "conditionGroups": [],
        "conditions": [],
        "conditionLogic": "all"
      },
      {
        "label": "Etude non-interventionnelle (NIS)",
        "visibility": "always",
        "conditionGroups": [],
        "conditions": [],
        "conditionLogic": "all",
        "subType": null,
        "subOptions": []
      }
    ],
    "required": true,
    "conditions": [
      {
        "question": "ProjectType",
        "operator": "equals",
        "value": "Projet d'un tiers soutenu par le LFB"
      }
    ],
    "conditionLogic": "all",
    "conditionGroups": [
      {
        "logic": "all",
        "conditions": [
          {
            "question": "ProjectType",
            "operator": "equals",
            "value": "Projet d'un tiers soutenu par le LFB"
          }
        ]
      }
    ],
    "placeholder": "",
    "numberUnit": "",
    "guidance": {
      "objective": "",
      "details": "",
      "tips": []
    },
    "extraCheckbox": {
      "enabled": true,
      "label": "Il s'agit d'un parrainage multi-sponsors (soutien d'autres laboratoires pharmaceutiques)"
    },
    "otherOption": {
      "enabled": false,
      "label": "Autre",
      "placeholder": ""
    },
    "rankingConfig": {
      "title": "Base de données",
      "criteria": [
        {
          "id": "critere-1",
          "label": "Critère 1"
        },
        {
          "id": "critere-2",
          "label": "Critère 2"
        },
        {
          "id": "critere-3",
          "label": "Critère 3"
        }
      ],
      "entries": []
    }
  },
  {
    "id": "agencyRanking",
    "type": "ranking",
    "question": "Si vous souhaitez une proposition d'agences, triez ces critères par ordre d'importance",
    "options": [],
    "required": false,
    "conditions": [
      {
        "question": "q10",
        "operator": "equals",
        "value": "Agence"
      }
    ],
    "conditionLogic": "all",
    "guidance": {
      "objective": "Identifier rapidement l'agence qui correspond le mieux à vos attentes.",
      "details": "Ordonnez les critères par importance et mettez de côté ceux qui n'ont aucune incidence pour vous.",
      "tips": [
        "Pensez aux compétences clés attendues (scientifique, créativité, international...).",
        "Marquez les critères non pertinents comme \"sans importance\" pour affiner la recommandation."
      ]
    },
    "rankingConfig": {
      "title": "Prestataires pré-identifiés",
      "criteria": [
        {
          "id": "international",
          "label": "International"
        },
        {
          "id": "scientific",
          "label": "Contenu scientifique"
        },
        {
          "id": "creativity",
          "label": "Créativité"
        },
        {
          "id": "price",
          "label": "Prix"
        },
        {
          "id": "opinion",
          "label": "Avis global"
        }
      ],
      "entries": [
        {
          "id": "a-a",
          "name": "A+A",
          "scores": {
            "international": 3,
            "scientific": 3,
            "creativity": 3,
            "price": 3,
            "opinion": 2
          },
          "contact": "antoine.ada@aa.com",
          "website": "https://www.adhealth.com",
          "previousProject": "",
          "opinionText": "+++",
          "notes": "Positionnement premium et solide réseau international."
        },
        {
          "id": "adahealth",
          "name": "ADAHealth",
          "scores": {
            "international": 1,
            "scientific": 2,
            "creativity": 3,
            "price": 3,
            "opinion": 2
          },
          "contact": "robin.benard@adhealth.com",
          "website": "https://www.adhealth.com",
          "previousProject": "",
          "opinionText": "++",
          "notes": "Agence créative avec appétence digitale."
        },
        {
          "id": "anna-purna",
          "name": "Anna Purna",
          "scores": {
            "international": 2,
            "scientific": 2,
            "creativity": 3,
            "price": 3,
            "opinion": 2
          },
          "contact": "l.esperanza@annapurna8000.com",
          "website": "https://www.agence-annapurna.com",
          "previousProject": "",
          "opinionText": "++",
          "notes": "Approche équilibrée entre rigueur médicale et créativité."
        },
        {
          "id": "arsenal-cdm",
          "name": "Arsenal CDM",
          "scores": {
            "international": 1,
            "scientific": 1,
            "creativity": 1,
            "price": 1,
            "opinion": 1
          },
          "contact": "cherry@cdmparis.com",
          "website": "https://www.cdmparis.com",
          "previousProject": "FitCLOT / CLOTTAFACT",
          "opinionText": "++",
          "notes": "Historique sur des projets clotting, bonne connaissance du secteur."
        }
      ]
    },
    "placeholder": "",
    "conditionGroups": [
      {
        "logic": "all",
        "conditions": [
          {
            "question": "q10",
            "operator": "equals",
            "value": "Agence"
          }
        ]
      }
    ],
    "extraCheckbox": {
      "enabled": false,
      "label": ""
    },
    "otherOption": {
      "enabled": false,
      "label": "Autre",
      "placeholder": ""
    },
    "numberUnit": ""
  }
];
