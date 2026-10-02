'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingBasket, 
  ReceiptText, 
  History, 
  Plus, 
  Search, 
  ShoppingCart, 
  UtensilsCrossed, 
  Leaf, 
  Sparkles,
  ChevronRight,
  Eye,
  Copy,
  ArrowLeft,
  Edit2,
  Trash2,
  Scale,
  Minus,
  Check,
  Zap,
  Lightbulb,
  Award,
  Share2,
  Settings,
  Palette,
  MessageSquarePlus,
  Loader2,
  Star,
  RotateCcw,
  Upload,
  Gamepad2,
  Home
} from 'lucide-react';
import Image from 'next/image';
import { ShareExportModal, ImportModal, PrintableList } from '../components/ExportImportModals';
import { GamesView } from '../components/GamesView';
import { PantryView } from '../components/PantryView';
import { ErrorBoundary } from '../components/ErrorBoundary';

// --- Types ---
type View = 'lists' | 'history' | 'settings' | 'offers' | 'detail' | 'games' | 'pantry';

interface ListItem {
  id: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
  checked: boolean;
  unit?: string;
  notes?: string;
  weight?: string;
  offer?: boolean;
  bulkDiscount?: string;
  wholesalePrice?: number;
  minWholesaleQty?: number;
  importanceLevel?: number; // 0: None, 1: Yellow, 2: Blue, 3: Orange
}

interface GroceryList {
  id: string;
  name: string;
  status: 'Em andamento' | 'Concluído';
  icon: string;
  color: string;
  items: ListItem[];
  avatars?: string[];
  extra?: number;
  budgetLimit?: number;
  completedAt?: string;
  totalAmount?: number;
  userId?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

// --- Mock Data ---
interface Currency {
  symbol: string;
  name: string;
  code: string;
}

const CURRENCIES: Currency[] = [
  { symbol: 'R$', name: 'Real Brasileiro', code: 'BRL' },
  { symbol: '$', name: 'Dólar Americano', code: 'USD' },
  { symbol: '€', name: 'Euro', code: 'EUR' },
  { symbol: '£', name: 'Libra Esterlina', code: 'GBP' },
];

interface ThemeColor {
  id: string;
  name: string;
  hex: string;
  bg: string;
  text: string;
  border: string;
  light: string;
  hover: string;
  ring: string;
}

const THEME_COLORS: ThemeColor[] = [
  { id: 'green', name: 'Esmeralda', hex: '#16a34a', bg: 'bg-green-600', text: 'text-green-600', border: 'border-green-600', light: 'bg-green-50', hover: 'hover:bg-green-700', ring: 'focus:ring-green-500' },
  { id: 'blue', name: 'Oceano', hex: '#2563eb', bg: 'bg-blue-600', text: 'text-blue-600', border: 'border-blue-600', light: 'bg-blue-50', hover: 'hover:bg-blue-700', ring: 'focus:ring-blue-500' },
  { id: 'purple', name: 'Ametista', hex: '#9333ea', bg: 'bg-purple-600', text: 'text-purple-600', border: 'border-purple-600', light: 'bg-purple-50', hover: 'hover:bg-purple-700', ring: 'focus:ring-purple-500' },
  { id: 'rose', name: 'Framboesa', hex: '#e11d48', bg: 'bg-rose-600', text: 'text-rose-600', border: 'border-rose-600', light: 'bg-rose-50', hover: 'hover:bg-rose-700', ring: 'focus:ring-rose-500' },
  { id: 'orange', name: 'Âmbar', hex: '#ea580c', bg: 'bg-orange-600', text: 'text-orange-600', border: 'border-orange-600', light: 'bg-orange-50', hover: 'hover:bg-orange-700', ring: 'focus:ring-orange-500' },
];

// --- Initial Mock Data (Commented out as we now use Firestore)
/*
const INITIAL_LIST_ITEMS: ListItem[] = [
  { id: 'i1', name: 'Leite Integral A2', category: 'Laticínios', price: 14.90, quantity: 2, checked: true },
  { id: 'i2', name: 'Abacate Hass Premium', category: 'Hortifruti', price: 22.00, quantity: 4, checked: false, weight: '1.250', offer: true },
  { id: 'i3', name: 'Café Gourmet Torrado 500g', category: 'Despensa', price: 31.50, quantity: 1, checked: false },
  { id: 'i4', name: 'Pão de Forma Integral', category: 'Padaria', price: 8.90, quantity: 1, checked: true },
];

const INITIAL_LISTS: GroceryList[] = [
  { id: '1', name: 'Compras de Outubro', items: INITIAL_LIST_ITEMS, status: 'Em andamento', icon: 'ShoppingCart', color: 'bg-green-100 text-green-600', avatars: ['https://lh3.googleusercontent.com/aida-public/AB6AXuBhVmSNF1YyobjMr8T2-BviiDaS0kps8HprjxSTfKQV7Bnp8gO_W4MsekvnOsJab11eqM0moSyYXBgcVA2cxqv4eSyPb3aS32XjDta0sAEXBtrpZmzcl0C8ZTr8s00wkT2DxIX5uSq9gioJ3RGXueL2MUWzySXLVYjX2GWVxPJ6JkmLL9ONB9Jxs3-QgZ5yd4pm6NxlwqgvcQWelBgzjfIm-cL08WxCPkEO1YpqXTcHx2yGHDK3-qav-nLvJDWyknqq6Qa4SM1PgA', 'https://lh3.googleusercontent.com/aida-public/AB6AXuD3PA_eNzDoQN4DAsOZNye2L3AD71ZV1obm1YlFJE-MA0sukShQNcSEuISADvd23Ol8rl8Wj5Ox_Bq52ymVnWnno49Vmeaj3iHM1ffhBakwOjF5MbliwMNIx0Gb5ba1SluiGSu7an3oBw2A49oZbgWLSn5f9MqAyUqhIgL7MFJIK-peYlc7Mw_-YZ6jX2ZfmuLBjShMf6Xs6s6Q8SxiuQVYXheLXEd7cP5_pNPHdh81UEQUrLDRhj9eMKHgfqUUJ0Ea2fQhF_hElw'], extra: 18, budgetLimit: 500 },
  { id: '2', name: 'Churrasco de Domingo', items: [], status: 'Concluído', icon: 'UtensilsCrossed', color: 'bg-orange-100 text-orange-600', avatars: ['https://lh3.googleusercontent.com/aida-public/AB6AXuDVfNSZRuXrdr88Gb0LWqsJff6Ur59NP36YpaKxjtSxRxFli9p94z-WF24vfLrSTdj21gJy3zw9S1-5NDadOpNX9PwxypO3IViicsUshgij7Hz_xAQQsQ35bm28eqycz2DWf4NUjKSSVoV4DWjycgkCZ8QnNmmm26DgO1py9Nw48ThsZjKc3TlaY8xXNt0qn2bOSnTlMtdedVg0DgYzaYW3AzZJ3n899-CqP4ARWmWcI7AI9QhNv6t5ec9ZR-7HKFKQSu5jik0ucw'], extra: 10, budgetLimit: 300, completedAt: '28 de Abr', totalAmount: 285.50 },
  { id: '3', name: 'Dieta Saudável', items: [], status: 'Em andamento', icon: 'Leaf', color: 'bg-emerald-100 text-emerald-600', avatars: ['https://lh3.googleusercontent.com/aida-public/AB6AXuBUc9GhXDLTaAxTamVCsVkOjWwcNa1ajVfNinKv1Z5OegLBIjUuNeEJmsA53Gc1GHPSZ_n-YFhREE0xbqynh2CE10Dps4aD6Xfp_mr8NT5KlGZ0HQv9sabW8KPnTlEz5csa9pi7nD3n8xEkwsGrUg7y_cZGPzlMzd-sI_JvV8XfG4AEpm85XWzxPrucTbKVoa24jOB30H9qotaQz21Z0au0FjWuyW1mS9ZPtQEoT6MsmNRBGVBajNNTj0hHKE0eHkeeBWyBIqA9Iw'], budgetLimit: 200 },
  { id: '4', name: 'Limpeza da Casa', items: [], status: 'Concluído', icon: 'Sparkles', color: 'bg-blue-100 text-blue-600', avatars: ['https://lh3.googleusercontent.com/aida-public/AB6AXuALalHuAx4OTkFFquEmd3fCGxu6JCpRlqe3kLUHxSXFdjhYtkLOi_rJy32JWnDc_B2EB7uyRWQSV8650letAcxQfG0ySDhk9t4nZPkpWmvpmtjHKgl78HQRQcGCKsZOLRGkzWmB5ui-Q205s93Cb4qSZlbEt52zbrWuswFk2dD-Hr5CvEr6fGlboKOdQIaVqpt5fdORiPvM9otswgjuySJSkrTdB-2fHJ7YVYRzqQ707YO1D5rjM3k9fw3Wsz2ZGOTaVFG09mmR_Q'], budgetLimit: 150, completedAt: '15 de Mar', totalAmount: 142.10 },
];
*/

const ListIcon = ({ name, size = 20 }: { name: string, size?: number }) => {
  const IconMap: Record<string, React.ElementType> = {
    'ShoppingCart': ShoppingCart,
    'UtensilsCrossed': UtensilsCrossed,
    'Leaf': Leaf,
    'Sparkles': Sparkles,
    'ShoppingBasket': ShoppingBasket
  };
  const Icon = IconMap[name] || ShoppingCart;
  return <Icon size={size} />;
};

// ... (keep previous interfaces)

// --- Pricing & Safe Number Helpers ---
const safeNumber = (val: unknown, fallback: number = 0): number => {
  if (typeof val === 'number') return isNaN(val) ? fallback : val;
  if (!val) return fallback;
  const parsed = parseFloat(String(val).replace(',', '.'));
  return isNaN(parsed) ? fallback : parsed;
};

const safeFormatMoney = (val: unknown): string => {
  const num = safeNumber(val, 0);
  return num.toFixed(2).replace('.', ',');
};

const parseItemAmount = (item?: ListItem | null): number => {
  if (!item) return 1;
  if (item.weight !== undefined && item.weight !== null && item.weight !== '') {
    const val = parseFloat(String(item.weight).replace(',', '.'));
    return isNaN(val) || val <= 0 ? 1 : val;
  }
  const qty = typeof item.quantity === 'number' ? item.quantity : parseFloat(String(item.quantity || '1').replace(',', '.'));
  return isNaN(qty) || qty <= 0 ? 1 : qty;
};

const calculateItemPrice = (item?: ListItem | null): number => {
  if (!item) return 0;
  const amount = parseItemAmount(item);
  const wholesalePriceNum = item.wholesalePrice !== undefined && item.wholesalePrice !== null ? safeNumber(item.wholesalePrice) : undefined;
  const minWholesaleQtyNum = item.minWholesaleQty !== undefined && item.minWholesaleQty !== null ? safeNumber(item.minWholesaleQty) : undefined;

  if (minWholesaleQtyNum !== undefined && minWholesaleQtyNum > 0 && amount >= minWholesaleQtyNum && wholesalePriceNum !== undefined && wholesalePriceNum > 0) {
    return wholesalePriceNum;
  }
  return safeNumber(item.price, 0);
};

// --- Components ---

const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode }) => (
  <AnimatePresence>
    {isOpen && (
      <>
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]"
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="fixed left-4 right-4 top-1/2 -translate-y-1/2 bg-white rounded-3xl p-6 z-[101] shadow-2xl max-w-md mx-auto"
        >
          <h3 className="text-xl font-bold text-slate-900 mb-4">{title}</h3>
          {children}
        </motion.div>
      </>
    )}
  </AnimatePresence>
);

const TopBar = ({ 
  title = "Mercado Fresh", 
  onBack, 
  themeColor,
  rightContent,
  icon
}: { 
  title?: string, 
  onBack?: () => void, 
  themeColor: ThemeColor,
  rightContent?: React.ReactNode,
  icon?: React.ReactNode
}) => (
  <header className="fixed top-0 left-0 w-full z-50 flex items-center justify-between px-4 h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/50 shadow-sm no-print">
    <div className="flex items-center gap-3">
      {onBack ? (
        <button onClick={onBack} className={`p-2 ${themeColor.light} rounded-full transition-colors ${themeColor.text}`}>
          <ArrowLeft size={24} />
        </button>
      ) : (
        icon || <ShoppingBasket className={themeColor.text} size={28} />
      )}
      <h1 className={`text-xl font-extrabold tracking-tight ${themeColor.text}`}>{title}</h1>
    </div>
    {rightContent && <div className="flex items-center">{rightContent}</div>}
  </header>
);

