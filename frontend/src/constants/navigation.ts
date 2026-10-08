export interface NavItem {
  id: string;
  label: string;
  path: string;
  iconName: string;
  badge?: string;
  badgeVariant?: 'default' | 'positive' | 'negative' | 'warning' | 'ai';
  section: 'core' | 'intelligence' | 'management';
}

export const NAVIGATION_ITEMS: NavItem[] = [
  // Core Portfolio & Activity
  {
    id: 'overview',
    label: 'Overview',
    path: '/',
    iconName: 'LayoutDashboard',
    section: 'core',
  },
  {
    id: 'analytics',
    label: 'Analytics',
    path: '/analytics',
    iconName: 'BarChart3',
    section: 'core',
  },
  {
    id: 'transactions',
    label: 'Transactions',
    path: '/transactions',
    iconName: 'Receipt',
    section: 'core',
  },
  {
    id: 'savings',
    label: 'Savings',
    path: '/savings',
    iconName: 'PiggyBank',
    section: 'core',
  },
  {
    id: 'investments',
    label: 'Investments',
    path: '/investments',
    iconName: 'TrendingUp',
    section: 'core',
  },

  // AI & ML Intelligence
  {
    id: 'predictions',
    label: 'Predictions',
    path: '/predictions',
    iconName: 'BrainCircuit',
    badge: 'ML',
    badgeVariant: 'ai',
    section: 'intelligence',
  },
  {
    id: 'insights',
    label: 'AI Insights',
    path: '/insights',
    iconName: 'Sparkles',
    badge: 'AI',
    badgeVariant: 'ai',
    section: 'intelligence',
  },
  {
    id: 'assistant',
    label: 'AI Assistant',
    path: '/assistant',
    iconName: 'Bot',
    section: 'intelligence',
  },
  {
    id: 'anomalies',
    label: 'Anomalies',
    path: '/anomalies',
    iconName: 'AlertTriangle',
    section: 'intelligence',
  },

  // Operations & Management
  {
    id: 'import',
    label: 'Import Data',
    path: '/import',
    iconName: 'UploadCloud',
    section: 'management',
  },
  {
    id: 'settings',
    label: 'Settings',
    path: '/settings',
    iconName: 'Settings',
    section: 'management',
  },
];
