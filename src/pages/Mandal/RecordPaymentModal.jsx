import React, { useState, useEffect } from 'react'
import Modal from '../../components/Modal'
import Input from '../../components/common/Input'
import Select from '../../components/common/Select'
import DatePicker from '../../components/DatePicker'
import Button from '../../components/common/Button'
import api from '../../lib/api'
import { MANDAL_ENDPOINTS } from '../../utils/endpoints'
import { toast } from '../../lib/toast'

const PAYMENT_MODE_OPTIONS = [
  { label: 'Cash', value: 'Cash' },
  { label: 'UPI / Online', value: 'Online' },
  { label: 'Bank Transfer', value: 'Bank' },
  { label: 'Cheque', value: 'Cheque' },
  { label: 'Other', value: 'Other' }
]

const STATUS_OPTIONS = [
  { label: 'Paid', value: 'Paid' },
  { label: 'Pending', value: 'Pending' },
  { label: 'Partial', value: 'Partial' }
]

export default function RecordPaymentModal({ isOpen, onClose, contribution, onSaved }) {
  const [loading, setLoading] = useState(false)
  const [amount, setAmount] = useState('')
  const [dateValue, setDateValue] = useState(new Date().toISOString().slice(0, 10))
  const [paymentMode, setPaymentMode] = useState('Cash')
  const [status, setStatus] = useState('Paid')
  const [transactionId, setTransactionId] = useState('')
  const [receiptNumber, setReceiptNumber] = useState('')
  const [notes, setNotes] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  useEffect(() => {
    if (contribution) {
      setAmount(contribution.amount > 0 ? contribution.amount : (contribution.expected_amount || 500))
      setDateValue(contribution.payment_date ? new Date(contribution.payment_date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10))
      setPaymentMode(contribution.payment_mode || 'Cash')
      setStatus(contribution.status === 'Pending' ? 'Paid' : contribution.status || 'Paid')
      setTransactionId(contribution.transaction_id || '')
      setReceiptNumber(contribution.receipt_number || '')
      setNotes(contribution.notes || '')
      setFieldErrors({})
    }
  }, [contribution, isOpen])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!amount || Number(amount) <= 0) {
      setFieldErrors({ amount: 'Amount must be greater than 0' })
      return
    }

    setLoading(true)
    try {
      await api.put(MANDAL_ENDPOINTS.UPDATE_CONTRIBUTION(contribution.id || contribution._id), {
        amount: Number(amount),
        payment_date: dateValue,
        payment_mode: paymentMode,
        status,
        transaction_id: transactionId,
        receipt_number: receiptNumber,
        notes
      })
      toast.success('Payment recorded successfully')
      onSaved()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record payment')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !contribution) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Record Contribution Payment - ${contribution.member_name || 'Member'}`}
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-text" noValidate>
        <div className="p-3 bg-surface-secondary/60 rounded-xl border border-border flex items-center justify-between text-xs sm:text-sm">
          <div>
            <p className="text-text-secondary font-medium">Member Name</p>
            <p className="font-bold text-text">{contribution.member_name}</p>
          </div>
          <div className="text-right">
            <p className="text-text-secondary font-medium">Contribution Month</p>
            <p className="font-bold text-primary">{contribution.month}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            type="number"
            label="Paid Amount (₹)"
            name="amount"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value)
              if (fieldErrors.amount) setFieldErrors(prev => ({ ...prev, amount: null }))
            }}
            required
            min="1"
            placeholder="500"
            error={fieldErrors.amount}
            disabled={loading}
          />

          <Select
            label="Payment Status"
            value={status}
            onChange={setStatus}
            options={STATUS_OPTIONS}
            disabled={loading}
          />

          <div>
            <label className="text-xs sm:text-sm text-text-secondary mb-1.5 block font-semibold">Payment Date <span className="text-red-500">*</span></label>
            <DatePicker
              mode="date"
              value={dateValue}
              onChange={setDateValue}
              disabled={loading}
              className="w-full bg-input-bg text-text border border-border hover:border-text-secondary/30 focus:border-primary/50 rounded-xl py-2.5 px-4 text-sm outline-none"
            />
          </div>

          <Select
            label="Payment Mode"
            value={paymentMode}
            onChange={setPaymentMode}
            options={PAYMENT_MODE_OPTIONS}
            disabled={loading}
          />

          <Input
            type="text"
            label="Receipt No. (Optional)"
            name="receipt_number"
            value={receiptNumber}
            onChange={(e) => setReceiptNumber(e.target.value)}
            placeholder="e.g. REC-1042"
            disabled={loading}
          />

          <Input
            type="text"
            label="Transaction / UPI Ref ID"
            name="transaction_id"
            value={transactionId}
            onChange={(e) => setTransactionId(e.target.value)}
            placeholder="e.g. UPI/12345678"
            disabled={loading}
          />
        </div>

        <div>
          <Input
            type="textarea"
            label="Notes / Remarks"
            name="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional comments or reference notes..."
            rows="2"
            disabled={loading}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={loading}
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Payment'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
