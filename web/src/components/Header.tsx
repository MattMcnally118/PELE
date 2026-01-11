interface HeaderProps {
  activeTab: "search" | "compare" | "about";
  onTabChange: (tab: "search" | "compare" | "about") => void;
}

export function Header({ activeTab, onTabChange }: HeaderProps) {
  const tabs = [
    { id: "search" as const, label: "Search Players" },
    { id: "compare" as const, label: "Compare" },
    { id: "about" as const, label: "About" },
  ];

  return (
    <header className="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">PELE</h1>
            <p className="text-blue-200 text-sm mt-1">
              Player Effect Level Evaluation
            </p>
          </div>
          <nav className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === tab.id
                    ? "bg-white text-blue-700"
                    : "text-blue-100 hover:bg-blue-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
