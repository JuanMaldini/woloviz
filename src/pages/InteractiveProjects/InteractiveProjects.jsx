import React from 'react';
import { Link } from 'react-router-dom';
import './InteractiveProjects.css';

const InteractiveProjects = () => (
  <div>
    <h1>Interactive Projects</h1>
    <div className='links-projects'>
      
      <Link to="/samplesvg">Seg Vial Gremio</Link>
      <Link to="/sample-ai">Sample AI</Link>
      <Link to="/example">Example</Link>
    </div>
  </div>
);

export default InteractiveProjects;
