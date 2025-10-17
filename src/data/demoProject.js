import { initialQuestions } from './questions.js';
import { initialRules } from './rules.js';
import { analyzeAnswers } from '../utils/rules.js';

const demoProjectAnswers = {
  projectName: 'Campagne Aura',
  projectSlogan: 'Illuminer chaque lancement produit',
  targetAudience: [
    'Grand public / clients finaux',
    'Investisseurs',
    'Partenaires ou prescripteurs'
  ],
  problemPainPoints:
    '• Les équipes ont besoin d’un récit unifié pour coordonner leurs prises de parole.\n• Les preuves clients doivent être centralisées pour soutenir les validations compliance.\n• Les partenaires réclament des assets prêts à l’emploi pour activer rapidement leurs réseaux.',
  solutionDescription:
    "Nous construisons une narration immersive combinant démonstrations live, contenus interactifs et preuves sociales activables par chaque équipe locale.",
  solutionBenefits:
    '• +35 % d’intention d’achat mesurée lors des tests pré-lancement.\n• Bibliothèque d’assets localisés livrée en 4 semaines.\n• Plan média multi-pays orchestré avec les partenaires retail.',
  solutionComparison:
    'Contrairement aux campagnes précédentes, Aura intègre dès le départ les besoins des partenaires et un plan de preuves dynamique, évitant les validations tardives.',
  innovationProcess:
    '1. Sprint storytelling de 5 jours pour cadrer le pitch.\n2. Production collaborative des assets avec validations hebdomadaires.\n3. Activation omnicanale pilotée par un cockpit partagé.',
  visionStatement:
    '• Taux de conformité validé dès le premier passage.\n• Score de satisfaction partenaires supérieur à 4/5.\n• +30 % d’engagement sur les contenus du reveal.',
  campaignKickoffDate: '2024-01-15',
  launchDate: '2024-04-15',
  teamLead: 'Clara Dupont — Head of Narrative Design',
  teamLeadTeam: 'Marketing',
  teamCoreMembers:
    'Lina Morel — Product marketing lead\nHugo Martin — Data & Growth strategist\nNoémie Laurent — Partnerships manager',
};

const DEMO_TIMESTAMP = '2024-04-18T09:00:00.000Z';

export const createDemoProject = ({ questions = initialQuestions, rules = initialRules } = {}) => {
  const analysis = analyzeAnswers(demoProjectAnswers, rules);
  const totalQuestions = Array.isArray(questions) ? questions.length : Object.keys(demoProjectAnswers).length;
  const sanitizedTotal = totalQuestions > 0 ? totalQuestions : Object.keys(demoProjectAnswers).length;

  return {
    id: 'demo-project',
    projectName: demoProjectAnswers.projectName,
    answers: { ...demoProjectAnswers },
    analysis,
    status: 'submitted',
    lastUpdated: DEMO_TIMESTAMP,
    submittedAt: DEMO_TIMESTAMP,
    lastQuestionIndex: sanitizedTotal > 0 ? sanitizedTotal - 1 : 0,
    totalQuestions: sanitizedTotal,
    answeredQuestions: sanitizedTotal,
    isDemo: true
  };
};

export const demoProjectAnswersSnapshot = { ...demoProjectAnswers };
