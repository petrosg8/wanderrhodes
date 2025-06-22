export function isPaid() {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('wr_paid') === 'true';
}

export function setPaid(val = true) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('wr_paid', val ? 'true' : 'false');
} 