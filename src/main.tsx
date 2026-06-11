import ReactDOM from 'react-dom/client';
import { HashRouter as Router } from 'react-router-dom';
import { Provider } from 'react-redux';
import App from './App';
import './css/style.css';
import './css/satoshi.css';
import 'jsvectormap/dist/css/jsvectormap.css';
import 'flatpickr/dist/flatpickr.min.css';
import { store } from './redux/store';
import { ToastContainer, Flip } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; // Import the CSS for react-toastify

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <Provider store={store}>
    <Router>
      <ToastContainer
        position="top-right" // Position the toast notifications to the top-right of the screen
        autoClose={5000} // Automatically close toasts after 5 seconds
        hideProgressBar={false} // Show a progress bar indicating when the toast will close
        newestOnTop={true} // Newest toast appears on top of older ones
        closeOnClick // Allow toasts to be dismissed by clicking them
        rtl={false} // Disable right-to-left support
        pauseOnFocusLoss // Pause autoClose timer when the window loses focus
        draggable // Allow toasts to be dragged
        pauseOnHover // Pause autoClose timer when hovering over a toast
        theme="light" // Use the light theme for toasts
        transition={Flip} // Add a flip transition effect for toasts
      />
      <App />
    </Router>
  </Provider>,
);
