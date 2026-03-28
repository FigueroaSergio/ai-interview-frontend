

import { 
  Play, 
  Star, 
  Clock, 
  BarChart3, 
  Building2, 
  Sparkles,
  BrainCircuit,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const NavItem = ({ children, active = false }: { children: React.ReactNode, active?: boolean }) => (
  <a 
    href="#" 
    className={`text-sm font-medium transition-colors hover:text-primary ${
      active ? 'text-primary font-semibold border-b-2 border-primary' : 'text-on-surface-variant'
    }`}
  >
    {children}
  </a>
);

const FeatureCard = ({ 
  icon: Icon, 
  title, 
  description, 
  className = "", 
  children 
}: { 
  icon: any, 
  title: string, 
  description: string, 
  className?: string,
  children?: React.ReactNode
}) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    className={`p-8 rounded-3xl border border-outline-variant/10 bg-surface-container-lowest shadow-sm hover:shadow-md transition-shadow ${className}`}
  >
    <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6">
      <Icon size={24} />
    </div>
    <h3 className="text-2xl font-bold mb-4 tracking-tight">{title}</h3>
    <p className="text-on-surface-variant leading-relaxed mb-6">{description}</p>
    {children}
  </motion.div>
);

const TestimonialCard = ({ quote, author, role, image }: { quote: string, author: string, role: string, image: string }) => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.95 }}
    whileInView={{ opacity: 1, scale: 1 }}
    viewport={{ once: true }}
    className="bg-surface-container-lowest p-10 rounded-3xl shadow-sm border border-outline-variant/10 flex flex-col"
  >
    <div className="flex gap-1 mb-6 text-primary">
      {[...Array(5)].map((_, i) => <Star key={i} size={18} fill="currentColor" />)}
    </div>
    <p className="text-on-surface text-lg italic leading-relaxed mb-8 flex-grow">"{quote}"</p>
    <div className="flex items-center gap-4">
      <img 
        src={image} 
        alt={author} 
        className="w-12 h-12 rounded-full object-cover"
        referrerPolicy="no-referrer"
      />
      <div>
        <p className="font-bold text-on-surface">{author}</p>
        <p className="text-xs text-on-surface-variant">{role}</p>
      </div>
    </div>
  </motion.div>
);

