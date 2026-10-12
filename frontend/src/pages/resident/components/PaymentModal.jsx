import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  ShieldCheck, X, CreditCard, Building2, Check, Lock,
  CheckCircle2, Banknote, Globe, AlertCircle
} from 'lucide-react'
import { PayPalButtons, usePayPalScriptReducer } from '@paypal/react-paypal-js'
import { apiRequest } from '../../../services/api.js'

export default function PaymentModal({
  isOpen,
  onClose,
  booking,
  onSuccess,
  defaultAmount,
  propertyName,
}) {
  const [method, setMethod] = useState('paypal')
  const [cardNumber, setCardNumber] = useState('')
  const [cardHolder, setCardHolder] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvv, setCardCvv] = useState('')
  const [selectedBank, setSelectedBank] = useState('HDFC Bank')
  const [isProcessing, setIsProcessing] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // Check if PayPal SDK loaded
  const [{ isPending: paypalLoading }] = usePayPalScriptReducer()

  if (!isOpen) return null

  const targetAmount = Number(booking?.amount || defaultAmount || 500)
  const usdAmount = Number(targetAmount).toFixed(2)
  const depositAmount = booking?.securityDeposit ?? booking?.propertySecurityDeposit

  const bId = booking?.bookingId || booking?.id || booking?.booking || 'DIRECT-RENT'
  const prop = booking?.property || booking?.propertyName || propertyName || 'Nestora Co-Living'
  const room = booking?.room || booking?.roomType || 'Standard Room'

  // Card formatting
  const handleCardNumberChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16)
    const formatted = raw.match(/.{1,4}/g)?.join(' ') || raw
    setCardNumber(formatted)
  }

  const handleExpiryChange = (e) => {
    let raw = e.target.value.replace(/\D/g, '').slice(0, 4)
    if (raw.length >= 2) raw = `${raw.slice(0, 2)}/${raw.slice(2)}`
    setCardExpiry(raw)
  }

  // ── PayPal handlers ──────────────────────────────────────────
  const handlePaypalCreateOrder = async () => {
    setErrorMsg('')
    try {
      const res = await apiRequest('/resident/payments/paypal/create-order', {
        method: 'POST',
        body: JSON.stringify({
          amount: usdAmount,
          bookingId: bId,
          propertyName: prop,
        }),
      })
      if (!res.success) throw new Error(res.message || 'Failed to create PayPal order')
      return res.orderId
    } catch (err) {
      setErrorMsg(err.message || 'PayPal initialization failed. Please try again.')
      throw err
    }
  }

  const handlePaypalApprove = async (data) => {
    setIsProcessing(true)
    setErrorMsg('')
    try {
      const res = await apiRequest('/resident/payments/paypal/capture-order', {
        method: 'POST',
        body: JSON.stringify({
          orderId: data.orderID,
          bookingId: bId,
          propertyId: booking?.propertyId,
          propertyName: prop,
          amount: targetAmount,
        }),
      })
      if (!res.success) throw new Error(res.message || 'PayPal capture failed')

      await onSuccess({
        alreadyCaptured: true,
        message: res.message,
        payment: res.data,
        bookingId: bId,
        propertyId: booking?.propertyId,
        propertyName: prop,
        amount: targetAmount,
        method: `PayPal (Order: ${data.orderID})`,
        isCod: false,
        paypalOrderId: data.orderID,
      })
      onClose()
    } catch (err) {
      setErrorMsg(err.message || 'Payment capture failed. Please contact support.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handlePaypalError = (err) => {
    console.error('PayPal error:', err)
    setErrorMsg('Something went wrong with PayPal. Please try a different method.')
    setIsProcessing(false)
  }

  const handlePaypalCancel = () => {
    setErrorMsg('PayPal payment was cancelled. You can try again or choose another method.')
    setIsProcessing(false)
  }

  // ── Non-PayPal submit (Card / Netbanking / COD) ──────────────
  const handleNonPaypalSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')

    let methodLabel = ''
    let isCod = false

    if (method === 'card') {
      if (cardNumber.replace(/\s/g, '').length < 16) {
        setErrorMsg('Please enter a valid 16-digit card number.')
        return
      }
      if (!cardExpiry || !cardCvv) {
        setErrorMsg('Please enter card expiry and 3-digit CVV.')
        return
      }
      const last4 = cardNumber.replace(/\s/g, '').slice(-4)
      methodLabel = `Card (Ending in ${last4})`
    } else if (method === 'netbanking') {
      methodLabel = `Netbanking (${selectedBank})`
    } else if (method === 'cod') {
      methodLabel = 'Cash on Delivery (Pay at Property)'
      isCod = true
    }

    setIsProcessing(true)
    try {
      await onSuccess({
        bookingId: bId,
        propertyId: booking?.propertyId,
        propertyName: prop,
        amount: targetAmount,
        method: methodLabel,
        isCod,
      })
      onClose()
    } catch (err) {
      setErrorMsg(err.message || 'Payment processing failed. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={() => !isProcessing && onClose()}>
      <motion.div
        className="modal-content"
        style={{ maxWidth: '540px', padding: '24px' }}
        onClick={e => e.stopPropagation()}
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
      >
        <button className="close-modal-btn" onClick={() => !isProcessing && onClose()}>
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <span className="r-v8-badge-verified">
            <ShieldCheck size={13} /> Official Nestora Payment Gateway
          </span>
        </div>

        <h2 style={{ fontSize: '1.45rem', fontWeight: 800, margin: '6px 0 2px' }}>
          Settle Accommodation Payment
        </h2>
        <p className="muted-copy" style={{ fontSize: '0.86rem', marginBottom: '14px' }}>
          Reserving <strong>{prop}</strong> · Ref: <strong>#{bId}</strong>
        </p>

        {/* Amount Summary */}
        <div style={{ background: 'var(--paper-2)', borderRadius: '12px', padding: '14px 16px', border: '1px solid var(--line)', marginBottom: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '0.74rem', color: '#6b7280', fontWeight: 800, textTransform: 'uppercase' }}>
                TOTAL PAYABLE AMOUNT
              </span>
              <div style={{ fontSize: '1.7rem', fontWeight: 900, color: 'var(--jade)', marginTop: '2px' }}>
                ${targetAmount.toLocaleString('en-US')}
              </div>
              {method === 'paypal' && (
                <span style={{ fontSize: '0.72rem', color: '#6b7280', marginTop: '2px', display: 'block' }}>
                  Processed securely in USD via PayPal
                </span>
              )}
              <span style={{ fontSize: '0.72rem', color: '#6b7280', marginTop: '4px', display: 'block' }}>
                Security deposit: {depositAmount == null ? 'Not specified' : `$${Number(depositAmount).toLocaleString('en-US')}`} — not included in this rent payment
              </span>
            </div>
            <div style={{ textAlign: 'right', fontSize: '0.8rem' }}>
              <span style={{ color: '#6b7280', display: 'block' }}>Room: <strong>{room}</strong></span>
              <span style={{ color: '#10b981', fontWeight: 700 }}>Zero Brokerage • 100% Verified</span>
            </div>
          </div>
        </div>

        {errorMsg && (
          <div style={{ padding: '10px 14px', background: '#fee2e2', color: '#991b1b', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} /> {errorMsg}
          </div>
        )}

        <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#4b5563', marginBottom: '8px' }}>
          CHOOSE PAYMENT METHOD
        </label>

        <div className="r-v8-pay-methods-list">

          {/* 1. PAYPAL */}
          <div
            className={`r-v8-pay-option ${method === 'paypal' ? 'selected' : ''}`}
            onClick={() => setMethod('paypal')}
          >
            <div className="r-v8-pay-option-header">
              <div className="r-v8-pay-option-left">
                <div className="r-v8-pay-icon-box" style={{ background: 'rgba(0, 112, 186, 0.12)', color: '#0070ba' }}>
                  <Globe size={20} />
                </div>
                <div>
                  <div className="r-v8-pay-title">
                    <span>PayPal</span>
                    <span className="r-v8-pay-tag" style={{ background: '#0070ba', color: '#fff' }}>Live</span>
                  </div>
                  <p className="r-v8-pay-subtitle">Pay securely via your PayPal wallet or linked card</p>
                </div>
              </div>
              <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: method === 'paypal' ? '6px solid #10b981' : '2px solid #d1d5db' }} />
            </div>

            {method === 'paypal' && (
              <div className="r-v8-subpanel">
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', fontSize: '0.75rem', color: '#059669', fontWeight: 700 }}>
                  <ShieldCheck size={14} /> 100% Protected by PayPal Buyer Protection
                </div>
                {paypalLoading ? (
                  <div style={{ textAlign: 'center', padding: '16px', color: '#6b7280', fontSize: '0.85rem' }}>
                    Loading PayPal...
                  </div>
                ) : (
                  <PayPalButtons
                    style={{ layout: 'vertical', color: 'blue', shape: 'rect', label: 'pay', height: 40 }}
                    createOrder={handlePaypalCreateOrder}
                    onApprove={handlePaypalApprove}
                    onError={handlePaypalError}
                    onCancel={handlePaypalCancel}
                    disabled={isProcessing}
                  />
                )}
              </div>
            )}
          </div>

          {/* 2. CREDIT / DEBIT CARD */}
          <div
            className={`r-v8-pay-option ${method === 'card' ? 'selected' : ''}`}
            onClick={() => setMethod('card')}
          >
            <div className="r-v8-pay-option-header">
              <div className="r-v8-pay-option-left">
                <div className="r-v8-pay-icon-box" style={{ background: 'rgba(37, 99, 235, 0.12)', color: '#2563eb' }}>
                  <CreditCard size={20} />
                </div>
                <div>
                  <div className="r-v8-pay-title">
                    <span>Credit / Debit Card</span>
                    <span className="r-v8-pay-tag" style={{ background: '#2563eb', color: '#fff' }}>256-Bit SSL</span>
                  </div>
                  <p className="r-v8-pay-subtitle">Visa, MasterCard, RuPay, Maestro &amp; American Express</p>
                </div>
              </div>
              <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: method === 'card' ? '6px solid #10b981' : '2px solid #d1d5db' }} />
            </div>

            {method === 'card' && (
              <form onSubmit={handleNonPaypalSubmit} className="r-v8-subpanel">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#4b5563', marginBottom: '3px' }}>CARD NUMBER</label>
                    <input type="text" placeholder="4532 •••• •••• 8921" value={cardNumber} onChange={handleCardNumberChange} className="r-v8-input" />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '8px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#4b5563', marginBottom: '3px' }}>CARDHOLDER NAME</label>
                      <input type="text" placeholder="Name on card" value={cardHolder} onChange={e => setCardHolder(e.target.value)} className="r-v8-input" />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#4b5563', marginBottom: '3px' }}>EXPIRY</label>
                      <input type="text" placeholder="MM/YY" value={cardExpiry} onChange={handleExpiryChange} className="r-v8-input" />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#4b5563', marginBottom: '3px' }}>CVV</label>
                      <input type="password" maxLength={4} placeholder="•••" value={cardCvv} onChange={e => setCardCvv(e.target.value.replace(/\D/g, ''))} className="r-v8-input" />
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                  <button type="button" className="ghost-button compact-button" disabled={isProcessing} onClick={onClose} style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
                  <button type="submit" className="primary-button compact-button" disabled={isProcessing} style={{ flex: 2, justifyContent: 'center' }}>
                    {isProcessing ? 'Processing...' : `Pay $${targetAmount.toLocaleString('en-US')}`}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* 3. NETBANKING */}
          <div
            className={`r-v8-pay-option ${method === 'netbanking' ? 'selected' : ''}`}
            onClick={() => setMethod('netbanking')}
          >
            <div className="r-v8-pay-option-header">
              <div className="r-v8-pay-option-left">
                <div className="r-v8-pay-icon-box" style={{ background: 'rgba(75, 85, 99, 0.12)', color: '#4b5563' }}>
                  <Building2 size={20} />
                </div>
                <div>
                  <div className="r-v8-pay-title">
                    <span>Netbanking</span>
                    <span className="r-v8-pay-tag" style={{ background: '#4b5563', color: '#fff' }}>50+ Banks</span>
                  </div>
                  <p className="r-v8-pay-subtitle">Direct instant transfer from partner banks</p>
                </div>
              </div>
              <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: method === 'netbanking' ? '6px solid #10b981' : '2px solid #d1d5db' }} />
            </div>

            {method === 'netbanking' && (
              <form onSubmit={handleNonPaypalSubmit} className="r-v8-subpanel">
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#4b5563' }}>SELECT POPULAR BANK:</span>
                <div className="r-v8-bank-grid">
                  {['Chase', 'Bank of America', 'Wells Fargo', 'Citibank', 'Capital One'].map(bank => (
                    <button
                      key={bank}
                      type="button"
                      className={`r-v8-bank-chip ${selectedBank === bank ? 'active' : ''}`}
                      onClick={e => { e.stopPropagation(); setSelectedBank(bank) }}
                    >
                      {bank}
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                  <button type="button" className="ghost-button compact-button" disabled={isProcessing} onClick={onClose} style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
                  <button type="submit" className="primary-button compact-button" disabled={isProcessing} style={{ flex: 2, justifyContent: 'center' }}>
                    {isProcessing ? 'Processing...' : `Proceed via ${selectedBank} ($${targetAmount.toLocaleString('en-US')})`}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* 4. CASH ON DELIVERY */}
          <div
            className={`r-v8-pay-option ${method === 'cod' ? 'selected' : ''}`}
            onClick={() => setMethod('cod')}
            style={{ borderColor: method === 'cod' ? '#10b981' : 'var(--line)', background: method === 'cod' ? 'rgba(16, 185, 129, 0.05)' : 'var(--white)' }}
          >
            <div className="r-v8-pay-option-header">
              <div className="r-v8-pay-option-left">
                <div className="r-v8-pay-icon-box" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
                  <Banknote size={20} />
                </div>
                <div>
                  <div className="r-v8-pay-title">
                    <span>Cash on Delivery (Pay at Property)</span>
                    <span className="r-v8-pay-tag" style={{ background: '#10b981', color: '#fff' }}>Zero Advance</span>
                  </div>
                  <p className="r-v8-pay-subtitle">Pay in cash during room handover at property reception</p>
                </div>
              </div>
              <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: method === 'cod' ? '6px solid #10b981' : '2px solid #d1d5db' }} />
            </div>

            {method === 'cod' && (
              <form onSubmit={handleNonPaypalSubmit} className="r-v8-subpanel" style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8rem', color: '#064e3b' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Check size={14} color="#10b981" /> <strong>No upfront digital transaction needed today</strong></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Check size={14} color="#10b981" /> <strong>Instant reservation pass &amp; room allotment confirmed</strong></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Check size={14} color="#10b981" /> Pay ${targetAmount.toLocaleString('en-US')} in cash on your move-in day</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Check size={14} color="#10b981" /> Official printed physical receipt at reception</div>
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                  <button type="button" className="ghost-button compact-button" disabled={isProcessing} onClick={onClose} style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
                  <button type="submit" className="primary-button compact-button" disabled={isProcessing} style={{ flex: 2, justifyContent: 'center', background: '#059669' }}>
                    {isProcessing ? 'Confirming...' : `Confirm COD ($${targetAmount.toLocaleString('en-US')})`}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Trust Footer */}
        <div className="r-v8-trust-footer" style={{ marginTop: '14px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Lock size={12} color="#10b981" /> 256-Bit SSL Encrypted
          </span>
          <span>•</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ShieldCheck size={12} color="#10b981" /> PCI-DSS Certified
          </span>
          <span>•</span>
          <span>100% Nestora Safe Living Guarantee</span>
        </div>
      </motion.div>
    </div>
  )
}
