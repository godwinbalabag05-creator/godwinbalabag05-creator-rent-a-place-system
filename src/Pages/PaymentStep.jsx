import { useState, useEffect } from 'react'
import { QRCode } from 'react-qr-code'
import './PaymentStep.css'
import { db } from '../Firebase'
import { ref, onValue } from 'firebase/database'

const PAYMENT_HOST = 'https://godwinbalabag05-creator-rent-a-plac.vercel.app'

export default function PaymentStep({
  firebaseKey,
  transactionID,
  bookingRef,
  property,
  checkIn,
  checkOut,
  nights,
  total,
  renterName,
  onSuccess,
  onCardBack,
}) {
  const [method,   setMethod]   = useState('')
  const [cardNum,  setCardNum]  = useState('')
  const [cardName, setCardName] = useState(renterName)
  const [expiry,   setExpiry]   = useState('')
  const [cvv,      setCvv]      = useState('')
  const [paying,   setPaying]   = useState(false)
  const [error,    setError]    = useState('')

  const paymentLink = `${PAYMENT_HOST}/pay/${transactionID}`

 useEffect(() => {
  if (method !== 'ewallet') return

  const bookingsRef = ref(db, 'bookings')

  const unsubscribe = onValue(bookingsRef, (snapshot) => {
    if (!snapshot.exists()) return

    snapshot.forEach(child => {
      const data = child.val()

      console.log(
        'LISTENING:',
        data.transactionID,
        data.paymentStatus
      )

      if (
        data.transactionID === transactionID &&
        data.paymentStatus === 'paid'
      ) {
        console.log('PAYMENT DETECTED')

        onSuccess('ewallet')
      }
    })
  })

  return () => unsubscribe()

}, [method, transactionID, onSuccess])

  function formatDate(d) {
    return new Date(d).toLocaleDateString('en-PH', {
      month: 'short', day: 'numeric', year: 'numeric',
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

  // ── Process payment then call onSuccess ──
  async function processPayment() {
    setError('')

    if (method === 'card') {
      const rawCard = cardNum.replace(/\s/g, '')
      if (!rawCard || rawCard.length < 16) { setError('Enter a valid 16-digit card number.'); return }
      if (!cardName.trim())                { setError('Enter the name on your card.'); return }
      if (!expiry || expiry.length < 5)    { setError('Enter a valid expiry (MM/YY).'); return }
      if (!cvv || cvv.length < 3)          { setError('Enter a valid CVV.'); return }
    }

    setPaying(true)
    try {
      // ── Payment confirmed → tell BookingForm to save booking ──
      onSuccess(method)
    } catch (err) {
      console.error(err)
      setError('Payment failed. Please try again.')
      setPaying(false)
    }
  }

  // ── Method picker ──
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

            <button className="ps-method-btn" onClick={() => setMethod('ewallet')}>
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

  // ── Card payment ──
  if (method === 'card') {
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
            <div className="ps-method-header">
              <button
              className="ps-back"
              onClick={async () => {
                await onCardBack()
              }}
            >
              ← Back
            </button> 
              <p className="bf-section-label" style={{ margin: 0 }}>Card details</p>
            </div>

            <div className="ps-card-preview">
              <div className="ps-card-chip">▬▬</div>
              <div className="ps-card-num">{cardNum || '•••• •••• •••• ••••'}</div>
              <div className="ps-card-meta">
                <span>{cardName || 'FULL NAME'}</span>
                <span>{expiry || 'MM/YY'}</span>
              </div>
            </div>

            <label>Card number</label>
            <input
              type="text"
              inputMode="numeric"
              placeholder="1234 5678 9012 3456"
              value={cardNum}
              maxLength={19}
              onChange={e => setCardNum(formatCardNum(e.target.value))}
            />

            <label>Name on card</label>
            <input
              type="text"
              placeholder="Juan dela Cruz"
              value={cardName}
              onChange={e => setCardName(e.target.value)}
            />

            <div className="ps-row-2">
              <div>
                <label>Expiry</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="MM/YY"
                  value={expiry}
                  maxLength={5}
                  onChange={e => setExpiry(formatExpiry(e.target.value))}
                />
              </div>
              <div>
                <label>CVV</label>
                <input
                  type="password"
                  inputMode="numeric"
                  placeholder="•••"
                  value={cvv}
                  maxLength={4}
                  onChange={e => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                />
              </div>
            </div>

            {error && <p className="bf-error">{error}</p>}

            <div className="ps-secure-note">
              🔒 Your card details are encrypted and secure.
            </div>

            <button
              className="bf-btn-primary"
              style={{ marginTop: '1rem' }}
              onClick={processPayment}
              disabled={paying}
            >
              {paying ? 'Processing...' : `Pay ₱${Number(total).toLocaleString()}`}
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

  // ── E-wallet / QR ──
  if (method === 'ewallet') {
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
            <div className="ps-method-header">
              <button
                className="ps-back"
                onClick={async () => {
                  await onCardBack()
                }}
              >
                ← Back
              </button>
              <p className="bf-section-label" style={{ margin: 0 }}>Scan to pay</p>
            </div>

            <p className="ps-qr-instruction">
              Open your e-wallet app (GCash, Maya, ShopeePay) and scan
              the QR code below, or visit the payment link on another device.
            </p>

            <div className="ps-qr-box">
              <QRCode
                value={paymentLink}
                size={200}
                bgColor="transparent"
                fgColor="#1a1a2e"
                level="M"
              />
              <p className="ps-qr-amount">₱{Number(total).toLocaleString()}</p>
            </div>

            <div className="ps-qr-link">
              <span>Payment link:</span>
              <a href={paymentLink} target="_blank" rel="noreferrer">{paymentLink}</a>
            </div>

            <div className="ps-divider-text">— or confirm payment below —</div>

            {error && <p className="bf-error">{error}</p>}

            <button
              className="bf-btn-primary"
              style={{ marginTop: '0.5rem' }}
              onClick={processPayment}
              disabled={paying}
            >
              {paying ? 'Confirming...' : "I've completed payment"}
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
}

function OrderSummary({
  property, checkIn, checkOut, nights,
  total, bookingRef, transactionID, formatDate
}) {
  return (
    <div className="bf-card">
      <p className="bf-section-label">Order summary</p>
      <p className="bf-prop-title">{property.title}</p>
      <p className="bf-prop-city">📍 {property.city}</p>
      <div className="bf-tags">
        <span className="bf-tag">{property.guests} guests</span>
        <span className="bf-tag">{property.type || 'Property'}</span>
      </div>
      <div className="bf-rows">
        <div className="bf-row">
          <span>Check-in</span>
          <span>{formatDate(checkIn)}</span>
        </div>
        <div className="bf-row">
          <span>Check-out</span>
          <span>{formatDate(checkOut)}</span>
        </div>
        <div className="bf-row">
          <span>Nights</span>
          <span>{nights}</span>
        </div>
        <div className="bf-row">
          <span>₱{Number(property.price || 0).toLocaleString()} × {nights}</span>
          <span>₱{Number(total).toLocaleString()}</span>
        </div>
      </div>
      <hr className="bf-divider" />
      <div className="bf-total">
        <span>Total due</span>
        <span>₱{Number(total).toLocaleString()}</span>
      </div>
      <div className="ps-ref-block">
        <div className="ps-ref-row">
          <span>Booking ref</span>
          <strong>{bookingRef}</strong>
        </div>
        <div className="ps-ref-row">
          <span>Transaction ID</span>
          <strong className="ps-txn">{transactionID}</strong>
        </div>
      </div>
    </div>
  )
}