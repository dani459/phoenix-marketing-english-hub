import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Minus, 
  Square, 
  Send, 
  Sparkles, 
  Bot, 
  BrainCircuit, 
  Trash2,
  LogIn,
  LogOut,
  ChevronRight,
  HelpCircle,
  RotateCcw,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { auth, db, loginWithGoogle, logoutUser, handleFirestoreError, OperationType } from '../firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { StudentProfile, Message, AssistantChatData } from '../types';
import { createAssistantChat, analyzeStudentProfile } from '../services/assistantService';

interface AssistantWindowProps {
  isOpen: boolean;
  onClose: () => void;
  isMaximized: boolean;
  onMaximize: () => void;
  isMinimized: boolean;
  onMinimize: () => void;
}

const DEFAULT_GUEST_PROFILE: StudentProfile = {
  uid: 'guest',
  memory: 'Marketing professional focused on digital strategy, client proposals, pitch fluency, and professional executive vocabulary.',
  style: 'Polite and ambitious marketing professional aiming for natural business communication.',
  tone: 'Professional, curious, and receptive to constructive feedback.',
  updatedAt: new Date().toISOString()
};

const SUGGESTED_GRAMMAR_QUESTIONS = [
  "Should I say 'in the campaign' or 'on the campaign'?",
  "How can I politely disagree with a client's brief?",
  "What is the difference between 'target audience' and 'demographic'?",
  "Can you review this sentence: 'We have did three launches this quarter'?"
];

