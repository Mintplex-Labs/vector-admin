import { ToastOptions, toast } from 'react-toastify';

// Additional Configs (opts)
// You can also pass valid ReactToast params to override the defaults.
// clear: false, // Will dismiss all visible toasts before rendering next toast
type IToastTypes = 'success' | 'error' | 'info' | 'warning' | 'default';
type IToastOptions = ToastOptions & {
  clear?: boolean;
};

const showToast = (
  message: string,
  type: IToastTypes = 'default',
  opts: IToastOptions = {}
) => {
  const options = {
    position: 'bottom-center',
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    ...opts,
  };

  if (opts?.clear === true) toast.dismiss();

  switch (type) {
    case 'success':
      toast.success(message, options as ToastOptions);
      break;
    case 'error':
      toast.error(message, options as ToastOptions);
      break;
    case 'info':
      toast.info(message, options as ToastOptions);
      break;
    case 'warning':
      toast.warn(message, options as ToastOptions);
      break;
    default:
      toast(message, options as ToastOptions);
  }
};

export default showToast;
