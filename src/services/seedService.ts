import { doc, getDocs, collection, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';

const COUNTRIES = [
  { id: 'cd-1', name: 'Australia', code: 'AU', currency: 'AUD', currencySymbol: '$', avgTuition: '$20,000 - $45,000', livingCost: '$21,041/year', postStudyWork: '2-4 years', acceptanceRate: '65', description: 'Renowned for its practical education system and high quality of life.', regions: ['New South Wales', 'Victoria', 'Queensland'] },
  { id: 'cd-2', name: 'Canada', code: 'CA', currency: 'CAD', currencySymbol: '$', avgTuition: '$15,000 - $35,000', livingCost: '$10,000 - $15,000/year', postStudyWork: 'Up to 3 years', acceptanceRate: '70', description: 'Known for its multicultural society and excellent post-study work opportunities.', regions: ['Ontario', 'British Columbia', 'Quebec'] },
  { id: 'cd-3', name: 'United States', code: 'US', currency: 'USD', currencySymbol: '$', avgTuition: '$25,000 - $55,000', livingCost: '$15,000 - $25,000/year', postStudyWork: '1-3 years (OPT)', acceptanceRate: '55', description: 'Home to the world\'s top-ranked universities and diverse technological hubs.', regions: ['California', 'New York', 'Texas'] },
  { id: 'cd-4', name: 'United Kingdom', code: 'GB', currency: 'GBP', currencySymbol: '£', avgTuition: '£12,000 - £25,000', livingCost: '£12,000 - £15,000/year', postStudyWork: '2 years', acceptanceRate: '68', description: 'Offers rich academic history and globally recognized degree programs.', regions: ['England', 'Scotland', 'Wales'] },
  { id: 'cd-5', name: 'Germany', code: 'DE', currency: 'EUR', currencySymbol: '€', avgTuition: 'Free - €3,000', livingCost: '€11,208/year', postStudyWork: '18 months', acceptanceRate: '75', description: 'Offers strong engineering programs and virtually tuition-free education at public universities.', regions: ['Bavaria', 'Berlin', 'Baden-Württemberg'] },
  { id: 'cd-6', name: 'Ireland', code: 'IE', currency: 'EUR', currencySymbol: '€', avgTuition: '€10,000 - €25,000', livingCost: '€12,000 - €15,000/year', postStudyWork: '2 years', acceptanceRate: '72', description: 'A thriving tech hub in Europe with a friendly English-speaking environment.', regions: ['Dublin', 'Cork', 'Galway'] },
  { id: 'cd-7', name: 'New Zealand', code: 'NZ', currency: 'NZD', currencySymbol: '$', avgTuition: '$22,000 - $35,000', livingCost: '$15,000 - $20,000/year', postStudyWork: 'Up to 3 years', acceptanceRate: '80', description: 'Famous for its picturesque landscapes and research-focused universities.', regions: ['Auckland', 'Wellington', 'Canterbury'] },
  { id: 'cd-8', name: 'Singapore', code: 'SG', currency: 'SGD', currencySymbol: '$', avgTuition: '$15,000 - $30,000', livingCost: '$12,000 - $20,000/year', postStudyWork: '1 year', acceptanceRate: '60', description: 'A massive global financial hub offering world-class education in Asia.', regions: ['Singapore'] },
  { id: 'cd-9', name: 'France', code: 'FR', currency: 'EUR', currencySymbol: '€', avgTuition: '€2,770 - €10,000', livingCost: '€10,000 - €14,000/year', postStudyWork: '2 years', acceptanceRate: '68', description: 'Known for excellence in arts, business, and affordable higher education.', regions: ['Île-de-France', 'Auvergne-Rhône-Alpes'] },
  { id: 'cd-10', name: 'Netherlands', code: 'NL', currency: 'EUR', currencySymbol: '€', avgTuition: '€8,000 - €20,000', livingCost: '€12,000 - €15,000/year', postStudyWork: '1 year', acceptanceRate: '65', description: 'Innovative teaching methods and a high number of English-taught programs.', regions: ['North Holland', 'South Holland'] }
];

const UNIVERSITIES = [
  // Australia (5)
  { id: 'uni-1', countryId: 'cd-1', country: 'Australia', name: 'University of Melbourne', city: 'Melbourne', ranking: '14', acceptanceRate: '70', type: 'Public', avgTuition: '$34,000' },
  { id: 'uni-2', countryId: 'cd-1', country: 'Australia', name: 'University of Sydney', city: 'Sydney', ranking: '19', acceptanceRate: '65', type: 'Public', avgTuition: '$36,000' },
  { id: 'uni-3', countryId: 'cd-1', country: 'Australia', name: 'UNSW Sydney', city: 'Sydney', ranking: '19', acceptanceRate: '60', type: 'Public', avgTuition: '$35,000' },
  { id: 'uni-4', countryId: 'cd-1', country: 'Australia', name: 'Australian National University', city: 'Canberra', ranking: '34', acceptanceRate: '75', type: 'Public', avgTuition: '$33,000' },
  { id: 'uni-5', countryId: 'cd-1', country: 'Australia', name: 'Monash University', city: 'Melbourne', ranking: '42', acceptanceRate: '80', type: 'Public', avgTuition: '$32,000' },
  // Canada (5)
  { id: 'uni-6', countryId: 'cd-2', country: 'Canada', name: 'University of Toronto', city: 'Toronto', ranking: '21', acceptanceRate: '43', type: 'Public', avgTuition: 'CAD 60,000' },
  { id: 'uni-7', countryId: 'cd-2', country: 'Canada', name: 'McGill University', city: 'Montreal', ranking: '30', acceptanceRate: '46', type: 'Public', avgTuition: 'CAD 25,000' },
  { id: 'uni-8', countryId: 'cd-2', country: 'Canada', name: 'University of British Columbia', city: 'Vancouver', ranking: '34', acceptanceRate: '52', type: 'Public', avgTuition: 'CAD 42,000' },
  { id: 'uni-9', countryId: 'cd-2', country: 'Canada', name: 'University of Alberta', city: 'Edmonton', ranking: '111', acceptanceRate: '58', type: 'Public', avgTuition: 'CAD 29,000' },
  { id: 'uni-10', countryId: 'cd-2', country: 'Canada', name: 'University of Waterloo', city: 'Waterloo', ranking: '112', acceptanceRate: '53', type: 'Public', avgTuition: 'CAD 45,000' },
  // USA (10)
  { id: 'uni-11', countryId: 'cd-3', country: 'United States', name: 'Massachusetts Institute of Technology (MIT)', city: 'Cambridge', ranking: '1', acceptanceRate: '4', type: 'Private', avgTuition: '$55,000' },
  { id: 'uni-12', countryId: 'cd-3', country: 'United States', name: 'Stanford University', city: 'Stanford', ranking: '3', acceptanceRate: '4', type: 'Private', avgTuition: '$56,000' },
  { id: 'uni-13', countryId: 'cd-3', country: 'United States', name: 'Harvard University', city: 'Cambridge', ranking: '4', acceptanceRate: '4', type: 'Private', avgTuition: '$54,000' },
  { id: 'uni-14', countryId: 'cd-3', country: 'United States', name: 'California Institute of Technology', city: 'Pasadena', ranking: '6', acceptanceRate: '6', type: 'Private', avgTuition: '$58,000' },
  { id: 'uni-15', countryId: 'cd-3', country: 'United States', name: 'University of Chicago', city: 'Chicago', ranking: '11', acceptanceRate: '6', type: 'Private', avgTuition: '$60,000' },
  { id: 'uni-16', countryId: 'cd-3', country: 'United States', name: 'University of Pennsylvania', city: 'Philadelphia', ranking: '12', acceptanceRate: '8', type: 'Private', avgTuition: '$55,000' },
  { id: 'uni-17', countryId: 'cd-3', country: 'United States', name: 'Cornell University', city: 'Ithaca', ranking: '13', acceptanceRate: '10', type: 'Private', avgTuition: '$58,000' },
  { id: 'uni-18', countryId: 'cd-3', country: 'United States', name: 'Yale University', city: 'New Haven', ranking: '16', acceptanceRate: '5', type: 'Private', avgTuition: '$57,000' },
  { id: 'uni-19', countryId: 'cd-3', country: 'United States', name: 'Columbia University', city: 'New York', ranking: '23', acceptanceRate: '5', type: 'Private', avgTuition: '$61,000' },
  { id: 'uni-20', countryId: 'cd-3', country: 'United States', name: 'New York University', city: 'New York', ranking: '38', acceptanceRate: '12', type: 'Private', avgTuition: '$56,000' },
  // UK (5)
  { id: 'uni-21', countryId: 'cd-4', country: 'United Kingdom', name: 'University of Cambridge', city: 'Cambridge', ranking: '2', acceptanceRate: '21', type: 'Public', avgTuition: '£30,000' },
  { id: 'uni-22', countryId: 'cd-4', country: 'United Kingdom', name: 'University of Oxford', city: 'Oxford', ranking: '3', acceptanceRate: '17', type: 'Public', avgTuition: '£32,000' },
  { id: 'uni-23', countryId: 'cd-4', country: 'United Kingdom', name: 'Imperial College London', city: 'London', ranking: '6', acceptanceRate: '14', type: 'Public', avgTuition: '£34,000' },
  { id: 'uni-24', countryId: 'cd-4', country: 'United Kingdom', name: 'UCL', city: 'London', ranking: '9', acceptanceRate: '16', type: 'Public', avgTuition: '£29,000' },
  { id: 'uni-25', countryId: 'cd-4', country: 'United Kingdom', name: 'University of Edinburgh', city: 'Edinburgh', ranking: '22', acceptanceRate: '40', type: 'Public', avgTuition: '£25,000' },
  // Germany (5)
  { id: 'uni-26', countryId: 'cd-5', country: 'Germany', name: 'Technical University of Munich', city: 'Munich', ranking: '37', acceptanceRate: '8', type: 'Public', avgTuition: '€0' },
  { id: 'uni-27', countryId: 'cd-5', country: 'Germany', name: 'LMU Munich', city: 'Munich', ranking: '54', acceptanceRate: '10', type: 'Public', avgTuition: '€0' },
  { id: 'uni-28', countryId: 'cd-5', country: 'Germany', name: 'Heidelberg University', city: 'Heidelberg', ranking: '87', acceptanceRate: '15', type: 'Public', avgTuition: '€0' },
  { id: 'uni-29', countryId: 'cd-5', country: 'Germany', name: 'Freie Universität Berlin', city: 'Berlin', ranking: '98', acceptanceRate: '15', type: 'Public', avgTuition: '€0' },
  { id: 'uni-30', countryId: 'cd-5', country: 'Germany', name: 'RWTH Aachen University', city: 'Aachen', ranking: '106', acceptanceRate: '10', type: 'Public', avgTuition: '€0' },
  // Ireland (5)
  { id: 'uni-31', countryId: 'cd-6', country: 'Ireland', name: 'Trinity College Dublin', city: 'Dublin', ranking: '81', acceptanceRate: '33', type: 'Public', avgTuition: '€20,000' },
  { id: 'uni-32', countryId: 'cd-6', country: 'Ireland', name: 'University College Dublin', city: 'Dublin', ranking: '171', acceptanceRate: '20', type: 'Public', avgTuition: '€18,000' },
  { id: 'uni-33', countryId: 'cd-6', country: 'Ireland', name: 'University of Galway', city: 'Galway', ranking: '289', acceptanceRate: '55', type: 'Public', avgTuition: '€16,000' },
  { id: 'uni-34', countryId: 'cd-6', country: 'Ireland', name: 'University College Cork', city: 'Cork', ranking: '292', acceptanceRate: '51', type: 'Public', avgTuition: '€17,000' },
  { id: 'uni-35', countryId: 'cd-6', country: 'Ireland', name: 'Dublin City University', city: 'Dublin', ranking: '436', acceptanceRate: '40', type: 'Public', avgTuition: '€15,000' },
  // New Zealand (5)
  { id: 'uni-36', countryId: 'cd-7', country: 'New Zealand', name: 'University of Auckland', city: 'Auckland', ranking: '68', acceptanceRate: '45', type: 'Public', avgTuition: 'NZD 38,000' },
  { id: 'uni-37', countryId: 'cd-7', country: 'New Zealand', name: 'University of Otago', city: 'Dunedin', ranking: '206', acceptanceRate: '55', type: 'Public', avgTuition: 'NZD 35,000' },
  { id: 'uni-38', countryId: 'cd-7', country: 'New Zealand', name: 'Massey University', city: 'Palmerston North', ranking: '239', acceptanceRate: '60', type: 'Public', avgTuition: 'NZD 30,000' },
  { id: 'uni-39', countryId: 'cd-7', country: 'New Zealand', name: 'Victoria University of Wellington', city: 'Wellington', ranking: '241', acceptanceRate: '50', type: 'Public', avgTuition: 'NZD 33,000' },
  { id: 'uni-40', countryId: 'cd-7', country: 'New Zealand', name: 'University of Waikato', city: 'Hamilton', ranking: '250', acceptanceRate: '65', type: 'Public', avgTuition: 'NZD 30,000' },
  // Singapore (5)
  { id: 'uni-41', countryId: 'cd-8', country: 'Singapore', name: 'National University of Singapore (NUS)', city: 'Singapore', ranking: '8', acceptanceRate: '5', type: 'Public', avgTuition: 'SGD 35,000' },
  { id: 'uni-42', countryId: 'cd-8', country: 'Singapore', name: 'Nanyang Technological University (NTU)', city: 'Singapore', ranking: '26', acceptanceRate: '15', type: 'Public', avgTuition: 'SGD 32,000' },
  { id: 'uni-43', countryId: 'cd-8', country: 'Singapore', name: 'Singapore Management University', city: 'Singapore', ranking: '429', acceptanceRate: '20', type: 'Public', avgTuition: 'SGD 30,000' },
  { id: 'uni-44', countryId: 'cd-8', country: 'Singapore', name: 'Singapore University of Technology and Design', city: 'Singapore', ranking: '430', acceptanceRate: '35', type: 'Public', avgTuition: 'SGD 28,000' },
  { id: 'uni-45', countryId: 'cd-8', country: 'Singapore', name: 'Singapore Institute of Technology', city: 'Singapore', ranking: '500', acceptanceRate: '40', type: 'Public', avgTuition: 'SGD 25,000' },
  // France (3)
  { id: 'uni-46', countryId: 'cd-9', country: 'France', name: 'Université PSL', city: 'Paris', ranking: '24', acceptanceRate: '10', type: 'Public', avgTuition: '€3,000' },
  { id: 'uni-47', countryId: 'cd-9', country: 'France', name: 'Institut Polytechnique de Paris', city: 'Palaiseau', ranking: '38', acceptanceRate: '15', type: 'Public', avgTuition: '€4,000' },
  { id: 'uni-48', countryId: 'cd-9', country: 'France', name: 'Sorbonne University', city: 'Paris', ranking: '59', acceptanceRate: '20', type: 'Public', avgTuition: '€3,000' },
  // Netherlands (2)
  { id: 'uni-49', countryId: 'cd-10', country: 'Netherlands', name: 'Delft University of Technology', city: 'Delft', ranking: '47', acceptanceRate: '25', type: 'Public', avgTuition: '€20,000' },
  { id: 'uni-50', countryId: 'cd-10', country: 'Netherlands', name: 'University of Amsterdam', city: 'Amsterdam', ranking: '53', acceptanceRate: '30', type: 'Public', avgTuition: '€18,000' }
];

const SCHOLARSHIPS = [
  // Melbourne
  { id: 'schol-1', title: 'Melbourne International Undergraduate Scholarship', universityId: 'uni-1', universityName: 'University of Melbourne', amount: '100% Tuition Remission', deadline: '2027-01-01', amountType: 'Full' },
  // Sydney
  { id: 'schol-2', title: 'Sydney Scholars India Scholarship Program', universityId: 'uni-2', universityName: 'University of Sydney', amount: '$40,000', deadline: '2026-11-01', amountType: 'Partial' },
  // UofT
  { id: 'schol-3', title: 'Lester B. Pearson International Scholarships', universityId: 'uni-6', universityName: 'University of Toronto', amount: 'Full Tuition & Residence', deadline: '2026-12-15', amountType: 'Full' },
  // McGill
  { id: 'schol-4', title: 'McGill Entrance Scholarship Program', universityId: 'uni-7', universityName: 'McGill University', amount: '$3,000', deadline: '2027-02-01', amountType: 'Fixed' },
  // MIT
  { id: 'schol-5', title: 'MIT Financial Aid', universityId: 'uni-11', universityName: 'Massachusetts Institute of Technology (MIT)', amount: 'Need-based Full/Partial', deadline: '2027-01-15', amountType: 'Full' },
  // Stanford
  { id: 'schol-6', title: 'Stanford Institutional Aid', universityId: 'uni-12', universityName: 'Stanford University', amount: 'Need-based Full/Partial', deadline: '2027-01-05', amountType: 'Full' },
  // Cambridge
  { id: 'schol-7', title: 'Gates Cambridge Scholarships', universityId: 'uni-21', universityName: 'University of Cambridge', amount: 'Full Cost Cover', deadline: '2026-10-15', amountType: 'Full' },
  { id: 'schol-8', title: 'Cambridge Trust Scholarships', universityId: 'uni-21', universityName: 'University of Cambridge', amount: 'Variable', deadline: '2026-11-20', amountType: 'Partial' },
  // Oxford
  { id: 'schol-9', title: 'Clarendon Fund Scholarships', universityId: 'uni-22', universityName: 'University of Oxford', amount: 'Full Tuition & Living', deadline: '2027-01-20', amountType: 'Full' },
  { id: 'schol-10', title: 'Reach Oxford Scholarships', universityId: 'uni-22', universityName: 'University of Oxford', amount: 'Full Tuition', deadline: '2027-02-05', amountType: 'Full' },
  // TUM
  { id: 'schol-11', title: 'Deutschlandstipendium at TUM', universityId: 'uni-26', universityName: 'Technical University of Munich', amount: '€300 / month', deadline: '2026-06-30', amountType: 'Fixed' },
  // Trinity
  { id: 'schol-12', title: 'Global Excellence Undergraduate Scholarship', universityId: 'uni-31', universityName: 'Trinity College Dublin', amount: '€5,000', deadline: '2026-05-15', amountType: 'Partial' },
  { id: 'schol-13', title: 'E3 Excellence Scholarships', universityId: 'uni-31', universityName: 'Trinity College Dublin', amount: '€4,000', deadline: '2026-05-01', amountType: 'Partial' },
  // Auckland
  { id: 'schol-14', title: 'International Student Excellence Scholarship', universityId: 'uni-36', universityName: 'University of Auckland', amount: '$10,000', deadline: '2026-10-10', amountType: 'Fixed' },
  { id: 'schol-15', title: 'ADB-Japan Scholarship Program', universityId: 'uni-36', universityName: 'University of Auckland', amount: 'Full Tuition', deadline: '2026-07-20', amountType: 'Full' },
  // NUS
  { id: 'schol-16', title: 'NUS Global Merit Scholarship', universityId: 'uni-41', universityName: 'National University of Singapore (NUS)', amount: 'Full Tuition', deadline: '2026-12-31', amountType: 'Full' },
  { id: 'schol-17', title: 'Science & Technology Undergraduate Scholarship', universityId: 'uni-41', universityName: 'National University of Singapore (NUS)', amount: 'Full Tuition & Living', deadline: '2026-12-20', amountType: 'Full' },
  // NTU
  { id: 'schol-18', title: 'Nanyang Scholarship', universityId: 'uni-42', universityName: 'Nanyang Technological University (NTU)', amount: 'Full Tuition', deadline: '2026-11-15', amountType: 'Full' },
  // PSL
  { id: 'schol-19', title: 'Eiffel Excellence Scholarship', universityId: 'uni-46', universityName: 'Université PSL', amount: '€1,181 / month', deadline: '2026-01-10', amountType: 'Fixed' },
  // Delft
  { id: 'schol-20', title: 'Justus & Louise van Effen Excellence Scholarships', universityId: 'uni-49', universityName: 'Delft University of Technology', amount: '€30,000 / year', deadline: '2026-12-01', amountType: 'Partial' },
  // More USA
  { id: 'schol-21', title: 'Harvard Financial Aid Initiative', universityId: 'uni-13', universityName: 'Harvard University', amount: 'Need-based', deadline: '2027-01-01', amountType: 'Full' },
  { id: 'schol-22', title: 'Caltech Financial Aid', universityId: 'uni-14', universityName: 'California Institute of Technology', amount: 'Need-based', deadline: '2027-01-05', amountType: 'Partial' },
  // More UK
  { id: 'schol-23', title: 'President\'s Undergraduate Scholarships', universityId: 'uni-23', universityName: 'Imperial College London', amount: '£1,000 / year', deadline: '2026-10-30', amountType: 'Fixed' },
  // More Canada
  { id: 'schol-24', title: 'International Major Entrance Scholarship', universityId: 'uni-8', universityName: 'University of British Columbia', amount: 'Up to CAD 40,000', deadline: '2027-01-10', amountType: 'Partial' },
  { id: 'schol-25', title: 'President\'s International Distinction Schol', universityId: 'uni-9', universityName: 'University of Alberta', amount: 'Up to CAD 120,000', deadline: '2027-01-15', amountType: 'Full' },
  // More Australia
  { id: 'schol-26', title: 'UNSW International Scholarships', universityId: 'uni-3', universityName: 'UNSW Sydney', amount: '$20,000', deadline: '2026-11-30', amountType: 'Partial' },
  { id: 'schol-27', title: 'ANU Chancellor\'s International Schol', universityId: 'uni-4', universityName: 'Australian National University', amount: '25-50% Tuition', deadline: '2026-12-10', amountType: 'Partial' },
  // More Germany
  { id: 'schol-28', title: 'DAAD Scholarships', universityId: 'uni-28', universityName: 'Heidelberg University', amount: '€934 / month', deadline: '2026-07-15', amountType: 'Fixed' },
  // More Ireland
  { id: 'schol-29', title: 'Global Excellence Graduate Scholarship', universityId: 'uni-32', universityName: 'University College Dublin', amount: '100% Tuition', deadline: '2026-03-31', amountType: 'Full' },
  // More New Zealand
  { id: 'schol-30', title: 'Vice-Chancellor\'s Scholarship for Int', universityId: 'uni-37', universityName: 'University of Otago', amount: 'NZD 10,000', deadline: '2026-09-01', amountType: 'Fixed' }
];

export async function runDatabaseSeed() {
  // Check if data already exists to prevent duplicate seeding 
  const countriesQuery = await getDocs(collection(db, 'countries'));
  if (countriesQuery.docs.length > 5) {
    return { success: false, message: 'Database already seeded.' };
  }

  // Create Batches (Firestore batches support up to 500 ops)
  let batch = writeBatch(db);
  let opCount = 0;

  for (const country of COUNTRIES) {
    const docRef = doc(db, 'countries', country.id);
    batch.set(docRef, { ...country, createdAt: new Date().toISOString() });
    opCount++;
  }

  for (const uni of UNIVERSITIES) {
    const docRef = doc(db, 'universities', uni.id);
    batch.set(docRef, { ...uni, createdAt: new Date().toISOString() });
    opCount++;
  }

  for (const schol of SCHOLARSHIPS) {
    const docRef = doc(db, 'scholarships', schol.id);
    const country = UNIVERSITIES.find(u => u.id === schol.universityId)?.country;
    batch.set(docRef, { ...schol, countryName: country || 'Global', createdAt: new Date().toISOString() });
    opCount++;
  }

  if (opCount > 0) {
    await batch.commit();
  }

  return { success: true, message: `Successfully seeded ${COUNTRIES.length} countries, ${UNIVERSITIES.length} universities, and ${SCHOLARSHIPS.length} scholarships.` };
}
