import React, { useState, useEffect } from 'react'
import Modal from '../../components/Modal'
import Input from '../../components/common/Input'
import Select from '../../components/common/Select'
import DatePicker from '../../components/DatePicker'
import Button from '../../components/common/Button'
import FileDropzone from '../../components/common/FileDropzone'
import api, { assetUrl } from '../../lib/api'
import { MANDAL_ENDPOINTS } from '../../utils/endpoints'
import { toast } from '../../lib/toast'

const EXPENSE_CATEGORIES = [
  { label: 'Event & Gathering', value: 'Event' },
  { label: 'Refreshments / Food', value: 'Food' },
  { label: 'Stationery & Printing', value: 'Stationery' },
  { label: 'Decoration & Sound', value: 'Decoration' },
  { label: 'Charity & Donation', value: 'Charity' },
  { label: 'Rent & Maintenance', value: 'Maintenance' },
  { label: 'General / Miscellaneous', value: 'General' }
]

const PAYMENT_MODES = [
  { label: 'Cash', value: 'Cash' },
  { label: 'UPI / Online', value: 'Online' },
  { label: 'Bank Transfer', value: 'Bank' },
  { label: 'Cheque', value: 'Cheque' }
]

export default function AddMandalExpenseModal({ isOpen, onClose, selectedExpense, onSaved }) {
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('General')
  const [amount, setAmount] = useState('')
  const [dateValue, setDateValue] = useState(new Date().toISOString().slice(0, 10))
  const [paymentMode, setPaymentMode] = useState('Cash')
  const [description, setDescription] = useState('')
  const [receiptFile, setReceiptFile] = useState(null)
  const [removeImage, setRemoveImage] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})

  useEffect(() => {
    if (selectedExpense) {
      setTitle(selectedExpense.title || '')
      setCategory(selectedExpense.category || 'General')
      setAmount(selectedExpense.amount || '')
      setDateValue(selectedExpense.date ? new Date(selectedExpense.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10))
      setPaymentMode(selectedExpense.payment_mode || 'Cash')
      setDescription(selectedExpense.description || '')
      setReceiptFile(null)
      setRemoveImage(false)
      setFieldErrors({})
    } else {
      setTitle('')
      setCategory('General')
      setAmount('')
      setDateValue(new Date().toISOString().slice(0, 10))
      setPaymentMode('Cash')
      setDescription('')
      setReceiptFile(null)
      setRemoveImage(false)
      setFieldErrors({})
    }
  }, [selectedExpense, isOpen])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errors = {}
    if (!title.trim()) errors.title = 'Title is required'
    if (!amount || Number(amount) <= 0) errors.amount = 'Valid amount is required'

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('title', title.trim())
      formData.append('category', category)
      formData.append('amount', amount)
      formData.append('date', dateValue)
      formData.append('payment_mode', paymentMode)
      formData.append('description', description)

      if (receiptFile) {
        formData.append('receipt_image', receiptFile)
      }
      if (removeImage) {
        formData.append('remove_image', 'true')
      }

      if (selectedExpense) {
        await api.put(MANDAL_ENDPOINTS.UPDATE_EXPENSE(selectedExpense.id || selectedExpense._id), formData)
        toast.success('Expense updated successfully')
      } else {
        await api.post(MANDAL_ENDPOINTS.CREATE_EXPENSE, formData)
        toast.success('Expense recorded successfully')
      }

      onSaved()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save expense')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={selectedExpense ? 'Edit Mandal Expense' : 'Add Mandal Expense'}
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-text" noValidate>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Input
              type="text"
              label="Expense Title"
              name="title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
                if (fieldErrors.title) setFieldErrors(prev => ({ ...prev, title: null }))
              }}
              required
              placeholder="e.g. Monthly meeting refreshments, Hall rent..."
              error={fieldErrors.title}
              disabled={loading}
            />
          </div>

          <Select
            label="Category"
            value={category}
            onChange={setCategory}
            options={EXPENSE_CATEGORIES}
            disabled={loading}
          />

          <Input
            type="number"
            label="Amount (₹)"
            name="amount"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value)
              if (fieldErrors.amount) setFieldErrors(prev => ({ ...prev, amount: null }))
            }}
            required
            min="1"
            placeholder="1000"
            error={fieldErrors.amount}
            disabled={loading}
          />

          <div>
            <label className="text-xs sm:text-sm text-text-secondary mb-1.5 block font-semibold">Expense Date <span className="text-red-500">*</span></label>
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
            options={PAYMENT_MODES}
            disabled={loading}
          />
        </div>

        <div>
          <Input
            type="textarea"
            label="Description / Purpose"
            name="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Details about what this expense was for..."
            rows="2"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-semibold text-text-secondary mb-1.5">
            Receipt / Bill Image (Optional)
          </label>
          <FileDropzone
            name="receipt_image"
            accept="image/*,application/pdf"
            onFilesSelected={(files) => setReceiptFile(files[0])}
            disabled={loading}
            label="Click or Drag Receipt Bill"
            subLabel="Supported: PNG, JPG, PDF"
            previews={[
              ...(receiptFile ? [{
                url: URL.createObjectURL(receiptFile),
                onRemove: () => setReceiptFile(null)
              }] : selectedExpense?.receipt_image && !removeImage ? [{
                url: assetUrl(selectedExpense.receipt_image),
                onRemove: () => setRemoveImage(true)
              }] : [])
            ]}
          />
          {removeImage && (
            <span className="text-xs text-error-text font-medium mt-1 block">Receipt will be removed on save.</span>
          )}
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
            {loading ? 'Saving...' : 'Save Expense'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
