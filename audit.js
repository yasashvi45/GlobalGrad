import fs from 'fs';

const tsFile = fs.readFileSync('src/data/seedingUniversities.ts', 'utf8');

// The file might have both 'qsRank' and 'qsRanking', we should just make sure they're not duplicated if we rely on one.
// The user says: 
// 6. Detect duplicate fields.
// Example:
// World Ranking appears twice.

// Let's parse the universities and see what we have.
// Actually, writing a small regex to check for duplicate properties in the TS file or loading it.
