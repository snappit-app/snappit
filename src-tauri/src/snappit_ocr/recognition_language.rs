use crate::{
    snappit_consts::SNAPPIT_CONSTS, snappit_errors::SnappitResult, snappit_store::SnappitStore,
};

pub const FALLBACK_RECOGNITION_LANGUAGE: &str = "eng";

pub fn default_recognition_language() -> String {
    let mut prioritized: Vec<&'static str> = Vec::new();

    for locale in sys_locale::get_locales() {
        if let Some(code) = map_locale_to_recognition_code(&locale) {
            if !prioritized.iter().any(|existing| existing == &code) {
                prioritized.push(code);
            }
        }
    }

    if prioritized.is_empty() {
        return FALLBACK_RECOGNITION_LANGUAGE.to_string();
    }

    let combined = prioritized.join("+");
    sanitize_recognition_language(&combined)
        .unwrap_or_else(|| FALLBACK_RECOGNITION_LANGUAGE.to_string())
}

pub fn get_system_recognition_languages() -> Vec<String> {
    let mut prioritized: Vec<&'static str> = Vec::new();

    for locale in sys_locale::get_locales() {
        if let Some(code) = map_locale_to_recognition_code(&locale) {
            if !prioritized.iter().any(|existing| existing == &code) {
                prioritized.push(code);
            }
        }
    }

    prioritized.into_iter().map(String::from).collect()
}

fn map_locale_to_recognition_code(locale: &str) -> Option<&'static str> {
    let normalized = locale.trim();
    if normalized.is_empty() {
        return None;
    }

    let normalized = normalized.replace('_', "-");
    let segments: Vec<String> = normalized
        .split('-')
        .map(|segment| segment.trim().to_ascii_lowercase())
        .filter(|segment| !segment.is_empty())
        .collect();

    let Some(language) = segments.get(0) else {
        return None;
    };

    match language.as_str() {
        "en" => Some("eng"),
        "ru" => Some("rus"),
        "zh" => {
            let is_traditional = segments
                .iter()
                .skip(1)
                .any(|segment| matches!(segment.as_str(), "hant" | "tw" | "hk" | "mo"));

            if is_traditional {
                Some("chi_tra")
            } else {
                Some("chi_sim")
            }
        }
        "ja" => Some("jpn"),
        "ko" => Some("kor"),
        "es" => Some("spa"),
        "fr" => Some("fra"),
        "de" => Some("deu"),
        "th" => Some("tha"),
        "ka" => Some("kat"),
        _ => None,
    }
}

pub fn sanitize_recognition_language(raw: &str) -> Option<String> {
    let mut unique: Vec<String> = Vec::new();

    for code in raw.split('+') {
        let trimmed = code.trim().to_lowercase();
        if !trimmed.is_empty() && !unique.iter().any(|c| c == &trimmed) {
            unique.push(trimmed);
        }
    }

    if unique.is_empty() {
        None
    } else {
        Some(unique.join("+"))
    }
}

pub fn resolve_recognition_language(app: &tauri::AppHandle) -> SnappitResult<String> {
    let key = SNAPPIT_CONSTS.store.keys.recognition_lang.as_str();
    let value =
        SnappitStore::get_value(app, key)?.and_then(|stored| stored.as_str().map(String::from));

    let default_language = default_recognition_language();
    let lang = match value {
        Some(lang) => {
            let trimmed = lang.trim();
            if trimmed.eq_ignore_ascii_case("auto") || trimmed.is_empty() {
                default_language
            } else {
                sanitize_recognition_language(trimmed).unwrap_or(default_language)
            }
        }
        None => default_language,
    };

    Ok(lang)
}

pub fn split_recognition_languages(value: &str) -> Vec<String> {
    value
        .split('+')
        .filter_map(|code| {
            let trimmed = code.trim();
            if trimmed.is_empty() {
                None
            } else {
                Some(trimmed.to_string())
            }
        })
        .collect()
}

pub fn languages_match_system(languages: &[String], system_languages: &[String]) -> bool {
    if languages.is_empty() {
        return false;
    }

    languages.iter().all(|lang| {
        system_languages
            .iter()
            .any(|system_lang| system_lang.eq_ignore_ascii_case(lang))
    })
}
