import React from 'react';
import Card from '../Card/Card';
import './CardSection.css';

const CardSection = ({ title, items }) => {
  return (
    <section className="content-card-section">
      <h2>{title}</h2>
      <div className="card-container">
        {items.map((item, index) => (
          <Card key={index} item={item}/>
        ))}
      </div>
    </section>
  );
};

export default CardSection;