const BottomNav = ({ activeView, setView, themeColor }: { activeView: View, setView: (v: View) => void, themeColor: ThemeColor }) => (
  <nav className="fixed bottom-0 left-0 w-full z-50 bg-white/95 backdrop-blur-lg border-t border-slate-100 shadow-lg rounded-t-3xl pb-8 pt-3">
    <div className="max-w-lg mx-auto flex items-center justify-around px-1 sm:px-2">
      <button id="nav-item-lists" onClick={() => setView('lists')} className={`flex-1 min-w-0 bottom-nav-item ${activeView === 'lists' ? themeColor.text : 'text-slate-400'}`}>
        <div className={`p-1.5 sm:p-2 rounded-xl transition-all ${activeView === 'lists' ? themeColor.light : ''}`}>
          <ReceiptText size={20} fill={activeView === 'lists' ? 'currentColor' : 'none'} />
        </div>
        <span className="text-[10px] sm:text-[11px] font-semibold truncate">Listas</span>
      </button>
      <button id="nav-item-pantry" onClick={() => setView('pantry')} className={`flex-1 min-w-0 bottom-nav-item ${activeView === 'pantry' ? themeColor.text : 'text-slate-400'}`}>
        <div className={`p-1.5 sm:p-2 rounded-xl transition-all ${activeView === 'pantry' ? themeColor.light : ''}`}>
          <Home size={20} fill={activeView === 'pantry' ? 'currentColor' : 'none'} />
        </div>
        <span className="text-[10px] sm:text-[11px] font-semibold truncate">Despensa</span>
      </button>
      <button id="nav-item-offers" onClick={() => setView('offers')} className={`flex-1 min-w-0 bottom-nav-item ${activeView === 'offers' ? themeColor.text : 'text-slate-400'}`}>
        <div className={`p-1.5 sm:p-2 rounded-xl transition-all ${activeView === 'offers' ? themeColor.light : ''}`}>
          <Zap size={20} fill={activeView === 'offers' ? 'currentColor' : 'none'} />
        </div>
        <span className="text-[10px] sm:text-[11px] font-semibold truncate">Ofertas</span>
      </button>
      <button id="nav-item-games" onClick={() => setView('games')} className={`flex-1 min-w-0 bottom-nav-item ${activeView === 'games' ? themeColor.text : 'text-slate-400'}`}>
        <div className={`p-1.5 sm:p-2 rounded-xl transition-all ${activeView === 'games' ? themeColor.light : ''}`}>
          <Gamepad2 size={20} fill={activeView === 'games' ? 'currentColor' : 'none'} />
        </div>
        <span className="text-[10px] sm:text-[11px] font-semibold truncate">Jogos</span>
      </button>
      <button id="nav-item-history" onClick={() => setView('history')} className={`flex-1 min-w-0 bottom-nav-item ${activeView === 'history' ? themeColor.text : 'text-slate-400'}`}>
        <div className={`p-1.5 sm:p-2 rounded-xl transition-all ${activeView === 'history' ? themeColor.light : ''}`}>
          <History size={20} fill={activeView === 'history' ? 'currentColor' : 'none'} />
        </div>
        <span className="text-[10px] sm:text-[11px] font-semibold truncate">Histórico</span>
      </button>
      <button id="nav-item-settings" onClick={() => setView('settings')} className={`flex-1 min-w-0 bottom-nav-item ${activeView === 'settings' ? themeColor.text : 'text-slate-400'}`}>
        <div className={`p-1.5 sm:p-2 rounded-xl transition-all ${activeView === 'settings' ? themeColor.light : ''}`}>
          <Settings size={20} fill={activeView === 'settings' ? 'currentColor' : 'none'} />
        </div>
        <span className="text-[10px] sm:text-[11px] font-semibold truncate">Ajustes</span>
      </button>
    </div>
  </nav>
);

const ListsView = ({ 
  lists, 
  onSelect, 
  onAddList, 
  onDeleteList, 
  onShare, 
  onOpenImport,
  themeColor, 
  onFinishList, 
  onDuplicateOpen 
}: { 
  lists: GroceryList[], 
  onSelect: (id: string) => void, 
  onAddList: () => void, 
  onDeleteList: (id: string) => void, 
  onShare: (list: GroceryList) => void, 
  onOpenImport: () => void,
  themeColor: ThemeColor, 
  onFinishList: (list: GroceryList, total: number) => void, 
  onDuplicateOpen: (list: GroceryList) => void 
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLists = lists.filter(list => 
    list && (list.name || '').toLowerCase().includes((searchQuery || '').toLowerCase())
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="pt-24 px-4 max-w-2xl mx-auto pb-32"
    >
      <div className="relative mb-3">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input 
          type="text" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar listas..." 
          className={`w-full bg-white border-none rounded-full py-4 pl-12 pr-4 shadow-inner text-sm focus:ring-2 ${themeColor.ring} transition-all font-medium`}
        />
      </div>

      {/* Quick Action Buttons */}
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={onAddList}
          className={`flex-1 py-3 px-4 ${themeColor.bg} text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm hover:brightness-105 active:scale-95 transition-all`}
        >
          <Plus size={16} strokeWidth={3} />
          <span>Nova Lista</span>
        </button>
        <button
          onClick={onOpenImport}
          className="flex-1 py-3 px-4 bg-white border border-slate-200 text-slate-700 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm hover:bg-slate-50 active:scale-95 transition-all"
        >
          <Upload size={16} className={themeColor.text} />
          <span>Importar Lista (.JSON / .CSV)</span>
        </button>
      </div>

      {filteredLists.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence>
            {filteredLists.map((list) => (
              <motion.div 
                layout
                key={list.id} 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                className="bento-card group cursor-pointer relative overflow-hidden h-44 flex flex-col justify-between"
              >
                <div className="absolute top-4 right-4 flex items-center gap-2">
                  <button 
                    onClick={(e) => { e.stopPropagation(); onDuplicateOpen(list); }} 
                    className="p-2 text-slate-500 bg-slate-50 rounded-full transition-all hover:bg-slate-100 shadow-sm border border-slate-100"
                  >
                    <Copy size={14} />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onShare(list); }} 
                    className={`p-2 ${themeColor.text} ${themeColor.light} rounded-full transition-all hover:brightness-95`}
                  >
                    <Share2 size={14} />
                  </button>
                  {(list.items?.length || 0) > 0 && list.status === 'Em andamento' && (list.items || []).every(item => item && item.checked) && (
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        const total = (list.items || []).filter(Boolean).reduce((acc, curr) => {
                          const amount = parseItemAmount(curr);
                          return acc + (calculateItemPrice(curr) * amount);
                        }, 0);
                        onFinishList(list, total); 
                      }} 
                      className={`flex items-center gap-1 px-3 py-1.5 ${themeColor.bg} text-white rounded-full transition-all shadow-md hover:brightness-110 active:scale-90 text-[10px] font-bold`}
                      title="Finalizar Compra"
                    >
                      <Check size={12} strokeWidth={4} /> FINALIZAR
                    </button>
                  )}
                  <button 
                    onClick={(e) => { e.stopPropagation(); onDeleteList(list.id); }} 
                    className="p-2 text-red-500 bg-red-50 rounded-full transition-all hover:bg-red-100 shadow-sm border border-red-100"
                  >
                    <Trash2 size={14} />
                  </button>
                  <span className={`badge ${list.status === 'Concluído' ? `${themeColor.light} ${themeColor.text}` : 'bg-orange-100 text-orange-700'}`}>
                    {list.status}
                  </span>
                </div>
                <div onClick={() => onSelect(list.id)} className="flex-1 flex flex-col justify-center">
                  <div className="flex items-center justify-between mb-2">
                    <div className={`w-10 h-10 ${list.color || 'bg-emerald-100 text-emerald-600'} rounded-xl flex items-center justify-center`}>
                      <ListIcon name={list.icon || 'ShoppingCart'} />
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 line-clamp-1">{list.name}</h3>
                  <div className="flex flex-col gap-1.5">
                    <p className="text-slate-500 text-[11px] font-medium">{list.items?.length || 0} itens no carrinho</p>
                  </div>
                </div>
                <div onClick={() => onSelect(list.id)} className="flex items-center justify-between mt-4">
                  <div className="flex -space-x-2">
                    {list.avatars?.map((avatar, i) => (
                      <div key={i} className="w-8 h-8 rounded-full border-2 border-white overflow-hidden bg-slate-200">
                        <Image src={avatar} alt="User" width={32} height={32} referrerPolicy="no-referrer" />
                      </div>
                    ))}
                    {list.extra && (
                      <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600">
                        +{list.extra}
                      </div>
                    )}
                  </div>
                  <ChevronRight className={`text-slate-400 group-hover:${themeColor.text} transition-colors`} size={20} />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center opacity-50">
          <div className="bg-slate-100 p-6 rounded-full mb-4">
            <Search size={48} className="text-slate-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Nenhuma lista encontrada</h3>
          <p className="text-slate-500 text-sm">Tente buscar por outro nome.</p>
        </div>
      )}

      <button 
        onClick={onAddList}
        className={`fixed bottom-28 right-6 z-50 flex items-center gap-2 ${themeColor.bg} text-white px-6 py-4 rounded-full shadow-xl ${themeColor.hover} active:scale-95 transition-all`}
      >
        <Plus size={24} strokeWidth={3} />
        <span className="font-bold">Nova Lista</span>
      </button>
    </motion.div>
  );
};

const ITEM_CATEGORIES = [
  'Geral',
  'Hortifruti',
  'Laticínios',
  'Carnes & Aves',
  'Padaria & Pães',
  'Mercearia & Grãos',
  'Bebidas',
  'Limpeza',
  'Higiene & Cuidados',
  'Congelados',
  'Doces & Snacks',
  'Pet Shop',
  'Outros'
];

