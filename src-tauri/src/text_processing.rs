/// Проверяет, является ли символ тайским
fn is_thai(c: char) -> bool {
    ('\u{0E00}'..='\u{0E7F}').contains(&c)
}

/// Проверяет, является ли символ CJK (Chinese/Japanese/Korean)
fn is_cjk(c: char) -> bool {
    matches!(
        c,
        '\u{4E00}'..='\u{9FFF}'   |  // CJK Unified Ideographs
        '\u{3400}'..='\u{4DBF}'   |  // CJK Unified Ideographs Extension A
        '\u{3040}'..='\u{309F}'   |  // Hiragana
        '\u{30A0}'..='\u{30FF}'   |  // Katakana
        '\u{AC00}'..='\u{D7AF}'   |  // Hangul Syllables
        '\u{1100}'..='\u{11FF}'   |  // Hangul Jamo
        '\u{3130}'..='\u{318F}'      // Hangul Compatibility Jamo
    )
}

/// Проверяет, является ли символ частью языка без пробелов (Thai/CJK)
fn is_non_spaced_script(c: char) -> bool {
    is_thai(c) || is_cjk(c)
}

/// Удаляет лишние пробелы между символами Thai/CJK, сохраняя пробелы для латиницы
pub fn remove_non_spaced_script_spaces(text: &str) -> String {
    let chars: Vec<char> = text.chars().collect();
    let mut result = String::with_capacity(text.len());

    for (i, &c) in chars.iter().enumerate() {
        if c == ' ' {
            let prev = if i > 0 { Some(chars[i - 1]) } else { None };
            let next = chars.get(i + 1).copied();

            let skip_space = match (prev, next) {
                (Some(p), Some(n)) => is_non_spaced_script(p) && is_non_spaced_script(n),
                _ => false,
            };

            if !skip_space {
                result.push(c);
            }
        } else {
            result.push(c);
        }
    }

    result
}

/// Удаляет лишние переносы строк, заменяя их на пробелы
pub fn collapse_line_breaks(text: &str) -> String {
    let mut result = String::new();
    let mut prev_was_newline = false;

    for ch in text.chars() {
        if ch == '\n' {
            if !prev_was_newline && !result.is_empty() {
                result.push(' ');
            }
            prev_was_newline = true;
        } else {
            result.push(ch);
            prev_was_newline = false;
        }
    }

    result.trim().to_string()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_remove_thai_spaces() {
        assert_eq!(remove_non_spaced_script_spaces("ส ว ั ส ด ี"), "สวัสดี");
    }

    #[test]
    fn test_mixed_thai_english() {
        assert_eq!(
            remove_non_spaced_script_spaces("Hello ส ว ั ส ด ี World"),
            "Hello สวัสดี World"
        );
    }

    #[test]
    fn test_remove_chinese_spaces() {
        assert_eq!(remove_non_spaced_script_spaces("你 好 世 界"), "你好世界");
    }

    #[test]
    fn test_mixed_chinese_english() {
        assert_eq!(
            remove_non_spaced_script_spaces("Hello 你 好 World"),
            "Hello 你好 World"
        );
    }

    #[test]
    fn test_remove_japanese_spaces() {
        assert_eq!(
            remove_non_spaced_script_spaces("こ ん に ち は"),
            "こんにちは"
        );
    }

    #[test]
    fn test_english_preserved() {
        assert_eq!(
            remove_non_spaced_script_spaces("Hello World"),
            "Hello World"
        );
    }

    #[test]
    fn test_collapse_line_breaks() {
        assert_eq!(collapse_line_breaks("Hello\nWorld"), "Hello World");
        assert_eq!(collapse_line_breaks("Hello\n\nWorld"), "Hello World");
    }
}
