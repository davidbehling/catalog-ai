import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Bot, Send, ShieldCheck, Sparkles } from 'lucide-react';
import { api } from '../../lib/api';
import type { ChatMessage, User } from '../../types';

type ChatPanelProps = {
  user: User;
  active: boolean;
  onError: (message: string) => void;
};

const WELCOME: ChatMessage = {
  role: 'assistant',
  content: 'Olá! Posso consultar o catálogo da sua empresa. O que você gostaria de saber?'
};

const SUGGESTIONS = [
  'Quais produtos vocês têm?',
  'Qual é o produto mais barato?',
  'Liste produtos por categoria'
];

export default function ChatPanel({ user, active, onError }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [message, setMessage] = useState('Quais produtos vocês têm?');
  const [busy, setBusy] = useState(false);
  const chatMessagesRef = useRef<HTMLDivElement>(null);

  const companyId = user.companyId;

  useEffect(() => {
    setMessages([WELCOME]);
    setMessage('Quais produtos vocês têm?');
    setBusy(false);
  }, [companyId]);

  useEffect(() => {
    const container = chatMessagesRef.current;
    if (!container) return;

    container.scrollTop = container.scrollHeight;
  }, [messages, busy, active]);

  async function sendMessage(event: FormEvent) {
    event.preventDefault();

    const prompt = message.trim();

    if (!prompt || busy) return;

    setMessages((old) => [...old, { role: 'user', content: prompt }]);
    setMessage('');
    setBusy(true);

    try {
      const result = await api<{ answer: string }>('/chat', { method: 'POST', body: JSON.stringify({ message: prompt }) });
      setMessages((old) => [...old, { role: 'assistant', content: result.answer }]);
    } catch {
      onError('Não consegui consultar o catálogo. Verifique a configuração da API e tente novamente.');
      setMessages((old) => [
        ...old,
        {
          role: 'assistant',
          content: 'Não consegui consultar o catálogo. Verifique a configuração da API e tente novamente.'
        }
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">ASSISTENTE INTELIGENTE</span>
          <h1>Converse com seu catálogo</h1>
          <p>Faça perguntas em linguagem natural sobre seus produtos.</p>
        </div>
        <span className="powered-pill">
          <Sparkles size={14}/> IA conectada ao catálogo
        </span>
      </div>

      <section className="chat-panel">
        <div className="chat-header">
          <div className="bot-avatar">
            <Bot size={21}/>
          </div>
          <div>
            <strong>Assistente Maria</strong>
            <small>
              <span className="status-dot" /> Consulta produtos da sua empresa
            </small>
          </div>
          <span className="secure-label">
            <ShieldCheck size={14}/> Dados isolados
          </span>
        </div>

        <div className="chat-messages" ref={chatMessagesRef}>
          {messages.map((item, index) => (
            <div className={`message-row ${item.role}`} key={index}>
              <div className="message-avatar">
                {item.role === 'assistant' ? <Bot size={17}/> : user.name.slice(0, 1).toUpperCase()}
              </div>
              <div className="message-bubble">
                <small>{item.role === 'assistant' ? 'MARIA AI' : 'VOCÊ'}</small>
                <p>{item.content}</p>
              </div>
            </div>
          ))}
          {busy && (
            <div className="typing">
              <span/><span/><span/>
              Consultando catálogo…
            </div>
          )}
        </div>

        <div className="suggestions">
          <span>Experimente perguntar</span>
          {SUGGESTIONS.map((suggestion) => (
            <button key={suggestion} onClick={() => setMessage(suggestion)}>{suggestion}</button>
          ))}
        </div>

        <form className="chat-composer" onSubmit={sendMessage}>
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Pergunte sobre produtos, preços ou categorias…"
          />
          <button className="send-button" disabled={busy || !message.trim()} aria-label="Enviar mensagem">
            <Send size={17}/>
          </button>
        </form>

        <p className="chat-disclaimer">As respostas são geradas por IA com base nos dados encontrados no catálogo da sua empresa.</p>
      </section>
    </>
  );
}
