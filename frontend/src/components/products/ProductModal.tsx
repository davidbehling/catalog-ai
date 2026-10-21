import { useState, type FormEvent } from 'react';
import { api } from '../../lib/api';
import type { Product } from '../../types';

type ProductModalProps = {
  product: Product | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
  onError: (message: string) => void;
};

const EMPTY_FORM = { name: '', description: '', price: '0', category: 'Geral', imageUrl: '' };

export default function ProductModal({ product, onClose, onSaved, onError }: ProductModalProps) {
  const [form, setForm] = useState(() => product
    ? {
        name: product.name,
        description: product.description,
        price: String(product.price),
        category: product.category,
        imageUrl: product.imageUrl ?? ''
      }
    : EMPTY_FORM);
  const [busy, setBusy] = useState(false);

  async function saveProduct(event: FormEvent) {
    event.preventDefault();
    setBusy(true);

    try {
      const body = { ...form, price: Number(form.price) };
      await api(product ? `/products/${product._id}` : '/products', {
        method: product ? 'PATCH' : 'POST',
        body: JSON.stringify(body)
      });
      await onSaved();
      onClose();
    } catch (e) {
      onError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <form className="product-modal" onSubmit={saveProduct}>
        <div className="modal-heading">
          <div>
            <span className="eyebrow">CATÁLOGO</span>
            <h2>{product ? 'Editar produto' : 'Novo produto'}</h2>
          </div>
          <button type="button" className="icon-button" onClick={onClose}>×</button>
        </div>

        <label>
          Nome
          <input required maxLength={120} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex.: Consulta inicial"/>
        </label>

        <label>
          Descrição
          <textarea required maxLength={2000} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Descreva o produto" rows={3}/>
        </label>

        <div className="form-two-col">
          <label>
            Preço (R$)
            <input required type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })}/>
          </label>
          <label>
            Categoria
            <input required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Ex.: Consultas"/>
          </label>
        </div>

        <label>
          URL da imagem (opcional)
          <input type="url" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://…"/>
        </label>

        <div className="modal-actions">
          <button type="button" className="secondary-button" onClick={onClose}>Cancelar</button>
          <button className="primary-button" disabled={busy}>{busy ? 'Salvando…' : 'Salvar produto'}</button>
        </div>
      </form>
    </div>
  );
}
