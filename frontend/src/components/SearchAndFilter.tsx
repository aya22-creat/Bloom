import React, { useState } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';

interface SearchAndFilterProps {
  onSearch: (searchTerm: string) => void;
  onCategoryChange: (category: string) => void;
  onVerifiedChange: (verified: boolean) => void;
  categories: string[];
  currentSearch?: string;
  currentCategory?: string;
  currentVerified?: boolean;
}

export const SearchAndFilter: React.FC<SearchAndFilterProps> = ({
  onSearch,
  onCategoryChange,
  onVerifiedChange,
  categories,
  currentSearch = '',
  currentCategory = '',
  currentVerified = false
}) => {
  const [searchTerm, setSearchTerm] = useState(currentSearch);
  const [selectedCategory, setSelectedCategory] = useState(currentCategory);
  const [verifiedOnly, setVerifiedOnly] = useState(currentVerified);
  const [showFilters, setShowFilters] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchTerm);
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    onCategoryChange(value);
  };

  const handleVerifiedChange = () => {
    const newVerified = !verifiedOnly;
    setVerifiedOnly(newVerified);
    onVerifiedChange(newVerified);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setVerifiedOnly(false);
    onSearch('');
    onCategoryChange('');
    onVerifiedChange(false);
  };

  const hasActiveFilters = searchTerm || selectedCategory || verifiedOnly;

  return (
    <div className="w-full space-y-4">
      {/* شريط البحث الرئيسي */}
      <form onSubmit={handleSearch} className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="ابحث عن منتجك..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-3 text-right"
            dir="rtl"
          />
          <Button
            type="submit"
            size="sm"
            className="absolute left-2 top-1/2 transform -translate-y-1/2"
          >
            بحث
          </Button>
        </div>
      </form>

      {/* أزرار التحكم */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2"
        >
          <Filter className="w-4 h-4" />
          تصفية متقدمة
        </Button>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="flex items-center gap-2 text-red-600 hover:text-red-700"
          >
            <X className="w-4 h-4" />
            مسح التصفية
          </Button>
        )}
      </div>

      {/* لوحة التصفية المتقدمة */}
      {showFilters && (
        <div className="bg-gray-50 p-4 rounded-lg border space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* تصفية حسب الفئة */}
            <div className="space-y-2">
              <label className="text-sm font-medium">الفئة</label>
              <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                <SelectTrigger className="text-right" dir="rtl">
                  <SelectValue placeholder="اختر الفئة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">جميع الفئات</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* تصفية حسب التحقق */}
            <div className="space-y-2">
              <label className="text-sm font-medium">حالة التحقق</label>
              <div className="flex items-center space-x-2 space-x-reverse">
                <input
                  type="checkbox"
                  id="verified-only"
                  checked={verifiedOnly}
                  onChange={handleVerifiedChange}
                  className="rounded border-gray-300"
                />
                <label htmlFor="verified-only" className="text-sm">
                  المنتجات الموثقة فقط
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* شارات التصفية النشطة */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          {searchTerm && (
            <Badge variant="secondary" className="flex items-center gap-1">
              بحث: {searchTerm}
              <X 
                className="w-3 h-3 cursor-pointer" 
                onClick={() => {
                  setSearchTerm('');
                  onSearch('');
                }}
              />
            </Badge>
          )}
          
          {selectedCategory && (
            <Badge variant="secondary" className="flex items-center gap-1">
              الفئة: {selectedCategory}
              <X 
                className="w-3 h-3 cursor-pointer" 
                onClick={() => {
                  setSelectedCategory('');
                  onCategoryChange('');
                }}
              />
            </Badge>
          )}
          
          {verifiedOnly && (
            <Badge variant="secondary" className="flex items-center gap-1">
              منتجات موثقة فقط
              <X 
                className="w-3 h-3 cursor-pointer" 
                onClick={() => {
                  setVerifiedOnly(false);
                  onVerifiedChange(false);
                }}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchAndFilter;