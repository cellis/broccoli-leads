export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Broccoli Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Client Management</h2>
            <p className="text-gray-600">
              Manage and configure your clients from this dashboard.
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Workflow Status</h2>
            <p className="text-gray-600">
              Monitor Temporal workflows and job scheduling.
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Configuration</h2>
            <p className="text-gray-600">
              Configure system settings and preferences.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}


