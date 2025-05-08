import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-4xl w-full">
        <h1 className="text-3xl font-bold text-center mb-6">Welcome to OFAuto Demo</h1>
        
        <div className="mb-8">
          <p className="text-gray-600 mb-4">
            OFAuto is an automated direct message campaign tool for OnlyFans creators, enabling personalized messaging at scale.
          </p>
          <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
            <h2 className="text-lg font-semibold text-blue-700 mb-2">Demo Credentials</h2>
            <p className="mb-1"><span className="font-medium">Email:</span> demo@ofauto.test</p>
            <p><span className="font-medium">Password:</span> Password1!</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
            <h3 className="font-semibold mb-2">🚀 Campaign Management</h3>
            <p className="text-sm text-gray-600">Create and manage personalized message campaigns</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
            <h3 className="font-semibold mb-2">📊 Analytics Dashboard</h3>
            <p className="text-sm text-gray-600">Track performance and engagement metrics</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
            <h3 className="font-semibold mb-2">📝 Template Editor</h3>
            <p className="text-sm text-gray-600">Create message templates with personalization</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
            <h3 className="font-semibold mb-2">🔄 Automated Workflows</h3>
            <p className="text-sm text-gray-600">Set up triggers and actions for automation</p>
          </div>
        </div>
        
        <div className="flex justify-center">
          <Link href="/login" className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-6 rounded-md shadow-md transition-colors">
            Login to Demo
          </Link>
        </div>
      </div>
    </div>
  );
} 