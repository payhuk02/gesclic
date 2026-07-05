// Integration Catalog Component
// Main component for browsing and discovering integrations

import { useState, useEffect } from 'react';
import { Search, Filter, Star, Download, ExternalLink, Shield, Clock, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { integrationMarketplaceService } from '@/services/integration-marketplace.service';
import { useClinic } from '@/contexts/ClinicContext';
import type { IntegrationCatalog as IntegrationCatalogItem, IntegrationFilters, IntegrationCategory, PricingModel } from '@/types/phase2';

const categories: { value: IntegrationCategory; label: string }[] = [
  { value: 'ehr', label: 'Dossiers Médicaux' },
  { value: 'medical_device', label: 'Appareils Médicaux' },
  { value: 'lab', label: 'Laboratoires' },
  { value: 'imaging', label: 'Imagerie' },
  { value: 'billing', label: 'Facturation' },
  { value: 'communication', label: 'Communication' },
  { value: 'analytics', label: 'Analytics' },
  { value: 'custom', label: 'Personnalisé' }
];

const pricingModels: { value: PricingModel; label: string }[] = [
  { value: 'free', label: 'Gratuit' },
  { value: 'freemium', label: 'Freemium' },
  { value: 'paid', label: 'Payant' },
  { value: 'enterprise', label: 'Enterprise' }
];

export function IntegrationCatalog() {
  const [integrations, setIntegrations] = useState<IntegrationCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<IntegrationFilters>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<IntegrationCategory | 'all'>('all');
  const [selectedPricing, setSelectedPricing] = useState<PricingModel | 'all'>('all');
  const [showFeatured, setShowFeatured] = useState(false);

  useEffect(() => {
    loadIntegrations();
  }, [filters]);

  const loadIntegrations = async () => {
    try {
      setLoading(true);
      const response = await integrationMarketplaceService.getIntegrations(filters, 1, 50);
      setIntegrations(response.data);
    } catch (error) {
      console.error('Error loading integrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setFilters({ ...filters, search: value || undefined });
  };

  const handleCategoryChange = (value: string) => {
    const category = value === 'all' ? undefined : value as IntegrationCategory;
    setSelectedCategory(value as IntegrationCategory | 'all');
    setFilters({ ...filters, category });
  };

  const handlePricingChange = (value: string) => {
    const pricing = value === 'all' ? undefined : value as PricingModel;
    setSelectedPricing(value as PricingModel | 'all');
    setFilters({ ...filters, pricing_model: pricing });
  };

  const handleFeaturedToggle = () => {
    setShowFeatured(!showFeatured);
    setFilters({ ...filters, featured: !showFeatured || undefined });
  };

  const featuredIntegrations = integrations.filter(i => i.featured);
  const regularIntegrations = integrations.filter(i => !i.featured);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Marketplace d'Intégrations</h1>
        <p className="text-muted-foreground">
          Découvrez et connectez des applications tierces pour étendre les fonctionnalités de Gesclic
        </p>
      </div>

      {/* Search and Filters */}
      <div className="mb-8 space-y-4">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher des intégrations..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant={showFeatured ? 'default' : 'outline'}
            onClick={handleFeaturedToggle}
          >
            <Star className="w-4 h-4 mr-2" />
            Vedettes
          </Button>
        </div>

        <div className="flex gap-4">
          <Select value={selectedCategory} onValueChange={handleCategoryChange}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Catégorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les catégories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedPricing} onValueChange={handlePricingChange}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Tarification" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les prix</SelectItem>
              {pricingModels.map((model) => (
                <SelectItem key={model.value} value={model.value}>
                  {model.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Featured Section */}
      {featuredIntegrations.length > 0 && !showFeatured && (
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
            Intégrations Vedettes
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredIntegrations.map((integration) => (
              <IntegrationCard key={integration.id} integration={integration} />
            ))}
          </div>
        </div>
      )}

      {/* All Integrations */}
      <div>
        <h2 className="text-2xl font-bold mb-4">
          {showFeatured ? 'Intégrations Vedettes' : 'Toutes les Intégrations'}
        </h2>
        
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            <p className="mt-4 text-muted-foreground">Chargement...</p>
          </div>
        ) : regularIntegrations.length === 0 && featuredIntegrations.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Aucune intégration trouvée</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(showFeatured ? featuredIntegrations : regularIntegrations).map((integration) => (
              <IntegrationCard key={integration.id} integration={integration} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface IntegrationCardProps {
  integration: IntegrationCatalogItem;
}

function IntegrationCard({ integration }: IntegrationCardProps) {
  const [isInstalled, setIsInstalled] = useState(false);
  const { activeClinicId } = useClinic();

  const handleInstall = async () => {
    try {
      if (!activeClinicId) {
        alert('Veuillez sélectionner une clinique');
        return;
      }

      await integrationMarketplaceService.installIntegration(activeClinicId, integration.id);
      setIsInstalled(true);
    } catch (error) {
      console.error('Error installing integration:', error);
      alert('Erreur lors de l\'installation');
    }
  };

  const getPricingBadge = () => {
    switch (integration.pricing_model) {
      case 'free':
        return <Badge variant="secondary">Gratuit</Badge>;
      case 'freemium':
        return <Badge variant="outline">Freemium</Badge>;
      case 'paid':
        return <Badge variant="default">Payant</Badge>;
      case 'enterprise':
        return <Badge className="bg-purple-600">Enterprise</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between mb-4">
          {integration.logo_url && (
            <img
              src={integration.logo_url}
              alt={integration.name}
              className="w-12 h-12 rounded-lg object-cover"
            />
          )}
          {getPricingBadge()}
        </div>
        <CardTitle className="text-lg">{integration.name}</CardTitle>
        <CardDescription className="line-clamp-2">
          {integration.description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Rating */}
          <div className="flex items-center gap-2">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < Math.floor(integration.average_rating)
                      ? 'text-yellow-500 fill-yellow-500'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">
              {integration.average_rating.toFixed(1)} ({integration.total_reviews})
            </span>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Download className="w-4 h-4" />
              <span>{integration.total_installs}</span>
            </div>
            <div className="flex items-center gap-1">
              <Shield className="w-4 h-4" />
              <span>Approuvé</span>
            </div>
          </div>

          {/* Category */}
          <Badge variant="outline" className="w-fit">
            {categories.find(c => c.value === integration.category)?.label}
          </Badge>
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button
          className="flex-1"
          disabled={isInstalled}
          onClick={handleInstall}
        >
          {isInstalled ? 'Installé' : 'Installer'}
        </Button>
        <Button variant="outline" size="icon">
          <ExternalLink className="w-4 h-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
