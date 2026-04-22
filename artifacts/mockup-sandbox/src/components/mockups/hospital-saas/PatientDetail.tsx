import React from "react";
import {
  Activity, Bell, Calendar as CalendarIcon, ChevronDown, CreditCard,
  FileText, LayoutDashboard, Search, Settings, User, Users, Plus,
  MoreHorizontal, ChevronRight, MapPin, Phone, Mail, FileWarning,
  ActivitySquare, Syringe, Clock, FilePlus, Download, MessageSquare
} from "lucide-react";
import { AreaChart, Area, ResponsiveContainer } from "recharts";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const vitalsSparklineData = [
  { value: 65 }, { value: 68 }, { value: 72 }, { value: 70 }, { value: 68 }, { value: 72 }, { value: 74 }
];

export function PatientDetail() {
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
            <NavItem icon={<LayoutDashboard size={18} />} label="Dashboard" />
            <NavItem icon={<Users size={18} />} label="Patients" active />
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
        <div className="p-8 max-w-[1400px] mx-auto w-full flex flex-col gap-6">
          
          {/* Breadcrumb */}
          <div className="flex items-center text-sm text-slate-500">
            <span className="hover:text-slate-900 cursor-pointer">Patients</span>
            <ChevronRight className="w-4 h-4 mx-2 text-slate-400" />
            <span className="font-medium text-slate-900">Priya Sharma</span>
          </div>

          {/* Patient Header Card */}
          <div className="bg-white rounded-lg border border-slate-200 p-6 flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="flex gap-6">
              <Avatar className="w-20 h-20 border-2 border-white shadow-sm">
                <AvatarFallback className="bg-slate-100 text-slate-600 text-2xl font-medium">PS</AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Priya Sharma</h1>
                  <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-0 font-normal rounded-md shadow-none px-2 py-0.5">
                    Inpatient · Cardiology · Bed 4B
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500">
                  <span className="flex items-center gap-1.5"><User className="w-4 h-4" /> 42 yrs • Female</span>
                  <span className="flex items-center gap-1.5"><ActivitySquare className="w-4 h-4" /> O+ Blood Group</span>
                  <span className="flex items-center gap-1.5 font-mono text-xs"><FileText className="w-4 h-4" /> MRN-2026-0481</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button variant="outline" className="h-9 px-4 border-slate-200 text-slate-700 shadow-none hover:bg-slate-50">
                Print summary
              </Button>
              <Button variant="outline" className="h-9 px-4 border-slate-200 text-slate-700 shadow-none hover:bg-slate-50">
                Generate invoice
              </Button>
              <Button variant="outline" className="h-9 px-4 border-slate-200 text-slate-700 shadow-none hover:bg-slate-50">
                Add note
              </Button>
              <Button className="h-9 px-4 bg-teal-700 hover:bg-teal-800 text-white shadow-none">
                <Plus className="w-4 h-4 mr-2" />
                New appointment
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="h-9 w-9 p-0 border-slate-200 text-slate-700 shadow-none hover:bg-slate-50">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Edit details</DropdownMenuItem>
                  <DropdownMenuItem>Discharge patient</DropdownMenuItem>
                  <DropdownMenuItem className="text-rose-600">Delete record</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Body Columns */}
          <div className="grid grid-cols-12 gap-8">
            
            {/* LEFT COLUMN */}
            <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
              
              {/* Tabs */}
              <div className="flex items-center border-b border-slate-200">
                <Tab active>Overview</Tab>
                <Tab>Visits</Tab>
                <Tab>Medical records</Tab>
                <Tab>Reports</Tab>
                <Tab>Prescriptions</Tab>
                <Tab>Billing</Tab>
                <Tab>Files</Tab>
              </div>

              {/* Allergies & Alerts */}
              <Card className="shadow-none border-rose-200 bg-rose-50/30 rounded-lg">
                <CardContent className="p-4 flex gap-4">
                  <FileWarning className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-rose-900 mb-1">Active Alerts & Allergies</h4>
                    <ul className="text-sm text-rose-700 space-y-1 list-disc list-inside">
                      <li>Penicillin (Severe anaphylactic reaction)</li>
                      <li>Peanuts (Mild rash, recorded 2018)</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Vitals Strip */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-semibold text-slate-900">Latest Vitals</h3>
                  <span className="text-xs text-slate-500">Updated 2h ago</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                  <VitalBox label="BP" value="120/80" unit="mmHg" />
                  <VitalBox label="HR" value="72" unit="bpm" showSparkline />
                  <VitalBox label="SpO2" value="98" unit="%" />
                  <VitalBox label="Temp" value="98.6" unit="°F" />
                  <VitalBox label="Weight" value="64" unit="kg" />
                  <VitalBox label="BMI" value="22.1" unit="" />
                </div>
              </div>

              {/* Active Problems List */}
              <Card className="shadow-none border-slate-200 rounded-lg bg-white">
                <CardHeader className="px-6 py-5 border-b border-slate-100 flex flex-row items-center justify-between">
                  <CardTitle className="text-base font-semibold text-slate-900">Active Problems</CardTitle>
                  <Button variant="ghost" size="sm" className="h-8 text-teal-700 p-0 hover:bg-transparent">
                    <Plus className="w-4 h-4 mr-1" /> Add
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-slate-100">
                    <ProblemRow 
                      code="I10" 
                      condition="Essential (primary) hypertension" 
                      onset="Mar 12, 2024" 
                      severity="Moderate" 
                      severityColor="amber"
                    />
                    <ProblemRow 
                      code="E11.9" 
                      condition="Type 2 diabetes mellitus without complications" 
                      onset="Jan 05, 2025" 
                      severity="Mild" 
                      severityColor="slate"
                    />
                    <ProblemRow 
                      code="I20.9" 
                      condition="Angina pectoris, unspecified" 
                      onset="Oct 14, 2026" 
                      severity="Severe" 
                      severityColor="rose"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Current Medications */}
              <Card className="shadow-none border-slate-200 rounded-lg bg-white">
                <CardHeader className="px-6 py-5 border-b border-slate-100 flex flex-row items-center justify-between">
                  <CardTitle className="text-base font-semibold text-slate-900">Current Medications</CardTitle>
                  <Button variant="link" className="text-teal-700 h-auto p-0 text-sm font-medium">View all</Button>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-slate-50/50">
                      <TableRow className="border-slate-100 hover:bg-transparent">
                        <TableHead className="text-xs font-medium text-slate-500 h-10 px-6">Drug Name</TableHead>
                        <TableHead className="text-xs font-medium text-slate-500 h-10">Dose</TableHead>
                        <TableHead className="text-xs font-medium text-slate-500 h-10">Frequency</TableHead>
                        <TableHead className="text-xs font-medium text-slate-500 h-10">Started</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow className="border-slate-100">
                        <TableCell className="px-6 py-3 font-medium text-slate-900 text-sm">Metformin</TableCell>
                        <TableCell className="py-3 text-slate-600 text-sm">500 mg</TableCell>
                        <TableCell className="py-3 text-slate-600 text-sm">Twice daily</TableCell>
                        <TableCell className="py-3 text-slate-500 text-sm">Jan 05, 2025</TableCell>
                      </TableRow>
                      <TableRow className="border-slate-100">
                        <TableCell className="px-6 py-3 font-medium text-slate-900 text-sm">Lisinopril</TableCell>
                        <TableCell className="py-3 text-slate-600 text-sm">10 mg</TableCell>
                        <TableCell className="py-3 text-slate-600 text-sm">Once daily</TableCell>
                        <TableCell className="py-3 text-slate-500 text-sm">Mar 12, 2024</TableCell>
                      </TableRow>
                      <TableRow className="border-slate-100">
                        <TableCell className="px-6 py-3 font-medium text-slate-900 text-sm">Aspirin</TableCell>
                        <TableCell className="py-3 text-slate-600 text-sm">81 mg</TableCell>
                        <TableCell className="py-3 text-slate-600 text-sm">Once daily</TableCell>
                        <TableCell className="py-3 text-slate-500 text-sm">Oct 14, 2026</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Recent Visits Timeline */}
              <Card className="shadow-none border-slate-200 rounded-lg bg-white">
                <CardHeader className="px-6 py-5 border-b border-slate-100">
                  <CardTitle className="text-base font-semibold text-slate-900">Recent Visits</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="relative pl-6 space-y-6 before:absolute before:inset-0 before:ml-[11px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-slate-200 before:content-['']">
                    
                    <TimelineItem 
                      date="Oct 14, 2026" 
                      type="Inpatient Admission" 
                      doctor="Dr. Aarav Mehta" 
                      summary="Admitted from ER due to acute chest pain. Stable now, pending angio."
                      isLatest
                    />
                    <TimelineItem 
                      date="Oct 14, 2026" 
                      type="Emergency Visit" 
                      doctor="Dr. K. Patel" 
                      summary="Patient presented with severe chest pain radiating to left arm."
                    />
                    <TimelineItem 
                      date="Aug 02, 2026" 
                      type="Routine Checkup" 
                      doctor="Dr. Aarav Mehta" 
                      summary="BP elevated (145/90). Medication adjustment advised."
                    />
                    <TimelineItem 
                      date="Jan 05, 2025" 
                      type="Consultation" 
                      doctor="Dr. S. Reddy" 
                      summary="Initial diabetes consultation. Started on Metformin."
                    />

                  </div>
                </CardContent>
              </Card>

            </div>

            {/* RIGHT COLUMN */}
            <div className="col-span-12 lg:col-span-4 space-y-6">
              
              {/* Care Team */}
              <Card className="shadow-none border-slate-200 rounded-lg bg-white">
                <CardHeader className="px-5 py-4 border-b border-slate-100">
                  <CardTitle className="text-base font-semibold text-slate-900">Care Team</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-slate-100">
                    <CareTeamRow name="Dr. Aarav Mehta" role="Primary Cardiologist" initials="AM" />
                    <CareTeamRow name="Dr. K. Patel" role="ER Physician" initials="KP" />
                    <CareTeamRow name="Nurse R. Singh" role="Assigned Nurse" initials="RS" />
                  </div>
                </CardContent>
              </Card>

              {/* Upcoming Appointments */}
              <Card className="shadow-none border-slate-200 rounded-lg bg-white">
                <CardHeader className="px-5 py-4 border-b border-slate-100">
                  <CardTitle className="text-base font-semibold text-slate-900">Upcoming Appointments</CardTitle>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center bg-slate-50 border border-slate-100 rounded p-2 min-w-[60px]">
                      <span className="text-xs font-medium text-slate-500 uppercase">Oct</span>
                      <span className="text-xl font-bold text-slate-900">18</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900">Angiography</h4>
                      <p className="text-xs text-slate-500 mt-1">Dr. Aarav Mehta • Cath Lab 2</p>
                      <p className="text-xs text-slate-400 mt-0.5">09:00 AM - 10:30 AM</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Insurance Card */}
              <Card className="shadow-none border-slate-200 rounded-lg bg-white overflow-hidden">
                <div className="bg-slate-900 p-5 text-white relative overflow-hidden">
                  <div className="absolute -right-4 -top-12 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                  <div className="flex justify-between items-start mb-6">
                    <span className="font-semibold tracking-wide">HDFC ERGO</span>
                    <Badge variant="secondary" className="bg-white/20 text-white hover:bg-white/20 border-0 font-normal rounded-md shadow-none px-2 py-0.5 text-xs">
                      Active
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-slate-400 uppercase tracking-wider">Policy Number</p>
                    <p className="font-mono text-sm">HDF-8832-9011-44X</p>
                  </div>
                </div>
                <div className="px-5 py-3 bg-white flex justify-between text-sm">
                  <div>
                    <span className="text-slate-500 text-xs block">Copay</span>
                    <span className="font-medium text-slate-900">₹500</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 text-xs block">Valid Through</span>
                    <span className="font-medium text-slate-900">Dec 2027</span>
                  </div>
                </div>
              </Card>

              {/* Billing Snapshot */}
              <Card className="shadow-none border-slate-200 rounded-lg bg-white">
                <CardHeader className="px-5 py-4 border-b border-slate-100">
                  <CardTitle className="text-base font-semibold text-slate-900">Billing Snapshot</CardTitle>
                </CardHeader>
                <CardContent className="p-5">
                  <div className="flex items-end justify-between mb-4">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Outstanding Balance</p>
                      <p className="text-2xl font-semibold text-rose-600">₹14,500</p>
                    </div>
                    <Button variant="link" className="text-teal-700 h-auto p-0 text-sm font-medium">View ledger</Button>
                  </div>
                  <div className="text-sm text-slate-600 border-t border-slate-100 pt-3">
                    Last payment: <span className="font-medium text-slate-900">₹2,000</span> on Oct 14
                  </div>
                </CardContent>
              </Card>

              {/* Documents */}
              <Card className="shadow-none border-slate-200 rounded-lg bg-white">
                <CardHeader className="px-5 py-4 border-b border-slate-100">
                  <CardTitle className="text-base font-semibold text-slate-900">Recent Documents</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-slate-100">
                    <DocRow title="ECG Report" date="Oct 14, 2026" />
                    <DocRow title="Blood Panel (Fasting)" date="Oct 14, 2026" />
                    <DocRow title="Admission Summary" date="Oct 14, 2026" />
                  </div>
                </CardContent>
              </Card>

            </div>
          </div>

          <footer className="pt-4 pb-2 text-center border-t border-slate-200 mt-4">
            <p className="text-xs text-slate-400">
              Last updated 14 minutes ago by Dr. Aarav Mehta
            </p>
          </footer>

        </div>
      </main>
    </div>
  );
}

