use core_foundation::base::TCFType;
use core_foundation::string::CFString;
use core_foundation_sys::base::kCFAllocatorDefault;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::fs;
use std::path::PathBuf;
use std::sync::atomic::{AtomicU64, Ordering};
use std::time::{SystemTime, UNIX_EPOCH};

use crate::snappit_errors::{SnappitError, SnappitResult};

const LICENSE_FOLDER: &str = ".snappit_data";
const LICENSE_FILE: &str = "license.dat";
const INITIAL_TRIAL_USES: u32 = 30;

/// Secret salt for checksum - makes it harder to forge license data
const CHECKSUM_SALT: &str = "sn4pp1t_x7k9m2_l1c3ns3_s4lt_2024";

/// Rate limiting: minimum interval between get_state calls (ms)
const MIN_CHECK_INTERVAL_MS: u64 = 100;

/// Cached license state for rate limiting
static LAST_STATE_CHECK: AtomicU64 = AtomicU64::new(0);
static CACHED_STATE: std::sync::OnceLock<std::sync::Mutex<Option<LicenseState>>> =
    std::sync::OnceLock::new();

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum LicenseType {
    Trial,
    Full,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LicenseState {
    pub license_type: LicenseType,
    pub uses_remaining: u32,
    pub is_valid: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct LicenseData {
    hw_sig: String,
    uses: u32,
    lt: String,
    cs: String,
    /// Version field for future migrations
    #[serde(default)]
    v: u8,
    /// License key for Pro users
    #[serde(default)]
    license_key: Option<String>,
}

impl LicenseData {
    fn new(hardware_id: &str, uses: u32, license_type: &str) -> Self {
        let mut data = Self {
            hw_sig: Self::hash(hardware_id),
            uses,
            lt: license_type.to_string(),
            cs: String::new(),
            v: 2, // Current version with salt
            license_key: None,
        };
        data.cs = data.compute_checksum();
        data
    }

    fn compute_checksum(&self) -> String {
        let key_part = self.license_key.as_deref().unwrap_or("");
        let payload = format!(
            "{}:{}:{}:{}:{}",
            CHECKSUM_SALT, self.hw_sig, self.uses, self.lt, key_part
        );
        Self::hash(&payload)
    }

    /// Legacy checksum without salt (for migration)
    fn compute_legacy_checksum(&self) -> String {
        let payload = format!("{}:{}:{}", self.hw_sig, self.uses, self.lt);
        Self::hash(&payload)
    }

    fn is_valid(&self) -> bool {
        self.cs == self.compute_checksum()
    }

    /// Check if this is a legacy license (valid with old checksum)
    fn is_legacy_valid(&self) -> bool {
        self.v == 0 && self.cs == self.compute_legacy_checksum()
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
    pub fn get_state() -> SnappitResult<LicenseState> {
        // Rate limiting: return cached state if called too frequently
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_millis() as u64;

        let last = LAST_STATE_CHECK.load(Ordering::SeqCst);
        if now.saturating_sub(last) < MIN_CHECK_INTERVAL_MS {
            let cache = CACHED_STATE.get_or_init(|| std::sync::Mutex::new(None));
            if let Ok(guard) = cache.lock() {
                if let Some(state) = guard.clone() {
                    return Ok(state);
                }
            }
        }

        LAST_STATE_CHECK.store(now, Ordering::SeqCst);

        let data = Self::load_or_init()?;

        let license_type = match data.lt.as_str() {
            "p" => LicenseType::Full,
            _ => LicenseType::Trial,
        };

        let current_hw_hash = LicenseData::hash(&Self::get_hardware_uuid()?);
        let is_valid = data.is_valid() && data.hw_sig == current_hw_hash;

        let state = LicenseState {
            license_type,
            uses_remaining: data.uses,
            is_valid,
        };

        // Cache the state
        if let Some(cache) = CACHED_STATE.get() {
            if let Ok(mut guard) = cache.lock() {
                *guard = Some(state.clone());
            }
        }

        Ok(state)
    }

    pub fn is_trial_expired() -> SnappitResult<bool> {
        let state = Self::get_state()?;
        Ok(state.license_type == LicenseType::Trial && state.uses_remaining == 0)
    }

    pub fn consume_use() -> SnappitResult<u32> {
        let mut data = Self::load_or_init()?;

        if data.lt == "p" {
            return Ok(u32::MAX);
        }

        if !data.is_valid() {
            return Err(SnappitError::LicenseCorrupted);
        }

        if data.uses == 0 {
            return Err(SnappitError::TrialExpired);
        }

        data.uses = data.uses.saturating_sub(1);
        data.cs = data.compute_checksum();
        Self::save(&data)?;

        // Invalidate cache
        Self::invalidate_cache();

        Ok(data.uses)
    }

    pub fn activate_pro(license_key: String) -> SnappitResult<()> {
        let mut data = Self::load_or_init()?;
        data.lt = "p".to_string();
        data.license_key = Some(license_key);
        data.cs = data.compute_checksum();
        Self::save(&data)?;

        // Invalidate cache
        Self::invalidate_cache();

        Ok(())
    }

    pub fn get_license_key() -> SnappitResult<Option<String>> {
        let data = Self::load_or_init()?;
        Ok(data.license_key)
    }

    fn invalidate_cache() {
        if let Some(cache) = CACHED_STATE.get() {
            if let Ok(mut guard) = cache.lock() {
                *guard = None;
            }
        }
        LAST_STATE_CHECK.store(0, Ordering::SeqCst);
    }

    fn get_license_path() -> SnappitResult<PathBuf> {
        let home = std::env::var("HOME")
            .map_err(|_| SnappitError::License("Cannot determine home directory".to_string()))?;

        let app_support = PathBuf::from(&home)
            .join("Library")
            .join("Application Support")
            .join(LICENSE_FOLDER);

        if !app_support.exists() {
            fs::create_dir_all(&app_support)
                .map_err(|e| SnappitError::License(format!("Cannot create license dir: {}", e)))?;
        }

        Ok(app_support.join(LICENSE_FILE))
    }

    fn load_or_init() -> SnappitResult<LicenseData> {
        let path = Self::get_license_path()?;

        if path.exists() {
            let contents = fs::read(&path)
                .map_err(|e| SnappitError::License(format!("Cannot read license file: {}", e)))?;

            let decoded =
                base64::Engine::decode(&base64::engine::general_purpose::STANDARD, &contents)
                    .map_err(|_| SnappitError::LicenseCorrupted)?;

            let mut data: LicenseData =
                serde_json::from_slice(&decoded).map_err(|_| SnappitError::LicenseCorrupted)?;

            let current_hw_hash = LicenseData::hash(&Self::get_hardware_uuid()?);

            // Check current version validity
            if data.is_valid() && data.hw_sig == current_hw_hash {
                return Ok(data);
            }

            // Try to migrate legacy license (v0 without salt)
            if data.is_legacy_valid() && data.hw_sig == current_hw_hash {
                log::info!("Migrating legacy license to v2 format");
                data.v = 2;
                data.cs = data.compute_checksum();
                Self::save(&data)?;
                return Ok(data);
            }

            // Hardware changed or data corrupted - reinitialize
            Self::initialize()
        } else {
            Self::initialize()
        }
    }

    fn initialize() -> SnappitResult<LicenseData> {
        let hardware_id = Self::get_hardware_uuid()?;
        let data = LicenseData::new(&hardware_id, INITIAL_TRIAL_USES, "t");
        Self::save(&data)?;
        Ok(data)
    }

    fn save(data: &LicenseData) -> SnappitResult<()> {
        let path = Self::get_license_path()?;

        let json = serde_json::to_vec(data)
            .map_err(|e| SnappitError::License(format!("Cannot serialize license: {}", e)))?;

        let encoded = base64::Engine::encode(&base64::engine::general_purpose::STANDARD, &json);

        fs::write(&path, encoded.as_bytes())
            .map_err(|e| SnappitError::License(format!("Cannot write license file: {}", e)))?;

        Ok(())
    }

    /// Get hardware UUID using native macOS IOKit API
    #[cfg(target_os = "macos")]
    fn get_hardware_uuid() -> SnappitResult<String> {
        use core_foundation_sys::string::CFStringRef;

        #[link(name = "IOKit", kind = "framework")]
        extern "C" {
            fn IOServiceGetMatchingService(
                master_port: u32,
                matching: core_foundation_sys::dictionary::CFDictionaryRef,
            ) -> u32;
            fn IOServiceMatching(
                name: *const i8,
            ) -> core_foundation_sys::dictionary::CFMutableDictionaryRef;
            fn IORegistryEntryCreateCFProperty(
                entry: u32,
                key: CFStringRef,
                allocator: core_foundation_sys::base::CFAllocatorRef,
                options: u32,
            ) -> core_foundation_sys::base::CFTypeRef;
            fn IOObjectRelease(object: u32) -> i32;
        }

        const K_IO_MASTER_PORT_DEFAULT: u32 = 0;

        unsafe {
            let class_name = b"IOPlatformExpertDevice\0";
            let matching = IOServiceMatching(class_name.as_ptr() as *const i8);

            if matching.is_null() {
                return Err(SnappitError::License(
                    "Failed to create IOKit matching dictionary".to_string(),
                ));
            }

            let service = IOServiceGetMatchingService(K_IO_MASTER_PORT_DEFAULT, matching);

            if service == 0 {
                return Err(SnappitError::License(
                    "Failed to find IOPlatformExpertDevice".to_string(),
                ));
            }

            let key = CFString::new("IOPlatformUUID");
            let uuid_ref = IORegistryEntryCreateCFProperty(
                service,
                key.as_concrete_TypeRef(),
                kCFAllocatorDefault,
                0,
            );

            IOObjectRelease(service);

            if uuid_ref.is_null() {
                return Err(SnappitError::License(
                    "Failed to get IOPlatformUUID property".to_string(),
                ));
            }

            let cf_string: CFString = CFString::wrap_under_create_rule(uuid_ref as CFStringRef);
            let uuid = cf_string.to_string();

            if uuid.is_empty() {
                return Err(SnappitError::License("IOPlatformUUID is empty".to_string()));
            }

            Ok(uuid)
        }
    }

    #[cfg(not(target_os = "macos"))]
    fn get_hardware_uuid() -> SnappitResult<String> {
        Err(SnappitError::License(
            "Hardware UUID not supported on this platform".to_string(),
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
        assert_eq!(data.v, 2);
    }

    #[test]
    fn test_license_data_tamper_detection() {
        let mut data = LicenseData::new("test-hw-id", 30, "t");
        data.uses = 100; // Tamper with uses
        assert!(!data.is_valid());
    }

    #[test]
    fn test_checksum_includes_salt() {
        let data = LicenseData::new("test-hw-id", 30, "t");

        // Legacy checksum (without salt) should be different
        let legacy_cs = data.compute_legacy_checksum();
        let current_cs = data.compute_checksum();

        assert_ne!(legacy_cs, current_cs);
    }

    #[test]
    fn test_legacy_migration() {
        // Create a "legacy" license (v0, checksum without salt)
        let mut legacy_data = LicenseData {
            hw_sig: LicenseData::hash("test-hw-id"),
            uses: 15,
            lt: "t".to_string(),
            cs: String::new(),
            v: 0,
        };
        legacy_data.cs = legacy_data.compute_legacy_checksum();

        assert!(legacy_data.is_legacy_valid());
        assert!(!legacy_data.is_valid()); // Not valid with new checksum
    }
}
