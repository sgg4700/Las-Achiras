
import { PropertyConfig, PricingRule } from './types';

export const INITIAL_PROPERTY_CONFIG: PropertyConfig = {
  name: "Quinta Las Achiras",
  address: "Funes, Santa Fe",
  maxCapacity: 20,
  description: "Hermosa casa quinta con amplia piscina, quincho cerrado y parque arbolado. Ideal para desconectar o realizar eventos familiares tranquilos en el corazón de Funes.",
  rulesAndPolicies: "REGLAS DE LA CASA:\n- No se permiten fiestas electrónicas ni ruidos molestos.\n- Música a volumen moderado después de las 22hs.\n- Cuidar la limpieza de la piscina y el mobiliario.\n\nPOLÍTICA DE CANCELACIÓN:\n- Reembolso del 50% cancelando hasta 7 días antes de la fecha.",
  aiSystemInstruction: "Eres el asistente virtual de 'Quinta Las Achiras' en Funes. Tu tono es amable, comercial y servicial. Responde dudas sobre disponibilidad, precios estimados y reglas de la casa. No confirmes reservas, solo guía al usuario a completar el formulario.",
  images: [
    "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=800&q=80"
  ]
};

export const INITIAL_PRICING: PricingRule = {
  dailyPrice: 60000,
  weekendMultiplier: 1.3,
  guestThreshold: 10,
  extraGuestPrice: 5000,
  specialPriceDates: []
};

export const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: '1234'
};

export const HOLIDAYS_ARGENTINA: Record<string, string> = {
  "2026-01-01": "Año Nuevo",
  "2026-02-16": "Carnaval",
  "2026-02-17": "Carnaval",
  "2026-03-24": "Día de la Memoria",
  "2026-04-02": "Malvinas",
  "2026-04-03": "Viernes Santo",
  "2026-05-01": "Día del Trabajador",
  "2026-05-25": "Revolución de Mayo",
  "2026-06-20": "Día de la Bandera",
  "2026-07-09": "Día de la Independencia",
  "2026-12-08": "Inmaculada Concepción",
  "2026-12-25": "Navidad",
};

export const getHolidayName = (date: Date): string | null => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const iso = `${y}-${m}-${d}`;
  return HOLIDAYS_ARGENTINA[iso] || null;
};
