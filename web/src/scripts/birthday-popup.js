const dialog = document.querySelector('[data-birthday-dialog]');
const birthdayDate = '2026-10-18';

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

if (
  dialog instanceof HTMLDialogElement &&
  bangkokDate() === birthdayDate &&
  typeof dialog.showModal === 'function'
) {
  dialog.showModal();
}
