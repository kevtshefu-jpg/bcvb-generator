export function computeAttendanceCoverage(
  recordedCount: number,
  expectedCount: number,
) {
  const normalizedExpected = Math.max(0, expectedCount);
  const missingRecords = Math.max(0, normalizedExpected - recordedCount);

  return {
    recordedCount,
    missingRecords,
    completionRate: normalizedExpected
      ? Math.round((Math.min(recordedCount, normalizedExpected) / normalizedExpected) * 1000) / 10
      : 0,
  };
}
