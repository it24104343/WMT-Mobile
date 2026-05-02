import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { Lock, Eye, EyeOff, ShieldCheck, CheckCircle2, XCircle, LogOut } from 'lucide-react';

const welcomeImg = "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&q=80&w=1200";

const FirstLoginReset = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { user, updateFirstLoginStatus, logout } = useAuth();
  const navigate = useNavigate();

  // If user somehow gets here without being in first login state, redirect to home
  if (!user || !user.isFirstLogin) {
    navigate('/', { replace: true });
    return null;
  }

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
      const response = await api.post('/auth/first-login-reset', { newPassword });
      toast.success('Password updated successfully! Welcome aboard.');
      updateFirstLoginStatus();

      // If teacher has pending registration payment, redirect to payment page
      if (response.data?.pendingPayment) {
        navigate('/teacher-payment', { replace: true, state: { registrationFee: response.data.registrationFee } });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update password');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white font-inter">
      {/* Left Pane - Welcome Info */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center px-8 lg:px-24 py-12">
        <div className="max-w-md w-full">
          <div className="mb-10">
            <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mb-8">
              <span className="text-primary-600 font-black text-3xl">J</span>
            </div>
            
            <h2 className="text-4xl font-black text-gray-900 mb-4 tracking-tight">Welcome, {user.username}!</h2>
            <p className="text-lg text-gray-500 font-medium">
              We're excited to have you join us. For your security, you need to change your temporary password before exploring your dashboard.
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* New Password */}
            <div className="space-y-2">
              <label className="text-sm font-black text-gray-700 ml-4 uppercase tracking-widest">Create New Password</label>
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
                  placeholder="Repeat your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            {/* Validation Checklist */}
            <div className="bg-gray-50/80 rounded-3xl p-6 border-2 border-gray-100/50 space-y-3">
              <div className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 px-1 text-center">Security Standards</div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <ValidationItem label="8+ Characters" isValid={passwordValidation.length} />
                <ValidationItem label="One number" isValid={passwordValidation.number} />
                <ValidationItem label="Special symbol" isValid={passwordValidation.special} />
                <ValidationItem label="Match check" isValid={passwordValidation.match} />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !allValid}
              className={`w-full py-5 bg-primary-600 text-white rounded-3xl font-black text-xl shadow-2xl shadow-primary-200 hover:bg-primary-700 hover:scale-[1.02] transform transition-all active:scale-[0.98] ${
                isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
              } disabled:opacity-50 disabled:scale-100 disabled:shadow-none`}
            >
              {isSubmitting ? 'Updating Account...' : 'Finish Setup'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
             <button 
               onClick={logout}
               className="inline-flex items-center gap-2 text-red-500 font-bold hover:underline group"
             >
              <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              Not now? Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Right Pane - Image (Hidden on small screens) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-primary-900">
        <img
          src={welcomeImg}
          alt="Welcome Aboard"
          className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-overlay"
        />
        <div className="absolute inset-0 bg-gradient-to-l from-primary-900 via-primary-900/40 to-transparent"></div>
        
        <div className="relative z-10 flex flex-col justify-end p-20 text-white w-full text-right items-end">
          <div className="max-w-md">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-sm font-semibold mb-8">
              <ShieldCheck className="w-5 h-5 text-primary-300" />
              Your Account is Secure
            </div>
            <h1 className="text-7xl font-black leading-tight mb-8">
              Start Your <br />
              <span className="text-primary-400">Journey.</span>
            </h1>
            <p className="text-xl text-primary-100/80 leading-relaxed font-medium">
              Join thousands of students and teachers who are transforming their educational experience every day.
            </p>
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

export default FirstLoginReset;
