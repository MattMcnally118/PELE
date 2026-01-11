export function About() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Hero Section */}
      <div className="bg-white rounded-lg shadow p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          PELE: Player Effect Level Evaluation
        </h1>
        <p className="text-lg text-gray-600 leading-relaxed">
          PELE is a composite football analytics metric designed to estimate a
          player's total on-pitch contribution by combining offensive value,
          defensive value, and minutes-based reliability adjustments.
        </p>
      </div>

      {/* How to Interpret */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">How to Interpret PELE Scores</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <ScoreCard score="70+" label="Elite" color="bg-green-500" />
          <ScoreCard score="60-69" label="Very Good" color="bg-green-400" />
          <ScoreCard score="50-59" label="Average" color="bg-gray-400" />
          <ScoreCard score="40-49" label="Below Average" color="bg-orange-400" />
          <ScoreCard score="< 40" label="Poor" color="bg-red-400" />
        </div>
        <p className="text-sm text-gray-500 mt-4">
          PELE scores are standardized with a mean of 50 and standard deviation
          of 10. A score of 60 means a player is one standard deviation above
          average.
        </p>
      </div>

      {/* Components */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Score Components</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Offensive Component */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold text-blue-700 mb-3 flex items-center gap-2">
              <span className="text-xl">⚽</span> Offensive Component (OC)
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              Measures attacking contribution including goals, assists, chance
              creation, and ball progression.
            </p>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-1">Stat</th>
                  <th className="text-right py-1">Weight</th>
                </tr>
              </thead>
              <tbody>
                <WeightRow label="Non-penalty Goals" weight="1.20" />
                <WeightRow label="Penalty Goals" weight="0.30" />
                <WeightRow label="Assists" weight="0.80" />
                <WeightRow label="xG Residual" weight="0.50" />
                <WeightRow label="xA Residual" weight="0.40" />
                <WeightRow label="Key Passes" weight="0.20" />
                <WeightRow label="Progressive Actions" weight="0.08" />
                <WeightRow label="Successful Dribbles" weight="0.06" />
                <WeightRow label="Turnovers" weight="-0.10" negative />
                <WeightRow label="Shots" weight="0.03" />
                <WeightRow label="Shots on Target" weight="0.05" />
              </tbody>
            </table>
          </div>

          {/* Defensive Component */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold text-green-700 mb-3 flex items-center gap-2">
              <span className="text-xl">🛡️</span> Defensive Component (DC)
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              Measures defensive contribution including tackles, interceptions,
              blocks, and aerial duels.
            </p>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-1">Stat</th>
                  <th className="text-right py-1">Weight</th>
                </tr>
              </thead>
              <tbody>
                <WeightRow label="Tackles + Interceptions" weight="0.12" />
                <WeightRow label="Blocks" weight="0.08" />
                <WeightRow label="Aerials Won" weight="0.05" />
                <WeightRow label="Tackles (Def 3rd)" weight="0.04" />
                <WeightRow label="Tackles (Mid 3rd)" weight="0.02" />
                <WeightRow label="Tackles (Att 3rd)" weight="0.01" />
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Minutes Multiplier */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Minutes Multiplier</h2>
        <p className="text-gray-600 mb-4">
          PELE adjusts for sample size using a logarithmic minutes multiplier.
          Players with above-average minutes receive a bonus, while those with
          fewer minutes are penalized.
        </p>
        <div className="bg-gray-100 rounded-lg p-4 font-mono text-sm">
          <code>
            multiplier = (log(1 + minutes) / log(1 + avg_minutes))²
          </code>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mt-4">
          <MinutesExample minutes={500} mult={0.67} />
          <MinutesExample minutes={1000} mult={0.83} />
          <MinutesExample minutes={1500} mult={0.92} />
          <MinutesExample minutes={2000} mult={1.00} />
          <MinutesExample minutes={2500} mult={1.06} />
          <MinutesExample minutes={3000} mult={1.11} />
        </div>
      </div>

      {/* Formula */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Final Formula</h2>
        <div className="bg-gray-900 text-green-400 rounded-lg p-4 font-mono text-sm overflow-x-auto">
          <pre>{`base_score = OC + DC
pele_raw   = base_score × minutes_multiplier
pele_100   = 50 + 10 × z-score(pele_raw)`}</pre>
        </div>
      </div>

      {/* Data Source */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Data Source</h2>
        <p className="text-gray-600 mb-4">
          Player statistics are sourced from{" "}
          <a
            href="https://fbref.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            FBref.com
          </a>
          , covering top European leagues from 2020-21 to 2024-25.
        </p>
        <p className="text-gray-600">
          View the source code on{" "}
          <a
            href="https://github.com/MattMcnally118/PELE"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            GitHub
          </a>
          .
        </p>
      </div>
    </div>
  );
}

function ScoreCard({
  score,
  label,
  color,
}: {
  score: string;
  label: string;
  color: string;
}) {
  return (
    <div className="text-center">
      <div className={`${color} text-white rounded-lg py-3 font-bold text-lg`}>
        {score}
      </div>
      <div className="text-sm text-gray-600 mt-1">{label}</div>
    </div>
  );
}

function WeightRow({
  label,
  weight,
  negative = false,
}: {
  label: string;
  weight: string;
  negative?: boolean;
}) {
  return (
    <tr className="border-b border-gray-100">
      <td className="py-1">{label}</td>
      <td className={`text-right py-1 font-mono ${negative ? "text-red-600" : ""}`}>
        {weight}
      </td>
    </tr>
  );
}

function MinutesExample({ minutes, mult }: { minutes: number; mult: number }) {
  return (
    <div className="text-center bg-gray-50 rounded p-2">
      <div className="text-lg font-semibold">{mult.toFixed(2)}x</div>
      <div className="text-xs text-gray-500">{minutes} min</div>
    </div>
  );
}
