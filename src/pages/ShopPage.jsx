
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, ShoppingCart, Store, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import CreateProductDialog from '@/components/CreateProductDialog';
import ProductCard from '@/components/ProductCard';
import { supabase } from '@/lib/customSupabaseClient';

const ShopPage = ({ currentUser }) => {
  const [products, setProducts] = useState([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [filterStore, setFilterStore] = useState('all');
  const { toast } = useToast();

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    const { data } = await supabase
        .from('products')
        .select('*, profiles!seller_id(username)')
        .order('created_at', { ascending: false });
    
    const formatted = data?.map(p => ({
        ...p,
        sellerId: p.seller_id,
        sellerName: p.profiles.username,
        imageUrl: p.image_url
    })) || [];
    setProducts(formatted);
  };

  const handleCreateProduct = async (productData) => {
    const { error } = await supabase.from('products').insert({
        seller_id: currentUser.id,
        name: productData.name,
        description: productData.description,
        price: productData.price,
        image_url: productData.imageUrl
    });

    if (!error) {
        loadProducts();
        setShowCreateDialog(false);
        toast({ title: "Product listed!", description: "Available in shop." });
    }
  };

  const handleExchange = async (action) => {
      let change = 0;
      if (action === 'buy') {
          // Buy 10 Coins
          change = 10;
          toast({ title: "Purchase Successful", description: "Added 10 ZEHEM Coins to wallet." });
      } else {
          // Sell 10 Coins
          const { data: profile } = await supabase.from('profiles').select('coins').eq('id', currentUser.id).single();
          if ((profile?.coins || 0) < 10) {
              return toast({ title: "Insufficient Funds", description: "You need at least 10 Coins to sell.", variant: "destructive" });
          }
          change = -10;
          toast({ title: "Sold Successfully", description: "Sold 10 ZEHEM Coins." });
      }

      const { data: profile } = await supabase.from('profiles').select('coins').eq('id', currentUser.id).single();
      await supabase.from('profiles').update({ coins: (profile?.coins || 0) + change }).eq('id', currentUser.id);
      
      // We rely on MainApp's realtime subscription to update the UI balance
  };

  const filteredProducts = filterStore === 'all' 
    ? products 
    : products.filter(p => p.sellerId === currentUser.id);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Online Shop</h2>
          <p className="text-gray-600">Marketplace & Currency Exchange</p>
        </div>
        <Button
          onClick={() => setShowCreateDialog(true)}
          className="gap-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
        >
          <Plus className="w-5 h-5" />
          List Product
        </Button>
      </div>

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-gradient-to-r from-amber-100 to-yellow-50 border border-yellow-200 rounded-xl p-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-6"
      >
          <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg text-white">
                  <Coins className="w-8 h-8" />
              </div>
              <div>
                  <h3 className="text-xl font-bold text-yellow-800">ZEHEM Coin Exchange</h3>
                  <p className="text-yellow-700">Manage your virtual currency</p>
              </div>
          </div>
          <div className="flex gap-4">
              <Button onClick={() => handleExchange('buy')} className="bg-green-600 hover:bg-green-700 text-white border-green-700">
                  Buy 10 ZC ($1.00)
              </Button>
              <Button onClick={() => handleExchange('sell')} variant="outline" className="border-yellow-600 text-yellow-800 hover:bg-yellow-100">
                  Sell 10 ZC
              </Button>
          </div>
      </motion.div>

      <div className="flex gap-2 mb-6">
        <Button
          onClick={() => setFilterStore('all')}
          variant={filterStore === 'all' ? 'default' : 'outline'}
          className="gap-2"
        >
          <Store className="w-4 h-4" />
          All Products
        </Button>
        <Button
          onClick={() => setFilterStore('mine')}
          variant={filterStore === 'mine' ? 'default' : 'outline'}
          className="gap-2"
        >
          <ShoppingCart className="w-4 h-4" />
          My Store
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">
              {filterStore === 'mine' 
                ? "You haven't listed any products yet"
                : "No products available yet"}
            </p>
          </div>
        ) : (
          filteredProducts.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <ProductCard product={product} currentUser={currentUser} />
            </motion.div>
          ))
        )}
      </div>

      {showCreateDialog && (
        <CreateProductDialog
          onClose={() => setShowCreateDialog(false)}
          onCreate={handleCreateProduct}
        />
      )}
    </div>
  );
};

export default ShopPage;
