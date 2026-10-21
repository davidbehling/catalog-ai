import { Boxes, Pencil, Trash2 } from 'lucide-react';
import type { Product } from '../../types';

type ProductCardProps = {
  product: Product;
  canManage: boolean;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
};

export default function ProductCard({ product, canManage, onEdit, onDelete }: ProductCardProps) {
  return (
    <article className="product-card">
      <div className="product-art">
        {product.imageUrl
          ? <img src={product.imageUrl} alt={product.name}/>
          : <div className="product-placeholder"><Boxes size={29}/></div>}
        <span className="category-pill">{product.category}</span>
      </div>
      <div className="product-info">
        <h3>{product.name}</h3>
        <p>{product.description}</p>
        <div className="product-footer">
          <strong>{product.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
          {canManage && (
            <div className="product-actions">
              <button className="icon-button" title="Editar" onClick={() => onEdit(product)}>
                <Pencil size={15}/>
              </button>
              <button className="icon-button danger" title="Excluir" onClick={() => onDelete(product)}>
                <Trash2 size={15}/>
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
