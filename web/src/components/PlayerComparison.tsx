import { useState, useRef, useEffect } from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import type { Player } from "../types/player";

interface PlayerComparisonProps {
  allPlayers: Player[];
}

const COLORS = ["#2563eb", "#dc2626", "#16a34a"];

export function PlayerComparison({ allPlayers }: PlayerComparisonProps) {
  const [comparePlayers, setComparePlayers] = useState<Player[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const searchResults =
    searchTerm.trim() === "" || comparePlayers.length >= 3
      ? []
      : allPlayers
          .filter((p) =>
            p.player_name.toLowerCase().includes(searchTerm.toLowerCase())
          )
          .sort((a, b) => b.pele_100 - a.pele_100)
          .slice(0, 10);

  const handleAdd = (player: Player) => {
    const alreadyExists = comparePlayers.some(
      (p) => p.player_id === player.player_id && p.season === player.season
    );
    if (!alreadyExists && comparePlayers.length < 3) {
      setComparePlayers([...comparePlayers, player]);
    }
    setSearchTerm("");
    setShowResults(false);
  };

  const handleRemove = (player: Player) => {
    setComparePlayers(
      comparePlayers.filter(
        (p) =>
          !(p.player_id === player.player_id && p.season === player.season)
      )
    );
  };

  const handleClearAll = () => setComparePlayers([]);

  const radarData =
    comparePlayers.length > 0
      ? [
          { stat: "Goals", ...getStatValues(comparePlayers, "np_goals_p90", 100) },
          { stat: "Assists", ...getStatValues(comparePlayers, "assists_p90", 150) },
          { stat: "xG", ...getStatValues(comparePlayers, "xg_p90", 100) },
          { stat: "Key Passes", ...getStatValues(comparePlayers, "key_passes_p90", 25) },
          { stat: "Prog. Actions", ...getProgValues(comparePlayers) },
          { stat: "Tackles", ...getStatValues(comparePlayers, "tackles_p90", 25) },
          { stat: "Interceptions", ...getStatValues(comparePlayers, "interceptions_p90", 40) },
          { stat: "Aerials", ...getStatValues(comparePlayers, "aerials_won_p90", 20) },
        ]
      : [];

  return (
    <div className="space-y-6">
      {/* Search Input */}
      <div className="bg-white rounded-lg shadow p-4" ref={searchRef}>
        <h2 className="text-lg font-semibold mb-3">Compare Players</h2>

        {/* Chips */}
        {comparePlayers.length > 0 && (
          <div className="flex flex-wrap gap-3 mb-3">
            {comparePlayers.map((player, idx) => (
              <div
                key={`${player.player_id}-${player.season}`}
                className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2"
                style={{ borderLeft: `4px solid ${COLORS[idx]}` }}
              >
                <div>
                  <div className="font-medium text-sm">{player.player_name}</div>
                  <div className="text-xs text-gray-500">
                    {player.team_id} | {player.season}
                  </div>
                </div>
                <button
                  onClick={() => handleRemove(player)}
                  className="text-gray-400 hover:text-red-500 ml-1 text-lg leading-none"
                >
                  ×
                </button>
              </div>
            ))}
            <button
              onClick={handleClearAll}
              className="text-sm text-red-600 hover:text-red-700 self-center"
            >
              Clear All
            </button>
          </div>
        )}

        {/* Search box */}
        {comparePlayers.length < 3 ? (
          <div className="relative">
            <input
              type="text"
              placeholder="Search for a player to add..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowResults(true);
              }}
              onFocus={() => setShowResults(true)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {showResults && searchResults.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                {searchResults.map((player) => {
                  const alreadyAdded = comparePlayers.some(
                    (p) =>
                      p.player_id === player.player_id &&
                      p.season === player.season
                  );
                  return (
                    <div
                      key={`${player.player_id}-${player.season}`}
                      className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-0"
                    >
                      <div>
                        <div className="text-sm font-medium">
                          {player.player_name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {player.team_id} · {player.season} · PELE{" "}
                          <span className="font-medium text-blue-600">
                            {player.pele_100.toFixed(1)}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleAdd(player)}
                        disabled={alreadyAdded}
                        className={`text-xs px-2 py-1 rounded ml-3 ${
                          alreadyAdded
                            ? "text-gray-400 bg-gray-100 cursor-not-allowed"
                            : "text-white bg-blue-600 hover:bg-blue-700"
                        }`}
                      >
                        {alreadyAdded ? "Added" : "Add"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            Maximum 3 players selected. Remove a player to add another.
          </p>
        )}
      </div>

      {/* Comparison Content */}
      {comparePlayers.length === 0 && (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="text-gray-300 text-6xl mb-4">⚖️</div>
          <p className="text-gray-500">
            Search for players above to compare them side by side.
          </p>
        </div>
      )}

      {comparePlayers.length > 0 && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Radar Chart */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Performance Comparison</h3>
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="stat" tick={{ fontSize: 11 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
                  {comparePlayers.map((player, idx) => (
                    <Radar
                      key={`${player.player_id}-${player.season}`}
                      name={player.player_name}
                      dataKey={`player${idx}`}
                      stroke={COLORS[idx]}
                      fill={COLORS[idx]}
                      fillOpacity={0.2}
                    />
                  ))}
                  <Legend />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Stats Table */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Stats Comparison</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-1">Stat</th>
                      {comparePlayers.map((player, idx) => (
                        <th
                          key={`${player.player_id}-${player.season}`}
                          className="text-right py-2 px-2"
                          style={{ color: COLORS[idx] }}
                        >
                          {player.player_name.split(" ").pop()}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <CompareRow label="PELE Score" players={comparePlayers} stat="pele_100" highlight />
                    <CompareRow label="Offensive (OC)" players={comparePlayers} stat="oc" />
                    <CompareRow label="Defensive (DC)" players={comparePlayers} stat="dc" />
                    <tr className="h-2" />
                    <CompareRow label="Goals/90" players={comparePlayers} stat="np_goals_p90" />
                    <CompareRow label="Assists/90" players={comparePlayers} stat="assists_p90" />
                    <CompareRow label="xG/90" players={comparePlayers} stat="xg_p90" />
                    <CompareRow label="xA/90" players={comparePlayers} stat="xa_p90" />
                    <CompareRow label="Key Passes/90" players={comparePlayers} stat="key_passes_p90" />
                    <CompareRow label="Shots/90" players={comparePlayers} stat="shots_p90" />
                    <tr className="h-2" />
                    <CompareRow label="Tackles/90" players={comparePlayers} stat="tackles_p90" />
                    <CompareRow label="Interceptions/90" players={comparePlayers} stat="interceptions_p90" />
                    <CompareRow label="Blocks/90" players={comparePlayers} stat="blocks_p90" />
                    <CompareRow label="Aerials Won/90" players={comparePlayers} stat="aerials_won_p90" />
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* PELE Score Breakdown */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">PELE Score Breakdown</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {comparePlayers.map((player, idx) => (
                <div
                  key={`${player.player_id}-${player.season}`}
                  className="border-2 rounded-lg p-4"
                  style={{ borderColor: COLORS[idx] }}
                >
                  <div className="text-center mb-4">
                    <div className="text-3xl font-bold" style={{ color: COLORS[idx] }}>
                      {player.pele_100.toFixed(1)}
                    </div>
                    <div className="font-medium">{player.player_name}</div>
                    <div className="text-sm text-gray-500">{player.season}</div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Offensive</span>
                      <span className="font-medium">{player.oc.toFixed(2)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full"
                        style={{
                          width: `${Math.min(100, player.oc * 25)}%`,
                          backgroundColor: COLORS[idx],
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Defensive</span>
                      <span className="font-medium">{player.dc.toFixed(2)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full"
                        style={{
                          width: `${Math.min(100, player.dc * 80)}%`,
                          backgroundColor: COLORS[idx],
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Minutes Mult.</span>
                      <span className="font-medium">{player.min_mult.toFixed(2)}x</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function getStatValues(
  players: Player[],
  stat: keyof Player,
  multiplier: number
): Record<string, number> {
  const result: Record<string, number> = {};
  players.forEach((player, idx) => {
    result[`player${idx}`] = Math.min(100, (player[stat] as number) * multiplier);
  });
  return result;
}

function getProgValues(players: Player[]): Record<string, number> {
  const result: Record<string, number> = {};
  players.forEach((player, idx) => {
    result[`player${idx}`] = Math.min(
      100,
      (player.progressive_passes_p90 + player.progressive_carries_p90) * 5
    );
  });
  return result;
}

function CompareRow({
  label,
  players,
  stat,
  highlight = false,
}: {
  label: string;
  players: Player[];
  stat: keyof Player;
  highlight?: boolean;
}) {
  const values = players.map((p) => p[stat] as number);
  const maxVal = Math.max(...values);

  return (
    <tr className={highlight ? "bg-blue-50 font-medium" : "hover:bg-gray-50"}>
      <td className="py-2 px-1">{label}</td>
      {players.map((player, idx) => {
        const val = player[stat] as number;
        const isMax = val === maxVal && players.length > 1;
        return (
          <td
            key={`${player.player_id}-${player.season}`}
            className={`text-right py-2 px-2 ${isMax ? "font-bold" : ""}`}
            style={isMax ? { color: COLORS[idx] } : {}}
          >
            {val.toFixed(2)}
          </td>
        );
      })}
    </tr>
  );
}
