export function extractDomain(email) {
  const match = String(email || '').trim().toLowerCase().match(/@(.+)$/);
  return match ? match[1] : null;
}

export function domainToKey(domain) {
  return String(domain || '').trim().toLowerCase().replace(/\./g, '_');
}

export function normalizeCompanyName(name) {
  return String(name || '').trim().replace(/\s+/g, ' ');
}

export function normalizeCompanyKey(name) {
  return normalizeCompanyName(name).toLowerCase();
}

export function isPersonalEmailDomain(domain) {
  return new Set([
    'gmail.com',
    'yahoo.com',
    'hotmail.com',
    'outlook.com',
    'yahoo.co.in',
    'rediffmail.com',
    'icloud.com',
    'proton.me',
  ]).has(String(domain || '').toLowerCase());
}

export function levenshteinDistance(left, right) {
  const a = String(left || '');
  const b = String(right || '');
  const matrix = Array.from({ length: b.length + 1 }, (_, row) => [row]);

  for (let column = 0; column <= a.length; column += 1) {
    matrix[0][column] = column;
  }

  for (let row = 1; row <= b.length; row += 1) {
    for (let column = 1; column <= a.length; column += 1) {
      if (b.charAt(row - 1) === a.charAt(column - 1)) {
        matrix[row][column] = matrix[row - 1][column - 1];
      } else {
        matrix[row][column] = Math.min(
          matrix[row - 1][column - 1] + 1,
          matrix[row][column - 1] + 1,
          matrix[row - 1][column] + 1,
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

export function findSimilarCollegeDomains(newDomain, colleges) {
  const parts = String(newDomain || '').split('.');
  const similar = [];

  for (const college of colleges) {
    if (college.domain === newDomain) {
      continue;
    }

    const existingParts = String(college.domain || '').split('.');
    const sameInstitutionPrefix = parts[0] && parts[0] === existingParts[0];
    const smallEditDistance = levenshteinDistance(newDomain, college.domain) <= 3;

    if (sameInstitutionPrefix || smallEditDistance) {
      similar.push({
        name: college.name,
        domain: college.domain,
        domainKey: college.domainKey,
      });
    }
  }

  return similar;
}

