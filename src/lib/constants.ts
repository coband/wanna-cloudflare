export const SUBJECTS = [
    "Mathematik",
    "Deutsch",
    "Natur Mensch Gesellschaft",
    "Englisch",
    "Französisch",
    "Bildnerisches Gestalten",
    "Sport",
    "Textiles und Technisches Gestalten",
    "Musik",
    "Medien und Informatik",
    "Religion Kultur Ethik",
    "Divers",
] as const;

export type Subject = typeof SUBJECTS[number];

export const MEDIA_TYPES = [
    "Buch",
    "Lehrmittel",
    "Fachbuch",
    "Spiel",
    "Material",
    "Divers",
] as const;

export type MediaType = typeof MEDIA_TYPES[number];

export const LEVELS = [
    "Kindergarten",
    "1. Klasse",
    "2. Klasse",
    "3. Klasse",
    "4. Klasse",
    "5. Klasse",
    "6. Klasse",
    "7. Klasse",
    "8. Klasse",
    "9. Klasse",
    "Erwachsenenbildung",
] as const;

export type Level = typeof LEVELS[number];
