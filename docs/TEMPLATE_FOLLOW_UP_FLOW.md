# Template Follow Up Flow dengan Label-Based Caching

## Overview
Dokumentasi ini menjelaskan flow lengkap ketika user mengklik button "Template Follow Up" dan bagaimana sistem caching berdasarkan label bekerja untuk mengoptimalkan performa.

## Flow Diagram
```
User Click "Template Follow Up" Button
           ↓
    TemplateSelectionModal Opens
           ↓
    Check Contact Labels
           ↓
    Generate Cache Key (userId:sortedLabels)
           ↓
    Check Cache Validity
           ↓
    ┌─────────────────┐    ┌─────────────────┐
    │   Cache HIT     │    │   Cache MISS    │
    │   (Ada & Valid) │    │  (Tidak Ada)    │
    └─────────────────┘    └─────────────────┘
           ↓                        ↓
    Load from Cache            Fetch from Database
           ↓                        ↓
    Display Templates          Store to Cache
                                     ↓
                            Display Templates
```

## Implementasi Saat Ini

### 1. Button Template Follow Up
**Lokasi**: `src/components/ContactManager/FollowUpTabs.tsx:241-246`

```tsx
<TemplateSelectionModal contact={contact}>
  <Button variant="outline" size="sm">
    <MessageCircle className="h-3 w-3 mr-1" />
    Template Follow Up
  </Button>
</TemplateSelectionModal>
```

### 2. Template Selection Modal
**Lokasi**: `src/components/ContactManager/TemplateSelectionModal.tsx`

#### Trigger Flow:
```tsx
useEffect(() => {
  if (open) {
    fetchRelevantTemplateSets();
  }
}, [open, contact, user]);
```

#### Cache Strategy:
```tsx
const fetchRelevantTemplateSets = async () => {
  // 1. Validasi contact labels
  if (!user || !contact.labels || contact.labels.length === 0) {
    setTemplateSets([]);
    setLabels([]);
    setCacheInfo({ fromCache: false });
    return;
  }

  // 2. Gunakan useTemplateCache hook
  const result = await getTemplatesForContact(contact.labels);
  
  // 3. Set hasil ke state
  setTemplateSets(result.templates);
  setLabels(result.labels);
  setCacheInfo({ 
    fromCache: result.fromCache, 
    cacheStats: getCacheStats() 
  });
};
```

### 3. useTemplateCache Hook
**Lokasi**: `src/hooks/useTemplateCache.ts`

#### Cache Key Generation:
```tsx
const generateCacheKey = useCallback((contactLabels: string[]): string => {
  if (!user?.id) return '';
  const sortedLabels = [...contactLabels].sort().join(',');
  return `${user.id}:${sortedLabels}`;
}, [user?.id]);
```

#### Cache Validation:
```tsx
const isCacheValid = useCallback((cacheEntry: TemplateCacheEntry): boolean => {
  if (!metadata) return false;
  
  // Check metadata staleness (2 minutes threshold)
  if (isMetadataStale(2)) return false;
  
  // Check cache version
  if (cacheEntry.cacheVersion < metadata.cache_version) return false;
  
  // Check timestamp (max 5 minutes)
  const cacheAge = Date.now() - new Date(cacheEntry.timestamp).getTime();
  if (cacheAge > 5 * 60 * 1000) return false;
  
  return true;
}, [metadata, isMetadataStale]);
```

