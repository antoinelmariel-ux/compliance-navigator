export const extractProjectName = (answers, questions) => {
  if (!answers || !questions) {
    return '';
  }

  const preferredKeys = ['projectName', 'project_name', 'nomProjet', 'nom_projet'];

  for (const key of preferredKeys) {
    const value = answers[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
  }

  const matchingQuestion = questions.find(question => {
    if (!question || !question.question) {
      return false;
    }

    const text = question.question.toLowerCase();
    return (
      text.includes('nom') &&
      text.includes('projet') &&
      typeof answers[question.id] === 'string' &&
      answers[question.id].trim() !== ''
    );
  });

  if (matchingQuestion) {
    return answers[matchingQuestion.id].trim();
  }

  return '';
};
