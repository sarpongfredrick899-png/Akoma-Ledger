import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LogIn, UserPlus, Fingerprint, ShieldCheck, Github, Chrome, Sparkles } from 'lucide-react';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, auth, googleProvider } from '../lib/auth';
import { cn } from '../lib/utils';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [showForgot, setShowForgot] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage('Reset link transmitted to your intelligence channel.');
      setTimeout(() => setShowForgot(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setMessage('');
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-brand-charcoal flex items-center justify-center p-6 overflow-y-auto">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-gold/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-gold/5 rounded-full blur-[100px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel w-full max-w-md p-10 luxury-glow space-y-8 relative z-10"
      >
        <div className="text-center space-y-3">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-brand-gold/10 rounded-[2.5rem] flex items-center justify-center border border-brand-gold/20 shadow-[0_0_40px_rgba(212,175,55,0.1)]">
              <Fingerprint className="w-10 h-10 text-brand-gold" />
            </div>
          </div>
          <h2 className="text-4xl font-bold tracking-tight luxury-text gold-text-gradient">
            {showForgot ? 'Reset Ledger' : isLogin ? 'Access Ledger' : 'Join Akoma'}
          </h2>
          <p className="text-[10px] uppercase tracking-[0.4em] text-white/30 font-bold">Growth Intelligence Systems</p>
        </div>

        <div className="space-y-4">
          {!showForgot && (
            <button 
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center gap-4 hover:bg-white/10 transition-all group"
            >
              <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                <Chrome className="w-4 h-4 text-black" />
              </div>
              <span className="text-[11px] uppercase font-bold tracking-widest text-white/80 group-hover:text-white">Continue with Intelligence ID</span>
            </button>
          )}

          {!showForgot && (
            <div className="flex items-center gap-4 py-2">
              <div className="flex-1 h-px bg-white/5" />
              <span className="text-[9px] uppercase tracking-widest text-white/20 font-bold">or use credentials</span>
              <div className="flex-1 h-px bg-white/5" />
            </div>
          )}

          {showForgot ? (
            <form onSubmit={handleResetPassword} className="space-y-6">
               <div className="space-y-2">
                <label className="text-[9px] uppercase tracking-widest text-white/40 font-bold px-1">Institutional Email</label>
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-14 bg-white/[0.02] border border-white/10 rounded-2xl px-6 outline-none text-white focus:border-brand-gold/50 transition-all"
                  placeholder="partner@akoma.systems"
                />
              </div>

              {error && (
                <p className="text-[10px] text-rose-500 font-bold uppercase tracking-widest text-center px-4 bg-rose-500/5 py-3 rounded-xl border border-rose-500/10">
                  {error}
                </p>
              )}
              {message && (
                <p className="text-[10px] text-brand-gold font-bold uppercase tracking-widest text-center px-4 bg-brand-gold/5 py-3 rounded-xl border border-brand-gold/10">
                  {message}
                </p>
              )}

              <button 
                type="submit"
                disabled={loading}
                className="w-full h-16 bg-brand-gold text-black rounded-2xl font-bold uppercase tracking-widest hover:bg-white transition-all shadow-xl shadow-brand-gold/20 flex items-center justify-center gap-3"
              >
                {loading ? <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" /> : 'Send Reset Link'}
              </button>

              <button 
                type="button"
                onClick={() => setShowForgot(false)}
                className="w-full text-[10px] uppercase font-bold tracking-widest text-white/20 hover:text-white transition-colors"
              >
                Return to Authentication
              </button>
            </form>
          ) : (
            <form onSubmit={handleEmailAuth} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[9px] uppercase tracking-widest text-white/40 font-bold px-1">Institutional Email</label>
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-14 bg-white/[0.02] border border-white/10 rounded-2xl px-6 outline-none text-white focus:border-brand-gold/50 transition-all"
                  placeholder="partner@akoma.systems"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <label className="text-[9px] uppercase tracking-widest text-white/40 font-bold">Encryption Key</label>
                  {isLogin && (
                    <button 
                      type="button"
                      onClick={() => setShowForgot(true)}
                      className="text-[9px] uppercase font-bold text-brand-gold/60 hover:text-brand-gold transition-colors"
                    >
                      Forgot?
                    </button>
                  )}
                </div>
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-14 bg-white/[0.02] border border-white/10 rounded-2xl px-6 outline-none text-white focus:border-brand-gold/50 transition-all font-mono"
                  placeholder="••••••••"
                />
              </div>

              {error && (
                <p className="text-[10px] text-rose-500 font-bold uppercase tracking-widest text-center px-4 bg-rose-500/5 py-3 rounded-xl border border-rose-500/10">
                  {error}
                </p>
              )}

              <button 
                type="submit"
                disabled={loading}
                className="w-full h-16 bg-brand-gold text-black rounded-2xl font-bold uppercase tracking-widest hover:bg-white transition-all shadow-xl shadow-brand-gold/20 flex items-center justify-center gap-3"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                ) : (
                  <>
                    {isLogin ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                    {isLogin ? 'Authenticate' : 'Establish Record'}
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        <div className="text-center">
          <button 
            disabled={loading}
            onClick={() => setIsLogin(!isLogin)}
            className="text-[10px] uppercase font-bold tracking-widest text-white/40 hover:text-brand-gold transition-colors"
          >
            {isLogin ? "No account? Establish record" : "Already registered? Authenticate"}
          </button>
        </div>

        <div className="pt-4 border-t border-white/5 flex items-center justify-center gap-3 text-white/20">
          <ShieldCheck className="w-4 h-4" />
          <span className="text-[9px] uppercase tracking-widest font-bold">AES-256 Verified Growth Channel</span>
        </div>
      </motion.div>
    </div>
  );
}
