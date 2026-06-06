import { supabase } from '../../../lib/supabase'
import { adaptPromptForProvider } from '../prompts/adaptPromptForProvider'
import {
  buildClaudeProductionPrompt,
  buildFusionPrompt,
  buildOpenAiProductionPrompt,
} from './buildDualGenerationPrompt'
import type { AiGenerateInput, AiGenerateResult } from './types'

async function invokeAiFunction(
  functionName: 'ai-openai' | 'ai-anthropic',
  input: AiGenerateInput
): Promise<AiGenerateResult> {
  const { data, error } = await supabase.functions.invoke(functionName, {
    body: {
      prompt: input.prompt,
      system: input.system,
      maxTokens: input.maxTokens,
      temperature: input.temperature,
      model: input.model,
    },
  })

  if (error) {
    return {
      provider: input.provider,
      model: input.model,
      text: '',
      error: error.message,
    }
  }

  return {
    provider: input.provider,
    model: data?.model ?? input.model,
    text: data?.text ?? '',
    usage: data?.usage,
    error: data?.error,
  }
}

export async function generateWithAi(input: AiGenerateInput): Promise<AiGenerateResult> {
  if (input.provider === 'manual_chatgpt' || input.provider === 'manual_claude') {
    return {
      provider: input.provider,
      model: input.model,
      text: adaptPromptForProvider(input.prompt, input.provider),
    }
  }

  if (input.provider === 'openai') {
    return invokeAiFunction('ai-openai', {
      ...input,
      prompt: adaptPromptForProvider(input.prompt, 'openai'),
    })
  }

  if (input.provider === 'anthropic') {
    return invokeAiFunction('ai-anthropic', {
      ...input,
      prompt: adaptPromptForProvider(input.prompt, 'anthropic'),
    })
  }

  const [openAiResult, claudeResult] = await Promise.all([
    invokeAiFunction('ai-openai', {
      ...input,
      provider: 'openai',
      role: 'writer',
      prompt: buildOpenAiProductionPrompt(input.prompt),
    }),
    invokeAiFunction('ai-anthropic', {
      ...input,
      provider: 'anthropic',
      role: 'writer',
      prompt: buildClaudeProductionPrompt(input.prompt),
    }),
  ])

  const fusionPrompt = buildFusionPrompt(
    openAiResult.text,
    claudeResult.text,
    { role: input.role, system: input.system }
  )

  return {
    provider: 'dual',
    model: input.model,
    text: [
      '# Double génération BCVB',
      '',
      '## Réponse OpenAI',
      openAiResult.text || `[Erreur OpenAI] ${openAiResult.error ?? 'Aucune réponse'}`,
      '',
      '## Réponse Claude',
      claudeResult.text || `[Erreur Claude] ${claudeResult.error ?? 'Aucune réponse'}`,
      '',
      '## Prompt de fusion éditoriale',
      fusionPrompt,
    ].join('\n'),
    usage: {
      inputTokens:
        (openAiResult.usage?.inputTokens ?? 0) +
        (claudeResult.usage?.inputTokens ?? 0),
      outputTokens:
        (openAiResult.usage?.outputTokens ?? 0) +
        (claudeResult.usage?.outputTokens ?? 0),
    },
    error: openAiResult.error || claudeResult.error,
  }
}
