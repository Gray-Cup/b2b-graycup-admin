'use client'

import { useEffect, useState } from 'react'
import { IconButton } from '@medusajs/ui'
import { Sun, Moon } from '@medusajs/icons'

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem('theme')
    const prefersDark = stored === 'dark'
    setIsDark(prefersDark)
    applyTheme(prefersDark)
  }, [])

  const applyTheme = (dark: boolean) => {
    const html = document.documentElement
    if (dark) {
      html.classList.remove('light')
      html.classList.add('dark')
      html.setAttribute('data-mode', 'dark')
      html.style.colorScheme = 'dark'
    } else {
      html.classList.remove('dark')
      html.classList.add('light')
      html.setAttribute('data-mode', 'light')
      html.style.colorScheme = 'light'
    }
  }

  const toggleTheme = () => {
    const newDark = !isDark
    setIsDark(newDark)
    localStorage.setItem('theme', newDark ? 'dark' : 'light')
    applyTheme(newDark)
  }

  if (!mounted) return null

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <IconButton
        onClick={toggleTheme}
        variant="transparent"
        className="rounded-full shadow-lg bg-ui-bg-base hover:bg-ui-bg-base-hover border border-ui-border-base"
      >
        {isDark ? <Sun /> : <Moon />}
      </IconButton>
    </div>
  )
}
