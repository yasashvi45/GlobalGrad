import React, { useState, useEffect } from 'react';
import { ArrowLeft, User, Phone, Mail, MapPin, Calendar, Globe, Award, Book, Briefcase, FileText, CheckCircle, Clock, AlertCircle, X, Download, ShieldCheck, MailWarning, Bell, FileDown, Lock, ShieldBan, Bot, Activity, DollarSign, PenTool, Hash, GraduationCap, Building2, Edit2, Save, Eye, MessageSquare, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import { getTable, saveToTable, deleteFromTable } from '@/lib/api';
import { updateUser, updateProfileDoc, deleteUser } from '@/services/userService';
import { useNavigate } from 'react-router-dom';

export default function AdminUserWorkspace({ user, onBack, onRefresh }: { user: any, onBack: () => void, onRefresh: () => void }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [adminNotes, setAdminNotes] = useState('');
  const [loadingNotes, setLoadingNotes] = useState(true);
  const [notesLog, setNotesLog] = useState<any[]>([]);

  // Editing Profile State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editProfileData, setEditProfileData] = useState<any>({ personalDetails: {}, academicProfile: {}, testScores: {}, studyPreferences: {} });

  useEffect(() => {
    // Optionally load additional data for this specific user if not present
    loadNotes();
    setEditProfileData({
      personal: { ...(user.personal || {}) },
      academic: { ...(user.academic || {}) },
      tests: { ...(user.tests || {}) },
      preferences: { ...(user.preferences || {}) },
      workExperience: { ...(user.workExperience || {}) }
    });
  }, [user]);

  const loadNotes = async () => {
    setLoadingNotes(true);
    try {
      const allNotes = await getTable('admin_notes').catch(() => []);
      const userNotes = allNotes.filter((n: any) => String(n.userId) === String(user.id)).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setNotesLog(userNotes);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingNotes(false);
    }
  };

  const handleAddNote = async () => {
    if (!adminNotes.trim()) return;
    try {
      const newNote = {
         id: Date.now(),
         userId: user.id,
         note: adminNotes,
         author: 'Admin',
         date: new Date().toISOString()
      };
      await saveToTable('admin_notes', newNote);
      setAdminNotes('');
      loadNotes();
      window.dispatchEvent(new CustomEvent('app_toast', { detail: { message: 'Note added successfully' } }));
    } catch (e) { }
  };

  const executeAction = (actionName: string) => {
    window.dispatchEvent(new CustomEvent('app_toast', { detail: { message: `${actionName} executed successfully.` } }));
    // In a real app we'd make API calls here
  };

  // Safe checks for nested objects
  const pd = user.personal || {};
  const ac = user.academic || {};
  const ts = user.tests || {};
  const sp = user.preferences || {};
  const wx = user.workExperience || {};

  const handleSaveProfile = async () => {
    try {
      await updateProfileDoc(user.id, {
        personal: editProfileData.personal,
        academic: editProfileData.academic,
        tests: editProfileData.tests,
        preferences: editProfileData.preferences,
        workExperience: editProfileData.workExperience,
        updatedAt: new Date().toISOString()
      });

      window.dispatchEvent(new CustomEvent('app_toast', { detail: { message: 'Profile updated successfully' } }));
      setIsEditingProfile(false);
      onRefresh(); // Refresh the parent table to see changes
    } catch (e) {
      console.error(e);
      window.dispatchEvent(new CustomEvent('app_toast', { detail: { message: 'Failed to update profile' } }));
    }
  };

  const handleProfileChange = (section: string, field: string, value: any) => {
    setEditProfileData((prev: any) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between bg-white p-4 rounded-3xl border border-slate-200 shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-xl shrink-0">
               {user.name?.charAt(0).toUpperCase()}
             </div>
             <div>
               <h1 className="text-xl font-black text-slate-900 leading-tight flex items-center gap-2">
                 {user.name} 
                 {user.accountStatus === 'Active' ? <ShieldCheck className="w-4 h-4 text-emerald-500" /> : <ShieldBan className="w-4 h-4 text-rose-500" />}
               </h1>
               <div className="text-xs font-bold text-slate-500">{user.email} • ID: {user.id}</div>
             </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/admin/messages', { state: { userId: String(user.id) } })} className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition" title="Message User">
            <MessageSquare className="w-5 h-5" />
          </button>
          
          <div className="h-6 w-px bg-slate-200 mx-1"></div>
          
          <select 
            className="text-sm font-bold bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:ring-2 focus:ring-indigo-500 cursor-pointer hover:bg-slate-50"
            value=""
            onChange={async (e) => { 
                const action = e.target.value;
                if (!action) return;
                
                try {
                  if (action === 'Suspend') {
                     await updateUser(user.id, { ...user, accountStatus: 'Suspended' });
                     window.dispatchEvent(new CustomEvent('app_toast', { detail: { message: 'Account suspended' } }));
                     onRefresh();
                  } else if (action === 'Block') {
                     await updateUser(user.id, { ...user, accountStatus: 'Blocked' });
                     window.dispatchEvent(new CustomEvent('app_toast', { detail: { message: 'Account blocked' } }));
                     onRefresh();
                  } else if (action === 'Activate') {
                     await updateUser(user.id, { ...user, accountStatus: 'Active' });
                     window.dispatchEvent(new CustomEvent('app_toast', { detail: { message: 'Account activated' } }));
                     onRefresh();
                  } else if (action === 'Delete') {
                     if (window.confirm('Delete User? \n\nThis action will remove:\n- User profile\n- Applications\n- Documents\n- Messages\n- Saved data\n\nType DELETE to continue.')) {
                        const confirmText = prompt('Type DELETE to confirm:');
                        if (confirmText === 'DELETE') {
                           await deleteUser(user.id);
                           window.dispatchEvent(new CustomEvent('app_toast', { detail: { message: 'User deleted' } }));
                           onBack();
                           onRefresh();
                        }
                     }
                  }
                } catch (err) {
                    console.error(err);
                }
            }}
          >
            <option value="" disabled>Manage Account...</option>
            {user.accountStatus !== 'Active' && <option value="Activate">Activate Account</option>}
            {user.accountStatus !== 'Suspended' && <option value="Suspend">Suspend Account</option>}
            {user.accountStatus !== 'Blocked' && <option value="Block">Block Account</option>}
            <option value="Delete" className="text-rose-600">Delete User</option>
          </select>
        </div>
      </div>

      {/* Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Sidebar (Navigation & Quick Stats) */}
        <div className="lg:col-span-1 space-y-6">
           <div className="bg-white border border-slate-200 rounded-3xl p-2 shadow-sm flex flex-col gap-1">
             {[
               { id: 'profile', icon: User, label: 'Full Profile' },
               { id: 'timeline', icon: Activity, label: 'Student Timeline' },
               { id: 'applications', icon: Briefcase, label: 'Applications' },
               { id: 'documents', icon: FileText, label: 'Documents' },
               { id: 'universities', icon: Building2, label: 'Universities Saved' },
               { id: 'ai', icon: Bot, label: 'AI Activity' },
               { id: 'payments', icon: DollarSign, label: 'Payments History' },
             ].map(tab => (
               <button 
                 key={tab.id}
                 onClick={() => setActiveTab(tab.id)}
                 className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${activeTab === tab.id ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}
               >
                 <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-indigo-600' : 'text-slate-400'}`} />
                 {tab.label}
               </button>
             ))}
           </div>

           {/* Quick Stats */}
           <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
             <div className="text-xs font-black uppercase tracking-wider text-slate-400">Overview</div>
             <div className="flex items-center justify-between pb-3 border-b border-slate-100">
               <span className="text-slate-500 font-medium text-sm">Applications</span>
               <span className="font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">{user.appsCount}</span>
             </div>
             <div className="flex items-center justify-between pb-3 border-b border-slate-100">
               <span className="text-slate-500 font-medium text-sm">Saved Unis</span>
               <span className="font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">{user.savedCount}</span>
             </div>
             <div className="flex items-center justify-between">
               <span className="text-slate-500 font-medium text-sm">Documents</span>
               <span className="font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">{user.docsCount}</span>
             </div>
           </div>

           {/* Admin Notes */}
           <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 shadow-sm flex flex-col h-96">
              <div className="flex items-center gap-2 mb-4 text-amber-800">
                <PenTool className="w-5 h-5" />
                <h3 className="font-black">Internal Notes</h3>
              </div>
              <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1">
                 {notesLog.length === 0 && <div className="text-sm font-medium text-amber-600/50 italic text-center mt-10">No internal notes yet.</div>}
                 {notesLog.map((n:any) => (
                    <div key={n.id} className="bg-white/60 p-3 rounded-xl border border-amber-200/50">
                      <div className="text-xs font-bold text-amber-900 mb-1 flex justify-between">
                        <span>{n.author}</span>
                        <span className="text-amber-700/50">{new Date(n.date).toLocaleDateString()}</span>
                      </div>
                      <div className="text-sm text-amber-900 font-medium leading-relaxed">{n.note}</div>
                    </div>
                 ))}
              </div>
              <div className="shrink-0 relative">
                <textarea 
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Type a note (staff only)..."
                  className="w-full bg-white border border-amber-200 rounded-xl px-3 py-2 text-sm font-medium text-amber-900 placeholder:text-amber-400 focus:ring-2 focus:ring-amber-400 resize-none h-20"
                />
                <button onClick={handleAddNote} className="absolute bottom-2 right-2 p-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition">
                  <CheckCircle className="w-4 h-4" />
                </button>
              </div>
           </div>
        </div>

        {/* Right Content Area */}
        <div className="lg:col-span-3">
           <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm min-h-[800px]">
             
             {activeTab === 'profile' && (
               <motion.div initial={{opacity:0}} animate={{opacity:1}} className="space-y-8">
                 <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-black text-slate-900">Complete Profile</h2>
                    {!isEditingProfile ? (
                       <button onClick={() => setIsEditingProfile(true)} className="px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold rounded-xl flex items-center gap-2 transition">
                          <Edit2 className="w-4 h-4" /> Edit Profile
                       </button>
                    ) : (
                       <div className="flex gap-2">
                         <button onClick={() => setIsEditingProfile(false)} className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold rounded-xl transition">
                            Cancel
                         </button>
                         <button onClick={handleSaveProfile} className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 font-bold rounded-xl flex items-center gap-2 transition">
                            <Save className="w-4 h-4" /> Save Changes
                         </button>
                       </div>
                    )}
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Personal Details */}
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-widest text-indigo-600 mb-4 flex items-center gap-2"><User className="w-4 h-4" /> Personal Details</h3>
                      <div className="space-y-3 bg-slate-50 p-5 rounded-2xl border border-slate-100">
                        {isEditingProfile ? (
                          <>
                            <EditField label="First Name" value={editProfileData.personalDetails?.firstName} onChange={(v) => handleProfileChange('personalDetails', 'firstName', v)} />
                            <EditField label="Last Name" value={editProfileData.personalDetails?.lastName} onChange={(v) => handleProfileChange('personalDetails', 'lastName', v)} />
                            <EditField label="Email" value={user.email} onChange={() => {}} disabled />
                            <EditField label="Phone" value={editProfileData.personal?.mobile} onChange={(v) => handleProfileChange('personal', 'mobile', v)} />
                            <EditField label="DOB" type="date" value={editProfileData.personal?.dob} onChange={(v) => handleProfileChange('personal', 'dob', v)} />
                            <EditField label="Gender" value={editProfileData.personal?.gender} onChange={(v) => handleProfileChange('personal', 'gender', v)} />
                            <EditField label="Nationality" value={editProfileData.personal?.nationality} onChange={(v) => handleProfileChange('personal', 'nationality', v)} />
                            <EditField label="Current City" value={editProfileData.personal?.currentCity} onChange={(v) => handleProfileChange('personal', 'currentCity', v)} />
                            <EditField label="Current Country" value={editProfileData.personal?.currentCountry} onChange={(v) => handleProfileChange('personal', 'currentCountry', v)} />
                          </>
                        ) : (
                          <>
                            <Field label="Full Name" value={`${pd.firstName || ''} ${pd.lastName || ''}`.trim() || user.name} />
                            <Field label="Email" value={user.email} />
                            <Field label="Phone" value={pd.mobile} />
                            <Field label="DOB" value={pd.dob} />
                            <Field label="Gender" value={pd.gender} />
                            <Field label="Nationality" value={pd.nationality} />
                            <Field label="Current City" value={pd.currentCity} />
                            <Field label="Current Country" value={pd.currentCountry} />
                          </>
                        )}
                      </div>
                    </div>

                    {/* Academic Profile */}
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-widest text-indigo-600 mb-4 flex items-center gap-2"><GraduationCap className="w-4 h-4" /> Academic Profile</h3>
                      <div className="space-y-3 bg-slate-50 p-5 rounded-2xl border border-slate-100">
                        {isEditingProfile ? (
                          <>
                            <EditField label="Highest Qual." value={editProfileData.academic?.targetDegree} onChange={(v) => handleProfileChange('academic', 'targetDegree', v)} />
                            <EditField label="Degree" value={editProfileData.academic?.currentDegree} onChange={(v) => handleProfileChange('academic', 'currentDegree', v)} />
                            <EditField label="Field" value={editProfileData.academic?.targetField} onChange={(v) => handleProfileChange('academic', 'targetField', v)} />
                            <EditField label="Institution" value={editProfileData.academic?.currentUniversity} onChange={(v) => handleProfileChange('academic', 'currentUniversity', v)} />
                            <EditField label="GPA" value={editProfileData.academic?.gpa} onChange={(v) => handleProfileChange('academic', 'gpa', v)} />
                          </>
                        ) : (
                          <>
                            <Field label="Target Qual." value={ac.targetDegree} />
                            <Field label="Current Degree" value={ac.currentDegree} />
                            <Field label="Field" value={ac.targetField} />
                            <Field label="Institution" value={ac.currentUniversity} />
                            <Field label="GPA" value={ac.gpa} />
                          </>
                        )}
                      </div>
                    </div>

                    {/* Test Scores */}
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-widest text-indigo-600 mb-4 flex items-center gap-2"><Award className="w-4 h-4" /> Test Scores</h3>
                      <div className="space-y-3 bg-slate-50 p-5 rounded-2xl border border-slate-100">
                        {isEditingProfile ? (
                          <>
                            <EditField label="IELTS Formatted" value={editProfileData.tests?.ielts?.score} onChange={(v) => handleProfileChange('tests', 'ielts', { status: 'Completed', score: v })} />
                            <EditField label="TOEFL" value={editProfileData.tests?.toefl?.score} onChange={(v) => handleProfileChange('tests', 'toefl', { status: 'Completed', score: v })} />
                            <EditField label="GRE" value={editProfileData.tests?.gre} onChange={(v) => handleProfileChange('tests', 'gre', v)} />
                            <EditField label="GMAT" value={editProfileData.tests?.gmat} onChange={(v) => handleProfileChange('tests', 'gmat', v)} />
                            <EditField label="PTE" value={editProfileData.tests?.pte?.score} onChange={(v) => handleProfileChange('tests', 'pte', { status: 'Completed', score: v })} />
                          </>
                        ) : (
                          <>
                            <Field label="IELTS Formatted" value={ts.ielts?.score || ts.ielts?.status} />
                            <Field label="TOEFL" value={ts.toefl?.score || ts.toefl?.status} />
                            <Field label="GRE" value={ts.gre} />
                            <Field label="GMAT" value={ts.gmat} />
                            <Field label="PTE" value={ts.pte?.score || ts.pte?.status} />
                          </>
                        )}
                      </div>
                    </div>

                    {/* Study Preferences */}
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-widest text-indigo-600 mb-4 flex items-center gap-2"><Globe className="w-4 h-4" /> Study Preferences</h3>
                      <div className="space-y-3 bg-slate-50 p-5 rounded-2xl border border-slate-100">
                        {isEditingProfile ? (
                          <>
                            <EditField label="Target Countries" value={editProfileData.preferences?.targetCountries?.join(', ')} onChange={(v) => handleProfileChange('preferences', 'targetCountries', v.split(',').map((s:string)=>s.trim()))} />
                            <EditField label="Study Mode" value={editProfileData.preferences?.studyMode} onChange={(v) => handleProfileChange('preferences', 'studyMode', v)} />
                            <EditField label="Intake" value={editProfileData.academic?.preferredIntake} onChange={(v) => handleProfileChange('academic', 'preferredIntake', v)} />
                            <EditField label="Budget" value={editProfileData.preferences?.budget} onChange={(v) => handleProfileChange('preferences', 'budget', v)} />
                          </>
                        ) : (
                          <>
                            <Field label="Target Countries" value={sp.targetCountries?.join(', ')} />
                            <Field label="Study Mode" value={sp.studyMode} />
                            <Field label="Intake" value={ac.preferredIntake} />
                            <Field label="Budget" value={sp.budget} />
                          </>
                        )}
                      </div>
                    </div>
                 </div>
               </motion.div>
             )}

             {activeTab === 'timeline' && (
               <motion.div initial={{opacity:0}} animate={{opacity:1}}>
                 <h2 className="text-2xl font-black text-slate-900 mb-6">Activity Timeline</h2>
                 <div className="relative pl-6 border-l-2 border-slate-200 space-y-8 mt-8">
                     <TimelineItem title="Account Created" date={new Date(user.createdAt).toLocaleDateString()} icon={User} color="emerald" />
                     {user.profile?.updatedAt && <TimelineItem title="Profile Completed" date={new Date(user.profile.updatedAt).toLocaleDateString()} icon={CheckCircle} color="indigo" />}
                     {user.savedCount > 0 && <TimelineItem title={`Saved ${user.savedCount} Universities`} date="Recent" icon={Building2} color="amber" />}
                     {user.docsCount > 0 && <TimelineItem title={`Uploaded ${user.docsCount} Documents`} date="Recent" icon={FileText} color="blue" />}
                     {user.appsCount > 0 && <TimelineItem title={`Submitted ${user.appsCount} Applications`} date="Recent" icon={Briefcase} color="purple" />}
                 </div>
               </motion.div>
             )}

             {activeTab === 'applications' && (
               <motion.div initial={{opacity:0}} animate={{opacity:1}}>
                 <h2 className="text-2xl font-black text-slate-900 mb-6">Applications ({user.recentApps?.length || 0})</h2>
                 {user.recentApps?.length === 0 ? <EmptyState msg="No applications found" /> : (
                   <div className="space-y-4">
                     {user.recentApps.map((app: any) => (
                       <div key={app.id} className="p-6 border border-slate-200 rounded-2xl flex items-center justify-between hover:bg-slate-50 transition">
                         <div>
                            <div className="font-black text-lg text-slate-900">{app.university}</div>
                            <div className="text-slate-500 font-medium mb-2">{app.program}</div>
                            <div className="text-xs text-slate-400 font-bold uppercase tracking-widest">ID: {app.id} • Applied: {new Date(app.createdAt).toLocaleDateString()}</div>
                         </div>
                         <div className="flex flex-col items-end gap-2">
                            <span className="px-3 py-1 bg-indigo-100 text-indigo-700 font-bold text-xs uppercase tracking-wider rounded-lg">{app.status}</span>
                            <button className="text-indigo-600 text-sm font-bold hover:underline">Update Status</button>
                         </div>
                       </div>
                     ))}
                   </div>
                 )}
               </motion.div>
             )}

             {activeTab === 'documents' && (
               <motion.div initial={{opacity:0}} animate={{opacity:1}}>
                 <h2 className="text-2xl font-black text-slate-900 mb-6">Uploaded Documents ({user.recentDocs?.length || 0})</h2>
                 {user.recentDocs?.length === 0 ? <EmptyState msg="No documents found" /> : (
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {user.recentDocs.map((doc: any) => (
                       <div key={doc.id} className="p-4 border border-slate-200 rounded-2xl flex items-start gap-4 hover:bg-slate-50 transition">
                         <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                           <FileText className="w-6 h-6" />
                         </div>
                         <div className="flex-1 min-w-0">
                            <div className="font-bold text-slate-900 truncate mb-1">{doc.name}</div>
                            <div className="text-xs text-slate-500 font-medium mb-3">{doc.type} • {(doc.size/1024).toFixed(1)} KB</div>
                            <div className="flex gap-2">
                               <button className="text-xs font-bold bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-slate-200 transition"><Eye className="w-3 h-3"/> View</button>
                               <span className={`px-2 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider ${doc.status === 'Verified' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{doc.status || 'Pending'}</span>
                            </div>
                         </div>
                       </div>
                     ))}
                   </div>
                 )}
               </motion.div>
             )}

             {activeTab === 'universities' && (
               <motion.div initial={{opacity:0}} animate={{opacity:1}}>
                 <h2 className="text-2xl font-black text-slate-900 mb-6">Saved Universities ({user.savedCount})</h2>
                 <EmptyState msg="This view combines saved, compared, and viewed universities. Coming soon." />
               </motion.div>
             )}

             {activeTab === 'ai' && (
               <motion.div initial={{opacity:0}} animate={{opacity:1}}>
                 <h2 className="text-2xl font-black text-slate-900 mb-6">AI Activity & Prompts</h2>
                 <EmptyState msg="AI conversations logs accessible here." />
               </motion.div>
             )}

             {activeTab === 'payments' && (
               <motion.div initial={{opacity:0}} animate={{opacity:1}}>
                 <h2 className="text-2xl font-black text-slate-900 mb-6">Payment History</h2>
                 <EmptyState msg="No payment history found." />
               </motion.div>
             )}

           </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string, value: any }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-1 border-b border-slate-200/50 last:border-0 gap-1">
      <span className="text-slate-500 font-medium text-sm w-1/3 shrink-0">{label}</span>
      <span className="text-slate-900 font-bold text-sm truncate sm:text-right">{value || <span className="text-slate-300 font-normal italic">Not provided</span>}</span>
    </div>
  );
}

function TimelineItem({ title, date, icon: Icon, color }: any) {
  const colors:any = {
    emerald: 'bg-emerald-100 text-emerald-600',
    indigo: 'bg-indigo-100 text-indigo-600',
    amber: 'bg-amber-100 text-amber-600',
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
  };
  return (
    <div className="relative mb-8 last:mb-0">
      <div className={`absolute -left-[35px] w-8 h-8 rounded-full flex items-center justify-center border-4 border-white ${colors[color] || 'bg-slate-100 text-slate-600'}`}>
        <Icon className="w-3 h-3" />
      </div>
      <div>
        <h4 className="font-bold text-slate-900">{title}</h4>
        <div className="text-xs font-bold text-slate-400 mt-1">{date}</div>
      </div>
    </div>
  );
}

function EditField({ label, value, onChange, type = "text", disabled = false }: { label: string, value: any, onChange: (v:any)=>void, type?: string, disabled?: boolean }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-1 border-b border-slate-200/50 last:border-0 gap-2">
      <span className="text-slate-500 font-medium text-sm w-1/3 shrink-0">{label}</span>
      <input 
        type={type}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full sm:w-2/3 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50 disabled:text-slate-400"
      />
    </div>
  );
}

function EmptyState({ msg }: { msg: string }) {
  return (
    <div className="py-20 text-center flex flex-col items-center">
      <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-300 flex items-center justify-center mb-4">
        <AlertCircle className="w-8 h-8" />
      </div>
      <p className="text-slate-500 font-medium">{msg}</p>
    </div>
  );
}
