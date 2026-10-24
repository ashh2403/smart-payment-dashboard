import { Link } from 'react-router-dom';
import Logo from '../components/layout/Logo';

export default function NotFound() {
  return (
    <div className="grid-bg flex min-h-screen flex-col items-center justify-center bg-navy-950 px-6 text-center">
      <Logo />
      <p className="mt-10 text-7xl font-extrabold text-white/90">404</p>
      <p className="mt-2 text-slate-400">This page does not exist.</p>
      <div className="mt-6 flex gap-3">
        <Link to="/" className="btn-dark">Go home</Link>
        <Link to="/dashboard" className="btn-primary">Open dashboard</Link>
      </div>
    </div>
  );
}
