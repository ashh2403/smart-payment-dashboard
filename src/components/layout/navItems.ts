import { ArrowLeftRight, BarChart3, FileText, Info, LayoutDashboard, Settings, ShieldAlert, UploadCloud } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  description: string;
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, description: 'KPIs, trends and recent activity' },
  { to: '/transactions', label: 'Transactions', icon: ArrowLeftRight, description: 'Search, filter and export records' },
  { to: '/analytics', label: 'Analytics', icon: BarChart3, description: 'Volumes, values and performance' },
  { to: '/monitoring', label: 'Monitoring & Alerts', icon: ShieldAlert, description: 'Rule-based alerts and failed transactions' },
  { to: '/reports', label: 'Reports', icon: FileText, description: 'Summary reports, CSV and print' },
  { to: '/import', label: 'Import Data', icon: UploadCloud, description: 'Upload CSV exports or add transactions' },
  { to: '/settings', label: 'Settings', icon: Settings, description: 'Profile, password and preferences' },
  { to: '/about', label: 'About Project', icon: Info, description: 'Abstract, modules and team' },
];
