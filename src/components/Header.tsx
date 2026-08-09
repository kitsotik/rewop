import { useState } from 'react'
import { ChevronDown, Sun, Moon, LogOut } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Switch } from '@/components/ui/switch'
import { getTheme, setTheme } from '@/lib/theme'
import type { Profile } from '@/types'

function initials(name: string | undefined) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase()
}

export function Header({ title, profile, onLogout }: { title: string; profile: Profile | null; onLogout: () => void }) {
  const [isDark, setIsDark] = useState(() => getTheme() === 'dark')

  const toggleTheme = (checked: boolean) => {
    setTheme(checked ? 'dark' : 'light')
    setIsDark(checked)
  }

  return (
    <header className="h-14 shrink-0 border-b border-border flex items-center justify-between px-7 md:px-8">
      <h2 className="text-sm font-semibold">{title}</h2>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button type="button" className="flex items-center gap-2.5 rounded-md px-2 py-1.5 hover:bg-accent">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">
              {initials(profile?.full_name)}
            </span>
            <span className="text-sm font-medium hidden sm:inline">{profile?.full_name || ''}</span>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="text-sm font-medium text-foreground">{profile?.full_name || ''}</div>
            <div className="text-xs text-muted-foreground capitalize">{profile?.role}</div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="justify-between">
            <span className="flex items-center gap-2">
              {isDark ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              Tema oscuro
            </span>
            <Switch checked={isDark} onCheckedChange={toggleTheme} />
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={onLogout}>
            <LogOut className="w-4 h-4" /> Cerrar sesión
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
