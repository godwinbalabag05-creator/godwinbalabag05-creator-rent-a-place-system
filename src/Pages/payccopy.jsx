import { useState, useEffect } from 'react'
import { QRCode } from 'react-qr-code'
import { db } from '../Firebase'
import { ref, update, onValue } from 'firebase/database'
import './PaymentStep.css'

const PAYMENT_HOST = 'http://192.168.1.10:5173'

export default function PaymentStep({
  bookingKey,
  transactionID,
  bookingRef,
  property,
  checkIn,
  checkOut,
  nights,
  total,
  renterName,
  onSuccess,
}) {
  const [method, setMethod] = useState('')
  const [cardNum, setCardNum] = useState('')
  const [cardName, setCardName] = useState(renterName)
  const [expiry, setExpiry] = useState('')
  const [cvv, setCvv] = useState('')
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState('')
  const [qrVisible, setQrVisible] = useState(false)

  // 🔥 ADDED: prevent duplicate success calls
  const [done, setDone] = useState(false)

  const paymentLink = `${PAYMENT_HOST}/pay/${transactionID}`

  // ─────────────────────────────────────
  // 🔥 REAL-TIME PAYMENT LISTENER
  // ─────────────────────────────────────
  useEffect(() => {
    if (!bookingKey) return

    const bookingRefDB = ref(db, `bookings/${bookingKey}`)

    const unsubscribe = onValue(bookingRefDB, (snapshot) => {
      const data = snapshot.val()
      if (!data) return

      if (data.paymentStatus === 'paid' && !done) {
        setDone(true)
        onSuccess?.()
      }
    })

    return () => unsubscribe()
  }, [bookingKey, done, onSuccess])

  function formatDate(d) {
    return new Date(d).toLocaleDateString('en-PH', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  function formatCardNum(val) {
    return val.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim()
  }

  function formatExpiry(val) {
    const digits = val.replace(/\D/g, '').slice(0, 4)
    if (digits.length >= 3) return digits.slice(0, 2) + '/' + digits.slice(2)
    return digits
  }

  async function processPayment() {
    setError('')

    if (method === 'card') {
      const rawCard = cardNum.replace(/\s/g, '')
      if (!rawCard || rawCard.length < 16) return setError('Enter a valid 16-digit card number.')
      if (!cardName.trim()) return setError('Enter the name on your card.')
      if (!expiry || expiry.length < 5) return setError('Enter a valid expiry (MM/YY).')
      if (!cvv || cvv.length < 3) return setError('Enter a valid CVV.')
    }

    setPaying(true)

    try {
      const paidAt = new Date().toISOString()

      await update(ref(db, `bookings/${bookingKey}`), {
        paymentMethod: method,
        paymentStatus: 'paid',
        paidAt,
      })

      // fallback (listener will still handle real trigger)
      onSuccess?.()
    } catch (err) {
      console.error(err)
      setError('Payment failed. Please try again.')
    }

    setPaying(false)
  }

  // ── METHOD PICKER ──
  if (!method) {
    return (
      <div className="ps-wrap">
        <div className="ps-stepper">
          <div className="ps-step done">1 Details</div>
          <div className="ps-step-line" />
          <div className="ps-step active">2 Payment</div>
          <div className="ps-step-line" />
          <div className="ps-step">3 Confirmation</div>
        </div>

        <div className="ps-grid">
          <div className="ps-card">
            <p className="bf-section-label">Choose payment method</p>

            <button className="ps-method-btn" onClick={() => setMethod('card')}>
              <span className="ps-method-icon">💳</span>
              <div>
                <strong>Credit / Debit Card</strong>
                <p>Visa, Mastercard, JCB</p>
              </div>
              <span className="ps-chevron">›</span>
            </button>

            <button
              className="ps-method-btn"
              onClick={() => {
                setMethod('ewallet')
                setQrVisible(true)
              }}
            >
              <span className="ps-method-icon">📱</span>
              <div>
                <strong>E-Wallet (QR)</strong>
                <p>GCash, Maya, ShopeePay</p>
              </div>
              <span className="ps-chevron">›</span>
            </button>
          </div>

          <OrderSummary
            property={property}
            checkIn={checkIn}
            checkOut={checkOut}
            nights={nights}
            total={total}
            bookingRef={bookingRef}
            transactionID={transactionID}
            formatDate={formatDate}
          />
        </div>
      </div>
    )
  }

  // ── CARD ──
  if (method === 'card') {
    return (
      <div className="ps-wrap">
        <div className="ps-grid">
          <div className="ps-card">
            <div className="ps-method-header">
              <button className="ps-back" onClick={() => setMethod('')}>
                ← Back
              </button>
              <p className="bf-section-label" style={{ margin: 0 }}>
                Card details
              </p>
            </div>

            <label>Card number</label>
            <input
              value={cardNum}
              onChange={(e) => setCardNum(formatCardNum(e.target.value))}
            />

            <label>Name on card</label>
            <input
              value={cardName}
              onChange={(e) => setCardName(e.target.value)}
            />

            <div className="ps-row-2">
              <input
                placeholder="MM/YY"
                value={expiry}
                onChange={(e) => setExpiry(formatExpiry(e.target.value))}
              />
              <input
                placeholder="CVV"
                value={cvv}
                onChange={(e) =>
                  setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))
                }
              />
            </div>

            {error && <p className="bf-error">{error}</p>}

            <button
              className="bf-btn-primary"
              onClick={processPayment}
              disabled={paying}
            >
              {paying ? 'Processing...' : `Pay ₱${total}`}
            </button>
          </div>

          <OrderSummary
            property={property}
            checkIn={checkIn}
            checkOut={checkOut}
            nights={nights}
            total={total}
            bookingRef={bookingRef}
            transactionID={transactionID}
            formatDate={formatDate}
          />
        </div>
      </div>
    )
  }

  // ── EWALLET ──
  return (
    <div className="ps-wrap">
      <div className="ps-grid">
        <div className="ps-card">
          <button className="ps-back" onClick={() => setMethod('')}>
            ← Back
          </button>

          <p className="ps-qr-instruction">Scan QR to pay</p>

          <div className="ps-qr-box">
            <QRCode value={paymentLink} size={200} />
            <p>₱{total}</p>
          </div>

          <button className="bf-btn-primary" onClick={processPayment}>
            I've completed payment
          </button>
        </div>

        <OrderSummary
          property={property}
          checkIn={checkIn}
          checkOut={checkOut}
          nights={nights}
          total={total}
          bookingRef={bookingRef}
          transactionID={transactionID}
          formatDate={formatDate}
        />
      </div>
    </div>
  )
}

// ─────────────────────────────
// ORDER SUMMARY (UNCHANGED)
// ─────────────────────────────
function OrderSummary({
  property,
  checkIn,
  checkOut,
  nights,
  total,
  bookingRef,
  transactionID,
  formatDate,
}) {
  return (
    <div className="bf-card">
      <p className="bf-section-label">Order summary</p>

      <div className="bf-row">
        <span>Transaction ID</span>
        <strong>{transactionID}</strong>
      </div>

      <div className="bf-row">
        <span>Property</span>
        <strong>{property.title}</strong>
      </div>

      <div className="bf-row">
        <span>Total</span>
        <strong>₱{Number(total).toLocaleString()}</strong>
      </div>
    </div>
  )
}