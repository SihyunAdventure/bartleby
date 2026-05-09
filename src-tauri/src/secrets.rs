//! BYOK secret storage backed by macOS Keychain (via the `keyring` crate).
//!
//! Service name = bundle id `com.heybartleby.bartleby`. Each key is stored
//! as a generic password keyed by its env-var name (`SONIOX_API_KEY`,
//! `UPSTAGE_API_KEY`) so the precedence layer in `lib.rs::spawn_capture`
//! can probe Keychain first, ENV second using the same identifier.
//!
//! `load` returns `Ok(None)` when the entry has never been set. `clear`
//! is idempotent — clearing an absent entry is a no-op.

use anyhow::{Context, Result};
use keyring::{Entry, Error as KeyringError};

const SERVICE: &str = "com.heybartleby.bartleby";

fn entry(name: &str) -> Result<Entry> {
    Entry::new(SERVICE, name)
        .with_context(|| format!("Keychain entry init failed for {}", name))
}

pub fn load(name: &str) -> Result<Option<String>> {
    match entry(name)?.get_password() {
        Ok(value) => Ok(Some(value)),
        Err(KeyringError::NoEntry) => Ok(None),
        Err(e) => Err(e).with_context(|| format!("Keychain load failed for {}", name)),
    }
}

pub fn save(name: &str, value: &str) -> Result<()> {
    entry(name)?
        .set_password(value)
        .with_context(|| format!("Keychain save failed for {}", name))
}

pub fn clear(name: &str) -> Result<()> {
    match entry(name)?.delete_credential() {
        Ok(()) | Err(KeyringError::NoEntry) => Ok(()),
        Err(e) => Err(e).with_context(|| format!("Keychain clear failed for {}", name)),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Round-trips a value through the real macOS Keychain. Ignored by default
    /// because (a) CI has no Keychain, (b) running it shows an "allow"
    /// prompt the first time per unsigned binary. To run locally:
    /// `cargo test --lib secrets -- --ignored --nocapture`.
    #[test]
    #[ignore]
    fn roundtrip_save_load_clear() {
        let key = "BARTLEBY_TEST_KEY";
        save(key, "secret-value-xyz").unwrap();
        assert_eq!(load(key).unwrap().as_deref(), Some("secret-value-xyz"));
        clear(key).unwrap();
        assert_eq!(load(key).unwrap(), None);
        clear(key).unwrap(); // idempotent
    }
}
