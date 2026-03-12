/**
 * Generate the "Use" section text from structured planning class data.
 * Shared between the form preview and PDF renderer.
 */
export function generateUseText(classes: string[], alternatives: boolean): string {
  if (classes.length === 0) return '';

  // Format each class: "Sui Generis" stays as-is, others get "Class " prefix
  const formatted = classes.map((c) =>
    c === 'Sui Generis' ? 'Sui Generis' : `Class ${c}`
  );

  // Join with commas + "and"
  let classList: string;
  if (formatted.length === 1) {
    classList = formatted[0];
  } else if (formatted.length === 2) {
    classList = `${formatted[0]} and ${formatted[1]}`;
  } else {
    classList = `${formatted.slice(0, -1).join(', ')} and ${formatted[formatted.length - 1]}`;
  }

  let text = `The premises benefits from ${classList} planning consent.`;

  if (alternatives) {
    text += ' Alternative uses may be considered subject to planning.';
  }

  return text;
}
