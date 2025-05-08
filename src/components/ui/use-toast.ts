// Adapted from shadcn-ui toast implementation

import { useState, useEffect, useCallback } from "react"

export interface ToastProps {
  id: string
  title?: string
  description?: string
  action?: React.ReactNode
  variant?: "default" | "destructive" | "success"
  duration?: number
}

export type ToastActionElement = React.ReactElement<{
  altText: string
  onClick: () => void
}>

const TOAST_LIMIT = 3
const TOAST_REMOVE_DELAY = 1000

type ToasterToast = ToastProps & {
  id: string
  open: boolean
  timestamp: number
}

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST"
} as const

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

type ActionType = typeof actionTypes

type Action =
  | {
      type: ActionType["ADD_TOAST"]
      toast: ToasterToast
    }
  | {
      type: ActionType["UPDATE_TOAST"]
      toast: Partial<ToasterToast>
    }
  | {
      type: ActionType["DISMISS_TOAST"]
      toastId?: string
    }
  | {
      type: ActionType["REMOVE_TOAST"]
      toastId?: string
    }

interface State {
  toasts: ToasterToast[]
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT)
      }

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        )
      }

    case "DISMISS_TOAST": {
      const { toastId } = action

      if (toastId) {
        return {
          ...state,
          toasts: state.toasts.map((t) =>
            t.id === toastId
              ? {
                  ...t,
                  open: false
                }
              : t
          )
        }
      }

      return {
        ...state,
        toasts: state.toasts.map((t) => ({
          ...t,
          open: false
        }))
      }
    }

    case "REMOVE_TOAST": {
      const { toastId } = action

      if (toastId) {
        return {
          ...state,
          toasts: state.toasts.filter((t) => t.id !== toastId)
        }
      }

      return {
        ...state,
        toasts: []
      }
    }
  }
}

export function useToast() {
  const [state, setState] = useState<State>({ toasts: [] })

  const toast = useCallback(
    (props: Omit<ToasterToast, "id" | "open" | "timestamp">) => {
      const id = genId()
      const newToast: ToasterToast = {
        ...props,
        id,
        open: true,
        timestamp: Date.now()
      }

      setState((state) => reducer(state, { type: "ADD_TOAST", toast: newToast }))

      return id
    },
    []
  )

  const update = useCallback(
    (id: string, props: Partial<ToasterToast>) => {
      setState((state) =>
        reducer(state, { type: "UPDATE_TOAST", toast: { ...props, id } })
      )
    },
    []
  )

  const dismiss = useCallback((id?: string) => {
    setState((state) => reducer(state, { type: "DISMISS_TOAST", toastId: id }))
  }, [])

  const remove = useCallback((id?: string) => {
    setState((state) => reducer(state, { type: "REMOVE_TOAST", toastId: id }))
  }, [])

  useEffect(() => {
    state.toasts.forEach((toast) => {
      if (!toast.open) {
        const timeout = setTimeout(() => {
          remove(toast.id)
        }, TOAST_REMOVE_DELAY)

        toastTimeouts.set(toast.id, timeout)
      }
    })
  }, [state.toasts, remove])

  return {
    toasts: state.toasts,
    toast,
    dismiss,
    remove,
    update,
  }
}

export type Toast = ReturnType<typeof useToast> 