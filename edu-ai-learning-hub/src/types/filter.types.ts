// src/types/filter.types.ts

/**
 * Represents an item in the category filter.
 */
export interface CategoryFilterItem {
  categoryId: number;
  categoryName: string;
  courseCount?: number; // Optional: display number of courses in this category
}

/**
 * Represents an item in the course level filter.
 */
export interface LevelFilterItem {
  levelId: number;
  levelName: string; // e.g., 'Beginner', 'Intermediate', 'Advanced', 'All Levels'
  courseCount?: number; // Optional
}

/**
 * Represents an item in the language filter.
 */
export interface LanguageFilterItem {
  languageCode: string; // e.g., 'en', 'es', 'vi'
  languageName: string; // e.g., 'English', 'Spanish', 'Vietnamese'
  courseCount?: number; // Optional
}

/**
 * Represents an option in the rating filter.
 */
export interface RatingFilterOption {
  value: number; // The minimum rating value (e.g., 4.5, 4, 3.5)
  label: string; // Text to display (e.g., '4.5 & Up')
  stars?: number; // Optional: number of full stars to visually represent this option
}

/**
 * Represents the state of the price range filter.
 * This is typically not a list of items but rather the selected range.
 */
export interface PriceRangeFilter {
  minPrice: number | null; // null if no minimum is set
  maxPrice: number | null; // null if no maximum is set (or up to MAX_COURSE_PRICE)
}

/**
 * Represents a generic boolean filter option, e.g., for 'Free Courses' or 'Featured'.
 */
export interface BooleanFilterOption {
  id: string; // Unique identifier for the checkbox/switch
  label: string; // Text to display (e.g., 'Only Free Courses', 'Featured Courses')
  filterKey: string; // The corresponding key in CourseQueryParams (e.g., 'isFree', 'isFeatured')
}

// You can also define a more generic filter item if needed, for example:
// export interface GenericFilterItem {
//   id: string | number;
//   name: string;
//   count?: number;
// }
