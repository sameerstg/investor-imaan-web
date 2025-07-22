import React from 'react';

interface CompanyReport {
  reportType: string;
  periodEnded: string;
  postingDate: string;
}

interface FinancialReportsProps {
  reports: CompanyReport[];
}

const FinancialReports: React.FC<FinancialReportsProps> = ({ reports }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Financial Reports</h2>
      {reports.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">Reports</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">Period Ended</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">Posting Date</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report, index) => (
                <tr
                  key={index}
                  className={`border-t border-gray-200 hover:bg-gray-50 transition-colors duration-150 ${
                    index % 2 === 0 ? 'bg-white' : 'bg-gray-100'
                  }`}
                >
                  <td className="px-6 py-3 text-sm text-gray-600">{report.reportType}</td>
                  <td className="px-6 py-3 text-sm text-gray-600">
                    {report.reportType === 'Annual'
                      ? new Date(report.periodEnded).getFullYear()
                      : new Date(report.periodEnded).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                        })}
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-600">
                    {new Date(report.postingDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-gray-500 text-sm">Loading reports or no reports available.</p>
      )}
    </div>
  );
};

export default FinancialReports;