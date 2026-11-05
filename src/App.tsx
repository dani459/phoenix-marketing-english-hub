import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  LayoutGrid, 
  MessageSquare, 
  User, 
  Settings, 
  X, 
  Maximize2, 
  Minimize2, 
  Send,
  CheckCircle2,
  Trophy,
  BarChart3,
  Lightbulb,
  ArrowRight,
  Monitor,
  BookOpen,
  Sparkles,
  Zap,
  Star,
  Clock,
  ChevronRight,
  Minus,
  Square,
  Lock,
  Target,
  Bot,
  BrainCircuit,
  History
} from 'lucide-react';
import { SIMULATIONS, Simulation } from './constants';
import { createSimulationChat } from './services/geminiService';
import { AssistantWindow } from './components/AssistantWindow';
import { auth, db } from './firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { UserProgress } from './types';
import { GenerateContentResponse } from '@google/genai';

// --- Types ---
interface Message {
  role: 'user' | 'model';
  text: string;
}

interface Feedback {
  vocabularyUsed: string[];
  vocabularyNotUsed: string[];
  fluencyScore: number;
  fluencyExplanation: string;
  clarityScore: number;
  confidenceScore: number;
  sentenceImprovements: { original: string; improved: string }[];
  encouragement: string;
}

// --- Components ---

