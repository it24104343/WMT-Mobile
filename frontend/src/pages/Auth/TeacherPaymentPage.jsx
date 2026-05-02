import { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { CreditCard, ArrowRight, Building, CheckCircle, Upload } from 'lucide-react';
import { toast } from 'react-toastify';
import paymentService from '../../services/paymentService';
import { Spinner } from '../../components/UI';

const TeacherPaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const registrationFee = location.state?.registrationFee || 0;

  const [paymentTab, setPaymentTab] = useState('card');
  const [processing, setProcessing] = useState(false);
  const [cardForm, setCardForm] = useState({ cardNumber: '', expiry: '', cvv: '' });
  const [receiptFile, setReceiptFile] = useState(null);

  const handleCardNumberChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    value = value.replace(/(.{4})/g, '$1 ').trim();
    setCardForm(p => ({ ...p, cardNumber: value.substring(0, 19) }));
  };

  const handleExpiryChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 2) {
      value = value.substring(0, 2) + '/' + value.substring(2, 4);
    }
    setCardForm(p => ({ ...p, expiry: value }));
  };

  const handleCvvChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    setCardForm(p => ({ ...p, cvv: value.substring(0, 4) }));
  };

  const validateCardDetails = () => {
    const cleanCard = cardForm.cardNumber.replace(/\s/g, '');
    if (cleanCard.length !== 16) {
      toast.error('Card number must be 16 digits');
      return false;
    }
    
    if (!cardForm.expiry.includes('/')) {
      toast.error('Invalid expiry date format');
      return false;
    }

    const [month, year] = cardForm.expiry.split('/');
    if (!month || !year || month.length !== 2 || year.length !== 2) {
      toast.error('Expiry date must be MM/YY');
      return false;
    }

    const m = parseInt(month, 10);
    if (m < 1 || m > 12) {
      toast.error('Invalid expiry month');
      return false;
    }

    const currentDate = new Date();
    const currentYear = parseInt(currentDate.getFullYear().toString().slice(-2), 10);
    const currentMonth = currentDate.getMonth() + 1;
    const y = parseInt(year, 10);
    
    if (y < currentYear || (y === currentYear && m < currentMonth)) {
        toast.error('Card has expired');
        return false;
    }

    if (cardForm.cvv.length < 3) {
      toast.error('CVV must be 3 or 4 digits');
      return false;
    }

    return true;
  };

  const handleCardPayment = async () => {
    if (!validateCardDetails()) return;
    try {
      setProcessing(true);
      await paymentService.processTeacherGatewayPayment({
        cardNumber: cardForm.cardNumber.replace(/\s/g, '')
      });
      toast.success('Payment successful! Your account is now fully active.');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleBankTransfer = async () => {
    if (!receiptFile) {
      toast.error('Please select a receipt image');
      return;
    }
    try {
      setProcessing(true);
      const formData = new FormData();
      formData.append('receipt', receiptFile);

      await paymentService.submitTeacherBankTransfer(formData);
      toast.success('Receipt submitted! Awaiting admin approval.');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit receipt');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-primary-50 p-6">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3">
            <div className="w-12 h-12 bg-primary-600 rounded-2xl flex items-center justify-center shadow-xl">
              <span className="text-white font-black text-2xl">J</span>
            </div>
            <span className="text-3xl font-black text-gray-900 tracking-tighter">Janithya</span>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-8 py-6 text-white text-center">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CreditCard className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-black">Registration Payment</h1>
            <p className="text-primary-100 mt-1">Complete your payment to access your account</p>
          </div>

          {/* Content */}
          <div className="px-6 py-8 space-y-6">
            {/* Amount */}
            <div className="bg-primary-50 rounded-2xl p-6 text-center border border-primary-100">
              <p className="text-sm text-primary-600 font-semibold uppercase tracking-wider mb-1">Amount Due</p>
              <p className="text-4xl font-black text-primary-700">
                LKR {registrationFee.toLocaleString()}
              </p>
              <p className="text-xs text-primary-500 mt-1">One-time registration fee</p>
            </div>

            {/* Payment method tabs */}
            <div className="flex gap-2">
              <button 
                onClick={() => setPaymentTab('card')} 
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-sm font-bold transition-all ${paymentTab === 'card' ? 'bg-primary-50 text-primary-700 border-2 border-primary-200 shadow-sm' : 'bg-gray-50 text-gray-500 border-2 border-transparent hover:bg-gray-100'}`}
              >
                <CreditCard className="w-4 h-4" /> Card Payment
              </button>
              <button 
                onClick={() => setPaymentTab('bank')} 
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-sm font-bold transition-all ${paymentTab === 'bank' ? 'bg-primary-50 text-primary-700 border-2 border-primary-200 shadow-sm' : 'bg-gray-50 text-gray-500 border-2 border-transparent hover:bg-gray-100'}`}
              >
                <Building className="w-4 h-4" /> Bank Transfer
              </button>
            </div>

            {paymentTab === 'card' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Card Number</label>
                  <input type="text" value={cardForm.cardNumber} onChange={handleCardNumberChange} className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500" placeholder="1234 5678 9012 3456" maxLength={19} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                    <input type="text" value={cardForm.expiry} onChange={handleExpiryChange} className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500" placeholder="MM/YY" maxLength={5} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CVV</label>
                    <input type="text" value={cardForm.cvv} onChange={handleCvvChange} className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500" placeholder="123" maxLength={4} />
                  </div>
                </div>
                <button onClick={handleCardPayment} disabled={processing || !cardForm.cardNumber} className="w-full py-4 bg-primary-600 text-white rounded-xl font-bold text-lg hover:bg-primary-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary-200 disabled:opacity-50 mt-2">
                  {processing ? <><Spinner size="sm" /> Processing...</> : <><CreditCard className="w-5 h-5" /> Pay LKR {registrationFee.toLocaleString()}</>}
                </button>
              </div>
            )}

            {paymentTab === 'bank' && (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-700 border border-gray-100 space-y-2">
                  <p className="font-bold text-gray-900 border-b border-gray-200 pb-2 mb-2">Instructions:</p>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-primary-600 mt-0.5 flex-shrink-0" />
                    <span>Transfer <strong>LKR {registrationFee.toLocaleString()}</strong> to the institute's bank account.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-primary-600 mt-0.5 flex-shrink-0" />
                    <span>Upload a clear photo or PDF of the transfer receipt below.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-primary-600 mt-0.5 flex-shrink-0" />
                    <span>Wait for admin approval to unlock your full dashboard access.</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Upload Receipt <span className="text-red-500">*</span></label>
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{receiptFile ? receiptFile.name : 'Click to upload receipt'}</p>
                      <p className="text-xs text-gray-400 mt-1">PNG, JPG or PDF. Max 10MB.</p>
                    </div>
                    <input type="file" className="hidden" accept="image/*,.pdf" onChange={e => setReceiptFile(e.target.files[0])} />
                  </label>
                </div>

                <button onClick={handleBankTransfer} disabled={processing || !receiptFile} className="w-full py-4 bg-primary-600 text-white rounded-xl font-bold text-lg hover:bg-primary-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary-200 disabled:opacity-50 mt-2">
                  {processing ? <><Spinner size="sm" /> Submitting...</> : <><Building className="w-5 h-5" /> Submit Receipt</>}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherPaymentPage;

