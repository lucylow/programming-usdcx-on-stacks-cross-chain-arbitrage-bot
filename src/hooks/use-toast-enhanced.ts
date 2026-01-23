import { createElement } from "react"
import { toast } from "sonner"
import { CheckCircle2, XCircle, AlertCircle, Info, Loader2 } from "lucide-react"

export interface ToastOptions {
  title?: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  duration?: number
  dismissible?: boolean
}

/**
 * Enhanced toast notifications with better UX
 */
export function useToastEnhanced() {
  const showSuccess = (message: string, options?: ToastOptions) => {
    return toast.success(message, {
      description: options?.description,
      duration: options?.duration || 4000,
      icon: createElement(CheckCircle2, { className: "w-5 h-5" }),
      action: options?.action ? {
        label: options.action.label,
        onClick: options.action.onClick,
      } : undefined,
    })
  }

  const showError = (message: string, options?: ToastOptions) => {
    return toast.error(message, {
      description: options?.description,
      duration: options?.duration || 6000,
      icon: createElement(XCircle, { className: "w-5 h-5" }),
      action: options?.action ? {
        label: options.action.label,
        onClick: options.action.onClick,
      } : undefined,
    })
  }

  const showWarning = (message: string, options?: ToastOptions) => {
    return toast.warning(message, {
      description: options?.description,
      duration: options?.duration || 5000,
      icon: createElement(AlertCircle, { className: "w-5 h-5" }),
      action: options?.action ? {
        label: options.action.label,
        onClick: options.action.onClick,
      } : undefined,
    })
  }

  const showInfo = (message: string, options?: ToastOptions) => {
    return toast.info(message, {
      description: options?.description,
      duration: options?.duration || 4000,
      icon: createElement(Info, { className: "w-5 h-5" }),
      action: options?.action ? {
        label: options.action.label,
        onClick: options.action.onClick,
      } : undefined,
    })
  }

  const showLoading = (message: string, options?: ToastOptions) => {
    return toast.loading(message, {
      description: options?.description,
      icon: createElement(Loader2, { className: "w-5 h-5 animate-spin" }),
    })
  }

  const showPromise = <T,>(
    promise: Promise<T>,
    messages: {
      loading: string
      success: string | ((data: T) => string)
      error: string | ((error: any) => string)
    },
    options?: ToastOptions
  ) => {
    // sonner's toast.promise typings expect strings / ReactNodes (not {title, description} objects)
    return toast.promise(promise, {
      loading: messages.loading,
      success: (data) => (typeof messages.success === "function" ? messages.success(data) : messages.success),
      error: (err) => (typeof messages.error === "function" ? messages.error(err) : messages.error),
    })
  }

  return {
    success: showSuccess,
    error: showError,
    warning: showWarning,
    info: showInfo,
    loading: showLoading,
    promise: showPromise,
  }
}
