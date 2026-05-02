import { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Users, ChevronLeft, ChevronRight, Info } from 'lucide-react';
import hallService from '../../services/hallService';
import { LoadingOverlay, ErrorMessage, Badge } from '../../components/UI';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const HOURS = Array.from({ length: 15 }, (_, i) => `${(i + 7).toString().padStart(2, '0')}:00`); // 07:00 to 21:00

const AvailabilityView = () => {
  const [data, setData] = useState({ halls: [], classes: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDay, setSelectedDay] = useState(DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]);

  useEffect(() => {
    fetchAvailability();
  }, []);

  const fetchAvailability = async () => {
    try {
      setLoading(true);
      const res = await hallService.getWeeklyAvailability();
      setData(res.data);
      setError(null);
    } catch (err) {
      setError('Failed to load hall availability');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingOverlay message="Loading availability..." />;
  if (error) return <ErrorMessage message={error} onRetry={fetchAvailability} />;

  const getClassesForHallAndDay = (hallId, day) => {
    return data.classes.filter(c => c.hall?._id === hallId && c.dayOfWeek === day);
  };

  const getTimePosition = (time) => {
    const [hours, minutes] = time.split(':').map(Number);
    const startHour = 7;
    const hourHeight = 80;
    return (hours - startHour) * hourHeight + (minutes / 60) * hourHeight;
  };

  const getTimeHeight = (start, end) => {
    const [sH, sM] = start.split(':').map(Number);
    const [eH, eM] = end.split(':').map(Number);
    const durationInMinutes = (eH * 60 + eM) - (sH * 60 + sM);
    return (durationInMinutes / 60) * 80;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">Hall Availability</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm font-medium">Find free slots for your extra classes this week</p>
        </div>
        
        <div className="flex items-center bg-white p-1 rounded-2xl border border-gray-100 shadow-sm w-fit self-start sm:self-auto">
          <button 
            onClick={() => {
              const idx = DAYS.indexOf(selectedDay);
              setSelectedDay(DAYS[idx === 0 ? 6 : idx - 1]);
            }}
            className="p-2 hover:bg-gray-50 rounded-xl transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-400" />
          </button>
          <div className="px-6 font-bold text-gray-900 min-w-[140px] text-center">
            {selectedDay}
          </div>
          <button 
            onClick={() => {
              const idx = DAYS.indexOf(selectedDay);
              setSelectedDay(DAYS[idx === 6 ? 0 : idx + 1]);
            }}
            className="p-2 hover:bg-gray-50 rounded-xl transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Day Selector (Mobile-friendly pills) */}
      <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar lg:hidden">
        {DAYS.map(day => (
          <button
            key={day}
            onClick={() => setSelectedDay(day)}
            className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
              selectedDay === day 
                ? 'bg-primary-600 text-white shadow-lg shadow-primary-200' 
                : 'bg-white text-gray-500 hover:bg-gray-50'
            }`}
          >
            {day.substring(0, 3)}
          </button>
        ))}
      </div>

      {/* Main Grid */}
      <div className="card overflow-hidden p-0 border-none shadow-xl">
        <div className="overflow-x-auto custom-scrollbar">
          <div className="min-w-[800px] relative bg-white">
            
            {/* Header: Halls */}
            <div className="flex border-b border-gray-100 bg-gray-50/50">
              <div className="w-20 flex-shrink-0 border-r border-gray-100" />
              {data.halls.map(hall => (
                <div key={hall._id} className="flex-1 p-4 border-r border-gray-100 last:border-r-0 text-center">
                  <div className="font-bold text-gray-900">{hall.name}</div>
                  <div className="flex items-center justify-center gap-2 mt-1">
                    <span className="text-[10px] font-black text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full uppercase tracking-widest">{hall.code}</span>
                    <div className="flex items-center gap-1 text-[11px] text-gray-500 font-medium">
                      <Users className="w-3 h-3" />
                      {hall.capacity}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Body: Time + Slots */}
            <div className="relative flex" style={{ height: '1120px' }}> {/* 14 hours * 80px */}
              
              {/* Sidebar: Hours */}
              <div className="w-20 flex-shrink-0 border-r border-gray-100 relative bg-gray-50/20">
                {HOURS.map((hour, i) => (
                  <div 
                    key={hour} 
                    className="absolute w-full text-center text-[10px] font-bold text-gray-400 uppercase tracking-tighter"
                    style={{ top: `${i * 80}px`, transform: 'translateY(-50%)' }}
                  >
                    {hour}
                  </div>
                ))}
              </div>

              {/* Grid Content */}
              <div className="flex-1 relative">
                {/* Horizontal lines */}
                {HOURS.map((_, i) => (
                  <div 
                    key={i} 
                    className="absolute w-full h-px bg-gray-50"
                    style={{ top: `${i * 80}px` }}
                  />
                ))}

                {/* Vertical columns for each hall */}
                <div className="absolute inset-0 flex">
                  {data.halls.map(hall => {
                    const classesInDay = getClassesForHallAndDay(hall._id, selectedDay);
                    return (
                      <div key={hall._id} className="flex-1 relative border-r border-gray-100/50 last:border-r-0">
                        {classesInDay.map(cls => (
                          <div
                            key={cls._id}
                            className="absolute left-1 right-1 p-2 rounded-xl bg-primary-100 border border-primary-200 overflow-hidden group hover:z-10 hover:shadow-lg transition-all"
                            style={{
                              top: `${getTimePosition(cls.startTime)}px`,
                              height: `${getTimeHeight(cls.startTime, cls.endTime)}px`
                            }}
                          >
                            <div className="text-[10px] font-black text-primary-700 uppercase tracking-tight truncate leading-tight">
                              {cls.className}
                            </div>
                            <div className="text-[9px] font-bold text-primary-500/80 mt-0.5 truncate uppercase">
                              {cls.startTime}-{cls.endTime}
                            </div>
                            <div className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Badge variant="primary" className="text-[8px] px-1 py-0 scale-90 origin-bottom-right">BOOKED</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Legend / Info */}
      <div className="flex flex-wrap items-center gap-6 px-4 py-3 bg-blue-50/50 rounded-2xl border border-blue-100 text-sm">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-blue-500" />
          <span className="font-semibold text-blue-900">How to book?</span>
        </div>
        <div className="flex items-center gap-2 text-blue-700 font-medium">
          <div className="w-3 h-3 rounded-md bg-primary-100 border border-primary-300" />
          <span>Already Booked</span>
        </div>
        <div className="flex items-center gap-2 text-blue-700 font-medium">
          <div className="w-3 h-3 rounded-md bg-white border border-gray-200" />
          <span>Available Slot</span>
        </div>
        <p className="text-blue-600/80 text-xs ml-auto">
          Empty white spaces are available for booking. Contact Admin to reserve your hall.
        </p>
      </div>
    </div>
  );
};

export default AvailabilityView;


