import { useState } from 'react';

const presets = [
  "Someone is drowning at the beach near Muizenberg.",
  "My girlfriend just fell off a cliff at Lion's Head.",
  "Floodwaters are rising fast in my neighborhood.",
  "Lightning struck a tree that fell on a car with people inside.",
  "There's a violent protest and a fire being started near the municipal office.",
];

export function CallerInput({ onInput }: { onInput: (text: string) => void }) {
  const [text, setText] = useState('');

  const handleSelectPreset = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setText(e.target.value);
    onInput(e.target.value);
  };

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

      <div className="mt-4">
        <label className="block mb-1 text-sm font-medium">📚 Or choose a demo crisis:</label>
        <select
          className="w-full p-2 border rounded"
          value=""
          onChange={handleSelectPreset}
        >
          <option value="">— Select a scenario —</option>
          {presets.map((p, idx) => (
            <option key={idx} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}