import { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, Square, Loader2, Sparkles, Send, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { parseFinancialStatement } from '../services/gemini';
import { Transaction } from '../types';

interface SmartInputBarProps {
  onTransactionCaptured: (transaction: Transaction) => void;
}

export default function SmartInputBar({ onTransactionCaptured }: SmartInputBarProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [preview, setPreview] = useState<Partial<Transaction> | null>(null);
  const recognitionRef = useRef<any>(null);
  const isStartedRef = useRef(false);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-GH'; 

      recognitionRef.current.onstart = () => {
        setIsRecording(true);
        isStartedRef.current = true;
        setError(null);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
        isStartedRef.current = false;
      };

      recognitionRef.current.onresult = (event: any) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        
        // Exact transcription update
        setInputText(transcript);
        
        // Clear any previous error on success
        if (transcript.trim()) {
          setError(null);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        setIsRecording(false);
        isStartedRef.current = false;
        
        if (event.error === 'not-allowed') {
          setError('Microphone access blocked. Please click the lock icon in your browser address bar and "Allow" the microphone to continue.');
          console.error('Microphone access denied:', event.error);
        } else if (event.error === 'aborted') {
          console.warn('Recognition aborted');
        } else if (event.error === 'no-speech') {
          // No speech detected - don't treat as a scary system error, but give feedback
          setError("Listening timed out. Tap the mic and speak when you're ready.");
          console.info('No speech detected during session');
        } else if (event.error === 'audio-capture') {
          setError("Microphone not detected. Please ensure it is plugged in correctly.");
        } else {
          console.error('Speech recognition technical error:', event.error);
          setError(`Speech intelligence interrupted: ${event.error}. Please try again.`);
        }
      };
    }

    return () => {
      if (recognitionRef.current && isStartedRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  /**
   * Neural Analysis Engine
   * Processes the natural language input when the user explicitly submits.
   */
  const handleAIPreview = async (text: string) => {
    if (text.length < 5) return;
    
    setIsProcessing(true);
    const parsed = await parseFinancialStatement(text);
    if (parsed) {
      setPreview(parsed);
    }
    setIsProcessing(false);
  };

  /**
   * Toggles the voice recording state.
   * Includes error handling for microphone access permissions and state conflicts.
   */
  const toggleRecording = () => {
    if (!recognitionRef.current) {
      setError('Speech recognition is not supported in this browser. Please use Chrome.');
      return;
    }

    try {
      if (isStartedRef.current) {
        recognitionRef.current.stop();
      } else {
        setError(null);
        setInputText('');
        setPreview(null);
        recognitionRef.current.start();
      }
    } catch (err: any) {
      if (err.name === 'InvalidStateError') {
        console.warn('Speech engine already in requested state.');
      } else {
        console.error('Speech Engine failure:', err);
        setError('System error: Failed to engage microphone. Ensure no other apps are using it.');
        setIsRecording(false);
        isStartedRef.current = false;
      }
    }
  };

  /**
   * Clears the current input and any pending previews.
   */
  const clearInput = () => {
    setInputText('');
    setPreview(null);
  };

  /**
   * Finalizes the transaction and sends it to the parent state.
   */
  const confirmTransaction = () => {
    if (preview) {
      onTransactionCaptured(preview as Transaction);
      clearInput();
    }
  };

  /**
   * Manually updates specific fields in the preview data.
   */
  const updatePreview = (updates: Partial<Transaction>) => {
    setPreview(prev => prev ? { ...prev, ...updates } : null);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 p-6 z-[60] bg-gradient-to-t from-brand-charcoal via-brand-charcoal/80 to-transparent pt-20">
      <div className="max-w-4xl mx-auto relative px-2">
        
        {/* Validation Review Modal */}
        <AnimatePresence>
          {preview && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="glass-panel w-full max-w-lg p-10 luxury-glow shadow-2xl space-y-8"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-2xl font-bold luxury-text gold-text-gradient">Review Transaction</h3>
                    <p className="text-[10px] uppercase tracking-[0.4em] text-white/30 mt-1">Data Integrity Verification</p>
                  </div>
                  <div className={cn(
                    "p-3 rounded-2xl",
                    preview.type === 'income' ? "bg-emerald-500/10 text-emerald-400" : 
                    preview.type === 'credit' ? "bg-brand-gold/10 text-brand-gold" :
                    "bg-rose-500/10 text-rose-400"
                  )}>
                    <Sparkles className="w-6 h-6" />
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[9px] uppercase tracking-widest text-white/40 font-bold px-1">Extracted Item</label>
                      <input 
                        type="text" 
                        value={preview.product || ''}
                        onChange={(e) => updatePreview({ product: e.target.value })}
                        className="w-full h-12 bg-white/[0.03] border border-white/10 rounded-xl px-4 outline-none text-white focus:border-brand-gold/50 transition-all font-display italic"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] uppercase tracking-widest text-white/40 font-bold px-1">Quantity</label>
                      <input 
                        type="text" 
                        value={preview.quantity || ''}
                        onChange={(e) => updatePreview({ quantity: e.target.value })}
                        className="w-full h-12 bg-white/[0.03] border border-white/10 rounded-xl px-4 outline-none text-white focus:border-brand-gold/50 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] uppercase tracking-widest text-white/40 font-bold px-1">Final Price (GH₵)</label>
                    <input 
                      type="number" 
                      value={preview.amount || ''}
                      onChange={(e) => updatePreview({ amount: parseFloat(e.target.value) || 0 })}
                      className="w-full h-14 bg-white/[0.03] border border-white/10 rounded-xl px-6 outline-none text-brand-gold text-2xl font-mono focus:border-brand-gold/50 transition-all"
                    />
                  </div>

                  <div className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <p className="text-[10px] text-white/40 italic">System detected this as a <span className="text-white/60 font-bold uppercase tracking-widest px-1">{preview.type}</span> record.</p>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    onClick={() => setPreview(null)}
                    className="flex-1 h-14 rounded-2xl border border-white/10 text-white/60 hover:bg-white/5 font-bold uppercase tracking-widest transition-all"
                  >
                    Fix / Clear
                  </button>
                  <button 
                    onClick={confirmTransaction}
                    className="flex-[2] h-14 bg-brand-gold text-black rounded-2xl font-bold uppercase tracking-widest hover:bg-white transition-all shadow-xl shadow-brand-gold/30 flex items-center justify-center gap-3"
                  >
                    <Check className="w-5 h-5" /> Approve Record
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input Bar */}
        <div className={cn(
          "glass-panel p-3 flex items-center gap-3 transition-all duration-700 relative",
          isRecording ? " ring-1 ring-rose-500/50 shadow-[0_0_80px_rgba(244,63,94,0.15)]" : "shadow-3xl"
        )}>
          <button
            onClick={toggleRecording}
            className={cn(
              "w-14 h-14 rounded-[1.25rem] flex items-center justify-center transition-all duration-500",
              isRecording ? "bg-rose-500 animate-pulse text-white shadow-lg shadow-rose-500/40" : "text-brand-gold bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.08]"
            )}
          >
            {isRecording ? <Square className="w-6 h-6 fill-current" /> : <Mic className="w-7 h-7" />}
          </button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !isProcessing && handleAIPreview(inputText)}
            placeholder={isRecording ? "Listening to your closest voice..." : "Record business transaction (speak clearly)..."}
            className="flex-1 bg-transparent border-none outline-none text-white text-lg px-2 placeholder:text-white/15 font-light"
          />

          {isProcessing ? (
            <div className="w-14 h-14 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-brand-gold" />
            </div>
          ) : inputText ? (
            <div className="flex items-center gap-3 pr-2">
                <button 
                    onClick={clearInput}
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white/15 hover:text-white hover:bg-white/5"
                >
                    <X className="w-5 h-5" />
                </button>
                <button 
                    onClick={() => handleAIPreview(inputText)}
                    className="w-12 h-12 bg-white/[0.03] border border-white/[0.05] rounded-[1rem] flex items-center justify-center text-brand-gold hover:bg-white/[0.08]"
                >
                    <Send className="w-6 h-6" />
                </button>
            </div>
          ) : (
            <div className="pr-6 pointer-events-none">
                <Sparkles className="w-5 h-5 text-white/5" />
            </div>
          )}
        </div>

        {/* Enterprise Metadata */}
        <div className="mt-4 flex flex-col items-center gap-2 px-4">
          {error && (
            <motion.p 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[10px] text-rose-500 font-bold uppercase tracking-widest bg-rose-500/5 px-4 py-1.5 rounded-full border border-rose-500/10 mb-2"
            >
              {error}
            </motion.p>
          )}
          
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-brand-gold/40 animate-pulse" />
              <span className="text-[9px] uppercase tracking-[0.2em] text-white/20 font-bold">Neural Engine Active</span>
            </div>
            <div className="flex gap-4 text-[9px] uppercase tracking-[0.15em] text-white/10 font-bold">
              <span>English</span>
              <span>•</span>
              <span>Twi</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
