import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import KeyInput from "../components/KeyInput";

interface KeyStatus {
  present: boolean;
  source: "keychain" | "env" | null;
}

interface Props {
  onChanged: () => void;
}

export default function KeysTab({ onChanged }: Props) {
  const [soniox, setSoniox] = useState<KeyStatus>({ present: false, source: null });
  const [upstage, setUpstage] = useState<KeyStatus>({ present: false, source: null });

  const refresh = async () => {
    const [s, u] = await Promise.all([
      invoke<KeyStatus>("api_key_status", { name: "SONIOX_API_KEY" }),
      invoke<KeyStatus>("api_key_status", { name: "UPSTAGE_API_KEY" }),
    ]);
    setSoniox(s);
    setUpstage(u);
  };

  useEffect(() => {
    refresh();
  }, []);

  const notify = () => {
    refresh();
    onChanged();
  };

  return (
    <>
      <KeyInput
        name="SONIOX_API_KEY"
        label="Soniox API Key"
        helper="Used for STT (English/Korean transcription). ≈$0.12/hr at current pricing — confirm at sign-up."
        storedSource={soniox.source}
        onSaved={notify}
        onCleared={notify}
      />
      <KeyInput
        name="UPSTAGE_API_KEY"
        label="Upstage API Key"
        helper="Used for Korean translation (Solar Pro 3). $0.15/M in, $0.60/M out — caching kicks in after first call."
        storedSource={upstage.source}
        onSaved={notify}
        onCleared={notify}
      />
    </>
  );
}
