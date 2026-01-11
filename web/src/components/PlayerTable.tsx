import { useState } from "react";
import type { Player, SortField, SortDirection } from "../types/player";

interface PlayerTableProps {
  players: Player[];
  onPlayerSelect: (player: Player) => void;
  selectedPlayers: Player[];
  onAddToCompare: (player: Player) => void;
  compareMode: boolean;
}

function getPeleColor(score: number): string {
  if (score >= 70) return "text-green-600 font-bold";
  if (score >= 60) return "text-green-500";
  if (score >= 50) return "text-gray-700";
  if (score >= 40) return "text-orange-500";
  return "text-red-500";
}

function getPeleBgColor(score: number): string {
  if (score >= 70) return "bg-green-100";
  if (score >= 60) return "bg-green-50";
  if (score >= 50) return "bg-gray-50";
  if (score >= 40) return "bg-orange-50";
  return "bg-red-50";
}

export function PlayerTable({
  players,
  onPlayerSelect,
  selectedPlayers,
  onAddToCompare,
  compareMode,
}: PlayerTableProps) {
  const [sortField, setSortField] = useState<SortField>("pele_100");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [page, setPage] = useState(0);
  const pageSize = 25;

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
    setPage(0);
  };

  const sortedPlayers = [...players].sort((a, b) => {
    const aVal = a[sortField];
    const bVal = b[sortField];
    if (typeof aVal === "string" && typeof bVal === "string") {
      return sortDirection === "asc"
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    }
    return sortDirection === "asc"
      ? (aVal as number) - (bVal as number)
      : (bVal as number) - (aVal as number);
  });

  const paginatedPlayers = sortedPlayers.slice(
    page * pageSize,
    (page + 1) * pageSize
  );
  const totalPages = Math.ceil(sortedPlayers.length / pageSize);

  const isSelected = (player: Player) =>
    selectedPlayers.some(
      (p) => p.player_id === player.player_id && p.season === player.season
    );

  const SortHeader = ({
    field,
    label,
    className = "",
  }: {
    field: SortField;
    label: string;
    className?: string;
  }) => (
    <th
      className={`px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 ${className}`}
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {label}
        {sortField === field && (
          <span>{sortDirection === "asc" ? "↑" : "↓"}</span>
        )}
      </div>
    </th>
  );

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {compareMode && (
                <th className="px-3 py-3 w-12"></th>
              )}
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                #
              </th>
              <SortHeader field="player_name" label="Player" className="min-w-[200px]" />
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Season
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Team
              </th>
              <SortHeader field="pele_100" label="PELE" />
              <SortHeader field="oc" label="OC" />
              <SortHeader field="dc" label="DC" />
              <SortHeader field="np_goals_p90" label="G/90" />
              <SortHeader field="assists_p90" label="A/90" />
              <SortHeader field="xg_p90" label="xG/90" />
              <SortHeader field="tackles_p90" label="Tkl/90" />
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedPlayers.map((player, idx) => (
              <tr
                key={`${player.player_id}-${player.season}`}
                className={`hover:bg-blue-50 cursor-pointer transition-colors ${
                  isSelected(player) ? "bg-blue-100" : ""
                }`}
                onClick={() => onPlayerSelect(player)}
              >
                {compareMode && (
                  <td className="px-3 py-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddToCompare(player);
                      }}
                      disabled={isSelected(player) || selectedPlayers.length >= 3}
                      className={`w-6 h-6 rounded border-2 flex items-center justify-center text-sm ${
                        isSelected(player)
                          ? "bg-blue-500 border-blue-500 text-white"
                          : "border-gray-300 hover:border-blue-500"
                      }`}
                    >
                      {isSelected(player) ? "✓" : "+"}
                    </button>
                  </td>
                )}
                <td className="px-3 py-3 text-sm text-gray-500">
                  {page * pageSize + idx + 1}
                </td>
                <td className="px-3 py-3 text-sm font-medium text-gray-900">
                  {player.player_name}
                </td>
                <td className="px-3 py-3 text-sm text-gray-500">
                  {player.season}
                </td>
                <td className="px-3 py-3 text-sm text-gray-500">
                  {player.team_id}
                </td>
                <td className={`px-3 py-3 text-sm ${getPeleColor(player.pele_100)} ${getPeleBgColor(player.pele_100)} rounded`}>
                  {player.pele_100.toFixed(1)}
                </td>
                <td className="px-3 py-3 text-sm text-gray-700">
                  {player.oc.toFixed(2)}
                </td>
                <td className="px-3 py-3 text-sm text-gray-700">
                  {player.dc.toFixed(2)}
                </td>
                <td className="px-3 py-3 text-sm text-gray-700">
                  {player.np_goals_p90.toFixed(2)}
                </td>
                <td className="px-3 py-3 text-sm text-gray-700">
                  {player.assists_p90.toFixed(2)}
                </td>
                <td className="px-3 py-3 text-sm text-gray-700">
                  {player.xg_p90.toFixed(2)}
                </td>
                <td className="px-3 py-3 text-sm text-gray-700">
                  {player.tackles_p90.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200">
        <div className="text-sm text-gray-700">
          Showing {page * pageSize + 1} to{" "}
          {Math.min((page + 1) * pageSize, sortedPlayers.length)} of{" "}
          {sortedPlayers.length} players
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
            className="px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
          >
            Previous
          </button>
          <span className="px-3 py-1 text-sm">
            Page {page + 1} of {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
            disabled={page >= totalPages - 1}
            className="px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