export const Landing = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate(); 

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl border-b border-outline-variant/10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
          <div className="flex items-center gap-8">
            <span className="text-xl font-bold tracking-tighter text-on-surface">CognitiveSanctuary</span>
            <div className="hidden md:flex gap-6">
              <NavItem active>Features</NavItem>
              {/* <NavItem>Pricing</NavItem>
              <NavItem>Resources</NavItem> */}
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-4">
            <button className="text-sm font-medium text-on-surface-variant hover:text-primary transition-colors">Sign In</button>
            <button onClick={() => navigate("/setup")} className="bg-primary text-white px-5 py-2 rounded-xl text-sm font-semibold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all">
              Get Started
            </button>
          </div>

          <button className="md:hidden text-on-surface" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-b border-outline-variant/10 p-6 space-y-4">
            <a href="#" className="block text-lg font-medium">Features</a>
            {/* <a href="#" className="block text-lg font-medium">Pricing</a>
            <a href="#" className="block text-lg font-medium">Resources</a> */}
            <div className="pt-4 flex flex-col gap-4">
              {/* <button className="w-full py-3 text-center font-medium border border-outline-variant/20 rounded-xl">Sign In</button> */}
              <button className="w-full py-3 text-center font-medium bg-primary text-white rounded-xl" onClick={() => navigate("/setup")}>Get Started</button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-24 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container text-primary text-xs font-bold mb-8 uppercase tracking-widest"
          >
            <Sparkles size={14} />
            Next-Gen Career Intelligence
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-black tracking-tighter text-on-surface mb-6 max-w-4xl leading-[1.1]"
          >
            Master Your Next <span className="text-primary italic">Interview</span> with AI
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-on-surface-variant text-lg md:text-xl max-w-2xl mb-12 leading-relaxed"
          >
            A personalized cognitive sanctuary designed to elevate your performance. Get real-time feedback, behavioral analysis, and expert coaching available 24/7.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <button onClick={()=>navigate("/setup")}   className="px-8 py-4 bg-primary text-white rounded-xl text-lg font-bold shadow-xl shadow-primary/25 hover:scale-[1.02] transition-transform active:scale-95">
              Start Free Trial
            </button>
            <button onClick={()=>navigate("/setup")} className="px-8 py-4 bg-surface-container-highest text-on-surface rounded-xl text-lg font-bold hover:bg-surface-container-high transition-colors">
              Watch Demo
            </button>
          </motion.div>

          {/* Hero Visual */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="mt-20 w-full max-w-6xl relative"
          >
            <div className="absolute inset-0 bg-primary/5 blur-[120px] rounded-full -z-10"></div>
            <div className="relative rounded-[2.5rem] overflow-hidden border border-outline-variant/15 shadow-2xl">
              <img 
                src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=2000" 
                alt="Professional interview" 
                className="w-full aspect-[21/9] object-cover"
                referrerPolicy="no-referrer"
              />
              {/* Floating AI Feedback */}
              <motion.div 
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 1, duration: 0.5 }}
                className="absolute bottom-8 left-8 glass-panel p-6 rounded-2xl border border-white/20 shadow-xl max-w-sm text-left hidden sm:block"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white">
                    <BrainCircuit size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-tighter">AI Feedback</p>
                    <p className="text-sm font-bold text-on-surface">"Confidence score: 94%"</p>
                  </div>
                </div>
                <p className="text-xs text-on-surface-variant leading-tight">
                  Your response structure for the 'Leadership' question was excellent. Try reducing filler words in the final summary.
                </p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-surface-container-low">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-16">
            <h2 className="text-3xl md:text-5xl font-black tracking-tighter text-on-surface mb-4">Intellectual Edge Features</h2>
            <p className="text-on-surface-variant max-w-xl">Deep insights powered by proprietary behavioral models to give you the advantage.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Adaptive Coaching */}
            <FeatureCard 
              className="md:col-span-2 flex flex-col md:flex-row gap-8 items-center"
              icon={BrainCircuit}
              title="Adaptive AI Coaching"
              description="Our AI doesn't just read scripts. It learns your unique communication style and challenges you with dynamic follow-up questions tailored to your target industry."
            >
              <div className="flex-1 w-full h-full min-h-[240px] rounded-2xl overflow-hidden mt-auto">
                <img 
                  src="https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=1000" 
                  alt="Coaching" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <a href="#" className="text-primary font-bold flex items-center gap-2 group mt-6">
                Learn more <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </a>
            </FeatureCard>

            {/* Always Ready */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-primary text-white p-8 rounded-3xl flex flex-col justify-between shadow-xl shadow-primary/20"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center mb-6">
                  <Clock size={24} />
                </div>
                <h3 className="text-2xl font-bold mb-4">Always Ready</h3>
                <p className="text-white/80 leading-relaxed">Practice at 3 AM or 10 minutes before the big meeting. Your personal sanctuary is always open.</p>
              </div>
              <div className="mt-12 text-5xl font-black text-white/10 uppercase italic tracking-tighter">Availability</div>
            </motion.div>

            {/* Instant Metrics */}
            <FeatureCard 
              icon={BarChart3}
              title="Instant Metrics"
              description="Get analyzed on pace, tone, sentiment, and keyword relevance. Every session provides a detailed breakdown of your performance."
            />

            {/* Industry Specific */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="md:col-span-2 bg-on-surface text-white p-8 rounded-3xl flex items-center gap-8"
            >
              <div className="hidden sm:flex w-48 h-32 rounded-xl bg-white/10 backdrop-blur-md items-center justify-center">
                <Building2 size={48} className="opacity-50" />
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-2">Industry-Specific Scenarios</h3>
                <p className="text-white/70">From FAANG coding interviews to Wall Street investment banking cases, practice with content that matters.</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
            <div>
              <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-on-surface mb-12 leading-tight">
                The Blueprint to <br/><span className="text-primary">Interview Mastery</span>
              </h2>
              
              <div className="space-y-12">
                {[
                  { step: 1, title: "Select Your Persona", desc: "Choose your industry, company, and role. Our AI adjusts its persona and difficulty level to match reality." },
                  { step: 2, title: "Engage in Video Simulation", desc: "Hop on a simulated video call. The AI analyzes your facial expressions, eye contact, and vocal modulation in real-time." },
                  { step: 3, title: "Review & Refine", desc: "Get a comprehensive transcript with AI-suggested better answers and structured behavioral feedback." }
                ].map((item) => (
                  <div key={item.step} className="flex gap-6">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full border-2 border-primary text-primary flex items-center justify-center font-bold">
                      {item.step}
                    </div>
                    <div>
                      <h4 className="text-xl font-bold mb-2">{item.title}</h4>
                      <p className="text-on-surface-variant">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="aspect-square rounded-[3rem] bg-surface-container-high relative overflow-hidden rotate-3 shadow-2xl">
                <img 
                  src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=1000" 
                  alt="Video Interface" 
                  className="w-full h-full object-cover -rotate-3 scale-110"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/40 to-transparent"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-20 h-20 bg-white rounded-full shadow-2xl flex items-center justify-center text-primary hover:scale-110 transition-transform cursor-pointer">
                    <Play size={32} fill="currentColor" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-surface">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-black tracking-tight text-on-surface">Trusted by Elite Candidates</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <TestimonialCard 
              quote="CognitiveSanctuary was my secret weapon for landing my Senior PM role at Google. The real-time feedback on my response structure was invaluable."
              author="Marcus Thorne"
              role="Product Lead @ Tech Giants"
              image="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200"
            />
            <TestimonialCard 
              quote="The UI is so calming. It actually felt like a sanctuary during a stressful job hunt. The AI coaching felt human and genuinely insightful."
              author="Sarah Jenkins"
              role="Data Scientist @ Fintech Pro"
              image="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200"
            />
            <TestimonialCard 
              quote="I've used other mock interview tools, but nothing compares to the behavioral analysis here. It caught my nervous habits I never noticed."
              author="Kevin Zhang"
              role="Investment Analyst @ Morgan S."
              image="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto bg-primary rounded-[3rem] p-12 md:p-24 text-center text-white relative overflow-hidden">
          <div className="absolute inset-0 grid-pattern opacity-20 pointer-events-none"></div>
          <div className="relative z-10">
            <h2 className="text-4xl md:text-6xl font-black mb-6 tracking-tighter">Ready to secure your future?</h2>
            <p className="text-lg md:text-xl text-white/80 mb-12 max-w-2xl mx-auto">Join over 10,000 candidates who used CognitiveSanctuary to get their dream job offers.</p>
            <button onClick={() => navigate("/setup")}  className="bg-white text-primary px-10 py-5 rounded-2xl text-xl font-bold shadow-2xl hover:scale-105 transition-transform active:scale-95">
              Get Started for Free
            </button>
            <p className="mt-8 text-white/60 text-sm">No credit card required. 7-day full access trial.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-outline-variant/10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <p className="text-xs text-on-surface-variant">© 2026 Cognitive Sanctuary AI. Editorial Grade Career Partner.</p>
          <div className="flex gap-8">
            {['Privacy Policy', 'Terms of Service', 'Help Center', 'Contact'].map((link) => (
              <a key={link} href="#" className="text-xs text-on-surface-variant hover:text-primary transition-colors underline underline-offset-4 decoration-primary/30">
                {link}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
