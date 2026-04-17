export function toSseEvent(data: unknown, event = "mission_update"): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}
