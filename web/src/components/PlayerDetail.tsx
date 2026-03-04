import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import type { Player } from "../types/player";

interface PlayerDetailProps {
  player: Player;
  allPlayers: Player[];
  onClose: () => void;
}

function getPeleLabel(score: number): string {
  if (score >= 70) return "Elite";
  if (score >= 60) return "Very Good";
  if (score >= 50) return "Average";
  if (score >= 40) return "Below Average";
  return "Poor";
}

function calcPercentile(
  allPlayers: Player[],
  stat: keyof Player,
  value: number,
  lowerIsBetter = false
): number {
  const values = allPlayers.map((p) => p[stat] as number);
  const below = values.filter((v) => (lowerIsBetter ? v > value : v < value)).length;
  return Math.round((below / values.length) * 100);
}

function calcCombinedPercentile(
  allPlayers: Player[],
  stat1: keyof Player,
  stat2: keyof Player,
  value: number
): number {
  const values = allPlayers.map((p) => (p[stat1] as number) + (p[stat2] as number));
  const below = values.filter((v) => v < value).length;
  return Math.round((below / values.length) * 100);
}

function getPercentileStyle(pct: number): { bg: string; text: string } {
  if (pct >= 90) return { bg: "bg-green-100", text: "text-green-700" };
  if (pct >= 75) return { bg: "bg-green-50", text: "text-green-600" };
  if (pct >= 50) return { bg: "bg-blue-50", text: "text-blue-600" };
  if (pct >= 25) return { bg: "bg-orange-50", text: "text-orange-500" };
  return { bg: "bg-red-50", text: "text-red-500" };
}

