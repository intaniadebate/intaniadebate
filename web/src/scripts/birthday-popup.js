const dialog = document.querySelector('[data-birthday-dialog]');
const birthdayDate = '2026-10-18';
const storageKey = `idc:birthday-dismissed:${birthdayDate}`;

function bangkokDate() {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function wasDismissed() {
  try {
    return window.localStorage.getItem(storageKey) === birthdayDate;
  } catch {
    return false;
  }
}

function rememberDismissal() {
  try {
    window.localStorage.setItem(storageKey, birthdayDate);
  } catch {
    // Keep the dialog usable when storage is unavailable.
  }
}

if (
  dialog instanceof HTMLDialogElement &&
  bangkokDate() === birthdayDate &&
  !wasDismissed() &&
  typeof dialog.showModal === 'function'
) {
  dialog.showModal();
  dialog.addEventListener('close', rememberDismissal, { once: true });
}
