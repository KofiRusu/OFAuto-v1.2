'use client';

export default function TestPage() {
  return (
    <div style={{
      padding: '2rem',
      backgroundColor: '#ffffff',
      color: '#000000',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <h1 style={{ 
        fontSize: '3rem',
        marginBottom: '1rem',
        fontWeight: 'bold'
      }}>
        Test Page
      </h1>
      <p style={{ fontSize: '1.5rem' }}>
        This is a test page to check if rendering works.
      </p>
      <button 
        style={{
          marginTop: '1rem',
          padding: '0.5rem 1rem',
          backgroundColor: 'blue',
          color: 'white',
          borderRadius: '0.25rem'
        }}
        onClick={() => alert('Button clicked!')}
      >
        Click Me
      </button>
    </div>
  );
} 