
const textualStyle = {
  maxWidth: '900px',
  margin: '0 auto',
  padding: '40px',
  background: '#18181b',
  borderRadius: '16px',
  border: '1px solid rgba(255, 255, 255, 0.05)',
  lineHeight: '1.8',
  color: '#a1a1aa'
};

const Disclaimer = () => {
  return (
    <div style={textualStyle}>
      <h2 style={{ color: '#fff', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '15px' }}>
        Legal & Site Disclaimer
      </h2>
      
      <p style={{ marginBottom: '20px' }}>
        Shopshere is a portfolio demonstration. Products, accounts, order flows, and media are sample application data; this project is not a live retail business.
      </p>

      <h4 style={{ color: '#f97316', marginTop: '25px', marginBottom: '10px' }}>1. Accuracy of Materials</h4>
      <p style={{ marginBottom: '15px' }}>
        Product information and images are illustrative. They do not represent a promise that an item exists, is available, or can be delivered.
      </p>

      <h4 style={{ color: '#f97316', marginTop: '25px', marginBottom: '10px' }}>2. Payment Processing Restrictions</h4>
      <p style={{ marginBottom: '15px' }}>
        Checkout is restricted to Razorpay test-mode keys. Use test payment methods only. This project does not process live purchases, returns, or refunds.
      </p>

      <h4 style={{ color: '#f97316', marginTop: '25px', marginBottom: '10px' }}>3. External Binding Links</h4>
      <p style={{ marginBottom: '15px' }}>
        Third-party services such as Razorpay, MongoDB, Cloudinary, and email require separate credentials and are outside the application's control. Keep secrets out of source control.
      </p>

      <p style={{ marginTop: '30px', fontStyle: 'italic', fontSize: '0.9rem' }}>
        Do not submit real payment details, sensitive personal information, or data belonging to other people.
      </p>
    </div>
  );
};

export default Disclaimer;
