export interface MatchResult {
    score: number;
    matchedRequired: string[];
    missingRequired: string[];
    matchedDesirable: string[];
    missingDesirable: string[];
}

export function calculateMatch(
    userSkills: string[] = [],
    requiredSkills: string[] = [],
    desirableSkills: string[] = []
) : MatchResult {
    // Limpador de strings: para remover espaços, pontos, hifens e deixar tudo minusculo
    const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');

    const normalizedUserSkills = userSkills.map(normalize);

    // Verificar skills obrigatórias
    const matchedRequired = requiredSkills.filter(skill => normalizedUserSkills.includes(normalize(skill)));
    const missingRequired = requiredSkills.filter(skill => !normalizedUserSkills.includes(normalize(skill)));

    // Verificar skills desejáveis (diferenciais)
    const matchedDesirable = desirableSkills.filter(skill => normalizedUserSkills.includes(normalize(skill)));
    const missingDesirable = desirableSkills.filter(skill => !normalizedUserSkills.includes(normalize(skill)));

    // Sistema de pesos 80/20
    // Mas se as vagas não tiver desejáveis, as obrigatórias irão valer 100%
    const weightRequired = desirableSkills.length > 0 ? 80 : 100;
    const weightDesirable = desirableSkills.length > 0 ? 20 : 0;

    const requiredScore = requiredSkills.length > 0 
    ? (matchedRequired.length / requiredSkills.length) * weightRequired : weightRequired;

    const desirableScore = desirableSkills.length > 0 ? (matchedDesirable.length / desirableSkills.length) * weightDesirable : 0;

    // Garante que a nota máxima não passe de 100
    const totalScore = Math.min(Math.round(requiredScore + desirableScore), 100);

    return {
        score: totalScore,
        matchedRequired,
        missingRequired,
        matchedDesirable,
        missingDesirable,
    };
}