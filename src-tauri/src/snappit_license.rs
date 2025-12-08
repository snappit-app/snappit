use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::fs;
use std::path::PathBuf;
use std::process::Command;

use crate::snappit_errors::{SnappitError, SnappitResult};

const LICENSE_FOLDER: &str = ".snappit_data";
const LICENSE_FILE: &str = "license.dat";
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

/// Internal structure stored on disk (obfuscated)
#[derive(Debug, Clone, Serialize, Deserialize)]
struct LicenseData {
    /// Hardware signature hash for anti-copy protection
    hw_sig: String,
    /// Remaining uses (for trial)
    uses: u32,
    /// License type: "t" for trial, "p" for pro
    lt: String,
    /// Checksum to detect tampering
    cs: String,
}

impl LicenseData {
    fn new(hardware_id: &str, uses: u32, license_type: &str) -> Self {
        let mut data = Self {
            hw_sig: Self::hash(hardware_id),
            uses,
            lt: license_type.to_string(),
            cs: String::new(),
        };
        data.cs = data.compute_checksum();
        data
    }

    fn compute_checksum(&self) -> String {
        let payload = format!("{}:{}:{}", self.hw_sig, self.uses, self.lt);
        Self::hash(&payload)
    }

    fn is_valid(&self) -> bool {
        self.cs == self.compute_checksum()
    }

    fn hash(input: &str) -> String {
        let mut hasher = Sha256::new();
        hasher.update(input.as_bytes());
        let result = hasher.finalize();
        hex::encode(result)
    }
}

pub struct SnappitLicense;

impl SnappitLicense {
    /// Get the current license state
    pub fn get_state() -> SnappitResult<LicenseState> {
        let data = Self::load_or_init()?;

        let license_type = match data.lt.as_str() {
            "p" => LicenseType::Pro,
            _ => LicenseType::Trial,
        };

        // Verify data integrity and hardware match
        let current_hw_hash = LicenseData::hash(&Self::get_hardware_uuid()?);
        let is_valid = data.is_valid() && data.hw_sig == current_hw_hash;

        Ok(LicenseState {
            license_type,
            uses_remaining: data.uses,
            is_valid,
        })
    }

    /// Consume one tool use (for trial). Returns remaining uses.
    pub fn consume_use() -> SnappitResult<u32> {
        let mut data = Self::load_or_init()?;

        // Pro users have unlimited uses
        if data.lt == "p" {
            return Ok(u32::MAX);
        }

        // Verify integrity
        if !data.is_valid() {
            return Err(SnappitError::LicenseCorrupted);
        }

        if data.uses == 0 {
            return Err(SnappitError::TrialExpired);
        }

        data.uses = data.uses.saturating_sub(1);
        data.cs = data.compute_checksum();
        Self::save(&data)?;

        Ok(data.uses)
    }

    /// Activate pro license
    pub fn activate_pro() -> SnappitResult<()> {
        let mut data = Self::load_or_init()?;
        data.lt = "p".to_string();
        data.cs = data.compute_checksum();
        Self::save(&data)?;
        Ok(())
    }

    /// Get the license file path in ~/Library/Application Support/.snappit_data/
    fn get_license_path() -> SnappitResult<PathBuf> {
        let home = std::env::var("HOME")
            .map_err(|_| SnappitError::License("Cannot determine home directory".to_string()))?;

        // Use ~/Library/Application Support/ which persists across reinstalls
        let app_support = PathBuf::from(&home)
            .join("Library")
            .join("Application Support")
            .join(LICENSE_FOLDER);

        // Create directory if it doesn't exist
        if !app_support.exists() {
            fs::create_dir_all(&app_support)
                .map_err(|e| SnappitError::License(format!("Cannot create license dir: {}", e)))?;
        }

        Ok(app_support.join(LICENSE_FILE))
    }

    /// Load license data from file or initialize if not exists
    fn load_or_init() -> SnappitResult<LicenseData> {
        let path = Self::get_license_path()?;

        if path.exists() {
            let contents = fs::read(&path)
                .map_err(|e| SnappitError::License(format!("Cannot read license file: {}", e)))?;

            // Decode base64
            let decoded =
                base64::Engine::decode(&base64::engine::general_purpose::STANDARD, &contents)
                    .map_err(|_| SnappitError::LicenseCorrupted)?;

            let data: LicenseData =
                serde_json::from_slice(&decoded).map_err(|_| SnappitError::LicenseCorrupted)?;

            // Verify checksum
            if !data.is_valid() {
                // Tampered - reinitialize
                return Self::initialize();
            }

            // Verify hardware signature
            let current_hw_hash = LicenseData::hash(&Self::get_hardware_uuid()?);
            if data.hw_sig != current_hw_hash {
                // Different machine - reinitialize (trial reset not allowed)
                return Self::initialize();
            }

            Ok(data)
        } else {
            Self::initialize()
        }
    }

    /// Initialize new trial license
    fn initialize() -> SnappitResult<LicenseData> {
        let hardware_id = Self::get_hardware_uuid()?;
        let data = LicenseData::new(&hardware_id, INITIAL_TRIAL_USES, "t");
        Self::save(&data)?;
        Ok(data)
    }

    /// Save license data to file (base64 encoded for obfuscation)
    fn save(data: &LicenseData) -> SnappitResult<()> {
        let path = Self::get_license_path()?;

        let json = serde_json::to_vec(data)
            .map_err(|e| SnappitError::License(format!("Cannot serialize license: {}", e)))?;

        let encoded = base64::Engine::encode(&base64::engine::general_purpose::STANDARD, &json);

        fs::write(&path, encoded.as_bytes())
            .map_err(|e| SnappitError::License(format!("Cannot write license file: {}", e)))?;

        Ok(())
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
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_license_data_checksum() {
        let data = LicenseData::new("test-hw-id", 30, "t");
        assert!(data.is_valid());
    }

    #[test]
    fn test_license_data_tamper_detection() {
        let mut data = LicenseData::new("test-hw-id", 30, "t");
        data.uses = 999; // Tamper with uses
        assert!(!data.is_valid()); // Should detect tampering
    }
}
