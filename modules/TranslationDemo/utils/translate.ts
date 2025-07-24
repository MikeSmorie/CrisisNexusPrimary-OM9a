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

export function getEDTG(): string {
  const now = new Date();
  return now.toISOString(); // Later upgrade to full EDTG if needed
}