// Subcomponents

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

function Tab({ children, active = false }: { children: React.ReactNode, active?: boolean }) {
  return (
    <button className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
      active 
        ? "border-teal-700 text-teal-700" 
        : "border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300"
    }`}>
      {children}
    </button>
  );
}

function VitalBox({ label, value, unit, showSparkline = false }: { label: string, value: string, unit: string, showSparkline?: boolean }) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-3 flex flex-col justify-between h-20">
      <span className="text-xs font-medium text-slate-500">{label}</span>
      <div className="flex items-end justify-between">
        <span className="font-semibold text-lg text-slate-900">{value}<span className="text-xs font-normal text-slate-500 ml-1">{unit}</span></span>
        {showSparkline && (
          <div className="w-10 h-6">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={vitalsSparklineData}>
                <Area type="monotone" dataKey="value" stroke="#0f766e" fill="#0f766e" fillOpacity={0.1} strokeWidth={1.5} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

function ProblemRow({ code, condition, onset, severity, severityColor }: { code: string, condition: string, onset: string, severity: string, severityColor: string }) {
  const colorMap: Record<string, string> = {
    amber: "bg-amber-50 text-amber-700",
    slate: "bg-slate-100 text-slate-700",
    rose: "bg-rose-50 text-rose-700"
  };
  
  return (
    <div className="px-6 py-4 flex items-start justify-between hover:bg-slate-50 transition-colors">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0 h-4 border-slate-200 text-slate-500">{code}</Badge>
          <span className="text-sm font-medium text-slate-900">{condition}</span>
        </div>
        <p className="text-xs text-slate-500">Onset: {onset}</p>
      </div>
      <Badge variant="secondary" className={`${colorMap[severityColor] || colorMap.slate} border-0 font-normal rounded-md shadow-none px-2 py-0.5 text-xs`}>
        {severity}
      </Badge>
    </div>
  );
}

function TimelineItem({ date, type, doctor, summary, isLatest = false }: { date: string, type: string, doctor: string, summary: string, isLatest?: boolean }) {
  return (
    <div className="relative mb-6 last:mb-0 z-10">
      <div className={`absolute -left-[31px] w-3 h-3 rounded-full border-2 border-white top-1 ${isLatest ? 'bg-teal-600' : 'bg-slate-300'}`}></div>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs font-semibold text-slate-900">{type}</span>
        <span className="text-xs text-slate-400">• {date}</span>
      </div>
      <p className="text-xs font-medium text-teal-700 mb-1">{doctor}</p>
      <p className="text-sm text-slate-600">{summary}</p>
    </div>
  );
}

function CareTeamRow({ name, role, initials }: { name: string, role: string, initials: string }) {
  return (
    <div className="px-5 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
      <div className="flex items-center gap-3">
        <Avatar className="w-8 h-8 border border-slate-200">
          <AvatarFallback className="bg-slate-100 text-slate-600 text-xs font-medium">{initials}</AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-medium text-slate-900">{name}</p>
          <p className="text-xs text-slate-500">{role}</p>
        </div>
      </div>
      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-teal-700">
        <MessageSquare className="w-4 h-4" />
      </Button>
    </div>
  );
}

function DocRow({ title, date }: { title: string, date: string }) {
  return (
    <div className="px-5 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors group cursor-pointer">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded bg-rose-50 flex items-center justify-center text-rose-600 shrink-0">
          <FileText className="w-4 h-4" />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-900 group-hover:text-teal-700 transition-colors">{title}</p>
          <p className="text-xs text-slate-500">{date}</p>
        </div>
      </div>
      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
        <Download className="w-4 h-4" />
      </Button>
    </div>
  );
}
