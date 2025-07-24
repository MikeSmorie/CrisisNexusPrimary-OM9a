const { Router } = require('express');

const router = Router();

// Translation API routes for real GPT translation
router.post("/translate-to-english", async (req, res) => {
  try {
    const { input } = req.body;
    if (!process.env.OPENAI_API_KEY) {
      return res.json({ translated: `[Simulated English]: ${input}` });
    }
    
    const { default: OpenAI } = await import('openai');
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o', // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        { role: 'system', content: 'Translate any language to English clearly and concisely for emergency response. Focus on extracting key emergency information.' },
        { role: 'user', content: input },
      ],
    });

    res.json({ translated: completion.choices[0].message.content });
  } catch (error: any) {
    console.error('Translation error:', error);
    res.json({ translated: `[Translation Error]: ${error.message}` });
  }
});

router.post("/translate-from-english", async (req, res) => {
  try {
    const { input, targetLanguage } = req.body;
    if (!process.env.OPENAI_API_KEY) {
      return res.json({ translated: `[${targetLanguage} Simulated]: ${input}` });
    }
    
    const { default: OpenAI } = await import('openai');
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o', // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: 'system',
          content: `Translate the following emergency message into ${targetLanguage} in a calm, clear tone suitable for emergency responders. Do not include any English.`,
        },
        { role: 'user', content: input },
      ],
    });

    res.json({ translated: completion.choices[0].message.content });
  } catch (error: any) {
    console.error('Translation error:', error);
    res.json({ translated: `[Translation Error]: ${error.message}` });
  }
});

module.exports = router;