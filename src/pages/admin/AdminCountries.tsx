import React, { useState, useEffect, useMemo } from 'react';
import { Search, Plus, Edit2, Trash2, Globe, MapPin, Download, Briefcase, CalendarDays, FileText, GraduationCap, DollarSign, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { listenToCountries, createCountry, deleteCountry, getCountries } from '@/services/countryService';
import AdminCountryEditor from '@/components/admin/AdminCountryEditor';
import { EmptyState } from '@/components/ui/EmptyState';
import { exportToCSV } from '@/lib/exportUtils';

export default function AdminCountries() {
  const [countries, setCountries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Search
  const [searchTerm, setSearchTerm] = useState('');

  // Sorting
  const [sortConfig] = useState<{ key: string, direction: 'asc'|'desc' }>({ key: 'name', direction: 'asc' });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({ name: '', code: '', region: '', livingCost: '', visaType: '', flagUrl: '' });
  const [countryToDelete, setCountryToDelete] = useState<any>(null);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = listenToCountries((data) => {
       const uniqueData = Array.from(new Map(data.map(item => [item.id, item])).values());
       console.log("Countries fetched:", uniqueData);
       console.log("Country count:", uniqueData.length);
       setCountries(uniqueData);
       setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const seedCountries = async () => {
      try {
        const existing = await getCountries();
        const existingNames = new Set(existing.map((x: any) => (x.name || '').toLowerCase()));
        const initialCountries = [
          {
            name: 'Australia',
            capital: 'Canberra',
            currency: 'AUD',
            popularCities: 'Melbourne, Sydney, Brisbane, Perth',
            averageTuition: '$20,000 - $50,000 AUD/year',
            livingCost: '$21,000 - $30,000 AUD/year',
            postStudyVisa: '2 to 4 years (Subclass 485)',
            popularIntakes: 'February, July',
            ieltsRequirement: '6.0 - 7.0',
            studyLevels: 'UG, PG, PhD',
            status: 'Published',
            flagEmoji: '🇦🇺'
          },
          {
            name: 'Canada',
            capital: 'Ottawa',
            currency: 'CAD',
            popularCities: 'Toronto, Vancouver, Montreal, Calgary',
            averageTuition: '$15,000 - $40,000 CAD/year',
            livingCost: '$12,000 - $20,000 CAD/year',
            postStudyVisa: '1 to 3 years (PGWP)',
            popularIntakes: 'September, January, May',
            ieltsRequirement: '6.0 - 6.5',
            studyLevels: 'UG, PG, PhD',
            status: 'Published',
            flagEmoji: '🇨🇦'
          },
          {
            name: 'United States',
            capital: 'Washington, D.C.',
            currency: 'USD',
            popularCities: 'Boston, New York, San Francisco, Chicago',
            averageTuition: '$20,000 - $60,000 USD/year',
            livingCost: '$15,000 - $25,000 USD/year',
            postStudyVisa: '1 year OPT (up to 3 years for STEM)',
            popularIntakes: 'August/September, January',
            ieltsRequirement: '6.5 - 7.0',
            studyLevels: 'UG, PG, PhD',
            status: 'Published',
            flagEmoji: '🇺🇸'
          },
          {
            name: 'Germany',
            capital: 'Berlin',
            currency: 'EUR',
            popularCities: 'Munich, Berlin, Frankfurt, Heidelberg',
            averageTuition: '€0 - €3,000/year',
            livingCost: '€10,000 - €12,000/year',
            postStudyVisa: '18 months',
            popularIntakes: 'October, April',
            ieltsRequirement: '6.0 - 6.5',
            studyLevels: 'UG, PG, PhD',
            status: 'Published',
            flagEmoji: '🇩🇪'
          },
          {
            name: 'United Kingdom',
            capital: 'London',
            currency: 'GBP',
            popularCities: 'London, Edinburgh, Manchester, Birmingham',
            averageTuition: '£11,400 - £38,000/year',
            livingCost: '£12,000 - £15,000/year',
            postStudyVisa: '2 years (Graduate Route)',
            popularIntakes: 'September, January',
            ieltsRequirement: '6.0 - 7.0',
            studyLevels: 'UG, PG, PhD',
            status: 'Published',
            flagEmoji: '🇬🇧'
          },
          {
            name: 'New Zealand',
            capital: 'Wellington',
            currency: 'NZD',
            popularCities: 'Auckland, Wellington, Christchurch',
            averageTuition: '$22,000 - $35,000 NZD/year',
            livingCost: '$15,000 - $20,000 NZD/year',
            postStudyVisa: '1 to 3 years',
            popularIntakes: 'February, July',
            ieltsRequirement: '6.0 - 6.5',
            studyLevels: 'UG, PG, PhD',
            status: 'Published',
            flagEmoji: '🇳🇿'
          },
          {
            name: 'Ireland',
            capital: 'Dublin',
            currency: 'EUR',
            popularCities: 'Dublin, Cork, Galway, Limerick',
            averageTuition: '€10,000 - €25,000/year',
            livingCost: '€12,000 - €15,000/year',
            postStudyVisa: '1-2 years',
            popularIntakes: 'September, January',
            ieltsRequirement: '6.0 - 6.5',
            studyLevels: 'UG, PG, PhD',
            status: 'Published',
            flagEmoji: '🇮🇪'
          },
          {
            name: 'France',
            capital: 'Paris',
            currency: 'EUR',
            popularCities: 'Paris, Lyon, Toulouse, Lille',
            averageTuition: '€2,770 - €20,000/year',
            livingCost: '€10,000 - €14,000/year',
            postStudyVisa: '1 to 2 years (APS)',
            popularIntakes: 'September, February',
            ieltsRequirement: '6.0 - 6.5',
            studyLevels: 'UG, PG, PhD',
            status: 'Published',
            flagEmoji: '🇫🇷'
          },
          {
            name: 'Netherlands',
            capital: 'Amsterdam',
            currency: 'EUR',
            popularCities: 'Amsterdam, Rotterdam, Utrecht',
            averageTuition: '€8,000 - €20,000/year',
            livingCost: '€12,000 - €15,000/year',
            postStudyVisa: '1 year (Orientation Year)',
            popularIntakes: 'September, February',
            ieltsRequirement: '6.0 - 6.5',
            studyLevels: 'UG, PG, PhD',
            status: 'Published',
            flagEmoji: '🇳🇱'
          },
          {
            name: 'Sweden',
            capital: 'Stockholm',
            currency: 'SEK',
            popularCities: 'Stockholm, Gothenburg, Lund, Uppsala',
            averageTuition: '80K - 300K SEK/year',
            livingCost: '100K - 120K SEK/year',
            postStudyVisa: '1 year',
            popularIntakes: 'August, January',
            ieltsRequirement: '6.5',
            studyLevels: 'UG, PG, PhD',
            status: 'Published',
            flagEmoji: '🇸🇪'
          }
        ];
        for (const c of initialCountries) {
          if (!existingNames.has(c.name.toLowerCase())) {
            const customId = c.name.toLowerCase().replace(/\s+/g, '_');
            await createCountry({ ...c, id: customId });
          }
        }
      } catch (err) {
        console.error("Failed to seed countries:", err);
      }
    };
    seedCountries();
  }, []);

  // loadCountries is no longer needed since listenToTable handles real-time sync.
  // We'll keep a dud function to prevent breaking props if it's passed around, or adapt child components
  const loadCountries = () => {};

  const filteredAndSorted = useMemo(() => {
    let result = countries.filter(c => 
      (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.region || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.capital || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.popularCities || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    result.sort((a, b) => {
      let valA = a[sortConfig.key] || '';
      let valB = b[sortConfig.key] || '';
      
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [countries, searchTerm, sortConfig]);

  const totalPages = Math.ceil(filteredAndSorted.length / itemsPerPage);
  const currentItems = filteredAndSorted.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const openAddModal = () => {
    setEditingId(null);
    setFormData({ name: '', code: '', region: '', livingCost: '', visaType: '', popularPrograms: '', flagUrl: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (country: any) => {
    setEditingId(country.id);
    setFormData(country);
    setIsModalOpen(true);
  };

  const confirmDelete = async (id: string) => {
    console.log("Selected delete ID:", id);
    console.log("Deleting country:", countryToDelete);
    setLoading(true);
    try {
      await deleteCountry(id);
      console.log("Delete success");
      window.dispatchEvent(new CustomEvent('app_toast', { detail: { message: 'Country deleted successfully' } }));
      setCountryToDelete(null);
    } catch (err) {
      console.log("Delete failed:", err);
      console.error(err);
      window.dispatchEvent(new CustomEvent('app_toast', { detail: { message: 'Failed to delete country' } }));
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    exportToCSV(countries, "Countries_Export");
  };

  return (
    <div className="space-y-8 relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Countries</h1>
          <p className="text-slate-500 font-medium">Manage study destinations and visa info.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search countries..." 
              value={searchTerm}
              onChange={(e) => {setSearchTerm(e.target.value); setCurrentPage(1);}}
              className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 w-full sm:w-64 font-medium text-sm shadow-sm"
            />
          </div>
          <button onClick={handleExport} className="px-5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-sm whitespace-nowrap">
            <Download className="w-5 h-5" /> Export
          </button>
          <button onClick={openAddModal} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-indigo-600/20 whitespace-nowrap">
            <Plus className="w-5 h-5" /> Add Country
          </button>
        </div>
      </div>

      <div className="flex-1">
          {loading ? (
            <div className="p-12 text-center font-bold text-slate-400 bg-white rounded-2xl border border-slate-200">Loading countries data...</div>
          ) : currentItems.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8">
               <EmptyState 
                  title="No countries found"
                  description="Try adjusting your search criteria."
                  icon={Globe}
                  action={{ label: "Reset Search", onClick: () => setSearchTerm('') }}
               />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
               <AnimatePresence>
               {currentItems.map((c: any) => (
                 <motion.div 
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, scale: 0.95 }}
                   key={c.id} 
                   className="bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow group relative flex flex-col"
                 >
                   <div className="p-6 flex-1">
                     <div className="flex items-start justify-between mb-4">
                       <div className="flex items-center gap-3">
                         <div className="text-4xl leading-none">{c.flagUrl ? <img src={c.flagUrl} alt="" className="w-10 h-10 object-cover rounded-full" /> : (c.flagEmoji || '🏳️')}</div>
                         <div>
                           <h3 className="text-xl font-black text-slate-900 leading-tight">{c.name}</h3>
                           <p className="text-sm font-medium text-slate-500">{c.capital || c.region} • {c.currency || c.code}</p>
                         </div>
                       </div>
                       <div className="flex flex-col items-end gap-2">
                          <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg ${c.status === 'Draft' ? 'bg-slate-100 text-slate-600 border border-slate-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                             {c.status || 'Published'}
                          </span>
                       </div>
                     </div>
                     
                     <div className="space-y-3 mt-6 text-sm">
                       <div className="flex items-start gap-2">
                         <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                         <div>
                            <div className="font-bold text-slate-700">Popular Cities</div>
                            <div className="text-slate-500 leading-snug">{c.popularCities || c.popularPrograms || 'Not specified'}</div>
                         </div>
                       </div>
                       <div className="flex items-start gap-2">
                         <DollarSign className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                         <div>
                            <div className="font-bold text-slate-700">Tuition & Living</div>
                            <div className="text-slate-500 leading-snug">{c.averageTuition || 'Not specified'} • {c.livingCost || 'Not specified'}</div>
                         </div>
                       </div>
                       <div className="flex items-start gap-2">
                         <Briefcase className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                         <div>
                            <div className="font-bold text-slate-700">Post Study Visa</div>
                            <div className="text-slate-500 leading-snug">{c.postStudyVisa || c.visaType || 'Not specified'}</div>
                         </div>
                       </div>
                       <div className="flex items-start gap-2">
                         <CalendarDays className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                         <div>
                            <div className="font-bold text-slate-700">Intakes</div>
                            <div className="text-slate-500 leading-snug">{c.popularIntakes || 'Not specified'}</div>
                         </div>
                       </div>
                       <div className="flex items-start gap-2">
                         <FileText className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                         <div>
                            <div className="font-bold text-slate-700">IELTS Requirement</div>
                            <div className="text-slate-500 leading-snug">{c.ieltsRequirement || 'Not specified'}</div>
                         </div>
                       </div>
                       <div className="flex items-start gap-2">
                         <GraduationCap className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                         <div>
                            <div className="font-bold text-slate-700">Study Levels</div>
                            <div className="text-slate-500 leading-snug">{c.studyLevels || 'UG, PG, PhD'}</div>
                         </div>
                       </div>
                     </div>
                   </div>
                   
                   <div className="border-t border-slate-100 p-4 bg-slate-50 flex items-center justify-between rounded-b-2xl mt-auto">
                      <button onClick={() => openEditModal(c)} className="text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors">View Profile</button>
                      
                      <div className="flex items-center gap-1">
                       <button onClick={() => openEditModal(c)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-transparent hover:border-indigo-100" title="Edit Data">
                         <Edit2 className="w-4 h-4" />
                       </button>
                       <button onClick={() => setCountryToDelete(c)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-100" title="Remove Entry">
                         <Trash2 className="w-4 h-4" />
                       </button>
                      </div>
                   </div>
                 </motion.div>
               ))}
               </AnimatePresence>
            </div>
          )}
          
          {!loading && filteredAndSorted.length > 0 && (
            <div className="mt-8 flex items-center justify-between text-sm font-medium text-slate-500">
              <div className="bg-white border border-slate-200 px-4 py-2 rounded-xl">Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredAndSorted.length)} of {filteredAndSorted.length} entries</div>
              <div className="flex gap-1">
                 <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors disabled:opacity-40">
                   <ChevronLeft className="w-5 h-5" />
                 </button>
                 {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                   <button key={page} onClick={() => setCurrentPage(page)} className={`min-w-[40px] h-10 px-2 rounded-xl text-sm font-bold transition-colors ${currentPage === page ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>
                     {page}
                   </button>
                 ))}
                 <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors disabled:opacity-40">
                   <ChevronRight className="w-5 h-5" />
                 </button>
              </div>
            </div>
          )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
           <AdminCountryEditor 
              country={editingId ? formData : null} 
              onClose={() => setIsModalOpen(false)} 
              onRefresh={loadCountries} 
           />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {countryToDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setCountryToDelete(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }} 
              className="relative w-full max-w-sm bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden"
            >
              <div className="p-6">
                <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mb-4 border border-rose-200 shadow-inner">
                  <Trash2 className="w-6 h-6 text-rose-600" />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-2">Delete Country</h3>
                <p className="text-sm font-medium text-slate-500 mb-6 leading-relaxed">
                  Are you sure you want to permanently delete <span className="text-slate-800 font-bold">{countryToDelete.name}</span>? This action cannot be undone.
                </p>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setCountryToDelete(null)}
                    className="flex-1 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => confirmDelete(countryToDelete.id)}
                    className="flex-1 px-4 py-2.5 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-colors flex items-center justify-center gap-2 shadow-sm shadow-rose-600/20"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Country
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
