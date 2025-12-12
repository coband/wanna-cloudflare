/* -------------------------------------------------------------
   Seed Data for 'global_books' and 'organization_inventory'
   Replaces legacy 'books' table seed.
------------------------------------------------------------- */

DO $$
DECLARE
    -- Define UUIDs for our seed books to maintain relationships
    b1_id uuid := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    b2_id uuid := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12';
    b3_id uuid := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13';
    b4_id uuid := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14';
    b5_id uuid := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15';
    
    -- Demo User IDs
    user1_id uuid := gen_random_uuid();
    user2_id uuid := gen_random_uuid();
BEGIN

    -- 1. Insert into GLOBAL_BOOKS
    -- Note: 'level' is now an array text[]
    
    INSERT INTO public.global_books (
        id, title, author, isbn, subject, level, year, description, publisher, type, cover_image
    ) VALUES
    (
        b1_id,
        'Die fantastische Welt der Quanten',
        'Dr. Lara Neumann',
        '978-3-518-12345-6',
        'Physik',
        ARRAY['Sek II'],
        2023,
        'Ein anschaulicher Einstieg in die Quantenmechanik.',
        'WissenschaftsVerlag',
        'Sachbuch',
        NULL
    ),
    (
        b2_id,
        'Geschichten aus dem Code-Universum',
        'Felix Meyer',
        '978-1-59327-599-0',
        'Informatik',
        ARRAY['Sek I'],
        2021,
        'Kurze Erzählungen, die Programmierkonzepte erklären.',
        'TechLit',
        'Erzählband',
        NULL
    ),
    (
        b3_id,
        'Kunstgeschichte kompakt',
        'Prof. Anna Roth',
        '978-3-7608-2774-2',
        'Kunst',
        ARRAY['Sek II'],
        2020,
        'Überblick über Stilrichtungen von der Antike bis zur Moderne.',
        'BildungPlus',
        'Lehrbuch',
        NULL
    ),
    (
        b4_id,
        'Abenteuer Mathe: Rätsel & Logik',
        'Sabine Fischer',
        '978-0-385-50420-1',
        'Mathematik',
        ARRAY['Primarstufe'],
        2019,
        'Knobelaufgaben, die mathematisches Denken fördern.',
        'KidsLearn',
        'Arbeitsheft',
        NULL
    ),
    (
        b5_id,
        'Global Challenges – Geografie im 21. Jhd.',
        'Carlos Díaz',
        '978-0-19-873983-8',
        'Geografie',
        ARRAY['Sek II'],
        2024,
        'Aktuelle geographische Fragestellungen und Fallstudien.',
        'WorldEdu',
        'Schulbuch',
        NULL
    )
    ON CONFLICT (id) DO NOTHING; -- Avoid errors if run multiple times (though reset clears it)


    -- 2. Insert into ORGANIZATION_INVENTORY
    
    INSERT INTO public.organization_inventory (
        organization_id, global_book_id, location, available, has_pdf, borrowed_by, borrowed_at, user_id
    ) VALUES
    -- Book 1: Gymnasium Musterstadt
    (
        'org_36QT7UnUgbZVokQJqiPfWM1Ujpa', -- formerly 'school'
        b1_id,
        'Regal A3',
        true,
        false,
        NULL, NULL,
        NULL
    ),
    -- Book 2: Sekundarschule Nord
    (
        'org_36QT7UnUgbZVokQJqiPfWM1Ujpa',
        b2_id,
        'Regal B1',
        true,
        true,
        NULL, NULL,
        NULL
    ),
    -- Book 3: Gesamtschule West (Borrowed)
    (
        'org_36QT7UnUgbZVokQJqiPfWM1Ujpa',
        b3_id,
        'Regal C2',
        false,
        false,
        user1_id::text,            -- Borrowed by
        now() - interval '3 days', -- Borrowed at
        user2_id::text             -- Added by user
    ),
    -- Book 4: Primarschule Sonnenweg
    (
        'org_36QT7UnUgbZVokQJqiPfWM1Ujpa',
        b4_id,
        'Regal D4',
        true,
        false,
        NULL, NULL,
        NULL
    ),
    -- Book 5: Gymnasium Musterstadt
    (
        'org_36QT7UnUgbZVokQJqiPfWM1Ujpa',
        b5_id,
        'Regal E1',
        true,
        true,
        NULL, NULL,
        NULL
    );

END $$;
