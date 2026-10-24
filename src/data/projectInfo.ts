// Project content taken from the Professional Training I presentation.

export const PROJECT = {
  title: 'Smart Digital Payment Transaction Analytics and Monitoring Dashboard',
  shortName: 'PayPulse',
  course: 'Professional Training I',
  department: 'Department of Computer Science and Engineering',
  school: 'School of Computing',
  institution: 'Sathyabama Institute of Science and Technology',
  address: 'Jeppiaar Nagar, Rajiv Gandhi Salai, Chennai – 600 119, Tamil Nadu',
  students: [
    { name: 'S. Lajithan', regNo: '44110407' },
    { name: 'M. Larun Nishan', regNo: '44110412' },
  ],
  guide: {
    name: 'Dr. S. Pothumani',
    qualification: 'M.E., Ph.D.',
    designation: 'Associate Professor, CSE',
  },
};

export const ABSTRACT =
  'The Smart Digital Payment Transaction Analytics and Monitoring Dashboard is designed to analyze and monitor digital payment transactions efficiently. It collects important transaction details such as amount, date, time, payment method, and transaction status. The system processes transaction data to identify trends, patterns, and payment performance. An interactive dashboard presents the information using charts, graphs, tables, and key performance indicators. It helps users easily track successful, failed, and pending transactions. Regularly updated data enables quick monitoring of payment activities. The dashboard supports better decision-making through clear and meaningful visual insights. Overall, the proposed system provides a smart, centralized, and user-friendly solution for digital payment transaction analytics.';

export const INTRODUCTION =
  'Digital payments have become an essential part of modern financial transactions, making payments faster, easier, and more convenient. The rapid growth of digital transactions generates a large amount of financial data every day. This dashboard provides a centralized platform to analyze transaction information efficiently — amount, payment method, date, time, and status — using interactive charts, graphs, and tables. It enables quick monitoring of successful, failed, and pending transactions, highlights unusual patterns for further analysis, reduces manual effort, and supports data-driven decision-making.';

export const OBJECTIVES = [
  'To analyze digital payment transaction data efficiently and accurately.',
  'To monitor successful, failed, and pending transactions in a centralized dashboard.',
  'To visualize transaction trends using interactive charts, graphs, and tables.',
  'To identify unusual transaction patterns for further review.',
  'To provide meaningful insights for better and faster decision-making.',
];

export const MODULES = [
  {
    key: 'collection',
    name: 'Data Collection Module',
    description:
      'Collects digital payment transaction details from sample datasets representing UPI, cards, digital wallets, and online banking.',
  },
  {
    key: 'processing',
    name: 'Data Processing Module',
    description:
      'Cleans, validates, and organizes transaction data — removing invalid, duplicate, or incomplete records before analysis.',
  },
  {
    key: 'analytics',
    name: 'Transaction Analytics Module',
    description:
      'Analyzes transaction volume, payment status, amounts, trends, and payment-method performance.',
  },
  {
    key: 'monitoring',
    name: 'Monitoring & Alert Module',
    description:
      'Flags predefined unusual patterns in transactions (high value, rapid repeats, repeated failures, odd hours) for investigation.',
  },
  {
    key: 'reporting',
    name: 'Dashboard & Reporting Module',
    description:
      'Displays KPIs, charts, filters, and downloadable / printable reports for monitoring and decision-making.',
  },
];

export const RESULTS =
  'The system successfully processes and analyzes transaction data. The dashboard displays transaction amounts, payment methods, dates, and statuses clearly, with visual charts that reveal trends and patterns. Successful, failed, and pending transactions can be monitored easily, and interactive filters let users view specific transaction details quickly. The visual presentation makes complex payment data easier to understand, reduces manual effort, and supports faster, better-informed decisions.';

export const CONCLUSION =
  'The Smart Digital Payment Transaction Analytics and Monitoring Dashboard provides an efficient solution for managing and analyzing digital payment data. It collects, processes, and visualizes transaction information through an interactive dashboard, helping users monitor transaction status, payment trends, volumes, and unusual activities. KPIs and charts make complex data easier to understand, reduce manual analysis, and support quick identification of failed or flagged transactions for investigation. Overall, the system improves the efficiency, visibility, and organization of digital payment transaction monitoring.';

export const TECH_STACK = [
  { name: 'React 18', role: 'Component-based UI library' },
  { name: 'Vite', role: 'Fast dev server & build tool' },
  { name: 'TypeScript', role: 'Type-safe application code' },
  { name: 'Tailwind CSS', role: 'Utility-first responsive styling' },
  { name: 'Recharts', role: 'Interactive data visualization' },
  { name: 'React Router', role: 'Client-side page navigation' },
  { name: 'Lucide React', role: 'Consistent icon set' },
  { name: 'Supabase', role: 'PostgreSQL database, auth & row-level security' },
];
