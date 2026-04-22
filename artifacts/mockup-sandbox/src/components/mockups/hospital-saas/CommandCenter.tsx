import React from "react";
import {
  Bell,
  Search,
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  Activity,
  CreditCard,
  Settings,
  Plus,
  Stethoscope,
  TrendingUp,
  TrendingDown,
  ActivitySquare,
  ShieldCheck,
  ChevronRight,
  Upload,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";

// Fake Data
const chartData = [
  { time: "00:00", admissions: 12 },
  { time: "04:00", admissions: 8 },
  { time: "08:00", admissions: 35 },
  { time: "12:00", admissions: 42 },
  { time: "16:00", admissions: 38 },
  { time: "20:00", admissions: 24 },
  { time: "23:59", admissions: 18 },
];

const appointments = [
  { id: 1, time: "08:00 AM", patient: "Priya Sharma", initials: "PS", doctor: "Dr. Aarav Mehta", dept: "Cardiology", status: "In consultation" },
  { id: 2, time: "08:30 AM", patient: "John Doe", initials: "JD", doctor: "Dr. Sofia Hernandez", dept: "Oncology", status: "Waiting" },
  { id: 3, time: "09:00 AM", patient: "Wei Chen", initials: "WC", doctor: "Dr. James Wilson", dept: "Orthopedics", status: "Confirmed" },
  { id: 4, time: "09:15 AM", patient: "Maria Garcia", initials: "MG", doctor: "Dr. Emily Chen", dept: "Pediatrics", status: "Completed" },
  { id: 5, time: "10:00 AM", patient: "Ahmed Al-Fayed", initials: "AA", doctor: "Dr. Sarah Johnson", dept: "ER", status: "Cancelled" },
];

const recentPatients = [
  { id: 1, name: "Robert Taylor", mrn: "MRN-2026-0481", age: 45, gender: "M", lastVisit: "Oct 12, 2026", doctor: "Dr. Aarav Mehta", status: "Admitted" },
  { id: 2, name: "Linda Anderson", mrn: "MRN-2026-0482", age: 62, gender: "F", lastVisit: "Oct 14, 2026", doctor: "Dr. Sofia Hernandez", status: "Discharged" },
  { id: 3, name: "David Miller", mrn: "MRN-2026-0483", age: 28, gender: "M", lastVisit: "Oct 15, 2026", doctor: "Dr. James Wilson", status: "Observation" },
  { id: 4, name: "Sarah Thomas", mrn: "MRN-2026-0484", age: 35, gender: "F", lastVisit: "Oct 15, 2026", doctor: "Dr. Emily Chen", status: "Scheduled" },
];

const occupancies = [
  { dept: "ER", occupied: 42, capacity: 50, color: "bg-rose-500" },
  { dept: "ICU", occupied: 18, capacity: 20, color: "bg-amber-500" },
  { dept: "Cardiology", occupied: 35, capacity: 60, color: "bg-emerald-500" },
  { dept: "Pediatrics", occupied: 28, capacity: 40, color: "bg-blue-500" },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case "Confirmed": return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    case "Waiting": return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    case "In consultation": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    case "Completed": return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    case "Cancelled": return "bg-rose-500/10 text-rose-400 border-rose-500/20";
    case "Admitted": return "bg-rose-500/10 text-rose-400 border-rose-500/20";
    case "Discharged": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    case "Observation": return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    case "Scheduled": return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    default: return "bg-slate-500/10 text-slate-400 border-slate-500/20";
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "Confirmed": return <CheckCircle2 className="w-3 h-3 mr-1" />;
    case "Waiting": return <Clock className="w-3 h-3 mr-1" />;
    case "In consultation": return <ActivitySquare className="w-3 h-3 mr-1" />;
    case "Completed": return <CheckCircle2 className="w-3 h-3 mr-1" />;
    case "Cancelled": return <XCircle className="w-3 h-3 mr-1" />;
    default: return <AlertCircle className="w-3 h-3 mr-1" />;
  }
};

