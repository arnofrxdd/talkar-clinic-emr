/**
 * Generates human-friendly, phonetically distinct medical OPD consultation reference codes
 * e.g., "OPD-7821", "OPD-4012"
 */
export function generateOpdReference(prefix = 'OPD'): string {
  const cleanPrefix = prefix.replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 4) || 'OPD';
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `${cleanPrefix}-${randomSuffix}`;
}

export function sanitizePhone(raw: string): string {
  if (!raw) return '';
  let s = String(raw).trim();
  const match = s.match(/(?:(?:\+|00)?\d{1,4}[-.\s]?)?(?:\(?\d{2,5}\)?[-.\s]?)?\d{3,5}[-.\s]?\d{3,5}/);
  if (match) s = match[0];
  let digits = s.replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) digits = '91' + digits.slice(1);
  if (/^9191\d{10}$/.test(digits)) digits = '91' + digits.slice(4);
  if (digits.length === 10 && /^[6-9]/.test(digits)) digits = '91' + digits;
  if (!digits.startsWith('91') && digits.length === 10) digits = '91' + digits;
  return digits.startsWith('+') ? digits : `+${digits}`;
}
