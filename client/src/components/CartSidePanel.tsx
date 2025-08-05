import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { Link } from 'react-router-dom';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter,SheetDescription } from "@/components/ui/sheet";
import { Separator } from './ui/separator';
import { formatRupees } from '@/lib/currency';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const CartSidePanel = () => {
  const { cartItems, updateQuantity, removeFromCart, isCartOpen, toggleCart, cartCount } = useCart();
  const [removingId, setRemovingId] = useState<string | null>(null);

  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const handleRemove = (id: string) => {
    setRemovingId(id);
    setTimeout(() => {
      removeFromCart(id);
      setRemovingId(null);
    }, 300); // Duration should match the animation
  };

  return (
    <Sheet open={isCartOpen} onOpenChange={toggleCart}>
      <SheetContent className="flex w-full flex-col pr-0 sm:max-w-lg">
        <SheetHeader className="px-6">
          <SheetTitle>Cart ({cartCount})</SheetTitle>
          <SheetDescription>Review your cart items before checkout.</SheetDescription>
        </SheetHeader>
        <Separator />
        
        {cartItems.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center text-center p-6">
            <ShoppingBag className="h-20 w-20 text-muted-foreground/30 mb-6" strokeWidth={1} />
            <h3 className="mt-4 text-xl font-semibold">Your cart is empty</h3>
            <p className="text-base text-muted-foreground mb-6">Let’s fill it with something great!</p>
            <Button asChild onClick={toggleCart}>
              <Link to="/shop">Continue Shopping</Link>
            </Button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-6">
            <div className="flex flex-col gap-6 py-6">
              <TooltipProvider>
                {cartItems.map(item => (
                  <div 
                    key={item.id} 
                    className={`flex items-start gap-4 transition-opacity duration-300 ${removingId === item.id ? 'opacity-0' : 'opacity-100'}`}
                  >
                    <img src={item.image} alt={item.name} className="w-20 h-20 object-cover rounded-md border" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm line-clamp-2">{item.name}</h3>
                      <p className="text-xs text-green-600 mt-1">In Stock</p>
                      <div className="flex items-center mt-3">
                        <Button variant="outline" size="icon" className="h-7 w-7 rounded-full shadow-sm" onClick={() => updateQuantity(item.id, item.quantity - 1)} disabled={item.quantity === 1}>
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="mx-3 font-medium text-sm">{item.quantity}</span>
                        <Button variant="outline" size="icon" className="h-7 w-7 rounded-full shadow-sm" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex flex-col items-end justify-between h-20">
                      <p className="font-semibold text-sm">{formatRupees(item.price * item.quantity)}</p>
                      <Tooltip>
                        <TooltipTrigger asChild>
                           <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => handleRemove(item.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Remove from Cart</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                ))}
              </TooltipProvider>
            </div>
          </div>
        )}
        
        {cartItems.length > 0 && (
          <>
            <Separator />
            <SheetFooter className="px-6 py-4 space-y-4 bg-background">
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center font-semibold text-lg mb-2">
                  <span>Subtotal</span>
                  <span>{formatRupees(subtotal)}</span>
                </div>
                <Button asChild size="lg" className="w-full bg-gradient-luxury shadow-lg hover:scale-105 transition-transform">
                  <Link to="/checkout">Proceed to Checkout</Link>
                </Button>
              </div>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default CartSidePanel;