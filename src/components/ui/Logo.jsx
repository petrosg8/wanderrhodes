import React from 'react';

const Logo = ({ className = "", style = {} }) => (
  <span
    className={`text-4xl md:text-5xl font-bold font-serif ${className} cursor-pointer`}
    style={{
      fontFamily: "'Playfair Display', serif",
      fontWeight: 700,
      ...style,
    }}
  >
    <span style={{ color: "#E29034" }}>Wander</span>{' '}
    <span style={{ color: "#3EC8E6" }}>Rhodes</span>
  </span>
);

export default Logo;
