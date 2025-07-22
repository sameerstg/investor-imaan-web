'use client';
import React from 'react';
import DOMPurify from 'dompurify';

interface CompanyReport {
  tableHtml: string;
}

interface FinancialReportsProps {
  reports: CompanyReport | null;
}

const FinancialReports: React.FC<FinancialReportsProps> = ({ reports }) => {
  if (!reports || !reports?.tableHtml) {
    return (
      <div className="mt-6 p-4 bg-red-100 text-red-700 rounded">
        No financial reports available.
      </div>
    );
  }

  // Sanitize the HTML to prevent XSS attacks
  const sanitizedHtml = DOMPurify.sanitize(reports?.tableHtml);

  return (
    <div className="mt-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">Financial Reports</h2>
      <div
        className="overflow-x-auto"
        dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
      />
    </div>
  );
};

export default FinancialReports;