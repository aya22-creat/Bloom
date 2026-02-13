-- Community Support Database Schema for Breast Cancer Support
-- This migration creates tables for sessions, specialists, news, categories, authors, and bookings

-- Create specialists table
CREATE TABLE IF NOT EXISTS specialists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    photo_url VARCHAR(500),
    specialization VARCHAR(255) NOT NULL,
    qualifications TEXT,
    experience VARCHAR(100),
    rating FLOAT DEFAULT 0,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    color VARCHAR(7) DEFAULT '#FFB6C1',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create authors table
CREATE TABLE IF NOT EXISTS authors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    specialization VARCHAR(255),
    photo_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    location VARCHAR(255) NOT NULL,
    coordinates JSONB,
    session_date DATE NOT NULL,
    session_time TIME NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    capacity INTEGER DEFAULT 20,
    available_spots INTEGER DEFAULT 20,
    booking_link VARCHAR(500),
    specialist_id UUID REFERENCES specialists(id),
    images JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create news table
CREATE TABLE IF NOT EXISTS news (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    excerpt VARCHAR(500),
    image_url VARCHAR(500),
    category_id UUID REFERENCES categories(id),
    author_id UUID REFERENCES authors(id),
    tags JSONB DEFAULT '[]',
    read_time INTEGER DEFAULT 5,
    published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES sessions(id),
    user_id UUID,
    user_email VARCHAR(255) NOT NULL,
    user_phone VARCHAR(20),
    booking_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'confirmed',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_sessions_location ON sessions(location);
CREATE INDEX IF NOT EXISTS idx_sessions_active ON sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_sessions_specialist ON sessions(specialist_id);
CREATE INDEX IF NOT EXISTS idx_news_published ON news(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_category ON news(category_id);
CREATE INDEX IF NOT EXISTS idx_news_author ON news(author_id);
CREATE INDEX IF NOT EXISTS idx_bookings_session ON bookings(session_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_email ON bookings(user_email);

-- Set up Row Level Security (RLS)
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE specialists ENABLE ROW LEVEL SECURITY;
ALTER TABLE news ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Create policies for sessions
CREATE POLICY "Sessions are viewable by everyone" ON sessions
    FOR SELECT USING (is_active = true);

CREATE POLICY "Sessions can be created by admins" ON sessions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Sessions can be updated by admins" ON sessions
    FOR UPDATE WITH CHECK (true);

-- Create policies for specialists
CREATE POLICY "Specialists are viewable by everyone" ON specialists
    FOR SELECT USING (is_verified = true);

CREATE POLICY "Specialists can be managed by admins" ON specialists
    FOR ALL USING (true);

-- Create policies for news
CREATE POLICY "News are viewable by everyone" ON news
    FOR SELECT USING (published_at <= NOW());

CREATE POLICY "News can be managed by admins" ON news
    FOR ALL USING (true);

-- Create policies for categories
CREATE POLICY "Categories are viewable by everyone" ON categories
    FOR SELECT USING (true);

CREATE POLICY "Categories can be managed by admins" ON categories
    FOR ALL USING (true);

-- Create policies for authors
CREATE POLICY "Authors are viewable by everyone" ON authors
    FOR SELECT USING (true);

CREATE POLICY "Authors can be managed by admins" ON authors
    FOR ALL USING (true);

-- Create policies for bookings
CREATE POLICY "Users can create bookings" ON bookings
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view their own bookings" ON bookings
    FOR SELECT USING (user_id = auth.uid() OR user_email = auth.jwt() ->> 'email');

CREATE POLICY "Bookings can be managed by admins" ON bookings
    FOR ALL USING (true);

-- Grant permissions to anon and authenticated roles
GRANT SELECT ON sessions TO anon;
GRANT SELECT ON sessions TO authenticated;
GRANT SELECT ON specialists TO anon;
GRANT SELECT ON specialists TO authenticated;
GRANT SELECT ON news TO anon;
GRANT SELECT ON news TO authenticated;
GRANT SELECT ON categories TO anon;
GRANT SELECT ON categories TO authenticated;
GRANT SELECT ON authors TO anon;
GRANT SELECT ON authors TO authenticated;
GRANT ALL ON bookings TO authenticated;

-- Insert initial data
INSERT INTO categories (name, slug, color) VALUES
    ('أخبار طبية', 'medical-news', '#FF6B6B'),
    ('نصائح وإرشادات', 'tips-guidance', '#4ECDC4'),
    ('قصص نجاح', 'success-stories', '#45B7D1'),
    ('علاج ودواء', 'treatment-medication', '#96CEB4'),
    ('دعم نفسي', 'psychological-support', '#F7DC6F'),
    ('تغذية وصحة', 'nutrition-health', '#82E0AA')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO authors (name, specialization, photo_url) VALUES
    ('د. سارة أحمد', 'أخصائية أورام', 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&h=150&fit=crop&crop=face'),
    ('د. أحمد محمد', 'طبيب نفسي', 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150&h=150&fit=crop&crop=face'),
    ('د. منى حسن', 'أخصائية تغذية', 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=150&h=150&fit=crop&crop=face'),
    ('د. خالد إبراهيم', 'جراح أورام', 'https://images.unsplash.com/photo-1582750433449-6485201c6752?w=150&h=150&fit=crop&crop=face')
ON CONFLICT DO NOTHING;

INSERT INTO specialists (name, photo_url, specialization, qualifications, experience, rating, is_verified) VALUES
    ('د. أحمد محمد', 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150&h=150&fit=crop&crop=face', 'طبيب نفسي', 'دكتوراه في الطب النفسي - جامعة القاهرة', '15 سنة', 4.8, true),
    ('د. سارة أحمد', 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&h=150&fit=crop&crop=face', 'أخصائية أورام', 'دكتوراه في الأورام - جامعة عين شمس', '12 سنة', 4.9, true),
    ('د. منى حسن', 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=150&h=150&fit=crop&crop=face', 'أخصائية تغذية', 'ماجستير في التغذية العلاجية - جامعة الإسكندرية', '10 سنوات', 4.7, true),
    ('د. خالد إبراهيم', 'https://images.unsplash.com/photo-1582750433449-6485201c6752?w=150&h=150&fit=crop&crop=face', 'جراح أورام', 'زمالة الجراحة الأورامية - المعهد القومي للأورام', '20 سنة', 4.9, true)
ON CONFLICT DO NOTHING;

INSERT INTO sessions (title, description, location, coordinates, session_date, session_time, duration_minutes, capacity, available_spots, booking_link, specialist_id, images, is_active) VALUES
    ('جلسة دعم نفسي لمرضى سرطان الثدي', 'جلسة دعم نفسي جماعية تهدف إلى مساعدة المرضى على التعامل مع التحديات النفسية المصاحبة للمرض والعلاج. نناقش استراتيجيات التكيف وإدارة التوتر.', 'القاهرة - عيادة الدكتور أحمد محمد', '{"lat": 30.0444, "lng": 31.2357}', '2024-02-15', '14:00', 120, 15, 12, 'https://calendly.com/dr-ahmed-psych/support-session', (SELECT id FROM specialists WHERE name = 'د. أحمد محمد' LIMIT 1), '["https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&h=300&fit=crop"]', true),
    
    ('ورشة التغذية السليمة أثناء العلاج', 'ورشة تعليمية حول أهمية التغذية السليمة أثناء فترة العلاج الكيميائي والإشعاعي. نقدم نصائح عملية وخطة وجبات مخصصة.', 'الإسكندرية - المركز الطبي للتغذية', '{"lat": 31.2001, "lng": 29.9187}', '2024-02-20', '16:00', 90, 20, 18, 'https://forms.gle/nutrition-workshop', (SELECT id FROM specialists WHERE name = 'د. منى حسن' LIMIT 1), '["https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&h=300&fit=crop"]', true),
    
    ('جلسة دعم للأسر والمقربين', 'جلسة دعم خاصة بأسر المرضى لمساعدتهم على فهم احتياجات المريضة وتقديم الدعم المناسب خلال فترة العلاج.', 'الجيزة - مركز الدعم النفسي', '{"lat": 30.0131, "lng": 31.2089}', '2024-02-18', '18:00', 105, 12, 8, 'https://wa.me/20123456789?text=أريد_الحجز_في_جلسة_دعم_الأسر', (SELECT id FROM specialists WHERE name = 'د. أحمد محمد' LIMIT 1), '["https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=300&fit=crop"]', true),
    
    ('التمارين الرياضية المخصصة بعد الجراحة', 'برنامج تمارين مخصص لمرضى سرطان الثدي بعد الجراحة لتحسين الحركة والقوة وتقليل الآثار الجانبية.', 'القاهرة - نادي الصحة واللياقة', '{"lat": 30.0444, "lng": 31.2357}', '2024-02-22', '09:00', 75, 10, 7, 'https://forms.gle/exercise-program', (SELECT id FROM specialists WHERE name = 'د. خالد إبراهيم' LIMIT 1), '["https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop"]', true),
    
    ('جلسة التثقيف حول الخيارات العلاجية', 'جلسة توعية شاملة حول مختلف خيارات العلاج المتاحة لسرطان الثدي ومناقشة الآثار الجانبية والنتائج المتوقعة.', 'الإسكندرية - مستشفى الأورام', '{"lat": 31.2001, "lng": 29.9187}', '2024-02-25', '11:00', 120, 25, 20, 'https://calendly.com/dr-sara-oncology/education-session', (SELECT id FROM specialists WHERE name = 'د. سارة أحمد' LIMIT 1), '["https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=400&h=300&fit=crop"]', true)
ON CONFLICT DO NOTHING;

INSERT INTO news (title, content, excerpt, image_url, category_id, author_id, tags, read_time, published_at) VALUES
    ('اكتشاف جديد في علاج سرطان الثدي يعد بنتائج واعدة', 'أعلن فريق من الباحثين المصريين عن اكتشاف جديد في مجال علاج سرطان الثدي يعتمد على تقنيات المناعة الحديثة. ويُعد هذا الاكتشاف خطوة مهمة نحو تطوير علاجات أكثر فعالية وأقل آثاراً جانبية.\n\nوقال الدكتور أحمد حسن، رئيس فريق البحث: "لقد تمكنا من تطوير بروتوكول علاجي جديد يستهدف الخلايا السرطانية دون التأثير على الخلايا السليمة، مما يقلل من الآثار الجانبية المصاحبة للعلاج التقليدي."\n\nوأضاف أن الدراسة أجريت على مجموعة من المرضى وأظهرت نتائج مبشرة، حيث تحسنت حالة %80 من المشاركين في التجربة.\n\nوتابع: "نحن الآن في مرحلة التحضير لتوسيع نطاق الدراسة لتشمل عدداً أكبر من المرضى للتأكد من فعالية العلاج وسلامته."\n\nوأوضح الدكتور حسن أن هذا الاكتشاف يمثل أملاً جديداً للمرضى، خاصة في المراحل المتقدمة من المرض، حيث تقل الخيارات العلاجية التقليدية.\n\nوأكد على أهمية الكشف المبكر عن المرض، مشيراً إلى أن فرص الشفاء تزداد بشكل كبير عند اكتشاف المرض في مراحله المبكرة.', 'اكتشاف جديد في علاج سرطان الثدي يعتمد على تقنيات المناعة الحديثة ويعد بنتائج واعدة وآثار جانبية أقل.', 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&h=400&fit=crop', (SELECT id FROM categories WHERE slug = 'medical-news' LIMIT 1), (SELECT id FROM authors WHERE name = 'د. سارة أحمد' LIMIT 1), '["علاج", "أبحاث", "سرطان الثدي", "مناعة"]', 8, NOW()),
    
    ('الدعم النفسي أثناء الرحلة العلاجية: أهمية لا تُقدر بثمن', 'يمر مريض سرطان الثدي برحلة علاجية طويلة وشاقة، تتطلب دعماً نفسياً قوياً لمساعدته على تخطي التحديات المصاحبة للمرض.\n\nوتشير الدراسات الحديثة إلى أن الدعم النفسي يلعب دوراً محورياً في تحسين نتائج العلاج وتسريع عملية التعافي.\n\nيقول الدكتور أحمد محمد، استشاري الطب النفسي: "الدعم النفسي لا يقل أهمية عن العلاج الدوائي، بل إنه في بعض الحالات يكون هو العنصر الحاسم في نجاح الرحلة العلاجية."\n\nويوضح أن الجلسات الداعمة تساعد المرضى على:\n\n- التعبير عن مشاعرهم ومخاوفهم بحرية\n- تعلم استراتيجيات التكيف مع التحديات\n- بناء شبكة دعم اجتماعي قوية\n- تحسين جودة الحياة أثناء العلاج\n- تعزيز الثقة بالنفس والتفاؤل\n\nوتؤكد الدكتورة منى حسن، أخصائية التغذية، على أهمية الدعم الأسري، مشيرة إلى أن دور الأسرة لا يُقدر بثمن في هذه المرحلة.\n\nوتنصح الدكتورة حسن أسر المرضى بالاستماع الجيد والتشجيع المستمر، وعدم التقليل من مشاعر المريضة أو محاولة تغييرها.\n\nكما تشدد على أهمية الانضمام إلى مجموعات الدعم، حيث يمكن للمريضة التواصل مع أشخاص يمرون بتجارب مشابهة.', 'الدعم النفسي يلعب دوراً محورياً في تحسين نتائج العلاج وتسريع التعافي، ويشمل استراتيجيات التكيف وبناء شبكة دعم قوية.', 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&h=400&fit=crop', (SELECT id FROM categories WHERE slug = 'psychological-support' LIMIT 1), (SELECT id FROM authors WHERE name = 'د. أحمد محمد' LIMIT 1), '["دعم نفسي", "علاج", "تعافي", "مجتمع"]', 6, NOW()),
    
    ('نصائح غذائية مهمة أثناء العلاج الكيميائي', 'يعد العلاج الكيميائي من أهم وسائل علاج سرطان الثدي، لكنه قد يسبب بعض الآثار الجانبية التي تؤثر على التغذية.\n\nوتوضح الدكتورة منى حسن، أخصائية التغذية، بعض النصائح المهمة للتغذية أثناء فترة العلاج:\n\n**1. تناول وجبات صغيرة متكررة:**\nبدلاً من ثلاث وجبات كبيرة، تناولي 5-6 وجبات صغيرة لتقليل الشعور بالغثيان.\n\n**2. ترطيب الجسم:**\nاشربي الكثير من الماء والسوائل، خاصة الماء والعصائر الطبيعية والحساء.\n\n**3. البروتين أولاً:**\nركزي على الأطعمة الغنية بالبروتين كاللحوم الخالية من الدهن، والأسماك، والبيض، والبقوليات.\n\n**4. تجنبي الأطعمة المهيجة:**\nابتعدي عن الأطعمة الحارة، والمقلية، أو التي تحتوي على توابل قوية.\n\n**5. الفواكه والخضروات:**\nتناولي 5-6 حصص يومياً من الفواكه والخضروات الطازجة للحصول على الفيتامينات والمعادن.\n\n**6. مكملات الفيتامينات:**\nاستشيري طبيبك قبل تناول أي مكملات غذائية.\n\n**7. النشاط البدني الخفيف:**\nمارسي تمارين المشي الخفيفة لتعزيز الشهية وتحسين المزاج.\n\nوتنصح الدكتورة حسن بمراجعة أخصائي التغذية لتخصيص خطة غذائية تناسب حالتك الخاصة.', 'نصائح غذائية مهمة أثناء العلاج الكيميائي تشمل تناول وجبات صغيرة، ترطيب الجسم، والتركيز على البروتين والفواكه الطازجة.', 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&h=400&fit=crop', (SELECT id FROM categories WHERE slug = 'nutrition-health' LIMIT 1), (SELECT id FROM authors WHERE name = 'د. منى حسن' LIMIT 1), '["تغذية", "علاج كيميائي", "نصائح", "صحة"]', 5, NOW()),
    
    ('قصة نجاح: سارة تحدت المرض وانتصرت', 'سارة محمد، امرأة مصرية في الثلاثينيات من عمرها، لم تكن تتوقع أن تشهد حياتها تحولاً درامياً عندما اكتشفت وجود كتلة في ثديها.\n\n"كنت خائفة جداً في البداية"، تروي سارة. "لكنني قررت أن أكون قوية وأن أحارب هذا المرض بكل ما أوتيت من قوة."\n\nبدأت رحلة سارة مع العلاج الكيميائي، وواجهت التحديات المعتادة مثل الغثيان وتساقط الشعر. لكنها لم تستسلم، بل التحقت بجلسات الدعم النفسي وبدأت في ممارسة التمارين الرياضية الخفيفة.\n\n"الدعم النفسي كان له دور كبير في حالتي"، تقول سارة. "تعلمت كيف أتعامل مع مشاعري، وكيف أحافظ على تفاؤلي رغم الصعوبات."\n\nوبعد أشهر من العلاج، أعلن الأطباء أن سارة خالية تماماً من المرض. لكن رحلتها لم تنتهي عند هذا الحد، بل قررت أن تساعد غيرها من النساء اللاتي يمرن بنفس التجربة.\n\n"أنا الآن متطوعة في مجموعات الدعم، وأحاول أن أكون مصدر أمل وتشجيع للنساء الأخريات"، تضيف سارة بفخر.\n\nوتقدم سارة بعض النصائح للنساء اللاتي يبدأن رحلتهن:\n\n- **كوني قوية**: المرض ليس نهاية العالم، بل هو بداية لرحلة جديدة.\n- **اطلبي الدعم**: لا تكوني وحدك، فالدعم النفسي والأسري مهم جداً.\n- **ثقي بعلاجك**: ثقي بأطبائك وبخطة العلاج التي وضعوها لك.\n- **اهتمي بنفسك**: ركزي على التغذية السليمة وممارسة الرياضة.\n- **كوني إيجابية**: حافظي على التفاؤل حتى في أصعب اللحظات.\n\nوتختم سارة: "أنا الآن أعيش حياتي بشكل طبيعي، بل وأشعر أنني أقوى مما كنت عليه قبل المرض. المرض علمني أن الحياة ثمينة، وأنني قادرة على تحقيق أي شيء أريده."\n\nقصة سارة هي واحدة من آلاف القصص التي تُظهر أن الأمل موجود دائماً، وأن التحديات يمكن أن تتحول إلى انتصارات.', 'قصة نجاح سارة محمد التي تحدت سرطان الثدي وانتصرت عليه من خلال القوة والدعم النفسي والتزامها بالعلاج.', 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=800&h=400&fit=crop', (SELECT id FROM categories WHERE slug = 'success-stories' LIMIT 1), (SELECT id FROM authors WHERE name = 'د. سارة أحمد' LIMIT 1), '["قصص نجاح", "تحدي", "تعافي", "أمل"]', 7, NOW())
ON CONFLICT DO NOTHING;

-- Create a function to update available spots when a booking is made
CREATE OR REPLACE FUNCTION update_session_available_spots()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'confirmed' THEN
        UPDATE sessions 
        SET available_spots = available_spots - 1 
        WHERE id = NEW.session_id AND available_spots > 0;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for booking confirmations
CREATE TRIGGER trigger_update_available_spots
    AFTER INSERT ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_session_available_spots();

-- Create a function to restore available spots when a booking is cancelled
CREATE OR REPLACE FUNCTION restore_session_available_spots()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status = 'confirmed' AND NEW.status = 'cancelled' THEN
        UPDATE sessions 
        SET available_spots = available_spots + 1 
        WHERE id = OLD.session_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for booking cancellations
CREATE TRIGGER trigger_restore_available_spots
    AFTER UPDATE ON bookings
    FOR EACH ROW
    WHEN (OLD.status = 'confirmed' AND NEW.status = 'cancelled')
    EXECUTE FUNCTION restore_session_available_spots();