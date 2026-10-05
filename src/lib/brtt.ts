export function calculateBrtt(startTime) {
  if (!startTime || typeof startTime !== 'number') {
    return null;
  }
  return (Date.now() - startTime).toString();
}
