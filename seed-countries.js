const fs = require('fs');

const dbPath = './database.json';
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

db.countries = [
  { 
    id: 1, name: "USA", region: "North America", costOfLiving: 2000, avgTuition: 45000, prDifficulty: "Very Hard",
    gradSalary: 85000, partTimeWork: "20 hrs/week (on-campus)", postStudyVisa: "1-3 Years (OPT)", englishReq: "High",
    safetyScore: 78, studentSatisfaction: 92, weather: "Varied", scholarshipAvail: "High", visaDifficulty: "Hard",
    image: "https://images.unsplash.com/photo-1449844908441-8829872d2607?auto=format&fit=crop&q=80&w=800",
    topUniversities: "MIT, Stanford, Harvard, Caltech",
    flag: "🇺🇸"
  },
  { 
    id: 2, name: "UK", region: "Europe", costOfLiving: 1500, avgTuition: 30000, prDifficulty: "Hard",
    gradSalary: 55000, partTimeWork: "20 hrs/week", postStudyVisa: "2 Years (Graduate Route)", englishReq: "High",
    safetyScore: 82, studentSatisfaction: 90, weather: "Temperate", scholarshipAvail: "Medium", visaDifficulty: "Medium",
    image: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&q=80&w=800",
    topUniversities: "Oxford, Cambridge, Imperial, UCL",
    flag: "🇬🇧"
  },
  { 
    id: 3, name: "Canada", region: "North America", costOfLiving: 1800, avgTuition: 25000, prDifficulty: "Easy",
    gradSalary: 60000, partTimeWork: "20 hrs/week", postStudyVisa: "Up to 3 Years (PGWP)", englishReq: "Medium",
    safetyScore: 88, studentSatisfaction: 95, weather: "Cold", scholarshipAvail: "Medium", visaDifficulty: "Medium",
    image: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&q=80&w=800",
    topUniversities: "Toronto, McGill, UBC, McMaster",
    flag: "🇨🇦"
  },
  { 
    id: 4, name: "Australia", region: "Oceania", costOfLiving: 1900, avgTuition: 28000, prDifficulty: "Medium",
    gradSalary: 65000, partTimeWork: "48 hrs/fortnight", postStudyVisa: "2-4 Years (PSW)", englishReq: "High",
    safetyScore: 90, studentSatisfaction: 94, weather: "Warm", scholarshipAvail: "High", visaDifficulty: "Medium",
    image: "https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?auto=format&fit=crop&q=80&w=800",
    topUniversities: "Melbourne, Sydney, UNSW, ANU",
    flag: "🇦🇺"
  },
  { 
    id: 5, name: "Germany", region: "Europe", costOfLiving: 1200, avgTuition: 1500, prDifficulty: "Medium",
    gradSalary: 70000, partTimeWork: "120 full days/year", postStudyVisa: "1.5 Years", englishReq: "Low (if German taught)",
    safetyScore: 92, studentSatisfaction: 91, weather: "Temperate", scholarshipAvail: "Low", visaDifficulty: "Medium",
    image: "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&q=80&w=800",
    topUniversities: "TUM, LMU, Heidelberg, RWTH Aachen",
    flag: "🇩🇪"
  },
  { 
    id: 6, name: "Japan", region: "Asia", costOfLiving: 1400, avgTuition: 8000, prDifficulty: "Medium",
    gradSalary: 50000, partTimeWork: "28 hrs/week", postStudyVisa: "1 Year", englishReq: "Low (Japanese required)",
    safetyScore: 96, studentSatisfaction: 93, weather: "Temperate", scholarshipAvail: "High", visaDifficulty: "Hard",
    image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&q=80&w=800",
    topUniversities: "Tokyo, Kyoto, Osaka, Tohoku",
    flag: "🇯🇵"
  },
  { 
    id: 7, name: "Ireland", region: "Europe", costOfLiving: 1700, avgTuition: 22000, prDifficulty: "Medium",
    gradSalary: 62000, partTimeWork: "20 hrs/week", postStudyVisa: "2 Years", englishReq: "High",
    safetyScore: 89, studentSatisfaction: 96, weather: "Temperate", scholarshipAvail: "Medium", visaDifficulty: "Easy",
    image: "https://images.unsplash.com/photo-1590089415225-401ed6f9db8e?auto=format&fit=crop&q=80&w=800",
    topUniversities: "Trinity College, UCD, University of Galway",
    flag: "🇮🇪"
  },
  { 
    id: 8, name: "Netherlands", region: "Europe", costOfLiving: 1600, avgTuition: 18000, prDifficulty: "Medium",
    gradSalary: 68000, partTimeWork: "16 hrs/week", postStudyVisa: "1 Year (Orientation Year)", englishReq: "High",
    safetyScore: 91, studentSatisfaction: 95, weather: "Temperate", scholarshipAvail: "Medium", visaDifficulty: "Easy",
    image: "https://images.unsplash.com/photo-1468436385273-8abca6dfd8d3?auto=format&fit=crop&q=80&w=800",
    topUniversities: "Amsterdam, Delft, Wageningen, Leiden",
    flag: "🇳🇱"
  }
];

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

const srcDbPath = './src/lib/db.ts';
let srcDb = fs.readFileSync(srcDbPath, 'utf8');
srcDb = srcDb.replace(/  countries: \[\s*\{[\s\S]*\}\s*\],\s*scholarships:/, `  countries: ${JSON.stringify(db.countries, null, 4)},\n  scholarships:`);
fs.writeFileSync(srcDbPath, srcDb);

console.log('Countries seeded successfully.');
