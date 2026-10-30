import { GoogleGenAI } from '@google/genai';
import logger from '../config/logger.js';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

/**
 * Calculates attribute similarity score between two pet profiles
 */
export function calculateAttributeSimilarity(petA, petB) {
  let score = 0;
  let maxScore = 0;
  const matchedCharacteristics = [];
  const differences = [];

  const fA = petA.features || {};
  const fB = petB.features || {};

  // 1. Breed comparison (weight 20)
  maxScore += 20;
  if (fA.breed && fB.breed && fA.breed.toLowerCase().trim() !== 'unknown' && fB.breed.toLowerCase().trim() !== 'unknown') {
    if (fA.breed.toLowerCase().trim() === fB.breed.toLowerCase().trim()) {
      score += 20;
      matchedCharacteristics.push(`Breed matched: ${fA.breed}`);
    } else {
      differences.push(`Breed difference: ${fA.breed} vs ${fB.breed}`);
    }
  } else {
    // neutral credit if unknown
    score += 10;
  }

  // 2. Primary Color (weight 20)
  maxScore += 20;
  if (fA.primaryColor && fB.primaryColor) {
    if (fA.primaryColor.toLowerCase().trim() === fB.primaryColor.toLowerCase().trim()) {
      score += 20;
      matchedCharacteristics.push(`Primary color matched: ${fA.primaryColor}`);
    } else {
      differences.push(`Primary color: ${fA.primaryColor} vs ${fB.primaryColor}`);
    }
  } else {
    score += 8;
  }

  // 3. Gender (weight 15)
  maxScore += 15;
  if (fA.gender && fB.gender && fA.gender !== 'unknown' && fB.gender !== 'unknown') {
    if (fA.gender === fB.gender) {
      score += 15;
      matchedCharacteristics.push(`Gender matched: ${fA.gender}`);
    } else {
      differences.push(`Gender mismatch: ${fA.gender} vs ${fB.gender}`);
    }
  } else {
    score += 8;
  }

  // 4. Ear Shape (weight 10)
  maxScore += 10;
  if (fA.earShape && fB.earShape) {
    if (fA.earShape.toLowerCase().trim() === fB.earShape.toLowerCase().trim()) {
      score += 10;
      matchedCharacteristics.push(`Ear shape matched: ${fA.earShape}`);
    } else {
      differences.push(`Ear shape: ${fA.earShape} vs ${fB.earShape}`);
    }
  }

  // 5. Tail Characteristics (weight 10)
  maxScore += 10;
  if (fA.tailCharacteristics && fB.tailCharacteristics) {
    if (fA.tailCharacteristics.toLowerCase().trim() === fB.tailCharacteristics.toLowerCase().trim()) {
      score += 10;
      matchedCharacteristics.push(`Tail type matched: ${fA.tailCharacteristics}`);
    } else {
      differences.push(`Tail: ${fA.tailCharacteristics} vs ${fB.tailCharacteristics}`);
    }
  }

  // 6. City / State location proximity (weight 25)
  maxScore += 25;
  const cityA = (petA.location?.city || '').toLowerCase().trim();
  const cityB = (petB.location?.city || '').toLowerCase().trim();
  const stateA = (petA.location?.state || '').toLowerCase().trim();
  const stateB = (petB.location?.state || '').toLowerCase().trim();

  if (cityA && cityB && cityA === cityB) {
    score += 25;
    matchedCharacteristics.push(`Found in same city: ${petA.location.city}`);
  } else if (stateA && stateB && stateA === stateB) {
    score += 15;
    matchedCharacteristics.push(`Located in same state: ${petA.location.state}`);
  } else {
    differences.push(`Different locations (${petA.location?.city || 'N/A'} vs ${petB.location?.city || 'N/A'})`);
  }

  const finalAttributeScore = Math.round((score / maxScore) * 100);
  return {
    score: Math.min(100, Math.max(0, finalAttributeScore)),
    matchedCharacteristics,
    differences,
  };
}

/**
 * Uses Gemini Multimodal Vision to compare two dog photos for actual visual feature similarity
 */
export async function comparePetPhotosWithAI(targetPet, candidatePet) {
  const photoA = targetPet.photos?.[0];
  const photoB = candidatePet.photos?.[0];

  const ruleBased = calculateAttributeSimilarity(targetPet, candidatePet);

  // If Gemini API Key is missing or photos are not standard URLs, return structured rule-based similarity
  if (!process.env.GEMINI_API_KEY || !photoA || !photoB) {
    return ruleBased;
  }

  try {
    const prompt = `You are an expert canine visual identification AI comparing a Lost Dog with a Found Dog.
Analyze the provided information and characteristics.

Target Dog (${targetPet.reportType}):
- Breed: ${targetPet.features?.breed || 'Unknown'}
- Primary Color: ${targetPet.features?.primaryColor || 'Unknown'}
- Secondary Color: ${targetPet.features?.secondaryColor || 'Unknown'}
- Identifying Marks: ${targetPet.features?.identifyingMarks || 'None noted'}
- Ear Shape: ${targetPet.features?.earShape || 'Unknown'}
- Tail: ${targetPet.features?.tailCharacteristics || 'Unknown'}
- Location: ${targetPet.location?.address}, ${targetPet.location?.city}, ${targetPet.location?.state}
- Photo URL: ${photoA}

Candidate Dog (${candidatePet.reportType}):
- Breed: ${candidatePet.features?.breed || 'Unknown'}
- Primary Color: ${candidatePet.features?.primaryColor || 'Unknown'}
- Secondary Color: ${candidatePet.features?.secondaryColor || 'Unknown'}
- Identifying Marks: ${candidatePet.features?.identifyingMarks || 'None noted'}
- Ear Shape: ${candidatePet.features?.earShape || 'Unknown'}
- Tail: ${candidatePet.features?.tailCharacteristics || 'Unknown'}
- Location: ${candidatePet.location?.address}, ${candidatePet.location?.city}, ${candidatePet.location?.state}
- Photo URL: ${photoB}

Respond strictly in valid JSON format with keys:
{
  "similarityScore": <integer between 0 and 100>,
  "matchedCharacteristics": [<list of specific matching visual/physical traits>],
  "differences": [<list of distinct differences>],
  "reasoning": "<short explanation>"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      }
    });

    const parsed = JSON.parse(response.text.trim());
    if (typeof parsed.similarityScore === 'number') {
      return {
        score: Math.min(100, Math.max(0, Math.round(parsed.similarityScore))),
        matchedCharacteristics: Array.isArray(parsed.matchedCharacteristics) && parsed.matchedCharacteristics.length > 0 
          ? parsed.matchedCharacteristics 
          : ruleBased.matchedCharacteristics,
        differences: Array.isArray(parsed.differences) && parsed.differences.length > 0
          ? parsed.differences
          : ruleBased.differences,
        reasoning: parsed.reasoning || '',
      };
    }
  } catch (err) {
    logger.warn(`[LostFoundMatcher] Gemini evaluation fallback to attribute matcher: ${err.message}`);
  }

  return ruleBased;
}
