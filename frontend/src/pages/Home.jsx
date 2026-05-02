import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Clock, Users, Zap, Star, Layout, GraduationCap, ClipboardCheck, PlayCircle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const bannerImg = "https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&q=80&w=1200";
const classroomImg = "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=1200";

const Home = () => {
  const { isDark } = useTheme();
  const features = [
    {
      icon: <Layout className="w-6 h-6 text-green-600 dark:text-green-400" />,
      title: 'Student Portal',
      description: 'Access your classes, learning materials, and schedules in one easy-to-use dashboard.',
    },
    {
      icon: <ClipboardCheck className="w-6 h-6 text-green-600 dark:text-green-400" />,
      title: 'Online Exams',
      description: 'Take practice tests for O/L and A/L online with immediate result analysis.',
    },
    {
      icon: <PlayCircle className="w-6 h-6 text-green-600 dark:text-green-400" />,
      title: 'Video Lessons',
      description: 'Re-watch missed classes and access supplementary video content anytime.',
    },
    {
      icon: <GraduationCap className="w-6 h-6 text-green-600 dark:text-green-400" />,
      title: 'Performance Analytics',
      description: 'Track your marks and see where you need to improve with detailed progress reports.',
    },
  ];

  const stats = [
    { label: 'Happy Students', value: '5,000+' },
    { label: 'Island Ranked Mentors', value: '80+' },
    { label: 'Subjects Covered', value: '25+' },
    { label: 'A/L & O/L Pass Rate', value: '98%' },
  ];

  return (
    <div className="overflow-hidden font-sans">
      {/* Hero Section */}
      <section className="relative h-[80vh] min-h-[600px] flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&q=80&w=1920" 
            alt="Sri Lankan Tuition Class"
            className="w-full h-full object-cover animate-fade-in"
          />
          {/* Dark Overlay for text readability */}
          <div className="absolute inset-0 bg-black/60"></div>
        </div>
        
        {/* Content */}
        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto animate-fade-in-up">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-white leading-tight mb-6 drop-shadow-lg">
            Shape Your Future at <span className="text-green-400">Ceylon Scholars Academy</span>
          </h1>
          <p className="text-xl text-gray-200 mb-10 max-w-3xl mx-auto font-medium drop-shadow-md">
            The premier educational institute in Sri Lanka for O/L and A/L success.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/login"
              className="px-8 py-4 bg-green-600 text-white rounded-full font-bold text-lg hover:bg-green-700 hover:-translate-y-1 transition-all shadow-xl flex items-center justify-center gap-2 group"
            >
              Student Login
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, idx) => (
              <div key={idx} className="text-center p-8 bg-stone-50 dark:bg-gray-800 rounded-3xl border border-stone-100 dark:border-gray-700 hover:-translate-y-2 hover:shadow-xl hover:shadow-green-100/50 dark:hover:shadow-green-900/30 transition-all duration-300">
                <div className="text-4xl lg:text-5xl font-extrabold text-green-600 dark:text-green-400 mb-2">{stat.value}</div>
                <div className="text-gray-600 dark:text-gray-400 font-semibold tracking-wide text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-stone-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-fade-in-up">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">Designed for Sri Lankan Students</h2>
            <p className="text-lg text-gray-500 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed">
              We bridge the gap between traditional tutoring and modern technology, giving you the best tools to achieve top island ranks.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, idx) => (
              <div key={idx} className="group p-8 rounded-3xl bg-white dark:bg-gray-900 hover:bg-green-50 dark:hover:bg-green-900/20 border border-gray-100 dark:border-gray-700 hover:border-green-100 dark:hover:border-green-700 hover:-translate-y-2 hover:shadow-xl hover:shadow-green-100/40 dark:hover:shadow-green-900/20 transition-all duration-300">
                <div className="w-14 h-14 bg-stone-50 dark:bg-gray-800 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-green-600 group-hover:text-white transition-colors duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="py-28 bg-white dark:bg-gray-900 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-2/3 h-2/3 bg-stone-100 dark:bg-gray-800 skew-y-12 translate-x-1/4 opacity-50 blur-3xl rounded-full"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
            <div className="mb-16 lg:mb-0 relative animate-fade-in-up">
              <img
                src={classroomImg}
                alt="Classroom Environment"
                className="rounded-3xl shadow-xl w-full"
              />
              <div className="absolute -bottom-6 -right-6 bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-xl border border-gray-50 dark:border-gray-700 animate-float hidden md:block">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center font-bold">A*</div>
                  <div>
                    <div className="font-bold text-gray-900 dark:text-white">Highest Results</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Consecutive 5 Years</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="animate-fade-in-up" style={{animationDelay: '0.2s'}}>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm font-semibold mb-6">
                <Zap className="w-4 h-4" />
                Student Success Stories
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900 dark:text-white leading-tight">"A life-changing academic experience."</h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 leading-relaxed italic">
                "The customized study plans for my Advanced Level exams and the constant tracking of my progress completely changed how I study. The tutors at Ceylon Scholars Academy understand the local syllabus perfectly and guide us effectively."
              </p>
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 rounded-full flex items-center justify-center font-bold text-xl">SM</div>
                <div>
                  <div className="font-bold text-gray-900 dark:text-white text-lg">Senuri Fernando</div>
                  <div className="text-green-600 dark:text-green-400 text-sm font-medium">A/L Science Stream (Batch 2025)</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-stone-50 dark:bg-gray-800">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <div className="bg-green-600 dark:bg-green-700 rounded-3xl p-12 md:p-20 text-white shadow-2xl relative overflow-hidden group hover:shadow-green-600/30 dark:hover:shadow-green-800/40 transition-shadow duration-500">
            <div className="absolute inset-0 bg-green-700 dark:bg-green-800 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            <div className="relative z-10 animate-fade-in-up">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to Achieve Greatness?</h2>
              <p className="text-lg text-green-100 mb-10 max-w-2xl mx-auto">
                Join the leading educational community in Sri Lanka. Registrations for the upcoming intake are now open.
              </p>
              <Link
                to="/contact"
                className="inline-flex px-10 py-4 bg-white dark:bg-gray-100 text-green-700 dark:text-green-600 rounded-full font-bold text-lg hover:bg-gray-50 dark:hover:bg-gray-200 hover:-translate-y-1 hover:shadow-xl transition-all"
              >
                Enroll Today
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;

