UPDATE courses SET metadata = jsonb_build_object(
  'platform_url', 'https://example-edu.com/courses/1',
  'learning_outcomes', jsonb_build_array(
    'فهم أساسي لأنواع أورام الثدي',
    'التعرف على الأعراض المبكرة وطرق التشخيص',
    'إرشادات أولية لإدارة الحالة والمتابعة'
  )
) WHERE title = 'الدليل الشامل لفهم أورام الثدي';

UPDATE courses SET metadata = jsonb_build_object(
  'platform_url', 'https://example-edu.com/courses/2',
  'learning_outcomes', jsonb_build_array(
    'تخطيط وجبات مناسبة أثناء العلاج',
    'تفادي سوء التغذية وإدارة الآثار الجانبية',
    'إستراتيجيات دعم المناعة'
  )
) WHERE title = 'التغذية السليمة أثناء العلاج الكيميائي';

UPDATE courses SET metadata = jsonb_build_object(
  'platform_url', 'https://example-edu.com/courses/3',
  'learning_outcomes', jsonb_build_array(
    'أساسيات العناية بالجروح بعد الجراحة',
    'تقليل المخاطر والمضاعفات',
    'متى يجب مراجعة الطبيب'
  )
) WHERE title = 'العناية بالجروح بعد الجراحة';

UPDATE lessons SET video_url = 'https://www.youtube.com/embed/aqz-KE-bpKQ' WHERE title = 'مقدمة عن أورام الثدي';
UPDATE lessons SET video_url = 'https://www.youtube.com/embed/5NV6Rdv1a3I' WHERE title = 'أعراض أورام الثدي المبكرة';
UPDATE lessons SET video_url = 'https://www.youtube.com/embed/IUN664s7N-c' WHERE title = 'طرق التشخيص الحديثة';
