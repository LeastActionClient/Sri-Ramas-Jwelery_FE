import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Filter, X, Search, RotateCcw } from 'lucide-react';
import { productsApi, ProductFilters } from '@/services/api/products.api';
import { categoriesApi } from '@/services/api/categories.api';
import type { Category } from '@/types';
import { ProductCard } from '@/components/customer/ProductCard';
import { ScrollReveal, StaggerReveal } from '@/components/motion';
import { SEO } from '@/components/common/SEO';

const METAL_OPTIONS = [
  { value: 'GOLD', label: 'Gold' },
  { value: 'SILVER', label: 'Silver' },
  { value: 'DIAMOND', label: 'Diamond' },
  { value: 'PLATINUM', label: 'Platinum' }
] as const;

export const GOLD_PURITY_OPTIONS = [
  { value: '24K', label: '24K', description: '24K (999 Purity) Pure Gold' },
  { value: '22K', label: '22K', description: '22K (916 Purity) Hallmark Gold' },
  { value: '20K', label: '20K', description: '20K (833 Purity) Gold' },
  { value: '18K', label: '18K', description: '18K (750 Purity) Fine Jewellery' },
  { value: '14K', label: '14K', description: '14K (585 Purity) Gold' },
  { value: '9K', label: '9K', description: '9K (375 Purity) Gold' },
] as const;

export const SILVER_FINENESS_OPTIONS = [
  { value: '999', label: '999 Fine', description: '999 / 1000 Fine Silver' },
  { value: '925', label: '925 Sterling', description: '925 / 1000 Sterling Silver' },
  { value: '900', label: '900 Coin', description: '900 / 1000 Coin Silver' },
  { value: '835', label: '835 Alloy', description: '835 / 1000 Silver Alloy' },
  { value: '800', label: '800 Alloy', description: '800 / 1000 Silver Alloy' },
] as const;

export const PLATINUM_HALLMARK_OPTIONS = [
  { value: 'Pt950', label: 'Pt950', description: 'Pt950 • 95% Pure Platinum' },
  { value: 'Pt900', label: 'Pt900', description: 'Pt900 • 90% Pure Platinum' },
  { value: 'Pt850', label: 'Pt850', description: 'Pt850 • 85% Pure Platinum' },
  { value: 'Pt999', label: 'Pt999', description: 'Pt999 • 99.9% Pure Platinum' },
] as const;

export const DIAMOND_CUT_OPTIONS = [
  { value: 'EXCELLENT', label: 'Excellent' },
  { value: 'VERY_GOOD', label: 'Very Good' },
  { value: 'GOOD', label: 'Good' },
  { value: 'FAIR', label: 'Fair' },
] as const;

export const DIAMOND_CLARITY_OPTIONS = [
  { value: 'FL', label: 'FL / IF' },
  { value: 'VVS1', label: 'VVS1 - VVS2' },
  { value: 'VS1', label: 'VS1 - VS2' },
  { value: 'SI1', label: 'SI1 - SI2' },
  { value: 'I1', label: 'I1 - I3' },
] as const;

export const DIAMOND_COLOR_OPTIONS = [
  { value: 'D', label: 'D - F (Colourless)' },
  { value: 'G', label: 'G - J (Near Colourless)' },
  { value: 'K-M', label: 'K - M (Faint)' },
] as const;

export const DIAMOND_SHAPE_OPTIONS = [
  { value: 'ROUND', label: 'Round' },
  { value: 'PRINCESS', label: 'Princess' },
  { value: 'OVAL', label: 'Oval' },
  { value: 'PEAR', label: 'Pear' },
  { value: 'EMERALD', label: 'Emerald' },
  { value: 'CUSHION', label: 'Cushion' },
  { value: 'MARQUISE', label: 'Marquise' },
  { value: 'HEART', label: 'Heart' },
] as const;

export const DIAMOND_CARAT_RANGES = [
  { value: 'under-0.5', label: 'Under 0.5 ct' },
  { value: '0.5-1.0', label: '0.5 - 1.0 ct' },
  { value: '1.0-2.0', label: '1.0 - 2.0 ct' },
  { value: '2.0-plus', label: '2.0+ ct' },
] as const;

export const DIAMOND_CERT_OPTIONS = [
  { value: 'GIA', label: 'GIA Certified' },
  { value: 'IGI', label: 'IGI Certified' },
  { value: 'HRD', label: 'HRD Certified' },
] as const;

export const GENERAL_PURITY_OPTIONS = [
  { value: '24K', label: '24K' },
  { value: '22K', label: '22K' },
  { value: '18K', label: '18K' },
  { value: '925', label: '925' },
  { value: '999', label: '999' },
  { value: 'Pt950', label: 'Pt950' },
] as const;

export const CLASSIFICATION_OPTIONS = [
  { value: 'BRIDAL', label: 'Bridal' },
  { value: 'TRADITIONAL', label: 'Traditional' },
  { value: 'DAILY_WEAR', label: 'Daily Wear' },
] as const;

function getCategoryParentId(c: Category): string | null {
  if (c.parentCategoryId) return String(c.parentCategoryId);
  if (c.parentCategory) {
    return typeof c.parentCategory === 'string'
      ? c.parentCategory
      : (c.parentCategory as any)?._id
        ? String((c.parentCategory as any)._id)
        : null;
  }
  return null;
}

