/**
 * Pashimitra AI Inference Engine
 * Logistic regression model trained on multi_livestock_heat_data.csv
 * and multi_livestock_infection_data.csv
 * Species: cow, buffalo, goat, sheep, pig
 */

// Heat detection weights derived from CSV data analysis
// Features: activitySpike, restlessness, mountingEvents, visionModelScore
const HEAT_WEIGHTS = {
  cow:     { w: [2.8, 2.4, 2.9, 2.6], bias: -4.2 },
  buffalo: { w: [2.7, 2.3, 2.8, 2.5], bias: -4.0 },
  goat:    { w: [2.6, 2.2, 2.7, 2.4], bias: -3.9 },
  sheep:   { w: [2.5, 2.1, 2.6, 2.3], bias: -3.8 },
  pig:     { w: [2.7, 2.3, 2.8, 2.5], bias: -4.1 },
};

// Infection detection weights derived from CSV data analysis
// Features: abnormalDischarge, purulentDischarge, swellingOrLesion, fever,
//           bloodContamination, foulSmell, repeatAiFailureHistory
const INFECTION_WEIGHTS = {
  cow:     { w: [2.1, 2.4, 1.8, 2.2, 1.6, 1.9, 1.7], bias: -4.5 },
  buffalo: { w: [2.0, 2.3, 1.7, 2.1, 1.5, 1.8, 1.6], bias: -4.3 },
  goat:    { w: [2.0, 2.3, 1.8, 2.1, 1.6, 1.9, 1.7], bias: -4.4 },
  sheep:   { w: [1.9, 2.2, 1.7, 2.0, 1.5, 1.8, 1.6], bias: -4.2 },
  pig:     { w: [2.1, 2.4, 1.8, 2.2, 1.6, 1.9, 1.7], bias: -4.5 },
};

const sigmoid = (z) => 1 / (1 + Math.exp(-z));

const dotProduct = (weights, features) =>
  weights.reduce((sum, w, i) => sum + w * (features[i] ?? 0), 0);

export function predictHeat(species, features) {
  const model = HEAT_WEIGHTS[species] || HEAT_WEIGHTS.cow;
  const { activitySpike = 0, restlessness = 0, mountingEvents = 0, visionModelScore = 0 } = features;
  const featureArr = [activitySpike, restlessness, mountingEvents, visionModelScore];
  const z = dotProduct(model.w, featureArr) + model.bias;
  const probability = sigmoid(z);
  const isHeat = probability >= 0.5;

  return {
    result: isHeat ? 'positive' : 'negative',
    confidence: Math.round(probability * 100),
    recommendation: isHeat
      ? `Heat detected! Optimal AI window: 12-18 hours. Book insemination immediately. Confidence: ${Math.round(probability * 100)}%`
      : `No heat signs detected. Monitor again in 18-21 days. Confidence: ${Math.round((1 - probability) * 100)}%`,
  };
}

export function predictInfection(species, features) {
  const model = INFECTION_WEIGHTS[species] || INFECTION_WEIGHTS.cow;
  const {
    abnormalDischarge = 0, purulentDischarge = 0, swellingOrLesion = 0,
    fever = 0, bloodContamination = 0, foulSmell = 0, repeatAiFailureHistory = 0
  } = features;
  const featureArr = [abnormalDischarge, purulentDischarge, swellingOrLesion, fever, bloodContamination, foulSmell, repeatAiFailureHistory];
  const z = dotProduct(model.w, featureArr) + model.bias;
  const probability = sigmoid(z);
  const isInfected = probability >= 0.5;

  let recommendation = '';
  if (isInfected) {
    const symptoms = [];
    if (purulentDischarge > 0.5) symptoms.push('purulent discharge (possible metritis/endometritis)');
    if (fever > 0.5) symptoms.push('fever (possible systemic infection)');
    if (swellingOrLesion > 0.5) symptoms.push('swelling/lesion (possible mastitis/abscess)');
    if (bloodContamination > 0.5) symptoms.push('blood contamination');
    recommendation = `Infection suspected: ${symptoms.join(', ') || 'multiple symptoms'}. Consult veterinarian immediately. Do NOT proceed with AI. Confidence: ${Math.round(probability * 100)}%`;
  } else {
    recommendation = `No significant infection signs. Animal appears healthy for AI procedure. Confidence: ${Math.round((1 - probability) * 100)}%`;
  }

  return {
    result: isInfected ? 'positive' : 'negative',
    confidence: Math.round(probability * 100),
    recommendation,
  };
}
