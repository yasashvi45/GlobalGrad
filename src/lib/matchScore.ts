export function calculateMatchScore(uni: any, userData: any): number | null {
  if (!userData) return null;
  // If user profile is not complete, return null
  if (!userData?.gpa && !userData?.ielts && !userData?.budget) return null;

  let score = 0;
  let maxScore = 0;

  // 1. Budget Match (Max 30)
  if (userData.budget && uni.tuitionUndergrad) {
    maxScore += 30;
    const userBudget = parseInt(userData.budget.replace(/[^0-9]/g, '')) || 0;
    const uniTuition = parseInt(uni.tuitionUndergrad) || 0;
    
    if (uniTuition <= userBudget) {
      score += 30;
    } else if (uniTuition <= userBudget * 1.2) {
      score += 20;
    } else if (uniTuition <= userBudget * 1.5) {
      score += 10;
    }
  }

  // 2. IELTS Math (Max 20)
  if (userData.ielts && uni.ieltsRequirement) {
    maxScore += 20;
    const userIelts = parseFloat(userData.ielts) || 0;
    const match = uni.ieltsRequirement.match(/([0-9.]+)/);
    const uniIelts = match ? parseFloat(match[1]) : 0;

    if (userIelts >= uniIelts) {
      score += 20;
    } else if (userIelts >= uniIelts - 0.5) {
      score += 10;
    }
  }

  // 3. GPA Match (Max 30)
  if (userData.gpa) {
    maxScore += 30;
    const userGpa = parseFloat(userData.gpa) || 0;
    // rough approximation based on acceptance rate
    const accRate = parseFloat(uni.acceptanceRate) || 100;
    
    if (userGpa >= 3.8) {
      score += 30;
    } else if (userGpa >= 3.5) {
      score += accRate < 30 ? 20 : 30;
    } else if (userGpa >= 3.0) {
       score += accRate < 50 ? 15 : 25;
    } else {
       score += accRate > 60 ? 20 : 0;
    }
  }

  // 4. Scholarship (Max 20)
  if (userData.requiresScholarship && uni.scholarshipsAvailable) {
    maxScore += 20;
    score += 20;
  } else if (!userData.requiresScholarship) {
    maxScore += 20;
    score += 20;
  }

  if (maxScore === 0) return null;
  return Math.round((score / maxScore) * 100);
}
