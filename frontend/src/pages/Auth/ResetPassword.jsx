import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import api from '../../services/api';
import { toast } from 'react-toastify';
import { Lock, Eye, EyeOff, ShieldCheck, CheckCircle2, XCircle, ArrowLeft } from 'lucide-react';

const resetImg = "https://images.unsplash.com/photo-1523050335456-c38447d0d93f?auto=format&fit=crop&q=80&w=1200";

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const resetToken = location.state?.resetToken;

  useEffect(() => {
    if (!resetToken) {
      navigate('/forgot-password', { replace: true });
    }
  }, [resetToken, navigate]);

  if (!resetToken) return null;

  const passwordValidation = {
    length: newPassword.length >= 8,
    number: /\d/.test(newPassword),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
    match: newPassword === confirmPassword && newPassword !== ''
  };

  const allValid = Object.values(passwordValidation).every(Boolean);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!allValid) {
      toast.error('Please meet all password requirements');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/auth/reset-password', { resetToken, newPassword });
      toast.success('Password reset successfully. You can now login.');
      navigate('/login', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update password');
      if (err.response?.status === 401) {
        navigate('/forgot-password');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white font-inter">
      {/* Left Pane - Image (Hidden on small screens) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-primary-900 border-r-8 border-primary-100">
        <img
          src={resetImg}
          alt="Secure Learning"
          className="absolute inset-0 w-full h-full object-cover opacity-50 mix-blend-overlay scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-primary-900 via-primary-900/40 to-transparent"></div>
        
        <div className="relative z-10 flex flex-col justify-end p-20 text-white w-full">
           <div className="max-w-md">
            <h1 className="text-7xl font-black leading-none mb-10 tracking-tighter">
              Secure <br />
              <span className="text-primary-400">Restored.</span>
            </h1>
            <p className="text-xl text-primary-100/80 leading-relaxed font-semibold">
              Your security is our priority. Create a strong password to ensure your account remains safe and private.
            </p>
          </div>
        </div>
      </div>

      {/* Right Pane - Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center px-8 lg:px-24 py-12 overflow-y-auto">
        <div className="max-w-md w-full">
          <div className="mb-10">
            <h2 className="text-4xl font-black text-gray-900 mb-4 tracking-tight">New Password</h2>
            <p className="text-lg text-gray-500 font-medium italic">"A strong password is your first line of defense."</p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* New Password */}
            <div className="space-y-2">
              <label className="text-sm font-black text-gray-700 ml-4 uppercase tracking-widest">New Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none group-focus-within:text-primary-600 transition-colors">
                  <Lock className="h-6 w-6 text-gray-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  className="w-full pl-14 pr-14 py-4 bg-gray-50/50 border-2 border-gray-100 rounded-3xl focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-100 transition-all outline-none text-lg font-medium placeholder:text-gray-400"
                  placeholder="At least 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-5 flex items-center text-gray-400 hover:text-primary-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-6 w-6" /> : <Eye className="h-6 w-6" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <label className="text-sm font-black text-gray-700 ml-4 uppercase tracking-widest text-right block">Verify Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none group-focus-within:text-primary-600 transition-colors">
                  <Lock className="h-6 w-6 text-gray-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  className="w-full pl-14 pr-6 py-4 bg-gray-50/50 border-2 border-gray-100 rounded-3xl focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-100 transition-all outline-none text-lg font-medium placeholder:text-gray-400"
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            {/* Validation Checklist */}
            <div className="bg-gray-50/80 rounded-3xl p-6 border-2 border-gray-100/50 space-y-3">
              <div className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Security Requirements</div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <ValidationItem label="8+ Characters" isValid={passwordValidation.length} />
                <ValidationItem label="At least one number" isValid={passwordValidation.number} />
                <ValidationItem label="Special character" isValid={passwordValidation.special} />
                <ValidationItem label="Passwords match" isValid={passwordValidation.match} />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !allValid}
              className={`w-full py-5 bg-primary-600 text-white rounded-3xl font-black text-xl shadow-2xl shadow-primary-100 hover:bg-primary-700 hover:scale-[1.02] transform transition-all active:scale-[0.98] ${
                isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
              } disabled:opacity-50 disabled:scale-100 disabled:shadow-none`}
            >
              {isSubmitting ? 'Saving Changes...' : 'Save New Password'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
             <Link to="/login" className="inline-flex items-center gap-2 text-primary-600 font-bold hover:underline group">
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              Cancel and go to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

const ValidationItem = ({ label, isValid }) => (
  <div className="flex items-center gap-3">
    {isValid ? (
      <CheckCircle2 className="w-5 h-5 text-green-500" />
    ) : (
      <XCircle className="w-5 h-5 text-gray-300" />
    )}
    <span className={`text-sm font-bold tracking-tight ${isValid ? 'text-green-700' : 'text-gray-500'}`}>{label}</span>
  </div>
);

export default ResetPassword;
