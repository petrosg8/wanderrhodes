import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '@/components/ui/Logo';
import { getSavedPlans, deletePlan } from '@/utils/plans';
import LocationCard from '@/components/LocationCard';

export default function TravelPlansPage() {
  const [plans, setPlans] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    setPlans(getSavedPlans());
  }, []);

  const handleDelete = (timestamp) => {
    deletePlan(timestamp);
    setPlans(getSavedPlans());
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1f3d] via-[#242b50] to-transparent text-[#F4E1C1] flex flex-col">
      {/* Header */}
      <header className="sticky top-0 bg-[#1a1f3d] py-3 px-4 grid grid-cols-3 items-center z-50">
        <button
          onClick={() => navigate(-1)}
          className="justify-self-start w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition"
        >
          <svg width={20} height={20} viewBox="0 0 20 20" fill="none">
            <path d="M13.5 17L7.5 10L13.5 3" stroke="#F4E1C1" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button onClick={() => navigate('/')} className="justify-self-center flex items-center group">
          <Logo className="h-6 group-hover:opacity-90 transition" />
        </button>
        <div className="w-8" />
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-6">
        {plans.length === 0 ? (
          <p className="text-center text-sm mt-10 opacity-80">No saved travel plans yet.</p>
        ) : (
          plans.map((plan) => (
            <PlanItem key={plan.timestamp} plan={plan} onDelete={() => handleDelete(plan.timestamp)} />
          ))
        )}
      </main>
    </div>
  );
}

function PlanItem({ plan, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();
  const { title, timestamp, locations } = plan;

  return (
    <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-lg p-4">
      <div className="flex justify-between items-center" onClick={() => setExpanded((e) => !e)}>
        <div>
          <h3 className="font-semibold text-[#E8D5A4]">{title || 'Travel Plan'}</h3>
          <p className="text-xs opacity-70">{new Date(timestamp).toLocaleString()}</p>
        </div>
        <div className="flex gap-3 items-center">
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/plans/${timestamp}`);
            }}
            className="text-[#E8D5A4] text-sm hover:underline"
          >
            View
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/chat?plan=${timestamp}`);
            }}
            className="text-[#E8D5A4] text-sm hover:underline"
          >
            Chat
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="text-red-400 text-sm hover:underline"
          >
            Delete
          </button>
        </div>
      </div>
      {expanded && (
        <div className="mt-4 space-y-4">
          {locations.map((loc, idx) => (
            <LocationCard key={idx} location={loc} />
          ))}
        </div>
      )}
    </div>
  );
} 