export function CommandCenter() {
  return (
    <div className="flex h-full min-h-[900px] w-full bg-[#0b0f17] text-slate-300 font-sans dark selection:bg-emerald-500/30">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800/60 bg-[#0f141f] flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-slate-800/60">
          <Activity className="w-6 h-6 text-emerald-500 mr-2" />
          <span className="font-semibold text-slate-100 tracking-tight">NerveCenter Ops</span>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          <div className="px-3 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Main</div>
          <button className="w-full flex items-center px-3 py-2 text-sm font-medium rounded-md bg-emerald-500/10 text-emerald-400">
            <LayoutDashboard className="w-4 h-4 mr-3" />
            Command Center
          </button>
          <button className="w-full flex items-center px-3 py-2 text-sm font-medium rounded-md text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 transition-colors">
            <Stethoscope className="w-4 h-4 mr-3" />
            Providers
          </button>
          <button className="w-full flex items-center px-3 py-2 text-sm font-medium rounded-md text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 transition-colors">
            <Users className="w-4 h-4 mr-3" />
            Patients
          </button>
          <button className="w-full flex items-center px-3 py-2 text-sm font-medium rounded-md text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 transition-colors">
            <Calendar className="w-4 h-4 mr-3" />
            Scheduling
          </button>
          
          <div className="px-3 mt-6 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Clinical</div>
          <button className="w-full flex items-center px-3 py-2 text-sm font-medium rounded-md text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 transition-colors">
            <FileText className="w-4 h-4 mr-3" />
            EHR Records
          </button>
          <button className="w-full flex items-center px-3 py-2 text-sm font-medium rounded-md text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 transition-colors">
            <ActivitySquare className="w-4 h-4 mr-3" />
            Lab Reports
          </button>
          
          <div className="px-3 mt-6 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Admin</div>
          <button className="w-full flex items-center px-3 py-2 text-sm font-medium rounded-md text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 transition-colors">
            <CreditCard className="w-4 h-4 mr-3" />
            Billing
          </button>
          <button className="w-full flex items-center px-3 py-2 text-sm font-medium rounded-md text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 transition-colors">
            <Settings className="w-4 h-4 mr-3" />
            Settings
          </button>
        </nav>
        
        <div className="p-4 border-t border-slate-800/60">
          <div className="flex items-center">
            <Avatar className="h-9 w-9 border border-slate-700 bg-slate-800">
              <AvatarFallback className="text-xs text-slate-300">SJ</AvatarFallback>
            </Avatar>
            <div className="ml-3">
              <p className="text-sm font-medium text-slate-200">Sarah Jenkins</p>
              <p className="text-xs text-slate-500">Chief of Operations</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-slate-800/60 bg-[#0f141f]">
          <div className="flex-1 flex items-center">
            <div className="relative w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input 
                placeholder="Search MRN, patient name, or provider..." 
                className="w-full pl-9 bg-slate-900/50 border-slate-800 text-sm text-slate-200 placeholder:text-slate-600 focus-visible:ring-emerald-500/50 rounded-full h-9"
              />
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant="outline" className="bg-rose-500/10 text-rose-400 border-rose-500/20 px-2.5 py-0.5 text-xs font-medium">
              Code Blue Active
            </Badge>
            <div className="relative cursor-pointer">
              <Bell className="w-5 h-5 text-slate-400 hover:text-slate-200 transition-colors" />
              <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-rose-500 ring-2 ring-[#0f141f]" />
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="flex-1 overflow-auto p-6 space-y-6">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Ops Dashboard</h1>
              <p className="text-sm text-slate-500 mt-1">Tuesday, October 15, 2026 • Shift 1 (08:00 - 16:00)</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="bg-[#0f141f] border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-slate-100 h-9 px-4">
                <Upload className="w-4 h-4 mr-2" /> Export
              </Button>
              <Button className="bg-emerald-600 hover:bg-emerald-500 text-white h-9 px-4">
                <Plus className="w-4 h-4 mr-2" /> New Admission
              </Button>
            </div>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-[#0f141f] border-slate-800/60 shadow-sm rounded-lg overflow-hidden relative">
              <div className="absolute top-0 left-0 w-1 h-full bg-blue-500/50"></div>
              <CardContent className="p-5">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-slate-400 mb-1">Total Patients</p>
                    <h3 className="text-3xl font-mono font-bold text-slate-100 tracking-tight">1,248</h3>
                  </div>
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <Users className="w-5 h-5 text-blue-400" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <TrendingUp className="w-4 h-4 text-emerald-400 mr-1" />
                  <span className="text-emerald-400 font-medium">12.5%</span>
                  <span className="text-slate-500 ml-2">vs last week</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#0f141f] border-slate-800/60 shadow-sm rounded-lg overflow-hidden relative">
              <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500/50"></div>
              <CardContent className="p-5">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-slate-400 mb-1">Today's Appts</p>
                    <h3 className="text-3xl font-mono font-bold text-slate-100 tracking-tight">342</h3>
                  </div>
                  <div className="p-2 bg-emerald-500/10 rounded-lg">
                    <Calendar className="w-5 h-5 text-emerald-400" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <TrendingUp className="w-4 h-4 text-emerald-400 mr-1" />
                  <span className="text-emerald-400 font-medium">4.2%</span>
                  <span className="text-slate-500 ml-2">vs last week</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#0f141f] border-slate-800/60 shadow-sm rounded-lg overflow-hidden relative">
              <div className="absolute top-0 left-0 w-1 h-full bg-amber-500/50"></div>
              <CardContent className="p-5">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-slate-400 mb-1">Active Doctors</p>
                    <h3 className="text-3xl font-mono font-bold text-slate-100 tracking-tight">156</h3>
                  </div>
                  <div className="p-2 bg-amber-500/10 rounded-lg">
                    <Stethoscope className="w-5 h-5 text-amber-400" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <span className="text-slate-400 font-medium">92%</span>
                  <span className="text-slate-500 ml-2">of total roster</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#0f141f] border-slate-800/60 shadow-sm rounded-lg overflow-hidden relative">
              <div className="absolute top-0 left-0 w-1 h-full bg-rose-500/50"></div>
              <CardContent className="p-5">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-slate-400 mb-1">Critical Wait Time</p>
                    <h3 className="text-3xl font-mono font-bold text-slate-100 tracking-tight">14<span className="text-xl text-slate-500 ml-1">m</span></h3>
                  </div>
                  <div className="p-2 bg-rose-500/10 rounded-lg">
                    <Clock className="w-5 h-5 text-rose-400" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <TrendingDown className="w-4 h-4 text-rose-400 mr-1" />
                  <span className="text-rose-400 font-medium">+2.4m</span>
                  <span className="text-slate-500 ml-2">vs yesterday</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart */}
            <Card className="lg:col-span-2 bg-[#0f141f] border-slate-800/60 shadow-sm rounded-lg overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold text-slate-200">Patient Flow & Admissions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[280px] w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorAdmissions" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                      <XAxis 
                        dataKey="time" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#64748b', fontSize: 12 }} 
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#64748b', fontSize: 12 }} 
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f141f', borderColor: '#1e293b', color: '#f1f5f9' }}
                        itemStyle={{ color: '#10b981' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="admissions" 
                        stroke="#10b981" 
                        strokeWidth={2}
                        fillOpacity={1} 
                        fill="url(#colorAdmissions)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Today's Appointments */}
            <Card className="bg-[#0f141f] border-slate-800/60 shadow-sm rounded-lg overflow-hidden flex flex-col">
              <CardHeader className="pb-3 border-b border-slate-800/60">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-base font-semibold text-slate-200">Live Queue</CardTitle>
                  <Button variant="ghost" size="sm" className="h-8 text-xs text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10">
                    View All <ChevronRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0 flex-1 overflow-auto">
                <div className="divide-y divide-slate-800/60">
                  {appointments.map((apt) => (
                    <div key={apt.id} className="p-4 hover:bg-slate-800/30 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-mono text-slate-400">{apt.time}</span>
                        <Badge variant="outline" className={`border text-xs px-2 py-0.5 rounded-full flex items-center ${getStatusColor(apt.status)}`}>
                          {getStatusIcon(apt.status)}
                          {apt.status}
                        </Badge>
                      </div>
                      <div className="flex items-center">
                        <Avatar className="h-8 w-8 bg-slate-800 border border-slate-700">
                          <AvatarFallback className="text-[10px] text-slate-300">{apt.initials}</AvatarFallback>
                        </Avatar>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-slate-200">{apt.patient}</p>
                          <p className="text-xs text-slate-500">{apt.doctor} • {apt.dept}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Patients Table */}
            <Card className="lg:col-span-2 bg-[#0f141f] border-slate-800/60 shadow-sm rounded-lg overflow-hidden">
              <CardHeader className="pb-3 border-b border-slate-800/60">
                <CardTitle className="text-base font-semibold text-slate-200">Recent Patients</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-slate-900/50 hover:bg-slate-900/50">
                    <TableRow className="border-slate-800/60">
                      <TableHead className="text-slate-400 font-medium">Patient</TableHead>
                      <TableHead className="text-slate-400 font-medium">MRN</TableHead>
                      <TableHead className="text-slate-400 font-medium">Demographics</TableHead>
                      <TableHead className="text-slate-400 font-medium">Provider</TableHead>
                      <TableHead className="text-slate-400 font-medium">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentPatients.map((patient) => (
                      <TableRow key={patient.id} className="border-slate-800/60 hover:bg-slate-800/30 border-b">
                        <TableCell className="font-medium text-slate-200">{patient.name}</TableCell>
                        <TableCell className="font-mono text-xs text-slate-400">{patient.mrn}</TableCell>
                        <TableCell className="text-sm text-slate-400">{patient.age}y / {patient.gender}</TableCell>
                        <TableCell className="text-sm text-slate-300">{patient.doctor}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`border ${getStatusColor(patient.status)}`}>
                            {patient.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Department Occupancy */}
            <Card className="bg-[#0f141f] border-slate-800/60 shadow-sm rounded-lg overflow-hidden">
              <CardHeader className="pb-3 border-b border-slate-800/60">
                <CardTitle className="text-base font-semibold text-slate-200">Ward Occupancy</CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-5">
                {occupancies.map((ward) => {
                  const percent = Math.round((ward.occupied / ward.capacity) * 100);
                  return (
                    <div key={ward.dept}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-slate-300">{ward.dept}</span>
                        <span className="text-xs font-mono text-slate-400">{ward.occupied} / {ward.capacity} ({percent}%)</span>
                      </div>
                      <Progress 
                        value={percent} 
                        className="h-2 bg-slate-800" 
                        indicatorClassName={ward.color}
                      />
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions Panel */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-auto py-4 flex flex-col items-center justify-center gap-2 bg-[#0f141f] border-slate-800/60 hover:bg-slate-800 hover:text-slate-100 text-slate-400">
              <Users className="w-5 h-5 text-emerald-500" />
              <span className="text-sm font-medium">Add Patient</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col items-center justify-center gap-2 bg-[#0f141f] border-slate-800/60 hover:bg-slate-800 hover:text-slate-100 text-slate-400">
              <Calendar className="w-5 h-5 text-blue-500" />
              <span className="text-sm font-medium">Schedule Appt</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col items-center justify-center gap-2 bg-[#0f141f] border-slate-800/60 hover:bg-slate-800 hover:text-slate-100 text-slate-400">
              <CreditCard className="w-5 h-5 text-amber-500" />
              <span className="text-sm font-medium">Generate Invoice</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col items-center justify-center gap-2 bg-[#0f141f] border-slate-800/60 hover:bg-slate-800 hover:text-slate-100 text-slate-400">
              <FileText className="w-5 h-5 text-rose-500" />
              <span className="text-sm font-medium">Upload Report</span>
            </Button>
          </div>

        </div>

        {/* Footer */}
        <footer className="h-10 flex items-center justify-between px-6 border-t border-slate-800/60 bg-[#0f141f] text-xs text-slate-500">
          <div className="flex items-center">
            <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-500" />
            HIPAA Compliant System
          </div>
          <div>
            NerveCenter v2.4.1 • All systems operational
          </div>
        </footer>
      </main>
    </div>
  );
}
