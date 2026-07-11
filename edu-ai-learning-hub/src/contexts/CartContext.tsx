// import {
//   createContext,
//   useContext,
//   useState,
//   useEffect,
//   ReactNode,
// } from "react";
// import { useToast } from "@/components/ui/use-toast";

// export interface CartItem {
//   id: number;
//   title: string;
//   price: number;
//   discountedPrice?: number;
//   instructor: string;
//   thumbnail: string;
//   slug: string;
// }

// interface CartContextType {
//   items: CartItem[];
//   addItem: (item: CartItem) => void;
//   removeItem: (id: number) => void;
//   clearCart: () => void;
//   isInCart: (id: number) => boolean;
//   count: number;
//   total: number;
// }

// const CartContext = createContext<CartContextType | undefined>(undefined);

// export const CartProvider = ({ children }: { children: ReactNode }) => {
//   const { toast } = useToast();
//   const [items, setItems] = useState<CartItem[]>([]);

//   // Load cart from localStorage on initial load
//   useEffect(() => {
//     const savedCart = localStorage.getItem("cart");
//     if (savedCart) {
//       try {
//         setItems(JSON.parse(savedCart));
//       } catch (error) {
//         console.error("Failed to parse cart from localStorage:", error);
//       }
//     }
//   }, []);

//   // Save cart to localStorage whenever it changes
//   useEffect(() => {
//     localStorage.setItem("cart", JSON.stringify(items));
//   }, [items]);

//   const addItem = (item: CartItem) => {
//     if (isInCart(item.id)) {
//       toast({
//         title: "Already in cart",
//         description: `${item.title} is already in your cart.`,
//       });
//       return;
//     }

//     setItems((prevItems) => [...prevItems, item]);
//     toast({
//       title: "Added to cart",
//       description: `${item.title} has been added to your cart.`,
//     });
//   };

//   const removeItem = (id: number) => {
//     const itemToRemove = items.find((item) => item.id === id);
//     if (itemToRemove) {
//       setItems((prevItems) => prevItems.filter((item) => item.id !== id));
//       toast({
//         title: "Removed from cart",
//         description: `${itemToRemove.title} has been removed from your cart.`,
//       });
//     }
//   };

//   const clearCart = () => {
//     setItems([]);
//     toast({
//       title: "Cart cleared",
//       description: "All items have been removed from your cart.",
//     });
//   };

//   const isInCart = (id: number) => {
//     return items.some((item) => item.id === id);
//   };

//   const count = items.length;

//   const total = items.reduce(
//     (sum, item) => sum + (item.discountedPrice ?? item.price),
//     0
//   );

//   return (
//     <CartContext.Provider
//       value={{
//         items,
//         addItem,
//         removeItem,
//         clearCart,
//         isInCart,
//         count,
//         total,
//       }}
//     >
//       {children}
//     </CartContext.Provider>
//   );
// };

// export const useCart = () => {
//   const context = useContext(CartContext);
//   if (context === undefined) {
//     throw new Error("useCart must be used within a CartProvider");
//   }
//   return context;
// };
