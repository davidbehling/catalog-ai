import { useEffect, useState } from 'react';
import { Bot, Boxes, LayoutDashboard, PackagePlus } from 'lucide-react';
import { api } from '../../lib/api';
import type { Product, User } from '../../types';
import ProductCard from './ProductCard';
import ProductModal from './ProductModal';

type OverviewPageProps = {
  user: User;
  onError: (message: string) => void;
};

export default function OverviewPage({ user, onError }: OverviewPageProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  const canManage = user.role === 'admin';

  async function loadProducts() {
    const result = await api<{ products: Product[] }>('/products');
    setProducts(result.products);
  }

  useEffect(() => {
    loadProducts().catch((e: Error) => onError(e.message));
  }, []);

  function startCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  function startEdit(product: Product) {
    setEditing(product);
    setModalOpen(true);
  }

  async function deleteProduct(product: Product) {
    if (!window.confirm(`Excluir ${product.name}?`)) return;

    try {
      await api(`/products/${product._id}`, { method: 'DELETE' });
      await loadProducts();
    } catch (e) {
      onError((e as Error).message);
    }
  }

  async function handleSaved() {
    await loadProducts();
  }

  const categories = new Set(products.map((p) => p.category)).size;

  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">SEU WORKSPACE</span>
          <h1>Visão geral</h1>
          <p>Gerencie seu catálogo e mantenha tudo organizado.</p>
        </div>
        {canManage && (
          <button className="primary-button compact" onClick={startCreate}>
            <PackagePlus size={17}/> Novo produto
          </button>
        )}
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-top">
            <span>Total de produtos</span>
            <span className="stat-icon purple"><Boxes size={18}/></span>
          </div>
          <strong>{products.length.toString().padStart(2, '0')}</strong>
          <small>Produtos no seu catálogo</small>
        </div>
        <div className="stat-card">
          <div className="stat-top">
            <span>Categoria(s)</span>
            <span className="stat-icon blue"><LayoutDashboard size={18}/></span>
          </div>
          <strong>{categories.toString().padStart(2, '0')}</strong>
          <small>Categorias cadastradas</small>
        </div>
        <div className="stat-card">
          <div className="stat-top">
            <span>Agente de IA</span>
            <span className="stat-icon green"><Bot size={18}/></span>
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

      {products.length ? (
        <div className="product-grid">
          {products.map((product) => (
            <ProductCard
              key={product._id}
              product={product}
              canManage={canManage}
              onEdit={startEdit}
              onDelete={deleteProduct}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <Boxes size={32}/>
          <h3>Seu catálogo está vazio</h3>
          <p>Adicione seu primeiro produto para começar.</p>
          {canManage && <button className="primary-button compact" onClick={startCreate}>Adicionar produto</button>}
        </div>
      )}

      {modalOpen && (
        <ProductModal
          key={editing?._id ?? 'new'}
          product={editing}
          onClose={() => setModalOpen(false)}
          onSaved={handleSaved}
          onError={onError}
        />
      )}
    </>
  );
}
