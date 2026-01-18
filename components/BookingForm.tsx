
import React, { useState, useEffect } from 'react';
import { Booking } from '../types';
import { MockBackend } from '../services/mockBackend';
import { getHolidayName } from '../constants';

interface BookingFormProps {
  range: { start: Date; end: Date } | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const BookingForm: React.FC<BookingFormProps> = ({ range, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    guests: 1,
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [estimatedPrice, setEstimatedPrice] = useState(0);
  const [maxCap, setMaxCap] = useState(20);

  useEffect(() => {
    const calculate = async () => {
      if (!range) return;
      const pricing = await MockBackend.getPricing();
      const config = await MockBackend.getConfig();
      setMaxCap(config.maxCapacity);

      let totalBase = 0;
      const start = new Date(range.start);
      const end = new Date(range.end);
      
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

      if (formData.guests > pricing.guestThreshold) {
        const extraPerDay = (formData.guests - pricing.guestThreshold) * pricing.extraGuestPrice;
        totalBase += (extraPerDay * diffDays);
      }

      setEstimatedPrice(Math.round(totalBase));
    };

    calculate();
  }, [formData.guests, range]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!range) return;

    setLoading(true);
    try {
      await MockBackend.createBooking({
        guestName: formData.name,
        guestEmail: formData.email,
        guestPhone: formData.phone,
        guestCount: formData.guests,
        startDate: range.start.toISOString(),
        endDate: range.end.toISOString(),
        totalPrice: estimatedPrice,
        message: formData.message
      });
      onSuccess();
    } catch (error) {
      console.error(error);
      alert('Error al enviar la solicitud.');
    } finally {
      setLoading(false);
    }
  };

  if (!range) return null;

  return (
    <div className="bg-white p-6 rounded-lg shadow-xl border border-gray-100 animate-fade-in">
      <h3 className="text-xl font-bold mb-4 text-gray-800">Solicitar Pre-Reserva</h3>
      <div className="mb-4 text-sm text-gray-600 bg-brand-50 p-3 rounded border border-brand-100">
        <p><strong>Desde:</strong> {range.start.toLocaleDateString()}</p>
        <p><strong>Hasta:</strong> {range.end.toLocaleDateString()}</p>
        <p className="text-lg font-semibold text-brand-700 mt-2">
          Presupuesto Estimado: ${estimatedPrice.toLocaleString()} ARS
        </p>
        <p className="text-[10px] text-gray-400 mt-1 italic">Tarifa calculada según fechas (feriados/findes aplican cargos).</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Nombre Completo</label>
          <input 
            type="text" required 
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 p-2 border"
            value={formData.name}
            onChange={e => setFormData({...formData, name: e.target.value})}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input 
              type="email" required 
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 p-2 border"
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Teléfono</label>
            <input 
              type="tel" required 
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 p-2 border"
              value={formData.phone}
              onChange={e => setFormData({...formData, phone: e.target.value})}
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Cantidad Personas</label>
          <input 
            type="number" min="1" required 
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 p-2 border"
            value={formData.guests}
            onChange={e => setFormData({...formData, guests: parseInt(e.target.value)})}
          />
        </div>
        {formData.guests > maxCap && (
            <p className="text-xs text-amber-600 font-medium">⚠️ Supera la capacidad máxima recomendada ({maxCap}).</p>
        )}

        <div className="flex gap-3 pt-4">
          <button type="button" onClick={onCancel} className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            Atrás
          </button>
          <button type="submit" disabled={loading} className="flex-1 py-2 px-4 border border-transparent rounded-md text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 font-bold">
            {loading ? 'Enviando...' : 'Pedir Reserva'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BookingForm;
