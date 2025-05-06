import React from 'react';

function ExistingWebsite() {
  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <iframe 
        src={`${process.env.PUBLIC_URL}/index.html`} 
        title="Existing Website"
        style={{ width: '100%', height: '100%', border: 'none' }}
        sandbox="allow-same-origin allow-scripts"
      />
    </div>
  );
}

export default ExistingWebsite;