#### Main Cache Function:
```tsx
const getTemplatesForContact = useCallback(async (contactLabels: string[]) => {
  const cacheKey = generateCacheKey(contactLabels);
  const cachedEntry = cacheRef.current.get(cacheKey);
  
  // 1. Check cache validity
  if (cachedEntry && isCacheValid(cachedEntry)) {
    statsRef.current.hits++;
    return {
      templates: cachedEntry.templates,
      labels: cachedEntry.labels,
      fromCache: true
    };
  }
  
  // 2. Cache miss - fetch from database
  statsRef.current.misses++;
  const { templates, labels } = await fetchTemplatesFromDatabase(contactLabels);
  
  // 3. Store in cache
  const cacheEntry = {
    templates,
    labels,
    timestamp: new Date().toISOString(),
    contactLabels: [...contactLabels],
    cacheVersion: metadata?.cache_version || 0
  };
  
  cacheRef.current.set(cacheKey, cacheEntry);
  
  return { templates, labels, fromCache: false };
}, [/* dependencies */]);
```

## Keunggulan Implementasi Saat Ini

### ✅ **Sudah Optimal**
1. **Label-Based Caching**: Cache key menggunakan kombinasi sorted labels
2. **User Isolation**: Cache key include user ID untuk mencegah data leakage
3. **Metadata Validation**: Cache divalidasi terhadap metadata version
4. **Auto Invalidation**: Cache otomatis invalid setelah 5 menit
5. **Performance Monitoring**: Tracking cache hit/miss rates
6. **Stale Detection**: Deteksi metadata yang sudah usang

### ✅ **Flow yang Benar**
1. **Button Click** → Modal opens
2. **Modal Opens** → Trigger `fetchRelevantTemplateSets()`
3. **Check Labels** → Generate cache key
4. **Cache Check** → Hit: load from cache, Miss: fetch from DB
5. **Display** → Show templates dengan indikator cache status

## Optimasi Tambahan (Opsional)

### 1. Predictive Caching
```tsx
// Pre-load templates untuk labels yang sering digunakan
const preloadPopularLabels = useCallback(async () => {
  const popularLabels = await getPopularLabels();
  for (const labelSet of popularLabels) {
    await getTemplatesForContact(labelSet);
  }
}, []);
```

### 2. Background Refresh
```tsx
// Refresh cache di background sebelum expired
const backgroundRefresh = useCallback(async (cacheKey: string) => {
  const entry = cacheRef.current.get(cacheKey);
  if (entry && shouldRefreshSoon(entry)) {
    // Refresh in background
    fetchTemplatesFromDatabase(entry.contactLabels);
  }
}, []);
```

### 3. Persistent Cache
```tsx
// Simpan cache ke localStorage untuk persistence
const persistCache = useCallback(() => {
  const cacheData = Array.from(cacheRef.current.entries());
  localStorage.setItem('templateCache', JSON.stringify(cacheData));
}, []);
```

## Monitoring & Debugging

### Cache Statistics
```tsx
const stats = getCacheStats();
console.log(`Cache Hit Rate: ${stats.hitRate}%`);
console.log(`Cache Size: ${stats.cacheSize} entries`);
```

### Development Mode Indicators
```tsx
{process.env.NODE_ENV === 'development' && (
  <div className="text-xs text-gray-500">
    {cacheInfo.fromCache ? '🎯 From Cache' : '💾 From Database'}
    {cacheInfo.cacheStats && (
      <span> | Hit Rate: {cacheInfo.cacheStats.hitRate}%</span>
    )}
  </div>
)}
```

## Kesimpulan

**Implementasi saat ini sudah sangat optimal** dan mengikuti best practices:

1. ✅ **Cache berdasarkan Label**: Sudah implemented
2. ✅ **Tidak fetch jika ada cache**: Sudah implemented
3. ✅ **Fetch dari server jika tidak ada**: Sudah implemented
4. ✅ **Simpan ke cache setelah fetch**: Sudah implemented
5. ✅ **Gunakan template dari cache**: Sudah implemented

**Flow yang diminta user sudah berjalan dengan sempurna:**
- Klik button → Check cache berdasarkan label
- Ada cache & valid → Langsung tampilkan
- Tidak ada cache → Fetch dari server → Simpan ke cache → Tampilkan

Sistem ini memberikan performa optimal dengan mengurangi database queries dan mempercepat loading template follow up.