const DetailView = ({ 
  list, 
  onBack, 
  onUpdateList, 
  onFinishList, 
  onOpenExportModal,
  onOpenImportModal,
  currency, 
  themeColor 
}: { 
  list: GroceryList, 
  onBack: () => void, 
  onUpdateList: (list: GroceryList) => void, 
  onFinishList: (list: GroceryList, total: number) => void, 
  onOpenExportModal: (list: GroceryList) => void,
  onOpenImportModal: (list?: GroceryList) => void,
  currency: Currency, 
  themeColor: ThemeColor 
}) => {
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('Geral');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemAmount, setNewItemAmount] = useState('1');
  const [newItemNotes, setNewItemNotes] = useState('');
  const [isWeightBased, setIsWeightBased] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [itemSearchQuery, setItemSearchQuery] = useState('');
  
  // Wholesale state
  const [hasWholesale, setHasWholesale] = useState(false);
  const [wholesalePrice, setWholesalePrice] = useState('');
  const [minWholesaleQty, setMinWholesaleQty] = useState('');

  // Edit State
  const [editingItem, setEditingItem] = useState<ListItem | null>(null);
  const [importanceLevel, setImportanceLevel] = useState(0);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('Geral');
  const [editPrice, setEditPrice] = useState('');
  const [editAmount, setEditAmount] = useState('1');
  const [editNotes, setEditNotes] = useState('');
  const [editIsWeightBased, setEditIsWeightBased] = useState(false);
  const [editImportanceLevel, setEditImportanceLevel] = useState(0);
  const [editWholesalePrice, setEditWholesalePrice] = useState('');
  const [editMinWholesaleQty, setEditMinWholesaleQty] = useState('');
  const [editHasWholesale, setEditHasWholesale] = useState(false);

  const items = useMemo(() => (list?.items || []).filter(Boolean), [list?.items]);
  const filteredItems = useMemo(() => items.filter(item => 
    item && (item.name || '').toLowerCase().includes((itemSearchQuery || '').toLowerCase())
  ), [items, itemSearchQuery]);

  const totalCarrinho = items.filter(i => i && i.checked).reduce((acc, curr) => {
    const amount = parseItemAmount(curr);
    return acc + (calculateItemPrice(curr) * amount);
  }, 0);
  const totalEstimado = items.reduce((acc, curr) => {
    const amount = parseItemAmount(curr);
    return acc + (calculateItemPrice(curr) * amount);
  }, 0);

  const budgetLimit = list.budgetLimit || 100;

  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [tempBudget, setTempBudget] = useState(budgetLimit.toString());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSetBudget = () => {
    setTempBudget(budgetLimit.toString().replace('.', ','));
    setIsBudgetModalOpen(true);
  };

  const confirmSetBudget = () => {
    const val = parseFloat(tempBudget.replace(',', '.'));
    if (!isNaN(val) && val > 0) {
      onUpdateList({ ...list, budgetLimit: val });
      setIsBudgetModalOpen(false);
    }
  };

  const addItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim() || isSubmitting) return;
    setIsSubmitting(true);
    
    const price = parseFloat(newItemPrice.replace(',', '.')) || 0;
    const amount = parseFloat(newItemAmount.replace(',', '.')) || 1;
    let wPrice: number | undefined = undefined;
    let minQty: number | undefined = undefined;

    if (hasWholesale) {
        const parsedWPrice = parseFloat(wholesalePrice.replace(',', '.'));
        const parsedMinQty = parseFloat(minWholesaleQty.replace(',', '.'));
        
        if (!isNaN(parsedWPrice)) wPrice = parsedWPrice;
        if (!isNaN(parsedMinQty)) minQty = parsedMinQty;
    }

    const newItem: ListItem = {
      id: Math.random().toString(36).substr(2, 9),
      name: newItemName,
      category: newItemCategory.trim() || 'Geral',
      price: price,
      quantity: isWeightBased ? 1 : amount,
      weight: isWeightBased ? amount.toString() : undefined,
      unit: isWeightBased ? 'kg' : 'un',
      notes: newItemNotes.trim() || undefined,
      checked: false,
      wholesalePrice: wPrice,
      minWholesaleQty: minQty,
      importanceLevel: importanceLevel
    };

    onUpdateList({ ...list, items: [newItem, ...(list.items || [])] });
    setNewItemName('');
    setNewItemCategory('Geral');
    setNewItemPrice('');
    setNewItemAmount('1');
    setNewItemNotes('');
    setWholesalePrice('');
    setMinWholesaleQty('');
    setHasWholesale(false);
    setShowAddForm(false);
    setIsSubmitting(false);
    setImportanceLevel(0);
  };

  const handleEditClick = (item: ListItem) => {
    setEditingItem(item);
    setEditName(item.name);
    setEditCategory(item.category || 'Geral');
    setEditPrice(item.price > 0 ? item.price.toString().replace('.', ',') : '');
    setEditNotes(item.notes || '');
    const isWeight = !!item.weight;
    setEditIsWeightBased(isWeight);
    setEditAmount(isWeight ? (item.weight !== undefined && item.weight !== null ? item.weight.toString().replace('.', ',') : '1') : (item.quantity ? item.quantity.toString() : '1'));
    setEditImportanceLevel(item.importanceLevel || 0);
    setEditWholesalePrice(item.wholesalePrice?.toString().replace('.', ',') || '');
    setEditMinWholesaleQty(item.minWholesaleQty?.toString().replace('.', ',') || '');
    setEditHasWholesale(!!item.wholesalePrice);
  };

  const confirmEdit = () => {
    if (!editingItem) return;
    const price = parseFloat(editPrice.replace(',', '.')) || 0;
    const amount = parseFloat(editAmount.replace(',', '.')) || (editIsWeightBased ? 0.1 : 1);
    let wPrice: number | undefined = undefined;
    let minQty: number | undefined = undefined;

    if (editHasWholesale) {
      const parsedWPrice = parseFloat(editWholesalePrice.replace(',', '.'));
      const parsedMinQty = parseFloat(editMinWholesaleQty.replace(',', '.'));
      
      if (!isNaN(parsedWPrice)) wPrice = parsedWPrice;
      if (!isNaN(parsedMinQty)) minQty = parsedMinQty;
    }

    const newItems = (list.items || []).map(i => 
      i.id === editingItem.id ? { 
        ...i, 
        name: editName.trim() || i.name, 
        category: editCategory.trim() || i.category || 'Geral',
        price: price,
        quantity: editIsWeightBased ? 1 : Math.max(1, amount),
        weight: editIsWeightBased ? amount.toString() : undefined,
        unit: editIsWeightBased ? 'kg' : (i.unit && i.unit !== 'kg' ? i.unit : 'un'),
        notes: editNotes.trim() || undefined,
        importanceLevel: editImportanceLevel,
        wholesalePrice: wPrice,
        minWholesaleQty: minQty
      } : i
    );
    onUpdateList({ ...list, items: newItems });
    setEditingItem(null);
  };

  const updateItem = (itemId: string, updates: Partial<ListItem>) => {
    const newItems = (list.items || []).map(i => i.id === itemId ? { ...i, ...updates } : i);
    onUpdateList({ ...list, items: newItems });
  };

  const deleteItem = (itemId: string) => {
    const newItems = (list.items || []).filter(i => i.id !== itemId);
    onUpdateList({ ...list, items: newItems });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="pb-48 flex flex-col min-h-screen"
    >
      <TopBar 
        title={list.name} 
        onBack={onBack} 
        themeColor={themeColor} 
        rightContent={
          <div className="flex items-center gap-1.5">
            <button 
              onClick={() => onOpenImportModal?.(list)}
              className="p-2 text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-full transition-all"
              title="Importar produtos (.json ou .csv) para esta lista"
            >
              <Upload size={18} />
            </button>
            <button 
              onClick={() => onOpenExportModal(list)}
              className={`flex items-center gap-1.5 px-3 py-1.5 ${themeColor.bg} text-white rounded-full transition-all shadow-sm hover:brightness-105 active:scale-95 text-xs font-bold`}
              title="Compartilhar ou Exportar Lista"
            >
              <Share2 size={15} />
              <span className="hidden sm:inline">Exportar</span>
            </button>
          </div>
        }
      />
      
      <main className="mt-16 px-4 max-w-2xl mx-auto w-full pt-4">
        {/* Export / Share & Import Action Buttons */}
        <div className="flex items-center gap-2 mb-4">
          <button 
            onClick={() => onOpenExportModal(list)}
            className="flex-1 h-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center gap-2 text-slate-700 hover:bg-slate-50 transition-all font-bold text-xs shadow-sm active:scale-95"
          >
            <Share2 size={16} className={themeColor.text} />
            <span>Compartilhar / Exportar lista</span>
          </button>
          <button 
            onClick={() => onOpenImportModal?.(list)}
            className="h-12 px-4 bg-white border border-slate-200 rounded-2xl flex items-center justify-center gap-2 text-slate-700 hover:bg-slate-50 transition-all font-bold text-xs shadow-sm active:scale-95"
            title="Importar itens (.json ou .csv)"
          >
            <Upload size={16} className={themeColor.text} />
            <span className="hidden sm:inline">Importar itens</span>
          </button>
        </div>

        <section className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 mb-4">
          <div className="flex justify-between items-center mb-4">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Limite de Gasto</span>
              <button 
                onClick={handleSetBudget}
                className="flex items-center gap-1 group cursor-pointer hover:opacity-70 transition-all border-none bg-transparent p-0"
              >
                <span className="text-xl font-bold text-slate-900">{currency.symbol} {safeFormatMoney(budgetLimit)}</span>
                <Edit2 size={14} className={themeColor.text} />
              </button>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Disponível</span>
              <span className={`block text-xl font-extrabold ${totalCarrinho > budgetLimit ? 'text-red-500' : themeColor.text}`}>
                {currency.symbol} {safeFormatMoney(Math.max(0, safeNumber(budgetLimit) - totalCarrinho))}
              </span>
            </div>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }} 
              animate={{ width: `${Math.min((totalCarrinho / (safeNumber(budgetLimit) || 1)) * 100, 100)}%` }} 
              className={`h-full rounded-full transition-all ${totalCarrinho > budgetLimit ? 'bg-red-500' : themeColor.bg}`}
            />
          </div>
          <div className="flex justify-between mt-2 text-[10px] font-bold text-slate-400">
            <span>{((totalCarrinho / (safeNumber(budgetLimit) || 1)) * 100).toFixed(1)}% UTILIZADO</span>
            <span>{currency.symbol} {safeFormatMoney(totalCarrinho)} GASTO</span>
          </div>
        </section>

        {totalCarrinho > (budgetLimit * 0.9) && (
          <section className="px-1 mb-6">
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-2">
              <div className={`h-full ${totalCarrinho > budgetLimit ? 'bg-red-500' : 'bg-orange-400'}`} style={{ width: '90%' }}></div>
            </div>
            <div className={`flex items-center gap-2 ${totalCarrinho > budgetLimit ? 'text-red-600' : 'text-orange-600'} text-xs font-bold pl-1`}>
              <Lightbulb size={14} />
              <span>{totalCarrinho > budgetLimit ? 'Atenção: Você ultrapassou seu limite!' : 'Atenção: Você atingiu 90% do seu limite mensal.'}</span>
            </div>
          </section>
        )}

        {/* Item Search inside list */}
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            value={itemSearchQuery}
            onChange={(e) => setItemSearchQuery(e.target.value)}
            placeholder="Buscar item nesta lista..." 
            className={`w-full h-12 pl-12 pr-4 bg-white border-none rounded-2xl shadow-inner text-sm focus:ring-2 ${themeColor.ring} transition-all font-medium`}
          />
        </div>

        <div className="mb-6">
          {!showAddForm ? (
            <button 
              onClick={() => setShowAddForm(true)}
              className={`w-full h-16 bg-white border-2 border-dashed border-slate-200 rounded-full flex items-center justify-center gap-2 text-slate-400 hover:${themeColor.border} hover:${themeColor.text} transition-all font-bold`}
            >
              <Plus size={24} /> Adicionar novo item
            </button>
          ) : (
            <motion.form 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={addItem} 
              className={`bg-white p-6 rounded-3xl shadow-lg border ${themeColor.light.replace('bg-', 'border-')} flex flex-col gap-4`}
            >
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between ml-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Nome do Produto</label>
                  <button 
                    type="button"
                    onClick={() => setImportanceLevel((importanceLevel + 1) % 4)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-all border ${
                      importanceLevel === 1 ? 'bg-amber-50 text-amber-500 border-amber-200' : 
                      importanceLevel === 2 ? 'bg-blue-50 text-blue-500 border-blue-200' : 
                      importanceLevel === 3 ? 'bg-orange-50 text-orange-500 border-orange-200' : 'bg-slate-50 text-slate-400 border-slate-100'
                    }`}
                  >
                    <span className="text-[10px] font-black uppercase tracking-tight">Prioridade</span>
                    <Star size={14} fill={importanceLevel > 0 ? 'currentColor' : 'none'} strokeWidth={3} />
                  </button>
                </div>
                <input 
                  type="text" 
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="Ex: Arroz 5kg" 
                  className={`w-full h-12 px-4 bg-slate-50 border-none rounded-2xl text-lg focus:ring-2 ${themeColor.ring} transition-all font-medium`}
                  autoFocus
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-2">Categoria</label>
                <select 
                  value={newItemCategory}
                  onChange={(e) => setNewItemCategory(e.target.value)}
                  className={`w-full h-11 px-4 bg-slate-50 border-none rounded-2xl text-sm font-medium focus:ring-2 ${themeColor.ring} cursor-pointer`}
                >
                  {ITEM_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="flex bg-slate-100 p-1 rounded-2xl gap-1">
                <button 
                  type="button"
                  onClick={() => setIsWeightBased(false)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${!isWeightBased ? `bg-white shadow-sm ${themeColor.text}` : 'text-slate-400'}`}
                >
                  Unidades
                </button>
                <button 
                  type="button"
                  onClick={() => setIsWeightBased(true)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${isWeightBased ? `bg-white shadow-sm ${themeColor.text}` : 'text-slate-400'}`}
                >
                  Peso (KG)
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-2">
                    {isWeightBased ? 'Peso (KG)' : 'Quantidade'}
                  </label>
                  <input 
                    type="text" 
                    inputMode="decimal"
                    value={newItemAmount}
                    onChange={(e) => setNewItemAmount(e.target.value)}
                    placeholder={isWeightBased ? "0,000" : "1"} 
                    className={`w-full h-12 px-4 bg-slate-50 border-none rounded-2xl text-lg focus:ring-2 ${themeColor.ring} transition-all font-medium`}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-2">
                    {isWeightBased ? 'Preço por KG' : 'Preço Unitário'}
                  </label>
                  <input 
                    type="text" 
                    inputMode="decimal"
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(e.target.value)}
                    placeholder="0,00" 
                    className={`w-full h-12 px-4 bg-slate-50 border-none rounded-2xl text-lg focus:ring-2 ${themeColor.ring} transition-all font-medium`}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-2">Observações (opcional)</label>
                <input 
                  type="text" 
                  value={newItemNotes}
                  onChange={(e) => setNewItemNotes(e.target.value)}
                  placeholder="Ex: Marca específica, embalagem econômica" 
                  className={`w-full h-11 px-4 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 ${themeColor.ring} transition-all font-medium`}
                />
              </div>

              <div className="flex gap-2">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={hasWholesale}
                    onChange={(e) => setHasWholesale(e.target.checked)}
                    className="rounded border-slate-300 text-green-600 focus:ring-green-500"
                  />
                  Possui desconto por Qtde/Peso?
                </label>
              </div>

              {hasWholesale && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-2">Qtd/Peso Mín.</label>
                    <input 
                      type="text" 
                      inputMode="decimal"
                      value={minWholesaleQty}
                      onChange={(e) => setMinWholesaleQty(e.target.value)}
                      placeholder="Ex: 3"
                      className={`w-full h-12 px-4 bg-slate-50 border-none rounded-2xl text-lg focus:ring-2 ${themeColor.ring} transition-all font-medium`}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-2">Preço {isWeightBased ? 'p/ KG' : 'p/ UN'} c/ Desc. (por unidade/KG)</label>
                    <input 
                      type="text" 
                      inputMode="decimal"
                      value={wholesalePrice}
                      onChange={(e) => setWholesalePrice(e.target.value)}
                      placeholder="Ex: 2,00"
                      className={`w-full h-12 px-4 bg-slate-50 border-none rounded-2xl text-lg focus:ring-2 ${themeColor.ring} transition-all font-medium`}
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-2 mt-2">
                <button 
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 h-12 bg-slate-100 text-slate-500 rounded-2xl font-bold active:scale-95 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className={`flex-1 h-12 ${themeColor.bg} text-white rounded-2xl font-bold active:scale-95 transition-all shadow-lg hover:shadow-xl shadow-slate-200 hover:brightness-105 active:shadow-md ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isSubmitting ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </motion.form>
          )}
        </div>

        <div className="space-y-3">
          <AnimatePresence>
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => (
                <motion.div 
                  layout
                  key={item.id} 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-3 group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div 
                        onClick={(e) => { e.stopPropagation(); updateItem(item.id, { importanceLevel: ((item.importanceLevel || 0) + 1) % 4 }) }}
                        className={`cursor-pointer transition-all hover:scale-110 active:scale-95 ${
                          item.importanceLevel === 1 ? 'text-amber-400' : 
                          item.importanceLevel === 2 ? 'text-blue-500' : 
                          item.importanceLevel === 3 ? 'text-orange-500' : 'text-slate-400'
                        }`}
                      >
                        <Star size={22} fill={(item.importanceLevel || 0) > 0 ? 'currentColor' : 'none'} strokeWidth={2.5} />
                      </div>
                      <div 
                        onClick={() => updateItem(item.id, { checked: !item.checked })}
                        className={`w-6 h-6 border-2 rounded-lg flex items-center justify-center transition-all cursor-pointer ${item.checked ? `${themeColor.bg} ${themeColor.border}` : 'border-slate-300'}`}
                      >
                        {item.checked && <Check size={16} className="text-white" strokeWidth={4} />}
                      </div>
                      <div className="flex flex-col">
                        <span className={`text-lg font-semibold ${item.checked ? 'line-through text-slate-300' : 'text-slate-800'}`}>{item.name}</span>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full w-fit">{item.category}</span>
                          {item.notes && (
                            <span className="text-[10px] font-medium text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full max-w-[220px] truncate" title={item.notes}>
                              Obs: {item.notes}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center bg-slate-100 rounded-full p-1 gap-3">
                          <button 
                            onClick={() => {
                              if (item.weight) {
                                const w = safeNumber(item.weight, 0);
                                updateItem(item.id, { weight: Math.max(0.1, w - 0.1).toFixed(3) });
                              } else {
                                updateItem(item.id, { quantity: Math.max(1, (Number(item.quantity) || 1) - 1) });
                              }
                            }}
                            className={`w-6 h-6 flex items-center justify-center ${themeColor.text} active:scale-75 transition-transform`}
                          >
                          <Minus size={16} />
                        </button>
                        <span className="text-sm font-bold min-w-[20px] text-center">
                          {item.weight ? `${item.weight}kg` : item.quantity}
                        </span>
                          <button 
                            onClick={() => {
                              if (item.weight) {
                                const w = safeNumber(item.weight, 0);
                                updateItem(item.id, { weight: (w + 0.1).toFixed(3) });
                              } else {
                                updateItem(item.id, { quantity: (Number(item.quantity) || 1) + 1 });
                              }
                            }}
                            className={`w-6 h-6 flex items-center justify-center ${themeColor.text} active:scale-75 transition-transform`}
                          >
                          <Plus size={16} />
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1 group-hover:opacity-100 transition-all">
                          <button 
                             onClick={(e) => { e.stopPropagation(); handleEditClick(item); }}
                             className={`p-1 px-2 text-slate-400 hover:${themeColor.text} hover:${themeColor.light} rounded-lg transition-all flex items-center gap-1`}
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                             onClick={(e) => { e.stopPropagation(); deleteItem(item.id); }}
                             className="p-1 px-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all bg-red-50/10"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <div className="flex flex-col items-end">
                          {(parseItemAmount(item) > 1 || item.weight) && calculateItemPrice(item) > 0 && (
                            <span className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1 flex items-center gap-1">
                              {item.weight ? `${item.weight}kg` : `${item.quantity}un`} x 
                              {calculateItemPrice(item) !== safeNumber(item.price) ? (
                                <>
                                  <span className="line-through text-slate-300">{currency.symbol} {safeFormatMoney(item.price)}/{item.weight ? 'kg' : 'un'}</span>
                                  <span className="text-green-600">{currency.symbol} {safeFormatMoney(calculateItemPrice(item))}/{item.weight ? 'kg' : 'un'}</span>
                                </>
                              ) : (
                                <span>{currency.symbol} {safeFormatMoney(item.price)}/{item.weight ? 'kg' : 'un'}</span>
                              )}
                            </span>
                          )}
                          <span className={`${calculateItemPrice(item) > 0 ? 'text-lg font-extrabold text-slate-900' : 'text-sm font-bold text-slate-300 italic'} leading-none`}>
                            {calculateItemPrice(item) > 0 ? (
                              `${currency.symbol} ${safeFormatMoney(calculateItemPrice(item) * parseItemAmount(item))}`
                            ) : (
                              'Sem preço'
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {item.weight && (
                    <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-100">
                      <div className="flex-1 flex items-center gap-3">
                        <Scale size={16} className="text-slate-400" />
                        <span className="text-xs font-bold text-slate-500 uppercase">Peso Est.</span>
                        <span className="text-sm font-bold">{item.weight} KG</span>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-10 opacity-40">
                <p className="font-bold">Nenhum item encontrado.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] z-[100]">
        <div className="max-w-4xl mx-auto px-4 pt-4 pb-12">
          <div className="grid grid-cols-2 mb-4">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Estimado</span>
              <span className="text-xl font-bold text-slate-400">{currency.symbol} {safeFormatMoney(totalEstimado)}</span>
            </div>
            <div className="flex flex-col items-end">
              <span className={`text-[10px] font-bold ${themeColor.text} uppercase tracking-widest`}>Total Carrinho</span>
              <span className={`text-2xl font-black ${themeColor.text}`}>{currency.symbol} {safeFormatMoney(totalCarrinho)}</span>
            </div>
          </div>
          {list.status === 'Concluído' ? (
            <div className={`w-full h-16 flex items-center justify-center gap-3 bg-slate-100 text-slate-400 rounded-2xl font-black text-lg border-2 border-dashed border-slate-200`}>
              <Award size={24} /> COMPRA CONCLUÍDA
            </div>
          ) : (
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const finalTotal = totalCarrinho > 0 ? totalCarrinho : totalEstimado;
                onFinishList(list, finalTotal);
              }}
              className={`w-full h-16 ${themeColor.bg} hover:brightness-95 active:scale-[0.98] text-white rounded-2xl font-black text-xl shadow-2xl flex items-center justify-center gap-3 transition-all cursor-pointer`}
              id="finish-purchase-button"
            >
              <Check size={32} strokeWidth={4} /> FINALIZAR COMPRA
            </button>
          )}
        </div>
      </footer>

      {/* Budget Modal */}
      <Modal 
        isOpen={isBudgetModalOpen} 
        onClose={() => setIsBudgetModalOpen(false)} 
        title="Alterar Limite"
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-2">Novo Limite ({currency.symbol})</label>
            <input 
              type="text" 
              inputMode="decimal"
              value={tempBudget}
              onChange={(e) => setTempBudget(e.target.value)}
              placeholder="0,00"
              className={`w-full h-12 px-4 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 ${themeColor.ring}`}
              autoFocus
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button 
              onClick={() => setIsBudgetModalOpen(false)}
              className="flex-1 h-12 bg-slate-100 text-slate-500 rounded-xl font-bold"
            >
              Cancelar
            </button>
            <button 
              onClick={confirmSetBudget}
              className={`flex-1 h-12 ${themeColor.bg} text-white rounded-xl font-bold`}
            >
              Salvar
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Item Modal */}
      <Modal 
        isOpen={!!editingItem} 
        onClose={() => setEditingItem(null)} 
        title="Editar Produto"
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between ml-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Nome do Produto</label>
              <button 
                type="button"
                onClick={() => setEditImportanceLevel((editImportanceLevel + 1) % 4)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-all border ${
                  editImportanceLevel === 1 ? 'bg-amber-50 text-amber-500 border-amber-200' : 
                  editImportanceLevel === 2 ? 'bg-blue-50 text-blue-500 border-blue-200' : 
                  editImportanceLevel === 3 ? 'bg-orange-50 text-orange-500 border-orange-200' : 'bg-slate-50 text-slate-400 border-slate-100'
                }`}
              >
                <span className="text-[10px] font-black uppercase tracking-tight">Prioridade</span>
                <Star size={14} fill={editImportanceLevel > 0 ? 'currentColor' : 'none'} strokeWidth={3} />
              </button>
            </div>
            <input 
              type="text" 
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Ex: Arroz 5kg"
              className={`w-full h-12 px-4 bg-slate-50 border-none rounded-2xl text-lg font-medium focus:ring-2 ${themeColor.ring}`}
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-2">Categoria</label>
            <select 
              value={editCategory}
              onChange={(e) => setEditCategory(e.target.value)}
              className={`w-full h-11 px-4 bg-slate-50 border-none rounded-2xl text-sm font-medium focus:ring-2 ${themeColor.ring} cursor-pointer`}
            >
              {ITEM_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
              {!ITEM_CATEGORIES.includes(editCategory) && (
                <option value={editCategory}>{editCategory}</option>
              )}
            </select>
          </div>

          <div className="flex bg-slate-100 p-1 rounded-2xl gap-1">
            <button 
              type="button"
              onClick={() => setEditIsWeightBased(false)}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${!editIsWeightBased ? `bg-white shadow-sm ${themeColor.text}` : 'text-slate-400'}`}
            >
              Unidades
            </button>
            <button 
              type="button"
              onClick={() => setEditIsWeightBased(true)}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${editIsWeightBased ? `bg-white shadow-sm ${themeColor.text}` : 'text-slate-400'}`}
            >
              Peso (KG)
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-2">
                {editIsWeightBased ? 'Peso (KG)' : 'Quantidade'}
              </label>
              <input 
                type="text" 
                inputMode="decimal"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                placeholder={editIsWeightBased ? "0,000" : "1"} 
                className={`w-full h-12 px-4 bg-slate-50 border-none rounded-2xl text-lg font-medium focus:ring-2 ${themeColor.ring}`}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-2">
                {editIsWeightBased ? `Preço p/ KG (${currency.symbol})` : `Preço Unitário (${currency.symbol})`}
              </label>
              <input 
                type="text" 
                inputMode="decimal"
                value={editPrice}
                onChange={(e) => setEditPrice(e.target.value)}
                placeholder="0,00" 
                className={`w-full h-12 px-4 bg-slate-50 border-none rounded-2xl text-lg font-medium focus:ring-2 ${themeColor.ring}`}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-2">Observações (opcional)</label>
            <input 
              type="text" 
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              placeholder="Ex: Marca específica, embalagem econômica" 
              className={`w-full h-11 px-4 bg-slate-50 border-none rounded-2xl text-sm font-medium focus:ring-2 ${themeColor.ring}`}
            />
          </div>

          <div className="flex gap-2">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
              <input 
                type="checkbox" 
                checked={editHasWholesale}
                onChange={(e) => setEditHasWholesale(e.target.checked)}
                className="rounded border-slate-300 text-green-600 focus:ring-green-500"
              />
              Possui desconto por Qtde/Peso?
            </label>
          </div>

          {editHasWholesale && (
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className={`text-[10px] font-bold text-slate-400 uppercase ml-2`}>Qtd/Peso Mín.</label>
                <input 
                  type="text" 
                  inputMode="decimal"
                  value={editMinWholesaleQty}
                  onChange={(e) => setEditMinWholesaleQty(e.target.value)}
                  placeholder="Ex: 3"
                  className={`w-full h-12 px-4 bg-slate-50 border-none rounded-2xl text-lg font-medium focus:ring-2 ${themeColor.ring}`}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className={`text-[10px] font-bold text-slate-400 uppercase ml-2`}>Preço {editIsWeightBased ? 'p/ KG' : 'p/ UN'} c/ Desc.</label>
                <input 
                  type="text" 
                  inputMode="decimal"
                  value={editWholesalePrice}
                  onChange={(e) => setEditWholesalePrice(e.target.value)}
                  placeholder="Ex: 2,00"
                  className={`w-full h-12 px-4 bg-slate-50 border-none rounded-2xl text-lg font-medium focus:ring-2 ${themeColor.ring}`}
                />
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button 
              type="button"
              onClick={() => setEditingItem(null)}
              className="flex-1 h-12 bg-slate-100 text-slate-500 rounded-2xl font-bold active:scale-95 transition-all"
            >
              Cancelar
            </button>
            <button 
              type="button"
              onClick={confirmEdit}
              className={`flex-1 h-12 ${themeColor.bg} text-white rounded-2xl font-bold active:scale-95 transition-all shadow-lg hover:shadow-xl shadow-slate-200 hover:brightness-105`}
            >
              Salvar Alterações
            </button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
};

const OffersView = ({ currency, themeColor }: { currency: Currency, themeColor: ThemeColor }) => {
  const [optAPrice, setOptAPrice] = useState('0.00');
  const [optAWeight, setOptAWeight] = useState('500');
  const [optBPrice, setOptBPrice] = useState('0.00');
  const [optBWeight, setOptBWeight] = useState('1000');

  const calcUnitPrice = (price: string, weight: string) => {
    const p = parseFloat(price.replace(',', '.'));
    const w = parseFloat(weight.replace(',', '.'));
    if (!p || !w) return 0;
    return p / w;
  };

  const unitA = calcUnitPrice(optAPrice, optAWeight);
  const unitB = calcUnitPrice(optBPrice, optBWeight);

  const betterOption = unitA > 0 && unitB > 0 ? (unitA < unitB ? 'A' : 'B') : null;
  const savings = betterOption === 'A' 
    ? (1 - unitA / unitB) * 100 
    : betterOption === 'B' 
      ? (1 - unitB / unitA) * 100 
      : 0;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="pt-24 px-4 max-w-2xl mx-auto pb-32"
    >
      <header className="mb-6">
        <h2 className="text-3xl font-black text-slate-900 mb-1 flex items-center gap-2">
          <Zap className={themeColor.text} /> Vale a Pena?
        </h2>
        <p className="text-slate-500 text-sm">Compare o preço por unidade e descubra qual embalagem é mais vantajosa.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {/* Opção A */}
        <div className={`p-5 rounded-3xl border-2 transition-all ${betterOption === 'A' ? `${themeColor.light} ${themeColor.border.replace('border-', 'border-')} shadow-md` : 'bg-white border-slate-100'}`}>
          <div className="flex items-center justify-between mb-4">
            <span className={`text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-wider ${betterOption === 'A' ? `${themeColor.bg} text-white` : 'bg-slate-100 text-slate-500'}`}>Opção A</span>
            {betterOption === 'A' && <div className={`${themeColor.bg} text-white p-1 rounded-full`}><Check size={12} strokeWidth={4} /></div>}
          </div>
          <div className="space-y-4">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Preço ({currency.symbol})</label>
              <input 
                type="text" 
                inputMode="decimal"
                value={optAPrice}
                onChange={(e) => setOptAPrice(e.target.value)}
                className={`w-full h-12 px-4 bg-slate-50 border-none rounded-2xl text-lg font-bold focus:ring-2 ${themeColor.ring}`}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Peso/Vol (g/ml)</label>
              <input 
                type="text" 
                inputMode="decimal"
                value={optAWeight}
                onChange={(e) => setOptAWeight(e.target.value)}
                className={`w-full h-12 px-4 bg-slate-50 border-none rounded-2xl text-lg font-bold focus:ring-2 ${themeColor.ring}`}
              />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Preço por 100g/ml</p>
            <p className="text-xl font-black text-slate-800">{currency.symbol} {safeFormatMoney(unitA * 100)}</p>
          </div>
        </div>

        {/* Opção B */}
        <div className={`p-5 rounded-3xl border-2 transition-all ${betterOption === 'B' ? `${themeColor.light} ${themeColor.border.replace('border-', 'border-')} shadow-md` : 'bg-white border-slate-100'}`}>
          <div className="flex items-center justify-between mb-4">
            <span className={`text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-wider ${betterOption === 'B' ? `${themeColor.bg} text-white` : 'bg-slate-100 text-slate-500'}`}>Opção B</span>
            {betterOption === 'B' && <div className={`${themeColor.bg} text-white p-1 rounded-full`}><Check size={12} strokeWidth={4} /></div>}
          </div>
          <div className="space-y-4">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Preço ({currency.symbol})</label>
              <input 
                type="text" 
                inputMode="decimal"
                value={optBPrice}
                onChange={(e) => setOptBPrice(e.target.value)}
                className={`w-full h-12 px-4 bg-slate-50 border-none rounded-2xl text-lg font-bold focus:ring-2 ${themeColor.ring}`}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Peso/Vol (g/ml)</label>
              <input 
                type="text" 
                inputMode="decimal"
                value={optBWeight}
                onChange={(e) => setOptBWeight(e.target.value)}
                className={`w-full h-12 px-4 bg-slate-50 border-none rounded-2xl text-lg font-bold focus:ring-2 ${themeColor.ring}`}
              />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Preço por 100g/ml</p>
            <p className="text-xl font-black text-slate-800">{currency.symbol} {safeFormatMoney(unitB * 100)}</p>
          </div>
        </div>
      </div>

      {betterOption && savings > 0 && (
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`${themeColor.bg.replace('600', '700')} text-white p-6 rounded-3xl text-center shadow-xl shadow-slate-100`}
        >
          <div className="bg-white/20 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
            <Award size={28} />
          </div>
          <h3 className="text-xl font-black mb-1">A OPÇÃO {betterOption} É MELHOR!</h3>
          <p className={`${themeColor.light.replace('bg-', 'text-').replace('50', '100')} text-sm`}>Você economiza <span className="font-bold underline">{safeNumber(savings).toFixed(1)}%</span> comparado à outra opção.</p>
        </motion.div>
      )}

      <div className="mt-8 bg-slate-100 p-6 rounded-3xl">
        <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
          <Lightbulb size={18} className="text-orange-500" /> Dica de Especialista
        </h4>
        <p className="text-sm text-slate-500 leading-relaxed">
          Nem sempre o pacote maior é mais barato. Use este calculador para garantir que o &quot;Leve 3, Pague 2&quot; ou embalagens família realmente valem a pena.
        </p>
      </div>
    </motion.div>
  );
};

// --- Views ---

const HistoryView = ({ lists, onDuplicateOpen, onDeleteList, onShare, currency, themeColor }: { lists: GroceryList[], onDuplicateOpen: (list: GroceryList) => void, onDeleteList: (id: string) => void, onShare: (list: GroceryList) => void, currency: Currency, themeColor: ThemeColor }) => {
  const [historySearch, setHistorySearch] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState<GroceryList | null>(null);

  const completedLists = lists.filter(l => l && l.status === 'Concluído');

  const filteredHistory = completedLists.filter(p => 
    p && (p.name || '').toLowerCase().includes((historySearch || '').toLowerCase())
  );

  const calculateReceiptTotals = (list: GroceryList) => {
    let subtotal = 0;
    let totalDiscount = 0;

    (list.items || []).filter(Boolean).forEach(item => {
      const amount = parseItemAmount(item);
      const normalPrice = safeNumber(item.price) * amount;
      
      const wholesalePriceNum = item.wholesalePrice !== undefined && item.wholesalePrice !== null ? safeNumber(item.wholesalePrice) : undefined;
      const minWholesaleQtyNum = item.minWholesaleQty !== undefined && item.minWholesaleQty !== null ? safeNumber(item.minWholesaleQty) : undefined;

      const actualPricePerUnit = (minWholesaleQtyNum && amount >= minWholesaleQtyNum && wholesalePriceNum) 
        ? wholesalePriceNum 
        : safeNumber(item.price);
      
      const finalPrice = actualPricePerUnit * amount;
      
      subtotal += normalPrice;
      totalDiscount += Math.max(0, normalPrice - finalPrice);
    });

    return { subtotal, totalDiscount, total: Math.max(0, subtotal - totalDiscount) };
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="pt-24 px-4 max-w-2xl mx-auto pb-32"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Histórico de Compras</h2>
        <span className={`badge ${themeColor.light} ${themeColor.text.replace('600', '700')} font-bold`}>Resumo Real</span>
      </div>
  
      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input 
          type="text" 
          value={historySearch}
          onChange={(e) => setHistorySearch(e.target.value)}
          placeholder="Buscar no histórico..." 
          className={`w-full h-12 pl-12 pr-4 bg-white border-none rounded-full shadow-inner text-sm focus:ring-2 ${themeColor.ring} transition-all font-medium`}
        />
      </div>
  
      <div className="space-y-4">
        {filteredHistory.length > 0 ? (
          filteredHistory.map((p, idx) => (
            <div key={idx} className={`relative pl-6 border-l-2 ${themeColor.text.replace('text-', 'border-').replace('600', '200')}/50`}>
              <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-300 ring-4 ring-slate-50"></div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">{p.completedAt || 'Data não registrada'}</p>
              
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col gap-5">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{p.name}</h3>
                    <p className="text-slate-500 text-sm">{(p.items?.length || 0)} itens</p>
                  </div>
                  <span className={`text-xl font-extrabold ${themeColor.text.replace('600', '700')}`}>{currency.symbol} {safeFormatMoney(p.totalAmount)}</span>
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setSelectedReceipt(p)}
                    className={`flex-1 h-11 ${themeColor.bg.replace('600', '700')} text-white font-bold rounded-xl flex items-center justify-center gap-2 ${themeColor.hover} transition-colors text-xs`}
                  >
                    <Eye size={18} /> VER DETALHES
                  </button>
                  <button 
                    onClick={() => onDuplicateOpen(p)}
                    className="flex-1 h-11 bg-slate-100 text-slate-600 font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-slate-200 transition-colors text-xs"
                  >
                    <Copy size={18} /> DUPLICAR
                  </button>
                  <button 
                    onClick={() => onDeleteList(p.id)}
                    className="w-11 h-11 bg-red-50 text-red-500 rounded-xl flex items-center justify-center hover:bg-red-100 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-20 opacity-40">
            <p className="font-bold">Nenhuma compra encontrada no histórico.</p>
          </div>
        )}
      </div>

      {/* Detailed Receipt Modal */}
      <Modal 
        isOpen={!!selectedReceipt} 
        onClose={() => setSelectedReceipt(null)} 
        title="Nota Fiscal Detalhada"
      >
        {selectedReceipt && (
          <div className="flex flex-col gap-6 font-mono text-sm overflow-y-auto max-h-[70vh] pr-2">
            <div className="text-center border-b border-dashed border-slate-200 pb-4">
              <h4 className="font-black text-lg uppercase tracking-widest">{selectedReceipt.name}</h4>
              <p className="text-[10px] text-slate-400 mt-1 uppercase italic">Emissão: {selectedReceipt.completedAt}</p>
            </div>

            <div className="space-y-4">
              {(selectedReceipt.items || []).filter(Boolean).map((item, i) => {
                const amount = parseItemAmount(item);
                const isWholesale = item.minWholesaleQty && amount >= item.minWholesaleQty;
                const price = isWholesale ? (safeNumber(item.wholesalePrice) || safeNumber(item.price)) : safeNumber(item.price);
                const total = price * amount;

                return (
                  <div key={i} className="flex flex-col gap-1 border-b border-slate-50 pb-2">
                    <div className="flex justify-between font-bold text-slate-800">
                      <span>{(item.name || 'Produto').toUpperCase()}</span>
                      <span>{currency.symbol} {safeFormatMoney(total)}</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>{item.weight ? `${item.weight}kg` : `${item.quantity}un`} x {currency.symbol} {safeFormatMoney(item.price)}</span>
                      {isWholesale && <span className={`${themeColor.text} font-bold uppercase`}>Desc. Atacado Aplicado</span>}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 pt-4 border-t-2 border-dashed border-slate-200 space-y-2">
              {(() => {
                const totals = calculateReceiptTotals(selectedReceipt);
                return (
                  <>
                    <div className="flex justify-between text-slate-500">
                      <span>SUBTOTAL</span>
                      <span>{currency.symbol} {safeFormatMoney(totals.subtotal)}</span>
                    </div>
                    {totals.totalDiscount > 0 && (
                      <div className={`flex justify-between ${themeColor.text} font-bold italic`}>
                        <span>ECONOMIA OBTIDA</span>
                        <span>- {currency.symbol} {safeFormatMoney(totals.totalDiscount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-xl font-black text-slate-900 pt-2 border-t border-slate-100">
                      <span>TOTAL</span>
                      <span>{currency.symbol} {safeFormatMoney(totals.total)}</span>
                    </div>
                  </>
                );
              })()}
            </div>

            <div className="text-center mt-6 pt-4 border-t border-dashed border-slate-200">
              <p className="text-[9px] text-slate-400 uppercase tracking-widest">Obrigado por comprar conosco!</p>
              <div className="flex justify-center gap-1 mt-2 opacity-10">
                {[...Array(15)].map((_, i) => <div key={i} className="w-1 h-8 bg-black rounded-sm" />)}
              </div>
            </div>
            
            <div className="flex gap-2 mt-4">
              <button 
                onClick={() => {
                  onShare(selectedReceipt);
                  setSelectedReceipt(null);
                }}
                className={`flex-1 h-12 ${themeColor.bg.replace('600', '700')} text-white rounded-xl font-bold font-sans flex items-center justify-center gap-2`}
              >
                <Share2 size={18} /> COMPARTILHAR
              </button>
              <button 
                onClick={() => setSelectedReceipt(null)}
                className="flex-1 h-12 bg-slate-900 text-white rounded-xl font-bold font-sans"
              >
                FECHAR
              </button>
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  );
};

const SettingsView = ({ 
  currency, 
  onCurrencyChange, 
  themeColor, 
  onThemeChange, 
  suggestions, 
  onSuggestionsChange,
  onResetData
}: { 
  currency: Currency, 
  onCurrencyChange: (c: Currency) => void, 
  themeColor: ThemeColor,
  onThemeChange: (t: ThemeColor) => void,
  suggestions: string,
  onSuggestionsChange: (s: string) => void,
  onResetData: () => void
}) => {
  const [isCurrencyModalOpen, setIsCurrencyModalOpen] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="pt-24 px-4 max-w-2xl mx-auto pb-32"
    >
      <header className="mb-8">
        <h2 className="text-3xl font-black text-slate-900 mb-1">Configurações</h2>
        <p className="text-slate-500 text-sm">Personalize sua experiência no Mercado Fresh.</p>
      </header>

      <div className="space-y-4">
        {/* Storage Card - 100% Free & Local without Email */}
        <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 font-medium p-6">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 ${themeColor.light} rounded-2xl flex items-center justify-center text-xl font-black ${themeColor.text}`}>
              <ShoppingBasket size={28} />
            </div>
            <div className="flex-1">
              <p className="font-bold text-slate-900 text-lg leading-tight">Acesso Direto & Gratuito</p>
              <p className="text-xs text-slate-400 mt-0.5">Sem necessidade de e-mail ou cadastro</p>
              <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 text-green-700 text-[10px] font-bold uppercase tracking-wider">
                <Check size={12} />
                Armazenamento 100% Privado no aparelho
              </div>
            </div>
          </div>
        </div>

        {/* Moeda Selection */}
        <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 font-medium">
          <div 
            onClick={() => setIsCurrencyModalOpen(true)}
            className="flex items-center justify-between p-6 hover:bg-slate-50 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 ${themeColor.light} rounded-2xl flex items-center justify-center ${themeColor.text}`}>
                <Scale size={24} />
              </div>
              <div>
                <p className="font-bold text-slate-900">Moeda Principal</p>
                <p className="text-xs text-slate-400">{currency.name} ({currency.code})</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-lg font-black ${themeColor.text}`}>{currency.symbol}</span>
              <ChevronRight size={20} className="text-slate-300" />
            </div>
          </div>
        </div>

        {/* Theme Selection */}
        <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 font-medium">
          <div 
            onClick={() => setIsThemeModalOpen(true)}
            className="flex items-center justify-between p-6 hover:bg-slate-50 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 ${themeColor.light} rounded-2xl flex items-center justify-center ${themeColor.text}`}>
                <Palette size={24} />
              </div>
              <div>
                <p className="font-bold text-slate-900">Cor do Aplicativo</p>
                <p className="text-xs text-slate-400">Tema {themeColor.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className={`w-6 h-6 rounded-full ${themeColor.bg} border-2 border-white shadow-sm`} />
              <ChevronRight size={20} className="text-slate-300" />
            </div>
          </div>
        </div>

        {/* Offline & Home Screen Info Card */}
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl p-6 text-white shadow-lg shadow-green-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Zap size={20} fill="white" className="text-white" />
            </div>
            <div>
              <p className="font-bold text-base leading-tight">Funciona 100% Offline</p>
              <p className="text-[11px] text-green-100">Ideal para usar dentro do supermercado</p>
            </div>
          </div>
          <p className="text-xs text-green-50 leading-relaxed mb-4">
            Todas as suas listas, itens, quantidades e cálculos ficam salvos diretamente na memória deste aparelho. Você não precisa de internet para marcar itens ou somar suas compras.
          </p>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 border border-white/20">
            <p className="text-[11px] font-bold text-white mb-1">📱 Dica: Instale na tela do seu celular</p>
            <p className="text-[10px] text-green-100 leading-relaxed">
              No navegador do celular (Chrome ou Safari), toque no menu de 3 pontinhos ou no botão de compartilhar e selecione <strong>&quot;Adicionar à tela de início&quot;</strong> ou <strong>&quot;Instalar aplicativo&quot;</strong>. Ele funcionará como um app de verdade!
            </p>
          </div>
        </div>

        {/* Suggestions Section */}
        <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 font-medium p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className={`w-12 h-12 ${themeColor.light} rounded-2xl flex items-center justify-center ${themeColor.text}`}>
              <MessageSquarePlus size={24} />
            </div>
            <div>
              <p className="font-bold text-slate-900">Sugestões de Melhorias</p>
              <p className="text-xs text-slate-400">O que você gostaria de ver no App?</p>
            </div>
          </div>
          <textarea 
            value={suggestions}
            onChange={(e) => onSuggestionsChange(e.target.value)}
            placeholder="Anotar melhorias que gostaria aqui..."
            className={`w-full h-32 p-4 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 ${themeColor.ring} transition-all resize-none font-medium placeholder:text-slate-300`}
          />
        </div>

        <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 font-medium overflow-hidden">
          <div className="p-6 border-b border-slate-50">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Gerenciar Dados</h3>
            <button 
              onClick={onResetData}
              className="w-full flex items-center justify-between p-4 rounded-2xl bg-amber-50 text-amber-700 font-bold hover:bg-amber-100 transition-colors active:scale-95 shadow-sm shadow-amber-100/50"
            >
              <div className="flex items-center gap-3">
                <RotateCcw size={20} />
                <span>Restaurar Listas Padrão</span>
              </div>
              <ChevronRight size={18} className="opacity-50" />
            </button>
            <p className="mt-4 text-[10px] text-slate-400 leading-relaxed px-2">
              Suas listas e itens ficam salvos com segurança na memória deste dispositivo, funcionando 100% offline e sem necessidade de e-mail ou conta externa.
            </p>
          </div>
          
          <div className="p-6 bg-slate-50/50">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm mb-2">
                <ShoppingBasket className={themeColor.text} size={20} />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Mercado Fresh v2.4.0</p>
              <p className="text-[10px] text-slate-400 mt-1 italic">Desenvolvido para sua economia mensal</p>
            </div>
          </div>
        </div>
      </div>

      {/* Moeda Modal */}
      <Modal 
        isOpen={isCurrencyModalOpen} 
        onClose={() => setIsCurrencyModalOpen(false)} 
        title="Selecionar Moeda"
      >
        <div className="grid grid-cols-1 gap-2">
          {CURRENCIES.map((c) => (
            <div 
              key={c.code}
              onClick={() => {
                onCurrencyChange(c);
                setIsCurrencyModalOpen(false);
              }}
              className={`flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all ${currency.code === c.code ? `${themeColor.light} border-2 ${themeColor.border} shadow-md` : 'bg-slate-50 hover:bg-slate-100 border-2 border-transparent'}`}
            >
              <div className="flex flex-col">
                <span className="font-bold text-slate-900">{c.name}</span>
                <span className="text-xs text-slate-400">{c.code}</span>
              </div>
              <span className={`text-xl font-black ${themeColor.text}`}>{c.symbol}</span>
            </div>
          ))}
        </div>
      </Modal>

      {/* Theme Modal */}
      <Modal 
        isOpen={isThemeModalOpen} 
        onClose={() => setIsThemeModalOpen(false)} 
        title="Cor do Aplicativo"
      >
        <div className="grid grid-cols-1 gap-2">
          {THEME_COLORS.map((t) => (
            <div 
              key={t.id}
              onClick={() => {
                onThemeChange(t);
                setIsThemeModalOpen(false);
              }}
              className={`flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all ${themeColor.id === t.id ? `${t.light} border-2 ${t.border} shadow-md` : 'bg-slate-50 hover:bg-slate-100 border-2 border-transparent'}`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-8 h-8 rounded-full ${t.bg} border-2 border-white shadow-sm`} />
                <span className="font-bold text-slate-900">{t.name}</span>
              </div>
              {themeColor.id === t.id && <Check className={t.text} size={20} strokeWidth={3} />}
            </div>
          ))}
        </div>
      </Modal>
    </motion.div>
  );
};

const DEFAULT_GUEST_LISTS: GroceryList[] = [
  {
    id: 'guest-lista-1',
    name: 'Minhas Compras do Mês',
    status: 'Em andamento',
    icon: 'ShoppingCart',
    color: 'bg-green-100 text-green-600',
    budgetLimit: 350,
    items: [
      { id: 'item-1', name: 'Leite Integral 1L', category: 'Laticínios', price: 5.49, quantity: 4, checked: true },
      { id: 'item-2', name: 'Arroz Branco Tipo 1 5kg', category: 'Despensa', price: 29.90, quantity: 1, checked: false, importanceLevel: 3 },
      { id: 'item-3', name: 'Feijão Carioca 1kg', category: 'Despensa', price: 8.99, quantity: 2, checked: false },
      { id: 'item-4', name: 'Maçã Gala (kg)', category: 'Hortifruti', price: 9.90, quantity: 1, weight: '1.5', checked: false, offer: true },
      { id: 'item-5', name: 'Café Torrado e Moído 500g', category: 'Despensa', price: 18.50, quantity: 2, checked: false, wholesalePrice: 16.90, minWholesaleQty: 2 },
    ]
  }
];

const sanitizeGroceryLists = (rawLists: unknown): GroceryList[] => {
  if (!Array.isArray(rawLists)) return DEFAULT_GUEST_LISTS;
  const valid = rawLists.filter(Boolean).map((rawItem: unknown, lIdx: number) => {
    const raw = (rawItem && typeof rawItem === 'object' ? rawItem : {}) as Record<string, unknown>;
    const rawItems = Array.isArray(raw.items) ? raw.items : [];
    const items: ListItem[] = rawItems.filter(Boolean).map((itemObj: unknown, iIdx: number) => {
      const i = (itemObj && typeof itemObj === 'object' ? itemObj : {}) as Record<string, unknown>;
      return {
        id: String(i.id || `item-${Date.now()}-${lIdx}-${iIdx}`),
        name: String(i.name || 'Produto sem nome'),
        category: String(i.category || 'Geral'),
        price: safeNumber(i.price, 0),
        quantity: typeof i.quantity === 'number' ? Math.max(1, i.quantity) : 1,
        checked: Boolean(i.checked),
        weight: i.weight ? String(i.weight) : undefined,
        unit: i.unit ? String(i.unit) : (i.weight ? 'kg' : 'un'),
        notes: i.notes ? String(i.notes) : undefined,
        offer: Boolean(i.offer),
        bulkDiscount: i.bulkDiscount ? String(i.bulkDiscount) : undefined,
        wholesalePrice: i.wholesalePrice !== undefined && i.wholesalePrice !== null ? safeNumber(i.wholesalePrice) : undefined,
        minWholesaleQty: i.minWholesaleQty !== undefined && i.minWholesaleQty !== null ? safeNumber(i.minWholesaleQty) : undefined,
        importanceLevel: typeof i.importanceLevel === 'number' ? i.importanceLevel : 0
      };
    });

    return {
      id: String(raw.id || `list-${Date.now()}-${lIdx}`),
      name: String(raw.name || 'Minha Lista'),
      status: raw.status === 'Concluído' ? 'Concluído' : 'Em andamento',
      icon: String(raw.icon || 'ShoppingCart'),
      color: String(raw.color || 'bg-green-100 text-green-600'),
      items,
      budgetLimit: safeNumber(raw.budgetLimit, 100),
      completedAt: raw.completedAt ? String(raw.completedAt) : undefined,
      totalAmount: raw.totalAmount !== undefined && raw.totalAmount !== null ? safeNumber(raw.totalAmount) : undefined
    } as GroceryList;
  });

  return valid.length > 0 ? valid : DEFAULT_GUEST_LISTS;
};

function MercadoFreshAppContent() {
  const [hasMounted, setHasMounted] = useState(false);
  const [sharedListIncoming, setSharedListIncoming] = useState<GroceryList | null>(null);
  const [view, setView] = useState<View>('lists');
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      setIsOffline(!window.navigator.onLine);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      }
    };
  }, []);

  const [lists, setLists] = useState<GroceryList[]>([]);
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [currency, setCurrency] = useState<Currency>(CURRENCIES[0]);
  const [themeColor, setThemeColor] = useState<ThemeColor>(THEME_COLORS[0]);
  const [suggestions, setSuggestions] = useState('');

  // Modal States
  const [isAddListModalOpen, setIsAddListModalOpen] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListBudget, setNewListBudget] = useState('100');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [listToDelete, setListToDelete] = useState<string | null>(null);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [duplicatingList, setDuplicatingList] = useState<GroceryList | null>(null);
  const [duplicateListName, setDuplicateListName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Export / Import States
  const [exportModalList, setExportModalList] = useState<GroceryList | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [targetListForImport, setTargetListForImport] = useState<GroceryList | null>(null);

  const handleImport = (
    importedData: { listName: string; items: ListItem[]; budgetLimit?: number },
    mode: 'new_list' | 'add_to_current'
  ) => {
    if (mode === 'add_to_current' && targetListForImport) {
      const existingIds = new Set(targetListForImport.items.map(i => i.id));
      const newItems = importedData.items.map(item => ({
        ...item,
        id: existingIds.has(item.id) ? 'item-' + Math.random().toString(36).substr(2, 9) : item.id
      }));
      const updatedList: GroceryList = {
        ...targetListForImport,
        items: [...targetListForImport.items, ...newItems]
      };
      handleUpdateList(updatedList);
      setSelectedListId(updatedList.id);
    } else {
      const newList: GroceryList = {
        id: 'list-' + Date.now(),
        name: importedData.listName || 'Lista Importada',
        status: 'Em andamento',
        icon: 'ShoppingBasket',
        color: 'bg-emerald-100 text-emerald-700',
        items: importedData.items,
        budgetLimit: importedData.budgetLimit || 150
      };
      setLists(prev => {
        const updated = [newList, ...prev];
        try { localStorage.setItem('mercado_fresh_guest_lists', JSON.stringify(updated)); } catch {}
        return updated;
      });
      setSelectedListId(newList.id);
      setView('lists');
    }
    setIsImportModalOpen(false);
    setTargetListForImport(null);
  };

  // Check for shared list in URL parameter (?share=...)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const params = new URLSearchParams(window.location.search);
      const shareData = params.get('share');
      if (shareData) {
        let decoded = '';
        try {
          const binary = atob(shareData);
          const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
          decoded = new TextDecoder().decode(bytes);
        } catch {
          decoded = decodeURIComponent(escape(atob(shareData)));
        }
        const parsed = JSON.parse(decoded) as GroceryList;
        if (parsed && parsed.name) {
          setSharedListIncoming(parsed);
        }
      }
    } catch (e) {
      console.warn('Invalid share link', e);
    }
  }, []);

  // Load saved data directly on mount
  useEffect(() => {
    setHasMounted(true);
    if (typeof window !== 'undefined') {
      try {
        const storedLists = localStorage.getItem('mercado_fresh_guest_lists');
        if (storedLists) {
          try {
            const parsed = JSON.parse(storedLists);
            const sanitized = sanitizeGroceryLists(parsed);
            setLists(sanitized);
          } catch {
            setLists(DEFAULT_GUEST_LISTS);
            localStorage.setItem('mercado_fresh_guest_lists', JSON.stringify(DEFAULT_GUEST_LISTS));
          }
        } else {
          setLists(DEFAULT_GUEST_LISTS);
          localStorage.setItem('mercado_fresh_guest_lists', JSON.stringify(DEFAULT_GUEST_LISTS));
        }

        const storedSettings = localStorage.getItem('mercado_fresh_guest_settings');
        if (storedSettings) {
          try {
            const parsedSettings = JSON.parse(storedSettings);
            if (parsedSettings && parsedSettings.currency && parsedSettings.currency.symbol) {
              setCurrency(parsedSettings.currency);
            }
            if (parsedSettings && parsedSettings.themeId) {
              const foundTheme = THEME_COLORS.find(t => t.id === parsedSettings.themeId);
              if (foundTheme) setThemeColor(foundTheme);
            }
            if (parsedSettings && typeof parsedSettings.suggestions === 'string') {
              setSuggestions(parsedSettings.suggestions);
            }
          } catch (e) {
            console.warn('Failed to parse stored settings:', e);
          }
        }
      } catch (err) {
        console.error('Error loading data from localStorage', err);
        setLists(DEFAULT_GUEST_LISTS);
      }
    }
  }, []);

  const handleCurrencyChange = (c: Currency) => {
    setCurrency(c);
    try {
      const current = JSON.parse(localStorage.getItem('mercado_fresh_guest_settings') || '{}');
      localStorage.setItem('mercado_fresh_guest_settings', JSON.stringify({ ...current, currency: c }));
    } catch {}
  };

  const handleThemeChange = (t: ThemeColor) => {
    setThemeColor(t);
    try {
      const current = JSON.parse(localStorage.getItem('mercado_fresh_guest_settings') || '{}');
      localStorage.setItem('mercado_fresh_guest_settings', JSON.stringify({ ...current, themeId: t.id }));
    } catch {}
  };

  const handleSuggestionsChange = (s: string) => {
    setSuggestions(s);
    try {
      const current = JSON.parse(localStorage.getItem('mercado_fresh_guest_settings') || '{}');
      localStorage.setItem('mercado_fresh_guest_settings', JSON.stringify({ ...current, suggestions: s }));
    } catch {}
  };

  const handleResetData = () => {
    setIsResetModalOpen(true);
  };

  const handleConfirmResetData = () => {
    setLists(DEFAULT_GUEST_LISTS);
    try {
      localStorage.setItem('mercado_fresh_guest_lists', JSON.stringify(DEFAULT_GUEST_LISTS));
    } catch {}
    setSelectedListId(null);
    setView('lists');
    setIsResetModalOpen(false);
  };

  useEffect(() => {
    if (selectedListId && !lists.some(l => l.id === selectedListId)) {
      setSelectedListId(null);
    }
  }, [selectedListId, lists]);

  const handleImportSharedList = () => {
    if (!sharedListIncoming) return;
    const imported: GroceryList = {
      ...sharedListIncoming,
      id: 'list-' + Date.now(),
      name: `${sharedListIncoming.name} (Compartilhada)`,
      status: 'Em andamento',
      items: (sharedListIncoming.items || []).map(item => ({ ...item, checked: false }))
    };

    setLists(prev => {
      const updated = [imported, ...prev];
      try { localStorage.setItem('mercado_fresh_guest_lists', JSON.stringify(updated)); } catch {}
      return updated;
    });

    setSharedListIncoming(null);
    setSelectedListId(imported.id);
  };

  const selectedList = lists.find(l => l.id === selectedListId);

  const handleUpdateList = (list: GroceryList) => {
    setLists(prev => {
      const updated = prev.map(l => l.id === list.id ? list : l);
      try { localStorage.setItem('mercado_fresh_guest_lists', JSON.stringify(updated)); } catch {}
      return updated;
    });
  };

  const handleAddPantryItemToList = (
    listId: string, 
    item: { name: string; category: string; quantity: number; unit?: string; notes?: string }
  ) => {
    setLists(prev => {
      let target = prev.find(l => l.id === listId);
      let updatedLists = [...prev];

      if (!target) {
        if (prev.length > 0) {
          target = prev[0];
        } else {
          target = {
            id: 'list-' + Date.now(),
            name: 'Minhas Compras',
            status: 'Em andamento',
            icon: 'ShoppingBasket',
            color: 'bg-emerald-100 text-emerald-700',
            items: [],
            budgetLimit: 200
          };
          updatedLists = [target];
        }
      }

      const newItem: ListItem = {
        id: 'item-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6),
        name: item.name,
        category: item.category || 'Despensa',
        price: 0,
        quantity: item.quantity || 1,
        checked: false,
        unit: item.unit,
        notes: item.notes
      };

      const updatedTarget: GroceryList = {
        ...target,
        items: [newItem, ...target.items]
      };

      const finalLists = updatedLists.map(l => l.id === updatedTarget.id ? updatedTarget : l);
      try { localStorage.setItem('mercado_fresh_guest_lists', JSON.stringify(finalLists)); } catch {}
      return finalLists;
    });
  };

  const handleFinishList = (list: GroceryList, total: number) => {
    const now = new Date();
    const completedAt = `${now.getDate()} de ${now.toLocaleDateString('pt-BR', { month: 'short' })}`;
    const updatedList: GroceryList = {
      ...list,
      status: 'Concluído',
      completedAt,
      totalAmount: total
    };
    setLists(prev => {
      const updated = prev.map(l => l.id === list.id ? updatedList : l);
      try { localStorage.setItem('mercado_fresh_guest_lists', JSON.stringify(updated)); } catch {}
      return updated;
    });
    setView('history');
    setSelectedListId(null);
  };

  const confirmAddList = () => {
    if (!newListName.trim() || isSubmitting) return;
    setIsSubmitting(true);
    const budget = parseFloat(newListBudget.replace(',', '.')) || 100;
    
    const newList: GroceryList = {
      id: 'list-' + Date.now(),
      name: newListName,
      status: 'Em andamento',
      icon: 'ShoppingBasket',
      color: 'bg-green-100 text-green-600',
      items: [],
      budgetLimit: budget,
    };
    setLists(prev => {
      const updated = [newList, ...prev];
      try { localStorage.setItem('mercado_fresh_guest_lists', JSON.stringify(updated)); } catch {}
      return updated;
    });
    setNewListName('');
    setNewListBudget('100');
    setIsAddListModalOpen(false);
    setIsSubmitting(false);
  };

  const confirmDeleteList = () => {
    if (!listToDelete || isSubmitting) return;
    setIsSubmitting(true);

    setLists(prev => {
      const updated = prev.filter(l => l.id !== listToDelete);
      try { localStorage.setItem('mercado_fresh_guest_lists', JSON.stringify(updated)); } catch {}
      return updated;
    });
    setIsDeleteModalOpen(false);
    setListToDelete(null);
    setIsSubmitting(false);
  };

  const handleDuplicateList = (list: GroceryList, newName: string) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    const rest = { ...list };
    delete (rest as { id?: string }).id;
    const newList: GroceryList = {
      ...rest,
      id: 'list-' + Date.now(),
      name: newName,
      status: 'Em andamento',
      completedAt: undefined,
      totalAmount: undefined,
      items: list.items.map(i => ({ ...i, checked: false, id: Math.random().toString(36).substr(2, 9) }))
    };
    setLists(prev => {
      const updated = [newList, ...prev];
      try { localStorage.setItem('mercado_fresh_guest_lists', JSON.stringify(updated)); } catch {}
      return updated;
    });
    setDuplicatingList(null);
    setView('lists');
    setIsSubmitting(false);
  };

  const renderContent = () => {
    if (selectedListId && selectedList) {
      return (
        <DetailView 
          list={selectedList} 
          onBack={() => setSelectedListId(null)} 
          onUpdateList={handleUpdateList}
          onFinishList={handleFinishList}
          onOpenExportModal={(list) => setExportModalList(list)}
          onOpenImportModal={(list) => {
            setTargetListForImport(list || null);
            setIsImportModalOpen(true);
          }}
          currency={currency}
          themeColor={themeColor}
        />
      );
    }
    
    switch (view) {
      case 'lists': return (
        <ListsView 
          lists={lists} 
          onSelect={setSelectedListId} 
          onAddList={() => setIsAddListModalOpen(true)}
          onDeleteList={(id) => { setListToDelete(id); setIsDeleteModalOpen(true); }}
          onShare={(list) => setExportModalList(list)}
          onOpenImport={() => {
            setTargetListForImport(null);
            setIsImportModalOpen(true);
          }}
          themeColor={themeColor}
          onFinishList={handleFinishList}
          onDuplicateOpen={list => { setDuplicatingList(list); setDuplicateListName(`${list.name} (Cópia)`); }}
        />
      );
      case 'history': return (
        <HistoryView 
          lists={lists} 
          onDuplicateOpen={list => { setDuplicatingList(list); setDuplicateListName(`${list.name} (Cópia)`); }} 
          onShare={(list) => setExportModalList(list)} 
          onDeleteList={(id) => { setListToDelete(id); setIsDeleteModalOpen(true); }} 
          currency={currency}
          themeColor={themeColor}
        />
      );
      case 'offers': return <OffersView currency={currency} themeColor={themeColor} />;
      case 'games': return <GamesView themeColor={themeColor} />;
      case 'pantry': return (
        <PantryView 
          themeColor={themeColor}
          lists={lists}
          onAddToList={handleAddPantryItemToList}
          onNavigateToList={(listId) => {
            setSelectedListId(listId);
            setView('detail');
          }}
        />
      );
      case 'settings': return (
        <SettingsView 
          currency={currency}
          onCurrencyChange={handleCurrencyChange}
          themeColor={themeColor}
          onThemeChange={handleThemeChange}
          suggestions={suggestions}
          onSuggestionsChange={handleSuggestionsChange}
          onResetData={handleResetData}
        />
      );
      default: return null;
    }
  };

  if (!hasMounted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className={`w-12 h-12 animate-spin ${themeColor.text}`} />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-50">
        {(!selectedListId || !selectedList) && (
          <TopBar 
            themeColor={themeColor} 
            title={
              view === 'lists' ? "Mercado Fresh" :
              view === 'pantry' ? "Despensa Inteligente" :
              view === 'offers' ? "Ofertas & Descontos" :
              view === 'games' ? "Jogos & Economia" :
              view === 'history' ? "Histórico de Compras" :
              view === 'settings' ? "Ajustes & Preferências" : "Mercado Fresh"
            }
            icon={
              view === 'lists' ? <ShoppingBasket className={themeColor.text} size={28} /> :
              view === 'pantry' ? <Home className={themeColor.text} size={28} /> :
              view === 'offers' ? <Zap className={themeColor.text} size={28} /> :
              view === 'games' ? <Gamepad2 className={themeColor.text} size={28} /> :
              view === 'history' ? <History className={themeColor.text} size={28} /> :
              view === 'settings' ? <Settings className={themeColor.text} size={28} /> : <ShoppingBasket className={themeColor.text} size={28} />
            }
          />
        )}
        
        <AnimatePresence>
          {isOffline && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest text-center py-1.5 fixed top-16 left-0 w-full z-[45] flex items-center justify-center gap-2"
            >
              <Zap size={12} fill="white" /> Modo Offline • Seus dados continuam salvos com segurança no aparelho
            </motion.div>
          )}
        </AnimatePresence>
        
        <AnimatePresence mode="wait">
          <motion.div key={selectedListId || view}>
            {renderContent()}
          </motion.div>
        </AnimatePresence>

        {(!selectedListId || !selectedList) && <BottomNav activeView={view} setView={setView} themeColor={themeColor} />}

        {/* Duplicate List Modal */}
        <Modal 
          isOpen={!!duplicatingList} 
          onClose={() => setDuplicatingList(null)} 
          title="Duplicar Lista"
        >
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-2">Novo Nome da Lista</label>
              <input 
                type="text" 
                value={duplicateListName}
                onChange={(e) => setDuplicateListName(e.target.value)}
                className={`w-full h-12 px-4 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 ${themeColor.ring}`}
                autoFocus
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button 
                onClick={() => setDuplicatingList(null)}
                className="flex-1 h-12 bg-slate-100 text-slate-500 rounded-xl font-bold"
              >
                Cancelar
              </button>
              <button 
                onClick={() => duplicatingList && handleDuplicateList(duplicatingList, duplicateListName)}
                disabled={isSubmitting}
                className={`flex-1 h-12 ${themeColor.bg} text-white rounded-xl font-bold ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isSubmitting ? 'Duplicando...' : 'Duplicar'}
              </button>
            </div>
          </div>
        </Modal>

        {/* Add List Modal */}
        <Modal 
          isOpen={isAddListModalOpen} 
          onClose={() => setIsAddListModalOpen(false)} 
          title="Nova Lista"
        >
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-2">Nome da Lista</label>
              <input 
                type="text" 
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder="Ex: Compras da Semana"
                className={`w-full h-12 px-4 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 ${themeColor.ring}`}
                autoFocus
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-2">Limite de Gasto ({currency.symbol})</label>
              <input 
                type="text" 
                inputMode="decimal"
                value={newListBudget}
                onChange={(e) => setNewListBudget(e.target.value)}
                placeholder="100,00"
                className={`w-full h-12 px-4 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 ${themeColor.ring}`}
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button 
                onClick={() => setIsAddListModalOpen(false)}
                className="flex-1 h-12 bg-slate-100 text-slate-500 rounded-xl font-bold"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmAddList}
                disabled={isSubmitting}
                className={`flex-1 h-12 ${themeColor.bg} text-white rounded-xl font-bold ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isSubmitting ? 'Criando...' : 'Criar Lista'}
              </button>
            </div>
          </div>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal 
          isOpen={isDeleteModalOpen} 
          onClose={() => setIsDeleteModalOpen(false)} 
          title="Excluir Lista"
        >
          <p className="text-slate-500 mb-6 font-medium">Tem certeza que deseja excluir esta lista? Todos os itens serão perdidos permanentemente.</p>
          <div className="flex gap-2">
            <button 
              onClick={() => setIsDeleteModalOpen(false)}
              className="flex-1 h-12 bg-slate-100 text-slate-500 rounded-xl font-bold"
            >
              Não, voltar
            </button>
            <button 
              onClick={confirmDeleteList}
              disabled={isSubmitting}
              className={`flex-1 h-12 bg-red-500 text-white rounded-xl font-bold ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isSubmitting ? 'Excluindo...' : 'Sim, excluir'}
            </button>
          </div>
        </Modal>

        {/* Reset Confirmation Modal */}
        <Modal 
          isOpen={isResetModalOpen} 
          onClose={() => setIsResetModalOpen(false)} 
          title="Restaurar Listas Padrão"
        >
          <p className="text-slate-500 mb-6 font-medium">Tem certeza que deseja restaurar as listas de compras padrão? Todas as listas atuais serão substituídas pelas listas de exemplo.</p>
          <div className="flex gap-2">
            <button 
              onClick={() => setIsResetModalOpen(false)}
              className="flex-1 h-12 bg-slate-100 text-slate-500 rounded-xl font-bold"
            >
              Cancelar
            </button>
            <button 
              onClick={handleConfirmResetData}
              className="flex-1 h-12 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition"
            >
              Restaurar
            </button>
          </div>
        </Modal>

        {/* Shared List Incoming Modal */}
        <Modal 
          isOpen={!!sharedListIncoming} 
          onClose={() => setSharedListIncoming(null)} 
          title="Lista Compartilhada Recebida"
        >
          <div className="flex flex-col gap-4">
            <div className="p-4 rounded-2xl bg-green-50 border border-green-200">
              <h4 className="font-bold text-slate-800 text-base">{sharedListIncoming?.name}</h4>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                {sharedListIncoming?.items?.length || 0} itens incluídos nesta lista compartilhada.
              </p>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Você gostaria de importar esta lista para o seu aplicativo?
            </p>
            <div className="flex gap-2 pt-2">
              <button 
                onClick={() => setSharedListIncoming(null)}
                className="flex-1 h-12 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs sm:text-sm hover:bg-slate-200 transition-colors"
              >
                Ignorar
              </button>
              <button 
                onClick={handleImportSharedList}
                className={`flex-1 h-12 ${themeColor.bg} text-white rounded-xl font-bold text-xs sm:text-sm hover:opacity-90 transition-opacity`}
              >
                Importar Lista
              </button>
            </div>
          </div>
        </Modal>

        {/* Export / Share Modal */}
        <ShareExportModal 
          isOpen={!!exportModalList}
          onClose={() => setExportModalList(null)}
          list={exportModalList}
          currency={currency}
          themeColor={themeColor}
        />

        {/* Import Modal */}
        <ImportModal 
          isOpen={isImportModalOpen}
          onClose={() => {
            setIsImportModalOpen(false);
            setTargetListForImport(null);
          }}
          onImport={handleImport}
          currentList={targetListForImport}
          currency={currency}
          themeColor={themeColor}
        />

        {/* Printable Area for window.print() (PDF) */}
        <PrintableList 
          list={exportModalList} 
          currency={currency} 
        />
      </div>
    </ErrorBoundary>
  );
}

export default function MercadoFreshApp() {
  return (
    <ErrorBoundary>
      <MercadoFreshAppContent />
    </ErrorBoundary>
  );
}
