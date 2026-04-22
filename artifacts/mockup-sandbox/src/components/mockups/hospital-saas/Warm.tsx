import React from "react";
import { 
  Activity, 
  Search, 
  Bell, 
  LayoutDashboard, 
  Users, 
  Calendar, 
  FileText, 
  ClipboardList, 
  CreditCard, 
  Settings, 
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  MoreVertical,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Stethoscope,
  HeartPulse,
  Upload,
  FilePlus,
  ArrowRight
} from "lucide-react";

// --- Mock Data ---

const kpiData = [
  { title: "Total Patients", value: "24,892", delta: "+12.5%", isPositive: true, sparkline: "M0 10 Q 5 5, 10 10 T 20 5 T 30 8 T 40 2" },
  { title: "Today's Appointments", value: "184", delta: "+4.2%", isPositive: true, sparkline: "M0 8 Q 5 10, 10 6 T 20 8 T 30 4 T 40 2" },
  { title: "Active Doctors", value: "86", delta: "0%", isPositive: true, sparkline: "M0 5 L 10 5 L 20 5 L 30 5 L 40 5" },
  { title: "Outstanding Revenue", value: "$1.2M", delta: "-2.4%", isPositive: false, sparkline: "M0 2 Q 5 8, 10 5 T 20 10 T 30 8 T 40 12" },
];

const todayAppointments = [
  { id: 1, time: "09:00 AM", patient: "Priya Sharma", doctor: "Dr. Sofia Hernandez", dept: "Cardiology", status: "In consultation", initials: "PS" },
  { id: 2, time: "09:30 AM", patient: "Wei Chen", doctor: "Dr. Aarav Mehta", dept: "Oncology", status: "Waiting", initials: "WC" },
  { id: 3, time: "10:00 AM", patient: "Marcus Johnson", doctor: "Dr. Emily Chen", dept: "Orthopedics", status: "Confirmed", initials: "MJ" },
  { id: 4, time: "10:15 AM", patient: "Fatima Al-Sayed", doctor: "Dr. James Wilson", dept: "Pediatrics", status: "Waiting", initials: "FA" },
  { id: 5, time: "10:45 AM", patient: "David Kim", doctor: "Dr. Sofia Hernandez", dept: "Cardiology", status: "Completed", initials: "DK" },
  { id: 6, time: "11:30 AM", patient: "Elena Rostova", doctor: "Dr. Aarav Mehta", dept: "Oncology", status: "Cancelled", initials: "ER" },
];

const recentPatients = [
  { mrn: "MRN-2026-0481", name: "Ananya Patel", age: 34, gender: "F", lastVisit: "Apr 12, 2026", doctor: "Dr. Sarah Jenkins", status: "Stable" },
  { mrn: "MRN-2026-0482", name: "Thomas Wright", age: 58, gender: "M", lastVisit: "Apr 10, 2026", doctor: "Dr. Aarav Mehta", status: "Critical" },
  { mrn: "MRN-2026-0483", name: "Maria Garcia", age: 42, gender: "F", lastVisit: "Apr 08, 2026", doctor: "Dr. Sofia Hernandez", status: "Recovering" },
  { mrn: "MRN-2026-0484", name: "James O'Connor", age: 71, gender: "M", lastVisit: "Apr 05, 2026", doctor: "Dr. Emily Chen", status: "Stable" },
];

const departmentOccupancy = [
  { name: "Intensive Care Unit", occupancy: 88, color: "bg-rose-500" },
  { name: "Emergency Room", occupancy: 75, color: "bg-amber-500" },
  { name: "Cardiology", occupancy: 62, color: "bg-[#3F8F76]" },
  { name: "Pediatrics", occupancy: 45, color: "bg-blue-500" },
  { name: "Oncology", occupancy: 92, color: "bg-purple-500" },
];

// --- Sub-components ---

