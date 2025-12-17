export const runRealAnalysis = async (
  text,
  type = "General Essay",
  instruction = null,
  context = null
) => {
  const res = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text,
      type,
      instruction,
      context
    })
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.error || "Analysis failed");
  }

  // Depending on your backend return shape:
  // If backend returns { result: "...json string..." }
  return data;
};
