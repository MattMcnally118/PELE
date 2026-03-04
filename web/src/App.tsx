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

            <div className="mb-4">
              <p className="text-sm text-gray-600">
                {filteredPlayers.length} players found
              </p>
            </div>

            <PlayerTable
              players={filteredPlayers}
              onPlayerSelect={(player) => setSelectedPlayer(player)}
            />
          </>
        )}

        {activeTab === "compare" && (
          <PlayerComparison allPlayers={players} />
        )}

        {activeTab === "about" && <About />}
      </main>

      {/* Player Detail Modal */}
      {selectedPlayer && (
        <PlayerDetail
          player={selectedPlayer}
          allPlayers={players}
          onClose={() => setSelectedPlayer(null)}
        />
      )}
    </div>
  );
}

export default App;
