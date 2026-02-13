-- Replace placeholder platform URLs with accessible pages
UPDATE courses SET metadata = jsonb_set(
  COALESCE(metadata, '{}'::jsonb),
  '{platform_url}', '"https://www.udemy.com/topic/breast-cancer/"'
) WHERE title = 'الدليل الشامل لفهم أورام الثدي';

UPDATE courses SET metadata = jsonb_set(
  COALESCE(metadata, '{}'::jsonb),
  '{platform_url}', '"https://www.udemy.com/topic/nutrition/"'
) WHERE title = 'التغذية السليمة أثناء العلاج الكيميائي';

UPDATE courses SET metadata = jsonb_set(
  COALESCE(metadata, '{}'::jsonb),
  '{platform_url}', '"https://www.udemy.com/topic/wound-care/"'
) WHERE title = 'العناية بالجروح بعد الجراحة';
