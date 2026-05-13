/**
 * PayPage.jsx
 *
 * Accessed via:
 * http://192.168.1.10:5173/pay/:transactionID
 *
 * Flow:
 * 1. Get transactionID from URL
 * 2. Fetch booking from Firebase
 * 3. If paymentStatus !== 'paid' → auto mark as paid
 * 4. Show success screen
 */

import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { db } from '../Firebase'
import { ref, get, update, set } from 'firebase/database'
import './PayPage.css'

export default function PayPage() {
  const { transactionID } = useParams()
  

  const [loading, setLoading] = useState(true)
  const [booking, setBooking] = useState(null)
  const [alreadyPaid, setAlreadyPaid] = useState(false)

  useEffect(() => {

    async function processPayment() {
      try {
        const snapshot = await get(ref(db, 'bookings'))

        let foundKey = null
        let foundData = null

        snapshot.forEach(child => {
          const data = child.val()
          if (data.transactionID === transactionID) {
            foundKey = child.key
            foundData = data

          }
        })

        if (!foundData) {
          setLoading(false)
          return
        }

        setBooking(foundData)

        // If already paid → just show success
        if (foundData.paymentStatus === 'paid') {
          setAlreadyPaid(true)
          setLoading(false)
          return
        }

        // Auto mark as paid (mock payment success)
        await update(ref(db, `bookings/${foundKey}`), {
          paymentStatus: 'paid',
          paymentMethod: 'ewallet',
          paidAt: new Date().toISOString(),
        })

        setAlreadyPaid(false)
        setLoading(false)

      } catch (err) {
        console.error(err)
        setLoading(false)
      }
    }

    processPayment()
  }, [transactionID])

  if (loading) {
    return (
      <div className="pp-wrap">
        <div className="pp-loader">Processing payment...</div>
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="pp-wrap">
        <div className="pp-error">Transaction not found.</div>
      </div>
    )
  }

  return (
    <div className="pp-wrap">
      <div className="pp-card">
        <div className="pp-check">✓</div>

        <h1>Payment Successful</h1>
        <p className="pp-sub">
          {alreadyPaid
            ? 'This transaction was already completed.'
            : 'Your payment has been confirmed.'}
        </p>

        <div className="pp-box">
          <div><span>Transaction ID</span><strong>{transactionID}</strong></div>
          <div><span>Property</span><strong>{booking.propertyTitle}</strong></div>
          <div><span>Total Paid</span><strong>₱{Number(booking.total).toLocaleString()}</strong></div>
          <div><span>Status</span><strong className="pp-status">PAID</strong></div>
        </div>

        <p className="pp-note">
          You can safely close this page.
        </p>
      </div>
    </div>
  )
}