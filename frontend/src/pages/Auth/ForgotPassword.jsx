import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { toast } from 'react-toastify';
import { Mail, ArrowLeft, Key, ShieldCheck, CheckCircle2, ChevronRight } from 'lucide-react';

const forgotImg = "https://images.unsplash.com/photo-1521791136064-7986c2923216?auto=format&fit=crop&q=80&w=1200";

const ForgotPassword = () => {
  const [identifier, setIdentifier] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1); // 1: Request OTP, 2: Verify OTP
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  
  const navigate = useNavigate();

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post('/auth/request-otp', { identifier });
      toast.success('If an account exists, an OTP has been sent.');
      setStep(2);
    } catch (err) {
      toast.error('Error requesting OTP. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (value.length > 1) value = value.slice(-1);
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`).focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`).focus();
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const otpString = otp.join('');
      const res = await api.post('/auth/verify-otp', { identifier, otp: otpString });
      const { resetToken } = res.data.data;
      navigate('/reset-password', { state: { resetToken } });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid or expired OTP');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white font-inter">
      {/* Left Pane - Info & Steps */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center px-8 lg:px-24">
        <div className="max-w-md w-full">
          <div className="mb-12">
            <Link to="/login" className="inline-flex items-center gap-2 text-primary-600 font-black hover:text-primary-700 transition-colors group mb-8">
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              Back to Sign In
            </Link>
            
            <h2 className="text-4xl font-black text-gray-900 mb-4 tracking-tight">Recover Password</h2>
            <p className="text-lg text-gray-500 font-medium">
              {step === 1 
                ? "Don't worry, even the best of us forget things. Enter your details to reset your password." 
                : "We've sent a 6-digit code to your registered email address."}
            </p>
          </div>

          {/* Stepper */}
          <div className="flex items-center gap-4 mb-12">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full font-black text-sm transition-all duration-500 ${step >= 1 ? 'bg-primary-600 text-white ring-4 ring-primary-100' : 'bg-gray-100 text-gray-400'}`}>
              {step > 1 ? <CheckCircle2 className="w-6 h-6" /> : "1"}
            </div>
            <div className={`flex-1 h-1.5 rounded-full transition-all duration-700 ${step > 1 ? 'bg-primary-600' : 'bg-gray-100'}`}></div>
            <div className={`flex items-center justify-center w-10 h-10 rounded-full font-black text-sm transition-all duration-500 ${step >= 2 ? 'bg-primary-600 text-white ring-4 ring-primary-100' : 'bg-gray-100 text-gray-400'}`}>
              2
            </div>
          </div>
          
          {step === 1 ? (
            <form className="space-y-8" onSubmit={handleRequestOtp}>
              <div className="space-y-2">
                <label className="text-sm font-black text-gray-700 ml-4 uppercase tracking-widest">Username or Email</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none group-focus-within:text-primary-600 transition-colors">
                    <Mail className="h-6 w-6 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    required
                    className="w-full pl-14 pr-6 py-5 bg-gray-50/50 border-2 border-gray-100 rounded-[2rem] focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-100 transition-all outline-none text-lg font-medium placeholder:text-gray-400"
                    placeholder="e.g. jane@example.com"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-6 bg-primary-600 text-white rounded-[2.5rem] font-black text-xl shadow-2xl shadow-primary-200 hover:bg-primary-700 hover:scale-[1.02] transform transition-all active:scale-[0.98] flex items-center justify-center gap-3 ${
                  isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {isSubmitting ? 'Sending...' : (
                  <>
                    Send Reset OTP
                    <ChevronRight className="w-6 h-6" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form className="space-y-10" onSubmit={handleVerifyOtp}>
              <div className="space-y-4">
                <label className="text-sm font-black text-gray-700 text-center block uppercase tracking-widest">Verification Code</label>
                <div className="flex justify-between gap-2">
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      id={`otp-${idx}`}
                      type="text"
                      inputMode="numeric"
                      maxLength="1"
                      className="w-12 h-16 sm:w-14 sm:h-20 text-center text-3xl font-black bg-gray-50/50 border-2 border-gray-100 rounded-2xl focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-100 transition-all outline-none"
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(idx, e)}
                      autoFocus={idx === 0}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <button
                  type="submit"
                  disabled={isSubmitting || otp.join('').length < 6}
                  className={`w-full py-6 bg-primary-600 text-white rounded-[2.5rem] font-black text-xl shadow-2xl shadow-primary-200 hover:bg-primary-700 hover:scale-[1.02] transform transition-all active:scale-[0.98] ${
                    isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                  } disabled:opacity-50 disabled:scale-100 disabled:shadow-none`}
                >
                  {isSubmitting ? 'Verifying...' : 'Verify & Continue'}
                </button>
                
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-full text-gray-500 font-bold hover:text-primary-600 transition-colors"
                >
                  Need to change your email?
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Right Pane - Image & Info (Hidden on small screens) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-primary-900">
        <img
          src={forgotImg}
          alt="Secure Access"
          className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-overlay"
        />
        <div className="absolute inset-0 bg-gradient-to-l from-primary-900 via-primary-900/40 to-transparent"></div>
        
        <div className="relative z-10 flex flex-col justify-center p-16 text-white w-full text-right items-end">
          <div className="mb-8">
            <div className="w-20 h-20 bg-white/10 backdrop-blur-xl rounded-[2.5rem] flex items-center justify-center border border-white/20 mb-8 self-end ml-auto">
              <Key className="w-10 h-10 text-primary-300" />
            </div>
          </div>
          
          <div className="max-w-md">
            <h1 className="text-6xl font-black leading-tight mb-8">
              Privacy <br />
              <span className="text-primary-400">First.</span>
            </h1>
            <p className="text-xl text-primary-100/80 leading-relaxed font-medium">
              We use advanced multi-factor authentication to ensure your account stays protected at all times.
            </p>
          </div>
          
          <div className="mt-12 flex gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="w-3 h-3 rounded-full bg-white/20"></div>
            ))}
            <div className="w-8 h-3 rounded-full bg-primary-400"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
