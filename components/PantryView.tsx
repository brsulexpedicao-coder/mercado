'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home, 
  Plus, 
  Minus, 
  Bell, 
  BellOff, 
  ShoppingCart, 
  Package, 
  Search, 
  Trash2, 
  Edit3, 
  Calendar, 
  Tag,
  Clock,
  Sparkles,
  Check,
  X
} from 'lucide-react';

export interface PantryItem {
  id: string;
  name: string;
  brand: string;
  quantity: number;
  unit: string;
  category: string;
  expiryDate?: string;
  minQuantity: number;
  restockBuyQuantity: number;
  reminderEnabled: boolean;
  alertDismissedForMinQty?: boolean;
  createdAt?: number;
  updatedAt?: number;
}

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

interface ListItem {
  id: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
  checked: boolean;
  unit?: string;
  notes?: string;
}

interface GroceryList {
  id: string;
  name: string;
  status: 'Em andamento' | 'Concluído';
  icon: string;
  color: string;
  items: ListItem[];
}

interface PantryViewProps {
  themeColor: ThemeColor;
  lists: GroceryList[];
  onAddToList: (listId: string, item: { name: string; category: string; quantity: number; unit?: string; notes?: string }) => void;
  onNavigateToList: (listId: string) => void;
}

const DEFAULT_PANTRY_ITEMS: PantryItem[] = [
  {
    id: 'pantry-1',
    name: 'Arroz',
    brand: 'Tio João',
    quantity: 5,
    unit: 'pacotes',
    category: 'Alimentos',
    minQuantity: 1,
    restockBuyQuantity: 4,
    reminderEnabled: true,
    alertDismissedForMinQty: false
  },
  {
    id: 'pantry-2',
    name: 'Leite Integral',
    brand: 'Piracanjuba',
    quantity: 6,
    unit: 'litros',
    category: 'Bebidas',
    minQuantity: 2,
    restockBuyQuantity: 6,
    reminderEnabled: false,
    alertDismissedForMinQty: false
  },
  {
    id: 'pantry-3',
    name: 'Papel Higiênico',
    brand: 'Neve',
    quantity: 12,
    unit: 'rolos',
    category: 'Higiene',
    minQuantity: 4,
    restockBuyQuantity: 12,
    reminderEnabled: true,
    alertDismissedForMinQty: false
  },
  {
    id: 'pantry-4',
    name: 'Shampoo',
    brand: 'Pantene',
    quantity: 2,
    unit: 'frascos',
    category: 'Higiene',
    minQuantity: 1,
    restockBuyQuantity: 2,
    reminderEnabled: false,
    alertDismissedForMinQty: false
  },
  {
    id: 'pantry-5',
    name: 'Café Torrado e Moído',
    brand: '3 Corações',
    quantity: 3,
    unit: 'pacotes',
    category: 'Alimentos',
    minQuantity: 1,
    restockBuyQuantity: 3,
    reminderEnabled: true,
    alertDismissedForMinQty: false
  }
];

const COMMON_UNITS = [
  'pacotes',
  'unidades',
  'kg',
  'litros',
  'latas',
  'caixas',
  'garrafas',
  'rolos',
  'frascos'
];

const CATEGORIES = [
  'Alimentos',
  'Bebidas',
  'Limpeza',
  'Higiene',
  'Hortifruti',
  'Padaria',
  'Carnes',
  'Laticínios',
  'Outros'
];

