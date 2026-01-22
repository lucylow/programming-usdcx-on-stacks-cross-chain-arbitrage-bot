"use client"

import { useEffect } from "react"

interface KeyboardShortcutOptions {
  key: string
  metaKey?: boolean
  ctrlKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
}

export function useKeyboardShortcut(
  options: KeyboardShortcutOptions,
  callback: (event: KeyboardEvent) => void,
  enabled = true,
) {
  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (event: KeyboardEvent) => {
      const { key, metaKey, ctrlKey, shiftKey, altKey } = options

      const isMatch =
        event.key === key &&
        (!options.metaKey || event.metaKey === metaKey) &&
        (!options.ctrlKey || event.ctrlKey === ctrlKey) &&
        (!options.shiftKey || event.shiftKey === shiftKey) &&
        (!options.altKey || event.altKey === altKey)

      if (isMatch) {
        event.preventDefault()
        callback(event)
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [options, callback, enabled])
}

// Usage example:
// useKeyboardShortcut({ key: 'k', metaKey: true }, () => openCommandPalette())
