export async function translateToEnglish(input: string): Promise<string> {
  try {
    const res = await fetch('/api/translate-to-english', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input }),
    });
    const data = await res.json();
    return data.translated || '[Translation failed]';
  } catch (e) {
    return '[Translation error]';
  }
}

export async function translateFromEnglish(input: string, language: string): Promise<string> {
  try {
    const res = await fetch('/api/translate-from-english', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input, targetLanguage: language }),
    });
    const data = await res.json();
    return data.translated || '[Translation failed]';
  } catch (e) {
    return '[Translation error]';
  }
}

// Enhanced Date-Time Group generator - creates LOCKED timestamp for emergency events
// CRITICAL: This timestamp MUST be fixed at moment of creation for forensic logging
export function getEDTG(): string {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const milliseconds = String(now.getMilliseconds()).padStart(3, '0');
  
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
                 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const month = months[now.getMonth()];
  const year = now.getFullYear();
  
  // Return immutable timestamp that locks to the exact moment of event creation
  // Format: YYYY-MM-DDTHH:MM:SS.sssZ (ISO 8601 with milliseconds for precision)
  return `${year}-${String(now.getMonth() + 1).padStart(2, '0')}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}Z`;
}