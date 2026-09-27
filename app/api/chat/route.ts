/**
 * Final Route Handler — Step 4 of Section 4 (RAG-as-tool-call) +
 * the source metadata used by Step 5's UI.
 *
 * The model decides whether to call the getInformation tool. When it does,
 * the tool runs vector search and returns chunk text + page + score. The
 * client renders those as collapsible sources under the assistant message.
 */
import { createOpenAI } from '@ai-sdk/openai';
import { streamText, tool, embed } from 'ai';
import { Index } from '@upstash/vector';
import { z } from 'zod';

const openai = createOpenAI({
  baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
  apiKey: process.env.OPENAI_API_KEY,
});

const index = new Index();

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: openai('gpt-4o-mini'),
    system:
      'You are LubayLub.AI, a compassionate mental health assistant powered by the mental health guide released by Mental Health Foundation. ' +
      'LubayLubay means to sway, bend, shake, or move rhythmically back and forth. ' +
      'It represents flexibility and resilience—like a bamboo tree that bends during a strong storm without breaking. ' +
      'You encourage users to be flexible and resilient in facing life\'s challenges. ' +
      'You specialize in stress management, anxiety, coping strategies, and mental wellness. ' +
      'Use the getInformation tool to find relevant information from the Mental Health Foundation guide. ' +
      'Always provide evidence-based responses. If the source document does not cover something, ' +
      'acknowledge the limitation and suggest consulting a healthcare professional, ' +
      'acknowledge the limitation that the information provided comes from mental health foundation UK but the guide is applicable to anyone outside UK. ' +
      'and suggest consulting a healthcare professional that is non-imposive and supportive and say that the provided in the guide is a UK number but you can help in searching for local government numbers. ' +
      'Make sure you only provide answers within the provided corpus. ' +
      'Be non-judgmental in all responses.',
    messages,
    tools: {
      getInformation: tool({
        description:
          'Look up evidence-based information about stress causes, symptoms, management techniques, coping strategies, and mental health resources from the corpus. Use this whenever the user asks about stress, anxiety, mental health, wellness tips, or health-related concerns.',
        parameters: z.object({
          query: z
            .string()
            .describe('the topic, term, or sub-question to search for'),
        }),
        execute: async ({ query }) => {
          try {
            console.log('Tool called with query:', query);
            const { embedding } = await embed({
              model: openai.embedding('text-embedding-3-small'),
              value: query,
            });
            console.log('Embedding created:', embedding.length);
            const hits = await index.query({
              vector: embedding,
              topK: 8,
              includeMetadata: true,
            });
            console.log('Hits retrieved:', hits.length);
            return hits.map((h) => ({
              text: (h.metadata?.text as string) ?? '',
              page: (h.metadata?.page as number) ?? null,
              score: h.score,
            }));
          } catch (error) {
            console.error('Tool execution error:', error);
            return [];
          }
        },
      }),
    },
    maxSteps: 3,
  });

  return result.toDataStreamResponse();
}
