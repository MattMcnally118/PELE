import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { Player } from "../types/player";

interface PlayerDetailProps {
  player: Player;
  onClose: () => void;
}

function getPeleLabel(score: number): string {
  if (score >= 70) return "Elite";
  if (score >= 60) return "Very Good";
  if (score >= 50) return "Average";
  if (score >= 40) return "Below Average";
  return "Poor";
}

export function PlayerDetail({ player, onClose }: PlayerDetailProps) {
  // Normalize stats to 0-100 scale for radar chart
  // Using rough percentile estimates based on typical ranges
  const radarData = [
    {
      stat: "Goals",
      value: Math.min(100, player.np_goals_p90 * 100),
      fullMark: 100,
    },
    {
      stat: "Assists",
      value: Math.min(100, player.assists_p90 * 150),
      fullMark: 100,
    },
    {
      stat: "xG",
      value: Math.min(100, player.xg_p90 * 100),
      fullMark: 100,
    },
    {
      stat: "Key Passes",
      value: Math.min(100, player.key_passes_p90 * 25),
      fullMark: 100,
    },
    {
      stat: "Prog. Actions",
      value: Math.min(
        100,
        (player.progressive_passes_p90 + player.progressive_carries_p90) * 5
      ),
      fullMark: 100,
    },
    {
      stat: "Tackles",
      value: Math.min(100, player.tackles_p90 * 25),
      fullMark: 100,
    },
    {
      stat: "Interceptions",
      value: Math.min(100, player.interceptions_p90 * 40),
      fullMark: 100,
    },
    {
      stat: "Aerials",
      value: Math.min(100, player.aerials_won_p90 * 20),
      fullMark: 100,
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 rounded-t-xl">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold">{player.player_name}</h2>
              <p className="text-blue-200">
                {player.team_id} | {player.season}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white text-2xl"
            >
              ×
            </button>
          </div>
          <div className="mt-4 flex items-center gap-6">
            <div className="bg-white/20 rounded-lg px-4 py-2">
              <div className="text-3xl font-bold">
                {player.pele_100.toFixed(1)}
              </div>
              <div className="text-xs uppercase tracking-wide">PELE Score</div>
            </div>
            <div className="bg-white/10 rounded-lg px-4 py-2">
              <div className="text-xl font-semibold">
                {getPeleLabel(player.pele_100)}
              </div>
              <div className="text-xs uppercase tracking-wide">Rating</div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Radar Chart */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4">Performance Profile</h3>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="stat" tick={{ fontSize: 12 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
                  <Radar
                    name={player.player_name}
                    dataKey="value"
                    stroke="#2563eb"
                    fill="#3b82f6"
                    fillOpacity={0.5}
                  />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Stats Grid */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Detailed Stats (per 90)</h3>

              {/* Component Breakdown */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-blue-700">
                    {player.oc.toFixed(2)}
                  </div>
                  <div className="text-sm text-blue-600">
                    Offensive Component
                  </div>
                </div>
                <div className="bg-green-50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-green-700">
                    {player.dc.toFixed(2)}
                  </div>
                  <div className="text-sm text-green-600">
                    Defensive Component
                  </div>
                </div>
              </div>

              {/* Offensive Stats */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-500 uppercase mb-2">
                  Attacking
                </h4>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <StatItem label="Goals" value={player.np_goals_p90} />
                  <StatItem label="Penalties" value={player.penalty_goals_p90} />
                  <StatItem label="Assists" value={player.assists_p90} />
                  <StatItem label="xG" value={player.xg_p90} />
                  <StatItem label="xA" value={player.xa_p90} />
                  <StatItem label="Key Passes" value={player.key_passes_p90} />
                  <StatItem label="Shots" value={player.shots_p90} />
                  <StatItem label="On Target" value={player.shots_on_target_p90} />
                  <StatItem label="Dribbles" value={player.successful_dribbles_p90} />
                </div>
              </div>

              {/* Progression Stats */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-500 uppercase mb-2">
                  Progression
                </h4>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <StatItem label="Prog. Passes" value={player.progressive_passes_p90} />
                  <StatItem label="Prog. Carries" value={player.progressive_carries_p90} />
                  <StatItem label="Prog. Receives" value={player.progressive_receives_p90} />
                  <StatItem label="Final 3rd" value={player.passes_into_final_third_p90} />
                  <StatItem label="Turnovers" value={player.turnovers_p90} negative />
                </div>
              </div>

              {/* Defensive Stats */}
              <div>
                <h4 className="text-sm font-medium text-gray-500 uppercase mb-2">
                  Defensive
                </h4>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <StatItem label="Tackles" value={player.tackles_p90} />
                  <StatItem label="Interceptions" value={player.interceptions_p90} />
                  <StatItem label="Blocks" value={player.blocks_p90} />
                  <StatItem label="Aerials Won" value={player.aerials_won_p90} />
                  <StatItem label="Tkl Def 3rd" value={player.tackles_def_third_p90} />
                  <StatItem label="Tkl Mid 3rd" value={player.tackles_mid_third_p90} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatItem({
  label,
  value,
  negative = false,
}: {
  label: string;
  value: number;
  negative?: boolean;
}) {
  return (
    <div className="bg-gray-100 rounded px-2 py-1">
      <div className={`font-semibold ${negative ? "text-red-600" : ""}`}>
        {value.toFixed(2)}
      </div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}
