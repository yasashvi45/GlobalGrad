import React, { useState, useEffect, useRef } from 'react';
import { FileText, UploadCloud, File, Download, Trash2, CheckCircle2, ShieldCheck, Eye, Search, Pin, PinOff, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { saveToTable, deleteFromTable, logActivity, listenToTable } from '@/lib/api';
import { auth, storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export function Documents() {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals
  const [editDoc, setEditDoc] = useState<any | null>(null);
  const [previewDoc, setPreviewDoc] = useState<any | null>(null);

  useEffect(() => {
    let unsubscribe = () => {};
    const uid = auth.currentUser?.uid || localStorage.getItem('userId') || '1';
    unsubscribe = listenToTable('documents', (data) => {
       setDocs(data.filter((d:any) => String(d.userId) === String(uid)));
       setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteFromTable('documents', id);
    setDocs(docs.filter(d => d.id !== id));
    window.dispatchEvent(new CustomEvent('app_toast', { detail: { message: 'Document deleted' } }));
  };
  
  const handleTogglePin = async (doc: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = { ...doc, status: doc.status === 'Pinned' ? 'Uploaded' : 'Pinned' };
    await saveToTable('documents', updated);
    setDocs(docs.map(d => d.id === doc.id ? updated : d));
  };
  
  const handleSaveRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!editDoc) return;
    await saveToTable('documents', editDoc);
    await logActivity('Document Updated', `You updated the details for ${editDoc.name}.`, 'upload', 'text-emerald-600', 'bg-emerald-100', 'Upload');
    setDocs(docs.map(d => d.id === editDoc.id ? editDoc : d));
    setEditDoc(null);
    window.dispatchEvent(new CustomEvent('app_toast', { detail: { message: 'Document updated' } }));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
       processFiles(e.target.files);
    }
  };

  const processFiles = async (files: FileList) => {
     const file = files[0];
     const uid = auth.currentUser?.uid || localStorage.getItem('userId') || '1';
     
     try {
       // Optional loading toast or state can be added here
       const storageRef = ref(storage, `documents/${uid}/${Date.now()}_${file.name}`);
       const snapshot = await uploadBytes(storageRef, file);
       const downloadUrl = await getDownloadURL(snapshot.ref);

       const newDoc = {
         userId: uid,
         name: file.name,
         type: file.type || 'Document',
         size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
         url: downloadUrl,
         status: 'Uploaded',
         category: determineCategory(file.name),
         date: new Date().toISOString()
       };
       await saveToTable('documents', newDoc);
       await logActivity('Document Uploaded', `You uploaded "${file.name}".`, 'upload', 'text-emerald-600', 'bg-emerald-100', 'Upload');
       
       await saveToTable('notifications', {
          userId: uid, type: 'document', title: 'Document Uploaded', desc: `${file.name} was successfully uploaded to your vault.`, date: new Date().toISOString(), read: false
       });
       window.dispatchEvent(new Event('notifications_changed'));
       window.dispatchEvent(new CustomEvent('app_toast', { detail: { message: 'Document uploaded successfully' } }));
     } catch (err) {
       console.error("Upload error:", err);
       window.dispatchEvent(new CustomEvent('app_toast', { detail: { message: 'Failed to upload document' } }));
     }
  };
  
  const determineCategory = (name: string) => {
     const low = name.toLowerCase();
     if(low.includes('passport')) return 'ID / Passport';
     if(low.includes('transcript')) return 'Academic';
     if(low.includes('sop') || low.includes('statement')) return 'Essay / SOP';
     if(low.includes('lor') || low.includes('recommendation')) return 'Recommendation';
     return 'General';
  }

  const requiredDocs = [
    { name: 'Passport Copy', uploaded: docs.some(d => d.name?.toLowerCase().includes('passport')) },
    { name: 'Academic Transcripts', uploaded: docs.some(d => d.name?.toLowerCase().includes('transcript')) },
    { name: 'Statement of Purpose', uploaded: docs.some(d => d.name?.toLowerCase().includes('sop') || d.name?.toLowerCase().includes('statement')) },
    { name: 'Letter of Recommendation 1', uploaded: docs.some(d => d.name?.toLowerCase().includes('rec') || d.name?.toLowerCase().includes('lor')) },
  ];

  if (loading) return <div className="p-8 text-center animate-pulse">Loading Documents...</div>;
  
  const filteredDocs = docs.filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase()) || d.category?.toLowerCase().includes(searchQuery.toLowerCase()));
  const pinnedDocs = filteredDocs.filter(d => d.status === 'Pinned');
  const otherDocs = filteredDocs.filter(d => d.status !== 'Pinned');
  const displayDocs = [...pinnedDocs, ...otherDocs];

  return (
    <div className="p-4 sm:p-8 space-y-4 sm:space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] pointer-events-none"></div>
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 font-bold text-xs uppercase tracking-wider mb-3">
             <ShieldCheck className="w-3.5 h-3.5" /> 256-bit Encryption
          </div>
          <h1 className="text-3xl font-display font-black text-slate-900 flex items-center gap-3 tracking-tight">
            <FileText className="w-8 h-8 text-blue-500" />
            Document Vault
          </h1>
          <p className="text-slate-500 mt-2 font-medium">Securely store, verify, and manage your application materials.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Upload & Checklist */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Upload Zone */}
          <Card 
            className={`transition-all duration-300 border-2 border-dashed ${isDragging ? 'border-blue-500 bg-blue-50 scale-105' : 'border-slate-200 bg-slate-50 hover:bg-slate-100'} rounded-3xl cursor-pointer`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <CardContent className="p-8 flex flex-col items-center justify-center text-center h-[280px]">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-transform ${isDragging ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 scale-110' : 'bg-white shadow-sm border border-slate-100 text-slate-400'}`}>
                <UploadCloud className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-black text-slate-900 mb-2 tracking-tight">Drag & Drop Documents</h3>
              <p className="text-sm text-slate-500 mb-6 font-medium">Drop your files here to securely upload to your vault.</p>
              <Button className="bg-slate-900 hover:bg-slate-800 text-white font-bold h-10 px-6 rounded-xl shadow-sm" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>Browse Files</Button>
              <input type="file" ref={fileInputRef} className="hidden" multiple accept=".pdf,.doc,.docx" onChange={handleFileSelect} />
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mt-4">PDF, DOCX, JPG up to 10MB</p>
            </CardContent>
          </Card>

          {/* Storage Usage */}
          <Card className="rounded-3xl border border-slate-200 shadow-sm bg-slate-900 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 blur-2xl"></div>
            <CardContent className="p-6 relative z-10">
               <h3 className="font-bold text-lg mb-1 tracking-tight drop-shadow-md">Storage Used</h3>
               <p className="text-slate-400 text-sm font-medium mb-4">{docs.length * 2.5} MB of 5 GB</p>
               <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mb-2">
                 <div className="h-full bg-blue-500" style={{width: `${docs.length}%`}}></div>
               </div>
               <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Premium Plan Active</p>
            </CardContent>
          </Card>

          {/* Checklist */}
          <Card className="rounded-3xl border border-slate-200 shadow-sm overflow-hidden bg-white">
             <div className="p-6 border-b border-slate-100 bg-slate-50">
                <h3 className="font-bold text-slate-900 tracking-tight">Application Checklist</h3>
                <p className="text-xs text-slate-500 mt-1 font-medium">Based on your target universities.</p>
             </div>
             <div className="p-2">
                <div className="space-y-1">
                  {requiredDocs.map((doc, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border-2 ${doc.uploaded ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300'}`}>
                        {doc.uploaded && <CheckCircle2 className="w-3 h-3 text-white" />}
                      </div>
                      <span className={`text-sm font-medium ${doc.uploaded ? 'text-slate-900' : 'text-slate-500'}`}>{doc.name}</span>
                    </div>
                  ))}
                </div>
             </div>
          </Card>
        </div>

        {/* Right Column: Files List */}
        <div className="lg:col-span-2">
          <Card className="rounded-3xl border border-slate-200 shadow-sm bg-white overflow-hidden h-full">
            <div className="p-6 md:p-8 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900 tracking-tight text-lg">My Vault</h3>
                <p className="text-sm font-medium text-slate-500 mt-1">{docs.length} documents stored securely.</p>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search documents..." className="pl-9 bg-white" />
              </div>
            </div>
            
            <div className="p-4 md:p-6 space-y-3">
              {displayDocs.map((doc) => (
                <div key={doc.id} className="p-4 rounded-2xl border border-slate-100 hover:border-blue-100 hover:bg-blue-50/30 flex flex-col xl:flex-row xl:items-center gap-4 transition-all group cursor-pointer shadow-sm relative">
                  {doc.status === 'Pinned' && (
                     <div className="absolute -top-2 -left-2 w-6 h-6 bg-amber-100 border border-amber-200 rounded-full flex items-center justify-center shadow-sm z-10">
                        <Pin className="w-3 h-3 text-amber-600 fill-amber-600" />
                     </div>
                  )}
                  <div className="flex items-center gap-4 flex-1 min-w-0" onClick={() => setPreviewDoc(doc)}>
                    <div className={`w-12 h-12 rounded-2xl bg-white border ${doc.status === 'Pinned' ? 'border-amber-200 text-amber-600' : 'border-slate-200 text-slate-400 group-hover:border-blue-200 group-hover:text-blue-600'} flex items-center justify-center shrink-0 shadow-sm transition-colors`}>
                      <File className="w-6 h-6" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate mb-1">{doc.name}</p>
                      <div className="flex gap-2 items-center text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider flex-wrap">
                        <span>{doc.size || '0 MB'}</span>
                        <span>•</span>
                        <span className="text-blue-600">{doc.category || 'General'}</span>
                        <span>•</span>
                        <span>{doc.date ? new Date(doc.date).toLocaleDateString() : new Date().toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between xl:justify-end gap-3 sm:gap-6 xl:w-auto shrink-0">
                    {doc.status === 'Uploaded' && (
                      <div className="flex items-center gap-1.5 text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase border border-blue-100">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Uploaded
                      </div>
                    )}
                    {doc.status === 'Verified' && (
                      <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase border border-emerald-100">
                        <ShieldCheck className="w-3.5 h-3.5" /> Verified
                      </div>
                    )}

                    <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex-wrap justify-end">
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg" onClick={(e) => handleTogglePin(doc, e)}>
                        {doc.status === 'Pinned' ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg" onClick={(e) => { e.stopPropagation(); setEditDoc(doc); }}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg" onClick={(e) => { e.stopPropagation(); setPreviewDoc(doc); }}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <a href={doc.url} download={doc.name} onClick={(e) => e.stopPropagation()} className="h-9 w-9 text-slate-400 hover:text-slate-900 hover:bg-slate-100 flex items-center justify-center rounded-lg transition-colors">
                        <Download className="w-4 h-4" />
                      </a>
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg" onClick={(e) => handleDelete(doc.id, e)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                </div>
              ))}
              {displayDocs.length === 0 && (
                <div className="text-center p-12">
                   <p className="font-medium text-slate-500">{searchQuery ? 'No documents match your search.' : 'No documents in vault. Upload one to get started.'}</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {editDoc && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl">
             <h3 className="font-bold text-lg mb-4">Rename Document</h3>
             <form onSubmit={handleSaveRename}>
               <Input value={editDoc.name} onChange={e => setEditDoc({...editDoc, name: e.target.value})} className="mb-4" autoFocus />
               <div className="flex gap-2 justify-end">
                 <Button type="button" variant="outline" onClick={() => setEditDoc(null)}>Cancel</Button>
                 <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold">Save</Button>
               </div>
             </form>
          </div>
        </div>
      )}

      {previewDoc && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setPreviewDoc(null)}>
          <div className="bg-white rounded-3xl w-full max-w-4xl h-[80vh] shadow-2xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
             <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 tracking-tight leading-tight">{previewDoc.name}</h3>
                    <p className="text-xs text-slate-500 font-bold">{previewDoc.size} • {previewDoc.category}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <a href={previewDoc.url} download={previewDoc.name} className="h-10 px-4 bg-slate-900 text-white rounded-xl flex items-center gap-2 hover:bg-slate-800 transition-colors font-bold text-sm">
                    <Download className="w-4 h-4" /> Download
                  </a>
                  <Button variant="outline" className="h-10 rounded-xl text-slate-500" onClick={() => setPreviewDoc(null)}>Close</Button>
                </div>
             </div>
             <div className="flex-1 bg-slate-100 flex items-center justify-center p-8">
                <div className="w-full max-w-2xl bg-white shadow-sm border border-slate-200 h-full rounded-xl overflow-hidden flex items-center justify-center text-slate-400 flex-col gap-4">
                  <FileText className="w-16 h-16 opacity-50" />
                  <p className="font-medium text-sm">Preview not available for this file type.</p>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
