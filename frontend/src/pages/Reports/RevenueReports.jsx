import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { DollarSign, TrendingUp, Users, CreditCard, Calendar } from 'lucide-react';
import dashboardService from '../../services/dashboardService';
import { Spinner } from '../../components/UI';
import { useAuth } from '../../context/AuthContext';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const RevenueReports = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const isTeacher = user?.role === 'TEACHER';
  
  const [tab, setTab] = useState(isAdmin ? 'summary' : 'earnings');
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [earnings, setEarnings] = useState([]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState('');

  useEffect(() => { fetchData(); }, [tab, year, month]);

  const fetchData = async () => {
    try {
      setLoading(true);
      if (tab === 'summary') {
        const r = await dashboardService.getRevenueSummary({ year, month: month || undefined });
        setSummary(r.data);
      } else {
        const r = await dashboardService.getTeacherEarnings({ year, month: month || undefined });
        setEarnings(r.data);
      }
    } catch { toast.error('Failed to load report'); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">Revenue Reports</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Financial overview and teacher earnings</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={year} onChange={e => setYear(parseInt(e.target.value))} className="form-input w-auto">
            {[2024,2025,2026,2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select value={month} onChange={e => setMonth(e.target.value)} className="form-input w-auto min-w-[120px]">
            <option value="">Full Year</option>
            {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b">
        {isAdmin && (
          <button onClick={() => setTab('summary')} className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px ${tab === 'summary' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            <TrendingUp className="w-4 h-4" /> Revenue Summary
          </button>
        )}
        <button onClick={() => setTab('earnings')} className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px ${tab === 'earnings' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
          <Users className="w-4 h-4" /> {isAdmin ? 'Teacher Earnings' : 'My Earnings'}
        </button>
      </div>

      {loading ? <div className="flex justify-center py-12"><Spinner size="lg" /></div> : (
        <>
          {tab === 'summary' && summary && (
            <>
              {/* Total */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="card">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-green-50 rounded-xl flex items-center justify-center">
                      <DollarSign className="w-7 h-7 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Total Revenue</p>
                      <p className="text-3xl font-bold text-gray-900">LKR {summary.totals.amount.toLocaleString()}</p>
                      <p className="text-sm text-gray-400">{summary.totals.count} payments</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                {/* By Method */}
                <div className="card">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><CreditCard className="w-5 h-5 text-gray-400" /> By Payment Method</h3>
                  {summary.byMethod.length === 0 ? <p className="text-sm text-gray-400">No data</p> : (
                    <div className="space-y-3">
                      {summary.byMethod.map(m => (
                        <div key={m._id} className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">{m._id || 'Unknown'}</span>
                          <div className="text-right">
                            <span className="font-medium text-sm">LKR {m.total.toLocaleString()}</span>
                            <span className="text-xs text-gray-400 ml-2">({m.count})</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* By Month */}
                <div className="card">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Calendar className="w-5 h-5 text-gray-400" /> Monthly Breakdown</h3>
                  {summary.byMonth.length === 0 ? <p className="text-sm text-gray-400">No data</p> : (
                    <div className="space-y-2">
                      {summary.byMonth.map((m, i) => {
                        const maxVal = Math.max(...summary.byMonth.map(x => x.total));
                        const pct = maxVal > 0 ? (m.total / maxVal * 100) : 0;
                        return (
                          <div key={i}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-600">{MONTHS[m._id.month - 1]} {m._id.year}</span>
                              <span className="font-medium">LKR {m.total.toLocaleString()}</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2">
                              <div className="bg-primary-500 h-2 rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* By Class */}
                <div className="card">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-gray-400" /> By Class</h3>
                  {summary.byClass.length === 0 ? <p className="text-sm text-gray-400">No data</p> : (
                    <div className="space-y-3">
                      {summary.byClass.slice(0, 10).map(c => (
                        <div key={c._id} className="flex items-center justify-between">
                          <div>
                            <div className="text-sm font-medium">{c.className}</div>
                            <div className="text-xs text-gray-400">{c.subject}</div>
                          </div>
                          <div className="text-right">
                            <span className="font-medium text-sm">LKR {c.total.toLocaleString()}</span>
                            <span className="text-xs text-gray-400 ml-2">({c.count})</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {tab === 'earnings' && (
            earnings.length === 0 ? (
              <div className="card text-center py-12">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-50">No earnings data</h3>
              </div>
            ) : (
              <div className="space-y-4">
                {earnings.map((t, i) => (
                  <div key={i} className="card">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-gray-900">{t.teacher?.name || 'Unknown'}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{t.teacher?.email}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500 dark:text-gray-400">Total Revenue: LKR {t.totalRevenue.toLocaleString()}</div>
                        <div className="text-lg font-bold text-green-600">Earnings: LKR {t.totalEarnings.toLocaleString()}</div>
                      </div>
                    </div>
                    <div className="table-container">
                      <table>
                        <thead>
                          <tr><th>Class</th><th>Subject</th><th className="text-right">Revenue</th><th className="text-right">Share %</th><th className="text-right">Earnings</th></tr>
                        </thead>
                        <tbody>
                          {t.classes.map((c, j) => (
                            <tr key={j}>
                              <td className="font-medium">{c.className}</td>
                              <td>{c.subject}</td>
                              <td className="text-right">LKR {c.revenue.toLocaleString()}</td>
                              <td className="text-right">{c.teacherPercent}%</td>
                              <td className="text-right font-medium text-green-600">LKR {c.earnings.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </>
      )}
    </div>
  );
};

export default RevenueReports;




