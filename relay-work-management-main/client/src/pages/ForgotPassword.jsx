import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axiosConfig';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email });
      setMessage(res.data.message);
    } catch {
      setMessage('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 px-4">
      <div className="w-full max-w-md bg-white/95 backdrop-blur p-8 rounded-2xl shadow-2xl">
        <h2 className="text-xl font-semibold text-slate-800 mb-2">Forgot Password</h2>
        <p className="text-sm text-slate-500 mb-6">Enter your email to receive a reset link.</p>

        {message && <p className="text-sm text-indigo-600 bg-indigo-50 px-4 py-2 rounded-lg mb-4">{message}</p>}

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium py-2.5 rounded-lg transition-colors"
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <Link to="/" className="block text-center text-sm text-indigo-600 mt-4 hover:underline">
          Back to Login
        </Link>
      </div>
    </div>
  );
}

export default ForgotPassword;