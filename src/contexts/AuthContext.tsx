import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from '../services/authService';
import { getUser, listenToUser } from '../services/userService';

// Types
export type Role = 'student' | 'admin' | 'super_admin';
export type Status = 'active' | 'suspended' | 'blocked';

export interface UserData {
  id: string;
  email: string;
  role: Role;
  status?: Status;
  fullName?: string;
  name?: string;
  createdAt?: string;
  lastLogin?: string;
  profileCompleted?: boolean;
}

interface AuthContextType {
  user: any | null; // Firebase User
  userData: UserData | null; // Firestore User 
  loading: boolean;
  isStudent: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
  isStudent: false,
  isAdmin: false,
  isSuperAdmin: false,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeUserDoc: (() => void) | null = null;
    
    const unsubscribeAuth = onAuthStateChanged(async (firebaseUser: any) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        // Fetch custom user data from Firestore
        try {
          // Immediately try to fetch it once, and then listen
          let uDoc = await getUser(firebaseUser.uid);
          console.log('[AuthContext] Fetched users doc for', firebaseUser.uid, ':', uDoc);
          const { getDoc, doc } = await import('firebase/firestore');
          const { db } = await import('../lib/firebase');
          const profileSnap = await getDoc(doc(db, 'profiles', firebaseUser.uid));
          const { createUser, updateProfileDoc } = await import('../services/userService');
          const isMainAdmin = firebaseUser.email === 'yasashvichowdaryvallepalli@gmail.com';

          if (!uDoc) {
             const profileData = profileSnap.exists() ? profileSnap.data() : null;
             await createUser({
                id: firebaseUser.uid,
                email: firebaseUser.email || firebaseUser.providerData?.[0]?.email || '',
                role: isMainAdmin ? 'admin' : 'student',
                adminLevel: isMainAdmin ? 'super_admin' : null,
                status: 'active',
                profileCompleted: !!profileSnap.exists(),
                fullName: firebaseUser.displayName || profileData?.personal?.fullName || profileData?.personal?.firstName || (isMainAdmin ? 'Super Admin' : 'User'),
                name: firebaseUser.displayName || profileData?.personal?.fullName || profileData?.personal?.firstName || (isMainAdmin ? 'Super Admin' : 'User'),
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString()
             });
             uDoc = await getUser(firebaseUser.uid);
          }
          
          if (uDoc && !profileSnap.exists()) {
             await updateProfileDoc(firebaseUser.uid, {
                userId: firebaseUser.uid,
                email: (uDoc as any).email || firebaseUser.email || '',
                createdAt: new Date().toISOString()
             });
          }

          if (uDoc) {
             if (!(uDoc as any).role) {
                const { updateUser } = await import('../services/userService');
                await updateUser(firebaseUser.uid, { role: 'student' });
                (uDoc as any).role = 'student';
             }
             setUserData(uDoc as UserData);
          } else {
             setUserData(null);
          }
          
          if (unsubscribeUserDoc) unsubscribeUserDoc();
          
          // Setup realtime listener for user doc
          unsubscribeUserDoc = listenToUser(firebaseUser.uid, (data) => {
            setUserData(data as UserData);
          });
          
        } catch (error) {
          console.error("Failed to fetch user role:", error);
          const isMainAdmin = firebaseUser.email === 'yasashvichowdaryvallepalli@gmail.com';
          setUserData({
            id: firebaseUser.uid,
            email: firebaseUser.email || firebaseUser.providerData?.[0]?.email || '',
            role: isMainAdmin ? 'super_admin' : 'student',
            name: firebaseUser.displayName || (isMainAdmin ? 'Super Admin' : 'User'),
            status: 'active',
            profileCompleted: false
          });
        }
      } else {
        if (unsubscribeUserDoc) unsubscribeUserDoc();
        setUserData(null);
      }
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeUserDoc) unsubscribeUserDoc();
    };
  }, []);

  const isStudent = userData?.role === 'student';
  const isAdmin = userData?.role === 'admin' || userData?.role === 'super_admin';
  const isSuperAdmin = userData?.role === 'super_admin';

  return (
    <AuthContext.Provider value={{ user, userData, loading, isStudent, isAdmin, isSuperAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};
