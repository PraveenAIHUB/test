import { useEffect } from 'react';
import '../styles/redwood-theme.css';

function DrillDownModal({ isOpen, onClose, title, data, columns }) {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px', maxHeight: '80vh', overflow: 'auto' }}>
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button className="modal-close" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <div className="modal-body">
          {data && data.length > 0 ? (
            <div className="rw-table-container">
              <table className="rw-table">
                <thead>
                  <tr>
                    {columns.map((col, index) => (
                      <th key={index}>{col.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {columns.map((col, colIndex) => (
                        <td key={colIndex}>
                          {col.render ? col.render(row[col.key], row) : row[col.key]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              No data available
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="rw-button rw-button-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .modal-content {
          background: white;
          border-radius: 8px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
          width: 100%;
          animation: modalSlideIn 0.3s ease-out;
        }

        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px;
          border-bottom: 1px solid #E0E0E0;
        }

        .modal-title {
          font-size: 20px;
          font-weight: 600;
          color: #212121;
          margin: 0;
        }

        .modal-close {
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
          color: #666;
          transition: color 0.2s;
        }

        .modal-close:hover {
          color: #212121;
        }

        .modal-body {
          padding: 24px;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding: 16px 24px;
          border-top: 1px solid #E0E0E0;
        }

        .rw-table-container {
          overflow-x: auto;
        }

        .rw-table {
          width: 100%;
          border-collapse: collapse;
        }

        .rw-table thead {
          background-color: #F5F5F5;
        }

        .rw-table th {
          padding: 12px;
          text-align: left;
          font-weight: 600;
          color: #424242;
          font-size: 14px;
          border-bottom: 2px solid #E0E0E0;
        }

        .rw-table td {
          padding: 12px;
          border-bottom: 1px solid #E0E0E0;
          font-size: 14px;
          color: #212121;
        }

        .rw-table tbody tr:hover {
          background-color: #FAFAFA;
        }
      `}</style>
    </div>
  );
}

export default DrillDownModal;