const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    "Confirmed": "bg-blue-50 text-blue-700 border-blue-100",
    "Waiting": "bg-amber-50 text-amber-700 border-amber-100",
    "In consultation": "bg-purple-50 text-purple-700 border-purple-100",
    "Completed": "bg-emerald-50 text-emerald-700 border-emerald-100",
    "Cancelled": "bg-rose-50 text-rose-700 border-rose-100",
    "Stable": "bg-emerald-50 text-emerald-700 border-emerald-100",
    "Critical": "bg-rose-50 text-rose-700 border-rose-100",
    "Recovering": "bg-blue-50 text-blue-700 border-blue-100",
  };

  return (
    <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${styles[status] || "bg-stone-100 text-stone-700 border-stone-200"}`}>
      {status}
    </span>
  );
};

const Avatar = ({ initials, className = "" }: { initials: string, className?: string }) => (
  <div className={`flex items-center justify-center rounded-full bg-stone-100 text-stone-600 font-medium ${className}`}>
    {initials}
  </div>
);

const AreaChartPlaceholder = () => {
  return (
    <div className="relative w-full h-[240px] mt-4 flex items-end">
      {/* Y-Axis lines */}
      <div className="absolute inset-0 flex flex-col justify-between pt-2 pb-6">
        {[400, 300, 200, 100, 0].map((val) => (
          <div key={val} className="flex items-center text-[10px] text-stone-400">
            <span className="w-6 text-right mr-2">{val}</span>
            <div className="flex-1 border-b border-stone-100 border-dashed"></div>
          </div>
        ))}
      </div>
      
      {/* Chart SVG Area */}
      <div className="absolute inset-0 pl-8 pb-6 pt-2">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="gradient-sage" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3F8F76" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#3F8F76" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path 
            d="M 0 80 Q 10 70, 20 75 T 40 50 T 60 40 T 80 55 T 100 20 L 100 100 L 0 100 Z" 
            fill="url(#gradient-sage)" 
          />
          <path 
            d="M 0 80 Q 10 70, 20 75 T 40 50 T 60 40 T 80 55 T 100 20" 
            fill="none" 
            stroke="#3F8F76" 
            strokeWidth="2" 
            vectorEffect="non-scaling-stroke"
          />
          {/* Data points */}
          <circle cx="20" cy="75" r="3" fill="white" stroke="#3F8F76" strokeWidth="2" vectorEffect="non-scaling-stroke" className="hover:r-4 transition-all" />
          <circle cx="40" cy="50" r="3" fill="white" stroke="#3F8F76" strokeWidth="2" vectorEffect="non-scaling-stroke" />
          <circle cx="60" cy="40" r="3" fill="white" stroke="#3F8F76" strokeWidth="2" vectorEffect="non-scaling-stroke" />
          <circle cx="80" cy="55" r="3" fill="white" stroke="#3F8F76" strokeWidth="2" vectorEffect="non-scaling-stroke" />
          <circle cx="100" cy="20" r="4" fill="#3F8F76" stroke="white" strokeWidth="2" vectorEffect="non-scaling-stroke" />
        </svg>
      </div>

      {/* X-Axis labels */}
      <div className="absolute bottom-0 left-8 right-0 flex justify-between text-[10px] text-stone-400">
        <span>Apr 8</span>
        <span>Apr 9</span>
        <span>Apr 10</span>
        <span>Apr 11</span>
        <span>Apr 12</span>
        <span>Apr 13</span>
        <span>Apr 14</span>
      </div>
    </div>
  );
};

export function Warm() {
  return (
    <div className="flex h-[900px] bg-[#FAF8F5] text-stone-800 font-sans overflow-hidden min-w-[1280px]">
      
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-stone-100 flex flex-col relative z-10 shadow-[2px_0_8px_rgba(0,0,0,0.02)]">
        <div className="h-20 flex items-center px-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#3F8F76] flex items-center justify-center text-white">
              <HeartPulse size={18} strokeWidth={2.5} />
            </div>
            <span className="font-semibold text-lg tracking-tight text-stone-900">Aura Health</span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-4 px-3 mt-2">Overview</div>
          
          <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-stone-50 text-[#3F8F76] font-medium transition-colors">
            <LayoutDashboard size={18} />
            Dashboard
          </a>
          <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-stone-600 hover:bg-stone-50 hover:text-stone-900 transition-colors">
            <Stethoscope size={18} />
            Doctors
          </a>
          <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-stone-600 hover:bg-stone-50 hover:text-stone-900 transition-colors">
            <Users size={18} />
            Patients
          </a>
          <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-stone-600 hover:bg-stone-50 hover:text-stone-900 transition-colors flex-1 justify-between">
            <div className="flex items-center gap-3">
              <Calendar size={18} />
              Appointments
            </div>
            <span className="bg-[#3F8F76]/10 text-[#3F8F76] text-xs font-bold px-2 py-0.5 rounded-full">12</span>
          </a>

          <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-4 px-3 mt-8">Records & Billing</div>
          
          <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-stone-600 hover:bg-stone-50 hover:text-stone-900 transition-colors">
            <FileText size={18} />
            Medical Records
          </a>
          <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-stone-600 hover:bg-stone-50 hover:text-stone-900 transition-colors">
            <ClipboardList size={18} />
            Medical Reports
          </a>
          <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-stone-600 hover:bg-stone-50 hover:text-stone-900 transition-colors">
            <CreditCard size={18} />
            Billing & Invoices
          </a>
        </nav>

        <div className="p-4 border-t border-stone-100">
          <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-stone-600 hover:bg-stone-50 hover:text-stone-900 transition-colors">
            <Settings size={18} />
            Settings
          </a>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Top App Bar */}
        <header className="h-20 bg-[#FAF8F5] flex items-center justify-between px-8 shrink-0 relative z-0">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
              <input 
                type="text" 
                placeholder="Search patients, doctors, or MRN..." 
                className="w-full bg-white border-none shadow-[0_2px_10px_rgba(0,0,0,0.02)] rounded-full pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3F8F76]/20 transition-all placeholder:text-stone-400 text-stone-800"
              />
            </div>
          </div>

          <div className="flex items-center gap-5">
            <button className="relative text-stone-500 hover:text-stone-800 transition-colors p-2 bg-white rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
            </button>
            
            <div className="h-8 w-px bg-stone-200"></div>
            
            <div className="flex items-center gap-3 cursor-pointer group">
              <div className="text-right hidden md:block">
                <div className="text-sm font-semibold text-stone-900 leading-tight">Dr. Aarav Mehta</div>
                <div className="text-xs text-[#3F8F76] font-medium">Chief of Surgery</div>
              </div>
              <img 
                src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=150&auto=format&fit=crop" 
                alt="Dr. Aarav Mehta" 
                className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm group-hover:border-[#3F8F76]/20 transition-colors"
              />
            </div>
          </div>
        </header>

        {/* Scrollable Dashboard Area */}
        <div className="flex-1 overflow-y-auto p-8 pt-2">
          
          {/* Page Header */}
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-stone-500 font-medium mb-1">Tuesday, April 14, 2026</p>
              <h1 className="text-3xl font-semibold text-stone-900 tracking-tight">Good morning, Aarav.</h1>
            </div>
            <div className="flex gap-3">
              <button className="flex items-center gap-2 px-4 py-2.5 bg-white text-stone-700 font-medium rounded-xl border border-stone-200 shadow-sm hover:bg-stone-50 transition-all">
                <FilePlus size={18} />
                Add Patient
              </button>
              <button className="flex items-center gap-2 px-4 py-2.5 bg-[#3F8F76] text-white font-medium rounded-xl shadow-[0_4px_14px_rgba(63,143,118,0.25)] hover:bg-[#347A64] hover:-translate-y-0.5 transition-all">
                <Plus size={18} />
                New Appointment
              </button>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-4 gap-6 mb-8">
            {kpiData.map((kpi, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-5 border border-stone-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-stone-500 font-medium text-sm">{kpi.title}</h3>
                  <div className={`flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${kpi.isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                    {kpi.isPositive ? <ArrowUpRight size={14} className="mr-0.5" /> : <ArrowDownRight size={14} className="mr-0.5" />}
                    {kpi.delta}
                  </div>
                </div>
                <div className="flex items-end justify-between">
                  <div className="text-3xl font-semibold text-stone-900 tracking-tight">{kpi.value}</div>
                  <svg width="40" height="15" viewBox="0 0 40 15" className="overflow-visible opacity-50">
                    <path d={kpi.sparkline} fill="none" stroke={kpi.isPositive ? "#10B981" : "#F43F5E"} strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>
              </div>
            ))}
          </div>

          {/* Main Content Grid: Row 1 */}
          <div className="grid grid-cols-3 gap-6 mb-8">
            
            {/* Chart Panel */}
            <div className="col-span-2 bg-white rounded-2xl border border-stone-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] p-6">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h2 className="text-lg font-semibold text-stone-900">Patient Admissions</h2>
                  <p className="text-sm text-stone-500 mt-1">Daily admissions across all departments</p>
                </div>
                <select className="bg-stone-50 border border-stone-200 text-stone-700 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#3F8F76]/20">
                  <option>Last 7 days</option>
                  <option>Last 30 days</option>
                  <option>This Year</option>
                </select>
              </div>
              <AreaChartPlaceholder />
            </div>

            {/* Today's Appointments */}
            <div className="col-span-1 bg-white rounded-2xl border border-stone-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] p-6 flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-stone-900">Today's Schedule</h2>
                <button className="text-sm font-medium text-[#3F8F76] hover:text-[#347A64] transition-colors">View All</button>
              </div>
              
              <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-4">
                {todayAppointments.map((apt) => (
                  <div key={apt.id} className="group relative flex gap-4 p-3 rounded-xl hover:bg-stone-50 transition-colors border border-transparent hover:border-stone-100">
                    <div className="w-14 shrink-0 text-right pt-1">
                      <div className="text-sm font-semibold text-stone-900">{apt.time.split(' ')[0]}</div>
                      <div className="text-[10px] font-medium text-stone-400">{apt.time.split(' ')[1]}</div>
                    </div>
                    
                    <div className="w-px bg-stone-100 group-hover:bg-[#3F8F76]/20 transition-colors"></div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <div className="font-medium text-stone-900 truncate pr-2">{apt.patient}</div>
                        <StatusBadge status={apt.status} />
                      </div>
                      <div className="text-xs text-stone-500 flex items-center gap-1.5 mt-1">
                        <Stethoscope size={12} className="text-stone-400" />
                        <span className="truncate">{apt.doctor}</span>
                      </div>
                      <div className="text-[11px] font-medium text-stone-400 mt-1 uppercase tracking-wider">
                        {apt.dept}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content Grid: Row 2 */}
          <div className="grid grid-cols-3 gap-6 mb-8">
            
            {/* Recent Patients Table */}
            <div className="col-span-2 bg-white rounded-2xl border border-stone-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] overflow-hidden flex flex-col">
              <div className="p-6 border-b border-stone-100 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-stone-900">Recent Patients</h2>
                <div className="flex gap-2">
                  <button className="p-1.5 text-stone-400 hover:text-stone-700 bg-stone-50 rounded-lg transition-colors"><Search size={16} /></button>
                  <button className="p-1.5 text-stone-400 hover:text-stone-700 bg-stone-50 rounded-lg transition-colors"><MoreVertical size={16} /></button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-stone-50/50">
                      <th className="px-6 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wider">Patient Details</th>
                      <th className="px-6 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wider">MRN</th>
                      <th className="px-6 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wider">Last Visit</th>
                      <th className="px-6 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wider text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {recentPatients.map((patient, i) => (
                      <tr key={i} className="hover:bg-stone-50/50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar initials={patient.name.split(' ').map(n=>n[0]).join('')} className="w-9 h-9 text-xs bg-[#3F8F76]/10 text-[#3F8F76]" />
                            <div>
                              <div className="font-medium text-stone-900">{patient.name}</div>
                              <div className="text-xs text-stone-500">{patient.age} yrs • {patient.gender}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-stone-600 font-mono">{patient.mrn}</td>
                        <td className="px-6 py-4 text-sm text-stone-600">
                          <div>{patient.lastVisit}</div>
                          <div className="text-xs text-stone-400">{patient.doctor}</div>
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={patient.status} />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button className="text-stone-400 hover:text-[#3F8F76] transition-colors p-2 opacity-0 group-hover:opacity-100">
                            <ArrowRight size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Occupancy Widget & Quick Actions */}
            <div className="col-span-1 space-y-6">
              
              {/* Occupancy */}
              <div className="bg-white rounded-2xl border border-stone-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-base font-semibold text-stone-900">Bed Availability</h2>
                  <Activity size={18} className="text-stone-400" />
                </div>
                <div className="space-y-4">
                  {departmentOccupancy.map((dept, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="font-medium text-stone-700">{dept.name}</span>
                        <span className="font-semibold text-stone-900">{dept.occupancy}%</span>
                      </div>
                      <div className="h-2 w-full bg-stone-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${dept.color}`} 
                          style={{ width: `${dept.occupancy}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-[#3F8F76] rounded-2xl p-6 text-white shadow-[0_8px_30px_rgba(63,143,118,0.2)] relative overflow-hidden">
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
                <h2 className="text-base font-semibold mb-4 relative z-10">Quick Actions</h2>
                <div className="grid grid-cols-2 gap-3 relative z-10">
                  <button className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors border border-white/10">
                    <FilePlus size={20} />
                    <span className="text-xs font-medium">Add Record</span>
                  </button>
                  <button className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors border border-white/10">
                    <Upload size={20} />
                    <span className="text-xs font-medium">Upload Lab</span>
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* Footer */}
          <footer className="pt-4 border-t border-stone-200/60 pb-8 flex items-center justify-between text-xs text-stone-400">
            <p>Aura Health Systems • HIPAA Compliant</p>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              All systems operational
            </div>
          </footer>

        </div>
      </main>
    </div>
  );
}
