'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

function renderMarkdown(text: string) {
  // Split by lines, render **bold** and basic structure
  return text.split('\n').map((line, i) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/)
    const rendered = parts.map((part, j) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={j}>{part.slice(2, -2)}</strong>
      }
      return part
    })
    return <span key={i}>{rendered}{i < text.split('\n').length - 1 && <br />}</span>
  })
}

const QUICK_QUESTIONS = [
  { label: '🍳 Cara buat nasi goreng enak', q: 'Apa tips membuat nasi goreng yang enak dan tidak lembek?' },
  { label: '🥩 Pengganti daging sapi', q: 'Apa saja bahan yang bisa menggantikan daging sapi dalam masakan?' },
  { label: '🌶️ Cara kurangi kepedasan', q: 'Bagaimana cara mengurangi kepedasan pada masakan yang terlalu pedas?' },
  { label: '🥗 Makanan untuk diet', q: 'Rekomendasikan makanan Indonesia yang cocok untuk diet sehat.' },
  { label: '🫙 Cara menyimpan bumbu', q: 'Bagaimana cara menyimpan bumbu masak agar tahan lama?' },
  { label: '💡 Tanya apa saja...', q: '' },
]

export default function ChatPage() {
  const [messages, setMessages]   = useState<Message[]>([])
  const [input, setInput]         = useState('')
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const bottomRef                 = useRef<HTMLDivElement>(null)
  const inputRef                  = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const sendMessage = async (text?: string) => {
    const msg = (text ?? input).trim()
    if (!msg || loading) return

    const newMessages: Message[] = [...messages, { role: 'user', content: msg }]
    setMessages(newMessages)
    setInput('')
    setLoading(true)
    setError('')

    // Add empty assistant message that will be filled by streaming
    const withAssistant: Message[] = [...newMessages, { role: 'assistant', content: '' }]
    setMessages(withAssistant)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, history: messages }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Gagal menghubungi AI')
      }

      // Stream response token by token
      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        accumulated += decoder.decode(value, { stream: true })
        // Update the last assistant message with accumulated text
        setMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = { role: 'assistant', content: accumulated }
          return updated
        })
      }
    } catch (err: any) {
      setError(err.message)
      setMessages(newMessages) // remove empty assistant bubble on error
    } finally {
      setLoading(false)
      // small delay so focus doesn't fight with state update
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const clearChat = () => {
    setMessages([])
    setError('')
    inputRef.current?.focus()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-3xl">🍳</span>
            <div>
              <h1 className="text-xl font-bold text-orange-600">ResepPintar</h1>
              <p className="text-xs text-gray-400">AI Chat — Tanya apapun!</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="text-sm text-gray-500 font-medium border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
            >
              🏠 Beranda
            </Link>
            <Link
              href="/recipes"
              className="text-sm text-orange-600 font-medium border border-orange-200 px-3 py-1.5 rounded-lg hover:bg-orange-50 transition-colors"
            >
              📚 Koleksi
            </Link>
          </div>
        </div>
      </header>

      {/* Chat area */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-4 flex flex-col gap-3">

        {/* Welcome / empty state */}
        {messages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-8 gap-4">
            <div className="text-6xl">🤖</div>
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-1">Halo! Saya ChefBot</h2>
              <p className="text-gray-500 text-sm max-w-md">
                Tanya apapun — resep masakan, tips memasak, nutrisi, atau hal lainnya. Saya siap membantu!
              </p>
            </div>

            {/* Quick question chips */}
            <div className="flex flex-wrap gap-2 justify-center mt-2 max-w-lg">
              {QUICK_QUESTIONS.map((item) =>
                item.q ? (
                  <button
                    key={item.label}
                    onClick={() => sendMessage(item.q)}
                    className="text-xs bg-white border border-orange-200 text-orange-700 px-3 py-2 rounded-full hover:bg-orange-50 transition-colors shadow-sm"
                  >
                    {item.label}
                  </button>
                ) : null
              )}
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.length > 0 && (
          <div className="flex flex-col gap-4 pb-2">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} gap-2`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-base shrink-0 mt-1">
                    🤖
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-orange-500 text-white rounded-tr-sm whitespace-pre-wrap'
                      : 'bg-white text-gray-800 border border-gray-100 shadow-sm rounded-tl-sm'
                  }`}
                >
                  {msg.role === 'assistant' && msg.content === '' ? (
                    // Waiting for first token
                    <div className="flex gap-1 items-center py-0.5">
                      <span className="w-2 h-2 rounded-full bg-orange-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 rounded-full bg-orange-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 rounded-full bg-orange-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  ) : msg.role === 'assistant' ? (
                    <>
                      {renderMarkdown(msg.content)}
                      {loading && i === messages.length - 1 && (
                        <span className="inline-block w-0.5 h-4 bg-orange-400 ml-0.5 animate-pulse align-middle" />
                      )}
                    </>
                  ) : msg.content}
                </div>
                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-base text-white shrink-0 mt-1">
                    👤
                  </div>
                )}
              </div>
            ))}

            <div ref={bottomRef} />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 flex items-start gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}
      </main>

      {/* Input bar — sticky at bottom */}
      <div className="sticky bottom-0 bg-white border-t border-gray-100 shadow-lg">
        <div className="max-w-3xl mx-auto px-4 py-3">
          {/* Quick questions when chat has messages */}
          {messages.length > 0 && messages.length < 3 && (
            <div className="flex gap-2 mb-2 overflow-x-auto pb-1 scrollbar-none">
              {QUICK_QUESTIONS.filter(q => q.q).slice(0, 4).map((item) => (
                <button
                  key={item.label}
                  onClick={() => sendMessage(item.q)}
                  disabled={loading}
                  className="text-xs whitespace-nowrap bg-orange-50 border border-orange-200 text-orange-600 px-3 py-1.5 rounded-full hover:bg-orange-100 transition-colors disabled:opacity-50"
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}

          <div className="flex gap-2 items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Tanya apapun... (Enter untuk kirim, Shift+Enter baris baru)"
              rows={1}
              disabled={loading}
              className="flex-1 resize-none border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent disabled:bg-gray-50 min-h-[44px] max-h-32 overflow-y-auto"
              style={{ height: 'auto' }}
              onInput={(e) => {
                const t = e.target as HTMLTextAreaElement
                t.style.height = 'auto'
                t.style.height = Math.min(t.scrollHeight, 128) + 'px'
              }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-200 text-white rounded-xl w-11 h-11 flex items-center justify-center transition-colors shrink-0"
            >
              {loading ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </button>
            {messages.length > 0 && (
              <button
                onClick={clearChat}
                disabled={loading}
                title="Hapus percakapan"
                className="border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 rounded-xl w-11 h-11 flex items-center justify-center transition-colors shrink-0 disabled:opacity-50"
              >
                🗑️
              </button>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-1.5 text-center">
            Powered by Ollama llama3.2 · Jawaban AI bisa tidak selalu akurat
          </p>
        </div>
      </div>
    </div>
  )
}
