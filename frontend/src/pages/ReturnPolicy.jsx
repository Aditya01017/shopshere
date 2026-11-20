
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

const ReturnPolicy = () => {
  return (
    <div style={textualStyle}>
      <h2 style={{ color: '#fff', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '15px' }}>
        Demo Orders and Refunds
      </h2>
      
      <p style={{ marginBottom: '20px' }}>
        Shopshere is a portfolio demonstration, not a live store. It does not sell or ship merchandise and does not accept return or refund requests.
      </p>

      <h4 style={{ color: '#f97316', marginTop: '25px', marginBottom: '10px' }}>Payment testing</h4>
      <p style={{ marginBottom: '15px' }}>
        Checkout is restricted to Razorpay test-mode credentials. Use only the provider's documented test methods and never submit real card or bank details.
      </p>

      <h4 style={{ color: '#f97316', marginTop: '25px', marginBottom: '10px' }}>Refunds and support</h4>
      <p style={{ marginBottom: '15px' }}>
        Returns, shipping, customer support, and automated refunds are not implemented. Test payments must not be treated as purchases.
      </p>
    </div>
  );
};

export default ReturnPolicy;
