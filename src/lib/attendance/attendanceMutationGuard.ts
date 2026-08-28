export type AttendanceMutationGate = { current: boolean };

export async function runSingleAttendanceMutation<T>(
  gate: AttendanceMutationGate,
  mutation: () => Promise<T>,
): Promise<T | undefined> {
  if (gate.current) return undefined;

  gate.current = true;
  try {
    return await mutation();
  } finally {
    gate.current = false;
  }
}
