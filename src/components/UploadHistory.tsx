import React, { useState, useMemo } from 'react';
import { 
  History, Trash2, Search, Filter, Calendar, FileSpreadsheet, 
  FileText, Database, Check, X, ArrowUpDown, ChevronDown, CheckCircle2, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface UploadHistoryItem {
  id?: string;
  userId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadedAt: string;
  detectedCount: number;
  status: 'success' | 'failed';
}

interface UploadHistoryProps {
  uploadHistory: UploadHistoryItem[];
  onClearHistory: () => Promise<void>;
  onDeleteHistoryItem: (id: string) => Promise<void>;
}

export const UploadHistory: React.FC<UploadHistoryProps> = ({
  uploadHistory,
  onClearHistory,
  onDeleteHistoryItem,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'name-asc' | 'detections-desc'>('date-desc');
  const [isDeleting, setIsDeleting] = useState<Record<string, boolean>>({});

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  // Get unique file types from history for filtering
  const availableTypes = useMemo(() => {
    const types = new Set<string>();
    uploadHistory.forEach(item => {
      if (item.fileType) {
        types.add(item.fileType.toUpperCase());
      }
    });
    return ['All', ...Array.from(types)];
  }, [uploadHistory]);

  // Compute stats
  const stats = useMemo(() => {
    const totalFiles = uploadHistory.length;
    const totalDetections = uploadHistory.reduce((sum, item) => sum + (item.detectedCount || 0), 0);
    const successfulFiles = uploadHistory.filter(item => item.status === 'success').length;
    const successRate = totalFiles > 0 ? Math.round((successfulFiles / totalFiles) * 100) : 100;
    
    return {
      totalFiles,
      totalDetections,
      successRate,
    };
  }, [uploadHistory]);

  // Filter & Sort
  const filteredAndSortedHistory = useMemo(() => {
    let result = [...uploadHistory];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(item => item.fileName.toLowerCase().includes(q));
    }

    // File type filter
    if (selectedType !== 'All') {
      result = result.filter(item => item.fileType?.toUpperCase() === selectedType);
    }

    // Status filter
    if (selectedStatus !== 'All') {
      const statusLower = selectedStatus.toLowerCase();
      result = result.filter(item => item.status === statusLower);
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'date-desc') {
        return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
      }
      if (sortBy === 'date-asc') {
        return new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime();
      }
      if (sortBy === 'name-asc') {
        return a.fileName.localeCompare(b.fileName);
      }
      if (sortBy === 'detections-desc') {
        return b.detectedCount - a.detectedCount;
      }
      return 0;
    });

    return result;
  }, [uploadHistory, searchQuery, selectedType, selectedStatus, sortBy]);

  const handleDeleteItem = async (id: string) => {
    if (isDeleting[id]) return;
    setIsDeleting(prev => ({ ...prev, [id]: true }));
    try {
      await onDeleteHistoryItem(id);
    } catch (err) {
      console.error('Failed to delete history item:', err);
    } finally {
      setIsDeleting(prev => ({ ...prev, [id]: false }));
    }
  };

  const getFileIcon = (fileType: string) => {
    const cleanType = fileType?.toLowerCase();
    if (cleanType === 'pdf') {
      return (
        <div className="p-2.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-xl">
          <FileText className="w-4 h-4" />
        </div>
      );
    }
    if (cleanType === 'csv' || cleanType === 'xlsx' || cleanType === 'xls') {
      return (
        <div className="p-2.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl">
          <FileSpreadsheet className="w-4 h-4" />
        </div>
      );
    }
    return (
      <div className="p-2.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-xl">
        <FileText className="w-4 h-4" />
      </div>
    );
  };

  return (
    <div id="upload-history-dashboard" className="premium-card p-6 md:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.12)] space-y-6">
      
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-border/60 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-accent/10 text-accent border border-accent/20 rounded-2xl shadow-[0_4px_15px_rgba(139,92,246,0.15)]">
            <History className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white font-display">Permanent Upload History Log</h3>
            <p className="text-[10px] text-text-dim uppercase tracking-wider font-extrabold mt-0.5">Track statements, audits, and ingest logs</p>
          </div>
        </div>
        
        {uploadHistory.length > 0 && (
          <button
            onClick={onClearHistory}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-sidebar hover:bg-rose-500/10 border border-surface-border hover:border-rose-500/30 rounded-xl text-xs font-bold text-text-dim hover:text-rose-400 transition-all cursor-pointer shadow-sm"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear Entire Log
          </button>
        )}
      </div>

      {uploadHistory.length === 0 ? (
        <div className="py-14 text-center bg-sidebar/20 border border-dashed border-surface-border rounded-2xl flex flex-col items-center justify-center">
          <Database className="w-10 h-10 text-text-dim mb-3" />
          <p className="text-sm font-semibold text-gray-300">Firestore Log is Empty</p>
          <p className="text-xs text-text-dim max-w-sm mt-1 px-4 leading-relaxed">
            Your audit statements, xlsx files, and parsed SaaS expense uploads will be logged permanently here once you import.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Stats Widgets */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-sidebar/30 border border-surface-border/40 p-4.5 rounded-2xl">
              <span className="text-[10px] font-bold text-text-dim uppercase tracking-wider block mb-1">Total Uploaded Files</span>
              <span className="text-2xl font-black text-white font-display">{stats.totalFiles}</span>
              <p className="text-[10px] text-text-dim mt-1.5">Processed statements and worksheets.</p>
            </div>
            <div className="bg-sidebar/30 border border-surface-border/40 p-4.5 rounded-2xl">
              <span className="text-[10px] font-bold text-accent uppercase tracking-wider block mb-1">Identified Subscriptions</span>
              <span className="text-2xl font-black text-accent font-display">{stats.totalDetections}</span>
              <p className="text-[10px] text-text-dim mt-1.5">SaaS recurring costs auto-discovered.</p>
            </div>
            <div className="bg-sidebar/30 border border-surface-border/40 p-4.5 rounded-2xl">
              <span className="text-[10px] font-bold text-success uppercase tracking-wider block mb-1">Ingestion Success Rate</span>
              <span className="text-2xl font-black text-success font-display">{stats.successRate}%</span>
              <p className="text-[10px] text-text-dim mt-1.5">Correctly parsed & classified statements.</p>
            </div>
          </div>

          {/* Filters & Control Dashboard */}
          <div className="flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center bg-sidebar/10 p-4 rounded-2xl border border-surface-border/40">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim" />
              <input
                type="text"
                placeholder="Search history by file name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-sidebar border border-surface-border focus:outline-none focus:border-accent/60 rounded-xl text-xs text-white placeholder-text-dim font-medium transition-all"
              />
            </div>

            {/* Selection Dropdowns */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
              {/* Type Filter */}
              <div className="flex items-center gap-1.5 bg-sidebar border border-surface-border px-3 py-1.5 rounded-xl text-xs">
                <Filter className="w-3.5 h-3.5 text-text-dim" />
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="bg-transparent text-white focus:outline-none font-semibold cursor-pointer border-none p-0 pr-6 appearance-none relative"
                >
                  {availableTypes.map(t => (
                    <option key={t} value={t} className="bg-sidebar text-white">{t === 'All' ? 'All Formats' : t}</option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-text-dim pointer-events-none -ml-5" />
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1.5 bg-sidebar border border-surface-border px-3 py-1.5 rounded-xl text-xs">
                <Check className="w-3.5 h-3.5 text-text-dim" />
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="bg-transparent text-white focus:outline-none font-semibold cursor-pointer border-none p-0 pr-6 appearance-none relative"
                >
                  <option value="All" className="bg-sidebar text-white">All Statuses</option>
                  <option value="Success" className="bg-sidebar text-white">Processed</option>
                  <option value="Failed" className="bg-sidebar text-white">Failed</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-text-dim pointer-events-none -ml-5" />
              </div>

              {/* Sort selector */}
              <div className="flex items-center gap-1.5 bg-sidebar border border-surface-border px-3 py-1.5 rounded-xl text-xs">
                <ArrowUpDown className="w-3.5 h-3.5 text-text-dim" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent text-white focus:outline-none font-semibold cursor-pointer border-none p-0 pr-6 appearance-none relative"
                >
                  <option value="date-desc" className="bg-sidebar text-white">Newest First</option>
                  <option value="date-asc" className="bg-sidebar text-white">Oldest First</option>
                  <option value="name-asc" className="bg-sidebar text-white">Alphabetical</option>
                  <option value="detections-desc" className="bg-sidebar text-white">Detections count</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-text-dim pointer-events-none -ml-5" />
              </div>
            </div>
          </div>

          {/* History List */}
          <div className="space-y-3">
            {filteredAndSortedHistory.length === 0 ? (
              <div className="py-8 text-center bg-sidebar/10 border border-surface-border/50 rounded-2xl">
                <p className="text-xs text-text-dim font-bold">No results matching your filters.</p>
                <button 
                  onClick={() => { setSearchQuery(''); setSelectedType('All'); setSelectedStatus('All'); }}
                  className="text-xs text-accent font-semibold hover:underline mt-1 cursor-pointer"
                >
                  Reset active filters
                </button>
              </div>
            ) : (
              <div className="overflow-hidden border border-surface-border/60 rounded-2xl bg-sidebar/10 divide-y divide-surface-border/40">
                <AnimatePresence initial={false}>
                  {filteredAndSortedHistory.map((log) => {
                    const isDeletingItem = !!isDeleting[log.id || ''];
                    return (
                      <motion.div
                        key={log.id}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-sidebar/20 transition-all"
                      >
                        {/* File Details */}
                        <div className="flex items-start gap-4">
                          {getFileIcon(log.fileType)}
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-extrabold text-white text-sm font-display leading-tight">{log.fileName}</h4>
                              <span className="text-[9px] uppercase font-bold bg-sidebar border border-surface-border/80 text-text-dim px-2 py-0.5 rounded-md">
                                {log.fileType?.toUpperCase()}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-dim mt-1.5 font-medium">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" />
                                {new Date(log.uploadedAt).toLocaleString()}
                              </span>
                              <span className="w-1 h-1 rounded-full bg-surface-border" />
                              <span>{formatSize(log.fileSize)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Status, Detections and Deletion */}
                        <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-none border-surface-border/30 pt-3 sm:pt-0">
                          <div className="text-left sm:text-right">
                            <div className="flex items-center sm:justify-end gap-1.5">
                              {log.status === 'success' ? (
                                <CheckCircle2 className="w-4 h-4 text-success" />
                              ) : (
                                <AlertCircle className="w-4 h-4 text-rose-400" />
                              )}
                              <span className={`text-[10px] font-extrabold uppercase ${
                                log.status === 'success' ? 'text-success' : 'text-rose-400'
                              }`}>
                                {log.status === 'success' ? 'Processed' : 'Failed'}
                              </span>
                            </div>
                            <span className="text-xs font-semibold text-accent mt-1 block">
                              {log.detectedCount} subscription{log.detectedCount !== 1 ? 's' : ''} detected
                            </span>
                          </div>

                          <button
                            onClick={() => log.id && handleDeleteItem(log.id)}
                            disabled={isDeletingItem}
                            className="p-2 text-text-dim hover:text-rose-400 bg-sidebar/50 hover:bg-rose-500/10 border border-surface-border hover:border-rose-500/20 rounded-xl transition-all cursor-pointer disabled:opacity-40"
                            title="Delete this history entry"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
