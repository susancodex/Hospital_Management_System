import React from "react";
import {
  Bell,
  Search,
  Plus,
  Calendar as CalendarIcon,
  Users,
  Activity,
  FileText,
  CreditCard,
  User,
  Settings,
  ChevronDown,
  LayoutDashboard,
  Clock,
  CheckCircle2,
  XCircle,
  MoreHorizontal,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const admissionsData = [
  { name: "Mon", admissions: 45 },
  { name: "Tue", admissions: 52 },
  { name: "Wed", admissions: 49 },
  { name: "Thu", admissions: 63 },
  { name: "Fri", admissions: 58 },
  { name: "Sat", admissions: 40 },
  { name: "Sun", admissions: 35 },
];

export function Clinical() {
  return (
    <div className="min-h-[900px] w-full bg-[#fcfcfc] text-slate-900 font-sans flex overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-200 bg-white flex flex-col justify-between shrink-0">
        <div>
          <div className="h-16 flex items-center px-6 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-teal-700 rounded flex items-center justify-center">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <span className="font-semibold text-lg tracking-tight text-slate-900">Mayo Cloud</span>
            </div>
          </div>
          
          <nav className="p-4 space-y-1">
            <NavItem icon={<LayoutDashboard size={18} />} label="Dashboard" active />
            <NavItem icon={<Users size={18} />} label="Patients" />
            <NavItem icon={<User size={18} />} label="Doctors" />
            <NavItem icon={<CalendarIcon size={18} />} label="Appointments" />
            <NavItem icon={<FileText size={18} />} label="Medical Records" />
            <NavItem icon={<Activity size={18} />} label="Medical Reports" />
            <NavItem icon={<CreditCard size={18} />} label="Billing" />
          </nav>
        </div>

        <div className="p-4 border-t border-slate-100">
          <NavItem icon={<Settings size={18} />} label="Settings" />
          <NavItem icon={<User size={18} />} label="Profile" />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-y-auto">
        {/* Topbar */}
        <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-8 shrink-0">
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Search patients, doctors, or MRN..." 
              className="pl-9 h-9 bg-slate-50 border-slate-200 focus-visible:ring-teal-700 w-full text-sm shadow-none rounded-md"
            />
          </div>

          <div className="flex items-center gap-6">
            <button className="relative text-slate-500 hover:text-slate-900 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute 1 top-0 right-0 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="h-5 w-px bg-slate-200"></div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium text-slate-900 leading-none">Dr. Aarav Mehta</p>
                <p className="text-xs text-slate-500 mt-1">Chief of Cardiology</p>
              </div>
              <Avatar className="w-9 h-9 border border-slate-200">
                <AvatarFallback className="bg-teal-50 text-teal-700 font-medium text-sm">AM</AvatarFallback>
              </Avatar>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-8 space-y-8 max-w-[1400px] mx-auto w-full">
          
          {/* Header */}
          <div className="flex items-end justify-between">
            <div>
              <p className="text-sm text-slate-500 mb-1">Thursday, October 15, 2026</p>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Good morning, Dr. Mehta</h1>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" className="h-9 px-4 border-slate-200 text-slate-700 shadow-none hover:bg-slate-50">
                <FileText className="w-4 h-4 mr-2" />
                Generate Report
              </Button>
              <Button className="h-9 px-4 bg-teal-700 hover:bg-teal-800 text-white shadow-none">
                <Plus className="w-4 h-4 mr-2" />
                New Appointment
              </Button>
            </div>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-4 gap-6">
            <KpiCard 
              title="Total Patients" 
              value="12,481" 
              trend="+4.2%" 
              trendUp={true} 
            />
            <KpiCard 
              title="Today's Appointments" 
              value="142" 
              trend="+12%" 
              trendUp={true} 
            />
            <KpiCard 
              title="Active Doctors" 
              value="84" 
              trend="0%" 
              trendUp={true} 
              neutral={true}
            />
            <KpiCard 
              title="Outstanding Revenue" 
              value="$42,850" 
              trend="-2.4%" 
              trendUp={false} 
            />
          </div>

          <div className="grid grid-cols-12 gap-8">
            {/* Chart Area */}
            <div className="col-span-8 space-y-6">
              <Card className="shadow-none border-slate-200 rounded-lg bg-white overflow-hidden">
                <CardHeader className="pb-2 px-6 pt-6 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-semibold text-slate-900">Patient Admissions</CardTitle>
                    <CardDescription className="text-xs text-slate-500">Last 7 days vs previous period</CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-500">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>View detailed report</DropdownMenuItem>
                      <DropdownMenuItem>Export to CSV</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent className="px-6 pb-6 pt-4 h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={admissionsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorAdmissions" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0f766e" stopOpacity={0.15}/>
                          <stop offset="95%" stopColor="#0f766e" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 12, fill: '#64748b' }}
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 12, fill: '#64748b' }}
                      />
                      <Tooltip 
                        contentStyle={{ borderRadius: '6px', border: '1px solid #e2e8f0', boxShadow: 'none' }}
                        itemStyle={{ color: '#0f766e', fontSize: '14px', fontWeight: 500 }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="admissions" 
                        stroke="#0f766e" 
                        strokeWidth={2}
                        fillOpacity={1} 
                        fill="url(#colorAdmissions)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Recent Patients Table */}
              <Card className="shadow-none border-slate-200 rounded-lg bg-white">
                <CardHeader className="px-6 py-5 border-b border-slate-100 flex flex-row items-center justify-between">
                  <CardTitle className="text-base font-semibold text-slate-900">Recent Patients</CardTitle>
                  <Button variant="link" className="text-teal-700 h-auto p-0 text-sm font-medium">View all</Button>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-slate-50/50">
                      <TableRow className="border-slate-100 hover:bg-transparent">
                        <TableHead className="text-xs font-medium text-slate-500 h-10 px-6">Patient Name</TableHead>
                        <TableHead className="text-xs font-medium text-slate-500 h-10">MRN</TableHead>
                        <TableHead className="text-xs font-medium text-slate-500 h-10">Last Visit</TableHead>
                        <TableHead className="text-xs font-medium text-slate-500 h-10">Doctor</TableHead>
                        <TableHead className="text-xs font-medium text-slate-500 h-10 text-right pr-6">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow className="border-slate-100">
                        <TableCell className="px-6 py-3 font-medium text-slate-900 text-sm">Wei Chen</TableCell>
                        <TableCell className="py-3 text-slate-500 text-sm font-mono text-xs">MRN-2026-0481</TableCell>
                        <TableCell className="py-3 text-slate-500 text-sm">Oct 12, 2026</TableCell>
                        <TableCell className="py-3 text-slate-500 text-sm">Dr. Sofia Hernandez</TableCell>
                        <TableCell className="py-3 pr-6 text-right">
                          <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-0 font-normal rounded-md shadow-none px-2 py-0.5">Discharged</Badge>
                        </TableCell>
                      </TableRow>
                      <TableRow className="border-slate-100">
                        <TableCell className="px-6 py-3 font-medium text-slate-900 text-sm">Priya Sharma</TableCell>
                        <TableCell className="py-3 text-slate-500 text-sm font-mono text-xs">MRN-2026-0482</TableCell>
                        <TableCell className="py-3 text-slate-500 text-sm">Oct 14, 2026</TableCell>
                        <TableCell className="py-3 text-slate-500 text-sm">Dr. Aarav Mehta</TableCell>
                        <TableCell className="py-3 pr-6 text-right">
                          <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-50 border-0 font-normal rounded-md shadow-none px-2 py-0.5">Admitted</Badge>
                        </TableCell>
                      </TableRow>
                      <TableRow className="border-slate-100">
                        <TableCell className="px-6 py-3 font-medium text-slate-900 text-sm">James Wilson</TableCell>
                        <TableCell className="py-3 text-slate-500 text-sm font-mono text-xs">MRN-2026-0483</TableCell>
                        <TableCell className="py-3 text-slate-500 text-sm">Oct 15, 2026</TableCell>
                        <TableCell className="py-3 text-slate-500 text-sm">Dr. Sarah Jenkins</TableCell>
                        <TableCell className="py-3 pr-6 text-right">
                          <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-50 border-0 font-normal rounded-md shadow-none px-2 py-0.5">Admitted</Badge>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>

            {/* Right Sidebar Area */}
            <div className="col-span-4 space-y-6">
              
              {/* Today's Appointments */}
              <Card className="shadow-none border-slate-200 rounded-lg bg-white">
                <CardHeader className="px-5 py-4 border-b border-slate-100 flex flex-row items-center justify-between">
                  <CardTitle className="text-base font-semibold text-slate-900">Today's Schedule</CardTitle>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 -mr-2">
                    <CalendarIcon className="w-4 h-4" />
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-slate-100">
                    <AppointmentRow 
                      time="09:00 AM" 
                      patient="Maria Garcia" 
                      initials="MG" 
                      dept="Cardiology" 
                      status="Completed" 
                    />
                    <AppointmentRow 
                      time="10:30 AM" 
                      patient="Robert Chen" 
                      initials="RC" 
                      dept="Cardiology" 
                      status="In consultation" 
                    />
                    <AppointmentRow 
                      time="11:45 AM" 
                      patient="Anita Desai" 
                      initials="AD" 
                      dept="Cardiology" 
                      status="Waiting" 
                    />
                    <AppointmentRow 
                      time="02:00 PM" 
                      patient="David Smith" 
                      initials="DS" 
                      dept="Cardiology" 
                      status="Confirmed" 
                    />
                    <AppointmentRow 
                      time="04:15 PM" 
                      patient="Elena Rostova" 
                      initials="ER" 
                      dept="Cardiology" 
                      status="Cancelled" 
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Occupancy Widget */}
              <Card className="shadow-none border-slate-200 rounded-lg bg-white">
                <CardHeader className="px-5 py-4 border-b border-slate-100">
                  <CardTitle className="text-base font-semibold text-slate-900">Department Occupancy</CardTitle>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  <OccupancyBar dept="ICU" used={18} total={20} />
                  <OccupancyBar dept="ER" used={32} total={45} />
                  <OccupancyBar dept="Cardiology" used={12} total={30} />
                  <OccupancyBar dept="Pediatrics" used={24} total={40} />
                </CardContent>
              </Card>

            </div>
          </div>
          
          <footer className="pt-8 pb-4 text-center">
            <p className="text-xs text-slate-400">
              Mayo Cloud HMS • Secure & HIPAA Compliant • System Status: <span className="text-emerald-600 font-medium">All systems operational</span>
            </p>
          </footer>

        </div>
      </main>
    </div>
  );
}

