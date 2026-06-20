import React, { useState } from 'react';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ShieldCheck, AlertCircle, ArrowLeft, CheckCircle2, User, Key } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

import { login, logout, resetPassword, signInWithGoogle, signInWithMicrosoft } from '@/services/authService';
import { getUser, createUser, updateUser } from '@/services/userService';

export function Login() {
  const [loginType, setLoginType] = useState<'student' | 'admin'>('student');
  const [rememberMe, setRememberMe] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Load remembered email on mount
  React.useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Custom states for flows
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    setError('');
    setIsLoading(true);
    
    try {
      console.log('1. Calling Firebase signInWithEmailAndPassword...');
      const user = await login(email, password);
      console.log('2. Returned uid:', user.uid);
      
      // Fetch user profile to verify role
      console.log(`3. Firestore lookup path users/${user.uid}`);
      let docSnap;
      try {
        docSnap = await getUser(user.uid);
        console.log('3a. Document exists?', !!docSnap, 'Document data:', docSnap);
      } catch (err: any) {
        console.warn('Firestore user lookup failed, proceeding with fallback:', err);
        const isMainAdmin = user.email === 'yasashvichowdaryvallepalli@gmail.com';
        docSnap = {
          id: user.uid,
          email: user.email || '',
          role: isMainAdmin ? 'super_admin' : 'student',
          name: user.displayName || 'User'
        };
      }
      
      // Self-healing check if literally null (not just an error fallback)
      if (!docSnap) {
         console.log('Self-healing: docSnap not found, creating from Authentication data...');
         const { getDoc, doc } = await import('firebase/firestore');
         const { db } = await import('@/lib/firebase');
         const profileSnap = await getDoc(doc(db, 'profiles', user.uid));
         const isMainAdmin = user.email === 'yasashvichowdaryvallepalli@gmail.com';
         const profileData = profileSnap.exists() ? profileSnap.data() : null;
         
         await createUser({
            id: user.uid,
            email: user.email || user.providerData?.[0]?.email || '',
            role: isMainAdmin ? 'admin' : 'student',
            adminLevel: isMainAdmin ? 'super_admin' : null,
            status: 'active',
            profileCompleted: !!profileSnap.exists(),
            fullName: user.displayName || profileData?.personal?.fullName || profileData?.personal?.firstName || (isMainAdmin ? 'Super Admin' : 'User'),
            name: user.displayName || profileData?.personal?.fullName || profileData?.personal?.firstName || (isMainAdmin ? 'Super Admin' : 'User'),
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString()
         });
         docSnap = await getUser(user.uid);
         console.log('Self-healing completed. New docSnap:', docSnap);
      }
      
      if (loginType === 'admin') {
         if (!docSnap) {
            console.log('5. Access decision: Denied (Account not found)');
            await logout();
            setError('Account not found.');
            setIsLoading(false);
            return;
         }
         
         const uRole = (docSnap as any).role;
         console.log('4. Retrieved role:', uRole);
         
         if (uRole !== 'admin' && uRole !== 'super_admin') {
            console.log('5. Access decision: Denied (Not an admin)');
            await logout();
            setError('Access denied. Admin privileges required.');
            setIsLoading(false);
            return;
         }
         
         console.log('5. Access decision: Granted');
         try {
           await updateUser(user.uid, { lastLogin: new Date().toISOString() });
         } catch (e) {
           console.warn('Failed to update lastLogin:', e);
         }
         
         if (rememberMe) {
             localStorage.setItem('rememberedEmail', email);
         } else {
             localStorage.removeItem('rememberedEmail');
         }

         setIsLoading(false);
         window.dispatchEvent(new Event('auth_changed'));
         navigate('/admin', { replace: true });
         return;
      }

      // Default/Student flow
      if (docSnap) {
        const uRole = (docSnap as any).role;
        console.log('4. Retrieved role:', uRole);
        
        try {
          await updateUser(user.uid, { lastLogin: new Date().toISOString() });
        } catch (e) {
          console.warn('Failed to update lastLogin:', e);
        }
        
        if (rememberMe) {
            localStorage.setItem('rememberedEmail', email);
        } else {
            localStorage.removeItem('rememberedEmail');
        }

        setIsLoading(false);
        window.dispatchEvent(new Event('auth_changed'));
        
        if (uRole === 'admin' || uRole === 'super_admin') {
           console.log('5. Access decision: Granted (Admin redirected from student flow)');
           navigate('/admin', { replace: true });
        } else {
           console.log('5. Access decision: Granted (Student flow)');
           navigate('/app', { replace: true });
        }
        return;
      } else {
        console.log('5. Access decision: Denied (Student flow - account not found)');
        await logout();
        setError('Account not found. Please register first.');
        setIsLoading(false);
        setTimeout(() => navigate('/signup'), 2000);
        return;
      }

    } catch (e: any) {
      setIsLoading(false);
      console.error('Firebase Auth Error:', { code: e.code, message: e.message, customData: e.customData }, e);
      setError(`Auth Error [${e.code || 'unknown'}]: ${e.message || 'Unknown error occurred'}`);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      await resetPassword(email);
      setResetSent(true);
    } catch (err: any) {
      console.error(err);
      let friendlyMessage = 'Failed to send reset email.';
      const code = err.code;
      if (code === 'auth/user-not-found') friendlyMessage = 'No account found with this email.';
      else if (code === 'auth/invalid-email') friendlyMessage = 'Please enter a valid email address.';
      else if (code === 'auth/operation-not-allowed') friendlyMessage = 'Password reset is disabled. Please contact support.';
      setError(friendlyMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialAuth = async (provider: string) => {
    setIsLoading(true);
    setError('');
    try {
      let user;
      console.log(`1. Calling Firebase signInWithPopup (${provider})...`);
      if (provider === 'Google') {
        user = await signInWithGoogle();
      } else if (provider === 'Microsoft') {
        user = await signInWithMicrosoft();
      } else {
        throw new Error('Unsupported provider');
      }
      
      console.log('2. Returned uid:', user.uid);

      console.log(`3. Firestore lookup path users/${user.uid}`);
      let docSnap;
      try {
        docSnap = await getUser(user.uid);
      } catch (err: any) {
        console.warn('Firestore user lookup failed globally, proceeding with fallback:', err);
        const isMainAdmin = user.email === 'yasashvichowdaryvallepalli@gmail.com';
        docSnap = {
          id: user.uid,
          email: user.email || '',
          role: isMainAdmin ? 'super_admin' : 'student',
          name: user.displayName || 'User'
        };
      }
      
      // Self-healing check
      if (!docSnap) {
         console.log('Self-healing: docSnap not found, creating from Authentication data...');
         const { getDoc, doc } = await import('firebase/firestore');
         const { db } = await import('@/lib/firebase');
         const profileSnap = await getDoc(doc(db, 'profiles', user.uid));
         const isMainAdmin = user.email === 'yasashvichowdaryvallepalli@gmail.com';
         const profileData = profileSnap.exists() ? profileSnap.data() : null;
         
         await createUser({
            id: user.uid,
            email: user.email || user.providerData?.[0]?.email || '',
            role: isMainAdmin ? 'admin' : 'student',
            adminLevel: isMainAdmin ? 'super_admin' : null,
            status: 'active',
            profileCompleted: !!profileSnap.exists(),
            fullName: user.displayName || profileData?.personal?.fullName || profileData?.personal?.firstName || (isMainAdmin ? 'Super Admin' : 'User'),
            name: user.displayName || profileData?.personal?.fullName || profileData?.personal?.firstName || (isMainAdmin ? 'Super Admin' : 'User'),
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString()
         });
         docSnap = await getUser(user.uid);
         console.log('Self-healing completed. New docSnap:', docSnap);
      }
      
      let uRole = 'student';
      
      if (docSnap) {
        uRole = (docSnap as any).role || 'student';
        console.log('4. Retrieved role:', uRole);
        const updates: any = { lastLogin: new Date().toISOString() };
        if (!(docSnap as any).role) updates.role = 'student';
        try {
          await updateUser(user.uid, updates);
        } catch (e) {
          console.warn('Failed to update user:', e);
        }

        window.dispatchEvent(new Event('auth_changed'));

        if (uRole === 'admin' || uRole === 'super_admin') {
          console.log('5. Access decision: Granted (Admin)');
          navigate('/admin', { replace: true });
        } else {
          console.log('5. Access decision: Granted (Student)');
          navigate('/app', { replace: true });
        }
      } else {
        console.log('5. Access decision: Denied (Account not found)');
        await logout();
        setError('Account not found. Please register first.');
        setTimeout(() => navigate('/signup'), 2000);
      }

    } catch (e: any) {
      console.error('Firebase Auth Error:', { code: e.code, message: e.message, customData: e.customData }, e);
      setError(`Auth Error [${e.code || 'unknown'}]: ${e.message || 'Unknown error occurred'}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (isResetMode) {
    return (
      <AuthLayout title="Reset Password" subtitle="We'll send you instructions to safely reset your password.">
        <Link to="/" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 mb-8 transition-colors"><ArrowLeft className="w-4 h-4 mr-2" /> Back to Home</Link>
        <AnimatePresence mode="wait">
          {!resetSent ? (
            <motion.form 
              key="reset-form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={handleReset} 
              className="space-y-6"
            >
              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 flex items-center gap-2 text-rose-600 text-sm font-medium">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email Address *</label>
                <Input 
                  type="email" 
                  placeholder="you@example.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className={cn(email && "border-indigo-500 focus:ring-indigo-500")}
                />
              </div>

              <div className="space-y-3 pt-2">
                <Button type="submit" className="w-full h-12 text-base shadow-lg shadow-indigo-600/20" disabled={isLoading}>
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      Sending link...
                    </span>
                  ) : "Send Reset Link"}
                </Button>
                
                <Button type="button" variant="ghost" onClick={() => setIsResetMode(false)} disabled={isLoading} className="w-full h-12 text-slate-600 hover:text-slate-900">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to login
                </Button>
              </div>
            </motion.form>
          ) : (
            <motion.div 
              key="reset-success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-6"
            >
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                 <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Check your email</h3>
              <p className="text-slate-600 mb-8 max-w-sm mx-auto">
                We've sent a password reset link to <span className="font-semibold text-slate-900">{email}</span>. Click the link to complete the reset process.
              </p>
              
              <Button type="button" onClick={() => { setIsResetMode(false); setResetSent(false); }} className="w-full h-12 text-base">
                Return to Login
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Enter your details to access your dashboard.">
      <Link to="/" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 mb-8 transition-colors"><ArrowLeft className="w-4 h-4 mr-2" /> Back to Home</Link>
      
      <div className="mb-6 bg-slate-100 p-1 rounded-xl flex">
        <button
          type="button"
          onClick={() => { setLoginType('student'); setError(''); setShowPassword(false); }}
          className={cn("flex-1 px-4 py-2 text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-all", loginType === 'student' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700')}
        >
          <User className="w-4 h-4" />
          Student Login
        </button>
        <button
          type="button"
          onClick={() => { setLoginType('admin'); setError(''); setShowPassword(false); }}
          className={cn("flex-1 px-4 py-2 text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-all", loginType === 'admin' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700')}
        >
          <Key className="w-4 h-4" />
          Admin Login
        </button>
      </div>

      <form onSubmit={handleLogin} className="space-y-6">
        
        {error && (
          <motion.div 
             initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
             className="p-3 rounded-xl bg-rose-50 border border-rose-100 flex items-center gap-2 text-rose-600 text-sm font-medium"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </motion.div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">{loginType === 'admin' ? 'Admin Email' : 'Email Address'} *</label>
            <Input 
              type="email" 
              placeholder={loginType === 'admin' ? 'admin@globalgrad.com' : 'you@example.com'} 
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); }}
              disabled={isLoading}
              className={cn("transition-all", email && !error ? "border-emerald-500 focus:ring-emerald-500" : error ? "border-rose-500 focus:ring-rose-500" : "focus:ring-indigo-600")}
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-slate-700">Password *</label>
              {loginType === 'student' && <button type="button" onClick={() => setIsResetMode(true)} className="text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors">Forgot password?</button>}
            </div>
            <div className="relative">
              <Input 
                type={showPassword ? "text" : "password"} 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                disabled={isLoading}
                className={cn("pr-10 transition-all", password && !error ? "border-emerald-500 focus:ring-emerald-500" : error ? "border-rose-500 focus:ring-rose-500" : "focus:ring-indigo-600")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                disabled={isLoading}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
        
        {loginType === 'student' && (
          <div className="flex items-center justify-between">
            <label className="flex items-center group cursor-pointer">
              <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded cursor-pointer transition-colors" />
              <span className="ml-2 text-sm text-slate-700 font-medium group-hover:text-slate-900">
                Remember me for 30 days
              </span>
            </label>
          </div>
        )}

        <Button type="submit" className={cn("w-full h-12 text-base shadow-lg", loginType === 'admin' ? "bg-slate-900 hover:bg-slate-800 shadow-slate-900/20" : "shadow-indigo-600/20")} disabled={isLoading}>
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              Authenticating...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              {loginType === 'admin' ? 'Sign In as Admin' : 'Sign In'}
            </span>
          )}
        </Button>
        
        {loginType === 'student' && (
          <>
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-slate-500 text-xs font-semibold uppercase tracking-wider">Or continue with</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button type="button" variant="outline" onClick={() => handleSocialAuth('Google')} className="w-full h-12 hover:bg-slate-50 transition-colors border-slate-200 shadow-sm" disabled={isLoading}>
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Google
              </Button>
              <Button type="button" variant="outline" onClick={() => handleSocialAuth('Microsoft')} className="w-full h-12 hover:bg-slate-50 transition-colors border-slate-200 shadow-sm" disabled={isLoading}>
                <svg className="w-5 h-5 mr-2" viewBox="0 0 21 21"><path d="M0 0h10v10H0zM11 0h10v10H11zM0 11h10v10H0zM11 11h10v10H11z" fill="#00a4ef"/></svg>
                <span>Microsoft</span>
              </Button>
            </div>
            
            <div className="mt-8 flex flex-col items-center gap-5">
              <p className="text-sm text-slate-600">
                Don't have an account?{' '}
                <Link to="/signup" className="font-bold text-indigo-600 hover:text-indigo-500 transition-colors">Create one here</Link>
              </p>
              <div className="flex items-center justify-center gap-2 text-xs text-slate-500 font-medium bg-slate-50 px-4 py-2 rounded-full border border-slate-100">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                End-to-end encrypted & secure login
              </div>
            </div>
          </>
        )}
      </form>
    </AuthLayout>
  );
}
