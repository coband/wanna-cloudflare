/* -------------------------------------------------------------
   Seed für Tabelle public.books – 5 Demo-Einträge
   Bei id/created_at greifen die DEFAULT-Werte (gen_random_uuid, now)
------------------------------------------------------------- */

INSERT INTO public.books (
    id,            title,                              author,
    isbn,          subject,      level,   year,
    location,      description,                      publisher,
    type,          available,  borrowed_at, borrowed_by,
    user_id,       has_pdf,   school
) VALUES
/* 1 */
(
    gen_random_uuid(),
    'Die fantastische Welt der Quanten',
    'Dr. Lara Neumann',
    '978-3-518-12345-6',
    'Physik',
    'Sek II',
    2023,
    'Regal A3',
    'Ein anschaulicher Einstieg in die Quantenmechanik.',
    'WissenschaftsVerlag',
    'Sachbuch',
    true,          -- verfügbar
    NULL, NULL,    -- nicht entliehen
    NULL,
    false,
    'Gymnasium Musterstadt'
),
/* 2 */
(
    gen_random_uuid(),
    'Geschichten aus dem Code-Universum',
    'Felix Meyer',
    '978-1-59327-599-0',
    'Informatik',
    'Sek I',
    2021,
    'Regal B1',
    'Kurze Erzählungen, die Programmierkonzepte erklären.',
    'TechLit',
    'Erzählband',
    true,
    NULL, NULL,
    NULL,
    true,          -- enthält PDF
    'Sekundarschule Nord'
),
/* 3 – bereits ausgeliehen */
(
    gen_random_uuid(),
    'Kunstgeschichte kompakt',
    'Prof. Anna Roth',
    '978-3-7608-2774-2',
    'Kunst',
    'Sek II',
    2020,
    'Regal C2',
    'Überblick über Stilrichtungen von der Antike bis zur Moderne.',
    'BildungPlus',
    'Lehrbuch',
    false,                         -- nicht verfügbar
    now() - interval '3 days',     -- seit 3 Tagen entliehen
    gen_random_uuid(),             -- borrowed_by (Demo-UUID)
    gen_random_uuid(),             -- user_id    (Demo-UUID)
    false,
    'Gesamtschule West'
),
/* 4 */
(
    gen_random_uuid(),
    'Abenteuer Mathe: Rätsel & Logik',
    'Sabine Fischer',
    '978-0-385-50420-1',
    'Mathematik',
    'Primarstufe',
    2019,
    'Regal D4',
    'Knobelaufgaben, die mathematisches Denken fördern.',
    'KidsLearn',
    'Arbeitsheft',
    true,
    NULL, NULL,
    NULL,
    false,
    'Primarschule Sonnenweg'
),
/* 5 */
(
    gen_random_uuid(),
    'Global Challenges – Geografie im 21. Jhd.',
    'Carlos Díaz',
    '978-0-19-873983-8',
    'Geografie',
    'Sek II',
    2024,
    'Regal E1',
    'Aktuelle geographische Fragestellungen und Fallstudien.',
    'WorldEdu',
    'Schulbuch',
    true,
    NULL, NULL,
    NULL,
    true,
    'Gymnasium Musterstadt'
);

-- Fertig.
