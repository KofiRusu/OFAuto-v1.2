'use client';

import { useEffect, useState } from 'react';
import { 
  Chart as ChartJS, 
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions,
  ChartData
} from 'chart.js';
import { Bar, Doughnut, Line, Pie } from 'react-chartjs-2';
import { Loader2 } from 'lucide-react';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Dynamic import types
type ChartType = 'line' | 'bar' | 'pie' | 'doughnut';

interface ChartProps {
  type: ChartType;
  data: ChartData<any, any, any>;
  options?: ChartOptions<any>;
  height?: number;
  width?: number;
}

export function Chart({ 
  type, 
  data, 
  options = {}, 
  height,
  width
}: ChartProps) {
  const [mounted, setMounted] = useState(false);
  
  // Handle client-side rendering with useEffect
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Default chart options merged with passed options
  const defaultOptions: ChartOptions<ChartType> = {
    responsive: true,
    maintainAspectRatio: true,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
          boxWidth: 6,
        },
      },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(0, 0, 0, 0.1)',
        borderWidth: 1,
        padding: 10,
        displayColors: true,
        boxWidth: 10,
        boxHeight: 10,
        usePointStyle: true,
      },
    },
    scales: type === 'line' || type === 'bar' ? {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45,
        },
      },
      y: {
        grid: {
          display: true,
          drawBorder: false,
        },
        ticks: {
          padding: 10,
        },
        beginAtZero: true,
      },
    } : undefined,
  };
  
  const mergedOptions = { 
    ...defaultOptions,
    ...options,
  };
  
  // Show loading spinner until mounted
  if (!mounted) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  // Render appropriate chart based on type
  switch (type) {
    case 'line':
      return <Line data={data} options={mergedOptions} height={height} width={width} />;
    case 'bar':
      return <Bar data={data} options={mergedOptions} height={height} width={width} />;
    case 'pie':
      return <Pie data={data} options={mergedOptions} height={height} width={width} />;
    case 'doughnut':
      return <Doughnut data={data} options={mergedOptions} height={height} width={width} />;
    default:
      return <Line data={data} options={mergedOptions} height={height} width={width} />;
  }
} 