import { useState, useMemo } from "react";
import { Header } from "./components/Header";
import { SearchFilters } from "./components/SearchFilters";
import { PlayerTable } from "./components/PlayerTable";
import { PlayerDetail } from "./components/PlayerDetail";
import { PlayerComparison } from "./components/PlayerComparison";
import { About } from "./components/About";
import type { Player, Filters } from "./types/player";

// Import data
import playersData from "./data/players.json";
import filtersData from "./data/filters.json";

function App() {
  const [activeTab, setActiveTab] = useState<"search" | "compare" | "about">(
    "search"
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSeason, setSelectedSeason] = useState("");
  const [selectedTeam, setSelectedTeam] = useState("");
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [comparePlayers, setComparePlayers] = useState<Player[]>([]);

  const players = playersData as Player[];
  const filters = filtersData as Filters;

  // Filter players based on search criteria
  const filteredPlayers = useMemo(() => {
    return players.filter((player) => {
      const matchesSearch =
        searchTerm === "" ||
        player.player_name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSeason =
        selectedSeason === "" || player.season === selectedSeason;
      const matchesTeam =
        selectedTeam === "" || player.team_id === selectedTeam;
      return matchesSearch && matchesSeason && matchesTeam;
    });
  }, [players, searchTerm, selectedSeason, selectedTeam]);

  const handlePlayerSelect = (player: Player) => {
    setSelectedPlayer(player);
  };

  const handleAddToCompare = (player: Player) => {
    if (comparePlayers.length < 3) {
      const alreadyExists = comparePlayers.some(
        (p) => p.player_id === player.player_id && p.season === player.season
      );
      if (!alreadyExists) {
        setComparePlayers([...comparePlayers, player]);
      }
    }
  };

  const handleRemoveFromCompare = (player: Player) => {
    setComparePlayers(
      comparePlayers.filter(
        (p) =>
          !(p.player_id === player.player_id && p.season === player.season)
      )
    );
  };

  const handleClearCompare = () => {
    setComparePlayers([]);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === "search" && (
          <>
            <SearchFilters
              filters={filters}
              searchTerm={searchTerm}
              selectedSeason={selectedSeason}
              selectedTeam={selectedTeam}
              onSearchChange={setSearchTerm}
              onSeasonChange={setSelectedSeason}
              onTeamChange={setSelectedTeam}
            />

            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                {filteredPlayers.length} players found
              </p>
              {comparePlayers.length > 0 && (
                <button
                  onClick={() => setActiveTab("compare")}
                  className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-lg hover:bg-blue-200"
                >
                  View Comparison ({comparePlayers.length})
                </button>
              )}
            </div>

            <PlayerTable
              players={filteredPlayers}
              onPlayerSelect={handlePlayerSelect}
              selectedPlayers={comparePlayers}
              onAddToCompare={handleAddToCompare}
              compareMode={true}
            />
          </>
        )}

        {activeTab === "compare" && (
          <PlayerComparison
            players={comparePlayers}
            onRemovePlayer={handleRemoveFromCompare}
            onClearAll={handleClearCompare}
          />
        )}

        {activeTab === "about" && <About />}
      </main>

      {/* Player Detail Modal */}
      {selectedPlayer && (
        <PlayerDetail
          player={selectedPlayer}
          onClose={() => setSelectedPlayer(null)}
        />
      )}
    </div>
  );
}

export default App;
