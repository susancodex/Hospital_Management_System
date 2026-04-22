import React, { useState } from "react";
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
  MoreHorizontal,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  List,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  Upload,
  UserPlus,
  Rows3
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";

const PATIENTS = [
  { id: 1, name: "Wei Chen", mrn: "MRN-2026-0481", ageSex: "42 / M", dept: "Cardiology", doctor: "Dr. Sofia Hernandez", lastVisit: "Oct 12, 2026", insurance: "Aetna", status: "Discharged", initials: "WC" },
  { id: 2, name: "Priya Sharma", mrn: "MRN-2026-0482", ageSex: "35 / F", dept: "Neurology", doctor: "Dr. Aarav Mehta", lastVisit: "Oct 14, 2026", insurance: "Star Health", status: "Inpatient", initials: "PS" },
  { id: 3, name: "James Wilson", mrn: "MRN-2026-0483", ageSex: "68 / M", dept: "Orthopedics", doctor: "Dr. Sarah Jenkins", lastVisit: "Oct 15, 2026", insurance: "BCBS", status: "Critical", initials: "JW" },
  { id: 4, name: "Anita Desai", mrn: "MRN-2026-0484", ageSex: "29 / F", dept: "Pediatrics", doctor: "Dr. Emily Chen", lastVisit: "Oct 15, 2026", insurance: "HDFC ERGO", status: "Outpatient", initials: "AD" },
  { id: 5, name: "Robert Taylor", mrn: "MRN-2026-0485", ageSex: "55 / M", dept: "Oncology", doctor: "Dr. Marcus Johnson", lastVisit: "Oct 10, 2026", insurance: "Aetna", status: "Inpatient", initials: "RT" },
  { id: 6, name: "Elena Rostova", mrn: "MRN-2026-0486", ageSex: "48 / F", dept: "ER", doctor: "Dr. Sofia Hernandez", lastVisit: "Oct 15, 2026", insurance: "BCBS", status: "Critical", initials: "ER" },
  { id: 7, name: "David Smith", mrn: "MRN-2026-0487", ageSex: "31 / M", dept: "Dermatology", doctor: "Dr. Rachel Kim", lastVisit: "Oct 08, 2026", insurance: "Star Health", status: "Outpatient", initials: "DS" },
  { id: 8, name: "Maria Garcia", mrn: "MRN-2026-0488", ageSex: "62 / F", dept: "Cardiology", doctor: "Dr. Aarav Mehta", lastVisit: "Oct 15, 2026", insurance: "HDFC ERGO", status: "Outpatient", initials: "MG" },
  { id: 9, name: "Kenji Sato", mrn: "MRN-2026-0489", ageSex: "75 / M", dept: "ICU", doctor: "Dr. James Wilson", lastVisit: "Oct 14, 2026", insurance: "Aetna", status: "Critical", initials: "KS" },
  { id: 10, name: "Fatima Al-Fayed", mrn: "MRN-2026-0490", ageSex: "22 / F", dept: "ER", doctor: "Dr. Sarah Jenkins", lastVisit: "Oct 15, 2026", insurance: "BCBS", status: "Inpatient", initials: "FA" },
  { id: 11, name: "Thomas Anderson", mrn: "MRN-2026-0491", ageSex: "39 / M", dept: "Neurology", doctor: "Dr. Aarav Mehta", lastVisit: "Oct 11, 2026", insurance: "Star Health", status: "Discharged", initials: "TA" },
  { id: 12, name: "Sarah Connor", mrn: "MRN-2026-0492", ageSex: "33 / F", dept: "Orthopedics", doctor: "Dr. Marcus Johnson", lastVisit: "Oct 13, 2026", insurance: "Aetna", status: "Outpatient", initials: "SC" },
];

