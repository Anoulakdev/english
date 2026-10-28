import daily from './categories/daily.json';
import health from './categories/health.json';
import travel from './categories/travel.json';
import social from './categories/social.json';
import food from './categories/food.json';
import work from './categories/work.json';
import shopping from './categories/shopping.json';
import technology from './categories/technology.json';
import education from './categories/education.json';
import business from './categories/business.json';
import entertainment from './categories/entertainment.json';
import nature from './categories/nature.json';

import {
  Word,
  TOTAL_WORDS_COUNT,
  CATEGORY_RANGES,
  CATEGORIES_LIST,
  CATEGORIES_CONFIG,
  getCategoryByWordId,
} from './wordsMeta';

export type { Word };
export {
  TOTAL_WORDS_COUNT,
  CATEGORY_RANGES,
  CATEGORIES_LIST,
  CATEGORIES_CONFIG,
  getCategoryByWordId,
};

const wordsData: Word[] = (daily as Word[]).concat(
  food as Word[],
  health as Word[],
  travel as Word[],
  social as Word[],
  work as Word[],
  shopping as Word[],
  technology as Word[],
  education as Word[],
  business as Word[],
  entertainment as Word[],
  nature as Word[]
);

export default wordsData;

