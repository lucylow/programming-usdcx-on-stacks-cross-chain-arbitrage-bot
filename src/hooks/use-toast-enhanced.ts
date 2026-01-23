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
      icon: <CheckCircle2 className="w-5 h-5" />,
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
      icon: <XCircle className="w-5 h-5" />,
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
      icon: <AlertCircle className="w-5 h-5" />,
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
      icon: <Info className="w-5 h-5" />,
      action: options?.action ? {
        label: options.action.label,
        onClick: options.action.onClick,
      } : undefined,
    })
  }

  const showLoading = (message: string, options?: ToastOptions) => {
    return toast.loading(message, {
      description: options?.description,
      icon: <Loader2 className="w-5 h-5 animate-spin" />,
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
    return toast.promise(promise, {
      loading: {
        title: messages.loading,
        description: options?.description,
        icon: <Loader2 className="w-5 h-5 animate-spin" />,
      },
      success: {
        title: typeof messages.success === "function" ? messages.success : messages.success,
        description: options?.description,
        icon: <CheckCircle2 className="w-5 h-5" />,
        duration: options?.duration || 4000,
      },
      error: {
        title: typeof messages.error === "function" ? messages.error : messages.error,
        description: options?.description,
        icon: <XCircle className="w-5 h-5" />,
        duration: options?.duration || 6000,
      },
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
