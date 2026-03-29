import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { InterviewContext } from '../core/state';

interface EvaluationResult {
  overall_score: number;
  strengths: string[];
  weaknesses: string[];
  missed_opportunities: string;
  improved_responses: { question: string; better_version: string }[];
}

export const EvaluationModal: React.FC = () => {
  const state = InterviewContext.useSelector((s) => s);
  const send = InterviewContext.useActorRef().send;
  const navigate = useNavigate();
  const evaluationContext = state.context;

  if (state.matches('setup')) {
    return <Navigate to="/" replace />;
  }

  if (state.matches('evaluating')) {
    return (
      <div className="flex flex-col h-screen bg-surface justify-center items-center p-6 text-center">
        <h1 className="text-2xl font-bold text-on-surface mb-4">Generating Evaluation...</h1>
        <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
      </div>
    );
  }

  let parsedEvaluation: EvaluationResult | null = null;
  try {
    if (evaluationContext.evaluation) {
      parsedEvaluation = JSON.parse(evaluationContext.evaluation);
    }
  } catch(e) {
    console.warn("Could not parse evaluation", e);
  }

  if (state.matches('error') || (!parsedEvaluation && state.matches('completed'))) {
    return (
      <div className="flex flex-col h-screen bg-surface justify-center items-center p-6 text-center">
        <h1 className="text-2xl font-bold text-[#a8362a] mb-4">Evaluation Error</h1>
        <p className="text-on-surface-variant mb-6">{state.context.errorMessage || "We encountered an issue analyzing your interview results."}</p>
        <div className="flex gap-4 mt-4">
          <button className="bg-[#a8362a] px-6 py-3 rounded-xl text-white font-bold" onClick={() => send({ type: 'RETRY' })}>Retry Evaluation</button>
          <button className="bg-surface-container-highest px-6 py-3 rounded-xl text-on-surface font-bold" onClick={() => navigate('/')}>Return Home</button>
        </div>
      </div>
    );
  }

  if (!parsedEvaluation) {
    // Should not reach here, but safety fallback
    return <Navigate to="/" replace />;
  }

  const { overall_score, strengths, weaknesses, missed_opportunities, improved_responses } = parsedEvaluation;

  // Map improved_responses to original durationMs using context transcript
  const userAnswers = evaluationContext.transcript.filter((t: any) => t.role === 'user');

  return (
    <div className="min-h-screen bg-surface font-sans text-on-surface p-6 md:p-12 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        <header className="mb-12 text-center">
          <h1 className="text-[3rem] font-black tracking-tight mb-4">Interview Evaluation</h1>
          <p className="text-on-surface-variant text-lg">Detailed analysis of your performance.</p>
        </header>

        <section className="bg-surface-container-low rounded-[2rem] p-8 md:p-12 shadow-[0_20px_50px_rgba(23,28,38,0.05)] mb-8 border-none flex flex-col md:flex-row items-center gap-12">
          <div className="flex-shrink-0 text-center">
            <div className={`w-40 h-40 rounded-full flex items-center justify-center text-4xl font-extrabold shadow-inner ${overall_score >= 80 ? 'bg-gradient-to-br from-green-400 to-green-600 text-white' : overall_score >= 60 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white' : 'bg-gradient-to-br from-[#a8362a] to-red-600 text-white'}`}>
              {overall_score}
            </div>
            <span className="block mt-4 text-on-surface-variant font-bold uppercase tracking-widest text-sm">Overall Score</span>
          </div>
          <div className="flex-1 space-y-6">
            <div>
              <h3 className="font-bold text-lg mb-2 text-primary">Key Strengths</h3>
              <ul className="space-y-2">
                {strengths.map((s, idx) => (
                  <li key={idx} className="flex gap-3"><span className="text-primary">•</span>{s}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <section className="bg-surface-container-lowest p-8 rounded-[2rem] shadow-[0_10px_30px_rgba(23,28,38,0.05)]">
            <h3 className="font-bold text-lg mb-4 text-[#a8362a]">Areas for Improvement</h3>
            <ul className="space-y-3">
              {weaknesses.map((w, idx) => (
                <li key={idx} className="flex gap-3 text-on-surface-variant leading-relaxed">
                  <span className="text-[#a8362a] font-black opacity-50">{idx + 1}.</span> {w}
                </li>
              ))}
            </ul>
          </section>
          
          <section className="bg-[#a8362a]/5 p-8 rounded-[2rem]">
            <h3 className="font-bold text-lg mb-4 text-[#a8362a]">Missed Opportunities</h3>
            <p className="text-on-surface-variant leading-relaxed italic">{missed_opportunities || "None identified."}</p>
          </section>
        </div>

        <section className="space-y-6">
          <h2 className="text-2xl font-bold tracking-tight mb-6">Response Breakdown</h2>
          {improved_responses.map((ir, idx) => {
            const answerDetail = userAnswers[idx];
            const answerTimeSec = answerDetail && answerDetail.durationMs ? Math.round(answerDetail.durationMs / 1000) : null;
            
            return (
              <div key={idx} className="bg-surface-container-lowest rounded-2xl p-6 shadow-[0_10px_20px_rgba(23,28,38,0.05)] border border-outline-variant/20">
                <div className="mb-4">
                  <span className="inline-block bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2">Question {idx + 1}</span>
                  <p className="font-medium text-lg leading-relaxed">{ir.question}</p>
                </div>
                
                <div className="bg-surface-container-low p-5 rounded-xl mb-4">
                  <h4 className="font-bold text-sm text-on-surface-variant uppercase tracking-widest mb-2">How to level up (STAR Framework)</h4>
                  <p className="text-on-surface leading-relaxed">{ir.better_version}</p>
                </div>

                {answerTimeSec !== null && (
                  <div className="flex justify-end">
                    <span className="text-xs font-bold text-on-surface-variant opacity-60">Answered in {answerTimeSec}s</span>
                  </div>
                )}
              </div>
            );
          })}
        </section>

        <div className="mt-16 text-center">
          <button onClick={() => navigate('/')} className="bg-gradient-to-br from-primary to-primary-container text-white px-8 py-4 rounded-xl font-bold shadow-lg hover:-translate-y-0.5 transition-transform">
            Start New Interview
          </button>
        </div>
      </div>
    </div>
  );
};
