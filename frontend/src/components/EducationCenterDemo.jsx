import React from 'react';
import Hero from './Hero';
import ProgramCard from './ProgramCard';
import StatCard from './StatCard';
import TeacherCard from './TeacherCard';
import TestimonialCard from './TestimonialCard';
import StepCard from './StepCard';
import FAQSection from './FAQSection';

const EducationCenterDemo = () => {
  const programs = [
    {
      icon: '👶',
      title: 'Infants',
      age: '0-12 months',
      description: 'Nurturing care and early development activities for our youngest learners.'
    },
    {
      icon: '🧒',
      title: 'Toddlers',
      age: '12-24 months',
      description: 'Interactive play-based learning with focus on social-emotional development.'
    },
    {
      icon: '👧',
      title: 'Early Preschool',
      age: '2-3 years',
      description: 'Structured activities designed to develop language, motor, and cognitive skills.'
    },
    {
      icon: '📚',
      title: 'Preschool',
      age: '4-5 years',
      description: 'Comprehensive preparation for kindergarten with academic and social readiness.'
    },
  ];

  const stats = [
    { number: '1,500+', label: 'Happy Children', icon: '👶' },
    { number: '89', label: 'Expert Teachers', icon: '👨‍🏫' },
    { number: '12', label: 'Avg. Group Size', icon: '👨‍👩‍👧' },
  ];

  const teachers = [
    {
      name: 'Helen White',
      role: 'Art & Psychology',
      bio: 'Over 30 years of experience creating safe and joyful learning environments with a passion for child development.',
      email: 'helen.white@edumail.com'
    },
    {
      name: 'Kate Wilson',
      role: 'Toddlers & Waldles',
      bio: 'Creative educator using hands-on activities, music, and storytelling to engage young learners.'
    },
  ];

  const testimonials = [
    {
      quote: 'My son has thrived in this environment! The staff goes above and beyond to create a nurturing space.',
      author: 'Lucy Wilson',
      role: "Dany's parent | Infants Group",
      date: 'May 15, 2024'
    },
    {
      quote: 'My daughter has learned so much! The activities are engaging and the teachers are amazing.',
      author: 'Jane Peterson',
      role: "Lucy's parent | Preschool Group",
      date: 'December 11, 2024'
    },
  ];

  const steps = [
    {
      number: '1',
      title: 'Acquaintance',
      description: 'Our experienced teachers establish contact and gently introduce your child to our center.'
    },
    {
      number: '2',
      title: 'Tour',
      description: 'Your child explores at their own pace with optional short visits or full-day experiences.'
    },
    {
      number: '3',
      title: 'Learn & Play',
      description: 'Education through games and innovative methods that captivate young minds.'
    },
    {
      number: '4',
      title: 'Development',
      description: 'We unlock potential by identifying talents and abilities at an early stage.'
    },
  ];

  const faqs = [
    {
      question: 'Can I visit my child during the day?',
      answer: 'Absolutely! We have an open visit policy. You can visit anytime or spend an hour or full morning in your child\'s class.'
    },
    {
      question: 'What about meals and dietary needs?',
      answer: 'We provide healthy, locally-sourced organic meals. Special dietary requirements like vegetarian, gluten-free, and dairy-free options are available.'
    },
    {
      question: 'How do you handle health and safety?',
      answer: 'We follow American Academy of Pediatrics guidelines and maintain strict health policies. All incidents are documented.'
    },
    {
      question: 'What if my child gets sick?',
      answer: 'We follow communicable disease policies. Parents are contacted within 1 hour if a child needs to be picked up.'
    },
  ];

  return (
    <div className="education-center-demo">
      {/* Hero Section */}
      <Hero
        title="Educating with Heart and Care"
        subtitle="We've been proudly shaping young minds since 1989. Join us in creating a world where every child is a star."
        ctaText="Enroll Your Child"
        ctaLink="#contact"
        image="🌟"
      />

      {/* Stats Section */}
      <section className="section">
        <h2 className="section-title">Our Impact</h2>
        <div className="grid-3" style={{ marginBottom: '0' }}>
          {stats.map((stat, index) => (
            <StatCard
              key={index}
              number={stat.number}
              label={stat.label}
              icon={stat.icon}
            />
          ))}
        </div>
      </section>

      {/* Programs Section */}
      <section className="section">
        <h2 className="section-title">Our Programs</h2>
        <p className="section-subtitle">
          We offer comprehensive programs for children of different ages, focusing on their unique developmental needs.
        </p>
        <div className="grid-2">
          {programs.map((program, index) => (
            <ProgramCard
              key={index}
              icon={program.icon}
              title={program.title}
              age={program.age}
              description={program.description}
            />
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="section" style={{ backgroundColor: '#f9fafb', padding: '3rem 0', borderRadius: '12px' }}>
        <h2 className="section-title">Why Choose Us?</h2>
        <div className="grid-3">
          <div className="feature-card">
            <div className="feature-icon">🧠</div>
            <h3 className="feature-title">Early Development</h3>
            <p className="feature-desc">Research-based approach to maximize developmental potential.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📚</div>
            <h3 className="feature-title">Academic Success</h3>
            <p className="feature-desc">Children who attend preschool are more prepared for later grades.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">😌</div>
            <h3 className="feature-title">Peace of Mind</h3>
            <p className="feature-desc">Safe, nurturing environment reducing stress for parents.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🎨</div>
            <h3 className="feature-title">Fun & Enrichment</h3>
            <p className="feature-desc">Engaging activities that spark curiosity and creativity.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">👥</div>
            <h3 className="feature-title">Social Growth</h3>
            <p className="feature-desc">Learn to interact, share, and solve problems together.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🌍</div>
            <h3 className="feature-title">Diverse Community</h3>
            <p className="feature-desc">Children learn from diverse backgrounds and perspectives.</p>
          </div>
        </div>
      </section>

      {/* Integration Steps */}
      <section className="section">
        <h2 className="section-title">Our 4-Step Integration Process</h2>
        <p className="section-subtitle">
          We believe in gentle transitions. Here's how we integrate your child into our community.
        </p>
        <div className="grid-4">
          {steps.map((step, index) => (
            <StepCard
              key={index}
              number={step.number}
              title={step.title}
              description={step.description}
            />
          ))}
        </div>
      </section>

      {/* Teachers Section */}
      <section className="section">
        <h2 className="section-title">Meet Our Expert Team</h2>
        <p className="section-subtitle">
          Our educators are united by their love for children and commitment to excellence.
        </p>
        <div className="grid-2">
          {teachers.map((teacher, index) => (
            <TeacherCard
              key={index}
              name={teacher.name}
              role={teacher.role}
              bio={teacher.bio}
              email={teacher.email}
              avatar={`${teacher.name.split(' ')[0][0]}${teacher.name.split(' ')[1][0]}`}
            />
          ))}
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="section">
        <h2 className="section-title">Happy Parents, Happy Children</h2>
        <p className="section-subtitle">
          Hear from families who trust us with their most precious treasures.
        </p>
        <div className="grid-2">
          {testimonials.map((testimonial, index) => (
            <TestimonialCard
              key={index}
              quote={testimonial.quote}
              author={testimonial.author}
              role={testimonial.role}
              date={testimonial.date}
              avatar={testimonial.author[0]}
            />
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="section">
        <h2 className="section-title">Frequently Asked Questions</h2>
        <p className="section-subtitle">
          We're here to answer your questions and help you make the best decision.
        </p>
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <FAQSection faqs={faqs} />
        </div>
      </section>

      {/* CTA Section */}
      <section className="section card" style={{ textAlign: 'center', background: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)', color: 'white', padding: '3rem' }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Ready to Start Your Child's Adventure?</h2>
        <p style={{ fontSize: '1.1rem', marginBottom: '2rem', opacity: 0.95 }}>
          Enroll today and give your child the gift of quality education.
        </p>
        <button className="btn" style={{ background: 'white', color: '#6366f1', fontWeight: 'bold' }}>
          Enroll Now
        </button>
      </section>
    </div>
  );
};

export default EducationCenterDemo;