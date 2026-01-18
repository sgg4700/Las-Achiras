
import React, { useState, useEffect, useRef } from 'react';
import { Booking, BookingStatus, PricingRule, PropertyConfig, DayStatus, PaymentStatus } from '../types';
import { MockBackend } from '../services/mockBackend';
import { getHolidayName } from '../constants';
import { 
  Calendar as CalendarIcon, 
  DollarSign, 
  Settings, 
  List, 
  Check, 
  X, 
  LogOut, 
  ChevronLeft, 
  ChevronRight, 
  UserPlus, 
  Ban, 
  Trash2, 
  Flag, 
  Loader2, 
  Image as ImageIcon, 
  Trash, 
  Upload, 
  ShieldAlert,
  Info,
  TrendingUp,
  Wallet,
  CheckCircle,
  AlertTriangle,
  User,
  Phone,
  Mail,
  FileText,
  Users
} from 'lucide-react';

const AdminDashboard: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<'bookings' | 'calendar' | 'config'>('bookings');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [blockedDates, setBlockedDates] = useState<DayStatus[]>([]);
  const [config, setConfig] = useState<PropertyConfig | null>(null);
  const [pricing, setPricing] = useState<PricingRule | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveFeedback, setShowSaveFeedback] = useState(false);
  
  const [viewDate, setViewDate] = useState(new Date());
  const [adminMode, setAdminMode] = useState<'block' | 'reserve' | 'special_price'>('block');
  const [rangeStart, setRangeStart] = useState<Date | null>(null);
  const [rangeEnd, setRangeEnd] = useState<Date | null>(null);
  const [showManualForm, setShowManualForm] = useState(false);
  
  const [manualPrice, setManualPrice] = useState(0);
  const [manualGuests, setManualGuests] = useState(1);
  const [manualMessage, setManualMessage] = useState('');
  const [manualName, setManualName] = useState('');
  const [manualEmail, setManualEmail] = useState('');
  const [manualPhone, setManualPhone] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const refreshData = async () => {
    const [b, c, p, d] = await Promise.all([
      MockBackend.getBookings(),
      MockBackend.getConfig(),
      MockBackend.getPricing(),
      MockBackend.getBlockedDates()
    ]);
    setBookings([...b]);
    setConfig(c);
    setPricing(p);
    setBlockedDates([...d]);
  };

  useEffect(() => {
    refreshData();
  }, []);

  useEffect(() => {
    const calculatePrice = () => {
      if (!rangeStart || !rangeEnd || !pricing) return;

      let totalBase = 0;
      const start = new Date(rangeStart);
      const end = new Date(rangeEnd);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

      for (let i = 0; i < diffDays; i++) {
        const currentDay = new Date(start);
        currentDay.setDate(start.getDate() + i);
        const dayOfWeek = currentDay.getDay();
        const iso = currentDay.toISOString().split('T')[0];
        
        let dailyRate = pricing.dailyPrice;
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6;
        const isSpecial = pricing.specialPriceDates.includes(iso);
        const isHoliday = !!getHolidayName(currentDay);

        if (isWeekend || isSpecial || isHoliday) {
          dailyRate *= pricing.weekendMultiplier;
        }
        totalBase += dailyRate;
      }

      if (manualGuests > pricing.guestThreshold) {
        totalBase += ((manualGuests - pricing.guestThreshold) * pricing.extraGuestPrice * diffDays);
      }
      setManualPrice(Math.round(totalBase));
    };
    calculatePrice();
  }, [rangeStart, rangeEnd, pricing, manualGuests]);

  const handleBookingAction = async (id: string, status: BookingStatus) => {
    let confirmationMsg = "";
    
    if (status === BookingStatus.APPROVED) {
      confirmationMsg = "¿Confirmar la reserva de Quinta Las Achiras?\n\nAl aceptar, se bloquearán las fechas oficialmente en el calendario.";
    } else if (status === BookingStatus.REJECTED) {
      confirmationMsg = "¿Rechazar esta solicitud de reserva?";
    } else if (status === BookingStatus.CANCELLED) {
      confirmationMsg = "¡ADVERTENCIA CRÍTICA!\n\n¿Seguro que deseas CANCELAR esta reserva ya aprobada?\n\nEsto liberará las fechas inmediatamente en el calendario público.";
    }

    if (!window.confirm(confirmationMsg)) return;
    
    setIsSaving(true);
    try {
      await MockBackend.updateBookingStatus(id, status);
      await refreshData();
    } catch (error) {
      alert("Error al procesar la acción.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDayClick = async (date: Date) => {
    const iso = date.toISOString().split('T')[0];

    if (adminMode === 'block') {
      await MockBackend.toggleDateBlock(iso);
      await refreshData();
    } else if (adminMode === 'special_price') {
      if (!pricing) return;
      const updatedDates = pricing.specialPriceDates.includes(iso)
        ? pricing.specialPriceDates.filter(d => d !== iso)
        : [...pricing.specialPriceDates, iso];
      const newPricing = { ...pricing, specialPriceDates: updatedDates };
      setPricing(newPricing);
      await MockBackend.updatePricing(newPricing);
    } else {
      if (!rangeStart || (rangeStart && rangeEnd)) {
        setRangeStart(date);
        setRangeEnd(null);
        setShowManualForm(false);
      } else {
        if (date < rangeStart) {
          setRangeStart(date);
        } else {
          setRangeEnd(date);
          setShowManualForm(true);
        }
      }
    }
  };

  const createManualBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rangeStart || !rangeEnd) return;
    setIsSaving(true);
    await MockBackend.createBooking({
      guestName: manualName || 'Reserva Manual',
      guestEmail: manualEmail || 'manual@admin.com',
      guestPhone: manualPhone || '-',
      guestCount: manualGuests,
      startDate: rangeStart.toISOString(),
      endDate: rangeEnd.toISOString(),
      totalPrice: manualPrice,
      status: BookingStatus.APPROVED,
      isManual: true,
      message: manualMessage
    });
    
    setShowManualForm(false);
    setRangeStart(null);
    setRangeEnd(null);
    setManualName('');
    setManualEmail('');
    setManualPhone('');
    setManualMessage('');
    setManualGuests(1);
    
    await refreshData();
    setIsSaving(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !config) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setConfig({ ...config, images: [...config.images, base64] });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    if (!config) return;
    const newImages = [...config.images];
    newImages.splice(index, 1);
    setConfig({ ...config, images: newImages });
  };

  const handleSaveAll = async () => {
    if (!config || !pricing) return;
    setIsSaving(true);
    try {
      await Promise.all([
        MockBackend.updateConfig(config),
        MockBackend.updatePricing(pricing)
      ]);
      setShowSaveFeedback(true);
      setTimeout(() => setShowSaveFeedback(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const getDateStatus = (date: Date) => {
    const iso = date.toISOString().split('T')[0];
    const blocked = blockedDates.some(d => d.date === iso);
    const booking = bookings.find(b => {
      if (b.status !== BookingStatus.APPROVED) return false;
      const s = new Date(b.startDate); s.setHours(0,0,0,0);
      const e = new Date(b.endDate); e.setHours(0,0,0,0);
      const c = new Date(date); c.setHours(0,0,0,0);
      return c >= s && c <= e;
    });
    return { blocked, booked: !!booking };
  };

  const isDayInSelection = (date: Date) => {
    if (!rangeStart || !rangeEnd) return false;
    const s = new Date(rangeStart); s.setHours(0,0,0,0);
    const e = new Date(rangeEnd); e.setHours(0,0,0,0);
    const c = new Date(date); c.setHours(0,0,0,0);
    return c >= s && c <= e;
  };

  if (!config || !pricing) return <div className="p-10 text-center text-gray-400"><Loader2 className="animate-spin inline mr-2"/> Cargando...</div>;

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <header className="bg-white border-b px-6 py-4 flex justify-between items-center shadow-sm sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg">A</div>
          <h1 className="text-xl font-bold text-gray-800 hidden md:block tracking-tight">Achiras <span className="text-xs font-medium text-gray-400 ml-2 uppercase tracking-widest bg-gray-100 px-2 py-1 rounded">Admin</span></h1>
        </div>
        <div className="flex items-center gap-4">
          {isSaving && <Loader2 className="animate-spin text-brand-600" size={20}/>}
          {showSaveFeedback && <span className="text-green-600 font-bold text-sm animate-bounce flex items-center gap-1"><CheckCircle size={16}/> Sincronizado</span>}
          <button onClick={onLogout} className="text-gray-500 hover:text-red-600 flex items-center gap-2 font-bold transition-colors bg-gray-50 px-4 py-2 rounded-xl"><LogOut size={18} /> Salir</button>
        </div>
      </header>

      <div className="flex-1 max-w-7xl mx-auto w-full mt-6 px-4 flex flex-col md:flex-row gap-6 pb-20">
        <aside className="w-full md:w-64 space-y-2 shrink-0">
          <button onClick={() => setActiveTab('bookings')} className={`w-full flex items-center p-4 rounded-2xl transition-all font-bold ${activeTab === 'bookings' ? 'bg-brand-600 text-white shadow-xl shadow-brand-100' : 'bg-white text-gray-500 hover:bg-gray-100'}`}>
            <List size={20} className="mr-3" /> Solicitudes
            {bookings.filter(b => b.status === BookingStatus.PENDING).length > 0 && (
              <span className="ml-auto bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full ring-2 ring-white font-black animate-pulse">{bookings.filter(b => b.status === BookingStatus.PENDING).length}</span>
            )}
          </button>
          <button onClick={() => setActiveTab('calendar')} className={`w-full flex items-center p-4 rounded-2xl transition-all font-bold ${activeTab === 'calendar' ? 'bg-brand-600 text-white shadow-xl shadow-brand-100' : 'bg-white text-gray-500 hover:bg-gray-100'}`}>
            <CalendarIcon size={20} className="mr-3" /> Calendario
          </button>
          <button onClick={() => setActiveTab('config')} className={`w-full flex items-center p-4 rounded-2xl transition-all font-bold ${activeTab === 'config' ? 'bg-brand-600 text-white shadow-xl shadow-brand-100' : 'bg-white text-gray-500 hover:bg-gray-100'}`}>
            <Settings size={20} className="mr-3" /> Tarifas y Web
          </button>
        </aside>

        <main className="flex-1 space-y-6 min-w-0">
          {activeTab === 'bookings' && (
            <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b bg-gray-50/50 flex justify-between items-center">
                <h2 className="font-black text-gray-800 tracking-tight flex items-center gap-2 uppercase text-[10px] tracking-widest"><Wallet className="text-brand-600" size={16}/> Caja y Reservas</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[950px]">
                  <thead className="bg-gray-50/50">
                    <tr>
                      <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Huésped</th>
                      <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Estadía</th>
                      <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Saldos</th>
                      <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {bookings.slice().reverse().map((b) => {
                      const isPending = b.status === BookingStatus.PENDING;
                      const isApproved = b.status === BookingStatus.APPROVED;
                      const isCancelled = b.status === BookingStatus.CANCELLED || b.status === BookingStatus.REJECTED;
                      const balance = b.totalPrice - (b.depositAmount || 0);
                      
                      return (
                        <tr key={b.id} className={`${isCancelled ? 'opacity-40 bg-gray-50/50' : ''} hover:bg-gray-50/80 transition-colors`}>
                          <td className="px-6 py-5">
                            <div className="font-bold text-gray-900 flex items-center gap-2">
                              {b.guestName} 
                              {b.isManual && <span className="text-[8px] bg-brand-50 text-brand-700 px-1.5 py-0.5 rounded-full font-black uppercase">Manual</span>}
                            </div>
                            <div className="text-[10px] text-gray-500 font-medium mt-1">{b.guestPhone} | {b.guestEmail}</div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="text-xs font-black text-gray-800">{new Date(b.startDate).toLocaleDateString()} al {new Date(b.endDate).toLocaleDateString()}</div>
                            <div className="text-brand-700 font-black text-sm mt-1">${b.totalPrice.toLocaleString()} ARS</div>
                          </td>
                          <td className="px-6 py-5">
                            {!isCancelled && (
                              <div className="flex flex-col gap-2">
                                <select 
                                  value={b.paymentStatus} 
                                  onChange={(e) => MockBackend.updatePaymentStatus(b.id, e.target.value as PaymentStatus).then(refreshData)}
                                  className="text-[10px] font-black uppercase border-2 rounded-xl px-2 py-1 outline-none transition-all"
                                >
                                  <option value={PaymentStatus.PENDING}>Pendiente</option>
                                  <option value={PaymentStatus.PARTIAL}>Seña Recibida</option>
                                  <option value={PaymentStatus.FULL}>Pagado Total</option>
                                </select>
                                {b.paymentStatus === PaymentStatus.PARTIAL && (
                                  <div className="space-y-1 p-2 bg-brand-50 rounded-xl border border-brand-100">
                                    <div className="flex items-center justify-between text-[10px] font-black text-gray-600">
                                      <span>Seña:</span>
                                      <input 
                                        type="number" className="w-16 bg-white border border-brand-200 text-right px-1" 
                                        value={b.depositAmount || ''} onChange={(e) => MockBackend.updateDepositAmount(b.id, Number(e.target.value)).then(refreshData)}
                                      />
                                    </div>
                                    <div className="text-[9px] font-black text-red-600 flex justify-between pt-1 border-t border-brand-100">
                                      <span>RESTA:</span>
                                      <span>${balance.toLocaleString()}</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-5 text-center">
                            <div className="flex gap-2 justify-center">
                              {isPending && (
                                <>
                                  <button 
                                    onClick={() => handleBookingAction(b.id, BookingStatus.APPROVED)} 
                                    className="p-3 bg-green-600 text-white rounded-xl shadow-lg hover:scale-110 transition-all flex items-center justify-center gap-2"
                                    disabled={isSaving}
                                  >
                                    <Check size={16}/> <span className="text-[10px] font-black uppercase">Aceptar</span>
                                  </button>
                                  <button 
                                    onClick={() => handleBookingAction(b.id, BookingStatus.REJECTED)} 
                                    className="p-3 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition-all"
                                    disabled={isSaving}
                                  >
                                    <Trash2 size={16}/>
                                  </button>
                                </>
                              )}
                              {isApproved && (
                                <button 
                                  onClick={() => handleBookingAction(b.id, BookingStatus.CANCELLED)} 
                                  className="text-[10px] text-red-600 font-black uppercase px-4 py-2 border-2 border-red-100 rounded-xl hover:bg-red-50 flex items-center gap-2"
                                  disabled={isSaving}
                                >
                                  <AlertTriangle size={14}/> Cancelar Reserva
                                </button>
                              )}
                              {isCancelled && <div className="text-[10px] font-black text-gray-300 uppercase px-3 py-1 border border-gray-100 rounded-lg">{b.status}</div>}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'calendar' && (
            <div className="space-y-6">
              <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100 w-fit mx-auto gap-1">
                 <button onClick={() => setAdminMode('block')} className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all ${adminMode === 'block' ? 'bg-gray-800 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'}`}><Ban size={16}/> Bloquear</button>
                 <button onClick={() => setAdminMode('reserve')} className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all ${adminMode === 'reserve' ? 'bg-brand-600 text-white shadow-lg shadow-brand-100' : 'text-gray-400 hover:bg-gray-50'}`}><UserPlus size={16}/> Cargar Reserva</button>
                 <button onClick={() => setAdminMode('special_price')} className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all ${adminMode === 'special_price' ? 'bg-yellow-500 text-white shadow-lg shadow-yellow-100' : 'text-gray-400 hover:bg-gray-50'}`}><DollarSign size={16}/> Precio Especial</button>
              </div>

              {showManualForm && (
                <div className="bg-white p-8 rounded-[32px] shadow-2xl border-4 border-brand-500 animate-fade-in-up">
                  <div className="flex justify-between items-center mb-6 border-b pb-4">
                    <h3 className="font-black text-xl text-gray-900">Nueva Reserva Manual</h3>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Días Seleccionados</p>
                      <p className="font-bold text-brand-600">{rangeStart?.toLocaleDateString()} - {rangeEnd?.toLocaleDateString()}</p>
                    </div>
                  </div>
                  <form onSubmit={createManualBooking} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase flex items-center gap-1"><User size={12}/> Huésped</label>
                        <input value={manualName} onChange={e => setManualName(e.target.value)} required className="w-full border-2 border-gray-100 p-4 rounded-2xl font-bold focus:border-brand-500 outline-none" placeholder="Nombre completo" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase flex items-center gap-1"><Mail size={12}/> Email</label>
                        <input type="email" value={manualEmail} onChange={e => setManualEmail(e.target.value)} className="w-full border-2 border-gray-100 p-4 rounded-2xl font-bold focus:border-brand-500 outline-none" placeholder="ejemplo@correo.com" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase flex items-center gap-1"><Phone size={12}/> WhatsApp / Tel</label>
                        <input type="tel" value={manualPhone} onChange={e => setManualPhone(e.target.value)} className="w-full border-2 border-gray-100 p-4 rounded-2xl font-bold focus:border-brand-500 outline-none" placeholder="+54 ..." />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase flex items-center gap-1"><Users size={12}/> Cantidad de Personas</label>
                        <input type="number" min="1" value={manualGuests} onChange={e => setManualGuests(Number(e.target.value))} required className="w-full border-2 border-gray-100 p-4 rounded-2xl font-bold focus:border-brand-500 outline-none" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase flex items-center gap-1"><FileText size={12}/> Notas de la Reserva</label>
                      <textarea rows={2} value={manualMessage} onChange={e => setManualMessage(e.target.value)} className="w-full border-2 border-gray-100 p-4 rounded-2xl font-bold focus:border-brand-500 outline-none resize-none" placeholder="Algún recordatorio o detalle extra..." />
                    </div>
                    <div className="bg-brand-50 p-6 rounded-2xl border-2 border-brand-100 flex justify-between items-center">
                      <div>
                        <label className="text-[10px] font-black text-brand-700 uppercase tracking-widest block mb-1">Precio a Cobrar ($)</label>
                        <p className="text-[9px] text-brand-600 font-bold italic opacity-70">Precio sugerido: ${manualPrice.toLocaleString()}</p>
                      </div>
                      <input type="number" value={manualPrice} onChange={e => setManualPrice(Number(e.target.value))} required className="border-2 border-brand-500 p-4 rounded-2xl font-black text-brand-700 text-2xl outline-none w-48 text-right bg-white" />
                    </div>
                    <div className="flex gap-4">
                      <button type="submit" disabled={isSaving} className="flex-1 bg-brand-600 text-white py-5 rounded-2xl font-black text-lg hover:bg-brand-700 shadow-xl transition-all flex items-center justify-center gap-3">
                        {isSaving ? <Loader2 className="animate-spin"/> : <CheckCircle size={24}/>} BLOQUEAR Y GUARDAR
                      </button>
                      <button type="button" onClick={() => {setShowManualForm(false); setRangeStart(null); setRangeEnd(null);}} className="px-8 bg-gray-100 text-gray-500 font-black uppercase text-xs rounded-2xl tracking-widest hover:bg-gray-200">Cerrar</button>
                    </div>
                  </form>
                </div>
              )}

              <div className="bg-white p-10 rounded-[40px] shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-10">
                  <button onClick={() => setViewDate(new Date(year, month - 1))} className="p-4 hover:bg-gray-50 rounded-2xl border transition-all"><ChevronLeft size={24}/></button>
                  <h3 className="text-2xl font-black capitalize tracking-tight text-gray-800">{viewDate.toLocaleDateString('es-ES', {month: 'long', year: 'numeric'})}</h3>
                  <button onClick={() => setViewDate(new Date(year, month + 1))} className="p-4 hover:bg-gray-50 rounded-2xl border transition-all"><ChevronRight size={24}/></button>
                </div>
                <div className="grid grid-cols-7 gap-4">
                  {['DOM','LUN','MAR','MIÉ','JUE','VIE','SÁB'].map(d => <div key={d} className="text-center text-[10px] font-black text-gray-300 uppercase tracking-widest">{d}</div>)}
                  {Array.from({length: firstDayOfWeek}).map((_, i) => <div key={`e-${i}`} />)}
                  {Array.from({length: daysInMonth}, (_, i) => {
                    const d = new Date(year, month, i + 1);
                    const iso = d.toISOString().split('T')[0];
                    const holiday = getHolidayName(d);
                    const { blocked, booked } = getDateStatus(d);
                    const isSpecial = pricing.specialPriceDates.includes(iso);
                    const isSelected = isDayInSelection(d) || rangeStart?.toDateString() === d.toDateString() || rangeEnd?.toDateString() === d.toDateString();
                    return (
                      <button 
                        key={i} onClick={() => handleDayClick(d)} 
                        className={`h-20 rounded-2xl border-2 flex flex-col items-center justify-center transition-all relative group
                          ${booked ? 'bg-red-50 border-red-100 text-red-700' : 
                            blocked ? 'bg-gray-800 border-gray-900 text-white shadow-2xl' : 
                            'bg-white border-gray-100 hover:border-brand-300'} 
                          ${isSelected ? 'bg-brand-700 border-brand-800 text-white z-10 scale-105 shadow-xl shadow-brand-200' : ''}
                          ${isSpecial && !isSelected && !blocked && !booked ? 'bg-yellow-50 border-yellow-200 ring-4 ring-yellow-50' : ''}`}
                      >
                        <span className="text-lg font-black">{d.getDate()}</span>
                        {holiday && <Flag size={12} className="text-blue-500 mt-1 fill-blue-500" />}
                        {isSpecial && <DollarSign size={12} className="text-yellow-600 absolute top-2 right-2 font-black" />}
                        {booked && <div className="absolute bottom-2 text-[8px] font-black uppercase opacity-50 tracking-tighter">Ocupado</div>}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'config' && (
            <div className="space-y-6 pb-20">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                  <div className="bg-white p-8 rounded-[32px] shadow-sm border border-brand-100">
                    <h3 className="font-black mb-6 text-gray-800 flex items-center gap-3 text-lg uppercase tracking-tight"><ShieldAlert size={24} className="text-brand-600"/> Reglas y Políticas</h3>
                    <textarea 
                      rows={10} className="w-full border-2 border-gray-100 p-6 rounded-2xl outline-none focus:ring-4 focus:ring-brand-50 text-sm font-medium leading-relaxed bg-gray-50/30" 
                      value={config.rulesAndPolicies} onChange={e => setConfig({...config, rulesAndPolicies: e.target.value})} 
                    />
                  </div>
                  <div className="bg-white p-8 rounded-[32px] shadow-sm border border-brand-100">
                    <h3 className="font-black mb-6 text-gray-800 flex items-center gap-3 text-lg uppercase tracking-tight"><ImageIcon size={24} className="text-brand-600"/> Galería de Quinta Las Achiras</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {config.images.map((img, idx) => (
                        <div key={idx} className="relative group rounded-2xl overflow-hidden aspect-[4/3] border-2 border-gray-100 bg-gray-50 shadow-sm transition-all hover:border-brand-300">
                          <img src={img} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                          <button onClick={() => removeImage(idx)} className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity shadow-lg shadow-red-200"><Trash size={14}/></button>
                        </div>
                      ))}
                      <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center justify-center border-4 border-dashed border-gray-100 rounded-2xl hover:bg-brand-50 h-full min-h-[120px] text-gray-300 transition-all hover:border-brand-300 group">
                        <Upload size={32} className="group-hover:text-brand-500 transition-colors"/>
                        <span className="text-[10px] font-black mt-3 uppercase tracking-widest group-hover:text-brand-600">Subir Foto</span>
                      </button>
                      <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleFileUpload}/>
                    </div>
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="bg-white p-8 rounded-[32px] shadow-sm border border-brand-100 space-y-8 sticky top-24">
                    <h3 className="font-black text-gray-800 flex items-center gap-2 uppercase text-xs tracking-widest border-b border-gray-100 pb-4"><TrendingUp className="text-brand-600" size={18}/> Tarifas y Reglas</h3>
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase flex items-center gap-1">Precio Base (X Día/Noche)</label>
                        <div className="relative">
                          <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-600" size={20}/>
                          <input type="number" min="0" className="w-full border-2 border-gray-100 p-5 pl-12 rounded-2xl font-black text-2xl text-gray-800 outline-none focus:border-brand-500" value={pricing.dailyPrice} onChange={e => setPricing({...pricing, dailyPrice: Math.max(0, Number(e.target.value))})}/>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase">Multiplicador Feriado</label>
                        <input type="number" step="0.1" min="1" className="w-full border-2 border-gray-100 p-5 rounded-2xl font-black text-xl text-gray-800 outline-none focus:border-brand-500" value={pricing.weekendMultiplier} onChange={e => setPricing({...pricing, weekendMultiplier: Math.max(1, Number(e.target.value))})}/>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase">Huéspedes Incluidos</label>
                        <input type="number" min="1" className="w-full border-2 border-gray-100 p-5 rounded-2xl font-black text-xl text-gray-800 outline-none focus:border-brand-500" value={pricing.guestThreshold} onChange={e => setPricing({...pricing, guestThreshold: Math.max(1, Number(e.target.value))})}/>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase">Precio x Persona Extra</label>
                        <input type="number" min="0" className="w-full border-2 border-gray-100 p-5 rounded-2xl font-black text-xl text-gray-800 outline-none focus:border-brand-500" value={pricing.extraGuestPrice} onChange={e => setPricing({...pricing, extraGuestPrice: Math.max(0, Number(e.target.value))})}/>
                      </div>
                    </div>
                    <button onClick={handleSaveAll} className="w-full bg-brand-600 text-white py-5 rounded-[24px] font-black text-lg shadow-xl shadow-brand-100 flex items-center justify-center gap-3 hover:bg-brand-700 transition-all">
                      {isSaving ? <Loader2 className="animate-spin"/> : <CheckCircle size={24}/>} GUARDAR CONFIGURACIÓN
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
