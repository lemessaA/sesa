import { toast, ToastOptions } from 'react-toastify';

const defaultOptions: ToastOptions = {
    position: 'top-right',
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
};

export const showSuccess = (message: string, options?: ToastOptions) => {
    toast.success(message, { ...defaultOptions, ...options });
};

export const showError = (message: string, options?: ToastOptions) => {
    toast.error(message, { ...defaultOptions, ...options });
};

export const showInfo = (message: string, options?: ToastOptions) => {
    toast.info(message, { ...defaultOptions, ...options });
};

export const showWarning = (message: string, options?: ToastOptions) => {
    toast.warn(message, { ...defaultOptions, ...options });
};

export const showLoading = (message: string) => {
    return toast.loading(message);
};

export const updateToast = (toastId: any, type: 'success' | 'error' | 'info' | 'warning', message: string) => {
    toast.update(toastId, {
        render: message,
        type,
        isLoading: false,
        autoClose: 3000,
    });
};
