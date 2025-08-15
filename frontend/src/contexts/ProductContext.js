// ProductContext.js
import { createContext, useContext } from 'react';
export const ProductContext = createContext(null);
export const useProduct = () => useContext(ProductContext);
