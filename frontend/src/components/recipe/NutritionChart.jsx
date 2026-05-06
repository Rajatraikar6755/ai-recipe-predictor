import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function NutritionChart({ nutrition }) {
  if (!nutrition || nutrition.calories === 0) {
    return (
      <div className="text-center py-8 text-dark-500">
        <span className="text-3xl block mb-2">📊</span>
        Nutrition data not available.
      </div>
    );
  }

  const { calories, protein, carbohydrates, fat, fiber, sugar, sodium } = nutrition;

  // Macros doughnut chart
  const macroData = {
    labels: ['Protein', 'Carbohydrates', 'Fat'],
    datasets: [{
      data: [protein * 4, carbohydrates * 4, fat * 9], // Convert to calories
      backgroundColor: ['rgba(34, 197, 94, 0.8)', 'rgba(251, 191, 36, 0.8)', 'rgba(239, 68, 68, 0.8)'],
      borderColor: ['#22c55e', '#fbbf24', '#ef4444'],
      borderWidth: 2,
    }],
  };

  const macroOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: '#94a3b8', padding: 15, font: { size: 12 } },
      },
      tooltip: {
        callbacks: {
          label: (ctx) => ` ${ctx.label}: ${Math.round(ctx.raw)} cal`,
        },
      },
    },
    cutout: '60%',
  };

  // Nutrients bar chart
  const nutrientData = {
    labels: ['Protein', 'Carbs', 'Fat', 'Fiber', 'Sugar'],
    datasets: [{
      label: 'Grams',
      data: [protein, carbohydrates, fat, fiber, sugar],
      backgroundColor: [
        'rgba(34, 197, 94, 0.6)',
        'rgba(251, 191, 36, 0.6)',
        'rgba(239, 68, 68, 0.6)',
        'rgba(59, 130, 246, 0.6)',
        'rgba(168, 85, 247, 0.6)',
      ],
      borderRadius: 6,
    }],
  };

  const barOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => ` ${ctx.raw}g`,
        },
      },
    },
    scales: {
      y: {
        ticks: { color: '#64748b', font: { size: 11 } },
        grid: { color: 'rgba(51, 65, 85, 0.5)' },
      },
      x: {
        ticks: { color: '#94a3b8', font: { size: 12 } },
        grid: { display: false },
      },
    },
  };

  return (
    <div className="space-y-6">
      {/* Calorie highlight */}
      <div className="flex items-center justify-center">
        <div className="text-center bg-gradient-to-br from-primary-500/10 to-accent-500/10 border border-primary-500/20 rounded-2xl px-8 py-4">
          <div className="text-4xl font-display font-bold text-white">{calories}</div>
          <div className="text-dark-400 text-sm">Calories per serving</div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Macro distribution */}
        <div>
          <h4 className="text-sm font-medium text-dark-400 mb-3 text-center">Macro Distribution</h4>
          <div className="h-44">
            <Doughnut data={macroData} options={macroOptions} />
          </div>
        </div>

        {/* Nutrient breakdown bars */}
        <div>
          <h4 className="text-sm font-medium text-dark-400 mb-3 text-center">Nutrient Breakdown</h4>
          <div className="h-44">
            <Bar data={nutrientData} options={barOptions} />
          </div>
        </div>
      </div>

      {/* Detailed stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Protein', value: protein, unit: 'g', color: 'text-primary-400' },
          { label: 'Carbs', value: carbohydrates, unit: 'g', color: 'text-accent-400' },
          { label: 'Fat', value: fat, unit: 'g', color: 'text-red-400' },
          { label: 'Fiber', value: fiber, unit: 'g', color: 'text-blue-400' },
          { label: 'Sugar', value: sugar, unit: 'g', color: 'text-purple-400' },
          { label: 'Sodium', value: sodium, unit: 'mg', color: 'text-orange-400' },
        ].map((stat) => (
          <div key={stat.label} className="bg-dark-800/50 rounded-xl p-3 text-center">
            <div className={`text-xl font-bold ${stat.color}`}>{stat.value}{stat.unit}</div>
            <div className="text-dark-500 text-xs mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
