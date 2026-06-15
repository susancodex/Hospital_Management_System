import { useState, useEffect, useCallback } from 'react';
import { Pill, Plus, RefreshCw, Search, AlertTriangle, CheckCircle, TrendingDown, X, Loader2, Package, Edit2, Trash2, ShieldAlert } from 'lucide-react';
import { pharmacyAPI } from '../api/services.js';
import { useAuth } from '../hooks/useAuth.js';
import { hasPermission } from '../lib/permissions.js';

const DOSAGE_FORMS = ['tablet', 'capsule', 'syrup', 'injection', 'cream', 'ointment', 'drops', 'inhaler', 'patch', 'suppository', 'solution', 'suspension'];
const CATEGORIES = ['Antibiotic', 'Analgesic', 'Antihypertensive', 'Antidiabetic', 'Antihistamine', 'Antifungal', 'Antiviral', 'Cardiovascular', 'Gastrointestinal', 'Hormonal', 'Immunosuppressant', 'Neurological', 'Nutritional', 'Respiratory', 'Vitamins & Supplements', 'Other'];

const STOCK_STATUS = {
  ok: { label: 'In Stock', icon: CheckCircle, color: 'text-emerald-600 dark:text-emerald-400' },
  low: { label: 'Low Stock', icon: TrendingDown, color: 'text-amber-600 dark:text-amber-400' },
  expiring_soon: { label: 'Expiring Soon', icon: AlertTriangle, color: 'text-orange-600 dark:text-orange-400' },
  expired: { label: 'Expired', icon: ShieldAlert, color: 'text-red-600 dark:text-red-400' },
};

