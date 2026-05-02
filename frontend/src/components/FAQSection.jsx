import React, { useState } from 'react';

const FAQSection = ({ faqs }) => {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="faq-container">
      {faqs.map((faq, index) => (
        <div key={index} className="faq-item">
          <div
            className="faq-question"
            onClick={() => toggleFAQ(index)}
          >
            <span>{faq.question}</span>
            <span className={`faq-icon ${openIndex === index ? 'open' : ''}`}>
              ▼
            </span>
          </div>
          <div
            className={`faq-answer ${openIndex === index ? 'open' : ''}`}
          >
            {faq.answer}
          </div>
        </div>
      ))}
    </div>
  );
};

export default FAQSection;