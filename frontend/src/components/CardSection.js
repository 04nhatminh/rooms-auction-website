import React from 'react';
import Card from './Card';
import './CardSection.css';

const CardSection = ({ title, items, cardType = 'default' }) => {
  return (
    <section className="content-card-section">
      <h2>{title}</h2>
      <div className="card-container">
        {items.map((item, index) => (
          <Card key={index} item={item} type={cardType} />
        ))}
      </div>
    </section>
  );
};

export default CardSection;