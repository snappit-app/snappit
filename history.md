# Capture History - Технический план

## Обзор

Раздел "History" в настройках приложения для отображения истории всех захватов (OCR, QR, Color Picker) с персистентным хранением.

## Структура данных

```typescript
// Базовый интерфейс для всех элементов истории
interface BaseCaptureHistoryItem {
  id: string; // crypto.randomUUID()
  timestamp: number; // Date.now()
}

// OCR payload
interface OcrPayload {
  text: string;
  engine: "vision" | "tesseract";
}

// Ruler payload
interface RulerPayload {
  value: string;
}

// QR payload
interface QrPayload {
  content: string;
  format?: "url" | "text" | "vcard" | "wifi";
}

// Dropper payload
interface DropperPayload {
  hex: string;
  rgb: [number, number, number];
  formattedColor?: string;
}

// Типизированные элементы истории
interface OcrCaptureItem extends BaseCaptureHistoryItem {
  type: "ocr";
  payload: OcrPayload;
}

interface RulerCaptureItem extends BaseCaptureHistoryItem {
  type: "ruler";
  payload: RulerPayload;
}

interface QrCaptureItem extends BaseCaptureHistoryItem {
  type: "qr";
  payload: QrPayload;
}

interface DropperCaptureItem extends BaseCaptureHistoryItem {
  type: "dropper";
  payload: DropperPayload;
}

// Union type для всех элементов истории
type CaptureHistoryItem =
  | OcrCaptureItem
  | RulerCaptureItem
  | QrCaptureItem
  | DropperCaptureItem;

// Утилита для получения payload по типу
type PayloadByType<T extends CaptureHistoryItem["type"]> = Extract;
(CaptureHistoryItem, { type: T } > ["payload"]);
```

## Новые файлы

### shared/history/

- `types.ts` - типы CaptureHistoryItem
- `history_store.ts` - класс CaptureHistory (CRUD)
- `index.ts` - реэкспорт

### apps/settings/history/

- `history.tsx` - основной компонент раздела
- `history_item.tsx` - компонент записи
- `index.ts` - реэкспорт

## Изменяемые файлы

| Файл                                               | Изменение                       |
| -------------------------------------------------- | ------------------------------- |
| `constants.json`                                   | Добавить ключ `capture_history` |
| `apps/settings/settings_app.tsx`                   | Добавить таб History            |
| `apps/snap_overlay/area_selection/on_selected.ts`  | Сохранение OCR в историю        |
| `apps/snap_overlay/qr-scan/on_success.ts`          | Сохранение QR в историю         |
| `apps/snap_overlay/color_dropper/on_recognized.ts` | Сохранение цвета в историю      |

## UI

- Список записей (новые сверху)
- Каждая запись: иконка типа, результат, время, кнопки [копировать] [удалить]
- Кнопка "Clear All"
- Пустое состояние

## Параметры

- Лимит: 200 записей
- Без миниатюр (только текст)
- Без фильтрации/поиска (v1)
