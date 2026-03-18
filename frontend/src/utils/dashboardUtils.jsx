import axios from 'axios';

import { API_URL } from '../config/api';
const API_BASE_URL = API_URL;

/**
 * Fetch dashboard stats for a specific module
 * @param {string} module - Module name (e.g., 'tenants', 'properties', 'assets')
 * @returns {Promise<Object>} Dashboard stats data
 */
export const fetchModuleStats = async (module) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/${module}/stats`);
    return response.data.data;
  } catch (error) {
    console.error(`Error fetching ${module} stats:`, error);
    return null;
  }
};

/**
 * Export dashboard data to Excel
 * @param {Object} data - Dashboard data to export
 * @param {string} filename - Export filename
 */
export const exportToExcel = (data, filename = 'dashboard-export.xlsx') => {
  // Create CSV content from data
  const csvContent = convertToCSV(data);
  
  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename.replace('.xlsx', '.csv'));
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Export dashboard data to PDF
 * @param {Object} data - Dashboard data to export
 * @param {string} filename - Export filename
 */
export const exportToPDF = (data, filename = 'dashboard-export.pdf') => {
  // For now, we'll use window.print() as a simple PDF export
  // In production, you'd use a library like jsPDF or pdfmake
  window.print();
};

/**
 * Convert data object to CSV format
 * @param {Object} data - Data to convert
 * @returns {string} CSV formatted string
 */
const convertToCSV = (data) => {
  let csv = '';
  
  // Add KPIs section
  if (data.kpis) {
    csv += 'Key Performance Indicators\n';
    csv += 'Metric,Value\n';
    Object.entries(data.kpis).forEach(([key, value]) => {
      csv += `${formatKey(key)},${value}\n`;
    });
    csv += '\n';
  }
  
  // Add chart data sections
  Object.entries(data).forEach(([key, value]) => {
    if (key !== 'kpis' && Array.isArray(value)) {
      csv += `\n${formatKey(key)}\n`;
      
      if (value.length > 0) {
        // Get headers from first object
        const headers = Object.keys(value[0]);
        csv += headers.map(h => formatKey(h)).join(',') + '\n';
        
        // Add data rows
        value.forEach(item => {
          csv += headers.map(h => item[h]).join(',') + '\n';
        });
      }
    }
  });
  
  return csv;
};

/**
 * Format camelCase or snake_case keys to Title Case
 * @param {string} key - Key to format
 * @returns {string} Formatted key
 */
const formatKey = (key) => {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/^./, str => str.toUpperCase())
    .trim();
};

/**
 * Render chart content based on chart type and data
 * @param {string} chartType - Type of chart (bar, line, pie, etc.)
 * @param {Array} data - Chart data
 * @param {Object} options - Chart options
 * @returns {JSX.Element} Chart component
 */
export const renderChart = (chartType, data, options = {}) => {
  switch (chartType) {
    case 'bar':
      return renderBarChart(data, options);
    case 'progress':
      return renderProgressBars(data, options);
    case 'list':
      return renderList(data, options);
    default:
      return null;
  }
};

const renderBarChart = (data, options) => {
  return (
    <div style={{ padding: '20px 0' }}>
      {data.map((item, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '120px 1fr 80px', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ fontSize: '14px', fontWeight: '500' }}>{item.label || item.name}</div>
          <div style={{ height: '28px', background: '#F5F5F5', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ 
              height: '100%', 
              width: `${item.percentage || (item.value / options.max * 100)}%`, 
              background: options.colors?.[i] || '#0572CE',
              display: 'flex',
              alignItems: 'center',
              padding: '0 8px'
            }}>
              <span style={{ fontSize: '12px', color: 'white', fontWeight: '600' }}>{item.value || item.count}</span>
            </div>
          </div>
          <div style={{ fontSize: '14px', fontWeight: '600', textAlign: 'right' }}>
            {item.percentage ? `${item.percentage}%` : item.value}
          </div>
        </div>
      ))}
    </div>
  );
};

const renderProgressBars = (data, options) => {
  return renderBarChart(data, options);
};

const renderList = (data, options) => {
  return (
    <div style={{ padding: '20px 0' }}>
      {data.map((item, i) => (
        <div key={i} style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          padding: '8px 0', 
          borderBottom: i < data.length - 1 ? '1px solid #E0E0E0' : 'none' 
        }}>
          <span style={{ fontSize: '14px' }}>{item.label || item.name}</span>
          <span style={{ fontSize: '14px', fontWeight: '600', color: options.valueColor || '#0572CE' }}>
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
};

