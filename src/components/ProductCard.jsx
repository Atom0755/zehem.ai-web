
import React from 'react';
import { ShoppingCart, DollarSign, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const ProductCard = ({ product, currentUser }) => {
  const { toast } = useToast();

  const handleBuy = () => {
    toast({
      title: "🚧 This feature isn't implemented yet—but don't worry! You can request it in your next prompt! 🚀",
    });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
      {product.imageUrl ? (
        <img 
          src={product.imageUrl} 
          alt={product.name}
          className="w-full h-48 object-cover"
        />
      ) : (
        <div className="w-full h-48 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
          <ShoppingCart className="w-16 h-16 text-gray-400" />
        </div>
      )}

      <div className="p-4">
        <h3 className="font-semibold text-gray-800 text-lg mb-2">{product.name}</h3>
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1 text-2xl font-bold text-green-600">
            <DollarSign className="w-6 h-6" />
            {product.price.toFixed(2)}
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <User className="w-4 h-4" />
            @{product.sellerName}
          </div>
        </div>

        <Button
          onClick={handleBuy}
          className="w-full gap-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
          disabled={product.sellerId === currentUser.id}
        >
          <ShoppingCart className="w-4 h-4" />
          {product.sellerId === currentUser.id ? 'Your Product' : 'Buy Now'}
        </Button>
      </div>
    </div>
  );
};

export default ProductCard;
