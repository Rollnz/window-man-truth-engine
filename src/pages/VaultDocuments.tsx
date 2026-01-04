import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePageTracking } from '@/hooks/usePageTracking';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import {
  Upload,
  FileText,
  Shield,
  Image,
  FileCheck,
  Download,
  Trash2,
  Eye,
  ArrowLeft,
  Lock,
  Search,
  Filter,
  MoreVertical,
  Share2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Document {
  id: string;
  created_at: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  category: string;
  description?: string;
}

const CATEGORY_CONFIG: Record<
  string,
  {
    name: string;
    icon: any;
    description: string;
    color: string;
    emptyMessage: string;
  }
> = {
  quotes: {
    name: 'Quotes & Estimates',
    icon: FileText,
    description: 'Contractor quotes, estimates, and proposals',
    color: 'blue',
    emptyMessage: 'No quotes uploaded yet. Upload your first contractor quote to get started.',
  },
  insurance: {
    name: 'Insurance & Claims',
    icon: Shield,
    description: 'Insurance policies, claims documentation, and correspondence',
    color: 'green',
    emptyMessage: 'No insurance documents yet. Upload your policy for safekeeping.',
  },
  warranties: {
    name: 'Warranties & Manuals',
    icon: FileCheck,
    description: 'Product warranties, user manuals, and receipts',
    color: 'purple',
    emptyMessage: 'No warranties saved. Keep your product warranties and manuals here.',
  },
  photos: {
    name: 'Property Photos',
    icon: Image,
    description: 'Before/after photos, damage documentation, and progress updates',
    color: 'orange',
    emptyMessage: 'No photos uploaded. Document your property condition with photos.',
  },
  permits: {
    name: 'Permits & Inspections',
    icon: FileText,
    description: 'Building permits, inspection reports, and approvals',
    color: 'cyan',
    emptyMessage: 'No permits on file. Store your building permits and inspection reports here.',
  },
};

export default function VaultDocuments() {
  const { category = 'all' } = useParams<{ category: string }>();
  usePageTracking(`vault-documents-${category}`);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchDocuments();
  }, [category, user]);

  const fetchDocuments = async () => {
    if (!user) return;

    setLoading(true);
    try {
      let query = supabase
        .from('vault_documents')
        .select('*')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      // Filter by category if not "all"
      if (category && category !== 'all') {
        query = query.eq('category', category);
      }

      const { data, error } = await query;

      if (error) throw error;

      setDocuments(data || []);
    } catch (error: any) {
      console.error('Error fetching documents:', error);
      toast({
        title: 'Error Loading Documents',
        description: error.message || 'Failed to load documents. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (doc: Document) => {
    try {
      const { data, error } = await supabase.storage
        .from('vault-documents')
        .createSignedUrl(doc.file_path, 60); // 1 minute expiry

      if (error) throw error;

      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank');
      }
    } catch (error: any) {
      console.error('Error downloading document:', error);
      toast({
        title: 'Download Failed',
        description: error.message || 'Failed to download document. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (doc: Document) => {
    if (!confirm(`Are you sure you want to delete "${doc.file_name}"?`)) {
      return;
    }

    try {
      // Soft delete - set deleted_at timestamp
      const { error } = await supabase
        .from('vault_documents')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', doc.id);

      if (error) throw error;

      toast({
        title: 'Document Deleted',
        description: `${doc.file_name} has been removed from your vault.`,
      });

      // Refresh the list
      fetchDocuments();
    } catch (error: any) {
      console.error('Error deleting document:', error);
      toast({
        title: 'Delete Failed',
        description: error.message || 'Failed to delete document. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return <Image className="w-5 h-5" />;
    }
    return <FileText className="w-5 h-5" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const config = CATEGORY_CONFIG[category] || {
    name: 'All Documents',
    icon: FileText,
    description: 'All your home protection documents',
    color: 'blue',
    emptyMessage: 'No documents uploaded yet.',
  };

  const CategoryIcon = config.icon;

  const filteredDocuments = documents.filter((doc) =>
    doc.file_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Premium Header */}
      <div className="bg-gradient-to-r from-blue-600 to-green-600 text-white py-4 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6" />
            <span className="text-lg font-semibold">Horizons Vault</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/20"
            onClick={() => navigate('/vault')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Vault
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Category Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div
              className={`w-14 h-14 rounded-lg bg-${config.color}-500/20 flex items-center justify-center`}
            >
              <CategoryIcon className={`w-7 h-7 text-${config.color}-500`} />
            </div>
            <div>
              <h1 className="text-3xl font-bold">{config.name}</h1>
              <p className="text-muted-foreground">{config.description}</p>
            </div>
          </div>

          {/* Actions Bar */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background"
              />
            </div>

            <Button onClick={() => navigate(`/vault/upload?category=${category}`)}>
              <Upload className="w-4 h-4 mr-2" />
              Upload Documents
            </Button>
          </div>
        </div>

        {/* Documents List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading documents...</p>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <Card className="p-12 text-center">
            <div
              className={`w-16 h-16 rounded-full bg-${config.color}-500/20 flex items-center justify-center mx-auto mb-4`}
            >
              <CategoryIcon className={`w-8 h-8 text-${config.color}-500`} />
            </div>
            <h3 className="text-xl font-semibold mb-2">
              {searchQuery ? 'No documents found' : 'No documents yet'}
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              {searchQuery
                ? `No documents match "${searchQuery}". Try a different search term.`
                : config.emptyMessage}
            </p>
            {!searchQuery && (
              <Button onClick={() => navigate(`/vault/upload?category=${category}`)}>
                <Upload className="w-4 h-4 mr-2" />
                Upload Your First Document
              </Button>
            )}
          </Card>
        ) : (
          <>
            {/* Document Count */}
            <div className="mb-4">
              <p className="text-sm text-muted-foreground">
                {filteredDocuments.length} document{filteredDocuments.length !== 1 ? 's' : ''}
                {searchQuery && ` matching "${searchQuery}"`}
              </p>
            </div>

            {/* Documents Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDocuments.map((doc) => (
                <Card key={doc.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                      {getFileIcon(doc.file_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate mb-1">{doc.file_name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(doc.file_size)} • {formatDate(doc.created_at)}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleDownload(doc)}>
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Share2 className="w-4 h-4 mr-2" />
                          Share
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(doc)}
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {doc.description && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {doc.description}
                    </p>
                  )}

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleDownload(doc)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}

        {/* Security Badge */}
        <div className="mt-8 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
          <div className="flex items-center gap-2 mb-2">
            <Lock className="w-4 h-4 text-green-500" />
            <span className="text-sm font-semibold text-green-500">BANK-LEVEL SECURITY</span>
          </div>
          <p className="text-xs text-muted-foreground">
            All documents are encrypted with AES-256 encryption. Only you can access your files.
          </p>
        </div>
      </div>
    </div>
  );
}
