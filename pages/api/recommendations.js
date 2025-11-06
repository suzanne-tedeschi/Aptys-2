import { engine } from '../../lib/recommendationEngine';

export default async function handler(req, res){
  if(req.method !== 'POST') return res.status(405).end();
  const input = req.body || {};
  
  // Normaliser les données d'entrée - PASSER TOUTES LES DONNÉES
  const normalized = {
    // Données de base
    age: input.age ? parseInt(input.age) : 0,
    sex: input.sex || '',
    bmi: input.bmi ? parseFloat(input.bmi) : 0,
    weight: input.weight ? parseFloat(input.weight) : 0,
    height: input.height ? parseFloat(input.height) : 0,
    
    // Tabagisme
    smoker: input.smoker || false,
    smokingStatus: input.smokingStatus || '',
    smokingPackYears: input.smokingPackYears ? parseFloat(input.smokingPackYears) : 0,
    smokingYears: input.smokingYears ? parseInt(input.smokingYears) : 0,
    cigarettesPerDay: input.cigarettesPerDay ? parseInt(input.cigarettesPerDay) : 0,
    
    // Habitudes de vie
    alcohol: input.alcohol || '',
    physicalActivity: input.physicalActivity || '',
    diet: input.diet || '',
    
    // Maladies chroniques
    chronicDiseases: Array.isArray(input.chronicDiseases) ? input.chronicDiseases : [],
    pastSurgeries: Array.isArray(input.pastSurgeries) ? input.pastSurgeries : [],
    currentMedications: Array.isArray(input.currentMedications) ? input.currentMedications : [],
    allergies: Array.isArray(input.allergies) ? input.allergies : [],
    
    // Facteurs cardiovasculaires
    hypertension: input.hypertension || false,
    cholesterol: input.cholesterol || false,
    diabetes: input.diabetes || false,
    heartDisease: input.heartDisease || false,
    
    // Antécédents familiaux (maternel ET paternel)
    familyHistory: {
      maternal: input.familyHistory?.maternal || {},
      paternal: input.familyHistory?.paternal || {}
    },
    
    // Santé reproductive (femmes)
    pregnancies: input.pregnancies ? parseInt(input.pregnancies) : 0,
    menopauseAge: input.menopauseAge ? parseInt(input.menopauseAge) : 0,
    hormonalTreatment: input.hormonalTreatment || false,
    breastfeeding: input.breastfeeding ? parseInt(input.breastfeeding) : 0,
    hormonalContraception: input.hormonalContraception || 'never',
    hormonalContraceptionYears: input.hormonalContraceptionYears ? parseInt(input.hormonalContraceptionYears) : 0,
    
    // Dépistages déjà effectués
    screenings: input.screenings || {},
    
    // Expositions environnementales
    occupationalExposure: Array.isArray(input.occupationalExposure) ? input.occupationalExposure : [],
    sunExposure: input.sunExposure || '',
    vaccinationStatus: input.vaccinationStatus || '',
    travelHistory: input.travelHistory || ''
  };
  
  // Appeler le moteur de recommandations
  const recs = engine(normalized);
  
  // S'assurer qu'aucune recommandation ne manque d'intervalle ou de source
  const filtered = recs.filter(r => r.interval && r.source);
  
  res.json(filtered);
}