export function PlayerDetail({ player, allPlayers, onClose }: PlayerDetailProps) {
  const playerSeasons = allPlayers
    .filter((p) => p.player_id === player.player_id)
    .sort((a, b) => a.season.localeCompare(b.season));

  const seasonTrendData = playerSeasons.map((p) => ({
    season: p.season.replace("-20", "/"),
    PELE: parseFloat(p.pele_100.toFixed(1)),
    OC: parseFloat(p.oc.toFixed(2)),
    DC: parseFloat(p.dc.toFixed(2)),
    team: p.team_id,
  }));

  // Custom X-axis tick: season label + club name below
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const SeasonTick = ({ x, y, payload }: any) => {
    const entry = seasonTrendData.find((d) => d.season === payload?.value);
    return (
      <g transform={`translate(${x},${y})`}>
        <text x={0} y={0} dy={16} textAnchor="middle" fill="#374151" fontSize={12}>
          {payload?.value}
        </text>
        {entry && (
          <text x={0} y={0} dy={30} textAnchor="middle" fill="#6b7280" fontSize={10}>
            {entry.team}
          </text>
        )}
      </g>
    );
  };

  // Percentile helper
  const pct = (stat: keyof Player, lowerIsBetter = false) =>
    calcPercentile(allPlayers, stat, player[stat] as number, lowerIsBetter);

  // Real percentile-based radar data
  const progValue = player.progressive_passes_p90 + player.progressive_carries_p90;
  const radarData = [
    { stat: "Goals", value: pct("np_goals_p90"), fullMark: 100 },
    { stat: "Assists", value: pct("assists_p90"), fullMark: 100 },
    { stat: "xG", value: pct("xg_p90"), fullMark: 100 },
    { stat: "Key Passes", value: pct("key_passes_p90"), fullMark: 100 },
    {
      stat: "Prog. Actions",
      value: calcCombinedPercentile(allPlayers, "progressive_passes_p90", "progressive_carries_p90", progValue),
      fullMark: 100,
    },
    { stat: "Tackles", value: pct("tackles_p90"), fullMark: 100 },
    { stat: "Interceptions", value: pct("interceptions_p90"), fullMark: 100 },
    { stat: "Aerials", value: pct("aerials_won_p90"), fullMark: 100 },
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
          {/* Season History */}
          {seasonTrendData.length > 1 && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold mb-4">Season History</h3>
              <ResponsiveContainer width="100%" height={290}>
                <LineChart data={seasonTrendData} margin={{ top: 5, right: 30, left: 0, bottom: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="season" tick={<SeasonTick />} height={50} />
                  <YAxis yAxisId="pele" domain={[0, 100]} tick={{ fontSize: 12 }} label={{ value: "PELE", angle: -90, position: "insideLeft", style: { fontSize: 11 } }} />
                  <YAxis yAxisId="components" orientation="right" tick={{ fontSize: 12 }} label={{ value: "OC / DC", angle: 90, position: "insideRight", style: { fontSize: 11 } }} />
                  <Tooltip
                    formatter={(value: number, name: string) => [value, name]}
                    labelFormatter={(label) => {
                      const entry = seasonTrendData.find((d) => d.season === label);
                      return entry ? `${label} — ${entry.team}` : label;
                    }}
                  />
                  <Legend />
                  <Line yAxisId="pele" type="monotone" dataKey="PELE" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  <Line yAxisId="components" type="monotone" dataKey="OC" stroke="#f59e0b" strokeWidth={1.5} dot={{ r: 3 }} strokeDasharray="4 2" />
                  <Line yAxisId="components" type="monotone" dataKey="DC" stroke="#16a34a" strokeWidth={1.5} dot={{ r: 3 }} strokeDasharray="4 2" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Radar Chart */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-1">Performance Profile</h3>
              <p className="text-xs text-gray-400 mb-3">Percentile rank vs all players</p>
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
                  <Tooltip formatter={(value: number) => [`${value}th percentile`]} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Stats Grid */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-lg font-semibold">Detailed Stats (per 90)</h3>
              </div>
              <div className="flex gap-3 mb-4 text-xs">
                <span className="px-2 py-0.5 rounded bg-green-100 text-green-700">≥90th</span>
                <span className="px-2 py-0.5 rounded bg-green-50 text-green-600">≥75th</span>
                <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-600">≥50th</span>
                <span className="px-2 py-0.5 rounded bg-orange-50 text-orange-500">≥25th</span>
                <span className="px-2 py-0.5 rounded bg-red-50 text-red-500">&lt;25th</span>
              </div>

              {/* Component Breakdown */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-blue-700">
                    {player.oc.toFixed(2)}
                  </div>
                  <div className="text-sm text-blue-600">Offensive Component</div>
                  <div className="text-xs text-blue-400">{pct("oc")}th percentile</div>
                </div>
                <div className="bg-green-50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-green-700">
                    {player.dc.toFixed(2)}
                  </div>
                  <div className="text-sm text-green-600">Defensive Component</div>
                  <div className="text-xs text-green-400">{pct("dc")}th percentile</div>
                </div>
              </div>

              {/* Offensive Stats */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-500 uppercase mb-2">Attacking</h4>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <StatItem label="Goals" value={player.np_goals_p90} percentile={pct("np_goals_p90")} />
                  <StatItem label="Penalties" value={player.penalty_goals_p90} percentile={pct("penalty_goals_p90")} />
                  <StatItem label="Assists" value={player.assists_p90} percentile={pct("assists_p90")} />
                  <StatItem label="xG" value={player.xg_p90} percentile={pct("xg_p90")} />
                  <StatItem label="xA" value={player.xa_p90} percentile={pct("xa_p90")} />
                  <StatItem label="Key Passes" value={player.key_passes_p90} percentile={pct("key_passes_p90")} />
                  <StatItem label="Shots" value={player.shots_p90} percentile={pct("shots_p90")} />
                  <StatItem label="On Target" value={player.shots_on_target_p90} percentile={pct("shots_on_target_p90")} />
                  <StatItem label="Dribbles" value={player.successful_dribbles_p90} percentile={pct("successful_dribbles_p90")} />
                </div>
              </div>

              {/* Progression Stats */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-500 uppercase mb-2">Progression</h4>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <StatItem label="Prog. Passes" value={player.progressive_passes_p90} percentile={pct("progressive_passes_p90")} />
                  <StatItem label="Prog. Carries" value={player.progressive_carries_p90} percentile={pct("progressive_carries_p90")} />
                  <StatItem label="Prog. Receives" value={player.progressive_receives_p90} percentile={pct("progressive_receives_p90")} />
                  <StatItem label="Final 3rd" value={player.passes_into_final_third_p90} percentile={pct("passes_into_final_third_p90")} />
                  <StatItem label="Turnovers" value={player.turnovers_p90} percentile={pct("turnovers_p90", true)} />
                </div>
              </div>

              {/* Defensive Stats */}
              <div>
                <h4 className="text-sm font-medium text-gray-500 uppercase mb-2">Defensive</h4>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <StatItem label="Tackles" value={player.tackles_p90} percentile={pct("tackles_p90")} />
                  <StatItem label="Interceptions" value={player.interceptions_p90} percentile={pct("interceptions_p90")} />
                  <StatItem label="Blocks" value={player.blocks_p90} percentile={pct("blocks_p90")} />
                  <StatItem label="Aerials Won" value={player.aerials_won_p90} percentile={pct("aerials_won_p90")} />
                  <StatItem label="Tkl Def 3rd" value={player.tackles_def_third_p90} percentile={pct("tackles_def_third_p90")} />
                  <StatItem label="Tkl Mid 3rd" value={player.tackles_mid_third_p90} percentile={pct("tackles_mid_third_p90")} />
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
  percentile,
}: {
  label: string;
  value: number;
  percentile: number;
}) {
  const { bg, text } = getPercentileStyle(percentile);
  return (
    <div className={`${bg} rounded px-2 py-1`}>
      <div className={`font-semibold ${text}`}>{value.toFixed(2)}</div>
      <div className="text-xs text-gray-500">{label}</div>
      <div className={`text-xs ${text} opacity-75`}>{percentile}th</div>
    </div>
  );
}