export function PatientsList() {
  const [selectedRows, setSelectedRows] = useState<number[]>([2]); // James Wilson selected by default to show toolbar
  const [activeTab, setActiveTab] = useState("All");

  const toggleRow = (id: number) => {
    setSelectedRows(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]);
  };

  const toggleAll = () => {
    if (selectedRows.length === PATIENTS.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(PATIENTS.map(p => p.id));
    }
  };

  const getStatusConfig = (status: string) => {
    switch(status) {
      case "Discharged": return "bg-slate-100 text-slate-700 hover:bg-slate-100";
      case "Inpatient": return "bg-blue-50 text-blue-700 hover:bg-blue-50";
      case "Critical": return "bg-rose-50 text-rose-700 hover:bg-rose-50";
      case "Outpatient": return "bg-emerald-50 text-emerald-700 hover:bg-emerald-50";
      default: return "bg-slate-100 text-slate-700 hover:bg-slate-100";
    }
  };

  return (
    <div className="min-h-[900px] w-full bg-[#fcfcfc] text-slate-900 font-sans flex overflow-hidden">
      {/* Sidebar - Reused exact structure from Clinical.tsx */}
      <aside className="w-64 border-r border-slate-200 bg-white flex flex-col justify-between shrink-0 h-screen sticky top-0">
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
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Topbar - Reused exact structure from Clinical.tsx */}
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

        {/* Page Content - Scrollable area */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-8 max-w-[1600px] mx-auto w-full flex flex-col h-full min-h-max space-y-6">
            
            {/* Header */}
            <div className="flex items-end justify-between">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Patients</h1>
                <p className="text-sm text-slate-500 mt-1">12,438 active records</p>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" className="h-9 px-4 border-slate-200 text-slate-700 shadow-none hover:bg-slate-50">
                  <Upload className="w-4 h-4 mr-2" />
                  Import CSV
                </Button>
                <Button className="h-9 px-4 bg-teal-700 hover:bg-teal-800 text-white shadow-none">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add patient
                </Button>
              </div>
            </div>

            {/* Mini Stat Cards */}
            <div className="grid grid-cols-4 gap-6 shrink-0">
              <StatCard title="Active Patients" value="1,248" trend="+12" trendUp={true} />
              <StatCard title="Admitted Today" value="45" trend="+5" trendUp={true} />
              <StatCard title="Discharged Today" value="32" trend="-3" trendUp={false} />
              <StatCard title="Critical" value="18" trend="+2" trendUp={false} isCritical={true} />
            </div>

            {/* Filter Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 shrink-0 bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3 flex-1 min-w-[500px]">
                <div className="relative w-64 shrink-0">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input 
                    placeholder="Search by name, MRN, phone…" 
                    className="pl-9 h-8 bg-white border-slate-200 text-sm shadow-none focus-visible:ring-teal-700"
                  />
                </div>
                
                <div className="h-6 w-px bg-slate-200 shrink-0"></div>
                
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                  {["All", "Inpatient", "Outpatient", "Discharged", "Critical"].map(tab => (
                    <button 
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                        activeTab === tab 
                          ? "bg-slate-100 text-slate-900" 
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button variant="outline" size="sm" className="h-8 border-slate-200 text-slate-600 text-xs shadow-none">
                  Department <ChevronDown className="w-3 h-3 ml-2 text-slate-400" />
                </Button>
                <Button variant="outline" size="sm" className="h-8 border-slate-200 text-slate-600 text-xs shadow-none">
                  Doctor <ChevronDown className="w-3 h-3 ml-2 text-slate-400" />
                </Button>
                <Button variant="outline" size="sm" className="h-8 border-slate-200 text-slate-600 text-xs shadow-none">
                  <CalendarIcon className="w-3 h-3 mr-2 text-slate-400" />
                  Last 30 days
                </Button>
                <Button variant="ghost" size="sm" className="h-8 text-slate-600 text-xs px-2 hover:bg-slate-100">
                  <Filter className="w-3.5 h-3.5 mr-1.5" />
                  More filters
                </Button>
                
                <div className="h-5 w-px bg-slate-200 mx-1"></div>
                
                <div className="flex items-center bg-slate-100 rounded-md p-0.5">
                  <button className="p-1 bg-white rounded shadow-sm text-slate-900">
                    <List className="w-4 h-4" />
                  </button>
                  <button className="p-1 text-slate-500 hover:text-slate-900">
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:bg-slate-100 rounded-md ml-1">
                  <Rows3 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Selected Rows Toolbar (Conditional) */}
            {selectedRows.length > 0 && (
              <div className="bg-teal-50 border border-teal-200 rounded-lg p-3 flex items-center justify-between shrink-0 shadow-sm transition-all duration-200 ease-in-out origin-top">
                <div className="flex items-center gap-3">
                  <Badge className="bg-teal-700 hover:bg-teal-700 text-white shadow-none px-2 py-0.5 rounded text-xs font-semibold">
                    {selectedRows.length} selected
                  </Badge>
                  <span className="text-sm font-medium text-teal-800">Choose action for selected patients</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="h-8 border-teal-200 text-teal-800 hover:bg-teal-100 bg-white shadow-none text-xs">
                    Assign Doctor
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 border-teal-200 text-teal-800 hover:bg-teal-100 bg-white shadow-none text-xs">
                    Export
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 border-teal-200 text-teal-800 hover:bg-teal-100 bg-white shadow-none text-xs">
                    Archive
                  </Button>
                </div>
              </div>
            )}

            {/* Table Area */}
            <div className="flex-1 bg-white border border-slate-200 rounded-lg shadow-sm flex flex-col overflow-hidden relative">
              <div className="flex-1 overflow-auto">
                <Table className="w-full text-left border-collapse">
                  <TableHeader className="bg-slate-50/80 sticky top-0 z-10 backdrop-blur-sm border-b border-slate-200">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-[40px] px-4 py-3">
                        <Checkbox 
                          checked={selectedRows.length === PATIENTS.length}
                          onCheckedChange={toggleAll}
                          className="border-slate-300 text-teal-700 data-[state=checked]:bg-teal-700 data-[state=checked]:border-teal-700"
                        />
                      </TableHead>
                      <TableHead className="text-xs font-medium text-slate-500 py-3">Patient</TableHead>
                      <TableHead className="text-xs font-medium text-slate-500 py-3">Age / Sex</TableHead>
                      <TableHead className="text-xs font-medium text-slate-500 py-3">Department</TableHead>
                      <TableHead className="text-xs font-medium text-slate-500 py-3">Primary Doctor</TableHead>
                      <TableHead className="text-xs font-medium text-slate-500 py-3">Last Visit</TableHead>
                      <TableHead className="text-xs font-medium text-slate-500 py-3">Insurance</TableHead>
                      <TableHead className="text-xs font-medium text-slate-500 py-3">Status</TableHead>
                      <TableHead className="w-[40px] px-4 py-3"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-slate-100">
                    {PATIENTS.map((patient) => {
                      const isSelected = selectedRows.includes(patient.id);
                      return (
                        <TableRow 
                          key={patient.id} 
                          className={`hover:bg-slate-50 transition-colors group ${isSelected ? 'bg-teal-50/30' : ''}`}
                        >
                          <TableCell className="px-4 py-2.5">
                            <Checkbox 
                              checked={isSelected}
                              onCheckedChange={() => toggleRow(patient.id)}
                              className="border-slate-300 text-teal-700 data-[state=checked]:bg-teal-700 data-[state=checked]:border-teal-700"
                            />
                          </TableCell>
                          <TableCell className="py-2.5">
                            <div className="flex items-center gap-3">
                              <Avatar className="w-8 h-8 border border-slate-200">
                                <AvatarFallback className="bg-slate-100 text-slate-600 text-xs font-medium">
                                  {patient.initials}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-medium text-slate-900 leading-none group-hover:text-teal-700 transition-colors">{patient.name}</p>
                                <p className="text-xs text-slate-500 font-mono mt-1">{patient.mrn}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-2.5 text-sm text-slate-600">{patient.ageSex}</TableCell>
                          <TableCell className="py-2.5 text-sm text-slate-600">{patient.dept}</TableCell>
                          <TableCell className="py-2.5 text-sm text-slate-600">{patient.doctor}</TableCell>
                          <TableCell className="py-2.5 text-sm text-slate-600">{patient.lastVisit}</TableCell>
                          <TableCell className="py-2.5 text-sm text-slate-600">{patient.insurance}</TableCell>
                          <TableCell className="py-2.5">
                            <Badge variant="secondary" className={`${getStatusConfig(patient.status)} border-0 font-normal rounded-md shadow-none px-2 py-0.5 text-[11px]`}>
                              {patient.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-4 py-2.5 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-40">
                                <DropdownMenuItem className="text-xs">View full profile</DropdownMenuItem>
                                <DropdownMenuItem className="text-xs">Edit details</DropdownMenuItem>
                                <DropdownMenuItem className="text-xs">Schedule appointment</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination Footer */}
              <div className="border-t border-slate-200 px-6 py-3 bg-white flex items-center justify-between shrink-0">
                <p className="text-xs text-slate-500">
                  Showing <span className="font-medium text-slate-900">1–12</span> of <span className="font-medium text-slate-900">12,438</span> patients
                </p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Rows per page</span>
                    <Button variant="outline" size="sm" className="h-7 text-xs border-slate-200 px-2 shadow-none text-slate-700">
                      12 <ChevronDown className="w-3 h-3 ml-1 text-slate-400" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="icon" className="h-7 w-7 border-slate-200 text-slate-500 shadow-none disabled:opacity-50" disabled>
                      <ChevronLeft className="w-3 h-3" />
                    </Button>
                    <Button variant="outline" size="icon" className="h-7 w-7 border-slate-200 text-slate-700 shadow-none">
                      <ChevronRight className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

          </div>
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

function StatCard({ title, value, trend, trendUp, isCritical = false }: { title: string, value: string, trend: string, trendUp: boolean, isCritical?: boolean }) {
  return (
    <Card className="shadow-sm border-slate-200 rounded-lg bg-white">
      <CardContent className="p-4">
        <p className="text-xs font-medium text-slate-500 mb-1">{title}</p>
        <div className="flex items-end justify-between">
          <h3 className="text-xl font-semibold tracking-tight text-slate-900">{value}</h3>
          <div className={`flex items-center text-xs font-medium px-1.5 py-0.5 rounded ${
            isCritical 
              ? "bg-rose-50 text-rose-700" 
              : trendUp 
                ? "bg-emerald-50 text-emerald-700" 
                : "bg-slate-100 text-slate-600"
          }`}>
            {trendUp ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
            {trend} vs yesterday
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
