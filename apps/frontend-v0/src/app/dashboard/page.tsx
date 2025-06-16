export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-2">Active Campaigns</h2>
            <p className="text-3xl font-bold text-blue-600">12</p>
            <p className="text-sm text-gray-600 mt-2">
              Campaigns with status &ldquo;active&rdquo; or &ldquo;scheduled&rdquo;
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-2">Total Messages</h2>
            <p className="text-3xl font-bold text-green-600">1,234</p>
            <p className="text-sm text-gray-600 mt-2">
              Messages marked as &ldquo;sent&rdquo; or &ldquo;delivered&rdquo;
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-2">Engagement Rate</h2>
            <p className="text-3xl font-bold text-purple-600">68%</p>
            <p className="text-sm text-gray-600 mt-2">
              Average engagement across all campaigns
            </p>
          </div>
        </div>
        
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-gray-700">Campaign &ldquo;Welcome Series&rdquo; started</span>
              <span className="text-sm text-gray-500">2 hours ago</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-gray-700">New template &ldquo;Holiday Special&rdquo; created</span>
              <span className="text-sm text-gray-500">5 hours ago</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-gray-700">Campaign &ldquo;Flash Sale&rdquo; completed</span>
              <span className="text-sm text-gray-500">1 day ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}