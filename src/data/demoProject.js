import { initialQuestions } from './questions.js';
import { initialRules } from './rules.js';
import { initialRiskLevelRules } from './riskLevelRules.js';
import { analyzeAnswers } from '../utils/rules.js';

const demoProjectAnswers = {
  projectName: 'Campagne Aura',
  projectSlogan: 'Synchroniser chaque prise de parole autour d’Aura',
  targetAudience: [
    'Grand public / clients finaux',
    'Décideurs internes / sponsors',
    'Investisseurs',
    'Partenaires ou prescripteurs'
  ],
  problemPainPoints:
    '• Les contenus de lancement varient selon les pays et génèrent des allers-retours compliance.\n• Les données d’impact sont dispersées et ralentissent les validations investisseurs.\n• Les partenaires retail manquent d’assets co-brandés prêts à diffuser.',
  solutionDescription:
    'Aura consolide une narration immersive avec démonstrations interactives, argumentaires validés et assets localisables en quelques clics.',
  solutionBenefits:
    '• 40 % de réduction du temps de validation compliance grâce à un kit unique par audience.\n• +28 % d’intention d’achat mesurée lors des tests de storytelling.\n• Activation partenaires accélérée avec 20 assets prêts à l’emploi dès J+30.',
  solutionComparison:
    'Contrairement aux précédentes campagnes fragmentées, Aura s’appuie sur des scripts unifiés et une bibliothèque certifiée compliance accessible par chaque marché.',
  innovationProcess:
    '• Aligner 100 % des messages clés sur un récit validé par la compliance avant la phase média.\n• Industrialiser la production d’assets localisés pour 8 pays en moins de 6 semaines.\n• Outiller les partenaires avec un kit d’activation prêt à diffuser dès le pré-lancement.',
  visionStatement:
    '• Taux de conformité validé dès la première revue.\n• Score d’adhésion partenaires supérieur à 4,5/5.\n• +30 % d’engagement sur les contenus reveal à J+7.',
  campaignKickoffDate: '2024-01-22',
  launchDate: '2024-04-22',
  roadmapMilestones: [
    {
      date: '2024-02-05',
      description: 'Atelier de cadrage narratif et validation des claims compliance.'
    },
    {
      date: '2024-03-08',
      description: 'Production localisée des assets et revue investisseurs avec l’équipe Growth.'
    },
    {
      date: '2024-04-05',
      description: 'Pré-lancement partenaires : kit co-brandé et plan média finalisé.'
    }
  ],
  teamLead: 'Clara Dupont — Head of Narrative Design & Compliance',
  teamLeadTeam: 'Marketing',
  teamCoreMembers:
    'Sofia Bernard — Storytelling & Brand lead\nHugo Martin — Growth & Impact strategist\nNoémie Laurent — Partnerships manager\nYanis Delcourt — Product Experience producer',
};

const DEMO_TIMESTAMP = '2024-05-02T10:00:00.000Z';

export const createDemoProject = ({
  questions = initialQuestions,
  rules = initialRules,
  riskLevelRules = initialRiskLevelRules
} = {}) => {
  const analysis = analyzeAnswers(demoProjectAnswers, rules, riskLevelRules);
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
