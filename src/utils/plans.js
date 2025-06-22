// src/utils/plans.js
// Utility helpers to save and retrieve travel plans using localStorage

import { isPaid } from '@/utils/auth';

const FREE_PLAN_KEY = 'wr_free_plan_used';

export function getSavedPlans() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('travelPlans');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function canSaveAnotherPlan() {
  if (isPaid()) return true;
  if (typeof window === 'undefined') return true;
  return localStorage.getItem(FREE_PLAN_KEY) !== 'true';
}

export function savePlan(plan) {
  if (!isPaid()) {
    if (!canSaveAnotherPlan()) {
      return false; // quota reached
    }
    // mark quota used
    if (typeof window !== 'undefined') {
      localStorage.setItem(FREE_PLAN_KEY, 'true');
    }
  }

  const plans = getSavedPlans();
  plans.unshift(plan);
  try {
    localStorage.setItem('travelPlans', JSON.stringify(plans.slice(0, 50)));
  } catch {}
  return true;
}

export function deletePlan(timestamp) {
  const plans = getSavedPlans().filter((p) => p.timestamp !== timestamp);
  localStorage.setItem('travelPlans', JSON.stringify(plans));
} 