'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string, email: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const userString = localStorage.getItem('user');
    if (!userString) {
      router.push('/login');
      return;
    }

    try {
      const userData = JSON.parse(userString);
      setUser(userData);
    } catch (error) {
      console.error('Failed to parse user data:', error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <span className="text-xl font-bold text-purple-600">OFAuto</span>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link href="/dashboard" className="border-purple-500 text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Dashboard
                </Link>
                <Link href="/dashboard/clients" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Clients
                </Link>
                <Link href="/dashboard/integrations" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Integrations
                </Link>
                <Link href="/dashboard/campaigns" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Campaigns
                </Link>
                <Link href="/dashboard/automations" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Automations
                </Link>
                <Link href="/dashboard/monitor" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Monitor
                </Link>
              </div>
            </div>
            <div className="flex items-center">
              <div className="ml-3 relative">
                <div className="flex items-center">
                  <span className="mr-2 text-sm text-gray-700">{user?.name}</span>
                  <button
                    onClick={handleLogout}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <div className="py-10">
        <header>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold leading-tight text-gray-900">Dashboard</h1>
          </div>
        </header>
        <main>
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div className="px-4 py-8 sm:px-0">
              <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-800">Overview</h2>
                  <span className="text-sm text-gray-500">Last 30 days</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                  <div className="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="text-sm text-gray-500 mb-1">Total Clients</div>
                    <div className="text-2xl font-semibold">2</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="text-sm text-gray-500 mb-1">Active Campaigns</div>
                    <div className="text-2xl font-semibold">1</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="text-sm text-gray-500 mb-1">Messages Sent</div>
                    <div className="text-2xl font-semibold">350</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="text-sm text-gray-500 mb-1">Response Rate</div>
                    <div className="text-2xl font-semibold">28.5%</div>
                  </div>
                </div>

                <div className="bg-purple-50 p-4 rounded-md border border-purple-200 mb-8">
                  <h3 className="font-medium text-purple-800 mb-2">Demo Environment</h3>
                  <p className="text-sm text-purple-700">
                    This is a demo environment. All data is pre-populated for demonstration purposes.
                    You can interact with most features, but changes will not be persisted between sessions.
                  </p>
                </div>

                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
                  <ul className="divide-y divide-gray-200">
                    <li className="py-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <span className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                            <span className="text-green-600 text-sm">✓</span>
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">Campaign &quot;Summer Promotion&quot; started</p>
                          <p className="text-sm text-gray-500">2 hours ago</p>
                        </div>
                      </div>
                    </li>
                    <li className="py-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <span className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-blue-600 text-sm">i</span>
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">New response from user @fan123</p>
                          <p className="text-sm text-gray-500">5 hours ago</p>
                        </div>
                      </div>
                    </li>
                    <li className="py-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <span className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                            <span className="text-purple-600 text-sm">+</span>
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">New client &quot;Fansly Client 1&quot; added</p>
                          <p className="text-sm text-gray-500">1 day ago</p>
                        </div>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
} 