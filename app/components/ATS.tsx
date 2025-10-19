import React from "react";

// Canonical suggestion shape used for rendering
type Suggestion = { type: "good" | "improve"; tip: string };

// Broader incoming type to be resilient to API variations
type IncomingSuggestion = Suggestion | string | Record<string, any>;

type ATSProps = {
  score: number;
  suggestions: IncomingSuggestion[];
};

// Normalize any incoming suggestion item to { type, tip }
function normalizeSuggestions(input: IncomingSuggestion[] | undefined | null): Suggestion[] {
  if (!Array.isArray(input)) return [];

  const toType = (raw: any, text: string): "good" | "improve" => {
    const val = (typeof raw === "string" ? raw : "")
      .toLowerCase()
      .trim();

    // Accept multiple synonyms commonly used
    const goodSet = new Set(["good", "positive", "pass", "ok", "okay", "success", "strong"]);
    const improveSet = new Set(["improve", "warning", "negative", "fail", "issue", "risk", "weak"]);

    if (goodSet.has(val)) return "good";
    if (improveSet.has(val)) return "improve";

    // Infer from text heuristically
    const t = text.toLowerCase();
    const improveHints = ["improve", "add", "avoid", "fix", "ensure", "remove", "consider", "optimize", "increase", "decrease", "clarify", "revise", "missing", "should"];
    const isImprove = improveHints.some((w) => t.includes(w));
    return isImprove ? "improve" : "good";
  };

  const readText = (obj: any): string => {
    if (typeof obj === "string") return obj;
    if (!obj || typeof obj !== "object") return "";
    return (
      obj.tip ??
      obj.text ??
      obj.suggestion ??
      obj.message ??
      obj.note ??
      obj.description ??
      ""
    );
  };

  return input
    .map((item) => {
      if (typeof item === "string") {
        const type = toType(undefined, item);
        return { type, tip: item } as Suggestion;
      }

      if (item && typeof item === "object") {
        // If already in the correct shape
        if (typeof (item as any).tip === "string" && ((item as any).type === "good" || (item as any).type === "improve")) {
          return item as Suggestion;
        }

        const tip = readText(item);
        const candidateType = (item as any).type ?? (item as any).category ?? (item as any).kind ?? (item as any).status ?? (item as any).level;
        const type = toType(candidateType, tip);
        if (tip) return { type, tip } as Suggestion;
      }

      return null;
    })
    .filter((x): x is Suggestion => !!x);
}

const ATS: React.FC<ATSProps> = ({ score, suggestions }) => {
  const isGood = score > 69;
  const isOkay = !isGood && score > 49;

  const gradientFrom = isGood
    ? "from-green-100"
    : isOkay
    ? "from-yellow-100"
    : "from-red-100";

  const statusIcon = isGood
    ? "/icons/ats-good.svg"
    : isOkay
    ? "/icons/ats-warning.svg"
    : "/icons/ats-bad.svg";

  const headingColor = isGood
    ? "text-green-700"
    : isOkay
    ? "text-yellow-700"
    : "text-red-700";

  const items = normalizeSuggestions(suggestions);

  return (
    <div className={`w-full rounded-2xl shadow-md bg-gradient-to-br ${gradientFrom} to-white p-5`}>
      {/* Top section */}
      <div className="flex items-center gap-3">
        <img src={statusIcon} alt="ATS status" className="h-10 w-10" />
        <div className="flex flex-col">
          <h3 className={`text-xl font-semibold ${headingColor}`}>
            ATS Score – {Math.round(score)}/100
          </h3>
          <p className="text-sm text-gray-500">
            How your resume may perform with Applicant Tracking Systems
          </p>
        </div>
      </div>

      {/* Description and suggestions */}
      <div className="mt-4 space-y-3">
        <h4 className="text-base font-medium">Suggestions</h4>
        <p className="text-sm text-gray-500">
          We analyzed your resume for ATS compatibility. Here are some pointers to
          help improve parsing and match strength:
        </p>
        {items.length > 0 ? (
          <ul className="mt-2 space-y-2">
            {items.map((s, idx) => {
              const icon = s.type === "good" ? "/icons/check.svg" : "/icons/warning.svg";
              const iconAlt = s.type === "good" ? "Good" : "Improve";
              const textColor = s.type === "good" ? "text-green-700" : "text-yellow-700";
              return (
                <li key={idx} className="flex items-start gap-2">
                  <img src={icon} alt={iconAlt} className="mt-0.5 h-4 w-4" />
                  <span className={`text-sm ${textColor}`}>{s.tip}</span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">No specific suggestions available.</p>
        )}
        <p className="text-sm text-gray-600">
          Keep refining your resume for better ATS performance and higher match scores.
        </p>
      </div>
    </div>
  );
};

export default ATS;