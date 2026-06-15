import NepaliDate from 'nepali-date-converter';

const BS_MONTHS_EN = ['Baishakh', 'Jestha', 'Ashadh', 'Shrawan', 'Bhadra', 'Ashwin', 'Kartik', 'Mangsir', 'Poush', 'Magh', 'Falgun', 'Chaitra'];
const BS_MONTHS_NE = ['बैशाख', 'जेठ', 'असार', 'साउन', 'भदौ', 'असोज', 'कात्तिक', 'मंसिर', 'पुस', 'माघ', 'फागुन', 'चैत'];

export function adToBS(date) {
  if (!date) return '';
  try {
    const nd = new NepaliDate(new Date(date));
    return `${nd.getYear()}-${String(nd.getMonth() + 1).padStart(2, '0')}-${String(nd.getDate()).padStart(2, '0')}`;
  } catch {
    return '';
  }
}

export function bsToAD(bsDateStr) {
  if (!bsDateStr) return null;
  try {
    const parts = bsDateStr.split('-').map(Number);
    if (parts.length !== 3) return null;
    const nd = new NepaliDate(parts[0], parts[1] - 1, parts[2]);
    return nd.toJsDate();
  } catch {
    return null;
  }
}

export function formatBSDate(date, locale = 'en') {
  if (!date) return '';
  try {
    const nd = new NepaliDate(new Date(date));
    const months = locale === 'ne' ? BS_MONTHS_NE : BS_MONTHS_EN;
    return `${nd.getDate()} ${months[nd.getMonth()]} ${nd.getYear()}`;
  } catch {
    return '';
  }
}

export function formatADDate(date) {
  if (!date) return '';
  try {
    return new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return '';
  }
}

export function formatDate(date, useBSDate = false, locale = 'en') {
  if (!date) return '';
  return useBSDate ? formatBSDate(date, locale) : formatADDate(date);
}

export function getCurrentBSDate() {
  try {
    const nd = new NepaliDate(new Date());
    return `${nd.getYear()}-${String(nd.getMonth() + 1).padStart(2, '0')}-${String(nd.getDate()).padStart(2, '0')}`;
  } catch {
    return '';
  }
}

export function getCurrentBSYear() {
  try {
    return new NepaliDate(new Date()).getYear();
  } catch {
    return new Date().getFullYear() + 57;
  }
}