const WindowsTaskbar = ({ 
  onStartClick, 
  isHubOpen, 
  onHubClick, 
  isHubMinimized,
  isSimOpen,
  onSimClick,
  isSimMinimized,
  isAssistantOpen,
  onAssistantClick,
  isAssistantMinimized
}: { 
  onStartClick: () => void; 
  isHubOpen: boolean;
  onHubClick: () => void;
  isHubMinimized: boolean;
  isSimOpen: boolean;
  onSimClick: () => void;
  isSimMinimized: boolean;
  isAssistantOpen: boolean;
  onAssistantClick: () => void;
  isAssistantMinimized: boolean;
}) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed bottom-0 left-0 right-0 h-12 mica flex items-center justify-between px-4 z-50 border-t border-white/10">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-[11px] font-medium text-gray-700">
          <Monitor size={14} className="opacity-60" />
          <span>Windows 11 Hub</span>
        </div>
      </div>
      
      <div className="flex items-center gap-1">
        <button 
          onClick={onStartClick}
          className="p-2 hover:bg-white/40 rounded-md transition-all duration-200 active:scale-90 group"
        >
          <LayoutGrid size={20} className="text-win-accent group-hover:scale-110 transition-transform" />
        </button>
        <div className="w-10 h-10 flex items-center justify-center hover:bg-white/40 rounded-md transition-all cursor-pointer">
          <Search size={18} className="text-gray-600" />
        </div>
        
        {isHubOpen && (
          <button 
            onClick={onHubClick}
            className={`w-10 h-10 flex items-center justify-center rounded-md transition-all relative group ${
              !isHubMinimized ? 'bg-white/40 shadow-sm' : 'hover:bg-white/20'
            }`}
          >
            <BookOpen size={20} className="text-win-accent group-hover:scale-110 transition-transform" />
            <div className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-0.5 bg-win-accent rounded-full transition-all ${
              !isHubMinimized ? 'w-4' : 'w-1.5'
            }`} />
          </button>
        )}

        {isSimOpen && (
          <button 
            onClick={onSimClick}
            className={`w-10 h-10 flex items-center justify-center rounded-md transition-all relative group ${
              !isSimMinimized ? 'bg-white/40 shadow-sm' : 'hover:bg-white/20'
            }`}
          >
            <MessageSquare size={20} className="text-win-accent group-hover:scale-110 transition-transform" />
            <div className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-0.5 bg-win-accent rounded-full transition-all ${
              !isSimMinimized ? 'w-4' : 'w-1.5'
            }`} />
          </button>
        )}

        {isAssistantOpen && (
          <button 
            onClick={onAssistantClick}
            className={`w-10 h-10 flex items-center justify-center rounded-md transition-all relative group ${
              !isAssistantMinimized ? 'bg-white/40 shadow-sm' : 'hover:bg-white/20'
            }`}
          >
            <Bot size={20} className="text-win-accent group-hover:scale-110 transition-transform" />
            <div className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-0.5 bg-win-accent rounded-full transition-all ${
              !isAssistantMinimized ? 'w-4' : 'w-1.5'
            }`} />
          </button>
        )}
      </div>

      <div className="flex items-center gap-3 text-[11px] font-medium text-gray-700">
        <div className="flex flex-col items-end leading-tight">
          <span>{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          <span className="opacity-60">{time.toLocaleDateString()}</span>
        </div>
        <div className="w-px h-8 bg-black/5 rounded-full" />
      </div>
    </div>
  );
};

const StartMenu = ({ isOpen, onClose, onSelectSimulation, completedIds }: { 
  isOpen: boolean; 
  onClose: () => void;
  onSelectSimulation: (sim: Simulation) => void;
  completedIds: number[];
}) => {
  const progress = (completedIds.length / SIMULATIONS.length) * 100;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/5 backdrop-blur-[2px]" 
            onClick={onClose} 
          />
          <motion.div
            initial={{ y: 100, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 100, opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-16 left-1/2 -translate-x-1/2 w-[640px] h-[580px] mica rounded-2xl win-shadow-lg z-50 p-8 flex flex-col gap-8"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Learning Hub</h2>
                <p className="text-[10px] text-win-accent font-bold uppercase tracking-widest mt-1">
                  Progress: {completedIds.length} / {SIMULATIONS.length} Completed
                </p>
              </div>
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-win-accent transition-colors" size={16} />
                <input 
                  type="text" 
                  placeholder="Search simulations..." 
                  className="bg-white/60 border border-black/5 rounded-full py-2 pl-10 pr-4 text-sm w-72 focus:outline-none focus:ring-2 focus:ring-win-accent/20 transition-all"
                />
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase tracking-tighter">
                <span>Course Mastery</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full h-2 bg-black/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  className="h-full bg-win-accent shadow-[0_0_10px_rgba(0,103,192,0.3)]"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 -mr-2">
              <div className="grid grid-cols-3 gap-4">
                {SIMULATIONS.map((sim) => {
                  const isCompleted = completedIds.includes(sim.id);
                  const isLocked = sim.id > 1 && !completedIds.includes(sim.id - 1);
                  
                  return (
                    <motion.button
                      key={sim.id}
                      disabled={isLocked}
                      whileHover={!isLocked ? { scale: 1.02, backgroundColor: "rgba(255,255,255,0.5)" } : {}}
                      whileTap={!isLocked ? { scale: 0.98 } : {}}
                      onClick={() => {
                        if (!isLocked) {
                          onSelectSimulation(sim);
                          onClose();
                        }
                      }}
                      className={`flex flex-col items-center gap-3 p-5 rounded-xl transition-all border border-transparent relative ${
                        isLocked ? 'opacity-40 cursor-not-allowed' : 'hover:border-white/60 hover:shadow-sm'
                      }`}
                    >
                      {isCompleted && (
                        <div className="absolute top-3 right-3 text-green-500 bg-white rounded-full p-0.5 shadow-sm">
                          <CheckCircle2 size={14} fill="currentColor" className="text-white" />
                        </div>
                      )}
                      {isLocked && (
                        <div className="absolute top-3 right-3 text-gray-400">
                          <Lock size={12} />
                        </div>
                      )}
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
                        isLocked 
                          ? 'bg-gray-100 text-gray-400' 
                          : isCompleted 
                            ? 'bg-green-50 text-green-600' 
                            : 'bg-win-accent/5 text-win-accent'
                      }`}>
                        {isLocked ? <Lock size={24} /> : <MessageSquare size={28} />}
                      </div>
                      <div className="text-center space-y-0.5">
                        <span className={`text-[10px] font-bold uppercase tracking-widest block ${isLocked ? 'text-gray-400' : 'text-win-accent'}`}>
                          Day {sim.id}
                        </span>
                        <span className={`text-xs font-semibold line-clamp-2 leading-tight ${isLocked ? 'text-gray-400' : 'text-gray-800'}`}>
                          {sim.title}
                        </span>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            <div className="pt-6 border-t border-black/5 flex items-center justify-between">
              <div className="flex items-center gap-3 p-2 hover:bg-white/40 rounded-lg transition-colors cursor-pointer group">
                <div className="w-10 h-10 rounded-full bg-win-accent flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
                  <User size={20} />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-gray-900">Marketing Professional</span>
                  <span className="text-[10px] text-gray-500 font-medium">alexanderlopez096@gmail.com</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2.5 hover:bg-white/40 rounded-lg transition-colors text-gray-600">
                  <Settings size={20} />
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const SimulationWindow = ({ 
  simulation, 
  onClose, 
  onComplete,
  isMaximized,
  onMaximize,
  isMinimized,
  onMinimize
}: { 
  simulation: Simulation; 
  onClose: () => void;
  onComplete: (id: number) => void;
  isMaximized: boolean;
  onMaximize: () => void;
  isMinimized: boolean;
  onMinimize: () => void;
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const chatRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initChat = async () => {
      setIsLoading(true);
      try {
        const chat = createSimulationChat(simulation);
        chatRef.current = chat;
        const response = await chat.sendMessage({ message: "Start the simulation now." });
        setMessages([{ role: 'model', text: response.text || '' }]);
      } catch (error) {
        console.error("Failed to start chat:", error);
      } finally {
        setIsLoading(false);
      }
    };
    initChat();
  }, [simulation]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading || feedback) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const response = await chatRef.current.sendMessage({ message: userMessage });
      const text = response.text || '';
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsedFeedback = JSON.parse(jsonMatch[0]);
          const cleanText = text.replace(jsonMatch[0], '').trim();
          if (cleanText) {
            setMessages(prev => [...prev, { role: 'model', text: cleanText }]);
          }
          setFeedback(parsedFeedback);
        } catch (e) {
          setMessages(prev => [...prev, { role: 'model', text }]);
        }
      } else {
        setMessages(prev => [...prev, { role: 'model', text }]);
      }
    } catch (error) {
      console.error("Chat error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isMinimized) return null;

  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0, y: 30 }}
      animate={{ 
        scale: 1, 
        opacity: 1, 
        y: 0,
        top: isMaximized ? 0 : '4rem',
        left: isMaximized ? 0 : '4rem',
        right: isMaximized ? 0 : '4rem',
        bottom: isMaximized ? '3rem' : '7rem',
        borderRadius: isMaximized ? 0 : '1rem'
      }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed mica win-shadow-lg flex flex-col overflow-hidden z-50 border border-white/40"
    >
      {/* Title Bar */}
      <div className="h-10 bg-white/40 backdrop-blur-md flex items-center justify-between px-4 border-b border-black/5 select-none shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md bg-win-accent/10 flex items-center justify-center">
            <MessageSquare size={14} className="text-win-accent" />
          </div>
          <span className="text-[11px] font-bold text-gray-700 tracking-tight">Simulation: Day {simulation.id}</span>
        </div>
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

      <div className="flex-1 flex overflow-hidden bg-white/30">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar"
          >
            {messages.map((m, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] p-4 rounded-2xl shadow-sm border ${
                  m.role === 'user' 
                    ? 'bg-win-accent text-white border-win-accent/20' 
                    : 'bg-white/90 text-gray-800 border-white/60'
                }`}>
                  <p className="text-sm leading-relaxed font-medium">{m.text}</p>
                </div>
              </motion.div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white/90 p-4 rounded-2xl border border-white/60 shadow-sm flex gap-1">
                  <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-win-accent rounded-full" />
                  <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-win-accent rounded-full" />
                  <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-win-accent rounded-full" />
                </div>
              </div>
            )}
          </div>

          {!feedback && (
            <div className="p-6 bg-white/40 border-t border-black/5">
              <div className="max-w-4xl mx-auto relative group">
                <input 
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Type your response..."
                  className="w-full bg-white/80 border border-white/60 rounded-2xl py-4 pl-6 pr-16 text-sm focus:outline-none focus:ring-4 focus:ring-win-accent/10 shadow-sm transition-all"
                />
                <button 
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 bg-win-accent text-white rounded-xl hover:bg-[#005fb8] disabled:opacity-40 transition-all active:scale-90 shadow-md"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Info */}
        <div className="w-80 border-l border-black/5 bg-white/20 p-8 hidden lg:block overflow-y-auto custom-scrollbar">
          {feedback ? (
            <div className="space-y-8 animate-win-fade">
              <div className="flex items-center gap-3 text-win-accent font-black text-[10px] uppercase tracking-[0.2em]">
                <Trophy size={16} />
                <span>Performance Review</span>
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Fluency', score: feedback.fluencyScore },
                  { label: 'Clarity', score: feedback.clarityScore },
                  { label: 'Confidence', score: feedback.confidenceScore }
                ].map(stat => (
                  <div key={stat.label} className="bg-white/60 p-3 rounded-2xl border border-white/40 text-center shadow-sm">
                    <div className="text-xl font-black text-win-accent">{stat.score}</div>
                    <div className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">{stat.label}</div>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Vocabulary Used</div>
                <div className="flex flex-wrap gap-2">
                  {feedback.vocabularyUsed.map(word => (
                    <span key={word} className="px-3 py-1.5 bg-green-50 text-green-700 rounded-xl text-[10px] font-bold border border-green-100 flex items-center gap-1.5">
                      <CheckCircle2 size={12} /> {word}
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Key Improvements</div>
                <div className="space-y-4">
                  {feedback.sentenceImprovements.map((imp, i) => (
                    <div key={i} className="bg-white/40 p-4 rounded-2xl border border-white/40 space-y-2">
                      <div className="text-[10px] text-red-400 line-through font-medium italic">"{imp.original}"</div>
                      <div className="text-xs text-green-700 font-bold leading-relaxed">"{imp.improved}"</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6 bg-win-accent/5 rounded-3xl border border-win-accent/10">
                <p className="text-xs italic text-win-accent/80 font-medium leading-relaxed">"{feedback.encouragement}"</p>
              </div>

              <button 
                onClick={() => {
                  onComplete(simulation.id);
                  onClose();
                }}
                className="w-full py-4 bg-win-accent text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-[#005fb8] transition-all shadow-lg active:scale-95"
              >
                Finish Simulation
              </button>
            </div>
          ) : (
            <div className="space-y-10">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-win-accent font-black text-[10px] uppercase tracking-[0.2em]">
                  <Target size={14} />
                  <span>Mission Goal</span>
                </div>
                <h3 className="text-lg font-black text-gray-900 leading-tight">{simulation.title}</h3>
                <p className="text-xs text-gray-500 font-medium leading-relaxed">{simulation.objective}</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 text-win-accent font-black text-[10px] uppercase tracking-[0.2em]">
                  <BookOpen size={14} />
                  <span>Vocabulary</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {simulation.vocabulary.map(word => {
                    const isUsed = messages.some(m => m.role === 'user' && m.text.toLowerCase().includes(word.toLowerCase()));
                    return (
                      <motion.span 
                        key={word} 
                        initial={false}
                        animate={{ 
                          backgroundColor: isUsed ? "rgba(34, 197, 94, 0.1)" : "rgba(255, 255, 255, 0.5)",
                          color: isUsed ? "#15803d" : "#4b5563",
                          borderColor: isUsed ? "rgba(34, 197, 94, 0.2)" : "rgba(0, 0, 0, 0.05)"
                        }}
                        className="px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all"
                      >
                        {word}
                      </motion.span>
                    );
                  })}
                </div>
              </div>

              <div className="p-6 bg-win-accent/5 rounded-3xl border border-win-accent/10 space-y-3">
                <div className="flex items-center gap-2 text-win-accent/60 font-black text-[10px] uppercase tracking-[0.2em]">
                  <Sparkles size={14} />
                  <span>Pro Tip</span>
                </div>
                <p className="text-xs text-win-accent/80 leading-relaxed font-medium">
                  Try to use at least 4 vocabulary words in full sentences to complete the challenge!
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const LearningHubWindow = ({ 
  isOpen, 
  onClose, 
  onSelectSimulation, 
  completedIds,
  isMaximized,
  onMaximize,
  isMinimized,
  onMinimize
}: { 
  isOpen: boolean; 
  onClose: () => void;
  onSelectSimulation: (sim: Simulation) => void;
  completedIds: number[];
  isMaximized: boolean;
  onMaximize: () => void;
  isMinimized: boolean;
  onMinimize: () => void;
}) => {
  const progress = (completedIds.length / SIMULATIONS.length) * 100;

  if (isMinimized) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 30 }}
          animate={{ 
            scale: 1, 
            opacity: 1, 
            y: 0,
            top: isMaximized ? 0 : '2rem',
            left: isMaximized ? 0 : '2rem',
            right: isMaximized ? 0 : '2rem',
            bottom: isMaximized ? '3rem' : '5rem',
            borderRadius: isMaximized ? 0 : '1rem'
          }}
          exit={{ scale: 0.95, opacity: 0, y: 30 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed mica win-shadow-lg flex flex-col overflow-hidden z-40 border border-white/40"
        >
          {/* Title Bar */}
          <div className="h-10 bg-white/40 backdrop-blur-md flex items-center justify-between px-4 border-b border-black/5 select-none shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-md bg-win-accent/10 flex items-center justify-center">
                <BookOpen size={14} className="text-win-accent" />
              </div>
              <span className="text-[11px] font-bold text-gray-700 tracking-tight">Learning Hub</span>
            </div>
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

          <div className="flex-1 overflow-y-auto bg-white/30 custom-scrollbar">
            <div className="max-w-6xl mx-auto px-6 py-10 md:px-12 md:py-16 space-y-12">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div className="space-y-4 animate-win-fade">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-win-accent/10 rounded-full text-win-accent">
                    <Sparkles size={14} className="animate-pulse" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Interactive Learning</span>
                  </div>
                  <h1 className="text-5xl font-extrabold text-gray-900 tracking-tight leading-tight">
                    Master Your <br />
                    <span className="text-win-accent">Marketing English</span>
                  </h1>
                  <p className="text-lg text-gray-500 max-w-xl font-medium leading-relaxed">
                    Dive into realistic business scenarios and sharpen your communication skills with AI-powered feedback.
                  </p>
                </div>
                
                <div className="flex items-center gap-6 bg-white/80 p-5 rounded-2xl border border-white/60 shadow-sm animate-win-fade">
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Current Streak</span>
                    <span className="text-2xl font-black text-gray-900 flex items-center gap-1.5">
                      <Zap size={20} className="text-orange-500 fill-orange-500" /> 3 Days
                    </span>
                  </div>
                  <div className="w-px h-12 bg-gray-200" />
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Points</span>
                    <span className="text-2xl font-black text-gray-900 flex items-center gap-1.5">
                      <Star size={20} className="text-yellow-500 fill-yellow-500" /> {completedIds.length * 150}
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress Overview Card */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="lg:col-span-2 bg-gradient-to-br from-win-accent to-[#005fb8] p-10 rounded-[2rem] text-white shadow-xl relative overflow-hidden group"
                >
                  <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-110 transition-transform duration-700">
                    <Trophy size={200} />
                  </div>
                  <div className="relative z-10 space-y-8">
                    <div className="flex items-center justify-between">
                      <h3 className="text-2xl font-bold">Your Learning Journey</h3>
                      <span className="bg-white/20 px-4 py-1.5 rounded-full text-xs font-bold backdrop-blur-md border border-white/20">
                        {completedIds.length} / {SIMULATIONS.length} Completed
                      </span>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm font-bold tracking-tight">
                        <span>Course Completion</span>
                        <span>{Math.round(progress)}%</span>
                      </div>
                      <div className="w-full h-4 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm p-1 border border-white/10">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          className="h-full bg-white rounded-full shadow-[0_0_20px_rgba(255,255,255,0.6)]"
                        />
                      </div>
                    </div>
                    <p className="text-base text-white/90 max-w-lg font-medium leading-relaxed">
                      You're doing great! Complete {SIMULATIONS.length - completedIds.length} more simulations to unlock your Marketing English Certificate.
                    </p>
                  </div>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white/90 p-8 rounded-[2rem] border border-white/60 shadow-lg flex flex-col justify-between"
                >
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 text-gray-900 font-bold">
                      <div className="w-8 h-8 rounded-lg bg-win-accent/10 flex items-center justify-center">
                        <Clock size={18} className="text-win-accent" />
                      </div>
                      <span className="text-lg">Recent Activity</span>
                    </div>
                    <div className="space-y-4">
                      {SIMULATIONS.slice(0, 2).map(sim => (
                        <div key={sim.id} className="flex items-center gap-4 p-3 hover:bg-black/5 rounded-2xl transition-all cursor-pointer group">
                          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center group-hover:bg-white transition-colors">
                            <MessageSquare size={16} className="text-gray-400 group-hover:text-win-accent transition-colors" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-800 truncate">Day {sim.id}: {sim.title}</p>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">2 hours ago</p>
                          </div>
                          <ChevronRight size={16} className="text-gray-300 group-hover:text-win-accent transition-colors" />
                        </div>
                      ))}
                    </div>
                  </div>
                  <button className="w-full py-4 text-win-accent text-xs font-bold uppercase tracking-widest hover:bg-win-accent/5 rounded-2xl transition-all active:scale-95 mt-6">
                    View All Activity
                  </button>
                </motion.div>
              </div>

              {/* Simulation Grid */}
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <h2 className="text-3xl font-black text-gray-900 tracking-tight">Available Simulations</h2>
                  <div className="flex gap-2 p-1 bg-black/5 rounded-full">
                    <button className="px-5 py-1.5 bg-white text-win-accent text-[10px] font-black rounded-full shadow-sm">ALL</button>
                    <button className="px-5 py-1.5 text-gray-500 text-[10px] font-black rounded-full hover:bg-white/50 transition-all">COMPLETED</button>
                    <button className="px-5 py-1.5 text-gray-500 text-[10px] font-black rounded-full hover:bg-white/50 transition-all">PENDING</button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {SIMULATIONS.map((sim, index) => {
                    const isCompleted = completedIds.includes(sim.id);
                    const isLocked = sim.id > 1 && !completedIds.includes(sim.id - 1);

                    return (
                      <motion.div
                        key={sim.id}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 + 0.2 }}
                        whileHover={!isLocked ? { y: -10, scale: 1.02 } : {}}
                        onClick={() => !isLocked && onSelectSimulation(sim)}
                        className={`p-8 rounded-[2.5rem] border transition-all relative overflow-hidden group ${
                          isLocked 
                            ? 'bg-gray-100/40 border-gray-200 cursor-not-allowed opacity-60' 
                            : isCompleted
                              ? 'bg-green-50/40 border-green-100 hover:border-green-300 hover:shadow-2xl cursor-pointer'
                              : 'bg-white/80 border-white/60 hover:border-win-accent/40 hover:shadow-2xl cursor-pointer'
                        }`}
                      >
                        {isCompleted && (
                          <div className="absolute top-6 right-6 z-10">
                            <motion.div 
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="bg-green-500 text-white p-1.5 rounded-full shadow-lg"
                            >
                              <CheckCircle2 size={18} fill="currentColor" />
                            </motion.div>
                          </div>
                        )}

                        {isLocked && (
                          <div className="absolute top-6 right-6 z-10 text-gray-400">
                            <Lock size={22} />
                          </div>
                        )}
                        
                        <div className="space-y-6 relative z-10">
                          <div className={`w-16 h-16 rounded-3xl flex items-center justify-center transition-all duration-500 ${
                            !isLocked ? 'group-hover:rotate-6 group-hover:scale-110' : ''
                          } ${
                            isLocked 
                              ? 'bg-gray-200 text-gray-400'
                              : isCompleted 
                                ? 'bg-green-100 text-green-600' 
                                : 'bg-win-accent/5 text-win-accent'
                          }`}>
                            {isLocked ? <Lock size={32} /> : (index % 3 === 0 ? <MessageSquare size={32} /> : index % 3 === 1 ? <Zap size={32} /> : <Sparkles size={32} />)}
                          </div>
                          
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${isLocked ? 'text-gray-400' : 'text-win-accent'}`}>
                                Day {sim.id}
                              </span>
                              <div className="w-1 h-1 bg-gray-300 rounded-full" />
                              <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{sim.vocabulary.length} Words</span>
                            </div>
                            <h4 className={`text-xl font-black transition-colors leading-tight ${
                              isLocked ? 'text-gray-400' : 'text-gray-900 group-hover:text-win-accent'
                            }`}>
                              {sim.title}
                            </h4>
                            <p className={`text-sm line-clamp-2 leading-relaxed font-medium ${isLocked ? 'text-gray-400' : 'text-gray-500'}`}>
                              {isLocked ? "Complete the previous day to unlock this simulation." : sim.scenario}
                            </p>
                          </div>

                          <div className={`pt-6 flex items-center justify-between border-t ${isLocked ? 'border-gray-200' : 'border-gray-100'}`}>
                            {!isLocked ? (
                              <>
                                <div className="flex -space-x-3">
                                  {[1, 2, 3].map(i => (
                                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-[8px] font-bold text-gray-500 overflow-hidden shadow-sm">
                                      <img src={`https://i.pravatar.cc/100?u=${sim.id + i}`} alt="" referrerPolicy="no-referrer" />
                                    </div>
                                  ))}
                                  <div className={`w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-black shadow-sm ${
                                    isCompleted ? 'bg-green-100 text-green-600' : 'bg-win-accent/10 text-win-accent'
                                  }`}>
                                    +12
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5 text-xs font-black text-win-accent group-hover:translate-x-2 transition-transform">
                                  {isCompleted ? 'REVIEW' : 'PRACTICE'} <ArrowRight size={16} />
                                </div>
                              </>
                            ) : (
                              <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                <Lock size={14} /> Locked
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Decorative background element */}
                        <div className={`absolute -bottom-6 -right-6 w-32 h-32 rounded-full blur-3xl transition-all duration-700 ${
                          isLocked ? 'bg-gray-200/20' : isCompleted ? 'bg-green-200/30' : 'bg-win-accent/5 group-hover:bg-win-accent/20 group-hover:scale-150'
                        }`} />
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default function App() {
  const [isStartOpen, setIsStartOpen] = useState(false);
  const [isHubOpen, setIsHubOpen] = useState(false);
  const [isHubMaximized, setIsHubMaximized] = useState(false);
  const [isHubMinimized, setIsHubMinimized] = useState(false);
  const [isSimMaximized, setIsSimMaximized] = useState(false);
  const [isSimMinimized, setIsSimMinimized] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isAssistantMaximized, setIsAssistantMaximized] = useState(false);
  const [isAssistantMinimized, setIsAssistantMinimized] = useState(false);
  const [activeSimulation, setActiveSimulation] = useState<Simulation | null>(null);
  const [completedIds, setCompletedIds] = useState<number[]>(() => {
    const saved = localStorage.getItem('completed_simulations');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('completed_simulations', JSON.stringify(completedIds));
  }, [completedIds]);

  const handleComplete = (id: number) => {
    if (!completedIds.includes(id)) {
      setCompletedIds(prev => [...prev, id]);
    }
  };

  const toggleHub = () => {
    if (isHubMinimized) {
      setIsHubMinimized(false);
    } else {
      setIsHubOpen(!isHubOpen);
    }
  };

  const toggleSim = () => {
    if (isSimMinimized) {
      setIsSimMinimized(false);
    }
  };

  const toggleAssistant = () => {
    if (isAssistantMinimized) {
      setIsAssistantMinimized(false);
    } else {
      setIsAssistantOpen(!isAssistantOpen);
    }
  };

  return (
    <div className="h-screen w-screen relative overflow-hidden bg-cover bg-center" style={{ backgroundImage: 'url(https://picsum.photos/seed/windows11/1920/1080)' }}>
      {/* Desktop Icons */}
      <div className="p-8 grid grid-cols-1 gap-8 w-fit relative z-10">
        {/* Learning Hub Icon */}
        <motion.div 
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          className="flex flex-col items-center gap-2 group cursor-pointer" 
          onClick={() => {
            setIsHubOpen(true);
            setIsHubMinimized(false);
          }}
        >
          <div className="relative">
            {/* Icon Glow */}
            <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            {/* Icon Container */}
            <div className="w-14 h-14 relative z-10 rounded-2xl overflow-hidden shadow-2xl transition-all duration-500 group-hover:shadow-blue-500/20">
              {/* Gradient Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700" />
              
              {/* Glass Overlay */}
              <div className="absolute inset-0 bg-white/10 backdrop-blur-[2px] opacity-50" />
              
              {/* Shine Effect */}
              <div className="absolute -top-full -left-full w-[200%] h-[200%] bg-gradient-to-br from-white/30 to-transparent rotate-45 transition-transform duration-1000 group-hover:translate-x-1/2 group-hover:translate-y-1/2" />
              
              {/* Icon */}
              <div className="absolute inset-0 flex items-center justify-center text-white drop-shadow-lg">
                <BookOpen size={28} strokeWidth={2.5} />
              </div>
            </div>
          </div>
          <span className="text-[11px] font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] tracking-wide">Learning Hub</span>
        </motion.div>

        {/* AI Assistant Icon */}
        <motion.div 
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          className="flex flex-col items-center gap-2 group cursor-pointer" 
          onClick={() => {
            setIsAssistantOpen(true);
            setIsAssistantMinimized(false);
          }}
        >
          <div className="relative">
            {/* Icon Glow */}
            <div className="absolute inset-0 bg-violet-500/20 blur-xl rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            {/* Icon Container */}
            <div className="w-14 h-14 relative z-10 rounded-2xl overflow-hidden shadow-2xl transition-all duration-500 group-hover:shadow-violet-500/20">
              {/* Gradient Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500 via-purple-600 to-fuchsia-700" />
              
              {/* Glass Overlay */}
              <div className="absolute inset-0 bg-white/10 backdrop-blur-[2px] opacity-50" />
              
              {/* Shine Effect */}
              <div className="absolute -top-full -left-full w-[200%] h-[200%] bg-gradient-to-br from-white/30 to-transparent rotate-45 transition-transform duration-1000 group-hover:translate-x-1/2 group-hover:translate-y-1/2" />
              
              {/* Icon */}
              <div className="absolute inset-0 flex items-center justify-center text-white drop-shadow-lg">
                <Bot size={28} strokeWidth={2.5} />
              </div>
            </div>
          </div>
          <span className="text-[11px] font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] tracking-wide">AI Assistant</span>
        </motion.div>
      </div>

      {/* Learning Hub Window */}
      <LearningHubWindow 
        isOpen={isHubOpen}
        onClose={() => setIsHubOpen(false)}
        onSelectSimulation={(sim) => {
          setActiveSimulation(sim);
          setIsHubMinimized(true);
          setIsSimMinimized(false);
        }}
        completedIds={completedIds}
        isMaximized={isHubMaximized}
        onMaximize={() => setIsHubMaximized(!isHubMaximized)}
        isMinimized={isHubMinimized}
        onMinimize={() => setIsHubMinimized(true)}
      />

      {/* Active Simulation Window */}
      <AnimatePresence>
        {activeSimulation && (
          <SimulationWindow 
            simulation={activeSimulation} 
            onClose={() => setActiveSimulation(null)} 
            onComplete={handleComplete}
            isMaximized={isSimMaximized}
            onMaximize={() => setIsSimMaximized(!isSimMaximized)}
            isMinimized={isSimMinimized}
            onMinimize={() => setIsSimMinimized(true)}
          />
        )}
      </AnimatePresence>

      {/* AI Assistant Window */}
      <AssistantWindow 
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        isMaximized={isAssistantMaximized}
        onMaximize={() => setIsAssistantMaximized(!isAssistantMaximized)}
        isMinimized={isAssistantMinimized}
        onMinimize={() => setIsAssistantMinimized(true)}
      />

      {/* Start Menu */}
      <StartMenu 
        isOpen={isStartOpen} 
        onClose={() => setIsStartOpen(false)} 
        onSelectSimulation={(sim) => {
          setActiveSimulation(sim);
          setIsStartOpen(false);
          setIsSimMinimized(false);
        }}
        completedIds={completedIds}
      />

      {/* Taskbar */}
      <WindowsTaskbar 
        onStartClick={() => setIsStartOpen(!isStartOpen)} 
        isHubOpen={isHubOpen}
        onHubClick={toggleHub}
        isHubMinimized={isHubMinimized}
        isSimOpen={!!activeSimulation}
        onSimClick={toggleSim}
        isSimMinimized={isSimMinimized}
        isAssistantOpen={isAssistantOpen}
        onAssistantClick={toggleAssistant}
        isAssistantMinimized={isAssistantMinimized}
      />

      {/* Background Overlay for depth */}
      <div className="absolute inset-0 bg-black/5 pointer-events-none" />
    </div>
  );
}
