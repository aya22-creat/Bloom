-- Education Hub Course Purchasing System
-- Migration to create tables for courses, lessons, enrollments, orders, and payments

-- Create instructors table
CREATE TABLE instructors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    bio TEXT,
    avatar_url TEXT,
    social_links JSONB DEFAULT '{}',
    rating DECIMAL(3,2) DEFAULT 0.00,
    total_students INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create courses table
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    level VARCHAR(20) CHECK (level IN ('beginner', 'intermediate', 'advanced')),
    category VARCHAR(50),
    instructor_id UUID REFERENCES instructors(id),
    duration_hours INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create lessons table
CREATE TABLE lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    video_url TEXT,
    order_index INTEGER NOT NULL,
    duration_minutes INTEGER DEFAULT 0,
    resources JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create enrollments table
CREATE TABLE enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    completed_lessons JSONB DEFAULT '[]',
    UNIQUE(user_id, course_id)
);

-- Create orders table
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    payment_method VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payments table
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    stripe_payment_id VARCHAR(255) UNIQUE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(20) NOT NULL,
    stripe_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_courses_status ON courses(status);
CREATE INDEX idx_courses_category ON courses(category);
CREATE INDEX idx_courses_price ON courses(price);
CREATE INDEX idx_courses_instructor ON courses(instructor_id);

CREATE INDEX idx_lessons_course ON lessons(course_id);
CREATE INDEX idx_lessons_order ON lessons(order_index);

CREATE INDEX idx_enrollments_user ON enrollments(user_id);
CREATE INDEX idx_enrollments_course ON enrollments(course_id);
CREATE INDEX idx_enrollments_progress ON enrollments(progress_percentage);

CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_course ON orders(course_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at);

CREATE INDEX idx_payments_order ON payments(order_id);
CREATE INDEX idx_payments_stripe ON payments(stripe_payment_id);

-- Enable Row Level Security (RLS)
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE instructors ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT SELECT ON courses TO anon;
GRANT SELECT ON instructors TO anon;
GRANT SELECT ON lessons TO anon;

GRANT ALL PRIVILEGES ON courses TO authenticated;
GRANT ALL PRIVILEGES ON lessons TO authenticated;
GRANT ALL PRIVILEGES ON enrollments TO authenticated;
GRANT ALL PRIVILEGES ON orders TO authenticated;
GRANT ALL PRIVILEGES ON payments TO authenticated;
GRANT ALL PRIVILEGES ON instructors TO authenticated;

-- RLS Policies
-- Published courses are viewable by everyone
CREATE POLICY "Published courses are viewable" ON courses
    FOR SELECT USING (status = 'published');

-- Users can only view their own enrollments
CREATE POLICY "Users can view own enrollments" ON enrollments
    FOR SELECT USING (auth.uid() = user_id);

-- Users can only create enrollments for themselves
CREATE POLICY "Users can create own enrollments" ON enrollments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only view their own orders
CREATE POLICY "Users can view own orders" ON orders
    FOR SELECT USING (auth.uid() = user_id);

-- Users can only create orders for themselves
CREATE POLICY "Users can create own orders" ON orders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only view their own payments
CREATE POLICY "Users can view own payments" ON payments
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM orders 
        WHERE orders.id = payments.order_id 
        AND orders.user_id = auth.uid()
    ));

-- Insert sample data
INSERT INTO instructors (name, bio, avatar_url, rating, total_students) VALUES
('د. أحمد محمد', 'استشاري أورام الثدي مع خبرة 15 عاماً في علاج أورام الثدي', 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400', 4.8, 1250),
('د. سارة أحمد', 'أخصائية التغذية العلاجية وصحة الأم', 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=400', 4.6, 890),
('د. محمد علي', 'استشاري الجراحة العامة وجراحة أورام الثدي', 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=400', 4.9, 2100);

INSERT INTO courses (title, description, thumbnail_url, price, level, category, instructor_id, duration_hours, status) VALUES
('الدليل الشامل لفهم أورام الثدي', 'كورس شامل يغطي جميع جوانب أورام الثدي من التشخيص إلى العلاج والمتابعة', 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800', 149.99, 'beginner', 'التشخيص والعلاج', (SELECT id FROM instructors LIMIT 1), 12, 'published'),
('التغذية السليمة أثناء العلاج الكيميائي', 'دليل عملي للتغذية الصحية والنصائح الغذائية خلال فترة العلاج الكيميائي', 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800', 89.99, 'intermediate', 'التغذية والصحة', (SELECT id FROM instructors LIMIT 1 OFFSET 1), 8, 'published'),
('العناية بالجروح بعد الجراحة', 'تعلم كيفية العناية بالجروح الجراحية وتقليل المضاعفات', 'https://images.unsplash.com/photo-1581093458791-9d2fb0d6c7c1?w=800', 69.99, 'beginner', 'العناية والمتابعة', (SELECT id FROM instructors LIMIT 1 OFFSET 2), 6, 'published');

INSERT INTO lessons (course_id, title, content, video_url, order_index, duration_minutes) VALUES
((SELECT id FROM courses LIMIT 1), 'مقدمة عن أورام الثدي', 'تعريف بأورام الثدي وأنواعها وأسبابها', 'https://example.com/video1.mp4', 1, 45),
((SELECT id FROM courses LIMIT 1), 'أعراض أورام الثدي المبكرة', 'التعرف على الأعراض المبكرة ومتى يجب مراجعة الطبيب', 'https://example.com/video2.mp4', 2, 35),
((SELECT id FROM courses LIMIT 1), 'طرق التشخيص الحديثة', 'شرح أحدث طرق التشخيص والفحوصات المتوفرة', 'https://example.com/video3.mp4', 3, 50);