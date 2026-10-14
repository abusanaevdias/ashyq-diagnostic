'use client';
import {createContext} from 'react';
/** A local page's explicit discard, not a bypass of storage validation or authorization. */
export const BankNavigationWarningContext=createContext<(()=>boolean)|null>(null);