export const ProductCatalogPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Prevent background scroll when mobile filter is open
  useEffect(() => {
    if (!mobileFiltersOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [mobileFiltersOpen]);

  // URL search params are the single source of truth for committed catalogue filters
  const urlSearch = searchParams.get('search') || '';
  const urlCategoryId = searchParams.get('categoryId') || '';
  const urlCategorySlug = searchParams.get('category') || '';
  const urlSubcategoryId = searchParams.get('subcategoryId') || '';
  const urlClassification = (searchParams.get('classification') || '').toUpperCase();
  const metalType = (searchParams.get('metalType') || '').toUpperCase();
  const purity = (searchParams.get('purity') || '').toUpperCase();
  const diamondCut = (searchParams.get('diamondCut') || '').toUpperCase();
  const diamondColor = (searchParams.get('diamondColor') || '').toUpperCase();
  const diamondClarity = (searchParams.get('diamondClarity') || '').toUpperCase();
  const diamondShape = (searchParams.get('diamondShape') || '').toUpperCase();
  const diamondCert = (searchParams.get('diamondCert') || '').toUpperCase();
  const caratRange = searchParams.get('caratRange') || '';
  const page = Math.max(1, Number(searchParams.get('page')) || 1);

  // Local keyword input synchronized with URL search without effect-driven state mutations
  const [searchDraftState, setSearchDraftState] = useState<{ urlValue: string; text: string }>({
    urlValue: urlSearch,
    text: urlSearch
  });
  const searchInput = searchDraftState.urlValue === urlSearch ? searchDraftState.text : urlSearch;
  const searchDebounceRef = useRef<number | null>(null);

  // Mobile drawer staged filter state
  const [mobileDraftSearch, setMobileDraftSearch] = useState('');
  const [mobileDraftCategoryId, setMobileDraftCategoryId] = useState('');
  const [mobileDraftSubcategoryId, setMobileDraftSubcategoryId] = useState('');
  const [mobileDraftClassification, setMobileDraftClassification] = useState('');
  const [mobileDraftMetal, setMobileDraftMetal] = useState('');
  const [mobileDraftPurity, setMobileDraftPurity] = useState('');
  const [mobileDraftCut, setMobileDraftCut] = useState('');
  const [mobileDraftColor, setMobileDraftColor] = useState('');
  const [mobileDraftClarity, setMobileDraftClarity] = useState('');
  const [mobileDraftShape, setMobileDraftShape] = useState('');
  const [mobileDraftCert, setMobileDraftCert] = useState('');
  const [mobileDraftCarat, setMobileDraftCarat] = useState('');

  useEffect(() => {
    return () => {
      if (searchDebounceRef.current !== null) {
        window.clearTimeout(searchDebounceRef.current);
      }
    };
  }, []);

  // Fetch Admin CMS categories dynamically
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesApi.getCategories
  });

  // Resolve category by ObjectId or slug
  const resolvedCategory = useMemo(() => {
    if (urlCategoryId) {
      return categories.find((cat) => cat._id === urlCategoryId) || null;
    }
    if (urlCategorySlug) {
      const target = urlCategorySlug.toLowerCase();
      return categories.find((cat) => cat.slug.toLowerCase() === target) || null;
    }
    return null;
  }, [categories, urlCategoryId, urlCategorySlug]);

  const effectiveCategoryId = resolvedCategory?._id || urlCategoryId;
  const effectiveCategorySlug = !effectiveCategoryId && urlCategorySlug ? urlCategorySlug : '';

  // Filter root categories (optionally matching selected metal group)
  const rootCategories = useMemo(() => {
    return categories.filter((c) => {
      const isRoot = !c.parentCategory && !c.parentCategoryId;
      if (!isRoot) return false;
      if (c.metalType === 'ALL' || c.metalType === 'MIXED') return true;
      if (metalType === 'GOLD') return c.metalType === 'GOLD' || !c.metalType;
      if (metalType === 'SILVER') return c.metalType === 'SILVER';
      return true;
    });
  }, [categories, metalType]);

  // Subcategories belonging to the currently selected main category
  const categorySubcategories = useMemo(() => {
    if (!effectiveCategoryId) return [];
    return categories
      .filter((c) => getCategoryParentId(c) === effectiveCategoryId)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name));
  }, [categories, effectiveCategoryId]);

  const availableSubcategories = categorySubcategories;

  // Subcategories grouped by parent category for when "All Categories" is selected
  const groupedSubcategories = useMemo(() => {
    const rootMap = new Map<string, Category>();
    for (const r of rootCategories) {
      rootMap.set(r._id, r);
    }

    const groupMap = new Map<string, Category[]>();
    for (const cat of categories) {
      const pid = getCategoryParentId(cat);
      if (!pid) continue;
      if (!rootMap.has(pid)) continue;

      if (!groupMap.has(pid)) {
        groupMap.set(pid, []);
      }
      groupMap.get(pid)!.push(cat);
    }

    const groups: { parent: Category; subcategories: Category[] }[] = [];
    for (const [pid, subcats] of groupMap.entries()) {
      const parent = rootMap.get(pid);
      if (parent) {
        groups.push({
          parent,
          subcategories: subcats.sort(
            (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name)
          )
        });
      }
    }

    return groups.sort(
      (a, b) =>
        (a.parent.sortOrder ?? 0) - (b.parent.sortOrder ?? 0) ||
        a.parent.name.localeCompare(b.parent.name)
    );
  }, [categories, rootCategories]);

  // Subcategories for mobile filter drawer based on mobileDraftCategoryId
  const mobileCategorySubcategories = useMemo(() => {
    if (!mobileDraftCategoryId) return [];
    return categories
      .filter((c) => getCategoryParentId(c) === mobileDraftCategoryId)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name));
  }, [categories, mobileDraftCategoryId]);

  const filters: ProductFilters = useMemo(() => {
    let minCarat: number | undefined;
    let maxCarat: number | undefined;
    if (caratRange === 'under-0.5') maxCarat = 0.5;
    else if (caratRange === '0.5-1.0') { minCarat = 0.5; maxCarat = 1.0; }
    else if (caratRange === '1.0-2.0') { minCarat = 1.0; maxCarat = 2.0; }
    else if (caratRange === '2.0-plus') minCarat = 2.0;

    return {
      search: urlSearch.trim() || undefined,
      categoryId: effectiveCategoryId || undefined,
      category: effectiveCategorySlug || undefined,
      subcategoryId: urlSubcategoryId || undefined,
      classification: urlClassification || undefined,
      metalType: metalType || undefined,
      purity: purity || undefined,
      diamondCut: diamondCut || undefined,
      diamondColor: diamondColor || undefined,
      diamondClarity: diamondClarity || undefined,
      diamondShape: diamondShape || undefined,
      diamondCert: diamondCert || undefined,
      minCarat,
      maxCarat,
      sort: 'display_order',
      page,
      limit: 12
    };
  }, [
    urlSearch,
    effectiveCategoryId,
    effectiveCategorySlug,
    urlSubcategoryId,
    urlClassification,
    metalType,
    purity,
    diamondCut,
    diamondColor,
    diamondClarity,
    diamondShape,
    diamondCert,
    caratRange,
    page
  ]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['products', filters],
    queryFn: () => productsApi.getProducts(filters)
  });

  const products = data?.products || [];
  const meta = data?.meta;
  const totalCount = meta?.total ?? products.length;
  const totalPages = Math.max(1, meta?.totalPages || 1);

  const updateUrlParams = (mutator: (next: URLSearchParams) => void, resetPage: boolean = true) => {
    const next = new URLSearchParams(searchParams);
    mutator(next);
    if (resetPage) {
      next.delete('page');
    }
    setSearchParams(next);
  };

  const commitKeywordSearch = (rawValue: string) => {
    const trimmed = rawValue.trim();
    updateUrlParams((next) => {
      if (trimmed) next.set('search', trimmed);
      else next.delete('search');
    });
  };

  const handleSearchInputChange = (value: string) => {
    setSearchDraftState({ urlValue: urlSearch, text: value });
    if (searchDebounceRef.current !== null) {
      window.clearTimeout(searchDebounceRef.current);
    }
    searchDebounceRef.current = window.setTimeout(() => {
      commitKeywordSearch(value);
    }, 350);
  };

  const handleImmediateSearchSubmit = () => {
    if (searchDebounceRef.current !== null) {
      window.clearTimeout(searchDebounceRef.current);
      searchDebounceRef.current = null;
    }
    commitKeywordSearch(searchInput);
  };

  const handleCategoryChange = (nextCategoryId: string) => {
    updateUrlParams((next) => {
      next.delete('category');
      next.delete('subcategoryId');
      if (nextCategoryId) next.set('categoryId', nextCategoryId);
      else next.delete('categoryId');
    });
  };

  const handleSubcategoryChange = (nextSubcategoryId: string) => {
    updateUrlParams((next) => {
      if (nextSubcategoryId) {
        next.set('subcategoryId', nextSubcategoryId);
        const sub = categories.find((c) => c._id === nextSubcategoryId);
        const parentId = sub ? getCategoryParentId(sub) : null;
        if (parentId && !effectiveCategoryId) {
          next.set('categoryId', parentId);
          next.delete('category');
        }
      } else {
        next.delete('subcategoryId');
      }
    });
  };

  const handleToggleClassification = (val: string) => {
    updateUrlParams((next) => {
      if (urlClassification === val) next.delete('classification');
      else next.set('classification', val);
    });
  };

  const handleToggleMetal = (selectedMetal: string) => {
    updateUrlParams((next) => {
      const nextVal = metalType === selectedMetal ? '' : selectedMetal;
      if (nextVal) next.set('metalType', nextVal);
      else next.delete('metalType');

      // Clear non-applicable or specific filters on metal switch
      next.delete('categoryId');
      next.delete('category');
      next.delete('subcategoryId');
      next.delete('purity');
      next.delete('diamondCut');
      next.delete('diamondColor');
      next.delete('diamondClarity');
      next.delete('diamondShape');
      next.delete('diamondCert');
      next.delete('caratRange');
    });
  };

  const handleTogglePurity = (selectedPurity: string) => {
    updateUrlParams((next) => {
      const nextVal = purity === selectedPurity ? '' : selectedPurity;
      if (nextVal) next.set('purity', nextVal);
      else next.delete('purity');
    });
  };

  const handleToggleDiamondParam = (paramName: string, val: string) => {
    updateUrlParams((next) => {
      const current = (searchParams.get(paramName) || '').toUpperCase();
      if (current === val.toUpperCase()) {
        next.delete(paramName);
      } else {
        next.set(paramName, val);
      }
    });
  };

  const handlePageChange = (nextPage: number) => {
    const clamped = Math.max(1, Math.min(totalPages, nextPage));
    updateUrlParams((next) => {
      if (clamped > 1) next.set('page', String(clamped));
      else next.delete('page');
    }, false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClearAllFilters = () => {
    if (searchDebounceRef.current !== null) {
      window.clearTimeout(searchDebounceRef.current);
      searchDebounceRef.current = null;
    }
    setSearchDraftState({ urlValue: '', text: '' });
    setMobileDraftSearch('');
    setMobileDraftCategoryId('');
    setMobileDraftSubcategoryId('');
    setMobileDraftClassification('');
    setMobileDraftMetal('');
    setMobileDraftPurity('');
    setMobileDraftCut('');
    setMobileDraftColor('');
    setMobileDraftClarity('');
    setMobileDraftShape('');
    setMobileDraftCert('');
    setMobileDraftCarat('');
    setSearchParams(new URLSearchParams());
    setMobileFiltersOpen(false);
  };

  const openMobileDrawer = () => {
    setMobileDraftSearch(searchInput);
    setMobileDraftCategoryId(effectiveCategoryId);
    setMobileDraftSubcategoryId(urlSubcategoryId);
    setMobileDraftClassification(urlClassification);
    setMobileDraftMetal(metalType);
    setMobileDraftPurity(purity);
    setMobileDraftCut(diamondCut);
    setMobileDraftColor(diamondColor);
    setMobileDraftClarity(diamondClarity);
    setMobileDraftShape(diamondShape);
    setMobileDraftCert(diamondCert);
    setMobileDraftCarat(caratRange);
    setMobileFiltersOpen(true);
  };

  const handleApplyMobileDrawer = () => {
    if (searchDebounceRef.current !== null) {
      window.clearTimeout(searchDebounceRef.current);
      searchDebounceRef.current = null;
    }
    const trimmed = mobileDraftSearch.trim();
    setSearchDraftState({ urlValue: trimmed, text: trimmed });
    const next = new URLSearchParams();
    if (trimmed) next.set('search', trimmed);
    if (mobileDraftCategoryId) next.set('categoryId', mobileDraftCategoryId);
    if (mobileDraftSubcategoryId) next.set('subcategoryId', mobileDraftSubcategoryId);
    if (mobileDraftClassification) next.set('classification', mobileDraftClassification);
    if (mobileDraftMetal) next.set('metalType', mobileDraftMetal);
    if (mobileDraftPurity) next.set('purity', mobileDraftPurity);
    if (mobileDraftCut) next.set('diamondCut', mobileDraftCut);
    if (mobileDraftColor) next.set('diamondColor', mobileDraftColor);
    if (mobileDraftClarity) next.set('diamondClarity', mobileDraftClarity);
    if (mobileDraftShape) next.set('diamondShape', mobileDraftShape);
    if (mobileDraftCert) next.set('diamondCert', mobileDraftCert);
    if (mobileDraftCarat) next.set('caratRange', mobileDraftCarat);
    setSearchParams(next);
    setMobileFiltersOpen(false);
  };

  const activeFilterChips: Array<{ key: string; label: string; onClear: () => void }> = [];
  if (urlSearch.trim()) {
    activeFilterChips.push({
      key: 'search',
      label: `Search: "${urlSearch.trim()}"`,
      onClear: () => {
        setSearchDraftState({ urlValue: '', text: '' });
        commitKeywordSearch('');
      }
    });
  }
  if (resolvedCategory || effectiveCategoryId || effectiveCategorySlug) {
    const catLabel =
      resolvedCategory?.name ||
      categories.find((c) => c._id === effectiveCategoryId)?.name ||
      urlCategorySlug;
    activeFilterChips.push({
      key: 'category',
      label: `Category: ${catLabel}`,
      onClear: () => handleCategoryChange('')
    });
  }
  if (urlSubcategoryId) {
    const subcat = categories.find((c) => c._id === urlSubcategoryId);
    activeFilterChips.push({
      key: 'subcategory',
      label: `Subcategory: ${subcat?.name || urlSubcategoryId}`,
      onClear: () => handleSubcategoryChange('')
    });
  }
  if (urlClassification) {
    const classOption = CLASSIFICATION_OPTIONS.find((c) => c.value === urlClassification);
    activeFilterChips.push({
      key: 'classification',
      label: `Classification: ${classOption?.label || urlClassification}`,
      onClear: () => handleToggleClassification(urlClassification)
    });
  }
  if (metalType) {
    const metalLabel = METAL_OPTIONS.find((m) => m.value === metalType)?.label || metalType;
    activeFilterChips.push({
      key: 'metal',
      label: `Metal: ${metalLabel}`,
      onClear: () => handleToggleMetal(metalType)
    });
  }
  if (purity) {
    activeFilterChips.push({
      key: 'purity',
      label: `Purity: ${purity}`,
      onClear: () => handleTogglePurity(purity)
    });
  }
  if (diamondCut) {
    activeFilterChips.push({
      key: 'diamondCut',
      label: `Cut: ${diamondCut}`,
      onClear: () => handleToggleDiamondParam('diamondCut', diamondCut)
    });
  }
  if (diamondColor) {
    activeFilterChips.push({
      key: 'diamondColor',
      label: `Colour: ${diamondColor}`,
      onClear: () => handleToggleDiamondParam('diamondColor', diamondColor)
    });
  }
  if (diamondClarity) {
    activeFilterChips.push({
      key: 'diamondClarity',
      label: `Clarity: ${diamondClarity}`,
      onClear: () => handleToggleDiamondParam('diamondClarity', diamondClarity)
    });
  }
  if (diamondShape) {
    activeFilterChips.push({
      key: 'diamondShape',
      label: `Shape: ${diamondShape}`,
      onClear: () => handleToggleDiamondParam('diamondShape', diamondShape)
    });
  }
  if (diamondCert) {
    activeFilterChips.push({
      key: 'diamondCert',
      label: `Cert: ${diamondCert}`,
      onClear: () => handleToggleDiamondParam('diamondCert', diamondCert)
    });
  }
  if (caratRange) {
    const rangeObj = DIAMOND_CARAT_RANGES.find((r) => r.value === caratRange);
    activeFilterChips.push({
      key: 'caratRange',
      label: `Weight: ${rangeObj?.label || caratRange}`,
      onClear: () => handleToggleDiamondParam('caratRange', caratRange)
    });
  }

  const activeFilterCount = activeFilterChips.length;

  const dynamicSeo = useMemo(() => {
    const activeCatName =
      resolvedCategory?.name || categories.find((c) => c._id === effectiveCategoryId)?.name;
    const activeSubcatName = categories.find((c) => c._id === urlSubcategoryId)?.name;

    if (metalType === 'GOLD') {
      if (activeCatName) {
        return {
          title: `${activeCatName}${activeSubcatName ? ` (${activeSubcatName})` : ''} Gold Jewellery Collections | Sri Ramas Jewellery`,
          description: `Explore handcrafted 22K gold ${activeCatName.toLowerCase()}${activeSubcatName ? ` ${activeSubcatName.toLowerCase()}` : ''} collections at Sri Ramas Jewellery. 100% BIS 916 hallmarked bridal and traditional designs.`
        };
      }
      return {
        title: 'Gold Jewellery Collections | Sri Ramas Jewellery',
        description:
          'Explore traditional gold jewellery collections, including harams, bangles, chains, earrings and rings at Sri Ramas Jewellery.'
      };
    }

    if (metalType === 'SILVER') {
      if (activeCatName) {
        return {
          title: `${activeCatName} Silver Jewellery Collections | Sri Ramas Jewellery`,
          description: `Discover pure 925 sterling silver ${activeCatName.toLowerCase()} collections at Sri Ramas Jewellery. Handcrafted anklets, bracelets, chains, and toe rings.`
        };
      }
      return {
        title: 'Silver Jewellery Collections | Sri Ramas Jewellery',
        description:
          'Discover silver jewellery collections, including bracelets, chains, rings, anklets and toe rings at Sri Ramas Jewellery.'
      };
    }

    if (urlClassification === 'BRIDAL') {
      return {
        title: 'Bridal Jewellery Collections | Sri Ramas Jewellery',
        description:
          'Discover majestic South Indian bridal gold jewellery, heirloom temple harams, and certified wedding collections at Sri Ramas Jewellery.'
      };
    }
    if (urlClassification === 'TRADITIONAL') {
      return {
        title: 'Traditional Heritage Jewellery | Sri Ramas Jewellery',
        description:
          'Explore heirloom temple jewellery, Kasu malas, antique bangles, and timeless traditional jewellery craftsmanship at Sri Ramas Jewellery.'
      };
    }
    if (urlClassification === 'DAILY_WEAR') {
      return {
        title: 'Daily Wear Jewellery | Sri Ramas Jewellery',
        description:
          'Browse lightweight, elegant daily-wear gold and silver jewellery designs at Sri Ramas Jewellery.'
      };
    }

    if (activeCatName) {
      return {
        title: `${activeCatName} Jewellery Collections | Sri Ramas Jewellery`,
        description: `Explore ${activeCatName} jewellery collections at Sri Ramas Jewellery. Browse authentic 22K gold and 925 sterling silver craftsmanship.`
      };
    }

    return {
      title: 'Gold & Silver Jewellery Collections | Sri Ramas Jewellery',
      description:
        'Explore gold and silver jewellery collections at Sri Ramas Jewellery, including harams, bangles, chains, earrings, rings and more.'
    };
  }, [
    metalType,
    resolvedCategory,
    effectiveCategoryId,
    urlSubcategoryId,
    urlClassification,
    categories
  ]);

  const breadcrumbs = useMemo(() => {
    const list = [{ name: 'Home', path: '/' }, { name: 'Collections', path: '/products' }];
    if (metalType) {
      list.push({
        name: metalType === 'GOLD' ? 'Gold Jewellery' : 'Silver Jewellery',
        path: `/products?metalType=${metalType}`
      });
    }
    if (resolvedCategory?.name) {
      list.push({
        name: resolvedCategory.name,
        path: `/products?category=${resolvedCategory.slug || resolvedCategory._id}`
      });
    }
    return list;
  }, [metalType, resolvedCategory]);

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-12 space-y-6">
      <SEO
        title={dynamicSeo.title}
        description={dynamicSeo.description}
        breadcrumbs={breadcrumbs}
      />

      {/* Top Metal Group Switcher Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border-b border-stone-200/80 pb-3 sm:pb-4">
        {/* Horizontally scrollable metal tabs on mobile */}
        <div className="w-full sm:w-auto overflow-x-auto no-scrollbar scroll-smooth py-1 -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex items-center gap-2 whitespace-nowrap min-w-max">
            <button
              type="button"
              onClick={() => {
                if (metalType) handleToggleMetal(metalType);
              }}
              className={`shrink-0 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl font-serif text-xs sm:text-sm tracking-wide transition-all duration-200 whitespace-nowrap ${
                metalType === ''
                  ? 'bg-burgundy-900 text-gold-200 font-bold shadow-md border border-gold-600/40'
                  : 'bg-white text-stone-700 hover:bg-stone-50 border border-stone-200 font-medium'
              }`}
            >
              All Jewellery
            </button>
            <button
              type="button"
              onClick={() => handleToggleMetal('GOLD')}
              className={`shrink-0 flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl font-serif text-xs sm:text-sm tracking-wide transition-all duration-200 whitespace-nowrap ${
                metalType === 'GOLD'
                  ? 'bg-brand-maroon-gradient text-gold-200 font-bold shadow-md border border-gold-500'
                  : 'bg-white text-stone-700 hover:bg-stone-50 border border-stone-200 font-medium'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-gold-400 inline-block shadow-xs shrink-0" />
              <span>Gold Jewellery</span>
            </button>
            <button
              type="button"
              onClick={() => handleToggleMetal('SILVER')}
              className={`shrink-0 flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl font-serif text-xs sm:text-sm tracking-wide transition-all duration-200 whitespace-nowrap ${
                metalType === 'SILVER'
                  ? 'bg-brand-maroon-gradient text-gold-200 font-bold shadow-md border border-stone-300'
                  : 'bg-white text-stone-700 hover:bg-stone-50 border border-stone-200 font-medium'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-stone-300 inline-block shadow-xs shrink-0" />
              <span>Silver Jewellery</span>
            </button>
          </div>
        </div>

        {/* Mobile Filter Trigger Button (Visible only on smaller viewports) */}
        <div className="lg:hidden flex items-center">
          <button
            type="button"
            onClick={openMobileDrawer}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gold-600 bg-white text-burgundy-900 text-xs sm:text-sm font-semibold transition-all duration-200 hover:bg-gold-50 active:scale-[0.98] shadow-xs"
          >
            <Filter className="w-4 h-4 text-gold-600" />
            <span>Filter Catalogue</span>
            {activeFilterCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-[20px] h-[20px] px-1 rounded-full bg-burgundy-900 text-gold-200 text-xs font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Layout: Filters Sidebar + Grid */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Desktop Filter Sidebar - Widened with slightly increased typography */}
        <aside className="hidden lg:block w-full lg:w-[320px] xl:w-[360px] 2xl:w-[380px] shrink-0 space-y-6 bg-white p-6 rounded-2xl border border-stone-200 shadow-sm self-start sticky top-28">
          <div className="flex items-center justify-between pb-3.5 border-b border-stone-200">
            <h2 className="font-serif font-bold text-base text-burgundy-950 flex items-center gap-2.5">
              <Filter className="w-4.5 h-4.5 text-gold-600" />
              <span>Filters</span>
            </h2>
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={handleClearAllFilters}
                className="text-xs text-burgundy-700 hover:text-burgundy-900 font-semibold flex items-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Clear All
              </button>
            )}
          </div>

          {/* Keyword Search */}
          <div className="space-y-2">
            <label
              htmlFor="catalog-keyword-search"
              className="text-[13px] font-bold uppercase tracking-wider text-stone-800"
            >
              Keyword Search
            </label>
            <div className="relative">
              <input
                id="catalog-keyword-search"
                type="text"
                value={searchInput}
                onChange={(e) => handleSearchInputChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleImmediateSearchSubmit();
                  }
                }}
                placeholder="Name, SKU, description..."
                className="w-full text-sm pl-3.5 pr-14 py-2.5 border border-stone-300 rounded-xl outline-none focus:border-gold-500 text-stone-900 placeholder:text-stone-400"
              />
              {searchInput && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => {
                    if (searchDebounceRef.current !== null) {
                      window.clearTimeout(searchDebounceRef.current);
                    }
                    setSearchDraftState({ urlValue: '', text: '' });
                    commitKeywordSearch('');
                  }}
                  className="absolute right-9 top-3 text-stone-400 hover:text-stone-700"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                aria-label="Search products"
                onClick={handleImmediateSearchSubmit}
                className="absolute right-3 top-3 text-stone-400 hover:text-gold-600"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Main Category (Dynamic from Admin CMS) */}
          <div className="space-y-2">
            <label
              htmlFor="catalog-category-select"
              className="text-[13px] font-bold uppercase tracking-wider text-stone-800"
            >
              Main Category
            </label>
            <select
              id="catalog-category-select"
              value={effectiveCategoryId}
              onChange={(e) => handleCategoryChange(e.target.value)}
              aria-label="Filter by category"
              className="w-full text-sm p-2.5 border border-stone-300 rounded-xl outline-none focus:border-gold-500 bg-white text-stone-800 font-medium"
            >
              <option value="">All Categories</option>
              {rootCategories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
            {!categoriesLoading && rootCategories.length === 0 && (
              <p className="text-xs text-stone-400">
                No active categories published yet.
              </p>
            )}
          </div>

          {/* Subcategory (Dynamic from Admin CMS) */}
          <div className="space-y-2 pt-2 border-t border-stone-100">
            <label
              htmlFor="catalog-subcategory-select"
              className="text-[13px] font-bold uppercase tracking-wider text-stone-800 flex items-center justify-between"
            >
              <span>Subcategory</span>
              {resolvedCategory && (
                <span className="text-[11px] font-normal text-stone-500">
                  in {resolvedCategory.name}
                </span>
              )}
            </label>
            <select
              id="catalog-subcategory-select"
              value={urlSubcategoryId}
              onChange={(e) => handleSubcategoryChange(e.target.value)}
              aria-label="Filter by subcategory"
              disabled={Boolean(effectiveCategoryId && categorySubcategories.length === 0)}
              className="w-full text-sm p-2.5 border border-stone-300 rounded-xl outline-none focus:border-gold-500 bg-white text-stone-800 font-medium disabled:bg-stone-100 disabled:text-stone-400 disabled:cursor-not-allowed"
            >
              {effectiveCategoryId ? (
                categorySubcategories.length > 0 ? (
                  <>
                    <option value="">All {resolvedCategory?.name || ''} Subcategories</option>
                    {categorySubcategories.map((sub) => (
                      <option key={sub._id} value={sub._id}>
                        {sub.name}
                      </option>
                    ))}
                  </>
                ) : (
                  <option value="">No subcategories available</option>
                )
              ) : (
                <>
                  <option value="">All Subcategories</option>
                  {groupedSubcategories.map((group) => (
                    <optgroup key={group.parent._id} label={group.parent.name}>
                      {group.subcategories.map((sub) => (
                        <option key={sub._id} value={sub._id}>
                          {sub.name}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </>
              )}
            </select>
            {effectiveCategoryId && categorySubcategories.length === 0 && (
              <p className="text-[11px] text-stone-400">
                No subcategories under {resolvedCategory?.name || 'this category'}.
              </p>
            )}
          </div>

          {/* Product Classification (Bridal / Traditional / Daily Wear) */}
          <div className="space-y-2 pt-2 border-t border-stone-100">
            <span className="block text-[13px] font-bold uppercase tracking-wider text-stone-800">
              Classification
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  if (urlClassification) handleToggleClassification(urlClassification);
                }}
                aria-pressed={urlClassification === ''}
                className={`text-[13px] px-3.5 py-1.5 rounded-lg border transition-all ${
                  urlClassification === ''
                    ? 'bg-burgundy-900 text-gold-200 border-burgundy-900 font-semibold shadow-sm'
                    : 'border-stone-200 text-stone-700 hover:bg-stone-50 font-medium'
                }`}
              >
                All
              </button>
              {CLASSIFICATION_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleToggleClassification(opt.value)}
                  aria-pressed={urlClassification === opt.value}
                  className={`text-[13px] px-3.5 py-1.5 rounded-lg border transition-all ${
                    urlClassification === opt.value
                      ? 'bg-burgundy-900 text-gold-200 border-burgundy-900 font-semibold shadow-sm'
                      : 'border-stone-200 text-stone-700 hover:bg-stone-50 font-medium'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Precious Metal Type */}
          <div className="space-y-2 pt-2 border-t border-stone-100">
            <span className="block text-[13px] font-bold uppercase tracking-wider text-stone-800">
              Precious Metal
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  if (metalType) handleToggleMetal(metalType);
                }}
                aria-pressed={metalType === ''}
                className={`text-[13px] px-3.5 py-1.5 rounded-lg border transition-all ${
                  metalType === ''
                    ? 'bg-burgundy-900 text-gold-200 border-burgundy-900 font-semibold shadow-sm'
                    : 'border-stone-200 text-stone-700 hover:bg-stone-50 font-medium'
                }`}
              >
                All Metals
              </button>
              {METAL_OPTIONS.map((metal) => (
                <button
                  key={metal.value}
                  type="button"
                  onClick={() => handleToggleMetal(metal.value)}
                  aria-pressed={metalType === metal.value}
                  className={`text-[13px] px-3.5 py-1.5 rounded-lg border transition-all ${
                    metalType === metal.value
                      ? 'bg-burgundy-900 text-gold-200 border-burgundy-900 font-semibold shadow-sm'
                      : 'border-stone-200 text-stone-700 hover:bg-stone-50 font-medium'
                  }`}
                >
                  {metal.label}
                </button>
              ))}
            </div>
          </div>

          {/* Metal-Specific Purity & Grading Filters */}
          {metalType === 'GOLD' && (
            <div className="space-y-2 pt-2 border-t border-stone-100">
              <span className="block text-[13px] font-bold uppercase tracking-wider text-stone-800">
                Gold Karat &amp; Fineness
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleTogglePurity('')}
                  aria-pressed={purity === ''}
                  className={`text-[13px] px-3.5 py-1.5 rounded-lg border transition-all ${
                    purity === ''
                      ? 'bg-gold-500 text-burgundy-950 border-gold-500 font-bold shadow-sm'
                      : 'border-stone-200 text-stone-700 hover:bg-stone-50 font-medium'
                  }`}
                >
                  All Karats
                </button>
                {GOLD_PURITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    title={opt.description}
                    onClick={() => handleTogglePurity(opt.value)}
                    aria-pressed={purity === opt.value}
                    className={`text-[13px] px-3.5 py-1.5 rounded-lg border transition-all ${
                      purity === opt.value
                        ? 'bg-gold-500 text-burgundy-950 border-gold-500 font-bold shadow-sm'
                        : 'border-stone-200 text-stone-700 hover:bg-stone-50 font-medium'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {metalType === 'SILVER' && (
            <div className="space-y-2 pt-2 border-t border-stone-100">
              <span className="block text-[13px] font-bold uppercase tracking-wider text-stone-800">
                Silver Fineness (Parts / 1000)
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleTogglePurity('')}
                  aria-pressed={purity === ''}
                  className={`text-[13px] px-3.5 py-1.5 rounded-lg border transition-all ${
                    purity === ''
                      ? 'bg-gold-500 text-burgundy-950 border-gold-500 font-bold shadow-sm'
                      : 'border-stone-200 text-stone-700 hover:bg-stone-50 font-medium'
                  }`}
                >
                  All Fineness
                </button>
                {SILVER_FINENESS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    title={opt.description}
                    onClick={() => handleTogglePurity(opt.value)}
                    aria-pressed={purity === opt.value}
                    className={`text-[13px] px-3.5 py-1.5 rounded-lg border transition-all ${
                      purity === opt.value
                        ? 'bg-gold-500 text-burgundy-950 border-gold-500 font-bold shadow-sm'
                        : 'border-stone-200 text-stone-700 hover:bg-stone-50 font-medium'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {metalType === 'PLATINUM' && (
            <div className="space-y-2 pt-2 border-t border-stone-100">
              <span className="block text-[13px] font-bold uppercase tracking-wider text-stone-800">
                Platinum Hallmark Grade
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleTogglePurity('')}
                  aria-pressed={purity === ''}
                  className={`text-[13px] px-3.5 py-1.5 rounded-lg border transition-all ${
                    purity === ''
                      ? 'bg-gold-500 text-burgundy-950 border-gold-500 font-bold shadow-sm'
                      : 'border-stone-200 text-stone-700 hover:bg-stone-50 font-medium'
                  }`}
                >
                  All Pt Grades
                </button>
                {PLATINUM_HALLMARK_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    title={opt.description}
                    onClick={() => handleTogglePurity(opt.value)}
                    aria-pressed={purity === opt.value}
                    className={`text-[13px] px-3.5 py-1.5 rounded-lg border transition-all ${
                      purity === opt.value
                        ? 'bg-gold-500 text-burgundy-950 border-gold-500 font-bold shadow-sm'
                        : 'border-stone-200 text-stone-700 hover:bg-stone-50 font-medium'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {metalType === 'DIAMOND' && (
            <div className="space-y-4 pt-2 border-t border-stone-100">
              {/* Diamond Cut */}
              <div className="space-y-2">
                <span className="block text-[13px] font-bold uppercase tracking-wider text-stone-800">
                  Diamond Cut
                </span>
                <div className="flex flex-wrap gap-2">
                  {DIAMOND_CUT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleToggleDiamondParam('diamondCut', opt.value)}
                      aria-pressed={diamondCut === opt.value}
                      className={`text-[13px] px-3 py-1.5 rounded-lg border transition-all ${
                        diamondCut === opt.value
                          ? 'bg-gold-500 text-burgundy-950 border-gold-500 font-bold shadow-sm'
                          : 'border-stone-200 text-stone-700 hover:bg-stone-50 font-medium'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Diamond Clarity */}
              <div className="space-y-2">
                <span className="block text-[13px] font-bold uppercase tracking-wider text-stone-800">
                  Clarity (FL - I3)
                </span>
                <div className="flex flex-wrap gap-2">
                  {DIAMOND_CLARITY_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleToggleDiamondParam('diamondClarity', opt.value)}
                      aria-pressed={diamondClarity === opt.value}
                      className={`text-[13px] px-3 py-1.5 rounded-lg border transition-all ${
                        diamondClarity === opt.value
                          ? 'bg-gold-500 text-burgundy-950 border-gold-500 font-bold shadow-sm'
                          : 'border-stone-200 text-stone-700 hover:bg-stone-50 font-medium'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Diamond Colour */}
              <div className="space-y-2">
                <span className="block text-[13px] font-bold uppercase tracking-wider text-stone-800">
                  Colour Scale (D - Z)
                </span>
                <div className="flex flex-wrap gap-2">
                  {DIAMOND_COLOR_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleToggleDiamondParam('diamondColor', opt.value)}
                      aria-pressed={diamondColor === opt.value}
                      className={`text-[13px] px-3 py-1.5 rounded-lg border transition-all ${
                        diamondColor === opt.value
                          ? 'bg-gold-500 text-burgundy-950 border-gold-500 font-bold shadow-sm'
                          : 'border-stone-200 text-stone-700 hover:bg-stone-50 font-medium'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Diamond Shape */}
              <div className="space-y-2">
                <span className="block text-[13px] font-bold uppercase tracking-wider text-stone-800">
                  Diamond Shape
                </span>
                <div className="flex flex-wrap gap-2">
                  {DIAMOND_SHAPE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleToggleDiamondParam('diamondShape', opt.value)}
                      aria-pressed={diamondShape === opt.value}
                      className={`text-[13px] px-3 py-1.5 rounded-lg border transition-all ${
                        diamondShape === opt.value
                          ? 'bg-gold-500 text-burgundy-950 border-gold-500 font-bold shadow-sm'
                          : 'border-stone-200 text-stone-700 hover:bg-stone-50 font-medium'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Carat Range */}
              <div className="space-y-2">
                <span className="block text-[13px] font-bold uppercase tracking-wider text-stone-800">
                  Carat Weight (ct)
                </span>
                <div className="flex flex-wrap gap-2">
                  {DIAMOND_CARAT_RANGES.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleToggleDiamondParam('caratRange', opt.value)}
                      aria-pressed={caratRange === opt.value}
                      className={`text-[13px] px-3 py-1.5 rounded-lg border transition-all ${
                        caratRange === opt.value
                          ? 'bg-gold-500 text-burgundy-950 border-gold-500 font-bold shadow-sm'
                          : 'border-stone-200 text-stone-700 hover:bg-stone-50 font-medium'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Diamond Certification */}
              <div className="space-y-2">
                <span className="block text-[13px] font-bold uppercase tracking-wider text-stone-800">
                  Certification
                </span>
                <div className="flex flex-wrap gap-2">
                  {DIAMOND_CERT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleToggleDiamondParam('diamondCert', opt.value)}
                      aria-pressed={diamondCert === opt.value}
                      className={`text-[13px] px-3 py-1.5 rounded-lg border transition-all ${
                        diamondCert === opt.value
                          ? 'bg-gold-500 text-burgundy-950 border-gold-500 font-bold shadow-sm'
                          : 'border-stone-200 text-stone-700 hover:bg-stone-50 font-medium'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {metalType === '' && (
            <div className="space-y-2 pt-2 border-t border-stone-100">
              <span className="block text-[13px] font-bold uppercase tracking-wider text-stone-800">
                Purity
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleTogglePurity('')}
                  aria-pressed={purity === ''}
                  className={`text-[13px] px-3.5 py-1.5 rounded-lg border transition-all ${
                    purity === ''
                      ? 'bg-gold-500 text-burgundy-950 border-gold-500 font-bold shadow-sm'
                      : 'border-stone-200 text-stone-700 hover:bg-stone-50 font-medium'
                  }`}
                >
                  All
                </button>
                {GENERAL_PURITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleTogglePurity(opt.value)}
                    aria-pressed={purity === opt.value}
                    className={`text-[13px] px-3.5 py-1.5 rounded-lg border transition-all ${
                      purity === opt.value
                        ? 'bg-gold-500 text-burgundy-950 border-gold-500 font-bold shadow-sm'
                        : 'border-stone-200 text-stone-700 hover:bg-stone-50 font-medium'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* Products Grid Area */}
        <div className="flex-1 min-w-0 space-y-5">
          {/* Active Count & Active Filter Chips Bar */}
          <div className="bg-white rounded-xl border border-stone-200 px-4 py-3 flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <p className="font-medium text-stone-700" aria-live="polite">
                {isLoading ? (
                  'Loading curated jewellery pieces...'
                ) : (
                  <>
                    Showing <span className="font-bold text-burgundy-950">{products.length}</span> of{' '}
                    <span className="font-bold text-burgundy-950">{totalCount}</span>{' '}
                    {totalCount === 1 ? 'creation' : 'creations'}
                  </>
                )}
              </p>
              {isFetching && !isLoading && (
                <span className="text-[11px] text-stone-500 italic">
                  Updating...
                </span>
              )}
            </div>

            {activeFilterChips.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-stone-100">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
                  Active Filters:
                </span>
                {activeFilterChips.map((chip) => (
                  <button
                    key={chip.key}
                    type="button"
                    onClick={chip.onClear}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gold-50 border border-gold-400/70 text-burgundy-950 text-[11px] font-semibold hover:bg-gold-100 transition-colors"
                  >
                    <span>{chip.label}</span>
                    <X className="w-3 h-3 text-burgundy-800" />
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleClearAllFilters}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold text-burgundy-800 hover:bg-burgundy-50 transition-colors ml-auto"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Clear All Filters</span>
                </button>
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="aspect-[3/4] bg-stone-200 rounded-xl" />
              ))}
            </div>
          ) : products.length > 0 ? (
            <StaggerReveal
              key={`${effectiveCategoryId}-${urlSubcategoryId}-${effectiveCategorySlug}-${metalType}-${purity}-${page}-${urlSearch}`}
              staggerMs={55}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </StaggerReveal>
          ) : (
            <div className="bg-white rounded-xl p-12 text-center border border-stone-200 space-y-3">
              <h3 className="font-serif font-bold text-lg text-burgundy-950">
                No matching jewellery found
              </h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                We could not find any pieces matching your selected criteria. Try adjusting or clearing your filters to explore our full showcase.
              </p>
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={handleClearAllFilters}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-burgundy-900 text-gold-200 text-xs font-semibold hover:bg-burgundy-800"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Clear All Filters</span>
                </button>
              )}
            </div>
          )}

          {/* Pagination */}
          {meta && totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-center gap-2 pt-6 border-t border-stone-200">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => handlePageChange(page - 1)}
                className="px-3 py-1.5 rounded-lg border border-stone-300 bg-white text-xs font-medium text-stone-700 hover:border-gold-500 disabled:opacity-40"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, idx) => idx + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .map((p, idx, arr) => {
                  const prevPageNum = arr[idx - 1];
                  const showEllipsis = prevPageNum && p - prevPageNum > 1;
                  return (
                    <React.Fragment key={p}>
                      {showEllipsis && <span className="text-xs text-stone-400 px-1">…</span>}
                      <button
                        type="button"
                        onClick={() => handlePageChange(p)}
                        aria-current={p === page ? 'page' : undefined}
                        className={`min-w-[32px] px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                          p === page
                            ? 'bg-burgundy-900 text-gold-200 border-burgundy-900'
                            : 'bg-white text-stone-700 border-stone-300 hover:border-gold-500'
                        }`}
                      >
                        {p}
                      </button>
                    </React.Fragment>
                  );
                })}
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => handlePageChange(page + 1)}
                className="px-3 py-1.5 rounded-lg border border-stone-300 bg-white text-xs font-medium text-stone-700 hover:border-gold-500 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filters Bottom Sheet Portal */}
      {mobileFiltersOpen && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setMobileFiltersOpen(false);
          }}
        >
          <div
            className="w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl max-h-[80vh] sm:max-h-[85vh] flex flex-col overflow-hidden shadow-2xl border-t sm:border border-gold-400/40 animate-bottom-sheet"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with Title and Close Button */}
            <div className="bg-burgundy-900 text-gold-100 py-2.5 px-4 border-b border-gold-600/30 flex items-center justify-between shrink-0 shadow-xs">
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-gold-400" />
                <h3 className="font-serif font-bold text-sm text-gold-100">
                  Filter Catalogue
                </h3>
                {activeFilterCount > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-gold-400 text-burgundy-950 text-[10px] font-extrabold">
                    {activeFilterCount}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="p-1 rounded-lg text-gold-300 hover:text-white hover:bg-burgundy-800 transition-colors"
                aria-label="Close filters drawer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Filter Body */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-3.5 space-y-2.5 text-xs">
              <div>
                <label htmlFor="mobile-filter-search" className="block text-[10.5px] font-bold uppercase tracking-wider mb-0.5 text-stone-700">
                  Keyword Search
                </label>
                <input
                  id="mobile-filter-search"
                  type="text"
                  value={mobileDraftSearch}
                  onChange={(e) => setMobileDraftSearch(e.target.value)}
                  placeholder="Name, SKU, description..."
                  className="w-full h-8 px-2.5 text-xs border border-stone-300 rounded-lg outline-none focus:border-gold-500 bg-white"
                />
              </div>

              {/* Main Category & Subcategory side-by-side to minimize vertical space */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="mobile-filter-category" className="block text-[10.5px] font-bold uppercase tracking-wider mb-0.5 text-stone-700 truncate">
                    Category
                  </label>
                  <select
                    id="mobile-filter-category"
                    value={mobileDraftCategoryId}
                    onChange={(e) => {
                      setMobileDraftCategoryId(e.target.value);
                      setMobileDraftSubcategoryId('');
                    }}
                    className="w-full h-8 px-2 text-xs border border-stone-300 rounded-lg bg-white outline-none focus:border-gold-500 font-medium truncate"
                  >
                    <option value="">All Categories</option>
                    {rootCategories.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="mobile-filter-subcategory" className="block text-[10.5px] font-bold uppercase tracking-wider mb-0.5 text-stone-700 truncate">
                    Subcategory
                  </label>
                  <select
                    id="mobile-filter-subcategory"
                    value={mobileDraftSubcategoryId}
                    onChange={(e) => {
                      const nextSubId = e.target.value;
                      setMobileDraftSubcategoryId(nextSubId);
                      if (nextSubId && !mobileDraftCategoryId) {
                        const sub = categories.find((c) => c._id === nextSubId);
                        const parentId = sub ? getCategoryParentId(sub) : null;
                        if (parentId) {
                          setMobileDraftCategoryId(parentId);
                        }
                      }
                    }}
                    disabled={Boolean(mobileDraftCategoryId && mobileCategorySubcategories.length === 0)}
                    className="w-full h-8 px-2 text-xs border border-stone-300 bg-white rounded-lg outline-none focus:border-gold-500 font-medium truncate disabled:bg-stone-100 disabled:text-stone-400 disabled:cursor-not-allowed"
                  >
                    {mobileDraftCategoryId ? (
                      mobileCategorySubcategories.length > 0 ? (
                        <>
                          <option value="">All Subcategories</option>
                          {mobileCategorySubcategories.map((sub) => (
                            <option key={sub._id} value={sub._id}>
                              {sub.name}
                            </option>
                          ))}
                        </>
                      ) : (
                        <option value="">No subcategories</option>
                      )
                    ) : (
                      <>
                        <option value="">All Subcategories</option>
                        {groupedSubcategories.map((group) => (
                          <optgroup key={group.parent._id} label={group.parent.name}>
                            {group.subcategories.map((sub) => (
                              <option key={sub._id} value={sub._id}>
                                {sub.name}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </>
                    )}
                  </select>
                </div>
              </div>

              {/* Classification */}
              <div>
                <span className="block text-[10.5px] font-bold uppercase tracking-wider mb-1 text-stone-700">
                  Classification
                </span>
                <div className="flex flex-wrap gap-1">
                  <button
                    type="button"
                    onClick={() => setMobileDraftClassification('')}
                    className={`px-2.5 py-1 text-[11px] rounded-md border transition-colors ${
                      mobileDraftClassification === ''
                        ? 'bg-burgundy-900 text-gold-200 border-burgundy-900 font-semibold shadow-xs'
                        : 'border-stone-200 text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    All
                  </button>
                  {CLASSIFICATION_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setMobileDraftClassification(
                          mobileDraftClassification === opt.value ? '' : opt.value
                        );
                      }}
                      className={`px-2.5 py-1 text-[11px] rounded-md border transition-colors ${
                        mobileDraftClassification === opt.value
                          ? 'bg-burgundy-900 text-gold-200 border-burgundy-900 font-semibold shadow-xs'
                          : 'border-stone-200 text-stone-700 hover:bg-stone-50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Precious Metal */}
              <div>
                <span className="block text-[10.5px] font-bold uppercase tracking-wider mb-1 text-stone-700">Precious Metal</span>
                <div className="flex flex-wrap gap-1">
                  <button
                    type="button"
                    onClick={() => setMobileDraftMetal('')}
                    className={`px-2.5 py-1 text-[11px] rounded-md border transition-colors ${
                      mobileDraftMetal === ''
                        ? 'bg-burgundy-900 text-gold-200 border-burgundy-900 font-semibold shadow-xs'
                        : 'border-stone-200 text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    All Metals
                  </button>
                  {METAL_OPTIONS.map((metal) => (
                    <button
                      key={metal.value}
                      type="button"
                      onClick={() => {
                        const nextMetal = mobileDraftMetal === metal.value ? '' : metal.value;
                        setMobileDraftMetal(nextMetal);
                        setMobileDraftPurity('');
                        setMobileDraftCut('');
                        setMobileDraftColor('');
                        setMobileDraftClarity('');
                        setMobileDraftShape('');
                        setMobileDraftCert('');
                        setMobileDraftCarat('');
                      }}
                      className={`px-2.5 py-1 text-[11px] rounded-md border transition-colors ${
                        mobileDraftMetal === metal.value
                          ? 'bg-burgundy-900 text-gold-200 border-burgundy-900 font-semibold shadow-xs'
                          : 'border-stone-200 text-stone-700 hover:bg-stone-50'
                      }`}
                    >
                      {metal.label}
                    </button>
                  ))}
                </div>
              </div>

              {mobileDraftMetal === 'GOLD' && (
                <div>
                  <span className="block font-semibold uppercase mb-1 text-[10.5px]">Gold Karat &amp; Fineness</span>
                  <div className="flex flex-wrap gap-1">
                    {GOLD_PURITY_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setMobileDraftPurity(mobileDraftPurity === opt.value ? '' : opt.value)}
                        className={`px-2 py-1 rounded-md border text-[10.5px] transition-colors ${
                          mobileDraftPurity === opt.value
                            ? 'bg-gold-500 text-burgundy-950 border-gold-500 font-bold'
                            : 'border-stone-200 text-stone-700'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {mobileDraftMetal === 'SILVER' && (
                <div>
                  <span className="block font-semibold uppercase mb-1 text-[10.5px]">Silver Fineness</span>
                  <div className="flex flex-wrap gap-1">
                    {SILVER_FINENESS_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setMobileDraftPurity(mobileDraftPurity === opt.value ? '' : opt.value)}
                        className={`px-2 py-1 rounded-md border text-[10.5px] transition-colors ${
                          mobileDraftPurity === opt.value
                            ? 'bg-gold-500 text-burgundy-950 border-gold-500 font-bold'
                            : 'border-stone-200 text-stone-700'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {mobileDraftMetal === 'PLATINUM' && (
                <div>
                  <span className="block font-semibold uppercase mb-1 text-[10.5px]">Platinum Hallmark</span>
                  <div className="flex flex-wrap gap-1">
                    {PLATINUM_HALLMARK_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setMobileDraftPurity(mobileDraftPurity === opt.value ? '' : opt.value)}
                        className={`px-2 py-1 rounded-md border text-[10.5px] transition-colors ${
                          mobileDraftPurity === opt.value
                            ? 'bg-gold-500 text-burgundy-950 border-gold-500 font-bold'
                            : 'border-stone-200 text-stone-700'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {mobileDraftMetal === 'DIAMOND' && (
                <div className="space-y-2">
                  <div>
                    <span className="block font-semibold uppercase mb-1 text-[10.5px]">Cut</span>
                    <div className="flex flex-wrap gap-1">
                      {DIAMOND_CUT_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setMobileDraftCut(mobileDraftCut === opt.value ? '' : opt.value)}
                          className={`px-2 py-0.5 rounded-md border text-[10.5px] ${
                            mobileDraftCut === opt.value
                              ? 'bg-gold-500 text-burgundy-950 font-bold'
                              : 'border-stone-200 text-stone-700'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="block font-semibold uppercase mb-1 text-[10.5px]">Clarity</span>
                    <div className="flex flex-wrap gap-1">
                      {DIAMOND_CLARITY_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setMobileDraftClarity(mobileDraftClarity === opt.value ? '' : opt.value)}
                          className={`px-2 py-0.5 rounded-md border text-[10.5px] ${
                            mobileDraftClarity === opt.value
                              ? 'bg-gold-500 text-burgundy-950 font-bold'
                              : 'border-stone-200 text-stone-700'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="block font-semibold uppercase mb-1 text-[10.5px]">Colour Scale (D - Z)</span>
                    <div className="flex flex-wrap gap-1">
                      {DIAMOND_COLOR_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setMobileDraftColor(mobileDraftColor === opt.value ? '' : opt.value)}
                          className={`px-2 py-0.5 rounded-md border text-[10.5px] ${
                            mobileDraftColor === opt.value
                              ? 'bg-gold-500 text-burgundy-950 font-bold'
                              : 'border-stone-200 text-stone-700'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="block font-semibold uppercase mb-1 text-[10.5px]">Shape</span>
                    <div className="flex flex-wrap gap-1">
                      {DIAMOND_SHAPE_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setMobileDraftShape(mobileDraftShape === opt.value ? '' : opt.value)}
                          className={`px-2 py-0.5 rounded-md border text-[10.5px] ${
                            mobileDraftShape === opt.value
                              ? 'bg-gold-500 text-burgundy-950 font-bold'
                              : 'border-stone-200 text-stone-700'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="block font-semibold uppercase mb-1 text-[10.5px]">Carat Weight</span>
                    <div className="flex flex-wrap gap-1">
                      {DIAMOND_CARAT_RANGES.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setMobileDraftCarat(mobileDraftCarat === opt.value ? '' : opt.value)}
                          className={`px-2 py-0.5 rounded-md border text-[10.5px] ${
                            mobileDraftCarat === opt.value
                              ? 'bg-gold-500 text-burgundy-950 font-bold'
                              : 'border-stone-200 text-stone-700'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sticky Footer Action Buttons */}
            <div className="p-2.5 sm:p-3 bg-white border-t border-stone-200 shrink-0 flex items-center gap-2 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
              <button
                type="button"
                onClick={() => {
                  setMobileDraftSearch('');
                  setMobileDraftCategoryId('');
                  setMobileDraftSubcategoryId('');
                  setMobileDraftClassification('');
                  setMobileDraftMetal('');
                  setMobileDraftPurity('');
                  setMobileDraftCut('');
                  setMobileDraftColor('');
                  setMobileDraftClarity('');
                  setMobileDraftShape('');
                  setMobileDraftCert('');
                  setMobileDraftCarat('');
                }}
                className="w-1/3 py-2 border border-stone-300 rounded-xl text-xs font-bold text-stone-700 hover:bg-stone-50 active:scale-[0.98] transition-all"
              >
                Clear All
              </button>
              <button
                type="button"
                onClick={handleApplyMobileDrawer}
                className="flex-1 py-2 bg-brand-maroon-gradient text-gold-200 rounded-xl text-xs font-bold uppercase tracking-wider shadow-md hover:opacity-95 active:scale-[0.98] transition-all"
              >
                Show Results
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
