import { useContext, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { clearCart } from '../redux/cartSlice';

const Checkout = () => {
  const { user } = useContext(AuthContext);
  const cartItems = useSelector((state) => state.cart.cartItems);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isPaying, setIsPaying] = useState(false);
  const [error, setError] = useState('');
  const [serverTotal, setServerTotal] = useState(null);
  const [address, setAddress] = useState({ fullName: '', street: '', city: '', postalCode: '', country: '' });
  const totalPrice = cartItems.reduce((total, item) => total + Number(item.price || 0) * Number(item.qty || 0), 0);

  const handlePayment = async () => {
    if (!user?.token) {
      navigate('/login');
      return;
    }
    if (cartItems.length === 0) {
      setError('Your cart is empty.');
      return;
    }

    setIsPaying(true);
    setError('');
    try {
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user.token}`,
      };
      const orderRes = await fetch('/api/payment/order', {
        method: 'POST',
        headers,
        body: JSON.stringify({ items: cartItems.map(({ productId, qty }) => ({ productId, qty })) }),
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.message || 'Unable to start checkout.');
      setServerTotal(orderData.totalAmount);

      if (!window.Razorpay) throw new Error('The payment window did not load. Refresh the page and try again.');
      const checkout = new window.Razorpay({
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Shopshere',
        description: 'Order payment',
        order_id: orderData.id,
        handler: async (paymentResponse) => {
          try {
            const verifyRes = await fetch('/api/payment/verify', {
              method: 'POST',
              headers,
              body: JSON.stringify(paymentResponse),
            });
            const verifyData = await verifyRes.json();
            if (!verifyRes.ok || !verifyData.verified) throw new Error(verifyData.message || 'Payment could not be verified.');

            const saveOrderRes = await fetch('/api/orders', {
              method: 'POST',
              headers,
              body: JSON.stringify({ ...paymentResponse, address }),
            });
            const savedOrder = await saveOrderRes.json();
            if (!saveOrderRes.ok) {
              throw new Error(savedOrder.message || 'Payment was received, but the order could not be saved. Contact support with your payment reference.');
            }
            dispatch(clearCart());
            navigate('/ordersuccess', { state: { orderId: savedOrder._id } });
          } catch (callbackError) {
            setError(callbackError.message || 'Payment processing failed. Please contact support before paying again.');
          } finally {
            setIsPaying(false);
          }
        },
        prefill: { name: address.fullName, email: user.email },
        theme: { color: '#f97316' },
        modal: { ondismiss: () => setIsPaying(false) },
      });
      checkout.on('payment.failed', (event) => {
        setError(event.error?.description || 'Payment failed. Please try again.');
        setIsPaying(false);
      });
      checkout.open();
    } catch (requestError) {
      setError(requestError.message || 'Unable to start payment. Please try again.');
      setIsPaying(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    handlePayment();
  };

  return (
    <div className="checkout-container">
      <h2>Checkout</h2>
      <div className="checkout-content">
        <form onSubmit={handleSubmit} className="shipping-form">
          <h3>Shipping Address</h3>
          {error && <div role="alert" className="checkout-error">{error}</div>}
          <input type="text" maxLength={150} placeholder="Full Name" required value={address.fullName} onChange={(event) => setAddress({ ...address, fullName: event.target.value })} />
          <input type="text" maxLength={150} placeholder="Street" required value={address.street} onChange={(event) => setAddress({ ...address, street: event.target.value })} />
          <input type="text" maxLength={150} placeholder="City" required value={address.city} onChange={(event) => setAddress({ ...address, city: event.target.value })} />
          <input type="text" maxLength={150} placeholder="Postal Code" required value={address.postalCode} onChange={(event) => setAddress({ ...address, postalCode: event.target.value })} />
          <input type="text" maxLength={150} placeholder="Country" required value={address.country} onChange={(event) => setAddress({ ...address, country: event.target.value })} />
          <div className="checkout-summary">
            <h4>Total to Pay: ₹{(serverTotal ?? totalPrice).toFixed(2)}</h4>
            <button type="submit" className="btn" disabled={isPaying || cartItems.length === 0}>
              {isPaying ? 'Opening secure payment…' : 'Pay Now'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Checkout;
