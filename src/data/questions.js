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
      "objective": "Identifier le projet de façon univoque et anticiper les enjeux de propriété intellectuelle (nom / logo).",
      "details": "Le nom du projet sert de repère pour toutes les parties prenantes et peut être réutilisé dans des supports internes ou externes. Dès qu’un nom ou un logo est envisagé pour une communication externe, il faut vérifier la liberté d’exploitation (risque de marque antérieure) et définir la stratégie de protection. Si un tiers crée le nom ou le logo, la sécurisation des droits (cession de droits d’auteur) devient un prérequis.",
      "tips": [
        "Indiquez le nom ‘courant’ (ou provisoire) du projet ; ajoutez un nom de code entre parenthèses si utile.",
        "Si vous envisagez un nom/logo pour communiquer à l’externe, activez la case dédiée et sollicitez la PI en amont (avant diffusion).",
        "Évitez d’utiliser publiquement un nom/logo non vérifié ou non protégé ; privilégiez un intitulé provisoire interne en attendant."
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
      "objective": "Identifier le responsable opérationnel du projet (point d’entrée unique) pour les échanges business, juridiques et compliance.",
      "details": "Les équipes expertes doivent pouvoir contacter rapidement la bonne personne pour clarifier le périmètre, arbitrer et fournir les pièces (contrats, contenu, planning). Un lead clairement identifié réduit les itérations et sécurise la traçabilité des décisions.",
      "tips": [
        "Renseignez Prénom NOM et, si possible, la fonction (médical/marketing/affaires publiques…).",
        "Si plusieurs co-leads existent, indiquez le lead principal (décideur) et mentionnez les co-leads dans l’équipe projet.",
        "Prévoyez un back-up en cas d’absence (à préciser dans l’équipe projet ou en note interne)."
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
      "objective": "Orienter la revue vers le bon circuit de validation et les bons interlocuteurs.",
      "details": "Le rattachement du lead aide à comprendre le contexte (médical, marketing, affaires publiques…) et facilite la mobilisation des experts pertinents (contrôle pub, juridique, DPO, communication externe, E&C…).",
      "tips": [
        "Sélectionnez l’équipe principale du lead.",
        "Si le projet est transverse, choisissez l’équipe qui porte le budget ou la gouvernance, et précisez la co-activité dans l’équipe projet.",
        "Utilisez ‘Autre’ uniquement si aucune option ne correspond, et explicitez le rattachement."
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
      "objective": "Cartographier les parties prenantes pour sécuriser la gouvernance et anticiper les validations.",
      "details": "Un projet médico‑marketing implique souvent plusieurs métiers (contenu médical, conformité promotionnelle, données personnelles, contrats, communication externe). Lister l’équipe permet de vérifier que les expertises critiques sont couvertes et d’anticiper les points de friction (responsabilités, accès, livrables).",
      "tips": [
        "Indiquez une ligne par personne : Prénom NOM – rôle dans le projet (ex. chef de projet, médical, digital, data, com…).",
        "Ajoutez les contributeurs externes essentiels (agence, partenaire, prestataire IT) en précisant leur statut.",
        "Si le projet implique des patients, associations ou professionnels de santé, mentionnez le référent ‘interaction parties prenantes’ (souvent médical/E&C)."
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
      "objective": "Qualifier la nature du projet pour déclencher les bonnes exigences (contractuelles, E&C, contrôle pub, data privacy).",
      "details": "La catégorie conditionne les obligations : type de contrat, qualification du soutien (don/parrainage/partenariat), transparence, règles anti‑cadeaux/avantages, risques de requalification promotionnelle, et besoin de validation locale/internationale. Elle détermine aussi quelles questions complémentaires seront posées.",
      "tips": [
        "Sélectionnez toutes les catégories applicables (ex. co‑construction + soutien).",
        "Si c’est un renouvellement/duplicata, cochez la case et préparez la référence du projet/contrat précédent ainsi que les changements.",
        "En cas de doute, choisissez la catégorie la plus ‘engageante’ (ex. co‑construction plutôt que simple soutien) pour ne pas sous‑estimer les validations."
      ]
    },
    "extraCheckbox": {
      "enabled": true,
      "label": "Il s'agit d'un simple renouvellement ou un duplicata d'un projet déjà validé"
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
      "objective": "Distinguer le type de don pour évaluer la licéité, les risques de requalification et les obligations de transparence.",
      "details": "Les dons (financiers ou de produits) exigent une justification d’intérêt général/scientifique/institutionnel et doivent être indépendants de toute logique promotionnelle. Le type de don influence la documentation attendue, le montage juridique, la traçabilité et les contrôles (notamment lorsque le don est porté par des équipes marketing/commerciales ou lorsqu’il s’agit d’un don de produits).",
      "tips": [
        "Précisez si le don est destiné à un projet défini, à un appel à projets (projet non défini) ou à l’activité générale.",
        "Indiquez le bénéficiaire (statut : association, fondation, établissement…) et le montant/valeur estimée.",
        "Décrivez le rationnel (intérêt scientifique/sociétal/institutionnel) et confirmez l’absence de contrepartie promotionnelle directe ou indirecte."
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
    "id": "q18_copy",
    "type": "choice",
    "question": "Pouvez-vous préciser le type de soutien dont il s'agit ?",
    "options": [
      {
        "label": "Parrainage de projet",
        "visibility": "always",
        "conditionGroups": [],
        "conditions": [],
        "conditionLogic": "all",
        "subType": null,
        "subOptions": []
      },
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
        "subOptions": [
          {
            "label": "Avec administration de produit",
            "visibility": "always",
            "subType": null,
            "subOptions": [],
            "conditionGroups": [],
            "conditions": [],
            "conditionLogic": "all"
          },
          {
            "label": "Sans administration de produit",
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
      "objective": "Qualifier la nature du soutien à un tiers (parrainage, événement, étude) afin d’appliquer le bon cadre compliance et juridique.",
      "details": "Selon la nature du soutien, les risques et exigences varient : parrainage (contreparties, visibilité, requalification en promotion), soutien à événement (stands, prises de parole, Q&A), ou soutien à étude (interventionnelle/non‑interventionnelle) avec risques de requalification et exigences méthodologiques. La présence d’autres sponsors/laboratoires ajoute des enjeux de gouvernance et de transparence.",
      "tips": [
        "Choisissez l’option la plus fidèle au montage (projet vs événement vs étude).",
        "Si étude : précisez interventionnelle/non‑interventionnelle et, le cas échéant, administration de produit, périmètre et objectifs.",
        "Si multi‑sponsors : cochez la case et indiquez les autres sponsors/partenaires, ainsi que la nature des contreparties attendues."
      ]
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
    "id": "targetAudience",
    "type": "multi_choice",
    "question": "À qui s'adresse votre projet ?",
    "options": [
      {
        "label": "Grand public",
        "visibility": "conditional",
        "subType": null,
        "subOptions": [],
        "conditionGroups": [
          {
            "logic": "all",
            "conditions": [
              {
                "question": "ProjectType",
                "operator": "not_equals",
                "value": "Don / bourse / Appel à projets"
              }
            ]
          }
        ],
        "conditions": [
          {
            "question": "ProjectType",
            "operator": "not_equals",
            "value": "Don / bourse / Appel à projets"
          }
        ],
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
        "visibility": "conditional",
        "subType": null,
        "subOptions": [],
        "conditionGroups": [
          {
            "logic": "all",
            "conditions": [
              {
                "question": "ProjectType",
                "operator": "not_equals",
                "value": "Don / bourse / Appel à projets"
              }
            ]
          }
        ],
        "conditions": [
          {
            "question": "ProjectType",
            "operator": "not_equals",
            "value": "Don / bourse / Appel à projets"
          }
        ],
        "conditionLogic": "all"
      }
    ],
    "required": true,
    "conditions": [],
    "conditionLogic": "all",
    "guidance": {
      "objective": "Identifier l’audience pour appliquer les restrictions de communication (promotion, patients, grand public) et les règles locales.",
      "details": "La cible conditionne le niveau de risque et les validations : en France, toute communication externe d’un laboratoire peut être qualifiée de publicité et la publicité des médicaments soumis à prescription auprès du grand public est prohibée ; les interactions avec des patients accroissent le risque de diffusion indirecte d’informations produit. La cible influence aussi les règles de transparence, d’encadrement des avantages et le type de contrôle (contrôle pub, E&C, juridique).",
      "tips": [
        "Sélectionnez toutes les audiences visées, même si elles sont secondaires (ex. institutionnels + professionnels de santé).",
        "Si le projet vise des patients ou le grand public, évitez toute mention permettant d’identifier un produit soumis à prescription (risque d’interdiction en France) et anticipez une revue renforcée.",
        "Si le projet vise des professionnels de santé, précisez si l’accès est restreint (authentification) lorsque des contenus promotionnels sont envisagés."
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
    "id": "q27",
    "type": "multi_choice",
    "question": "Dans quels pays ce projet sera-t-il déployé ?",
    "options": [
      {
        "label": "France",
        "visibility": "always",
        "subType": null,
        "subOptions": [],
        "conditionGroups": [],
        "conditions": [],
        "conditionLogic": "all"
      },
      {
        "label": "Allemagne",
        "visibility": "always",
        "conditionGroups": [],
        "conditions": [],
        "conditionLogic": "all",
        "subType": null,
        "subOptions": []
      },
      {
        "label": "Benelux",
        "visibility": "always",
        "conditionGroups": [],
        "conditions": [],
        "conditionLogic": "all",
        "subType": null,
        "subOptions": []
      },
      {
        "label": "Espagne",
        "visibility": "always",
        "conditionGroups": [],
        "conditions": [],
        "conditionLogic": "all"
      },
      {
        "label": "Grande-Bretagne",
        "visibility": "always",
        "subType": null,
        "subOptions": [],
        "conditionGroups": [],
        "conditions": [],
        "conditionLogic": "all"
      },
      {
        "label": "Mexique",
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
        "question": "teamLeadTeam",
        "operator": "equals",
        "value": "Marketing DOI"
      },
      {
        "question": "teamLeadTeam",
        "operator": "equals",
        "value": "Médical DOI"
      },
      {
        "question": "teamLeadTeam",
        "operator": "equals",
        "value": "Affaires Publiques"
      },
      {
        "question": "teamLeadTeam",
        "operator": "equals",
        "value": "Autre"
      }
    ],
    "conditionLogic": "any",
    "conditionGroups": [
      {
        "logic": "any",
        "conditions": [
          {
            "question": "teamLeadTeam",
            "operator": "equals",
            "value": "Marketing DOI"
          },
          {
            "question": "teamLeadTeam",
            "operator": "equals",
            "value": "Médical DOI"
          },
          {
            "question": "teamLeadTeam",
            "operator": "equals",
            "value": "Affaires Publiques"
          },
          {
            "question": "teamLeadTeam",
            "operator": "equals",
            "value": "Autre"
          }
        ]
      }
    ],
    "placeholder": "",
    "numberUnit": "",
    "guidance": {
      "objective": "Déterminer les pays concernés pour anticiper les exigences locales (juridiques, promotionnelles et data privacy).",
      "details": "Les règles de promotion, de transparence et de protection des données varient selon les pays. Un contenu validé au siège peut nécessiter une relecture locale en cas de traduction/déclinaison ; certains montages peuvent être déployables dans un pays et bloqués dans un autre. Identifier les pays dès l’amont sécurise le planning et les responsabilités (HQ vs filiales).",
      "tips": [
        "Cochez tous les pays envisagés, même ‘pilote’ ou ‘phase 2’.",
        "Si ‘Autre’, listez précisément les pays et indiquez si le déploiement est géré par le siège ou par une filiale.",
        "Anticipez une validation locale pour la déclinaison/traduction et pour toute adaptation substantielle du contenu."
      ]
    },
    "extraCheckbox": {
      "enabled": false,
      "label": ""
    },
    "otherOption": {
      "enabled": true,
      "label": "Autre",
      "placeholder": "Précisez les autres pays imaginés"
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
    "id": "showcaseTheme",
    "type": "choice",
    "question": "S'agit-il d'un projet produit ou environnement ?",
    "options": [
      {
        "label": "Produit",
        "visibility": "always",
        "subType": null,
        "subOptions": [
          {
            "label": "Cevenfacta",
            "visibility": "always",
            "subType": null,
            "subOptions": [],
            "conditionGroups": [],
            "conditions": [],
            "conditionLogic": "all"
          },
          {
            "label": "iQymune",
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
        "label": "Environnement",
        "visibility": "always",
        "subType": null,
        "subOptions": [
          {
            "label": "Hémostase",
            "visibility": "always",
            "subType": null,
            "subOptions": [],
            "conditionGroups": [],
            "conditions": [],
            "conditionLogic": "all"
          },
          {
            "label": "Soins intensifs",
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
      }
    ],
    "required": true,
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
    "guidance": {
      "objective": "Ajuster la présentation (vitrine) pour que le projet soit lisible et comparable par les décideurs.",
      "details": "Ce choix est principalement ergonomique : il pilote la manière dont la vitrine du projet est présentée (univers produit vs environnement). Il n’a pas d’impact direct sur la conformité, mais améliore la compréhension et la cohérence des supports.",
      "tips": [
        "Choisissez ‘Produit’ si le projet est rattaché à une marque/aire produit ; ‘Environnement’ si le projet est transversal (parcours, organisation, digital, process).",
        "Si plusieurs axes existent, sélectionnez l’axe principal (celui qui porte la valeur et le périmètre)."
      ]
    },
    "showcase": {
      "sections": [
        "hero"
      ],
      "usage": "Pilote les couleurs et dégradés utilisés dans l'ensemble de la vitrine."
    },
    "placeholder": "",
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
    "id": "problemPainPoints",
    "type": "long_text",
    "question": "Listez les problèmes concrets de votre cible et que votre projet vient solutionner",
    "options": [],
    "required": true,
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
    "guidance": {
      "objective": "Démontrer la compréhension des besoins réels de la cible (approche Business Model Canvas) sans basculer dans la promotion.",
      "details": "Cette question structure l’‘empathie’ : quels irritants, obstacles, pertes de chance, frictions de parcours, contraintes organisationnelles… Le contenu doit rester factuel et centré sur l’usage (pas sur un produit), pour éviter les messages promotionnels ou comparatifs non étayés.",
      "tips": [
        "Utilisez une ligne par problème concret, formulé du point de vue de la cible.",
        "Restez factuel (sources, retours terrain, données publiques) et évitez les allégations non démontrées.",
        "N’introduisez pas de données personnelles identifiantes (ex. histoires de patients) ; anonymisez systématiquement les exemples."
      ]
    },
    "showcase": {
      "sections": [
        "problem"
      ],
      "usage": "Liste des irritants principaux affichée dans la colonne de gauche."
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
    ]
  },
  {
    "id": "solutionDescription",
    "type": "long_text",
    "question": "Décrivez en quoi consiste votre projet",
    "options": [],
    "required": true,
    "conditions": [],
    "conditionLogic": "all",
    "guidance": {
      "objective": "Décrire le périmètre du projet pour permettre une évaluation rapide des enjeux business et compliance.",
      "details": "Les experts doivent comprendre ‘quoi’ (solution), ‘pour qui’ (audience), ‘comment’ (canaux, partenaires, contenu) et ‘avec quels flux’ (données, financement, livrables). Une description claire permet d’identifier les validations nécessaires : contrôle pub (contenus), DPO (données/trackers), juridique (contrats), E&C (interactions, FMV, transparence).",
      "tips": [
        "Structurez en 2–3 phrases : quoi, pour qui, comment (canal principal) ; ajoutez ensuite les éléments clés (partenaires, pays, contenu).",
        "Précisez si le projet est non‑promotionnel/promotionnel et si des contenus produit sont envisagés.",
        "Mentionnez tout contact avec patients/professionnels de santé, et toute collecte de données, même minimale (emailing, analytics…)."
      ]
    },
    "showcase": {
      "sections": [
        "solution"
      ],
      "usage": "Bloc « Expérience proposée » dans la partie solution."
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
    "id": "projectSlogan",
    "type": "text",
    "question": "Si vous deviez résumer en 1 phrase votre proposition de valeur",
    "options": [],
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
    "guidance": {
      "objective": "Formuler une promesse courte et mémorable, compatible avec un usage interne/externe.",
      "details": "Le slogan est un élément de ‘headline’. En environnement pharmaceutique, il doit éviter les superlatifs et les allégations non étayées. S’il peut être vu par des audiences externes, il doit rester institutionnel/éducatif et non promotionnel.",
      "tips": [
        "Visez moins de 10 mots, orientés bénéfice d’usage (‘faciliter…’, ‘mieux…’).",
        "Évitez toute mention produit, comparatif (‘le meilleur’) ou promesse clinique non prouvée.",
        "Si le projet peut toucher le grand public/patients, privilégiez une formulation neutre et non promotionnelle."
      ]
    },
    "showcase": {
      "sections": [
        "hero"
      ],
      "usage": "Promesse courte située sous le nom du projet."
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
    ]
  },
  {
    "id": "q19",
    "type": "choice",
    "question": "Quelles sont les composantes du projet ?",
    "options": [
      {
        "label": "Enquête / étude de marché",
        "visibility": "always",
        "subType": "choice",
        "subOptions": [
          {
            "label": "Liée aux pratiques médicales",
            "visibility": "always",
            "subType": null,
            "subOptions": [],
            "conditionGroups": [],
            "conditions": [],
            "conditionLogic": "all"
          },
          {
            "label": "Liée à la vie avec la maladie",
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
        "label": "Création / achat / manipulation de base de données",
        "visibility": "always",
        "conditionGroups": [],
        "conditions": [],
        "conditionLogic": "all",
        "subType": null,
        "subOptions": []
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
        "conditionLogic": "all",
        "subType": null,
        "subOptions": []
      },
      {
        "label": "Rédaction d’abstract / de poster / articles scientifiques",
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
        "operator": "not_equals",
        "value": "Don / bourse / Appel à projets"
      },
      {
        "question": "q18_copy",
        "operator": "equals",
        "value": "Parrainage d'événément"
      },
      {
        "question": "q18_copy",
        "operator": "equals",
        "value": "Etude interventionnelle (IIS)"
      }
    ],
    "conditionLogic": "any",
    "conditionGroups": [
      {
        "logic": "any",
        "conditions": [
          {
            "question": "ProjectType",
            "operator": "not_equals",
            "value": "Don / bourse / Appel à projets"
          },
          {
            "question": "q18_copy",
            "operator": "equals",
            "value": "Parrainage d'événément"
          },
          {
            "question": "q18_copy",
            "operator": "equals",
            "value": "Etude interventionnelle (IIS)"
          }
        ]
      }
    ],
    "placeholder": "",
    "numberUnit": "",
    "guidance": {
      "objective": "Identifier toutes les composantes (digital, print, événement, enquête, base de données…) pour déclencher les contrôles pertinents.",
      "details": "Chaque composante a des implications différentes : enquête/étude (risque de requalification, information des participants, minimisation), base de données (gouvernance, sécurité, contrat, droits), digital (cookies/trackers, accès, hébergement), événement/webconf (Q&A, contenus), publications/abstracts (mentions obligatoires, droits).",
      "tips": [
        "Sélectionnez toutes les composantes prévues, même si elles ne sont pas ‘au cœur’ du projet.",
        "Pour ‘digital’, précisez dans votre documentation interne si l’accès est public ou restreint (authentification) et si des traceurs/analytics sont envisagés.",
        "Pour ‘enquête/étude’, indiquez le thème (pratiques médicales / vie avec la maladie) et la population interrogée."
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
    "id": "q25",
    "type": "choice",
    "question": "Avez-vous prévu une session de questions / réponses dans le cadre de l'événement ?",
    "options": [
      {
        "label": "Oui",
        "visibility": "always",
        "subType": "multi_choice",
        "subOptions": [
          {
            "label": "Avec modération préalable des questions",
            "visibility": "always",
            "subType": null,
            "subOptions": [],
            "conditionGroups": [],
            "conditions": [],
            "conditionLogic": "all"
          },
          {
            "label": "En présence d'un collaborateur du LFB",
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
        "question": "q19",
        "operator": "equals",
        "value": "Webconférence"
      },
      {
        "question": "q19",
        "operator": "equals",
        "value": "Evenement"
      }
    ],
    "conditionLogic": "any",
    "conditionGroups": [
      {
        "logic": "any",
        "conditions": [
          {
            "question": "q19",
            "operator": "equals",
            "value": "Webconférence"
          },
          {
            "question": "q19",
            "operator": "equals",
            "value": "Evenement"
          }
        ]
      }
    ],
    "placeholder": "",
    "numberUnit": "",
    "guidance": {
      "objective": "Anticiper le risque de communications non validées lors des sessions de questions/réponses (notamment en live).",
      "details": "Les réponses spontanées ne peuvent pas être validées a priori et peuvent générer des propos promotionnels, hors AMM ou déséquilibrés. Si l’événement est enregistré, il peut être nécessaire de supprimer le Q&A du replay. En interne avec patients/professionnels de santé, les questions peuvent devoir être collectées et modérées en amont.",
      "tips": [
        "Indiquez si les questions seront modérées/collectées en amont (option la plus sécurisante).",
        "Précisez si un collaborateur du LFB sera présent et quel sera son rôle (animation, réponse, modération).",
        "Si l’événement est enregistré, anticipez la gestion du replay (ex. retrait du Q&A) pour éviter des propos non validés."
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
    "id": "q24",
    "type": "multi_choice",
    "question": "Dans le cadre du projet allez-vous ...",
    "options": [
      {
        "label": "Partager des informations sur nos procédés de fabrication, nos installations ou des éléments techniques",
        "visibility": "always",
        "subType": null,
        "subOptions": [],
        "conditionGroups": [],
        "conditions": [],
        "conditionLogic": "all"
      },
      {
        "label": "Joindre et/ou diffuser des exemplaires papiers ou électroniques de publications",
        "visibility": "always",
        "subType": null,
        "subOptions": [],
        "conditionGroups": [],
        "conditions": [],
        "conditionLogic": "all"
      },
      {
        "label": "Partager des informations liés à l'historique du LFB avant 1994",
        "visibility": "always",
        "conditionGroups": [],
        "conditions": [],
        "conditionLogic": "all",
        "subType": null,
        "subOptions": []
      },
      {
        "label": "Partager des informations sur des sujets sensibles (ex : défaillance industrielle, tension d'approvisionnement, augmentation de capital, ...)",
        "visibility": "always",
        "conditionGroups": [],
        "conditions": [],
        "conditionLogic": "all",
        "subType": null,
        "subOptions": []
      },
      {
        "label": "Utiliser l'IA",
        "visibility": "always",
        "conditionGroups": [],
        "conditions": [],
        "conditionLogic": "all",
        "subType": "multi_choice",
        "subOptions": [
          {
            "label": "Oui, dans le cadre de la préparation du projet",
            "visibility": "always",
            "subType": null,
            "subOptions": [],
            "conditionGroups": [],
            "conditions": [],
            "conditionLogic": "all"
          },
          {
            "label": "Oui, pour générer du contenu pour le projet",
            "visibility": "always",
            "subType": null,
            "subOptions": [],
            "conditionGroups": [],
            "conditions": [],
            "conditionLogic": "all"
          },
          {
            "label": "Oui, le projet permettra aux utilisateurs d'utiliser l'IA",
            "visibility": "always",
            "subType": null,
            "subOptions": [],
            "conditionGroups": [],
            "conditions": [],
            "conditionLogic": "all"
          }
        ]
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
      },
      {
        "question": "q18_copy",
        "operator": "equals",
        "value": "Stand"
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
            "value": "Projet du LFB"
          },
          {
            "question": "ProjectType",
            "operator": "equals",
            "value": "Projet co-construit entre le LFB et un partenaire"
          },
          {
            "question": "q18_copy",
            "operator": "equals",
            "value": "Stand"
          }
        ]
      }
    ],
    "placeholder": "",
    "numberUnit": "",
    "guidance": {
      "objective": "Repérer les sujets ‘sensibles’ (confidentialité, réputation, IA, PI) qui nécessitent une revue renforcée.",
      "details": "Certaines thématiques déclenchent des exigences spécifiques : informations sur procédés/installation (confidentialité et stratégie PI), diffusion de publications (droits CFC/autorisation), historique sensible (risque réputationnel et cadrage), sujets sensibles (exposition médiatique), usage de l’IA (impacts éthiques, gouvernance, obligations selon le niveau de risque).",
      "tips": [
        "Cochez tout ce qui s’applique, même partiellement (ex. mention d’un procédé de fabrication dans une slide).",
        "Si vous prévoyez une communication externe sur un sujet sensible, impliquez très tôt la communication externe pour cadrer les messages.",
        "Pour l’IA, précisez l’usage : aide à la préparation, génération de contenu, ou IA mise à disposition des utilisateurs (niveau de risque différent)."
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
    "id": "q22",
    "type": "choice",
    "question": "Votre projet correspond  il a une de ces situations ?",
    "options": [
      {
        "label": "Un dispositif structuré d’accompagnement du patient pour l’accompagner dans l’usage du traitement (initiation, observance, gestion des effets indésirables, compréhension de la maladie, soutien pratique ou financier)",
        "visibility": "always",
        "subType": null,
        "subOptions": [],
        "conditionGroups": [],
        "conditions": [],
        "conditionLogic": "all"
      },
      {
        "label": "Permet de réaliser des actes médicaux à distance (consultation, avis, suivi, surveillance, prescription ou coordination des soins)",
        "visibility": "always",
        "subType": null,
        "subOptions": [],
        "conditionGroups": [],
        "conditions": [],
        "conditionLogic": "all"
      },
      {
        "label": "Une application / instrument / outil destiné à être utilisé à des fins médicales (prévention, diagnostic, traitement, suivi de la maladie. ",
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
    "conditionGroups": [
      {
        "logic": "any",
        "conditions": [
          {
            "question": "targetAudience",
            "operator": "equals",
            "value": "Patients / Association de patients"
          },
          {
            "question": "targetAudience",
            "operator": "equals",
            "value": "Professionnels de santé"
          }
        ]
      },
      {
        "logic": "any",
        "conditions": [
          {
            "question": "q19",
            "operator": "equals",
            "value": "Applications mobiles"
          },
          {
            "question": "q19",
            "operator": "equals",
            "value": "Elearning"
          },
          {
            "question": "q19",
            "operator": "equals",
            "value": "Bot IA"
          },
          {
            "question": "q19",
            "operator": "equals",
            "value": "Site internet"
          }
        ]
      }
    ],
    "placeholder": "",
    "numberUnit": "",
    "guidance": {
      "objective": "Détecter les projets relevant de cadres réglementaires spécifiques (PSP/ETP, télémédecine, dispositif médical).",
      "details": "Ces projets sont souvent complexes : un programme patient peut être requalifié en dispositif promotionnel/avantage indu ; la télémédecine implique des enjeux de responsabilité et des cadres locaux ; un dispositif médical nécessite une qualification réglementaire et peut générer des obligations de conformité (marquage, responsabilité, surveillance).",
      "tips": [
        "Si votre projet ressemble à un PSP/ETP, décrivez brièvement le parcours proposé (initiation, observance, soutien…) et les acteurs impliqués.",
        "Si télémédecine : indiquez les actes concernés (avis, suivi, prescription, coordination) et les pays.",
        "Si dispositif médical : précisez qui développe, le rôle du laboratoire (promotion, achat, diffusion) et les modalités d’utilisation."
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
    "id": "q3",
    "type": "multi_choice",
    "question": "Collectez-vous / manipulez-vous des données issues de personnes dans le cadre de votre projet / solution ?",
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
        "label": "Oui - Autre données sensibles (ex : origine ethnique, orientation sexuelle, ...)",
        "visibility": "always",
        "subType": null,
        "subOptions": [],
        "conditionGroups": [],
        "conditions": [],
        "conditionLogic": "all"
      },
      {
        "label": "Oui - Données personnelles standard (ex : email, satisfaction, ...)",
        "visibility": "always",
        "subType": null,
        "subOptions": [],
        "conditionGroups": [],
        "conditions": [],
        "conditionLogic": "all"
      },
      {
        "label": "Présence de champs libres dans ma solution",
        "visibility": "always",
        "conditionGroups": [],
        "conditions": [],
        "conditionLogic": "all",
        "subType": null,
        "subOptions": []
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
    "conditions": [],
    "guidance": {
      "objective": "Qualifier la nature des données personnelles manipulées pour déclencher les exigences RGPD (‘privacy by design’).",
      "details": "La collecte/traitement de données personnelles impose de définir finalités, base légale, durées de conservation, droits des personnes et mesures de sécurité. Les données de santé sont particulièrement sensibles et peuvent nécessiter une analyse d’impact (DPIA), des exigences d’hébergement renforcées et des clauses contractuelles spécifiques. Les champs libres augmentent le risque de collecte de données sensibles non maîtrisées.",
      "tips": [
        "Choisissez l’hypothèse la plus protectrice si vous n’êtes pas sûr (ex. données de santé) pour anticiper le bon niveau de revue.",
        "Listez (en interne ou dans un document joint) les catégories de données, les personnes concernées (patients, PdS, collaborateurs…) et la finalité.",
        "Si des champs libres existent, prévoyez des garde‑fous : minimisation, consignes, modération, et limitation de la collecte de données sensibles."
      ]
    },
    "placeholder": "",
    "conditionGroups": [
      {
        "logic": "any",
        "conditions": [
          {
            "question": "q19",
            "operator": "contains",
            "value": "Site internet"
          },
          {
            "question": "q19",
            "operator": "contains",
            "value": "Applications mobiles"
          },
          {
            "question": "q19",
            "operator": "equals",
            "value": "Enquête / étude de marché"
          },
          {
            "question": "q19",
            "operator": "equals",
            "value": "Création / achat / manipulation de base de données"
          },
          {
            "question": "q19",
            "operator": "equals",
            "value": "Bot IA"
          },
          {
            "question": "q19",
            "operator": "equals",
            "value": "Elearning"
          }
        ]
      },
      {
        "logic": "all",
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
    "conditionLogic": "all",
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
        "label": "Via les canaux physiques du LFB",
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
      },
      {
        "label": "Communiqué de presse",
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
      "objective": "Identifier les canaux de communication afin d’activer les validations (communication externe, contrôle pub, RGPD, filiales).",
      "details": "Dès qu’un communiqué de presse, une prise de parole institutionnelle, un site externe ou des réseaux sociaux sont envisagés, la communication externe doit être impliquée pour assurer cohérence et maîtrise des risques. Les réseaux sociaux sont des canaux publics et difficiles à contrôler : ils sont ‘sensibles’ et requièrent un encadrement strict (comptes corporate, commentaires). Toute communication externe d’un laboratoire peut être requalifiée en publicité et doit être évaluée.",
      "tips": [
        "Sélectionnez tous les canaux prévus (digital, print, événements, partenaire, presse…).",
        "Si réseaux sociaux : prévoyez une diffusion via les comptes corporate, avec commentaires désactivés, et une validation en amont.",
        "Si communiqué de presse ou contenu institutionnel : impliquez la communication externe tôt pour cadrer les messages et anticiper les questions sensibles."
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
    "id": "q10",
    "type": "multi_choice",
    "question": "Dans le cadre du projet, allez-vous collaborer avec ...",
    "options": [
      {
        "label": "Aucune collaboration prévue avec l'externe",
        "visibility": "always",
        "conditionGroups": [],
        "conditions": [],
        "conditionLogic": "all",
        "subType": null,
        "subOptions": []
      },
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
        "label": "Professionnel de santé (hors France) (ou association de PdS / Société savante)",
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
        "label": "Etablissements hospitaliers",
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
        "conditionLogic": "all",
        "subType": null,
        "subOptions": []
      }
    ],
    "required": false,
    "conditions": [],
    "conditionLogic": "all",
    "conditionGroups": [],
    "placeholder": "",
    "guidance": {
      "objective": "Recenser les collaborations externes pour anticiper contrats, FMV, transparence et exigences spécifiques (agents publics, patients, prestataires).",
      "details": "La collaboration avec des tiers peut déclencher : revue juridique (contrat, responsabilités, durée), exigences E&C (besoin légitime, rémunération juste, transparence, encadrement des avantages/hospitalité), contraintes particulières pour agents publics, et revue DPO si des données personnelles sont traitées par un prestataire.",
      "tips": [
        "Sélectionnez tous les types de partenaires impliqués (PdS France/hors France, associations de patients, institutionnels, agences, autres industriels…).",
        "Si rémunération, hospitalité ou transfert de valeur est prévu, documentez le besoin légitime, les livrables/temps estimé et la proportionnalité.",
        "Si un prestataire aura accès à des données personnelles, anticipez une revue DPO (sécurité, hébergement, transferts hors UE) et les clauses de sous‑traitance."
      ]
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
        "conditionLogic": "any",
        "subType": null,
        "subOptions": []
      }
    ],
    "required": false,
    "conditions": [],
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
      },
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
    "numberUnit": "",
    "guidance": {
      "objective": "Identifier les demandes contractuelles ‘structurantes’ (exclusivité, durée > 3 ans, renouvellement) qui complexifient la négociation.",
      "details": "L’exclusivité et les engagements longs peuvent poser des enjeux de concurrence, de soutenabilité et de gouvernance. Les prestations récurrentes peuvent nécessiter un contrat cadre. Signaler ces attentes tôt permet au juridique de sécuriser le montage et de calibrer le planning.",
      "tips": [
        "Expliquez brièvement la justification business de l’exclusivité (si sélectionnée) et le périmètre (territoire, durée, objets).",
        "Si collaboration > 3 ans : indiquez pourquoi c’est nécessaire et les mécanismes de révision/renégociation.",
        "Si vous souhaitez des renouvellements faciles, précisez les prestations récurrentes envisagées (volumes, fréquences, livrables)."
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
      "objective": "Sécuriser la propriété intellectuelle lorsque le nom/logo est créé par un prestataire.",
      "details": "Si un tiers (agence, freelance) crée un nom/logo, il faut organiser la cession des droits d’auteur et documenter les livrables. Une étude de liberté d’exploitation peut être nécessaire avant tout usage externe. Les éléments contractuels et livrables (devis, déclinaisons, fichiers sources) doivent être annexés.",
      "tips": [
        "Si oui : prévoyez un contrat/avenant de cession de droits d’auteur couvrant tous les livrables et déclinaisons.",
        "Conservez et joignez le devis et les livrables (sources, déclinaisons couleurs, formats) pour faciliter la sécurisation.",
        "N’utilisez pas le logo/nom à l’externe avant d’avoir sécurisé les droits et, si nécessaire, réalisé la vérification PI."
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
    "id": "q11",
    "type": "multi_choice",
    "question": "Les livrables du projet sont ils susceptibles de comporter les éléments suivants ?",
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
        "label": "Extrait de publications ou utilisation d'échelles scientifiques",
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
      },
      {
        "label": "Contenu généré via de l'IA",
        "visibility": "always",
        "conditionGroups": [],
        "conditions": [],
        "conditionLogic": "all",
        "subType": null,
        "subOptions": []
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
      "objective": "Identifier les contenus soumis à droits (PI, droit d’auteur, droit des marques) et les contenus à risque promotionnel.",
      "details": "Les logos, images, extraits de publications, contenus de sites web ou visuels créés par des tiers nécessitent des droits d’utilisation explicites. Les extraits de publications peuvent relever d’une licence (ex. CFC/BioMed) avec un périmètre à vérifier. Les contenus générés via IA requièrent une relecture humaine et une traçabilité des sources pour éviter erreurs, biais ou atteintes aux droits.",
      "tips": [
        "Pour les logos tiers : vérifiez les mentions légales/conditions d’usage ; à défaut, obtenez une autorisation écrite.",
        "Pour les images/banques : vérifiez la licence pour l’usage envisagé (territoire, durée, support) et conservez la preuve.",
        "Pour les publications : vérifiez si elles entrent dans le périmètre de la licence applicable et citez correctement les références ; sinon, obtenez l’autorisation.",
        "Pour du contenu IA : exigez une validation scientifique/réglementaire humaine et gardez les sources/justificatifs."
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
    "guidance": {
      "objective": "Mettre en avant la différenciation sans générer de risque de dénigrement ou d’allégation non étayée.",
      "details": "Comparer la solution à des alternatives existantes peut améliorer la clarté du projet. En contexte pharmaceutique, les comparaisons doivent rester prudentes : éviter le dénigrement, les comparatifs implicites non prouvés et les allégations qui pourraient être perçues comme promotionnelles.",
      "tips": [
        "Comparez plutôt à un ‘état actuel’ (process, parcours, outils) qu’à un concurrent ou un produit.",
        "Appuyez-vous sur des critères vérifiables (délais, simplicité, accessibilité, qualité de service).",
        "Évitez les superlatifs (‘unique’, ‘le meilleur’) et toute promesse clinique si elle n’est pas démontrée."
      ]
    },
    "showcase": {
      "sections": [
        "solution"
      ],
      "usage": "Bloc « Pourquoi c’est différent » dans la section solution."
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
    ]
  },
  {
    "id": "solutionBenefits",
    "type": "long_text",
    "question": "Quels bénéfices tangibles votre solution apporte-t-elle à votre cible ?",
    "options": [],
    "required": true,
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
    "guidance": {
      "objective": "Rendre visibles les bénéfices concrets pour la cible (outcomes), base de décision business.",
      "details": "Les décideurs attendent des bénéfices tangibles et mesurables. En environnement réglementé, il faut éviter les promesses non justifiées et distinguer bénéfices d’usage (expérience, accès, compréhension) des allégations médicales.",
      "tips": [
        "Une ligne par bénéfice, formulée ‘résultat’ (gain de temps, réduction d’erreurs, meilleure compréhension…).",
        "Priorisez les 3–5 bénéfices les plus différenciants pour l’audience principale.",
        "Si vous mentionnez un bénéfice ‘médical’, assurez-vous qu’il est étayé et qu’il ne constitue pas une allégation promotionnelle inappropriée."
      ]
    },
    "showcase": {
      "sections": [
        "solution"
      ],
      "usage": "Liste des bénéfices clés dans la section solution."
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
    ]
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
      "objective": "Évaluer la faisabilité et l’arbitrage ressources/impact.",
      "details": "Le budget conditionne la décision (go/no-go) et le choix des prestataires. Il doit couvrir non seulement la production (agence, tech) mais aussi les exigences induites : validations, hébergement/sécurité, adaptation locale, maintenance, et éventuelles obligations de conformité.",
      "tips": [
        "Renseignez une estimation réaliste en incluant : prestataires, licences/outils, production de contenus, maintenance.",
        "Distinguez coûts one‑shot vs récurrents (ex. hébergement, analytics, modération).",
        "Si incertitude, donnez une fourchette et mentionnez les postes majeurs."
      ]
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
    "question": "Quels sont les objectifs du LFB derrière ce projet ?",
    "options": [],
    "required": false,
    "conditions": [],
    "conditionLogic": "all",
    "guidance": {
      "objective": "Clarifier l’objectif business et stratégique du LFB derrière le projet.",
      "details": "Au‑delà de la solution, il faut expliciter la valeur pour l’organisation : impact patient, scientifique, institutionnel, efficacité opérationnelle, conformité, réputation. Cette clarification aide aussi à démontrer la légitimité de certaines collaborations (besoin légitime, proportionnalité).",
      "tips": [
        "Formulez 1–3 objectifs prioritaires (ex. améliorer un parcours, renforcer une relation institutionnelle, optimiser un process).",
        "Reliez chaque objectif à un ‘driver’ mesurable (KPIs, jalons).",
        "Évitez une formulation purement promotionnelle ; privilégiez patient/société/science/qualité."
      ]
    },
    "showcase": {
      "sections": [
        "innovation"
      ],
      "usage": "Encart explicatif sur le fonctionnement de l’innovation."
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
    "id": "visionStatement",
    "type": "long_text",
    "question": "Quels indicateurs allez-vous suivre pour mesurer l'impact du projet ?",
    "options": [],
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
      },
      {
        "question": "q18_copy",
        "operator": "equals",
        "value": "Stand"
      }
    ],
    "conditionLogic": "any",
    "guidance": {
      "objective": "Définir comment l’impact sera mesuré pour piloter et justifier le projet.",
      "details": "Les indicateurs rassurent sur la capacité à démontrer la valeur. Attention : certains KPIs nécessitent de collecter des données personnelles (questionnaires, analytics). Il faut donc s’assurer que la collecte est proportionnée et conforme.",
      "tips": [
        "Listez une métrique par ligne (quantitative ou qualitative) et la fréquence de suivi si possible.",
        "Privilégiez des indicateurs directement liés à l’objectif (usage, satisfaction, délai, qualité).",
        "Si un KPI implique des données personnelles, prévoyez une collecte minimisée et documentée."
      ]
    },
    "showcase": {
      "sections": [
        "impact"
      ],
      "usage": "Citation de conclusion dans la section impact."
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
          },
          {
            "question": "q18_copy",
            "operator": "equals",
            "value": "Stand"
          }
        ]
      }
    ]
  },
  {
    "id": "q23",
    "type": "multi_choice",
    "question": "Comment allez-vous collecter ces indicateurs ?",
    "options": [
      {
        "label": "Questionnaire de satisfaction",
        "visibility": "always",
        "conditionGroups": [],
        "conditions": [],
        "conditionLogic": "all",
        "subType": null,
        "subOptions": []
      },
      {
        "label": "Trackers digitaux (nombre d'ouverture, taux de lecture, ...)",
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
        "value": "Projet du LFB"
      },
      {
        "question": "ProjectType",
        "operator": "equals",
        "value": "Projet co-construit entre le LFB et un partenaire"
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
    "numberUnit": "",
    "guidance": {
      "objective": "Comprendre les modalités de collecte des KPIs pour anticiper les exigences data privacy et méthodologiques.",
      "details": "Les questionnaires impliquent une information des répondants et une minimisation des données. Les trackers digitaux (cookies, logs, analytics) requièrent souvent un paramétrage spécifique (consentement, durée, finalité). Si une agence collecte/analyse, il peut y avoir un rôle de sous‑traitant à encadrer contractuellement.",
      "tips": [
        "Indiquez si la collecte peut être anonyme/pseudonymisée et quelles données sont strictement nécessaires.",
        "Pour les trackers : précisez (dans un doc joint si besoin) le type d’outils (analytics, pixels, taux d’ouverture…) et le périmètre.",
        "Si une agence intervient, anticipez la revue DPO : accès aux données, hébergement, transferts hors UE, sécurité."
      ]
    },
    "extraCheckbox": {
      "enabled": true,
      "label": "Ces données sont collectées et / ou analysées par une agence"
    },
    "otherOption": {
      "enabled": true,
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
    "id": "q26",
    "type": "long_text",
    "question": "Indiquez moi ce qui évolue entre le projet historique et le nouveau projet",
    "options": [],
    "required": true,
    "conditions": [
      {
        "question": "ProjectType__extra_checkbox",
        "operator": "equals",
        "value": "true"
      }
    ],
    "conditionLogic": "all",
    "conditionGroups": [
      {
        "logic": "all",
        "conditions": [
          {
            "question": "ProjectType__extra_checkbox",
            "operator": "equals",
            "value": "true"
          }
        ]
      }
    ],
    "placeholder": "Renseignez ici les informations détaillées...",
    "numberUnit": "",
    "guidance": {
      "objective": "Comparer un renouvellement à son ‘référentiel’ afin de déterminer si une nouvelle revue complète est nécessaire.",
      "details": "Un projet déclaré ‘similaire’ peut parfois être traité en ‘prochaines étapes’ si aucune modification substantielle n’existe. À l’inverse, un changement de partenaires, de montant, d’audience, de pays, de contenu ou de données peut déclencher une nouvelle analyse (contrats, E&C, contrôle pub, DPO).",
      "tips": [
        "Indiquez la référence du projet/contrat historique (nom, date, référence interne) et listez les changements.",
        "Pensez aux changements ‘invisibles’ : nouveaux canaux (réseaux sociaux), nouveaux pays, nouvelles données, nouvelle agence.",
        "Soyez précis : ce champ sert de base pour décider rapidement du niveau de revue requis."
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
    "id": "launchDate",
    "type": "date",
    "question": "Quelle est la date de lancement souhaitée ?",
    "options": [],
    "required": false,
    "conditions": [],
    "conditionLogic": "all",
    "guidance": {
      "objective": "Aligner l’équipe sur la date cible et vérifier la compatibilité avec les délais incompressibles de validation.",
      "details": "Certaines validations prennent du temps (ex. autorisation préalable pour certains contrats en France, relectures locales, revue DPO/contrôle pub). Fixer une date cible permet de calibrer le planning, d’identifier les dépendances et d’éviter un lancement non conforme.",
      "tips": [
        "Indiquez la première date de mise en avant (go‑live, annonce, événement) plutôt que la fin du projet.",
        "Prévoyez une marge pour les validations et la contractualisation, surtout si des tiers/professionnels de santé sont impliqués.",
        "Si incertain, donnez une fenêtre (mois) et précisez le niveau de flexibilité."
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
    "id": "campaignKickoffDate",
    "type": "date",
    "question": "À quelle date allez-vous soumettre ce projet à la compliance ?",
    "options": [],
    "required": false,
    "conditions": [],
    "conditionLogic": "all",
    "guidance": {
      "objective": "Fixer le jalon de soumission compliance pour planifier la revue et les itérations.",
      "details": "La compliance a besoin d’un dossier complet (périmètre, partenaires, contenus, données, planning) pour se positionner. Annoncer une date de soumission permet d’anticiper les échanges de clarification et d’éviter des retours tardifs (coûteux).",
      "tips": [
        "Indiquez la date d’envoi du dossier complet (et non une intention).",
        "Si des contenus sont en cours, précisez ce qui sera ‘figé’ à la soumission (storyboard, synopsis, maquettes).",
        "Mettez à jour la date dès qu’un nouveau créneau est confirmé pour maintenir un planning fiable."
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
    "id": "roadmapMilestones",
    "type": "milestone_list",
    "question": "Quels jalons clés souhaitez-vous mettre en avant ?",
    "options": [],
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
    "guidance": {
      "objective": "Rendre visibles les étapes clés et les ‘gates’ de conformité.",
      "details": "Les jalons permettent de synchroniser les équipes (business, juridique, E&C, DPO, contrôle pub, communication externe) et de matérialiser les dépendances : contractualisation, validations de contenus, paramétrage privacy, revue locale, lancement pilote.",
      "tips": [
        "Ajoutez les jalons majeurs : cadrage, choix prestataire, signature contrat, validation contenus, validation privacy (si applicable), go‑live.",
        "Formulez des jalons actionnables (ex. ‘dossier compliance complet transmis’, ‘contrat signé’, ‘contenu validé contrôle pub’).",
        "Indiquez des dates réalistes ; si une date est incertaine, utilisez un jalon ‘mois/trim’ dans le descriptif."
      ]
    },
    "showcase": {
      "sections": [
        "timeline"
      ],
      "usage": "Liste de jalons personnalisés dans la section « Les prochains jalons »."
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
    ]
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
      "objective": "Capturer toute information complémentaire utile à l’évaluation (risques, contraintes, hypothèses).",
      "details": "Certaines informations ne rentrent pas dans les cases : hospitalité, contenus sensibles, contraintes IT, transferts de données, sujets réputationnels, gouvernance internationale, etc. Ce champ sert à prévenir les angles morts et à accélérer la prise de position des experts.",
      "tips": [
        "Mentionnez les éléments à risque : patients, PdS, agents publics, IA, réseaux sociaux, collecte de données, sujets sensibles.",
        "Précisez les hypothèses (budget, pays, partenaires) et ce qui reste à confirmer.",
        "Si vous avez déjà identifié des mesures de mitigation (modération Q&A, commentaires désactivés, anonymisation), indiquez-les."
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
    "id": "q15_copy",
    "type": "file",
    "question": "Avez-vous un document que vous souhaiteriez partager ?",
    "options": [],
    "required": false,
    "conditions": [],
    "conditionLogic": "all",
    "conditionGroups": [],
    "placeholder": "",
    "numberUnit": "",
    "guidance": {
      "objective": "Permettre aux experts de se baser sur des éléments concrets (brief, maquettes, programme, contrat, contenu) pour un avis plus rapide.",
      "details": "Les documents accélèrent la revue mais doivent rester conformes : éviter de partager des données personnelles inutiles (patients, PdS) ou des contenus protégés sans droit. Un document bien nommé et contextualisé facilite la traçabilité.",
      "tips": [
        "Donnez un nom explicite au fichier (type + projet + version + date).",
        "Avant dépôt, retirez/anonymisez toute donnée personnelle ou information sensible non nécessaire.",
        "Privilégiez des versions ‘revue’ (maquette, synopsis, programme) plutôt que des fichiers de travail incomplets."
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
      "objective": "Identifier les critères de sélection d’une agence adaptés au projet (compétences, budget, couverture, exigences compliance).",
      "details": "Le tri des critères aide à recommander des prestataires pertinents : capacité à produire du contenu scientifique conforme, expérience internationale, créativité, coût. En pharma, la capacité à travailler avec des validations (contrôle pub, médical, E&C, DPO) et à documenter les sources est souvent déterminante.",
      "tips": [
        "Classez les critères selon ce qui est non‑négociable pour votre projet (ex. contenu scientifique vs international).",
        "Si votre projet implique données personnelles ou digital, valorisez la maturité privacy/sécurité et la capacité à produire la documentation.",
        "Utilisez ‘sans importance’ pour les critères non pertinents afin d’affiner la recommandation."
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
