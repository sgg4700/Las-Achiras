
import React, { useState, useEffect } from 'react';
import { Booking, PropertyConfig, DayStatus, BookingStatus } from '../types';
import { MockBackend } from '../services/mockBackend';
import { getHolidayName } from '../constants';
import BookingForm from '../components/BookingForm';
// Added Image as ImageIcon to imports from lucide-react
import { Calendar, MapPin, Users, Sun, CheckCircle, Info, ChevronLeft, ChevronRight, Flag, Loader2, Maximize, X, Image as ImageIcon } from 'lucide-react';

const PublicHome: React.FC = () => {
  const [config, setConfig] = useState<PropertyConfig | null>(null);
  const [rangeStart, setRangeStart] = useState<Date | null>(null);
  const [rangeEnd, setRangeEnd] = useState<Date | null>(null);
  const [bookingStep, setBookingStep] = useState<'calendar' | 'form' | 'success'>('calendar');
  const [viewDate, setViewDate] = useState(new Date());
  const [blockedDates, setBlockedDates] = useState<DayStatus[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);

  // Gallery viewer state
  const [selectedImage, setSelectedImage] = useState<number | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setConfig(await MockBackend.getConfig());
      setBlockedDates(await MockBackend.getBlockedDates());
      setBookings(await MockBackend.getBookings());
    };
    loadData();
  }, []);

  const isDateBlocked = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const iso = `${y}-${m}-${d}`;
    
    const isManualBlock = blockedDates.some(d => d.date === iso && d.isBlocked);
    const isBooked = bookings.some(b => {
      if (b.status !== BookingStatus.APPROVED) return false;
      const start = new Date(b.startDate);
      const end = new Date(b.endDate);
      start.setHours(0,0,0,0);
      end.setHours(0,0,0,0);
      const check = new Date(date);
      check.setHours(0,0,0,0);
      return check >= start && check <= end;
    });
    return isManualBlock || isBooked;
  };

  const handleDateClick = (date: Date) => {
    const today = new Date();
    today.setHours(0,0,0,0);
    if (date < today || isDateBlocked(date)) return;

    if (!rangeStart || (rangeStart && rangeEnd)) {
      setRangeStart(date);
      setRangeEnd(null);
    } else if (rangeStart && !rangeEnd) {
      if (date < rangeStart) {
        setRangeStart(date);
      } else {
        let hasBlockedInBetween = false;
        let temp = new Date(rangeStart);
        while (temp <= date) {
          if (isDateBlocked(temp)) {
            hasBlockedInBetween = true;
            break;
          }
          temp.setDate(temp.getDate() + 1);
        }
        if (hasBlockedInBetween) {
          setRangeStart(date);
        } else {
          setRangeEnd(date);
        }
      }
    }
  };

  const isInRange = (date: Date) => {
    if (!rangeStart || !rangeEnd) return false;
    return date >= rangeStart && date <= rangeEnd;
  };

  const changeMonth = (increment: number) => {
    const newDate = new Date(viewDate);
    newDate.setMonth(newDate.getMonth() + increment);
    setViewDate(newDate);
  };

  if (!config) return <div className="flex flex-col justify-center items-center h-screen text-brand-600 font-bold gap-4"><Loader2 className="animate-spin" size={40} /> Cargando...</div>;

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const monthName = viewDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  const today = new Date();
  today.setHours(0,0,0,0);

  return (
    <div className="min-h-screen pb-20">
      {/* Lightbox Viewer */}
      {selectedImage !== null && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center animate-fade-in">
          <button 
            onClick={() => setSelectedImage(null)}
            className="absolute top-6 right-6 text-white p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X size={32} />
          </button>
          <div className="relative w-full max-w-5xl px-4 flex items-center justify-center">
            <button 
              onClick={() => setSelectedImage((selectedImage - 1 + config.images.length) % config.images.length)}
              className="absolute left-4 text-white p-4 hover:bg-white/10 rounded-full transition-colors"
            >
              <ChevronLeft size={40} />
            </button>
            <img 
              src={config.images[selectedImage]} 
              alt="Visualizador" 
              className="max-h-[85vh] max-w-full object-contain shadow-2xl rounded-lg"
            />
            <button 
              onClick={() => setSelectedImage((selectedImage + 1) % config.images.length)}
              className="absolute right-4 text-white p-4 hover:bg-white/10 rounded-full transition-colors"
            >
              <ChevronRight size={40} />
            </button>
          </div>
          <p className="text-white/60 mt-6 font-medium">{selectedImage + 1} / {config.images.length}</p>
        </div>
      )}

      {/* Hero Header */}
      <div className="relative h-[65vh] bg-gray-900">
        <img src={config.images[0]} alt="Hero" className="w-full h-full object-cover opacity-70" />
        <div className="absolute inset-0 flex flex-col justify-center items-center text-white p-4 text-center">
          <h1 className="text-4xl md:text-7xl font-bold mb-4 drop-shadow-2xl tracking-tight">{config.name}</h1>
          <p className="text-xl md:text-2xl max-w-2xl drop-shadow-lg font-medium opacity-90">{config.address}</p>
          <a href="#reservar" className="mt-8 px-10 py-4 bg-brand-600 hover:bg-brand-500 rounded-full font-bold text-lg transition-all shadow-2xl hover:scale-105 active:scale-95">
            Ver Disponibilidad
          </a>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-20">
        {/* Main Content Info */}
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          <div className="space-y-8">
            <div className="space-y-4">
               <h2 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">Tu refugio ideal en Funes</h2>
               <div className="w-20 h-1.5 bg-brand-500 rounded-full"></div>
            </div>
            <p className="text-gray-600 leading-relaxed text-lg whitespace-pre-line">{config.description}</p>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="flex items-center space-x-4 text-gray-800 bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                <div className="p-3 bg-brand-50 rounded-xl text-brand-600"><Users size={24} /></div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Capacidad</p>
                  <span className="font-bold text-lg">{config.maxCapacity} Personas</span>
                </div>
              </div>
              <div className="flex items-center space-x-4 text-gray-800 bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                <div className="p-3 bg-brand-50 rounded-xl text-brand-600"><Sun size={24} /></div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Ubicación</p>
                  <span className="font-bold text-lg">Zona Residencial</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-4">
              <h3 className="font-bold text-xl flex items-center gap-3 text-gray-900">
                <Info size={24} className="text-brand-600" /> Información Importante
              </h3>
              <div className="text-gray-600 text-sm whitespace-pre-line leading-loose bg-gray-50 p-6 rounded-2xl border border-dashed border-gray-200">
                {config.rulesAndPolicies}
              </div>
            </div>
          </div>

          {/* Featured Mini Gallery */}
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              {config.images.slice(0, 4).map((img, i) => (
                <div key={i} className="relative group overflow-hidden rounded-2xl aspect-[4/3] shadow-md cursor-pointer" onClick={() => setSelectedImage(i)}>
                  <img src={img} alt={`Vista ${i}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Maximize className="text-white" size={32} />
                  </div>
                </div>
              ))}
            </div>
            <button 
              onClick={() => setSelectedImage(0)}
              className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-gray-800 transition-all flex items-center justify-center gap-3 shadow-xl"
            >
              <ImageIcon size={20} /> Ver Galería Completa ({config.images.length} fotos)
            </button>
          </div>
        </div>

        {/* Booking Calendar Section */}
        <div id="reservar" className="scroll-mt-24">
          <div className="text-center mb-12 space-y-2">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 tracking-tight">Calendario de Reservas</h2>
            <p className="text-gray-500 text-lg">Selecciona las fechas para consultar tarifas y disponibilidad.</p>
          </div>

          <div className="bg-white rounded-[40px] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.08)] overflow-hidden border border-gray-100 flex flex-col md:flex-row min-h-[600px]">
            <div className="p-10 md:w-1/2 border-b md:border-b-0 md:border-r border-gray-100">
              <div className="flex justify-between items-center mb-8">
                <button onClick={() => changeMonth(-1)} className="p-3 hover:bg-brand-50 text-brand-600 rounded-2xl transition-all"><ChevronLeft size={28} /></button>
                <h3 className="font-bold text-2xl capitalize text-gray-800 tracking-tight">{monthName}</h3>
                <button onClick={() => changeMonth(1)} className="p-3 hover:bg-brand-50 text-brand-600 rounded-2xl transition-all"><ChevronRight size={28} /></button>
              </div>
              
              <div className="grid grid-cols-7 gap-3 text-center text-[11px] mb-6 font-black text-gray-400 uppercase tracking-widest">
                {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(d => <div key={d}>{d}</div>)}
              </div>
              
              <div className="grid grid-cols-7 gap-3">
                {Array.from({length: firstDayOfWeek}).map((_, i) => <div key={`e-${i}`} />)}
                {Array.from({length: daysInMonth}, (_, i) => {
                  const d = new Date(year, month, i + 1);
                  const blocked = isDateBlocked(d);
                  const holiday = getHolidayName(d);
                  const isStart = rangeStart?.toDateString() === d.toDateString();
                  const isEnd = rangeEnd?.toDateString() === d.toDateString();
                  const inRange = isInRange(d);
                  const isPast = d < today;

                  return (
                    <button
                      key={i}
                      disabled={blocked || isPast}
                      onClick={() => handleDateClick(d)}
                      title={holiday || (blocked ? 'Fecha Ocupada' : '')}
                      className={`
                        aspect-square rounded-2xl text-base transition-all relative font-bold flex items-center justify-center
                        ${isPast || blocked ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-brand-50 hover:text-brand-600'}
                        ${blocked && !isPast ? 'bg-red-50 text-red-300' : ''}
                        ${inRange || isStart || isEnd ? 'bg-brand-600 text-white shadow-xl z-10 scale-105 hover:bg-brand-700 hover:text-white' : ''}
                        ${holiday && !inRange && !isStart && !isEnd ? 'ring-2 ring-blue-400 ring-inset bg-blue-50/50' : ''}
                      `}
                    >
                      {d.getDate()}
                      {holiday && !inRange && !isStart && !isEnd && (
                        <div className="absolute top-2 right-2">
                          <Flag size={10} className="text-blue-500 fill-blue-500" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="mt-12 flex flex-wrap gap-6 text-[10px] font-black uppercase tracking-widest text-gray-400 justify-center">
                 <div className="flex items-center gap-2"><div className="w-3 h-3 bg-white border border-gray-200 rounded-md"></div> Libre</div>
                 <div className="flex items-center gap-2"><div className="w-3 h-3 bg-red-50 border border-red-100 rounded-md"></div> Ocupado</div>
                 <div className="flex items-center gap-2"><div className="w-3 h-3 bg-blue-50 ring-2 ring-blue-400 rounded-md"></div> Feriado</div>
                 <div className="flex items-center gap-2"><div className="w-3 h-3 bg-brand-600 rounded-md shadow-sm"></div> Tu Selección</div>
              </div>
            </div>

            <div className="p-10 md:w-1/2 bg-gray-50 flex flex-col justify-center">
              {bookingStep === 'calendar' && (
                <div className="space-y-8 text-center animate-fade-in">
                  {!rangeStart && (
                    <div className="space-y-4">
                      <div className="w-20 h-20 bg-brand-100 rounded-full flex items-center justify-center mx-auto text-brand-600"><Calendar size={32} /></div>
                      <h4 className="text-xl font-bold text-gray-800">Planifica tu estadía</h4>
                      <p className="text-gray-500 max-w-xs mx-auto">Selecciona tu fecha de ingreso en el calendario para comenzar.</p>
                    </div>
                  )}
                  {rangeStart && !rangeEnd && (
                    <div className="space-y-4">
                      <div className="w-20 h-20 bg-brand-600 rounded-full flex items-center justify-center mx-auto text-white shadow-xl shadow-brand-100 animate-bounce"><Calendar size={32} /></div>
                      <h4 className="text-xl font-bold text-brand-600">¡Genial!</h4>
                      <p className="text-gray-600 font-medium">Ahora selecciona el día de salida.</p>
                    </div>
                  )}
                  {rangeStart && rangeEnd && (
                    <div className="space-y-8 animate-fade-in">
                      <div className="bg-white p-8 rounded-[32px] shadow-sm border border-brand-100 ring-8 ring-brand-50">
                        <p className="text-[10px] text-brand-600 font-black uppercase tracking-widest mb-4">Fechas confirmadas</p>
                        <div className="flex items-center justify-between text-gray-800">
                          <div className="text-left">
                            <p className="text-xs text-gray-400 font-bold uppercase">Ingreso</p>
                            <p className="font-black text-xl">{rangeStart.toLocaleDateString()}</p>
                          </div>
                          <div className="h-px w-8 bg-gray-200"></div>
                          <div className="text-right">
                            <p className="text-xs text-gray-400 font-bold uppercase">Egreso</p>
                            <p className="font-black text-xl">{rangeEnd.toLocaleDateString()}</p>
                          </div>
                        </div>
                      </div>
                      <button onClick={() => setBookingStep('form')} className="w-full py-6 bg-brand-600 text-white rounded-3xl font-black text-lg hover:bg-brand-700 shadow-[0_20px_40px_-12px_rgba(22,163,74,0.3)] transition-all hover:scale-[1.02] active:scale-95">
                        Continuar Reserva
                      </button>
                      <button onClick={() => { setRangeStart(null); setRangeEnd(null); }} className="text-sm text-gray-400 hover:text-gray-900 font-bold underline underline-offset-4 decoration-2">Elegir otras fechas</button>
                    </div>
                  )}
                </div>
              )}
              {bookingStep === 'form' && <BookingForm range={{start: rangeStart!, end: rangeEnd!}} onSuccess={() => setBookingStep('success')} onCancel={() => setBookingStep('calendar')} />}
              {bookingStep === 'success' && (
                <div className="text-center animate-fade-in space-y-6 max-w-sm mx-auto">
                  <div className="w-28 h-28 bg-green-100 rounded-full flex items-center justify-center mx-auto shadow-inner ring-8 ring-green-50">
                    <CheckCircle className="text-green-600" size={56} />
                  </div>
                  <h3 className="text-4xl font-black text-gray-900">¡Recibido!</h3>
                  <p className="text-gray-600 text-lg leading-relaxed font-medium">Hemos registrado tu solicitud. El dueño se pondrá en contacto contigo a la brevedad para los detalles finales.</p>
                  <button onClick={() => { setRangeStart(null); setRangeEnd(null); setBookingStep('calendar'); }} className="mt-4 px-8 py-3 bg-white border-2 border-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-50 transition-all">Hacer otra consulta</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicHome;
