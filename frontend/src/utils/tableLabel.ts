// The Floor Plan editor defaults a new table's label to "Table 2", "Table
// 3", etc., but staff can rename it to anything ("Patio 3", "Bar Seat A").
// Tickets/receipts used to always prefix "Table " in front of whatever the
// label was, which doubled up into "Table Table 2" for the common
// default-labeled case. This only adds the word when it isn't already
// there.
export function formatTableLabel(label: string): string {
  return /^table\b/i.test(label.trim()) ? label : `Table ${label}`;
}
