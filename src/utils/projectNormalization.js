import { initialQuestions } from '../data/questions.js';

export const normalizeProjectEntry = (
  project = {},
  fallbackQuestionsLength = initialQuestions.length
) => {
  const answers = typeof project.answers === 'object' && project.answers !== null
    ? project.answers
    : {};

  const computedTotalQuestions =
    typeof project.totalQuestions === 'number' && project.totalQuestions > 0
      ? project.totalQuestions
      : fallbackQuestionsLength > 0
        ? fallbackQuestionsLength
        : Object.keys(answers).length;

  const answeredQuestionsCount =
    typeof project.answeredQuestions === 'number'
      ? project.answeredQuestions
      : Object.keys(answers).length;

  let lastQuestionIndex =
    typeof project.lastQuestionIndex === 'number'
      ? project.lastQuestionIndex
      : computedTotalQuestions > 0
        ? computedTotalQuestions - 1
        : 0;

  if (computedTotalQuestions > 0) {
    lastQuestionIndex = Math.min(Math.max(lastQuestionIndex, 0), computedTotalQuestions - 1);
  }

  const lastUpdated = project.lastUpdated || project.submittedAt || null;
  const submittedAt = project.submittedAt || project.lastUpdated || null;

  return {
    status: 'submitted',
    ...project,
    status: project.status || 'submitted',
    lastUpdated,
    submittedAt,
    totalQuestions: computedTotalQuestions,
    answeredQuestions: Math.min(
      answeredQuestionsCount,
      computedTotalQuestions || answeredQuestionsCount
    ),
    lastQuestionIndex
  };
};

export const normalizeProjectsCollection = (
  projects,
  fallbackQuestionsLength = initialQuestions.length
) => {
  if (!Array.isArray(projects)) {
    return null;
  }

  return projects.map(project => normalizeProjectEntry(project, fallbackQuestionsLength));
};

