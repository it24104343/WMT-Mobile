import { Link } from 'react-router-dom';
import { CheckCircle2, Target, Heart, Award, Users, BookOpen, Star, Zap, ArrowRight } from 'lucide-react';

const classroomImg = "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=1200";

const About = () => {
  const values = [
    {
      icon: <Target className="w-8 h-8 text-primary-600" />,
      title: 'Individual Focus',
      description: 'We believe every student is unique. Our carefully sized batches ensure personalized attention for every learner preparing for their national exams.',
    },
    {
      icon: <Award className="w-8 h-8 text-primary-600" />,
      title: 'Expert Faculty',
      description: 'Learn from the best. Our tutors are highly qualified professionals with a proven track record in Sri Lanka’s educational landscape.',
    },
    {
      icon: <Star className="w-8 h-8 text-primary-600" />,
      title: 'Proven Results',
      description: 'We consistently produce top island and district rankings across all O/L and A/L subjects we offer.',
    },
  ];

  return (
    <div className="bg-white font-sans overflow-hidden">
      {/* Header Section */}
      <section className="py-24 bg-stone-50 relative overflow-hidden text-center">
        <div className="absolute top-0 left-0 w-80 h-80 bg-primary-100/50 blur-3xl -translate-x-1/2 -translate-y-1/2 rounded-full"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 animate-fade-in-up">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-6 leading-tight">
            Empowering the Future Leaders of <span className="text-primary-600 block mt-2">Sri Lanka</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Ceylon Scholars Academy was founded with a single vision: to provide premium, accessible education that helps local students excel and secure their university dreams.
          </p>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-20 items-center">
            <div className="relative group animate-fade-in">
              <div className="absolute -inset-4 bg-stone-100 rounded-3xl opacity-50 blur-xl group-hover:bg-primary-50 transition-colors duration-500"></div>
              <img
                src={classroomImg}
                alt="Students studying"
                className="rounded-3xl shadow-xl relative z-10 w-full transform group-hover:-translate-y-1 transition-transform duration-500 border border-gray-100"
              />
            </div>
            <div className="mt-16 lg:mt-0 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 text-primary-700 text-sm font-semibold mb-6">
                <BookOpen className="w-4 h-4" />
                Our Heritage
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 leading-tight">Setting the Standard for Excellence.</h2>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                At Ceylon Scholars Academy, we combine traditional teaching values with modern digital tools. This hybrid approach ensures you are perfectly prepared for national curriculums while having access to 24/7 learning resources online.
              </p>
              <div className="grid grid-cols-2 gap-6 mb-10">
                <div className="p-6 bg-stone-50 rounded-2xl border border-stone-100 text-center hover:bg-white hover:shadow-md hover:-translate-y-1 transition-all">
                  <div className="text-3xl font-extrabold text-primary-600 mb-1">10k+</div>
                  <div className="text-gray-500 font-medium text-sm">Alumni Students</div>
                </div>
                <div className="p-6 bg-stone-50 rounded-2xl border border-stone-100 text-center hover:bg-white hover:shadow-md hover:-translate-y-1 transition-all">
                  <div className="text-3xl font-extrabold text-primary-600 mb-1">20+</div>
                  <div className="text-gray-500 font-medium text-sm">Island Ranked Panel</div>
                </div>
              </div>
              <ul className="space-y-4">
                {[
                  'Comprehensive study materials mapped to local syllabus',
                  'Regular term tests and standardized mock exams',
                  'Personalized mentoring for university admission',
                  'Interactive online portal for parents and students',
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-gray-700 font-medium">
                    <CheckCircle2 className="w-6 h-6 text-primary-500 shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-24 bg-stone-50 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16 animate-fade-in-up">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Values That Drive Us</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">Why thousands of parents nationwide trust Ceylon Scholars Academy.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {values.map((v, idx) => (
              <div key={idx} className="bg-white p-8 rounded-3xl border border-gray-100 hover:border-primary-200 transition-all hover:shadow-xl hover:-translate-y-2 group animate-fade-in-up" style={{ animationDelay: `${idx * 0.1}s` }}>
                <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary-600 group-hover:text-white transition-colors duration-300">
                  {v.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{v.title}</h3>
                <p className="text-gray-600 leading-relaxed text-sm">{v.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Vision */}
      <section className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="p-10 bg-primary-50 rounded-3xl border border-primary-100 flex flex-col items-center text-center shadow-sm hover:shadow-md transition-shadow">
              <Zap className="w-10 h-10 text-primary-600 mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-4">Our Mission</h3>
              <p className="text-gray-600 leading-relaxed font-medium">
                "To deliver modern, accessible, and highly effective tutoring that equips Sri Lankan students with the knowledge and confidence to ace their examinations."
              </p>
            </div>
            <div className="p-10 bg-stone-50 rounded-3xl border border-stone-100 flex flex-col items-center text-center shadow-sm hover:shadow-md transition-shadow">
              <Heart className="w-10 h-10 text-red-500 mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-4">Our Vision</h3>
              <p className="text-gray-600 leading-relaxed font-medium">
                "To be the undisputed educational beacon of Sri Lanka, producing academic champions who go on to shape a brighter national future."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 text-center relative overflow-hidden bg-white">
        <div className="max-w-3xl mx-auto px-4 relative z-10 animate-fade-in-up">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900 leading-tight">Be part of the Academy</h2>
          <p className="text-lg text-gray-600 mb-10">
            Empower your university journey. Find out how we can help you achieve distinction.
          </p>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 px-8 py-4 bg-primary-600 text-white rounded-full font-bold text-lg hover:bg-primary-700 transition-all shadow-md hover:shadow-xl hover:-translate-y-1"
          >
            Contact Admissions
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default About;

