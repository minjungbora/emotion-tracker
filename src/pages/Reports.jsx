import { useState } from 'react';
import WeeklyReport from '../components/WeeklyReport';
import MonthlyReport from '../components/MonthlyReport';
import './Reports.css';

export default function Reports() {
  const [activeTab, setActiveTab] = useState('weekly');

  return (
    <div className="reports-page">
      <header className="reports-header">
        <h1>리포트</h1>
        <div className="tab-buttons">
          <button
            className={`tab-button ${activeTab === 'weekly' ? 'active' : ''}`}
            onClick={() => setActiveTab('weekly')}
          >
            주간 리포트
          </button>
          <button
            className={`tab-button ${activeTab === 'monthly' ? 'active' : ''}`}
            onClick={() => setActiveTab('monthly')}
          >
            월간 리포트
          </button>
        </div>
      </header>

      <main className="reports-main">
        {activeTab === 'weekly' ? <WeeklyReport /> : <MonthlyReport />}
      </main>
    </div>
  );
}
