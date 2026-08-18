import { NextRequest } from 'next/server'

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
const OLLAMA_MODEL   = process.env.OLLAMA_MODEL   || 'llama3.2'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export async function POST(req: NextRequest) {
  try {
    const { message, history } = await req.json() as { message: string; history: Message[] }

    if (!message?.trim()) {
      return new Response(JSON.stringify({ error: 'Pesan tidak boleh kosong' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const recentHistory: Message[] = (history || []).slice(-8)

    const systemPrompt = `Kamu asisten AI pintar "ChefBot" di platform ResepPintar. Jawab dalam Bahasa Indonesia, ringkas dan tepat.
- Makanan: resep, tips memasak, nutrisi, substitusi bahan, asal-usul masakan
- Umum: sains, sejarah, teknologi, budaya, pertanyaan random
- Jawab langsung tanpa basa-basi. Jika tidak tahu, katakan terus terang.`

    let conversationText = `SYSTEM: ${systemPrompt}\n\n`
    for (const msg of recentHistory) {
      conversationText += msg.role === 'user' ? `USER: ${msg.content}\n` : `ASSISTANT: ${msg.content}\n`
    }
    conversationText += `USER: ${message.trim()}\nASSISTANT:`

    const ollamaRes = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: conversationText,
        stream: true,
        options: {
          temperature: 0.7,
          top_p: 0.9,
          num_predict: 800,
          num_ctx: 4096,
          repeat_penalty: 1.1,
        },
      }),
    })

    if (!ollamaRes.ok) {
      return new Response(JSON.stringify({ error: `Ollama error: ${ollamaRes.status}` }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Stream the response back to the client
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        const reader = ollamaRes.body!.getReader()
        const decoder = new TextDecoder()

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = decoder.decode(value, { stream: true })
            const lines = chunk.split('\n').filter(l => l.trim())

            for (const line of lines) {
              try {
                const json = JSON.parse(line)
                if (json.response) {
                  // Send just the token text as a plain chunk
                  controller.enqueue(encoder.encode(json.response))
                }
                if (json.done) {
                  controller.close()
                  return
                }
              } catch {
                // skip malformed JSON
              }
            }
          }
        } catch {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache',
        'X-Accel-Buffering': 'no',
      },
    })
  } catch (error: any) {
    const isConnRefused = error.cause?.code === 'ECONNREFUSED' || error.message?.includes('fetch failed')
    const msg = isConnRefused
      ? 'Ollama tidak berjalan. Jalankan Ollama terlebih dahulu.'
      : (error.message || 'Gagal menghubungi AI')
    return new Response(JSON.stringify({ error: msg }), {
      status: isConnRefused ? 503 : 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