function NavItem({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) {
  return (
    <button className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      active 
        ? "bg-slate-50 text-teal-700" 
        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
    }`}>
      <span className={active ? "text-teal-700" : "text-slate-400"}>{icon}</span>
      {label}
    </button>
  );
}

function KpiCard({ title, value, trend, trendUp, neutral = false }: { title: string, value: string, trend: string, trendUp: boolean, neutral?: boolean }) {
  return (
    <Card className="shadow-none border-slate-200 rounded-lg bg-white">
      <CardContent className="p-5">
        <p className="text-sm font-medium text-slate-500 mb-2">{title}</p>
        <div className="flex items-end justify-between">
          <h3 className="text-2xl font-semibold tracking-tight text-slate-900">{value}</h3>
          <div className={`flex items-center text-xs font-medium ${
            neutral ? "text-slate-500" : trendUp ? "text-emerald-600" : "text-rose-600"
          }`}>
            {neutral ? null : trendUp ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
            {trend}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AppointmentRow({ time, patient, initials, dept, status }: { time: string, patient: string, initials: string, dept: string, status: string }) {
  
  const statusConfig: Record<string, { bg: string, text: string }> = {
    "Completed": { bg: "bg-slate-100", text: "text-slate-600" },
    "In consultation": { bg: "bg-blue-50", text: "text-blue-700" },
    "Waiting": { bg: "bg-amber-50", text: "text-amber-700" },
    "Confirmed": { bg: "bg-emerald-50", text: "text-emerald-700" },
    "Cancelled": { bg: "bg-rose-50", text: "text-rose-700" },
  };

  const config = statusConfig[status] || statusConfig["Confirmed"];

  return (
    <div className="px-5 py-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer group">
      <div className="flex items-center gap-3">
        <div className="w-10 text-right shrink-0">
          <span className="text-xs font-medium text-slate-500 block leading-tight">{time.split(' ')[0]}</span>
          <span className="text-[10px] text-slate-400 uppercase">{time.split(' ')[1]}</span>
        </div>
        <div className="w-px h-8 bg-slate-200 shrink-0 mx-1"></div>
        <div className="flex items-center gap-3">
          <Avatar className="w-8 h-8 border border-slate-200">
            <AvatarFallback className="bg-slate-100 text-slate-600 text-xs font-medium">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium text-slate-900 leading-none group-hover:text-teal-700 transition-colors">{patient}</p>
            <p className="text-xs text-slate-500 mt-1">{dept}</p>
          </div>
        </div>
      </div>
      <Badge variant="secondary" className={`${config.bg} ${config.text} hover:${config.bg} border-0 font-normal rounded-md shadow-none px-2 py-0.5 text-[11px]`}>
        {status}
      </Badge>
    </div>
  );
}

function OccupancyBar({ dept, used, total }: { dept: string, used: number, total: number }) {
  const percentage = Math.round((used / total) * 100);
  const isHigh = percentage > 85;
  
  return (
    <div>
      <div className="flex justify-between text-sm mb-1.5">
        <span className="font-medium text-slate-700">{dept}</span>
        <span className="text-slate-500 text-xs">{used} / {total} beds</span>
      </div>
      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-500 ${isHigh ? 'bg-rose-500' : 'bg-teal-600'}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
