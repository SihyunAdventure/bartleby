import styles from "./ShortcutsTab.module.css";

const DEFERRED_TOOLTIP = "추후 슬라이스 (global-shortcut dynamic re-register)";

interface ShortcutRow {
  action: string;
  keys: string;
  note?: string;
}

const SHORTCUTS: ShortcutRow[] = [
  { action: "Toggle Watch overlay", keys: "⌘ ⌃ B" },
  { action: "Toggle Meeting recording", keys: "⌘ ⌃ M" },
  { action: "Show Bartleby panel", keys: "⌘ ⇧ V" },
  { action: "Capture audio screenshot", keys: "⌘ ⇧ 4" },
  { action: "Quit", keys: "⌘ Q", note: "(system)" },
];

export default function ShortcutsTab() {
  return (
    <div className={styles.root}>
      <table className={styles.table}>
        <tbody>
          {SHORTCUTS.map((row) => (
            <tr key={row.action} className={styles.row}>
              <td className={styles.action}>{row.action}</td>
              <td className={styles.keys}>{row.keys}</td>
              <td className={styles.ctrl}>
                {row.note ? (
                  <span className={styles.note}>{row.note}</span>
                ) : (
                  <button className="btn" disabled title={DEFERRED_TOOLTIP}>
                    Customize…
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
