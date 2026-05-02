import { Mail, Phone, MapPin, Send, MessageSquare, Clock, ShieldCheck, Headphones, ArrowRight } from 'lucide-react';

const supportImg = "https://images.unsplash.com/photo-1521791136064-7986c2923216?auto=format&fit=crop&q=80&w=1200";

const Contact = () => {
  const contactInfo = [
    {
      icon: <Phone className="w-6 h-6 text-green-600" />,
      title: 'Student Support Hotline',
      details: '+94 77 123 4567',
      description: 'Available for student queries from 8am to 8pm.',
    },
    {
      icon: <Mail className="w-6 h-6 text-green-600" />,
      title: 'Email Admissions',
      details: 'admissions@ceylonscholars.lk',
      description: 'Send us your enrollment inquiries anytime.',
    },
    {
      icon: <MapPin className="w-6 h-6 text-green-600" />,
      title: 'Our Main Center',
      details: 'No 45, High Level Road, Nugegoda, Sri Lanka',
      description: 'Open for visits and registrations daily.',
    },
  ];

  return (
    <div className="bg-white dark:bg-gray-900 font-sans overflow-hidden transition-colors">
      {/* Header Section */}
      <section className="py-24 bg-stone-50 dark:bg-gray-800 relative overflow-hidden transition-colors">
        <div className="absolute top-0 right-0 w-80 h-80 bg-green-100/40 dark:bg-green-900/20 blur-3xl rounded-full translate-x-1/3 -translate-y-1/3"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 animate-fade-in-up">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">Get in <span className="text-green-600 dark:text-green-400">Touch</span></h1>
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Whether you have questions about our A/L batches or need help registering for a new intake, our team is ready to assist you.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-24 bg-white dark:bg-gray-900 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-start">
            {/* Contact Form */}
            <div className="bg-white dark:bg-gray-800 p-8 md:p-12 rounded-3xl shadow-xl dark:shadow-gray-950 shadow-gray-100 border border-gray-100 dark:border-gray-700 relative group overflow-hidden animate-fade-in-up transition-colors">
              <div className="absolute top-0 left-0 w-2 h-full bg-green-500"></div>
              <div className="mb-10">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
                  <MessageSquare className="w-8 h-8 text-green-600 dark:text-green-400" />
                  Inquiry Form
                </h2>
                <p className="text-gray-500 dark:text-gray-400 font-medium">Send us a message and we'll reply via email or WhatsApp.</p>
              </div>
              <form className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 ml-1 uppercase tracking-wider">Your Name</label>
                    <input
                      type="text"
                      className="w-full px-5 py-4 bg-stone-50 dark:bg-gray-700 border border-stone-200 dark:border-gray-600 rounded-2xl focus:bg-white dark:focus:bg-gray-600 focus:border-green-500 dark:focus:border-green-400 focus:ring-4 focus:ring-green-50 dark:focus:ring-green-900 transition-all outline-none text-sm dark:text-white dark:placeholder:text-gray-400"
                      placeholder="e.g. Kasun Perera"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 ml-1 uppercase tracking-wider">Student Grade</label>
                    <input
                      type="text"
                      className="w-full px-5 py-4 bg-stone-50 dark:bg-gray-700 border border-stone-200 dark:border-gray-600 rounded-2xl focus:bg-white dark:focus:bg-gray-600 focus:border-green-500 dark:focus:border-green-400 focus:ring-4 focus:ring-green-50 dark:focus:ring-green-900 transition-all outline-none text-sm dark:text-white dark:placeholder:text-gray-400"
                      placeholder="e.g. Grade 11 (O/L)"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 ml-1 uppercase tracking-wider">Email or WhatsApp</label>
                  <input
                    type="text"
                    className="w-full px-5 py-4 bg-stone-50 dark:bg-gray-700 border border-stone-200 dark:border-gray-600 rounded-2xl focus:bg-white dark:focus:bg-gray-600 focus:border-green-500 dark:focus:border-green-400 focus:ring-4 focus:ring-green-50 dark:focus:ring-green-900 transition-all outline-none text-sm dark:text-white dark:placeholder:text-gray-400"
                    placeholder="Enter email or mobile number"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 ml-1 uppercase tracking-wider">Your Message</label>
                  <textarea
                    rows="4"
                    className="w-full px-5 py-4 bg-stone-50 dark:bg-gray-700 border border-stone-200 dark:border-gray-600 rounded-2xl focus:bg-white dark:focus:bg-gray-600 focus:border-green-500 dark:focus:border-green-400 focus:ring-4 focus:ring-green-50 dark:focus:ring-green-900 transition-all outline-none resize-none text-sm dark:text-white dark:placeholder:text-gray-400"
                    placeholder="How can we help you today?"
                  ></textarea>
                </div>
                <button
                   type="button"
                   className="w-full py-4 bg-green-600 dark:bg-green-700 text-white rounded-2xl font-bold text-lg hover:bg-green-700 dark:hover:bg-green-600 transition-all shadow-md hover:shadow-xl hover:-translate-y-1 flex items-center justify-center gap-2 group"
                >
                  Send Inquiry
                  <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </button>
              </form>
            </div>

            {/* Contact Info & Image */}
            <div className="flex flex-col gap-10 mt-16 lg:mt-0 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
               <div className="grid gap-6">
                {contactInfo.map((item, idx) => (
                  <div key={idx} className="flex gap-6 p-6 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 hover:border-green-100 dark:hover:border-green-700 hover:shadow-xl dark:hover:shadow-gray-950 hover:-translate-y-1 transition-all group">
                    <div className="w-14 h-14 bg-stone-50 dark:bg-gray-700 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-green-50 dark:group-hover:bg-green-900/30 transition-colors">
                      {item.icon}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{item.title}</h3>
                      <p className="text-green-700 dark:text-green-400 font-bold mb-1 text-sm">{item.details}</p>
                      <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="rounded-3xl overflow-hidden shadow-xl dark:shadow-gray-950 flex-1 relative group border border-gray-100 dark:border-gray-700 min-h-[250px]">
                <img
                  src={supportImg}
                  alt="Academy Support Team"
                  className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-green-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center duration-300">
                   <div className="text-white text-center p-6">
                      <Headphones className="w-12 h-12 mx-auto mb-3 animate-bounce" />
                      <div className="text-xl font-bold">Quick WhatsApp Reply</div>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Info Section */}
      <section className="py-24 bg-stone-50 dark:bg-gray-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
           <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white dark:bg-gray-700 p-8 rounded-3xl border border-gray-100 dark:border-gray-600 flex items-start gap-6 shadow-sm hover:shadow-md transition-shadow">
                 <div className="w-14 h-14 bg-green-50 dark:bg-green-900/30 rounded-2xl flex items-center justify-center shrink-0">
                    <Clock className="w-7 h-7 text-green-600 dark:text-green-400" />
                 </div>
                 <div className="w-full">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Academy Opening Hours</h3>
                    <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                       <div className="flex justify-between border-b border-gray-50 dark:border-gray-600 pb-2"><span>Monday - Friday</span><span className="text-green-700 dark:text-green-400 font-bold">8:00 AM - 9:00 PM</span></div>
                       <div className="flex justify-between border-b border-gray-50 dark:border-gray-600 pb-2"><span>Saturday</span><span className="text-green-700 dark:text-green-400 font-bold">7:30 AM - 10:00 PM</span></div>
                       <div className="flex justify-between pb-2"><span>Sunday</span><span className="text-green-700 dark:text-green-400 font-bold">7:30 AM - 6:00 PM</span></div>
                    </div>
                 </div>
              </div>
              <div className="bg-white dark:bg-gray-700 p-8 rounded-3xl border border-gray-100 dark:border-gray-600 flex items-start gap-6 shadow-sm hover:shadow-md transition-shadow">
                 <div className="w-14 h-14 bg-green-50 dark:bg-green-900/30 rounded-2xl flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-7 h-7 text-green-600 dark:text-green-400" />
                 </div>
                 <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Parent & Tutor Conferences</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                       We encourage parents to actively monitor student progress. You are welcome to visit our Nugegoda center for progress reports.
                    </p>
                    <button className="text-green-600 dark:text-green-400 font-bold hover:text-green-700 dark:hover:text-green-300 text-sm flex items-center gap-1 group transition-colors">
                      Book an Appointment <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                 </div>
              </div>
           </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
