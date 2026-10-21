import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Bot, Boxes, LogOut, MessageCircle, PackagePlus, Send, ShieldCheck, Sparkles, Trash2, Pencil, LayoutDashboard } from 'lucide-react';
import { api, clearSession, getUser, saveSession } from '../lib/api';

type User = { id: string; name: string; email: string; role: 'admin' | 'user'; companyId: string; companyName?: string };
type Product = { _id: string; name: string; description: string; price: number; category: string; imageUrl?: string };
type ChatMessage = { role: 'assistant' | 'user'; content: string };

export default function App() {
  const [user, setUser] = useState<User | null>(getUser());
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [tab, setTab] = useState<'products' | 'chat'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState('admin-a@example.com');
  const [password, setPassword] = useState('Demo1234!');
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('Minha empresa');
  const [message, setMessage] = useState('Quais produtos vocês têm?');
  const [messages, setMessages] = useState<ChatMessage[]>([{ role: 'assistant', content: 'Olá! Posso consultar o catálogo da sua empresa. O que você gostaria de saber?' }]);
  const [editing, setEditing] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', price: '0', category: 'Geral', imageUrl: '' });
  const chatMessagesRef = useRef<HTMLDivElement>(null);

  async function loadProducts() {
    const result = await api<{ products: Product[] }>('/products');
    setProducts(result.products);
  }

  useEffect(() => {
    if (tab !== 'chat') return;

    const container = chatMessagesRef.current;
    if (!container) return;

    container.scrollTop = container.scrollHeight;
  }, [messages, tab, busy]);

  useEffect(() => { 
    if (user) loadProducts().catch((e: Error) => setError(e.message)); 
  }, [user]);

  async function submitAuth(event: FormEvent) {
    event.preventDefault();
    setError('');
    setBusy(true);

    try {
      const path = mode === 'login' ? '/auth/login' : '/auth/register';
      const body = mode === 'login' ? { email, password } : { name, email, password, companyName };
      const result = await api<{ token: string; user: User }>(path, { method: 'POST', body: JSON.stringify(body) });

      saveSession(result.token, result.user); 
      setUser(result.user);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function logout() {
    clearSession();
    setUser(null);
    setProducts([]);

    setMessages([
      {
        role: 'assistant',
        content: 'Olá! Posso consultar o catálogo da sua empresa. O que você gostaria de saber?'
      }
    ]);

    setMessage('Quais produtos vocês têm?');

    setError('');
    setTab('products');
    setShowForm(false);
    setEditing(null);
  }

  function startCreate() {
    setEditing(null);
    setForm({
      name: '',
      description: '',
      price: '0',
      category: 'Geral',
      imageUrl: ''
    });
    setShowForm(true);
  }

  function startEdit(product: Product) {
    setEditing(product);
    setForm({ 
      name: product.name, 
      description: product.description, 
      price: String(product.price), 
      category: product.category, 
      imageUrl: product.imageUrl ?? '' 
    }); 
    setShowForm(true); 
  }

  async function saveProduct(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');

    try {
      const body = { ...form, price: Number(form.price) };
      await api(editing ? `/products/${editing._id}` : '/products', { method: editing ? 'PATCH' : 'POST', body: JSON.stringify(body) });
      setShowForm(false); 
      await loadProducts();
    } catch (e) { 
      setError((e as Error).message); 
    } finally { 
      setBusy(false); 
    }
  }

  async function deleteProduct(product: Product) {
    if (!window.confirm(`Excluir ${product.name}?`)) return;
  
    try { 
      await api(`/products/${product._id}`, { method: 'DELETE' }); 
      await loadProducts(); 
    } catch (e) { 
      setError((e as Error).message); 
    }
  }

  async function sendMessage(event: FormEvent) {
    event.preventDefault(); 
  
    const prompt = message.trim(); 
    
    if (!prompt || busy) return;

    setMessages((old) => [
      ...old, 
      { role: 'user', content: prompt }
    ]);

    setMessage(''); 
    setBusy(true); 
    setError('');
    
    try { 
      const result = await api<{ answer: string }>('/chat', { method: 'POST', body: JSON.stringify({ message: prompt }) }); 
      setMessages((old) => [...old, { role: 'assistant', content: result.answer }]);
    } catch (e) { 
      setError((e as Error).message); 
      setMessages((old) => [
        ...old, 
        { role: 'assistant', 
          content: 'Não consegui consultar o catálogo. Verifique a configuração da API e tente novamente.' 
        }
      ]); 
    } finally { 
      setBusy(false); 
    }
  }

  if (!user) return <main className="auth-shell"><section className="auth-visual"><div className="brand"><span className="brand-mark"><Sparkles size={21}/></span> maria<span className="brand-dot">.</span></div><div className="visual-copy"><span className="eyebrow">CATÁLOGO INTELIGENTE</span><h1>Seus produtos.<br/><em>Conversas melhores.</em></h1><p>Uma experiência simples para gerenciar seu catálogo e responder clientes com inteligência.</p></div><div className="visual-bottom"><span><ShieldCheck size={16}/> Ambiente multi-tenant</span><span>Plataforma de demonstração</span></div></section><section className="auth-panel"><div className="auth-card"><div className="mobile-brand brand"><span className="brand-mark"><Sparkles size={21}/></span> maria<span className="brand-dot">.</span></div><span className="eyebrow">BEM-VINDO À MARIA</span><h2>{mode === 'login' ? 'Entre na sua conta' : 'Crie sua empresa'}</h2><p className="muted">{mode === 'login' ? 'Acesse seu espaço de trabalho e catálogo.' : 'Seu primeiro usuário será administrador da empresa.'}</p><form onSubmit={submitAuth} className="stack-form">{mode === 'register' && <><label>Seu nome<input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome completo"/></label><label>Nome da empresa<input required value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Sua empresa"/></label></>}<label>E-mail<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@empresa.com"/></label><label>Senha<input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo de 8 caracteres"/></label>{error && <div className="error-banner">{error}</div>}<button className="primary-button" disabled={busy}>{busy ? 'Aguarde…' : mode === 'login' ? 'Entrar na plataforma' : 'Criar conta'} <span>→</span></button></form><p className="switch-auth">{mode === 'login' ? 'Ainda não tem uma conta?' : 'Já possui uma conta?'} <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>{mode === 'login' ? 'Criar conta' : 'Fazer login'}</button></p><div className="demo-note"><strong>Conta de demonstração</strong><span>admin-a@example.com · Demo1234!</span></div></div></section></main>;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark"><Sparkles size={20}/></span> maria
          <span className="brand-dot">.</span>
        </div>
    
        <div className="workspace">
          <span className="workspace-icon">{(user.companyName ?? 'M').slice(0, 1).toUpperCase()}</span>
          <div>
            <strong>{user.companyName ?? 'Minha empresa'}</strong>
            <small>Plano demonstração</small>
          </div>
          <span className="chevron">⌄</span>
        </div>
    
        <div className="nav-label">WORKSPACE</div>
          
        <button className={`nav-item ${tab === 'products' ? 'active' : ''}`} onClick={() => setTab('products')}>
            <LayoutDashboard size={18}/> 
            Visão geral
        </button>

        <button className={`nav-item ${tab === 'chat' ? 'active' : ''}`} onClick={() => setTab('chat')}>
            <MessageCircle size={18}/>
            Agente IA
            <span className="nav-new">AI</span>
        </button>

        <div className="sidebar-bottom">
          <div className="ai-card">
            <div className="ai-card-icon">
              <Bot size={18}/>
            </div>
            <strong>Seu catálogo, mais inteligente</strong>
            <p>Converse com a IA para encontrar produtos e responder dúvidas.</p>
            <button onClick={() => setTab('chat')}>
              Experimentar agente <span>↗</span>
            </button>
          </div>

          <div className="profile-row">
            <div className="avatar">{user.name.slice(0, 1).toUpperCase()}</div>
            <div className="profile-copy">
              <strong>{user.name}</strong>
              <small>{user.role === 'admin' ? 'Administrador' : 'Usuário'}</small>
            </div>
            <button className="icon-button logout" title="Sair" onClick={logout}>
              <LogOut size={17}/>
            </button>
          </div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumbs">Workspace 
            <span>/</span> 
            <strong>{tab === 'products' ? 'Produtos' : 'Agente IA'}</strong>
          </div>
          <div className="topbar-right">
            <span className="status-dot" /> Sistema operacional
            <div className="top-avatar">{user.name.slice(0, 1).toUpperCase()}</div>
          </div>
        </header>

        <div className="page-content">
          {error && 
            <div className="error-banner global-error">
              {error}
              <button onClick={() => setError('')}>×</button>
            </div>
          }
          {tab === 'products' ? <>
            <div className="page-heading">
              <div>
                <span className="eyebrow">SEU WORKSPACE</span>
                <h1>Visão geral</h1>
                <p>Gerencie seu catálogo e mantenha tudo organizado.</p>
              </div>
            { user.role === 'admin' &&
              <button className="primary-button compact" onClick={startCreate}>
                <PackagePlus size={17}/> Novo produto
              </button>}
            </div>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-top">
                  <span>Total de produtos</span>
                  <span className="stat-icon purple">
                    <Boxes size={18}/>
                  </span>
                </div>
                <strong>{products.length.toString().padStart(2, '0')}</strong>
                <small>Produtos no seu catálogo</small>
              </div>
              <div className="stat-card">
                <div className="stat-top">
                  <span>Categoria(s)</span>
                  <span className="stat-icon blue">
                    <LayoutDashboard size={18}/>
                  </span>
                </div>
                <strong>{new Set(products.map((p) => p.category)).size.toString().padStart(2, '0')}</strong>
                <small>Categorias cadastradas</small>
              </div>
              <div className="stat-card">
                <div className="stat-top">
                  <span>Agente de IA</span>
                  <span className="stat-icon green">
                    <Bot size={18}/>
                  </span>
                </div>
                <strong className="stat-text">Disponível</strong>
                <small>Consulta dados do seu catálogo</small>
              </div>
            </div>
            <div className="section-heading">
              <div>
                <h2>Catálogo de produtos</h2>
                <p>Produtos disponíveis para sua empresa.</p>
              </div>
                <span className="count-pill">{products.length} itens</span>
            </div>
            {products.length ?
              <div className="product-grid">
                {products.map((product) => <article className="product-card" key={product._id}>
                  <div className="product-art">
                    {product.imageUrl ? <img src={product.imageUrl} alt={product.name}/>
                    : <div className="product-placeholder">
                        <Boxes size={29}/>
                      </div>
                    }
                    <span className="category-pill">{product.category}</span>
                  </div>
                  <div className="product-info">
                    <h3>{product.name}</h3>
                    <p>{product.description}</p>
                    <div className="product-footer">
                      <strong>{product.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
                      {user.role === 'admin' &&
                      <div className="product-actions">
                        <button className="icon-button" title="Editar" onClick={() => startEdit(product)}>
                          <Pencil size={15}/>
                          </button><button className="icon-button danger" title="Excluir" onClick={() => deleteProduct(product)}>
                          <Trash2 size={15}/>
                        </button>
                      </div>}
                    </div>
                  </div>                
                </article>)}
            </div> :
            <div className="empty-state">
              <Boxes size={32}/>
              <h3>Seu catálogo está vazio</h3>
              <p>Adicione seu primeiro produto para começar.</p>
              {user.role === 'admin' && <button className="primary-button compact" onClick={startCreate}>Adicionar produto</button>}
            </div>
            }</> : 
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
                  {messages.map((item, index) => <div className={`message-row ${item.role}`} key={index}>
                    <div className="message-avatar">{item.role === 'assistant' ? <Bot size={17}/> : user.name.slice(0, 1).toUpperCase()}</div>
                    <div className="message-bubble">
                      <small>{item.role === 'assistant' ? 'MARIA AI' : 'VOCÊ'}</small>
                      <p>{item.content}</p>
                    </div>
                  </div>)}
                  {busy &&
                    <div className="typing">
                      <span /><span /><span /> 
                    Consultando catálogo…
                    </div>
                  }
                </div>
                <div className="suggestions">
                  <span>Experimente perguntar</span>{
                    [
                      'Quais produtos vocês têm?', 
                      'Qual é o produto mais barato?', 
                      'Liste produtos por categoria'
                    ].map((suggestion) => <button key={suggestion} onClick={() => setMessage(suggestion)}>{suggestion}</button>)}
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
          }   
        </div>      
      </main>
      {showForm && <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) setShowForm(false); }}>
        <form className="product-modal" onSubmit={saveProduct}>
          <div className="modal-heading">
            <div>
              <span className="eyebrow">CATÁLOGO</span>
              <h2>{editing ? 'Editar produto' : 'Novo produto'}</h2>
            </div>
              <button type="button" className="icon-button" onClick={() => setShowForm(false)}>×</button>
          </div>
          <label>Nome<input required maxLength={120} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex.: Consulta inicial"/></label><label>Descrição<textarea required maxLength={2000} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Descreva o produto" rows={3}/></label>
          <div className="form-two-col">
            <label>Preço (R$)
              <input required type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })}/>
            </label>
            <label>Categoria
              <input required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Ex.: Consultas"/>
            </label>
          </div>
          <label>URL da imagem (opcional)
            <input type="url" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://…"/>
          </label>
          <div className="modal-actions">
            <button type="button" className="secondary-button" onClick={() => setShowForm(false)}>Cancelar</button>
            <button className="primary-button" disabled={busy}>{busy ? 'Salvando…' : 'Salvar produto'}</button>
          </div>
        </form>
      </div>
      }    
    </div>
  );
}
