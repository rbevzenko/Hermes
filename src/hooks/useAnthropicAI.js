import { useState, useCallback } from 'react';

const API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;

export function useAnthropicAI() {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState('');
  const [error, setError] = useState(null);

  const askAI = useCallback(async (word, question) => {
    if (!API_KEY) {
      setError('Добавьте API ключ в .env файл: VITE_ANTHROPIC_API_KEY=your_key');
      return;
    }

    setLoading(true);
    setError(null);
    setResponse('');

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 600,
          system: `You are a Greek language expert. Answer in Russian.
Be concise (3-5 sentences). Focus on etymology,
Ancient Greek roots, and memorable mnemonics.
When relevant, mention Latin and Russian cognates.`,
          messages: [
            {
              role: 'user',
              content: `Word: ${word.greek} (${word.ru})\n${question}`,
            },
          ],
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error?.message || `HTTP ${res.status}`);
      }

      const data = await res.json();
      setResponse(data.content[0].text);
    } catch (err) {
      setError(`Ошибка: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResponse('');
    setError(null);
  }, []);

  return { askAI, loading, response, error, reset, hasKey: !!API_KEY };
}
