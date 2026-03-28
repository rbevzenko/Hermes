// Levenshtein distance for Greek Unicode strings
function levenshtein(a, b) {
  const al = [...a];
  const bl = [...b];
  const m = al.length;
  const n = bl.length;
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = al[i - 1] === bl[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[m][n];
}

function normalizeGreek(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

// Returns 'exact' | 'close' | 'wrong'
export function fuzzyMatch(input, correctWord) {
  const correct = correctWord.greek;
  const noArticle = correct.includes(' ')
    ? correct.split(' ').slice(1).join(' ')
    : correct;
  const trimmed = input.trim();

  if (trimmed === correct || trimmed === noArticle) return 'exact';

  const ni = normalizeGreek(trimmed);
  const nc = normalizeGreek(correct);
  const na = normalizeGreek(noArticle);

  if (ni === nc || ni === na) return 'close';

  const dist = Math.min(levenshtein(ni, nc), levenshtein(ni, na));
  if (dist <= 2) return 'close';
  return 'wrong';
}
