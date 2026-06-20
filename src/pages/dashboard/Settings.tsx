import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Bell, Shield, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { getTable, saveToTable } from '@/lib/api';

export function Settings() {
  const [activeTab, setActiveTab] = useState('account');
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const data = await getTable('profiles');
      setSettings(data[0] || { email: '', notifications: {}, appearance: {}, security: {} });
      setLoading(false);
    }
    load();
  }, []);

  const handleSave = async (updates: any) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    if (newSettings.id) {
       await saveToTable('profiles', newSettings);
    }
  };

  const tabs = [
    { id: 'account', label: 'Account', icon: SettingsIcon },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  if (loading) return <div className="p-8 text-center animate-pulse">Loading Settings...</div>;

  return (
    <div className="p-4 sm:p-8 space-y-4 sm:space-y-8 animate-in fade-in duration-500 pb-12 max-w-5xl">
      <div>
        <h1 className="text-3xl font-display font-black text-slate-900 tracking-tight">Settings</h1>
        <p className="text-slate-500 mt-2 font-medium text-lg">Manage your account preferences, security, and application settings.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Navigation Sidebar */}
        <div className="w-full md:w-64 shrink-0 space-y-1">
          {tabs.map((tab) => (
             <button
               key={tab.id}
               onClick={() => setActiveTab(tab.id)}
               className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-sm ${
                 activeTab === tab.id 
                   ? 'bg-white shadow-sm border border-slate-200 text-indigo-700' 
                   : 'text-slate-600 hover:bg-slate-200/50 border border-transparent'
               }`}
             >
               <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-indigo-600' : 'text-slate-400'}`} />
               {tab.label}
             </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 w-full space-y-6">
          {activeTab === 'account' && (
            <>
              <Card className="rounded-3xl border border-slate-200 shadow-sm bg-white overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50 border-t-4 border-t-indigo-600">
                   <h3 className="text-lg font-bold text-slate-900 tracking-tight">Contact Information</h3>
                   <p className="text-sm font-medium text-slate-500 mt-1">Manage the email address associated with your account.</p>
                </div>
                <CardContent className="p-6 space-y-4">
                  <div>
                     <label className="text-xs uppercase font-bold text-slate-500 tracking-wider mb-2 block">Primary Email</label>
                     <div className="flex items-center gap-3">
                        <Input value={settings.email || ''} onChange={(e) => handleSave({email: e.target.value})} className="max-w-md bg-white font-medium" />
                        <span className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold border border-emerald-100"><Shield className="w-3 h-3" /> Verified</span>
                     </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-3xl border border-rose-200 shadow-sm bg-white overflow-hidden">
                <div className="p-6 border-b border-rose-100 bg-rose-50/50">
                   <h3 className="text-lg font-bold text-rose-900 tracking-tight flex items-center gap-2"><Trash2 className="w-5 h-5" /> Danger Zone</h3>
                   <p className="text-sm font-medium text-rose-600/80 mt-1">Irreversible and destructive actions.</p>
                </div>
                <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                   <div>
                      <p className="font-bold text-slate-900">Delete Account</p>
                      <p className="text-sm text-slate-500 font-medium mt-1">Permanently remove your account and all associated data.</p>
                   </div>
                   <Button variant="outline" className="border-rose-200 text-rose-600 hover:bg-rose-50 font-bold shrink-0">Delete Account</Button>
                </CardContent>
              </Card>
            </>
          )}

          {activeTab === 'security' && (
            <>
              <Card className="rounded-3xl border border-slate-200 shadow-sm bg-white overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50">
                   <h3 className="text-lg font-bold text-slate-900 tracking-tight mb-1">Two-Factor Authentication</h3>
                   <p className="text-sm text-slate-500 font-medium">Add an extra layer of security to your account.</p>
                </div>
                <CardContent className="p-6 flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                         <Shield className="w-6 h-6 text-indigo-600" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">Authenticator App</p>
                        <p className="text-sm text-slate-500 mt-0.5 font-medium">{settings.security.twoFactor ? 'Enabled' : 'Not configured'}</p>
                      </div>
                   </div>
                   <Button 
                    onClick={() => handleSave({ security: { ...settings.security, twoFactor: !settings.security.twoFactor } })}
                    className="font-bold bg-indigo-600 hover:bg-indigo-700 shadow-sm">
                      {settings.security.twoFactor ? 'Disable 2FA' : 'Enable 2FA'}
                   </Button>
                </CardContent>
              </Card>
            </>
          )}

          {activeTab === 'notifications' && (
            <Card className="rounded-3xl border border-slate-200 shadow-sm bg-white overflow-hidden">
               <div className="p-6 border-b border-slate-100 bg-slate-50">
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight mb-1">Email Notifications</h3>
               </div>
               <CardContent className="p-6 space-y-4">
                  {[
                    { key: 'email', label: 'Application Updates', desc: 'Get notified when an application status changes.' },
                    { key: 'alerts', label: 'Deadline Reminders', desc: 'Alerts 7 days and 24 hours before deadlines.' },
                    { key: 'push', label: 'New Scholarship Matches', desc: 'Weekly digest of new scholarships matching your profile.' }
                  ].map((item, i) => (
                    <div key={i} className="flex items-start justify-between p-4 rounded-2xl border border-slate-100 hover:bg-slate-50 transition-colors">
                       <div className="pr-4">
                          <p className="font-bold text-slate-900 text-sm">{item.label}</p>
                          <p className="text-slate-500 text-xs mt-1 font-medium">{item.desc}</p>
                       </div>
                       <div 
                        onClick={() => handleSave({ notifications: { ...settings.notifications, [item.key]: !settings.notifications[item.key] } })}
                        className={`w-12 h-6 rounded-full transition-colors flex items-center p-0.5 shrink-0 cursor-pointer ${settings.notifications[item.key] ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                          <div className={`w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform ${settings.notifications[item.key] ? 'translate-x-6' : 'translate-x-0'}`}></div>
                       </div>
                    </div>
                  ))}
               </CardContent>
            </Card>
          )}

        </div>
      </div>
    </div>
  );
}
