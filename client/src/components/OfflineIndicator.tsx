import React, { useState, useEffect } from 'react';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  X 
} from 'lucide-react';
// Mock sync manager for demo
const mockSyncManager = {
  addToQueue: async () => {},
  forceSync: async () => {},
  addStatusListener: (callback: any) => {
    // Simulate status updates
    callback({
      isOnline: navigator.onLine,
      isSyncing: false,
      queueCount: 0
    });
    return () => {};
  }
};

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  queueCount: number;
  lastSyncTime?: number;
  error?: string;
}
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface OfflineIndicatorProps {
  className?: string;
  showDetails?: boolean;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ 
  className = '', 
  showDetails = false 
}) => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: navigator.onLine,
    isSyncing: false,
    queueCount: 0
  });
  const [showTooltip, setShowTooltip] = useState(false);
  const [lastSyncMessage, setLastSyncMessage] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Subscribe to sync status updates  
    const unsubscribe = mockSyncManager.addStatusListener((status: SyncStatus) => {
      setSyncStatus(prevStatus => {
        const wasOffline = !prevStatus.isOnline;
        const wasQueueEmpty = prevStatus.queueCount === 0;
        
        // Show success toast when items are synced
        if (status.lastSyncTime && !wasQueueEmpty && status.queueCount === 0) {
          toast({
            title: "Synchronisé !",
            description: "Toutes les actions hors ligne ont été synchronisées",
            variant: "default",
          });
          setLastSyncMessage("Dernière sync: " + new Date(status.lastSyncTime).toLocaleTimeString());
        }

        // Show connection restored message
        if (wasOffline && status.isOnline) {
          toast({
            title: "Connexion rétablie",
            description: status.queueCount > 0 
              ? `Synchronisation de ${status.queueCount} action(s) en cours...`
              : "Vous êtes de nouveau en ligne",
            variant: "default",
          });
        }

        // Show error messages
        if (status.error) {
          toast({
            title: "Erreur de synchronisation",
            description: status.error,
            variant: "destructive",
          });
        }
        
        return status;
      });
    });

    return unsubscribe;
  }, [toast]);

  const handleForceSync = async () => {
    try {
      await mockSyncManager.forceSync();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de forcer la synchronisation",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = () => {
    if (!syncStatus.isOnline) return 'text-red-500';
    if (syncStatus.isSyncing) return 'text-blue-500';
    if (syncStatus.queueCount > 0) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getStatusIcon = () => {
    if (!syncStatus.isOnline) {
      return <WifiOff className="h-4 w-4" />;
    }
    if (syncStatus.isSyncing) {
      return <RefreshCw className="h-4 w-4 animate-spin" />;
    }
    if (syncStatus.queueCount > 0) {
      return <Clock className="h-4 w-4" />;
    }
    return <Wifi className="h-4 w-4" />;
  };

  const getStatusText = () => {
    if (!syncStatus.isOnline) return 'Hors ligne';
    if (syncStatus.isSyncing) return 'Synchronisation...';
    if (syncStatus.queueCount > 0) return `${syncStatus.queueCount} en attente`;
    return 'En ligne';
  };

  const getStatusDescription = () => {
    if (!syncStatus.isOnline) {
      return 'Vous êtes hors ligne. Les actions seront synchronisées dès que la connexion sera rétablie.';
    }
    if (syncStatus.isSyncing) {
      return 'Synchronisation des actions en cours...';
    }
    if (syncStatus.queueCount > 0) {
      return `${syncStatus.queueCount} action(s) en attente de synchronisation.`;
    }
    return 'Toutes les actions sont synchronisées.';
  };

  if (showDetails) {
    return (
      <div className={`bg-white rounded-lg shadow-lg border p-4 space-y-3 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={getStatusColor()}>
              {getStatusIcon()}
            </div>
            <span className="font-medium text-gray-900">
              État de connexion
            </span>
          </div>
          
          <Badge 
            variant={syncStatus.isOnline ? 'default' : 'destructive'}
            className={syncStatus.isSyncing ? 'animate-pulse' : ''}
          >
            {getStatusText()}
          </Badge>
        </div>

        <p className="text-sm text-gray-600">
          {getStatusDescription()}
        </p>

        {lastSyncMessage && (
          <p className="text-xs text-gray-500">
            {lastSyncMessage}
          </p>
        )}

        {syncStatus.queueCount > 0 && syncStatus.isOnline && (
          <div className="flex gap-2">
            <Button 
              size="sm" 
              onClick={handleForceSync}
              disabled={syncStatus.isSyncing}
              className="flex items-center gap-1"
            >
              <RefreshCw className={`h-3 w-3 ${syncStatus.isSyncing ? 'animate-spin' : ''}`} />
              Synchroniser maintenant
            </Button>
          </div>
        )}

        {!syncStatus.isOnline && (
          <div className="flex items-center gap-2 p-2 bg-orange-50 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-orange-500" />
            <span className="text-sm text-orange-700">
              Mode hors ligne activé
            </span>
          </div>
        )}
      </div>
    );
  }

  // Compact indicator for header
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div 
        className="relative"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <div className={`p-2 rounded-full transition-colors ${getStatusColor()}`}>
          {getStatusIcon()}
        </div>
        
        {syncStatus.queueCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
          >
            {syncStatus.queueCount > 99 ? '99+' : syncStatus.queueCount}
          </Badge>
        )}

        {/* Tooltip */}
        {showTooltip && (
          <div className="absolute top-full right-0 mt-2 w-64 bg-black text-white text-sm rounded-lg p-3 shadow-lg z-50">
            <div className="flex items-center gap-2 mb-2">
              <div className={getStatusColor()}>
                {getStatusIcon()}
              </div>
              <span className="font-medium">{getStatusText()}</span>
            </div>
            <p className="text-gray-300">
              {getStatusDescription()}
            </p>
            
            {syncStatus.queueCount > 0 && syncStatus.isOnline && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={handleForceSync}
                disabled={syncStatus.isSyncing}
                className="mt-2 w-full bg-white text-black hover:bg-gray-100"
              >
                <RefreshCw className={`h-3 w-3 mr-1 ${syncStatus.isSyncing ? 'animate-spin' : ''}`} />
                Synchroniser
              </Button>
            )}
            
            {/* Arrow */}
            <div className="absolute -top-1 right-4 w-2 h-2 bg-black transform rotate-45"></div>
          </div>
        )}
      </div>

      {/* Sync animation */}
      {syncStatus.isSyncing && (
        <div className="flex items-center gap-1 text-sm text-blue-600">
          <div className="flex space-x-1">
            <div className="w-1 h-1 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-1 h-1 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-1 h-1 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      )}
    </div>
  );
};

// Hook for using offline status
export const useOfflineStatus = () => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: navigator.onLine,
    isSyncing: false,
    queueCount: 0
  });

  useEffect(() => {
    const handleOnline = () => setSyncStatus(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setSyncStatus(prev => ({ ...prev, isOnline: false }));
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    ...syncStatus,
    syncManager: mockSyncManager
  };
};