export const PantryView: React.FC<PantryViewProps> = ({
  themeColor,
  lists,
  onAddToList,
  onNavigateToList
}) => {
  const [items, setItems] = useState<PantryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [activeFilter, setActiveFilter] = useState<'all' | 'critical' | 'warning' | 'ok' | 'reminders'>('all');

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PantryItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<PantryItem | null>(null);

  // Active Replenishment Alert Modal state
  const [alertProduct, setAlertProduct] = useState<PantryItem | null>(null);
  const [selectedListIdForAlert, setSelectedListIdForAlert] = useState<string>('');
  const [alertBuyQuantity, setAlertBuyQuantity] = useState<number>(1);

  // Quick Notification Toast
  const [toastMessage, setToastMessage] = useState<{ text: string; listId?: string } | null>(null);

  // Browser Notification Status
  const [browserNotificationPerm, setBrowserNotificationPerm] = useState<NotificationPermission | 'unsupported'>('default');

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formBrand, setFormBrand] = useState('');
  const [formQuantity, setFormQuantity] = useState('1');
  const [formUnit, setFormUnit] = useState('pacotes');
  const [formCategory, setFormCategory] = useState('Alimentos');
  const [formExpiryDate, setFormExpiryDate] = useState('');
  const [formMinQuantity, setFormMinQuantity] = useState('1');
  const [formRestockBuyQuantity, setFormRestockBuyQuantity] = useState('2');
  const [formReminderEnabled, setFormReminderEnabled] = useState(false); // Default false per user rule

  // Load items from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem('mercado_fresh_pantry_items_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const sanitized = parsed.filter(Boolean).map((p: Partial<PantryItem>, idx: number) => ({
            id: p.id || `pantry-${Date.now()}-${idx}`,
            name: p.name || 'Produto',
            brand: p.brand || '',
            quantity: typeof p.quantity === 'number' ? p.quantity : 1,
            unit: p.unit || 'unidades',
            category: p.category || 'Alimentos',
            expiryDate: p.expiryDate || '',
            minQuantity: typeof p.minQuantity === 'number' ? p.minQuantity : 1,
            restockBuyQuantity: typeof p.restockBuyQuantity === 'number' ? p.restockBuyQuantity : 2,
            reminderEnabled: !!p.reminderEnabled,
            alertDismissedForMinQty: !!p.alertDismissedForMinQty
          }));
          setItems(sanitized);
        } else {
          setItems(DEFAULT_PANTRY_ITEMS);
        }
      } else {
        setItems(DEFAULT_PANTRY_ITEMS);
        localStorage.setItem('mercado_fresh_pantry_items_v2', JSON.stringify(DEFAULT_PANTRY_ITEMS));
      }
    } catch {
      setItems(DEFAULT_PANTRY_ITEMS);
    }

    try {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        setBrowserNotificationPerm(Notification.permission);
      } else {
        setBrowserNotificationPerm('unsupported');
      }
    } catch {
      setBrowserNotificationPerm('unsupported');
    }
  }, []);

  // Save items to localStorage whenever updated
  const saveItems = (updated: PantryItem[]) => {
    setItems(updated);
    try {
      localStorage.setItem('mercado_fresh_pantry_items_v2', JSON.stringify(updated));
    } catch {}
  };

  const requestBrowserNotification = async () => {
    try {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        const perm = await Notification.requestPermission();
        setBrowserNotificationPerm(perm);
        if (perm === 'granted') {
          showToast('Notificações no celular ativadas com sucesso!');
        }
      }
    } catch {
      setBrowserNotificationPerm('unsupported');
    }
  };

  const showToast = (text: string, listId?: string) => {
    setToastMessage({ text, listId });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Trigger replenishment alert
  const triggerReplenishmentAlert = (product: PantryItem, currentQty: number) => {
    // Only alert if reminder is explicitly enabled
    if (!product.reminderEnabled) return;

    // Check if we already alerted for this cycle
    if (product.alertDismissedForMinQty) return;

    // Set active alert product
    setAlertProduct(product);
    setAlertBuyQuantity(product.restockBuyQuantity || (product.minQuantity ? product.minQuantity * 2 : 1));
    if (lists.length > 0) {
      const activeList = lists.find(l => l.status === 'Em andamento') || lists[0];
      setSelectedListIdForAlert(activeList.id);
    }

    // Try sending native web notification if authorized
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification('🔔 Hora de repor!', {
          body: `Seu estoque de ${product.name} ${product.brand ? `(${product.brand})` : ''} chegou a ${currentQty} ${product.unit}. Adicione à sua lista de compras!`,
          icon: '/icon.svg'
        });
      } catch {}
    }
  };

  // Stock Decrement (Dar baixa no estoque)
  const handleDecrementStock = (item: PantryItem) => {
    if (item.quantity <= 0) return;
    const newQty = item.quantity - 1;

    const shouldAlert = newQty <= item.minQuantity && item.reminderEnabled && !item.alertDismissedForMinQty;

    const updated = items.map(p => {
      if (p.id === item.id) {
        return {
          ...p,
          quantity: newQty,
          updatedAt: Date.now()
        };
      }
      return p;
    });

    saveItems(updated);

    if (shouldAlert) {
      triggerReplenishmentAlert({ ...item, quantity: newQty }, newQty);
    }
  };

  // Stock Increment (Repor estoque)
  const handleIncrementStock = (item: PantryItem) => {
    const newQty = item.quantity + 1;
    // If increased above minQuantity, reset the alert cycle so future drops will alert again!
    const cycleReset = newQty > item.minQuantity;

    const updated = items.map(p => {
      if (p.id === item.id) {
        return {
          ...p,
          quantity: newQty,
          alertDismissedForMinQty: cycleReset ? false : p.alertDismissedForMinQty,
          updatedAt: Date.now()
        };
      }
      return p;
    });

    saveItems(updated);
  };

  // Toggle Reminder per Product immediately
  const handleToggleReminder = (item: PantryItem) => {
    const newStatus = !item.reminderEnabled;
    const updated = items.map(p => {
      if (p.id === item.id) {
        return {
          ...p,
          reminderEnabled: newStatus,
          // If enabled and already at or below min, allow triggering alert on next action or reset flag
          alertDismissedForMinQty: newStatus ? false : p.alertDismissedForMinQty,
          updatedAt: Date.now()
        };
      }
      return p;
    });

    saveItems(updated);
    showToast(newStatus ? `🔔 Lembrete ATIVADO para ${item.name}` : `⚪ Lembrete DESATIVADO para ${item.name}`);
  };

  // Confirm Adding from Replenishment Alert to Grocery List
  const handleConfirmAddToList = () => {
    if (!alertProduct) return;

    let targetListId = selectedListIdForAlert;
    if (!targetListId && lists.length > 0) {
      targetListId = lists[0].id;
    }

    const itemNameToAdd = `${alertProduct.name}${alertProduct.brand ? ` ${alertProduct.brand}` : ''}`.trim();

    onAddToList(targetListId, {
      name: itemNameToAdd,
      category: alertProduct.category || 'Despensa',
      quantity: alertBuyQuantity > 0 ? alertBuyQuantity : 1,
      unit: alertProduct.unit,
      notes: `Reposição da despensa (estoque atual: ${alertProduct.quantity} ${alertProduct.unit})`
    });

    // Mark as dismissed for this replenishment cycle
    const updated = items.map(p => {
      if (p.id === alertProduct.id) {
        return {
          ...p,
          alertDismissedForMinQty: true,
          updatedAt: Date.now()
        };
      }
      return p;
    });
    saveItems(updated);

    showToast(`🛒 ${itemNameToAdd} adicionado à Lista de Compras!`, targetListId);
    setAlertProduct(null);
  };

  const handleDismissAlert = (action: 'later' | 'ignore') => {
    if (!alertProduct) return;

    if (action === 'ignore') {
      // Mark dismissed for this cycle
      const updated = items.map(p => {
        if (p.id === alertProduct.id) {
          return {
            ...p,
            alertDismissedForMinQty: true,
            updatedAt: Date.now()
          };
        }
        return p;
      });
      saveItems(updated);
    }
    // If 'later', keep alertDismissedForMinQty false, just close popup
    setAlertProduct(null);
  };

  // Open Form to Add or Edit
  const handleOpenAddForm = () => {
    setEditingItem(null);
    setFormName('');
    setFormBrand('');
    setFormQuantity('1');
    setFormUnit('pacotes');
    setFormCategory('Alimentos');
    setFormExpiryDate('');
    setFormMinQuantity('1');
    setFormRestockBuyQuantity('2');
    setFormReminderEnabled(false); // Default is false per user specification
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (item: PantryItem) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormBrand(item.brand || '');
    setFormQuantity(item.quantity.toString());
    setFormUnit(item.unit || 'pacotes');
    setFormCategory(item.category || 'Alimentos');
    setFormExpiryDate(item.expiryDate || '');
    setFormMinQuantity(item.minQuantity.toString());
    setFormRestockBuyQuantity((item.restockBuyQuantity || 2).toString());
    setFormReminderEnabled(item.reminderEnabled);
    setIsFormOpen(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const parsedQty = Math.max(0, parseInt(formQuantity, 10) || 0);
    const parsedMin = Math.max(0, parseInt(formMinQuantity, 10) || 1);
    const parsedBuy = Math.max(1, parseInt(formRestockBuyQuantity, 10) || 2);

    if (editingItem) {
      // Update
      const updated = items.map(p => {
        if (p.id === editingItem.id) {
          const wasCycleReset = parsedQty > parsedMin;
          return {
            ...p,
            name: formName.trim(),
            brand: formBrand.trim(),
            quantity: parsedQty,
            unit: formUnit.trim() || 'unidades',
            category: formCategory,
            expiryDate: formExpiryDate || undefined,
            minQuantity: parsedMin,
            restockBuyQuantity: parsedBuy,
            reminderEnabled: formReminderEnabled,
            alertDismissedForMinQty: wasCycleReset ? false : p.alertDismissedForMinQty,
            updatedAt: Date.now()
          };
        }
        return p;
      });
      saveItems(updated);
      showToast('Produto atualizado na despensa!');
    } else {
      // Create new
      const newItem: PantryItem = {
        id: 'pantry-' + Date.now(),
        name: formName.trim(),
        brand: formBrand.trim(),
        quantity: parsedQty,
        unit: formUnit.trim() || 'unidades',
        category: formCategory,
        expiryDate: formExpiryDate || undefined,
        minQuantity: parsedMin,
        restockBuyQuantity: parsedBuy,
        reminderEnabled: formReminderEnabled,
        alertDismissedForMinQty: false,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      saveItems([newItem, ...items]);
      showToast('Novo produto cadastrado na despensa!');
    }

    setIsFormOpen(false);
  };

  const handleDeleteItem = (item: PantryItem) => {
    setItemToDelete(item);
  };

  // Stock status helper
  const getItemStatus = (item: PantryItem) => {
    if (item.quantity <= item.minQuantity) {
      return {
        level: 'critical' as const,
        label: item.quantity === 0 ? 'Esgotado — repor já!' : 'Estoque mínimo atingido',
        badgeClass: 'bg-rose-100 text-rose-800 border-rose-200',
        dotColor: 'bg-rose-500',
        icon: '🔴'
      };
    }
    if (item.quantity === item.minQuantity + 1) {
      return {
        level: 'warning' as const,
        label: 'Próximo do limite',
        badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
        dotColor: 'bg-amber-500',
        icon: '🟡'
      };
    }
    return {
      level: 'ok' as const,
      label: 'Estoque normal',
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      dotColor: 'bg-emerald-500',
      icon: '🟢'
    };
  };

  // Metrics
  const criticalCount = useMemo(() => items.filter(i => i && (i.quantity ?? 0) <= (i.minQuantity ?? 1)).length, [items]);
  const warningCount = useMemo(() => items.filter(i => i && (i.quantity ?? 0) === (i.minQuantity ?? 1) + 1).length, [items]);
  const okCount = useMemo(() => items.filter(i => i && (i.quantity ?? 0) > (i.minQuantity ?? 1) + 1).length, [items]);
  const remindersCount = useMemo(() => items.filter(i => i && !!i.reminderEnabled).length, [items]);

  // Filtered list
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      if (!item) return false;
      const term = (searchTerm || '').toLowerCase();
      const itemName = (item.name || '').toLowerCase();
      const itemBrand = (item.brand || '').toLowerCase();
      const matchesSearch = itemName.includes(term) || itemBrand.includes(term);
      
      const matchesCategory = selectedCategory === 'Todas' || item.category === selectedCategory;

      let matchesFilter = true;
      if (activeFilter === 'critical') matchesFilter = (item.quantity ?? 0) <= (item.minQuantity ?? 1);
      if (activeFilter === 'warning') matchesFilter = (item.quantity ?? 0) === (item.minQuantity ?? 1) + 1;
      if (activeFilter === 'ok') matchesFilter = (item.quantity ?? 0) > (item.minQuantity ?? 1) + 1;
      if (activeFilter === 'reminders') matchesFilter = !!item.reminderEnabled;

      return matchesSearch && matchesCategory && matchesFilter;
    });
  }, [items, searchTerm, selectedCategory, activeFilter]);

  return (
    <div className="pt-20 pb-36 px-4 max-w-lg mx-auto min-h-screen">
      {/* Toast Alert */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-20 left-4 right-4 max-w-md mx-auto z-50 bg-slate-900/95 text-white backdrop-blur-md px-4 py-3 rounded-2xl shadow-xl border border-white/10 flex items-center justify-between gap-3 text-xs"
          >
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-amber-400 shrink-0" />
              <span>{toastMessage.text}</span>
            </div>
            {toastMessage.listId && (
              <button
                onClick={() => {
                  onNavigateToList(toastMessage.listId!);
                  setToastMessage(null);
                }}
                className="font-bold text-emerald-400 hover:text-emerald-300 underline shrink-0"
              >
                Ver Lista →
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white p-5 rounded-3xl shadow-xl shadow-slate-950/10 mb-4 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold text-emerald-300 border border-white/10">
              <Home size={14} /> Estoque Inteligente da Casa
            </div>
            {browserNotificationPerm === 'default' && (
              <button
                onClick={requestBrowserNotification}
                className="text-[11px] font-bold text-amber-300 hover:text-amber-200 bg-amber-400/20 px-2.5 py-1 rounded-full border border-amber-300/30 flex items-center gap-1 active:scale-95 transition-all"
              >
                <Bell size={12} /> Ativar no celular
              </button>
            )}
          </div>

          <h2 className="text-xl font-black tracking-tight mb-1">
            🏠 Minha Despensa
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Controle as quantidades da casa, dê baixa no consumo e receba alertas para repor no ponto exato.
          </p>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-4 gap-2 mt-4 pt-3 border-t border-white/10 text-center">
            <button
              onClick={() => setActiveFilter('all')}
              className={`p-1.5 rounded-xl transition-all ${activeFilter === 'all' ? 'bg-white/20' : 'bg-white/5'}`}
            >
              <div className="text-sm font-black text-white">{items.length}</div>
              <div className="text-[10px] text-slate-400">Total</div>
            </button>
            <button
              onClick={() => setActiveFilter('critical')}
              className={`p-1.5 rounded-xl transition-all ${activeFilter === 'critical' ? 'bg-rose-500/30 ring-1 ring-rose-400' : 'bg-white/5'}`}
            >
              <div className="text-sm font-black text-rose-400 flex items-center justify-center gap-1">
                <span>🔴</span> {criticalCount}
              </div>
              <div className="text-[10px] text-slate-400">Repor</div>
            </button>
            <button
              onClick={() => setActiveFilter('warning')}
              className={`p-1.5 rounded-xl transition-all ${activeFilter === 'warning' ? 'bg-amber-500/30 ring-1 ring-amber-400' : 'bg-white/5'}`}
            >
              <div className="text-sm font-black text-amber-400 flex items-center justify-center gap-1">
                <span>🟡</span> {warningCount}
              </div>
              <div className="text-[10px] text-slate-400">Próximos</div>
            </button>
            <button
              onClick={() => setActiveFilter('ok')}
              className={`p-1.5 rounded-xl transition-all ${activeFilter === 'ok' ? 'bg-emerald-500/30 ring-1 ring-emerald-400' : 'bg-white/5'}`}
            >
              <div className="text-sm font-black text-emerald-400 flex items-center justify-center gap-1">
                <span>🟢</span> {okCount}
              </div>
              <div className="text-[10px] text-slate-400">OK</div>
            </button>
          </div>
        </div>
      </div>

      {/* Action Bar: Add product & Search */}
      <div className="flex flex-col gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por produto ou marca..."
              className="w-full h-11 pl-9 pr-4 bg-white border border-slate-200/80 rounded-2xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <button
            id="btn-add-pantry-item"
            onClick={handleOpenAddForm}
            className={`h-11 px-4 ${themeColor.bg} text-white text-xs font-black rounded-2xl shadow-sm flex items-center gap-1.5 active:scale-95 transition-all shrink-0`}
          >
            <Plus size={16} /> Novo Item
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-full font-bold whitespace-nowrap transition-all ${
              activeFilter === 'all' 
                ? 'bg-slate-900 text-white' 
                : 'bg-white text-slate-600 border border-slate-200/70 hover:bg-slate-50'
            }`}
          >
            Todos ({items.length})
          </button>
          <button
            onClick={() => setActiveFilter('critical')}
            className={`px-3 py-1.5 rounded-full font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeFilter === 'critical' 
                ? 'bg-rose-600 text-white' 
                : 'bg-white text-rose-700 border border-rose-200 hover:bg-rose-50'
            }`}
          >
            <span>🔴</span> Repor Urgente ({criticalCount})
          </button>
          <button
            onClick={() => setActiveFilter('warning')}
            className={`px-3 py-1.5 rounded-full font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeFilter === 'warning' 
                ? 'bg-amber-500 text-white' 
                : 'bg-white text-amber-700 border border-amber-200 hover:bg-amber-50'
            }`}
          >
            <span>🟡</span> Próximos ({warningCount})
          </button>
          <button
            onClick={() => setActiveFilter('ok')}
            className={`px-3 py-1.5 rounded-full font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeFilter === 'ok' 
                ? 'bg-emerald-600 text-white' 
                : 'bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50'
            }`}
          >
            <span>🟢</span> Estoque Normal ({okCount})
          </button>
          <button
            onClick={() => setActiveFilter('reminders')}
            className={`px-3 py-1.5 rounded-full font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeFilter === 'reminders' 
                ? 'bg-blue-600 text-white' 
                : 'bg-white text-blue-700 border border-blue-200 hover:bg-blue-50'
            }`}
          >
            <Bell size={12} /> Com Alerta ({remindersCount})
          </button>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none text-[11px]">
          <button
            onClick={() => setSelectedCategory('Todas')}
            className={`px-2.5 py-1 rounded-xl font-bold whitespace-nowrap transition-all ${
              selectedCategory === 'Todas'
                ? 'bg-slate-800 text-white'
                : 'bg-white/80 text-slate-500 border border-slate-200/60 hover:bg-slate-100'
            }`}
          >
            Todas as Categorias
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-xl font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? `${themeColor.bg} text-white shadow-sm`
                  : 'bg-white/80 text-slate-500 border border-slate-200/60 hover:bg-slate-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Product List */}
      <div className="flex flex-col gap-3">
        {filteredItems.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border border-slate-100 shadow-sm">
            <Package size={36} className="mx-auto text-slate-300 mb-2" />
            <p className="font-bold text-slate-800 text-sm">Nenhum produto encontrado</p>
            <p className="text-xs text-slate-400 mt-1">
              {searchTerm ? 'Tente buscar com outro termo ou limpe os filtros.' : 'Cadastre produtos na despensa para controlar seu estoque.'}
            </p>
            {searchTerm ? (
              <button
                onClick={() => { setSearchTerm(''); setActiveFilter('all'); }}
                className="mt-4 px-4 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl"
              >
                Limpar filtros
              </button>
            ) : (
              <button
                onClick={handleOpenAddForm}
                className={`mt-4 px-4 py-2 ${themeColor.bg} text-white font-bold text-xs rounded-xl shadow-sm`}
              >
                Adicionar primeiro produto
              </button>
            )}
          </div>
        ) : (
          filteredItems.map((item) => {
            const status = getItemStatus(item);
            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
              >
                {/* Visual Status Indicator Strip */}
                <div className={`absolute top-0 left-0 bottom-0 w-1.5 ${status.dotColor}`} />

                <div className="pl-2">
                  {/* Top row: Name, Brand, Badges */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="font-black text-slate-900 text-base leading-tight truncate">
                          {item.name}
                        </h3>
                        {item.brand && (
                          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg">
                            {item.brand}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                          <Tag size={11} /> {item.category}
                        </span>
                        {item.expiryDate && (
                          <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                            <Calendar size={11} /> Val: {item.expiryDate}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border flex items-center gap-1.5 shrink-0 ${status.badgeClass}`}>
                      <span>{status.icon}</span>
                      <span>{status.label}</span>
                    </div>
                  </div>

                  {/* Stock Count & Controls */}
                  <div className="bg-slate-50 rounded-2xl p-3 flex items-center justify-between gap-3 mt-2 border border-slate-100">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Estoque Atual
                      </span>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl font-black text-slate-900 leading-none">
                          {item.quantity}
                        </span>
                        <span className="text-xs font-bold text-slate-500">
                          {item.unit}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 mt-0.5">
                        Mínimo: <strong>{item.minQuantity} {item.unit}</strong>
                      </span>
                    </div>

                    {/* Stepper: ➖ QTD ➕ */}
                    <div className="flex items-center gap-2 bg-white p-1 rounded-2xl border border-slate-200/80 shadow-inner">
                      <button
                        onClick={() => handleDecrementStock(item)}
                        disabled={item.quantity <= 0}
                        aria-label={`Diminuir estoque de ${item.name}`}
                        className="w-11 h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-black active:scale-95 disabled:opacity-40 transition-all"
                      >
                        <Minus size={18} strokeWidth={3} />
                      </button>

                      <div className="w-8 text-center font-black text-slate-800 text-base">
                        {item.quantity}
                      </div>

                      <button
                        onClick={() => handleIncrementStock(item)}
                        aria-label={`Aumentar estoque de ${item.name}`}
                        className={`w-11 h-11 rounded-xl ${themeColor.bg} text-white flex items-center justify-center font-black active:scale-95 ${themeColor.hover} transition-all shadow-sm`}
                      >
                        <Plus size={18} strokeWidth={3} />
                      </button>
                    </div>
                  </div>

                  {/* Bottom Bar: Reminder Switch & Actions */}
                  <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-slate-100 flex-wrap">
                    {/* Reminder Toggle Button */}
                    <button
                      onClick={() => handleToggleReminder(item)}
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-xl border flex items-center gap-1.5 transition-all active:scale-95 ${
                        item.reminderEnabled
                          ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                          : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                      }`}
                      title="Clique para ativar ou desativar o lembrete de reposição para este produto"
                    >
                      {item.reminderEnabled ? (
                        <>
                          <Bell size={13} className="text-blue-600" />
                          <span>Lembrete: <strong>ATIVADO</strong></span>
                        </>
                      ) : (
                        <>
                          <BellOff size={13} className="text-slate-400" />
                          <span>Lembrete: <strong>DESATIVADO</strong></span>
                        </>
                      )}
                    </button>

                    {/* Actions: Edit, Delete, Quick Add to List */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          setAlertProduct(item);
                          setAlertBuyQuantity(item.restockBuyQuantity || 2);
                          if (lists.length > 0) setSelectedListIdForAlert(lists[0].id);
                        }}
                        className="h-8 px-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-[11px] font-bold flex items-center gap-1 active:scale-95 transition-all"
                        title="Adicionar à Lista de Compras agora"
                      >
                        <ShoppingCart size={13} /> Comprar
                      </button>

                      <button
                        onClick={() => handleOpenEditForm(item)}
                        className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center active:scale-95 transition-all"
                        title="Editar produto"
                      >
                        <Edit3 size={13} />
                      </button>

                      <button
                        onClick={() => handleDeleteItem(item)}
                        className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 flex items-center justify-center active:scale-95 transition-all"
                        title="Remover produto"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* REPLENISHMENT ALERT MODAL (Aviso de Reposição Interativo) */}
      <AnimatePresence>
        {alertProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 relative"
            >
              {/* Alert Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center text-2xl font-black shrink-0">
                  🔔
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 leading-tight">
                    Hora de repor!
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Seu produto atingiu o ponto de reposição
                  </p>
                </div>
              </div>

              {/* Message Details */}
              <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-4 mb-4 text-xs text-amber-950 leading-relaxed">
                <p>
                  Seu estoque de <strong>{alertProduct.name} {alertProduct.brand}</strong> chegou a <strong>{alertProduct.quantity} {alertProduct.unit}</strong> (mínimo definido: {alertProduct.minQuantity} {alertProduct.unit}).
                </p>
                <p className="font-bold mt-2 text-slate-800">
                  Deseja adicionar à sua Lista de Compras?
                </p>
              </div>

              {/* Quantity to buy and list selection */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 mb-5 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">
                    Quantidade a comprar:
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setAlertBuyQuantity(q => Math.max(1, q - 1))}
                      className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-600 active:scale-95"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-8 text-center font-black text-slate-900 text-sm">
                      {alertBuyQuantity}
                    </span>
                    <button
                      onClick={() => setAlertBuyQuantity(q => q + 1)}
                      className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-600 active:scale-95"
                    >
                      <Plus size={14} />
                    </button>
                    <span className="text-xs font-semibold text-slate-500">
                      {alertProduct.unit}
                    </span>
                  </div>
                </div>

                {/* Target List Selector */}
                {lists.length > 0 && (
                  <div className="flex flex-col gap-1 pt-2 border-t border-slate-200/60">
                    <label className="text-[11px] font-bold text-slate-500">
                      Adicionar na lista:
                    </label>
                    <select
                      value={selectedListIdForAlert}
                      onChange={(e) => setSelectedListIdForAlert(e.target.value)}
                      className="h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
                    >
                      {lists.map(l => (
                        <option key={l.id} value={l.id}>
                          {l.name} ({l.status})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Actions per prompt */}
              <div className="flex flex-col gap-2">
                <button
                  id="btn-confirm-add-to-list"
                  onClick={handleConfirmAddToList}
                  className={`w-full h-12 ${themeColor.bg} text-white font-black rounded-2xl flex items-center justify-center gap-2 shadow-sm ${themeColor.hover} active:scale-98 transition-all`}
                >
                  <ShoppingCart size={18} /> ADICIONAR À LISTA
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleDismissAlert('later')}
                    className="h-11 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs active:scale-98 transition-all flex items-center justify-center gap-1"
                  >
                    <Clock size={14} /> LEMBRAR DEPOIS
                  </button>

                  <button
                    onClick={() => handleDismissAlert('ignore')}
                    className="h-11 bg-white border border-slate-200 text-slate-500 hover:text-slate-800 font-bold rounded-2xl text-xs active:scale-98 transition-all"
                  >
                    IGNORAR
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PRODUCT FORM MODAL (Novo / Editar Produto) */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 my-8"
            >
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className={`w-10 h-10 rounded-2xl ${themeColor.light} ${themeColor.text} flex items-center justify-center`}>
                    <Package size={20} />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-base">
                      {editingItem ? 'Editar Produto' : 'Cadastrar na Despensa'}
                    </h3>
                    <p className="text-xs text-slate-400">Controle de estoque doméstico</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsFormOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSaveForm} className="flex flex-col gap-4">
                {/* Produto & Marca */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-700">
                      Produto *
                    </label>
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="Ex: Arroz"
                      className="h-11 px-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-700">
                      Marca
                    </label>
                    <input
                      type="text"
                      value={formBrand}
                      onChange={(e) => setFormBrand(e.target.value)}
                      placeholder="Ex: Tio João"
                      className="h-11 px-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>

                {/* Quantidade Atual & Unidade */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-700">
                      Quantidade Atual *
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={formQuantity}
                      onChange={(e) => setFormQuantity(e.target.value)}
                      className="h-11 px-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-700">
                      Unidade
                    </label>
                    <input
                      type="text"
                      value={formUnit}
                      onChange={(e) => setFormUnit(e.target.value)}
                      placeholder="pacotes, kg, litros..."
                      list="common-units"
                      className="h-11 px-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                    <datalist id="common-units">
                      {COMMON_UNITS.map(u => (
                        <option key={u} value={u} />
                      ))}
                    </datalist>
                  </div>
                </div>

                {/* Categoria & Validade */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-700">
                      Categoria
                    </label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="h-11 px-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none"
                    >
                      {CATEGORIES.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-700">
                      Validade (opcional)
                    </label>
                    <input
                      type="date"
                      value={formExpiryDate}
                      onChange={(e) => setFormExpiryDate(e.target.value)}
                      className="h-11 px-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Estoque Mínimo / Ponto de reposição */}
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 flex flex-col gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <span className="text-amber-500 font-black">🔔</span> Me lembrar quando chegar a:
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        required
                        value={formMinQuantity}
                        onChange={(e) => setFormMinQuantity(e.target.value)}
                        className="w-24 h-11 px-3 bg-white rounded-xl border border-slate-200 text-sm font-black text-slate-900 text-center"
                      />
                      <span className="text-xs font-bold text-slate-600">
                        {formUnit || 'unidades'} (ponto de reposição)
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 pt-2 border-t border-slate-200/60">
                    <label className="text-xs font-bold text-slate-700">
                      Quantidade sugerida para comprar:
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        value={formRestockBuyQuantity}
                        onChange={(e) => setFormRestockBuyQuantity(e.target.value)}
                        className="w-24 h-11 px-3 bg-white rounded-xl border border-slate-200 text-sm font-black text-slate-900 text-center"
                      />
                      <span className="text-xs font-semibold text-slate-500">
                        {formUnit || 'unidades'} ao adicionar na lista
                      </span>
                    </div>
                  </div>
                </div>

                {/* Lembrete opcional [ ATIVADO / DESATIVADO ] */}
                <div className="p-3.5 rounded-2xl border border-slate-200 bg-white flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Bell size={14} className={formReminderEnabled ? 'text-blue-600' : 'text-slate-400'} />
                      Lembrar quando estiver acabando
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {formReminderEnabled 
                        ? 'Avisará quando o estoque atingir a quantidade mínima.'
                        : 'Desativado: apenas controla o estoque sem enviar avisos.'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setFormReminderEnabled(!formReminderEnabled)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                      formReminderEnabled 
                        ? 'bg-blue-600 text-white shadow-sm' 
                        : 'bg-slate-100 text-slate-500 border border-slate-200'
                    }`}
                  >
                    {formReminderEnabled ? '🔘 ATIVADO' : '⚪ DESATIVADO'}
                  </button>
                </div>

                {/* Submit & Cancel */}
                <div className="flex flex-col gap-2 pt-2">
                  <button
                    type="submit"
                    className={`w-full h-12 ${themeColor.bg} text-white font-black rounded-2xl flex items-center justify-center gap-2 shadow-sm ${themeColor.hover} active:scale-98 transition-all`}
                  >
                    <Check size={18} /> {editingItem ? 'SALVAR ALTERAÇÕES' : 'CADASTRAR PRODUTO'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="w-full h-11 bg-slate-100 text-slate-600 font-bold rounded-2xl text-xs active:scale-98 transition-all"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {itemToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-3">
                <Trash2 size={24} />
              </div>
              <h3 className="text-lg font-black text-slate-900">
                Remover produto?
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Tem certeza que deseja remover <strong>{itemToDelete.name}{itemToDelete.brand ? ` (${itemToDelete.brand})` : ''}</strong> da despensa?
              </p>
              <div className="flex gap-2 pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setItemToDelete(null)}
                  className="flex-1 h-11 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs active:scale-98 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const id = itemToDelete.id;
                    const name = itemToDelete.name;
                    setItemToDelete(null);
                    const updated = items.filter(p => p.id !== id);
                    saveItems(updated);
                    showToast(`${name} removido da despensa.`);
                  }}
                  className="flex-1 h-11 bg-rose-600 text-white font-bold rounded-2xl text-xs active:scale-98 transition-all hover:bg-rose-700 shadow-sm"
                >
                  Remover
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
