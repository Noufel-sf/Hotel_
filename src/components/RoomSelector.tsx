import { Plus, Trash2, Users } from 'lucide-react';
import { RoomOccupancy } from '../types';

interface RoomSelectorProps {
  rooms: RoomOccupancy[];
  onChange: (rooms: RoomOccupancy[]) => void;
}

export default function RoomSelector({ rooms, onChange }: RoomSelectorProps) {
  const updateRoom = (index: number, field: keyof RoomOccupancy, value: number) => {
    const next = rooms.map((r, i) => (i === index ? { ...r, [field]: value } : r));
    onChange(next);
  };

  const addRoom = () => onChange([...rooms, { adults: 2, children: 0 }]);
  const removeRoom = (index: number) => onChange(rooms.filter((_, i) => i !== index));

  const totalGuests = rooms.reduce((sum, r) => sum + r.adults + r.children, 0);

  return (
    <div className="space-y-3">
      {rooms.map((room, index) => (
        <div key={index} className="flex items-center gap-3 bg-navy-900/[0.03] rounded-xl px-4 py-3">
          <span className="text-sm font-semibold text-navy-900 w-16 shrink-0">Room {index + 1}</span>
          <label className="flex items-center gap-2 text-sm text-ink-700">
            Adults
            <select
              value={room.adults}
              onChange={(e) => updateRoom(index, 'adults', Number(e.target.value))}
              className="border border-ink-900/10 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-gold-400"
            >
              {[1, 2, 3, 4].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm text-ink-700">
            Children
            <select
              value={room.children}
              onChange={(e) => updateRoom(index, 'children', Number(e.target.value))}
              className="border border-ink-900/10 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-gold-400"
            >
              {[0, 1, 2, 3].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </label>
          <div className="ml-auto">
            {rooms.length > 1 && (
              <button
                type="button"
                onClick={() => removeRoom(index)}
                className="text-ink-300 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                aria-label={`Remove room ${index + 1}`}
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>
      ))}

      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={addRoom}
          className="flex items-center gap-1.5 text-sm font-semibold text-navy-900 hover:text-gold-600 transition-colors"
        >
          <Plus size={16} /> Add another room
        </button>
        <div className="flex items-center gap-1.5 text-sm text-ink-500">
          <Users size={15} />
          {rooms.length} {rooms.length === 1 ? 'room' : 'rooms'} · {totalGuests} guests
        </div>
      </div>
    </div>
  );
}