function StockBadge({ item }) {
  const cfg = STOCK_STATUS[item.stock_status] || STOCK_STATUS.ok;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${cfg.color}`}>
      <Icon size={12} />
      {cfg.label}
    </span>
  );
}

function InventoryModal({ item, onClose, onSuccess }) {
  const [form, setForm] = useState({
    name: item?.name || '',
    generic_name: item?.generic_name || '',
    category: item?.category || '',
    dosage_form: item?.dosage_form || 'tablet',
    strength: item?.strength || '',
    quantity_in_stock: item?.quantity_in_stock ?? 0,
    unit: item?.unit || 'tablets',
    reorder_level: item?.reorder_level ?? 10,
    expiry_date: item?.expiry_date || '',
    manufacturer: item?.manufacturer || '',
    batch_number: item?.batch_number || '',
    unit_price: item?.unit_price || '0',
    is_controlled: item?.is_controlled || false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Drug name is required.'); return; }
    setSaving(true);
    setError('');
    try {
      if (item?.id) {
        await pharmacyAPI.updateInventory(item.id, form);
      } else {
        await pharmacyAPI.createInventory(form);
      }
      onSuccess();
    } catch (err) {
      setError(err.message || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  const F = ({ label, name, type = 'text', placeholder = '', col = 1 }) => (
    <div className={col === 2 ? 'col-span-2' : ''}>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{label}</label>
      <input type={type} value={form[name]} onChange={e => setForm(f => ({ ...f, [name]: e.target.value }))} placeholder={placeholder}
        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{item ? 'Edit Drug' : 'Add Drug to Inventory'}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-4 py-2 rounded-lg">{error}</p>}

          <div className="grid grid-cols-2 gap-4">
            <F label="Drug Name *" name="name" placeholder="e.g. Amoxicillin" col={2} />
            <F label="Generic Name" name="generic_name" placeholder="e.g. Amoxicillin trihydrate" col={2} />

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Category</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500">
                <option value="">Select…</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Dosage Form</label>
              <select value={form.dosage_form} onChange={e => setForm(f => ({ ...f, dosage_form: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500">
                {DOSAGE_FORMS.map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
              </select>
            </div>

            <F label="Strength" name="strength" placeholder="e.g. 500mg" />
            <F label="Unit" name="unit" placeholder="e.g. tablets, ml" />
            <F label="Qty in Stock" name="quantity_in_stock" type="number" placeholder="0" />
            <F label="Reorder Level" name="reorder_level" type="number" placeholder="10" />
            <F label="Unit Price (NPR)" name="unit_price" type="number" placeholder="0.00" />
            <F label="Expiry Date" name="expiry_date" type="date" />
            <F label="Manufacturer" name="manufacturer" placeholder="Manufacturer name" col={2} />
            <F label="Batch Number" name="batch_number" placeholder="Batch #" />
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer">
            <input type="checkbox" checked={form.is_controlled} onChange={e => setForm(f => ({ ...f, is_controlled: e.target.checked }))} className="accent-teal-600 w-4 h-4" />
            <span className="text-sm text-slate-700 dark:text-slate-300">Controlled Substance</span>
          </label>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 text-sm rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-medium disabled:opacity-50 flex items-center gap-2">
              {saving && <Loader2 size={14} className="animate-spin" />}
              {item ? 'Update Drug' : 'Add to Inventory'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Pharmacy() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  const [activeTab, setActiveTab] = useState('inventory');
  const [alerts, setAlerts] = useState(null);
  const [dispensing, setDispensing] = useState([]);

  const canManage = hasPermission(user?.role, 'pharmacy.manage');

  const loadInventory = useCallback(async () => {
    setLoading(true);
    try {
      const data = await pharmacyAPI.listInventory({});
      setItems(data.items || data || []);
    } catch { setItems([]); }
    finally { setLoading(false); }
  }, []);

  const loadAlerts = useCallback(async () => {
    try {
      const data = await pharmacyAPI.getLowStock();
      setAlerts(data);
    } catch { setAlerts(null); }
  }, []);

  const loadDispensing = useCallback(async () => {
    try {
      const data = await pharmacyAPI.listDispensing({});
      setDispensing(data.items || data || []);
    } catch { setDispensing([]); }
  }, []);

  useEffect(() => {
    loadInventory();
    loadAlerts();
  }, [loadInventory, loadAlerts]);

  useEffect(() => {
    if (activeTab === 'dispensing') loadDispensing();
  }, [activeTab, loadDispensing]);

  const filtered = items.filter(item => {
    if (search && !item.name.toLowerCase().includes(search.toLowerCase()) && !item.generic_name?.toLowerCase().includes(search.toLowerCase())) return false;
    if (categoryFilter && item.category !== categoryFilter) return false;
    if (stockFilter && item.stock_status !== stockFilter) return false;
    return true;
  });

  const handleDelete = async (id) => {
    if (!confirm('Remove this drug from inventory?')) return;
    await pharmacyAPI.deleteInventory(id).catch(() => {});
    loadInventory();
  };

  const totalAlerts = alerts ? (alerts.low_stock?.length || 0) + (alerts.expired?.length || 0) + (alerts.expiring_soon?.length || 0) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Pill size={24} className="text-teal-600" /> Pharmacy
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Drug inventory and dispensing management</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { loadInventory(); loadAlerts(); }} className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          {canManage && (
            <button onClick={() => { setEditItem(null); setShowModal(true); }} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium">
              <Plus size={16} /> Add Drug
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Drugs', value: items.length, color: 'text-slate-900 dark:text-slate-100', bg: 'bg-white dark:bg-slate-900' },
          { label: 'In Stock', value: items.filter(i => i.stock_status === 'ok').length, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-white dark:bg-slate-900' },
          { label: 'Low Stock', value: alerts?.low_stock?.length || 0, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/20' },
          { label: 'Expired / Expiring', value: (alerts?.expired?.length || 0) + (alerts?.expiring_soon?.length || 0), color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950/20' },
        ].map(stat => (
          <div key={stat.label} className={`${stat.bg} border border-slate-200 dark:border-slate-800 rounded-xl p-4`}>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {totalAlerts > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} className="text-amber-600 dark:text-amber-400" />
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">{totalAlerts} Stock Alert{totalAlerts > 1 ? 's' : ''}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            {alerts.low_stock?.slice(0, 3).map(i => (
              <div key={i.id} className="flex items-center justify-between bg-white dark:bg-slate-900 rounded-lg px-3 py-2 border border-amber-100 dark:border-amber-900">
                <span className="font-medium text-slate-800 dark:text-slate-200 truncate">{i.name}</span>
                <span className="ml-2 text-amber-700 dark:text-amber-400 shrink-0">{i.quantity_in_stock} left</span>
              </div>
            ))}
            {alerts.expired?.slice(0, 2).map(i => (
              <div key={i.id} className="flex items-center justify-between bg-white dark:bg-slate-900 rounded-lg px-3 py-2 border border-red-100 dark:border-red-900">
                <span className="font-medium text-slate-800 dark:text-slate-200 truncate">{i.name}</span>
                <span className="ml-2 text-red-600 dark:text-red-400 shrink-0">Expired</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-1 border-b border-slate-200 dark:border-slate-800">
        {['inventory', 'dispensing'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium capitalize border-b-2 -mb-px transition-colors ${activeTab === tab ? 'border-teal-600 text-teal-600 dark:text-teal-400 dark:border-teal-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}>
            {tab === 'inventory' ? `Inventory (${items.length})` : 'Dispensing History'}
          </button>
        ))}
      </div>

      {activeTab === 'inventory' && (
        <>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search drugs…"
                className="w-full pl-8 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
            </div>
            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500">
              <option value="">All Categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={stockFilter} onChange={e => setStockFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500">
              <option value="">All Stock Status</option>
              {Object.entries(STOCK_STATUS).map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}
            </select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16"><Loader2 size={24} className="animate-spin text-teal-600" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
              <Package size={32} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">No drugs found</p>
              {canManage && <p className="text-xs text-slate-400 mt-1">Click "Add Drug" to add inventory</p>}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/60">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Drug</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide hidden md:table-cell">Category</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Stock</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide hidden lg:table-cell">Expiry</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Status</th>
                    {canManage && <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filtered.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${item.is_controlled ? 'bg-red-50 dark:bg-red-950/40' : 'bg-teal-50 dark:bg-teal-950/40'}`}>
                            <Pill size={14} className={item.is_controlled ? 'text-red-500' : 'text-teal-600 dark:text-teal-400'} />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900 dark:text-slate-100 leading-tight">
                              {item.name}
                              {item.is_controlled && <span className="ml-1.5 text-xs text-red-500 font-medium">●</span>}
                            </p>
                            <p className="text-xs text-slate-400 dark:text-slate-500">{item.dosage_form} · {item.strength}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full">{item.category || '—'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <span className={`font-semibold ${item.is_low_stock ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-slate-100'}`}>{item.quantity_in_stock}</span>
                          <span className="text-xs text-slate-400 ml-1">{item.unit}</span>
                          <p className="text-xs text-slate-400 dark:text-slate-500">Reorder: {item.reorder_level}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className={`text-xs ${item.is_expired ? 'text-red-500 font-medium' : item.is_expiring_soon ? 'text-orange-500' : 'text-slate-500 dark:text-slate-400'}`}>
                          {item.expiry_date ? new Date(item.expiry_date).toLocaleDateString() : '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3"><StockBadge item={item} /></td>
                      {canManage && (
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => { setEditItem(item); setShowModal(true); }} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                              <Edit2 size={14} />
                            </button>
                            <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 text-slate-400 hover:text-red-600 dark:hover:text-red-400">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {activeTab === 'dispensing' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          {dispensing.length === 0 ? (
            <div className="text-center py-16">
              <Package size={32} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
              <p className="text-sm text-slate-500 dark:text-slate-400">No dispensing records yet</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Patient</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide hidden sm:table-cell">Items</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {dispensing.map(d => (
                  <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{d.patient_name || '—'}</td>
                    <td className="px-4 py-3 hidden sm:table-cell text-slate-500 dark:text-slate-400">{Array.isArray(d.items) ? `${d.items.length} item${d.items.length > 1 ? 's' : ''}` : '—'}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">NPR {Number(d.total_amount || 0).toFixed(2)}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs">{d.dispensed_at ? new Date(d.dispensed_at).toLocaleDateString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {showModal && (
        <InventoryModal item={editItem} onClose={() => { setShowModal(false); setEditItem(null); }} onSuccess={() => { setShowModal(false); setEditItem(null); loadInventory(); loadAlerts(); }} />
      )}
    </div>
  );
}
