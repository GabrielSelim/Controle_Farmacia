import { createContext, useContext, useState, useCallback } from 'react';

const ConfirmDialogContext = createContext();

export const useConfirm = () => {
  const context = useContext(ConfirmDialogContext);
  if (!context) {
    throw new Error('useConfirm must be used within ConfirmDialogProvider');
  }
  return context;
};

export const ConfirmDialogProvider = ({ children }) => {
  const [dialog, setDialog] = useState(null);

  const confirm = useCallback((options) => {
    return new Promise((resolve) => {
      setDialog({
        title: options.title || 'Confirmar ação',
        message: options.message || 'Deseja continuar?',
        confirmText: options.confirmText || 'Confirmar',
        cancelText: options.cancelText || 'Cancelar',
        confirmColor: options.confirmColor || 'red',
        onConfirm: () => {
          setDialog(null);
          resolve(true);
        },
        onCancel: () => {
          setDialog(null);
          resolve(false);
        }
      });
    });
  }, []);

  return (
    <ConfirmDialogContext.Provider value={{ confirm }}>
      {children}
      {dialog && <ConfirmDialog {...dialog} />}
    </ConfirmDialogContext.Provider>
  );
};

const ConfirmDialog = ({ title, message, confirmText, cancelText, confirmColor, onConfirm, onCancel }) => {
  const colorClasses = {
    red: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
    blue: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
    green: 'bg-green-600 hover:bg-green-700 focus:ring-green-500',
    yellow: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onCancel}
      />
      
      {/* Dialog */}
      <div className="flex min-h-full items-center justify-center p-2 sm:p-4">
        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md animate-scale-in">
          {/* Header */}
          <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className={`flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center ${
                confirmColor === 'red' ? 'bg-red-100' :
                confirmColor === 'blue' ? 'bg-blue-100' :
                confirmColor === 'green' ? 'bg-green-100' :
                'bg-yellow-100'
              }`}>
                {confirmColor === 'red' && (
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                )}
                {confirmColor === 'blue' && (
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                {confirmColor === 'green' && (
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                {confirmColor === 'yellow' && (
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                  {title}
                </h3>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="px-4 sm:px-6 pb-4 sm:pb-6">
            <p className="text-sm sm:text-base text-gray-600">
              {message}
            </p>
          </div>

          {/* Footer */}
          <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gray-50 rounded-b-lg flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 sm:justify-end">
            <button
              onClick={onCancel}
              className="px-4 py-2 min-h-[44px] text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`px-4 py-2 min-h-[44px] text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${colorClasses[confirmColor]}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
