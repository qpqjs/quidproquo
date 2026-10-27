// MyContext.js
import { createContext } from 'react';

// Use a counter for the loading count
export const LoadingContext = createContext<boolean>(false);
