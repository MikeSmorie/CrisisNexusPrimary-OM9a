import { useState } from 'react';

export function CallerInput({ onInput }: { onInput: (text: string) => void }) {
  const [text, setText] = useState('');

  return (
    <div>
      <h2 className="text-lg font-semibold mb-2">📞 Caller Input</h2>
      <textarea
        placeholder="Type or speak crisis message in any language"
        className="w-full p-2 border rounded"
        rows={6}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button
        className="mt-2 px-4 py-2 bg-blue-600 text-white rounded"
        onClick={() => onInput(text)}
      >
        Submit
      </button>
    </div>
  );
}