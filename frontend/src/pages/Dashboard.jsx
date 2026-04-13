import Layout from '../components/Layout';

const stats = [
  { label: 'Active projects', value: '12' },
  { label: 'Upcoming events', value: '8' },
  { label: 'Participating students', value: '146' },
  { label: 'Tracked clubs', value: '7' },
];

function Dashboard() {
  return (
    <Layout
      title="Dashboard"
      subtitle="A first overview of projects, clubs, events, and engagement indicators."
    >
      <div className="stats-grid">
        {stats.map((stat) => (
          <article key={stat.label} className="stat-card">
            <span>{stat.label}</span>
            <strong>{stat.value}</strong>
          </article>
        ))}
      </div>
    </Layout>
  );
}

export default Dashboard;
