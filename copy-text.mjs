export function selectCopyText(field) {
  field.focus({ preventScroll: true });
  field.select();
  field.setSelectionRange(0, field.value.length);
}

export const manualCopyHint = 'Text selected. Press Ctrl+C (Windows) or Command+C (Mac). On a phone or tablet, touch and hold the text and choose Copy.';

export async function copyText(field) {
  const text = field.value;
  const previous = document.activeElement;
  // This compatibility path must run inside the original click, before any await.
  // Some browsers allow selection-based copy when the newer clipboard API is unavailable.
  selectCopyText(field);
  let copied = false;
  try { copied = document.execCommand('copy') === true; } catch { /* Try the modern API below. */ }
  if (!copied) {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        copied = true;
      }
    } catch { /* Keep the text selected for manual copying. */ }
  }
  if (copied) previous?.focus({ preventScroll: true });
  else selectCopyText(field);
  return copied;
}