export const AssistantWindow: React.FC<AssistantWindowProps> = ({
  isOpen,
  onClose,
  isMaximized,
  onMaximize,
  isMinimized,
  onMinimize
}) => {
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem('phoenix_assistant_chats');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(auth.currentUser);
  const [profile, setProfile] = useState<StudentProfile>(() => {
    try {
      const saved = localStorage.getItem('phoenix_student_profile');
      return saved ? JSON.parse(saved) : DEFAULT_GUEST_PROFILE;
    } catch {
      return DEFAULT_GUEST_PROFILE;
    }
  });
  const [showMemoryPanel, setShowMemoryPanel] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const chatSessionRef = useRef<any>(null);

  // Monitor Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Sync with Firestore when logged in, or local storage when guest
  useEffect(() => {
    if (!isOpen) return;

    if (currentUser) {
      const userId = currentUser.uid;
      const profileRef = doc(db, 'studentProfiles', userId);
      
      const profileUnsub = onSnapshot(
        profileRef, 
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data() as StudentProfile;
            setProfile(data);
            localStorage.setItem('phoenix_student_profile', JSON.stringify(data));
          } else {
            const newProfile: StudentProfile = {
              uid: userId,
              memory: profile.memory || DEFAULT_GUEST_PROFILE.memory,
              style: profile.style || DEFAULT_GUEST_PROFILE.style,
              tone: profile.tone || DEFAULT_GUEST_PROFILE.tone,
              updatedAt: new Date().toISOString()
            };
            setDoc(profileRef, newProfile).catch((err) => {
              handleFirestoreError(err, OperationType.WRITE, 'studentProfiles');
            });
            setProfile(newProfile);
          }
        },
        (error) => {
          handleFirestoreError(error, OperationType.GET, 'studentProfiles');
        }
      );

      const chatRef = doc(db, 'assistantChats', userId);
      const chatUnsub = onSnapshot(
        chatRef, 
        (snapshot) => {
          if (snapshot.exists()) {
            const chatData = snapshot.data() as AssistantChatData;
            if (chatData.messages && Array.isArray(chatData.messages)) {
              setMessages(chatData.messages);
              localStorage.setItem('phoenix_assistant_chats', JSON.stringify(chatData.messages));
            }
          } else {
            setDoc(chatRef, { uid: userId, messages: messages.length > 0 ? messages : [] }).catch((err) => {
              handleFirestoreError(err, OperationType.WRITE, 'assistantChats');
            });
          }
        },
        (error) => {
          handleFirestoreError(error, OperationType.GET, 'assistantChats');
        }
      );

      return () => {
        profileUnsub();
        chatUnsub();
      };
    } else {
      // Guest mode: ensure local persistence
      try {
        const savedProfile = localStorage.getItem('phoenix_student_profile');
        if (savedProfile) {
          setProfile(JSON.parse(savedProfile));
        }
        const savedChats = localStorage.getItem('phoenix_assistant_chats');
        if (savedChats) {
          setMessages(JSON.parse(savedChats));
        }
      } catch (err) {
        console.error("Local storage load error:", err);
      }
    }
  }, [currentUser, isOpen]);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async (textToSend?: string) => {
    const questionText = (textToSend || input).trim();
    if (!questionText || isLoading) return;

    setErrorMessage(null);
    setInput('');

    const userMessage: Message = {
      role: 'user',
      text: questionText,
      timestamp: new Date().toISOString()
    };

    // Optimistic UI update
    const updatedMessagesWithUser = [...messages, userMessage];
    setMessages(updatedMessagesWithUser);
    setIsLoading(true);

    // Save immediately to local storage
    try {
      localStorage.setItem('phoenix_assistant_chats', JSON.stringify(updatedMessagesWithUser));
    } catch {
      // Ignore storage quota
    }

    try {
      // Ensure chat session is ready with updated system instructions
      if (!chatSessionRef.current) {
        chatSessionRef.current = createAssistantChat(profile || DEFAULT_GUEST_PROFILE);
      }

      // Send to Gemini model with the required object format { message: text }
      const result = await chatSessionRef.current.sendMessage({
        message: questionText
      });

      const replyText = result.text?.trim() || "I have received your question. Here is some guidance on grammar and professional phrasing.";

      const modelMessage: Message = {
        role: 'model',
        text: replyText,
        timestamp: new Date().toISOString()
      };

      const finalMessages = [...updatedMessagesWithUser, modelMessage];
      setMessages(finalMessages);

      // Save locally
      try {
        localStorage.setItem('phoenix_assistant_chats', JSON.stringify(finalMessages));
      } catch {
        // Ignore storage error
      }

      // Save to Firestore if authenticated
      if (currentUser) {
        try {
          await setDoc(doc(db, 'assistantChats', currentUser.uid), {
            uid: currentUser.uid,
            messages: finalMessages
          }, { merge: true });
        } catch (dbErr) {
          handleFirestoreError(dbErr, OperationType.WRITE, `assistantChats/${currentUser.uid}`);
        }
      }

      // Proactively update student memory and linguistic profile
      if (finalMessages.length % 3 === 0) {
        try {
          const updates = await analyzeStudentProfile(finalMessages, profile);
          if (updates && Object.keys(updates).length > 0) {
            const updatedProfile: StudentProfile = {
              ...profile,
              ...updates,
              updatedAt: new Date().toISOString()
            };
            setProfile(updatedProfile);
            localStorage.setItem('phoenix_student_profile', JSON.stringify(updatedProfile));

            if (currentUser) {
              await updateDoc(doc(db, 'studentProfiles', currentUser.uid), {
                ...updates,
                updatedAt: new Date().toISOString()
              }).catch((e) => handleFirestoreError(e, OperationType.UPDATE, `studentProfiles/${currentUser.uid}`));
            }
          }
        } catch (analysisErr) {
          console.warn("Profile memory update notice:", analysisErr);
        }
      }

    } catch (error: any) {
      console.error("Assistant invocation error:", error);
      const errorText = "I encountered a slight communication delay connecting to the AI language engine. Please check your network or try asking again in a moment!";
      
      const errorAssistantMsg: Message = {
        role: 'model',
        text: errorText,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, errorAssistantMsg]);
      setErrorMessage("Could not reach the assistant service. Please try again.");
      
      // Reset chat session to recover cleanly on subsequent attempt
      chatSessionRef.current = null;
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = async () => {
    if (!window.confirm("Are you sure you want to clear your conversation history?")) return;
    setMessages([]);
    localStorage.removeItem('phoenix_assistant_chats');
    chatSessionRef.current = null;

    if (currentUser) {
      try {
        await setDoc(doc(db, 'assistantChats', currentUser.uid), {
          uid: currentUser.uid,
          messages: []
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `assistantChats/${currentUser.uid}`);
      }
    }
  };

  const handleGoogleAuth = async () => {
    try {
      if (currentUser) {
        await logoutUser();
      } else {
        await loginWithGoogle();
      }
    } catch (err) {
      console.error("Auth action failed:", err);
    }
  };

  if (isMinimized || !isOpen) return null;

  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0, y: 30 }}
      animate={{ 
        scale: 1, 
        opacity: 1, 
        y: 0,
        top: isMaximized ? 0 : '3.5rem',
        left: isMaximized ? 0 : 'auto',
        right: isMaximized ? 0 : '3rem',
        bottom: isMaximized ? '3rem' : '5rem',
        width: isMaximized ? '100%' : '480px',
        borderRadius: isMaximized ? 0 : '1.25rem'
      }}
      exit={{ scale: 0.95, opacity: 0, y: 30 }}
      className="fixed mica win-shadow-lg flex flex-col overflow-hidden z-50 border border-white/50 bg-white/75 backdrop-blur-xl shadow-2xl"
    >
      {/* Title Bar with Circular Window Controls (Close Red, Minimize Yellow, Maximize Green) */}
      <div className="h-11 bg-white/60 backdrop-blur-md flex items-center justify-between px-4 border-b border-black/5 select-none shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm">
            <Bot size={16} className="text-white" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-800 tracking-tight">AI Language Coach</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold border border-emerald-200 uppercase tracking-wider">
                Proactive
              </span>
            </div>
            <span className="text-[10px] text-gray-500 font-medium">
              {currentUser ? (currentUser.displayName || currentUser.email) : "Guest Mode (Local Persistence)"}
            </span>
          </div>
        </div>

        {/* Circular Window Controls */}
        <div className="flex items-center gap-2">
          {/* Minimize Yellow */}
          <button
            onClick={onMinimize}
            className="w-3.5 h-3.5 rounded-full bg-[#f5b838] hover:bg-[#e0a224] flex items-center justify-center text-[#543b00] shadow-sm transition-transform hover:scale-110 active:scale-95 group/btn"
            title="Minimize"
          >
            <Minus size={8} strokeWidth={3} className="opacity-70 group-hover/btn:opacity-100" />
          </button>
          {/* Maximize Green */}
          <button
            onClick={onMaximize}
            className="w-3.5 h-3.5 rounded-full bg-[#34c759] hover:bg-[#28a745] flex items-center justify-center text-[#064214] shadow-sm transition-transform hover:scale-110 active:scale-95 group/btn"
            title="Maximize"
          >
            <Square size={7} strokeWidth={3} className="opacity-70 group-hover/btn:opacity-100" />
          </button>
          {/* Close Red */}
          <button
            onClick={onClose}
            className="w-3.5 h-3.5 rounded-full bg-[#ff5f57] hover:bg-[#e0443e] flex items-center justify-center text-[#4a0806] shadow-sm transition-transform hover:scale-110 active:scale-95 group/btn"
            title="Close"
          >
            <X size={8} strokeWidth={3} className="opacity-70 group-hover/btn:opacity-100" />
          </button>
        </div>
      </div>

      {/* Top Utility Subheader */}
      <div className="px-4 py-2 bg-gray-50/80 border-b border-gray-200/60 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowMemoryPanel(!showMemoryPanel)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-semibold transition-all ${
              showMemoryPanel 
                ? 'bg-win-accent text-white shadow-xs' 
                : 'bg-white/80 hover:bg-white text-gray-700 border border-gray-200 shadow-2xs'
            }`}
          >
            <BrainCircuit size={13} className={showMemoryPanel ? "text-white" : "text-win-accent"} />
            <span>Memory & Style</span>
          </button>
          <button
            onClick={handleGoogleAuth}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium text-gray-600 bg-white/80 hover:bg-white border border-gray-200 transition-all shadow-2xs"
            title={currentUser ? "Sign out" : "Sign in to sync with Firebase"}
          >
            {currentUser ? (
              <>
                <LogOut size={12} className="text-gray-500" />
                <span>Sign Out</span>
              </>
            ) : (
              <>
                <LogIn size={12} className="text-win-accent" />
                <span>Sync with Google</span>
              </>
            )}
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button 
            onClick={handleClearChat} 
            className="p-1.5 hover:bg-red-50 rounded-md text-gray-400 hover:text-red-500 transition-colors"
            title="Clear Chat History"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Memory & Style Drawer */}
      <AnimatePresence>
        {showMemoryPanel && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-white/95 border-b border-indigo-100 px-4 py-3 text-xs space-y-2 shadow-xs"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-gray-800 flex items-center gap-1.5">
                <Sparkles size={13} className="text-indigo-600" />
                Learned Student Memory & Profile
              </span>
              <span className="text-[10px] text-gray-400">Updates dynamically</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="p-2.5 rounded-lg bg-indigo-50/60 border border-indigo-100 space-y-1">
                <p className="font-semibold text-indigo-900 text-[11px]">Observed Style & Habits</p>
                <p className="text-[11px] text-indigo-800/90 leading-relaxed">{profile.style}</p>
              </div>
              <div className="p-2.5 rounded-lg bg-purple-50/60 border border-purple-100 space-y-1">
                <p className="font-semibold text-purple-900 text-[11px]">Tone & Persona</p>
                <p className="text-[11px] text-purple-800/90 leading-relaxed">{profile.tone}</p>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-200/80 space-y-1">
              <p className="font-semibold text-gray-700 text-[11px]">Cumulative Learning Context</p>
              <p className="text-[11px] text-gray-600 leading-relaxed">{profile.memory}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-50/50">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 border border-indigo-200/50 flex items-center justify-center text-indigo-600 shadow-sm">
              <Bot size={28} />
            </div>
            <div className="space-y-1.5 max-w-sm">
              <h3 className="text-base font-bold text-gray-800">Your Dedicated Marketing English Coach</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                I evaluate your grammar, enhance your vocabulary, and provide proactive, polite feedback on everything you write.
              </p>
            </div>

            {/* Quick Prompts */}
            <div className="w-full space-y-2 pt-2">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider text-left">Quick Grammar Checks:</p>
              <div className="flex flex-col gap-1.5">
                {SUGGESTED_GRAMMAR_QUESTIONS.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(q)}
                    className="w-full text-left px-3 py-2 rounded-xl bg-white border border-gray-200/80 text-xs font-medium text-gray-700 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50/30 transition-all flex items-center justify-between group shadow-2xs"
                  >
                    <span>{q}</span>
                    <ChevronRight size={14} className="text-gray-400 group-hover:text-indigo-600 transition-transform group-hover:translate-x-0.5" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[88%] p-3.5 rounded-2xl text-xs md:text-sm shadow-xs leading-relaxed ${
              msg.role === 'user' 
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-tr-none font-medium' 
                : 'bg-white text-gray-800 rounded-tl-none border border-gray-200/80 shadow-xs'
            }`}>
              <div className="whitespace-pre-wrap">{msg.text}</div>
              <div className={`text-[9px] mt-1.5 flex items-center justify-end gap-1 ${
                msg.role === 'user' ? 'text-indigo-200' : 'text-gray-400'
              }`}>
                <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          </motion.div>
        ))}

        {isLoading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
            <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-none border border-gray-200 shadow-xs flex items-center gap-2">
              <span className="text-xs text-gray-500 font-medium">Analyzing grammar & crafting feedback</span>
              <div className="flex gap-1 items-center">
                <motion.div animate={{ scale: [0.8, 1.3, 0.8] }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-1.5 h-1.5 bg-indigo-600 rounded-full" />
                <motion.div animate={{ scale: [0.8, 1.3, 0.8] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.2 }} className="w-1.5 h-1.5 bg-indigo-600 rounded-full" />
                <motion.div animate={{ scale: [0.8, 1.3, 0.8] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.4 }} className="w-1.5 h-1.5 bg-indigo-600 rounded-full" />
              </div>
            </div>
          </motion.div>
        )}

        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
            <AlertCircle size={14} className="shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-3.5 bg-white border-t border-gray-200/80">
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }} 
          className="relative flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask any grammar, phrasing, or marketing English question..."
            disabled={isLoading}
            className="flex-1 bg-gray-50 hover:bg-gray-100/60 focus:bg-white border border-gray-200 focus:border-indigo-500 rounded-xl py-3 pl-4 pr-12 text-xs md:text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-2xs"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="absolute right-2 w-8 h-8 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg flex items-center justify-center hover:opacity-95 active:scale-95 disabled:opacity-40 disabled:scale-100 transition-all shadow-xs cursor-pointer"
            title="Send Message"
          >
            <Send size={15} />
          </button>
        </form>
        <p className="text-[10px] text-gray-400 mt-1.5 text-center">
          Proactive feedback active • Press Enter to send
        </p>
      </div>
    </motion.div>
  );
};
