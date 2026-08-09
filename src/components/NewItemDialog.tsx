import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export function NewItemDialog({
  open,
  onOpenChange,
  title,
  label,
  placeholder,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  label: string
  placeholder?: string
  onSubmit: (value: string) => Promise<void>
}) {
  const [value, setValue] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) setValue('')
  }, [open])

  const submit = async () => {
    if (!value.trim() || saving) return
    setSaving(true)
    await onSubmit(value.trim())
    setSaving(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="mb-1">
          <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</Label>
          <Input
            placeholder={placeholder}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit()
            }}
          />
        </div>
        <Button className="w-full" disabled={!value.trim() || saving} onClick={submit}>
          Guardar
        </Button>
      </DialogContent>
    </Dialog>
  )
}
