export interface Word {
  id: number;
  word: string;
  meaning: string;
  example: string;
  category: string;
  example_lao: string;
}

export const TOTAL_WORDS_COUNT = 200000;

export const CATEGORY_RANGES: Record<string, [number, number]> = {
  Daily: [0, 24000],
  Food: [24000, 40000],
  Health: [40000, 56000],
  Travel: [56000, 72000],
  Social: [72000, 88000],
  Work: [88000, 104000],
  Shopping: [104000, 120000],
  Technology: [120000, 136000],
  Education: [136000, 152000],
  Business: [152000, 168000],
  Entertainment: [168000, 184000],
  Nature: [184000, 200000],
};

export const CATEGORIES_LIST = [
  'All',
  'Daily',
  'Food',
  'Health',
  'Travel',
  'Social',
  'Work',
  'Shopping',
  'Technology',
  'Education',
  'Business',
  'Entertainment',
  'Nature',
];

export const CATEGORIES_CONFIG = [
  { name: 'Daily', total: 24000, emoji: '☀️', nameLao: 'ຊີວິດປະຈຳວັນ' },
  { name: 'Food', total: 16000, emoji: '🍔', nameLao: 'ອາຫານ ແລະ ເຄື່ອງດື່ມ' },
  { name: 'Health', total: 16000, emoji: '💊', nameLao: 'ສຸຂະພາບ ແລະ ການແພດ' },
  { name: 'Travel', total: 16000, emoji: '✈️', nameLao: 'ການທ່ອງທ່ຽວ ແລະ ເດີນທາງ' },
  { name: 'Social', total: 16000, emoji: '💬', nameLao: 'ການເຂົ້າສັງຄົມ ແລະ ໝູ່ເພື່ອນ' },
  { name: 'Work', total: 16000, emoji: '💼', nameLao: 'ການເຮັດວຽກ ແລະ ອາຊີບ' },
  { name: 'Shopping', total: 16000, emoji: '🛒', nameLao: 'ການຊື້ເຄື່ອງ ແລະ ສິນຄ້າ' },
  { name: 'Technology', total: 16000, emoji: '💻', nameLao: 'ເຕັກໂນໂລຊີ ແລະ ໄອທີ' },
  { name: 'Education', total: 16000, emoji: '🎓', nameLao: 'ການສຶກສາ ແລະ ການຮຽນຮູ້' },
  { name: 'Business', total: 16000, emoji: '📈', nameLao: 'ທຸລະກິດ ແລະ ການເງິນ' },
  { name: 'Entertainment', total: 16000, emoji: '🎬', nameLao: 'ບັນເທີງ, ດົນຕີ & ກິລາ' },
  { name: 'Nature', total: 16000, emoji: '🌿', nameLao: 'ທຳມະຊາດ ແລະ ສິ່ງແວດລ້ອມ' },
];

export function getCategoryByWordId(id: number): string {
  if (id <= 24000) return 'Daily';
  if (id <= 40000) return 'Food';
  if (id <= 56000) return 'Health';
  if (id <= 72000) return 'Travel';
  if (id <= 88000) return 'Social';
  if (id <= 104000) return 'Work';
  if (id <= 120000) return 'Shopping';
  if (id <= 136000) return 'Technology';
  if (id <= 152000) return 'Education';
  if (id <= 168000) return 'Business';
  if (id <= 184000) return 'Entertainment';
  return 'Nature';
}

