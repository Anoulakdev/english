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

export interface Word {
  id: number;
  word: string;
  meaning: string;
  example: string;
  category: string;
  example_lao: string;
}

const wordsData: Word[] = (daily as Word[]).concat(
  health as Word[],
  travel as Word[],
  social as Word[],
  food as Word[],
  work as Word[],
  shopping as Word[],
  technology as Word[],
  education as Word[],
  business as Word[],
  entertainment as Word[],
  nature as Word[]
);

export const CATEGORY_RANGES: Record<string, [number, number]> = {
  Daily: [0, 24000],
  Health: [24000, 40000],
  Travel: [40000, 56000],
  Social: [56000, 72000],
  Food: [72000, 88000],
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
  'Health',
  'Travel',
  'Social',
  'Food',
  'Work',
  'Shopping',
  'Technology',
  'Education',
  'Business',
  'Entertainment',
  'Nature',
];

export default wordsData;

