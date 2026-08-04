import React, { useState } from 'react';
import Modal from './Modal.jsx';
import Badge from './Badge.jsx';
import { Utensils, Waves, CalendarClock, StickyNote, ArrowRight, ArrowLeft } from 'lucide-react';
import { formatCurrency, formatDate, nightsBetween, totalGuests } from '../utils/format.js';
import { availabilityStyles } from '../utils/statusStyles.js';

const countryCodes = ['+1', '+44', '+33', '+34', '+49', '+39', '+971', '+20', '+91', '+81'];

export default function BookingFlowModal({ hotel, searchParams, onClose, onSubmit }) {
  const [step, setStep] = useState('offer');
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    passport: '',
    countryCode: '+1',
    phone: '',
    email: '',
    nationality: '',
    travelInfo: '',
  });
  const [errors, setErrors] = useState({});

  if (!hotel) return null;

  const nights = nightsBetween(searchParams.checkIn, searchParams.checkOut);
  const guests = totalGuests(searchParams.rooms);
  const totalPrice = Math.round(hotel.price * searchParams.rooms.length * Math.max(1, nights / Math.max(hotel.minStay, 1)) * 0.6 + hotel.price * searchParams.rooms.length);

  const setField = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const validate = () => {
    const next = {};
    if (!form.firstName.trim()) next.firstName = 'First name is required.';
    if (!form.lastName.trim()) next.lastName = 'Last name is required.';
    if (!form.passport.trim()) next.passport = 'Passport number is required.';
    if (!form.phone.trim()) next.phone = 'Phone number is required.';
    if (!form.email.trim() || !form.email.includes('@')) next.email = 'A valid email is required.';
    if (!form.nationality.trim()) next.nationality = 'Nationality is required.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      hotel,
      searchParams,
      totalPrice,
      customer: {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        passport: form.passport.trim(),
        phone: `${form.countryCode} ${form.phone.trim()}`,
        email: form.email.trim(),
        nationality: form.nationality.trim(),
      },
      travelInfo: form.travelInfo.trim(),
    });
  };

  return (
    <Modal open={!!hotel} onClose={onClose} title={step === 'offer' ? 'Offer details' : 'Guest information'} maxWidth="max-w-2xl">
      {step === 'offer' && (
        <div className="space-y-5">
          <div className="ticket-stub text-white p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-white/60 text-xs uppercase tracking-widest">{hotel.destination}</p>
                <h3 className="font-display text-2xl mt-1">{hotel.name}</h3>
              </div>
              <Badge className={availabilityStyles[hotel.availability] + ' border-white/20 !bg-white/10 !text-white'}>
                {hotel.availability}
              </Badge>
            </div>
            <div className="ticket-perforation my-5" />
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-white/50 text-xs">Check-in</p>
                <p className="font-medium mt-0.5">{formatDate(searchParams.checkIn)}</p>
              </div>
              <div>
                <p className="text-white/50 text-xs">Check-out</p>
                <p className="font-medium mt-0.5">{formatDate(searchParams.checkOut)}</p>
              </div>
              <div>
                <p className="text-white/50 text-xs">Rooms / Guests</p>
                <p className="font-medium mt-0.5">{searchParams.rooms.length} rooms · {guests} guests</p>
              </div>
              <div>
                <p className="text-white/50 text-xs">Total price</p>
                <p className="font-display text-xl text-gold-300 mt-0.5">{formatCurrency(totalPrice, hotel.currency)}</p>
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div className="flex items-center gap-3 bg-navy-900/[0.03] rounded-xl px-4 py-3">
              <Utensils size={18} className="text-navy-900/60" />
              <div>
                <p className="text-xs text-ink-500">Meal plan</p>
                <p className="text-sm font-semibold text-navy-900">{hotel.mealPlan}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-navy-900/[0.03] rounded-xl px-4 py-3">
              <Waves size={18} className="text-navy-900/60" />
              <div>
                <p className="text-xs text-ink-500">Shared pool access</p>
                <p className="text-sm font-semibold text-navy-900">{hotel.sharedPool ? 'Included' : 'Not included'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-navy-900/[0.03] rounded-xl px-4 py-3">
              <CalendarClock size={18} className="text-navy-900/60" />
              <div>
                <p className="text-xs text-ink-500">Minimum stay</p>
                <p className="text-sm font-semibold text-navy-900">{hotel.minStay} nights</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-navy-900/[0.03] rounded-xl px-4 py-3">
              <StickyNote size={18} className="text-navy-900/60" />
              <div>
                <p className="text-xs text-ink-500">Special conditions</p>
                <p className="text-sm font-semibold text-navy-900">{hotel.notes}</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={() => setStep('customer')}
              className="flex items-center gap-2 bg-navy-900 text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-navy-800 transition-colors"
            >
              Continue to guest details <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {step === 'customer' && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="First name" error={errors.firstName}>
              <input className={inputClass(errors.firstName)} value={form.firstName} onChange={(e) => setField('firstName', e.target.value)} />
            </Field>
            <Field label="Last name" error={errors.lastName}>
              <input className={inputClass(errors.lastName)} value={form.lastName} onChange={(e) => setField('lastName', e.target.value)} />
            </Field>
            <Field label="Passport number" error={errors.passport}>
              <input className={inputClass(errors.passport)} value={form.passport} onChange={(e) => setField('passport', e.target.value)} />
            </Field>
            <Field label="Nationality" error={errors.nationality}>
              <input className={inputClass(errors.nationality)} value={form.nationality} onChange={(e) => setField('nationality', e.target.value)} placeholder="e.g. British" />
            </Field>
            <Field label="Phone number" error={errors.phone}>
              <div className="flex gap-2">
                <select
                  value={form.countryCode}
                  onChange={(e) => setField('countryCode', e.target.value)}
                  className="border border-ink-900/10 rounded-lg px-2 py-2.5 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-gold-400"
                >
                  {countryCodes.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <input className={inputClass(errors.phone) + ' flex-1'} value={form.phone} onChange={(e) => setField('phone', e.target.value)} placeholder="700 123 456" />
              </div>
            </Field>
            <Field label="Email" error={errors.email}>
              <input type="email" className={inputClass(errors.email)} value={form.email} onChange={(e) => setField('email', e.target.value)} />
            </Field>
          </div>
          <Field label="Other travel information (optional)">
            <textarea
              rows={3}
              className={inputClass()}
              value={form.travelInfo}
              onChange={(e) => setField('travelInfo', e.target.value)}
              placeholder="Dietary needs, accessibility requests, occasion notes…"
            />
          </Field>

          <div className="flex justify-between pt-2">
            <button
              type="button"
              onClick={() => setStep('offer')}
              className="flex items-center gap-2 text-sm font-semibold text-ink-700 px-4 py-2.5 rounded-lg hover:bg-ink-900/5 transition-colors"
            >
              <ArrowLeft size={16} /> Back
            </button>
            <button
              type="submit"
              className="bg-gold-400 text-navy-900 text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-gold-300 transition-colors"
            >
              Confirm booking
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}

function inputClass(error) {
  return `w-full px-3 py-2.5 rounded-lg border bg-white text-sm focus:outline-none focus:ring-2 transition-shadow ${
    error ? 'border-rose-300 focus:ring-rose-300' : 'border-ink-900/10 focus:ring-gold-400'
  }`;
}

function Field({ label, error, children }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-ink-700 mb-1.5 block">{label}</span>
      {children}
      {error && <span className="text-xs text-rose-600 mt-1 block">{error}</span>}
    </label>
  );
}
