use security_framework::passwords::{
    delete_generic_password, get_generic_password, set_generic_password,
};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::process::Command;

use crate::snappit_errors::{SnappitError, SnappitResult};

const SERVICE_NAME: &str = "com.snappit.license";
const USAGE_KEY: &str = "trial_uses";
const HARDWARE_KEY: &str = "hardware_id";
const LICENSE_KEY: &str = "license_type";
const INITIAL_TRIAL_USES: u32 = 30;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum LicenseType {
    Trial,
    Pro,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LicenseState {
    pub license_type: LicenseType,
    pub uses_remaining: u32,
    pub is_valid: bool,
}

pub struct SnappitLicense;

impl SnappitLicense {
    /// Get the current license state
    pub fn get_state() -> SnappitResult<LicenseState> {
        let license_type = Self::get_license_type()?;
        let uses_remaining = Self::get_uses_remaining()?;

        // Verify hardware ID matches (anti-reset protection)
        let is_valid = Self::verify_hardware_id()?;

        Ok(LicenseState {
            license_type,
            uses_remaining,
            is_valid,
        })
    }

    /// Consume one tool use (for trial). Returns remaining uses.
    pub fn consume_use() -> SnappitResult<u32> {
        let license_type = Self::get_license_type()?;

        // Pro users have unlimited uses
        if license_type == LicenseType::Pro {
            return Ok(u32::MAX);
        }

        let current_uses = Self::get_uses_remaining()?;

        if current_uses == 0 {
            return Err(SnappitError::TrialExpired);
        }

        let new_uses = current_uses.saturating_sub(1);
        Self::set_uses_remaining(new_uses)?;

        Ok(new_uses)
    }

    /// Check if the trial is still valid (has uses remaining)
    pub fn is_trial_valid() -> SnappitResult<bool> {
        let license_type = Self::get_license_type()?;

        if license_type == LicenseType::Pro {
            return Ok(true);
        }

        let uses = Self::get_uses_remaining()?;
        let hardware_valid = Self::verify_hardware_id()?;

        Ok(uses > 0 && hardware_valid)
    }

    /// Activate pro license
    pub fn activate_pro() -> SnappitResult<()> {
        Self::set_keychain_value(LICENSE_KEY, "pro")?;
        Ok(())
    }

    /// Get remaining trial uses
    fn get_uses_remaining() -> SnappitResult<u32> {
        match Self::get_keychain_value(USAGE_KEY) {
            Ok(value) => value
                .parse::<u32>()
                .map_err(|_| SnappitError::LicenseCorrupted),
            Err(_) => {
                // First time - initialize with trial uses and hardware ID
                Self::initialize_trial()?;
                Ok(INITIAL_TRIAL_USES)
            }
        }
    }

    /// Set remaining trial uses
    fn set_uses_remaining(uses: u32) -> SnappitResult<()> {
        Self::set_keychain_value(USAGE_KEY, &uses.to_string())?;
        Ok(())
    }

    /// Get current license type
    fn get_license_type() -> SnappitResult<LicenseType> {
        match Self::get_keychain_value(LICENSE_KEY) {
            Ok(value) => match value.as_str() {
                "pro" => Ok(LicenseType::Pro),
                _ => Ok(LicenseType::Trial),
            },
            Err(_) => Ok(LicenseType::Trial),
        }
    }

    /// Initialize trial for first-time users
    fn initialize_trial() -> SnappitResult<()> {
        let hardware_id = Self::get_hardware_uuid()?;
        let hashed_id = Self::hash_string(&hardware_id);

        Self::set_keychain_value(HARDWARE_KEY, &hashed_id)?;
        Self::set_keychain_value(USAGE_KEY, &INITIAL_TRIAL_USES.to_string())?;
        Self::set_keychain_value(LICENSE_KEY, "trial")?;

        Ok(())
    }

    /// Verify the stored hardware ID matches current hardware
    fn verify_hardware_id() -> SnappitResult<bool> {
        let stored_id = match Self::get_keychain_value(HARDWARE_KEY) {
            Ok(id) => id,
            Err(_) => return Ok(true), // No stored ID yet, valid
        };

        let current_id = Self::get_hardware_uuid()?;
        let hashed_current = Self::hash_string(&current_id);

        Ok(stored_id == hashed_current)
    }

    /// Get the hardware UUID (IOPlatformUUID) from macOS
    fn get_hardware_uuid() -> SnappitResult<String> {
        let output = Command::new("ioreg")
            .args(["-rd1", "-c", "IOPlatformExpertDevice"])
            .output()
            .map_err(|e| SnappitError::License(format!("Failed to get hardware UUID: {}", e)))?;

        let stdout = String::from_utf8_lossy(&output.stdout);

        // Parse IOPlatformUUID from output
        for line in stdout.lines() {
            if line.contains("IOPlatformUUID") {
                if let Some(uuid) = line.split('"').nth(3) {
                    return Ok(uuid.to_string());
                }
            }
        }

        Err(SnappitError::License(
            "Failed to parse hardware UUID".to_string(),
        ))
    }

    /// Hash a string using SHA256
    fn hash_string(input: &str) -> String {
        let mut hasher = Sha256::new();
        hasher.update(input.as_bytes());
        let result = hasher.finalize();
        hex::encode(result)
    }

    /// Get value from Keychain
    fn get_keychain_value(key: &str) -> SnappitResult<String> {
        let password = get_generic_password(SERVICE_NAME, key)
            .map_err(|e| SnappitError::License(format!("Keychain read error: {}", e)))?;

        String::from_utf8(password.to_vec()).map_err(|_| SnappitError::LicenseCorrupted)
    }

    /// Set value in Keychain
    fn set_keychain_value(key: &str, value: &str) -> SnappitResult<()> {
        // Delete existing entry first (update pattern)
        let _ = delete_generic_password(SERVICE_NAME, key);

        set_generic_password(SERVICE_NAME, key, value.as_bytes())
            .map_err(|e| SnappitError::License(format!("Keychain write error: {}", e)))?;

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_hash_string() {
        let hash = SnappitLicense::hash_string("test");
        assert!(!hash.is_empty());
        assert_eq!(hash.len(), 64); // SHA256 = 32 bytes = 64 hex chars
    }
}
