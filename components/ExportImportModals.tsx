'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileUp, 
  Share2, 
  Printer, 
  Copy, 
  Check, 
  FileText, 
  FileSpreadsheet, 
  FileCode, 
  Upload, 
  AlertCircle, 
  CheckCircle2, 
  X,
  Sparkles,
  Download
} from 'lucide-react';
import { ListItem, GroceryList } from '../lib/types';
import { 
  formatMoneyExact, 
  calculateItemSubtotal, 
  generateExportJSON, 
  generateExportCSV, 
  generateExportText, 
  parseImportData, 
  shareOrDownloadFile, 
  downloadFileDirectly,
  getItemQuantity,
  getItemUnit
} from '../lib/exportImport';

interface Currency {
  code: string;
  symbol: string;
  name?: string;
  rate?: number;
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

// --- Printable Layout for window.print() (PDF) ---
export const PrintableList = ({ 
  list, 
  currency 
}: { 
  list: GroceryList | null; 
  currency: Currency;
}) => {
  if (!list) return null;
  const items = list.items || [];
  const totalEstimado = items.reduce((acc, curr) => acc + calculateItemSubtotal(curr), 0);
  const totalCarrinho = items.filter(i => i.checked).reduce((acc, curr) => acc + calculateItemSubtotal(curr), 0);
  const dateStr = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

  return (
    <div className="hidden print:block print-area p-8 max-w-4xl mx-auto font-sans text-black bg-white">
      <div className="border-b-2 border-slate-900 pb-4 mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Mercado Fresh</h1>
          <h2 className="text-lg font-bold text-slate-700 mt-1">{list.name}</h2>
        </div>
        <div className="text-right text-xs text-slate-600 space-y-0.5">
          <p><strong>Data de Emissão:</strong> {dateStr}</p>
          <p><strong>Status:</strong> {list.status}</p>
        </div>
      </div>

      <table className="w-full border-collapse mb-8 text-xs">
        <thead>
          <tr className="border-b-2 border-slate-300 text-left text-slate-700 font-bold uppercase tracking-wider">
            <th className="py-2 px-2 w-10 text-center">Status</th>
            <th className="py-2 px-2">Produto</th>
            <th className="py-2 px-2">Categoria</th>
            <th className="py-2 px-2 text-right">Qtd / Unid.</th>
            <th className="py-2 px-2 text-right">Preço Unit.</th>
            <th className="py-2 px-2 text-right">Subtotal</th>
            <th className="py-2 px-2">Observações</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => {
            const qty = getItemQuantity(item);
            const unit = getItemUnit(item);
            const subtotal = calculateItemSubtotal(item);
            return (
              <tr key={idx} className="border-b border-slate-200">
                <td className="py-2.5 px-2 text-center font-mono font-bold">
                  {item.checked ? '[X]' : '[  ]'}
                </td>
                <td className="py-2.5 px-2 font-bold text-slate-900">{item.name}</td>
                <td className="py-2.5 px-2 text-slate-600">{item.category || 'Geral'}</td>
                <td className="py-2.5 px-2 text-right">{qty} {unit}</td>
                <td className="py-2.5 px-2 text-right">{currency.symbol} {formatMoneyExact(item.price)}</td>
                <td className="py-2.5 px-2 text-right font-bold">{currency.symbol} {formatMoneyExact(subtotal)}</td>
                <td className="py-2.5 px-2 text-slate-500 italic">{item.notes || '-'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="border-t-2 border-slate-900 pt-4 flex justify-between items-start text-xs">
        <div className="text-slate-500 space-y-1">
          <p>Total de itens cadastrados: <strong>{items.length}</strong></p>
          <p className="italic">Valores com centavos originais preservados com precisão.</p>
        </div>
        <div className="text-right space-y-1">
          <p className="text-slate-600">Total no Carrinho: <strong className="text-slate-900">{currency.symbol} {formatMoneyExact(totalCarrinho)}</strong></p>
          <p className="text-slate-600">Total Estimado: <strong className="text-slate-900 text-sm">{currency.symbol} {formatMoneyExact(totalEstimado)}</strong></p>
          {list.budgetLimit && (
            <p className="text-slate-600">Limite Orçado: <strong className="text-slate-900">{currency.symbol} {formatMoneyExact(list.budgetLimit)}</strong></p>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Modal de Compartilhar / Exportar ---
export interface ShareExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  list: GroceryList | null;
  currency: Currency;
  themeColor: ThemeColor;
}

export const ShareExportModal = ({
  isOpen,
  onClose,
  list,
  currency,
  themeColor,
}: ShareExportModalProps) => {
  const [activeTab, setActiveTab] = useState<'data' | 'pdf' | 'text'>('data');
  const [dataFormat, setDataFormat] = useState<'json' | 'csv'>('json');
  const [copiedText, setCopiedText] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  if (!isOpen || !list) return null;

  const totalEstimado = (list.items || []).reduce((acc, curr) => acc + calculateItemSubtotal(curr), 0);
  const totalCarrinho = (list.items || []).filter(i => i.checked).reduce((acc, curr) => acc + calculateItemSubtotal(curr), 0);

  const safeListName = list.name.toLowerCase().replace(/[^a-z0-9]/gi, '_');
  const jsonContent = generateExportJSON(list, currency.symbol);
  const csvContent = generateExportCSV(list);
  const textContent = generateExportText(list, currency.symbol);

  const handleShareData = async () => {
    setIsSharing(true);
    try {
      if (dataFormat === 'json') {
        await shareOrDownloadFile(
          `lista_${safeListName}.json`,
          jsonContent,
          'application/json',
          `Lista ${list.name}`
        );
      } else {
        await shareOrDownloadFile(
          `lista_${safeListName}.csv`,
          csvContent,
          'text/csv;charset=utf-8',
          `Lista ${list.name}`
        );
      }
    } finally {
      setIsSharing(false);
    }
  };

  const handleDownloadDirect = () => {
    if (dataFormat === 'json') {
      downloadFileDirectly(`lista_${safeListName}.json`, jsonContent, 'application/json');
    } else {
      downloadFileDirectly(`lista_${safeListName}.csv`, csvContent, 'text/csv;charset=utf-8');
    }
  };

  const handleCopyText = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(textContent);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = textContent;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2500);
    } catch {
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2500);
    }
  };

  const handleWhatsAppShare = () => {
    const encoded = encodeURIComponent(textContent);
    try {
      const opened = window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank', 'noopener,noreferrer');
      if (!opened) {
        handleCopyText();
      }
    } catch {
      handleCopyText();
    }
  };

  const handlePrintPDF = () => {
    try {
      window.print();
    } catch {
      // ignore print errors in restricted sandboxes
    }
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] no-print"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="fixed left-4 right-4 top-1/2 -translate-y-1/2 bg-white rounded-3xl p-6 z-[101] shadow-2xl max-w-lg mx-auto max-h-[90vh] overflow-y-auto no-print"
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-xl font-extrabold text-slate-900">Compartilhar Lista</h3>
            <p className="text-xs text-slate-500 font-medium truncate max-w-xs">{list.name}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-2xl my-4">
          <button
            type="button"
            onClick={() => setActiveTab('data')}
            className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
              activeTab === 'data' 
                ? `bg-white shadow-sm ${themeColor.text}` 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <FileCode size={16} />
            <span>Dados (Exportar)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pdf')}
            className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
              activeTab === 'pdf' 
                ? `bg-white shadow-sm ${themeColor.text}` 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Printer size={16} />
            <span>PDF / Imprimir</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('text')}
            className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
              activeTab === 'text' 
                ? `bg-white shadow-sm ${themeColor.text}` 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <FileText size={16} />
            <span>Texto WhatsApp</span>
          </button>
        </div>

        {/* Tab 1: Exportar Dados (JSON e CSV) */}
        {activeTab === 'data' && (
          <div className="flex flex-col gap-4">
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
              <div className="flex items-center gap-2 mb-2 text-slate-900 font-bold text-xs">
                <Sparkles size={16} className={themeColor.text} />
                <span>Exportação Padronizada e Compatível</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Exporta 100% dos dados da lista para transferência entre aparelhos ou importação em outros aplicativos.
                Preserva com exatidão todos os centavos (ex: <strong>{currency.symbol} 6,50</strong>, <strong>{currency.symbol} 10,99</strong> e <strong>{currency.symbol} 25,00</strong>), quantidades, unidades e status de compra.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Escolha o Formato do Arquivo</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setDataFormat('json')}
                  className={`p-3.5 rounded-2xl border-2 text-left transition-all flex items-start gap-3 ${
                    dataFormat === 'json' 
                      ? `${themeColor.border} bg-white shadow-sm` 
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-white'
                  }`}
                >
                  <FileCode size={24} className={dataFormat === 'json' ? themeColor.text : 'text-slate-400'} />
                  <div>
                    <div className="font-bold text-xs text-slate-900">Arquivo JSON (.json)</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Ideal para backup completo e apps compatíveis</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setDataFormat('csv')}
                  className={`p-3.5 rounded-2xl border-2 text-left transition-all flex items-start gap-3 ${
                    dataFormat === 'csv' 
                      ? `${themeColor.border} bg-white shadow-sm` 
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-white'
                  }`}
                >
                  <FileSpreadsheet size={24} className={dataFormat === 'csv' ? themeColor.text : 'text-slate-400'} />
                  <div>
                    <div className="font-bold text-xs text-slate-900">Planilha CSV (.csv)</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Compatível com Excel, Sheets e tabelas</div>
                  </div>
                </button>
              </div>
            </div>

            {/* List summary pill */}
            <div className="flex items-center justify-between px-4 py-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
              <span className="text-slate-600 font-medium">Itens: <strong>{list.items?.length || 0}</strong></span>
              <span className="text-slate-600 font-medium">Carrinho: <strong>{currency.symbol} {formatMoneyExact(totalCarrinho)}</strong></span>
              <span className="text-slate-600 font-medium">Total: <strong>{currency.symbol} {formatMoneyExact(totalEstimado)}</strong></span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={handleShareData}
                disabled={isSharing}
                className={`w-full py-3.5 px-4 ${themeColor.bg} text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-md hover:brightness-105 active:scale-95 text-xs`}
              >
                <Share2 size={16} />
                <span>Compartilhar no Celular</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadDirect}
                className="w-full py-3.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 text-xs"
              >
                <Download size={16} />
                <span>Baixar Arquivo</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400 text-center">
              &quot;Compartilhar no Celular&quot; abre diretamente as opções de WhatsApp, Arquivos, E-mail ou Drive no seu smartphone.
            </p>
          </div>
        )}

        {/* Tab 2: PDF / Imprimir */}
        {activeTab === 'pdf' && (
          <div className="flex flex-col gap-4">
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
              <div className="flex items-center gap-2 mb-1.5 text-slate-900 font-bold text-xs">
                <Printer size={16} className={themeColor.text} />
                <span>Documento Formatado para Impressão ou PDF</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Gera uma página limpa com tabela de produtos, quantidades, unidades, preços unitários e subtotais exatos. Você pode salvar como arquivo PDF no seu celular/computador ou imprimir diretamente.
              </p>
            </div>

            {/* Quick Preview */}
            <div className="border border-slate-200 rounded-2xl p-4 bg-white max-h-56 overflow-y-auto text-xs space-y-2">
              <div className="flex justify-between border-b pb-2 font-bold text-slate-800">
                <span>{list.name}</span>
                <span>{currency.symbol} {formatMoneyExact(totalEstimado)}</span>
              </div>
              <div className="divide-y divide-slate-100 text-slate-600">
                {(list.items || []).map((it, idx) => (
                  <div key={idx} className="py-1.5 flex justify-between items-center text-[11px]">
                    <span className="truncate pr-2">{it.checked ? '☑' : '☐'} {it.name} ({getItemQuantity(it)} {getItemUnit(it)})</span>
                    <span className="font-mono font-bold shrink-0">{currency.symbol} {formatMoneyExact(calculateItemSubtotal(it))}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={handlePrintPDF}
              className={`w-full py-3.5 px-4 ${themeColor.bg} text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-md hover:brightness-105 active:scale-95 text-xs`}
            >
              <Printer size={18} />
              <span>Imprimir ou Salvar como PDF</span>
            </button>
            <p className="text-[11px] text-slate-400 text-center">
              Na janela que abrir, selecione a opção <strong>&quot;Salvar como PDF&quot;</strong> para guardar o arquivo.
            </p>
          </div>
        )}

        {/* Tab 3: Texto Formatado */}
        {activeTab === 'text' && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Prévia do Texto para Mensagens</label>
              <textarea
                readOnly
                value={textContent}
                className="w-full h-44 p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono focus:outline-none resize-none leading-relaxed text-slate-700"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={handleCopyText}
                className="w-full py-3.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 text-xs"
              >
                {copiedText ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
                <span>{copiedText ? 'Texto Copiado!' : 'Copiar Texto'}</span>
              </button>

              <button
                type="button"
                onClick={handleWhatsAppShare}
                className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 text-xs"
              >
                <Share2 size={16} />
                <span>Enviar pelo WhatsApp</span>
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

// --- Modal de Importar Lista ---
export interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (
    importedData: { listName: string; items: ListItem[]; budgetLimit?: number },
    mode: 'new_list' | 'add_to_current'
  ) => void;
  currentList?: GroceryList | null;
  themeColor: ThemeColor;
  currency: Currency;
}

export const ImportModal = ({
  isOpen,
  onClose,
  onImport,
  currentList,
  themeColor,
  currency,
}: ImportModalProps) => {
  const [importMode, setImportMode] = useState<'file' | 'text'>('file');
  const [pastedText, setPastedText] = useState('');
  const [parseResult, setParseResult] = useState<{
    success: boolean;
    listName: string;
    items: ListItem[];
    budgetLimit?: number;
    error?: string;
  } | null>(null);

  const [customListName, setCustomListName] = useState('');
  const [targetDestination, setTargetDestination] = useState<'new_list' | 'add_to_current'>(
    currentList ? 'add_to_current' : 'new_list'
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = parseImportData(content);
      setParseResult(res);
      if (res.success) {
        setCustomListName(res.listName);
      }
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleProcessPastedText = () => {
    const res = parseImportData(pastedText);
    setParseResult(res);
    if (res.success) {
      setCustomListName(res.listName);
    }
  };

  const handleConfirmImport = () => {
    if (!parseResult || !parseResult.success) return;
    onImport(
      {
        listName: customListName.trim() || parseResult.listName || 'Lista Importada',
        items: parseResult.items,
        budgetLimit: parseResult.budgetLimit,
      },
      targetDestination
    );
    handleResetModal();
  };

  const handleResetModal = () => {
    setParseResult(null);
    setPastedText('');
    setCustomListName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    onClose();
  };

  const totalCalculado = parseResult?.items
    ? parseResult.items.reduce((acc, curr) => acc + calculateItemSubtotal(curr), 0)
    : 0;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        onClick={handleResetModal}
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] no-print"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="fixed left-4 right-4 top-1/2 -translate-y-1/2 bg-white rounded-3xl p-6 z-[101] shadow-2xl max-w-lg mx-auto max-h-[90vh] overflow-y-auto no-print"
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-xl font-extrabold text-slate-900">Importar Lista</h3>
            <p className="text-xs text-slate-500 font-medium">Carregue arquivos .JSON ou .CSV compatíveis</p>
          </div>
          <button 
            onClick={handleResetModal}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Input Selector Tabs */}
        {!parseResult?.success && (
          <>
            <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-2xl my-4">
              <button
                type="button"
                onClick={() => setImportMode('file')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  importMode === 'file' ? `bg-white shadow-sm ${themeColor.text}` : 'text-slate-500'
                }`}
              >
                <Upload size={16} />
                <span>Arquivo (.json ou .csv)</span>
              </button>
              <button
                type="button"
                onClick={() => setImportMode('text')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  importMode === 'text' ? `bg-white shadow-sm ${themeColor.text}` : 'text-slate-500'
                }`}
              >
                <FileText size={16} />
                <span>Colar Texto</span>
              </button>
            </div>

            {importMode === 'file' ? (
              <div className="flex flex-col gap-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".json,.csv,text/csv,application/json,text/plain"
                  className="hidden"
                />
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-200 hover:border-slate-300 rounded-3xl p-8 flex flex-col items-center justify-center gap-3 text-center cursor-pointer bg-slate-50 hover:bg-slate-100/50 transition-all"
                >
                  <div className={`w-12 h-12 rounded-2xl ${themeColor.light} flex items-center justify-center ${themeColor.text}`}>
                    <FileUp size={24} />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-slate-800">Clique para selecionar o arquivo</p>
                    <p className="text-xs text-slate-400 mt-1">Suporta arquivos .JSON e .CSV (Planilha)</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <textarea
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder="Cole aqui o conteúdo JSON ou CSV exportado..."
                  className="w-full h-40 p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono focus:ring-2 focus:ring-slate-300 resize-none"
                />
                <button
                  type="button"
                  onClick={handleProcessPastedText}
                  disabled={!pastedText.trim()}
                  className={`w-full py-3 ${themeColor.bg} text-white rounded-2xl font-bold text-xs transition-all disabled:opacity-40`}
                >
                  Analisar e Validar Conteúdo
                </button>
              </div>
            )}
          </>
        )}

        {/* Error message */}
        {parseResult && !parseResult.success && (
          <div className="mt-4 p-4 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-700 text-xs">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Erro ao processar dados</p>
              <p className="mt-0.5 text-red-600">{parseResult.error}</p>
            </div>
          </div>
        )}

        {/* Validated preview state */}
        {parseResult && parseResult.success && (
          <div className="flex flex-col gap-4 mt-4">
            <div className="p-3 bg-green-50 border border-green-200 rounded-2xl flex items-center gap-2 text-green-800 text-xs font-bold">
              <CheckCircle2 size={18} className="text-green-600 shrink-0" />
              <span>Arquivo validado com sucesso! Dados e centavos preservados.</span>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Nome da Lista</label>
              <input
                type="text"
                value={customListName}
                onChange={(e) => setCustomListName(e.target.value)}
                placeholder="Nome da lista"
                className={`w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm focus:ring-2 ${themeColor.ring}`}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Itens Encontrados</span>
                <span className="text-base font-extrabold text-slate-900">{parseResult.items.length} itens</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Estimado</span>
                <span className="text-base font-extrabold text-slate-900">{currency.symbol} {formatMoneyExact(totalCalculado)}</span>
              </div>
            </div>

            {/* Destination options if within a list */}
            {currentList && (
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Destino da Importação</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTargetDestination('add_to_current')}
                    className={`p-3 rounded-2xl border-2 text-xs font-bold transition-all text-left ${
                      targetDestination === 'add_to_current'
                        ? `${themeColor.border} bg-white shadow-sm ${themeColor.text}`
                        : 'border-slate-200 bg-slate-50 text-slate-600'
                    }`}
                  >
                    Adicionar à Lista Atual
                    <span className="block text-[10px] font-normal text-slate-400 truncate mt-0.5">&quot;{currentList.name}&quot;</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetDestination('new_list')}
                    className={`p-3 rounded-2xl border-2 text-xs font-bold transition-all text-left ${
                      targetDestination === 'new_list'
                        ? `${themeColor.border} bg-white shadow-sm ${themeColor.text}`
                        : 'border-slate-200 bg-slate-50 text-slate-600'
                    }`}
                  >
                    Criar como Nova Lista
                    <span className="block text-[10px] font-normal text-slate-400 mt-0.5">Separação independente</span>
                  </button>
                </div>
              </div>
            )}

            {/* Preview of first few items */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Prévia dos Itens</label>
              <div className="border border-slate-200 rounded-2xl p-3 bg-slate-50 max-h-40 overflow-y-auto space-y-1.5 text-xs">
                {parseResult.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between items-center py-1 border-b border-slate-100 last:border-none text-[11px]">
                    <span className="truncate pr-2 font-medium text-slate-700">
                      {it.name} ({getItemQuantity(it)} {getItemUnit(it)})
                    </span>
                    <span className="font-mono font-bold text-slate-900 shrink-0">
                      {currency.symbol} {formatMoneyExact(calculateItemSubtotal(it))}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setParseResult(null)}
                className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-bold text-xs transition-all"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={handleConfirmImport}
                className={`flex-1 py-3.5 ${themeColor.bg} hover:brightness-105 active:scale-95 text-white rounded-2xl font-bold text-xs shadow-md transition-all`}
              >
                Concluir Importação ({parseResult.items.length})
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
