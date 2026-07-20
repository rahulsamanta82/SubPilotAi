import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, FileText, Upload, AlertCircle, Check, Loader2, Play, 
  History, FileSpreadsheet, Trash2, Database, Layers, Download
} from 'lucide-react';
import { Subscription } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import { 
  collection, addDoc, query, where, orderBy, onSnapshot, getDocs, deleteDoc, doc 
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { UploadHistory } from './UploadHistory';

interface ScanDetectProps {
  onImport: (subs: Omit<Subscription, 'id'>[]) => Promise<void>;
  userId?: string;
}

interface UploadHistoryItem {
  id?: string;
  userId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadedAt: string;
  detectedCount: number;
  status: 'success' | 'failed';
}

const fetchWithRetry = async (url: string, options: RequestInit, retries = 2, delay = 1500): Promise<Response> => {
  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return res;
  } catch (err) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retries - 1, delay * 1.5);
    }
    throw err;
  }
};

export const ScanDetect: React.FC<ScanDetectProps> = ({ onImport, userId }) => {
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<any[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadHistory, setUploadHistory] = useState<UploadHistoryItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeUserId = userId || auth.currentUser?.uid || 'offline-guest';

  // Load and sync permanent upload history from Firestore
  useEffect(() => {
    if (activeUserId === 'offline-guest') {
      const stored = localStorage.getItem('subpilot_offline_upload_history');
      if (stored) {
        try {
          setUploadHistory(JSON.parse(stored));
        } catch (e) {
          setUploadHistory([]);
        }
      }
      return;
    }

    const q = query(
      collection(db, 'upload_history'),
      where('userId', '==', activeUserId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const historyList: UploadHistoryItem[] = [];
      snapshot.forEach((doc) => {
        historyList.push({ id: doc.id, ...doc.data() } as UploadHistoryItem);
      });
      // Sort desc by uploadedAt
      historyList.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
      setUploadHistory(historyList);
    }, (error) => {
      console.error("Failed to fetch upload history from Firestore:", error);
    });

    return () => unsubscribe();
  }, [activeUserId]);

  const logUploadToHistory = async (fileName: string, fileSize: number, fileType: string, detectedCount: number, status: 'success' | 'failed') => {
    const logItem: Omit<UploadHistoryItem, 'id'> = {
      userId: activeUserId,
      fileName,
      fileSize,
      fileType,
      uploadedAt: new Date().toISOString(),
      detectedCount,
      status
    };

    if (activeUserId === 'offline-guest') {
      const stored = localStorage.getItem('subpilot_offline_upload_history');
      let currentLogs: UploadHistoryItem[] = [];
      if (stored) {
        try {
          currentLogs = JSON.parse(stored);
        } catch (e) {}
      }
      const newLog = { ...logItem, id: `offline-${Date.now()}` };
      const updated = [newLog, ...currentLogs];
      setUploadHistory(updated);
      localStorage.setItem('subpilot_offline_upload_history', JSON.stringify(updated));
      return;
    }

    try {
      await addDoc(collection(db, 'upload_history'), logItem);
    } catch (err) {
      console.error("Failed to log upload history to Firestore", err);
    }
  };

  const handleClearHistory = async () => {
    if (activeUserId === 'offline-guest') {
      setUploadHistory([]);
      localStorage.removeItem('subpilot_offline_upload_history');
      return;
    }

    try {
      const q = query(collection(db, 'upload_history'), where('userId', '==', activeUserId));
      const snap = await getDocs(q);
      for (const d of snap.docs) {
        await deleteDoc(doc(db, 'upload_history', d.id));
      }
    } catch (err) {
      console.error("Failed to clear upload logs", err);
    }
  };

  const handleDeleteHistoryItem = async (id: string) => {
    if (activeUserId === 'offline-guest') {
      const updated = uploadHistory.filter(item => item.id !== id);
      setUploadHistory(updated);
      localStorage.setItem('subpilot_offline_upload_history', JSON.stringify(updated));
      return;
    }

    try {
      await deleteDoc(doc(db, 'upload_history', id));
    } catch (err) {
      console.error("Failed to delete upload log entry", err);
    }
  };

  const sampleConsumerStatement = `
06/15/2026 NETFLIX.COM CARD SPEND -$15.49 APPROVED
06/18/2026 ADOBE SVS SYSTEMS DIRECT DEBIT -$59.99 MERCHANT ID: 8872
06/20/2026 CHATGPT PLUS SUBSCRIBER -$20.00 RECURRING
06/21/2026 SPOTIFY PREMIUM -$16.99 SWEDEN DEBIT
06/25/2026 WHOLE FOODS CARD SPEND -$84.20
06/28/2026 GITHUB CO-PILOT -$10.00 RECURRING INVOICE
  `.trim();

  const sampleStartupStatement = `
Date,Description,Amount,Type
07/01/2026,AMAZON WEB SERVICES BILLING -$312.40,Debit
07/02/2026,SLACK TECHNOLOGIES TEAM LICENSE -$120.00,Debit
07/05/2026,GOOGLE SUITE RECURRING GSUITE -$48.00,Debit
07/10/2026,HEROKU DYNO COST -$25.00,Debit
07/12/2026,MAILCHIMP NEWSLETTER MARKETING -$75.00,Debit
07/14/2026,ZOOM VIDEO COMMUNICATIONS -$15.99,Debit
07/15/2026,RESTAURANT SUPPLIES LUNCH -$150.00,Debit
  `.trim();

  const handleSampleLoad = (type: 'consumer' | 'startup') => {
    setInputText(type === 'consumer' ? sampleConsumerStatement : sampleStartupStatement);
    setError(null);
    setResults([]);
  };

  const extractTextFromPdf = (arrayBuffer: ArrayBuffer): string => {
    const binaryDecoder = new TextDecoder('latin1');
    const text = binaryDecoder.decode(arrayBuffer);
    
    // Find all text streams within BT and ET (Begin Text and End Text) blocks
    const btEtRegex = /BT[\s\S]*?ET/g;
    let btEtMatch;
    let extractedText = "";
    
    while ((btEtMatch = btEtRegex.exec(text)) !== null) {
      const stream = btEtMatch[0];
      const parenRegex = /\(([^)]*)\)/g;
      let parenMatch;
      const streamWords: string[] = [];
      while ((parenMatch = parenRegex.exec(stream)) !== null) {
        let word = parenMatch[1];
        // Clean up basic PDF backslash escape characters
        word = word.replace(/\\([()\\/])/g, '$1');
        if (word.trim().length > 0) {
          streamWords.push(word);
        }
      }
      if (streamWords.length > 0) {
        // Decide if characters are spaced singly or whole words
        const isSingleChars = streamWords.every(w => w.length === 1);
        if (isSingleChars) {
          extractedText += streamWords.join('') + "\n";
        } else {
          extractedText += streamWords.join(' ') + "\n";
        }
      }
    }

    // Fallback if BT-ET yielded no text: global scan of all literal parentheses strings
    if (extractedText.trim().length < 50) {
      const parenRegex = /\(([^)]+)\)/g;
      let parenMatch;
      const allWords: string[] = [];
      while ((parenMatch = parenRegex.exec(text)) !== null) {
        let word = parenMatch[1];
        if (word.startsWith('/') || word.includes('Identity') || word.length > 100) continue;
        word = word.replace(/\\([()\\/])/g, '$1');
        if (word.trim().length > 0) {
          allWords.push(word);
        }
      }
      extractedText = allWords.join(' ');
    }

    return extractedText;
  };

  const generateOneYearTestFile = (format: 'csv' | 'xlsx' | 'pdf') => {
    // Generate a robust 12-month transaction ledger list (365 days of history)
    const txs: { Date: string; Description: string; Amount: number; Type: string }[] = [];
    const baseDate = new Date();
    
    // Generate periodic charges for each of the last 12 months
    for (let monthOffset = 11; monthOffset >= 0; monthOffset--) {
      // Find the specific day in history
      const d = new Date(baseDate.getFullYear(), baseDate.getMonth() - monthOffset, 12);
      const dateStr = d.toISOString().split('T')[0];
      
      // Monthly subscriptions
      txs.push({ Date: dateStr, Description: 'NETFLIX.COM DIGITAL RECURRING', Amount: -15.49, Type: 'Debit' });
      txs.push({ Date: dateStr, Description: 'SPOTIFY PREMIUM MONTHLY', Amount: -16.99, Type: 'Debit' });
      txs.push({ Date: dateStr, Description: 'CHATGPT PLUS OPENAI RECURRING', Amount: -20.00, Type: 'Debit' });
      txs.push({ Date: dateStr, Description: 'GOOGLE WORKSPACE GSUITE CLOUD', Amount: -18.00, Type: 'Debit' });
      txs.push({ Date: dateStr, Description: 'ZOOM.US VIDEO BILLING', Amount: -15.99, Type: 'Debit' });
      txs.push({ Date: dateStr, Description: 'ADOBE SYSTEMS CREATIVE CLOUD RECURRING', Amount: -59.99, Type: 'Debit' });
      txs.push({ Date: dateStr, Description: 'GITHUB COPILOT INVOICE', Amount: -10.00, Type: 'Debit' });
      
      // Random non-recurring normal expenses to simulate a real bank statement
      txs.push({ Date: dateStr, Description: 'STARBUCKS CAFE ORDER', Amount: -6.25, Type: 'Debit' });
      txs.push({ Date: dateStr, Description: 'UBER TRIP EXPENSE', Amount: -28.40, Type: 'Debit' });
      txs.push({ Date: dateStr, Description: 'AMAZON WHOLE FOODS SHOPPING', Amount: -92.15, Type: 'Debit' });
    }
    
    // Add annual subscription expenses (recorded 5 months ago)
    const annualDateObj = new Date(baseDate.getFullYear(), baseDate.getMonth() - 5, 8);
    const annualDateStr = annualDateObj.toISOString().split('T')[0];
    txs.push({ Date: annualDateStr, Description: 'AMAZON PRIME MEMBERSHIP ANNUAL FEE', Amount: -139.00, Type: 'Debit' });
    txs.push({ Date: annualDateStr, Description: 'DROPBOX INC ANNUAL RENEWAL STORAGE', Amount: -119.88, Type: 'Debit' });
    
    // Sort chronologically
    txs.sort((a, b) => new Date(a.Date).getTime() - new Date(b.Date).getTime());
    
    if (format === 'csv') {
      const csvHeaders = 'Date,Description,Amount,Type\n';
      const csvRows = txs.map(t => `${t.Date},"${t.Description}",${t.Amount},${t.Type}`).join('\n');
      const csvContent = csvHeaders + csvRows;
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', 'SubPilot_1Year_BankStatement_TestFile.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (format === 'xlsx') {
      // XLSX format using ExcelJS/xlsx utils
      const ws = XLSX.utils.json_to_sheet(txs);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Bank Ledger');
      XLSX.writeFile(wb, 'SubPilot_1Year_BankStatement_TestFile.xlsx');
    } else if (format === 'pdf') {
      const doc = new jsPDF();
      
      // Page styling parameters
      let y = 15;
      
      // Header Banner
      doc.setFillColor(15, 23, 42); // slate 900 branding matching SubPilot
      doc.rect(0, 0, 210, 38, 'F');
      
      // Title
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text('GLOBAL PILOT TRUST BANK', 14, 18);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text('Premium Corporate & Consumer Ledger Accounts', 14, 24);
      doc.text('Support: service@globalpilottrust.com | Tel: 1-800-PILOT-99', 14, 30);
      
      // Right-aligned Metadata
      doc.setFontSize(8.5);
      doc.text('STATEMENT: ANNUAL AUDIT REPORT', 135, 18);
      doc.text('ACCOUNT ID: XXXX-XXXX-8924-0019', 135, 24);
      doc.text(`ISSUED: ${new Date().toLocaleDateString()}`, 135, 30);
      
      // Client details & summary of balance
      y = 50;
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.text('PREPARED FOR:', 14, y);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text('SubPilot Member Workspace', 14, y + 5);
      doc.text('Enterprise SaaS Subscription Review', 14, y + 10);
      doc.text('Primary Billing Account', 14, y + 15);
      
      // Balance Summary Box on Right
      doc.setFillColor(248, 250, 252);
      doc.rect(118, y - 5, 78, 26, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.rect(118, y - 5, 78, 26, 'D');
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text('FINANCIAL STATEMENT SUMMARY', 122, y);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.text('Starting Ledger Balance:  $10,240.00', 122, y + 5);
      doc.text('Total Inflows / Deposits:  $45,000.00', 122, y + 9);
      doc.text('Total Outflows / Debits: -$14,832.24', 122, y + 13);
      doc.setFont('helvetica', 'bold');
      doc.text('Current Statement Balance: $40,407.76', 122, y + 18);
      
      // Table Header
      y = 85;
      doc.setFillColor(241, 245, 249);
      doc.rect(14, y, 182, 7, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text('DATE', 16, y + 5);
      doc.text('TRANSACTION DESCRIPTION', 42, y + 5);
      doc.text('AMOUNT', 140, y + 5);
      doc.text('TYPE', 175, y + 5);
      
      // Draw rows
      let rowY = y + 7;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      
      txs.forEach((tx, idx) => {
        // Handle multipage
        if (rowY > 275) {
          doc.addPage();
          rowY = 20;
          // Redraw table header on new page
          doc.setFillColor(241, 245, 249);
          doc.rect(14, rowY, 182, 7, 'F');
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8.5);
          doc.setTextColor(15, 23, 42);
          doc.text('DATE', 16, rowY + 5);
          doc.text('TRANSACTION DESCRIPTION', 42, rowY + 5);
          doc.text('AMOUNT', 140, rowY + 5);
          doc.text('TYPE', 175, rowY + 5);
          rowY += 12;
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
        }
        
        // Alternating row background
        if (idx % 2 === 0) {
          doc.setFillColor(248, 250, 252);
          doc.rect(14, rowY - 4, 182, 6, 'F');
        }
        
        doc.setTextColor(71, 85, 105);
        doc.text(tx.Date, 16, rowY);
        
        // Truncate long descriptions if any
        let desc = tx.Description;
        if (desc.length > 55) desc = desc.substring(0, 52) + '...';
        doc.setTextColor(15, 23, 42);
        doc.text(desc, 42, rowY);
        
        const isDebit = tx.Amount < 0;
        if (isDebit) {
          doc.setTextColor(190, 24, 74); // Rose-600
        } else {
          doc.setTextColor(21, 128, 61); // Green-700
        }
        doc.text(`$${Math.abs(tx.Amount).toFixed(2)}`, 140, rowY);
        
        doc.setTextColor(71, 85, 105);
        doc.text(tx.Type, 175, rowY);
        
        rowY += 6;
      });
      
      // Add page numbers at the end
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(7.5);
        doc.setTextColor(148, 163, 184);
        doc.text(`CONFIDENTIAL BANK STATEMENT | GLOBAL PILOT TRUST BANK | Page ${i} of ${pageCount}`, 14, 288);
      }
      
      doc.save('SubPilot_1Year_BankStatement_OfficialTestReport.pdf');
    }
  };

  const processUploadedFile = (file: File) => {
    setIsUploading(true);
    setError(null);
    const reader = new FileReader();

    const ext = file.name.split('.').pop()?.toLowerCase();

    if (ext === 'pdf') {
      reader.onload = (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const pdfText = extractTextFromPdf(arrayBuffer);
          if (pdfText.trim().length === 0) {
            setError('We found no readable text in the uploaded PDF. Ensure it is a text-based bank statement and not a scanned image.');
          } else {
            setInputText(pdfText);
          }
          setIsUploading(false);
        } catch (err) {
          setError('Failed to extract text from PDF statement. Please try a CSV or Excel sheet.');
          setIsUploading(false);
        }
      };
      reader.readAsArrayBuffer(file);
    } else if (ext === 'xlsx' || ext === 'xls') {
      reader.onload = (e) => {
        try {
          const bstr = e.target?.result;
          const wb = XLSX.read(bstr, { type: 'binary' });
          let consolidatedText = "";
          wb.SheetNames.forEach((sheetName) => {
            const worksheet = wb.Sheets[sheetName];
            const csv = XLSX.utils.sheet_to_csv(worksheet);
            consolidatedText += `[Sheet: ${sheetName}]\n${csv}\n\n`;
          });
          setInputText(consolidatedText);
          setIsUploading(false);
        } catch (err) {
          setError('Failed to parse Excel sheet contents. Please try a different spreadsheet or CSV.');
          setIsUploading(false);
        }
      };
      reader.readAsBinaryString(file);
    } else {
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          setInputText(text);
          setIsUploading(false);
        } catch (err) {
          setError('Failed to read document text contents.');
          setIsUploading(false);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processUploadedFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processUploadedFile(file);
    }
  };

  const handleScan = async () => {
    if (!inputText.trim()) {
      setError('Please upload a file or paste bank statement details first.');
      return;
    }

    setLoading(true);
    setError(null);
    setResults([]);

    try {
      const response = await fetchWithRetry('/api/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ textData: inputText }),
      });

      const data = await response.json();
      if (data.detections && Array.isArray(data.detections)) {
        setResults(data.detections);
        setSelectedIndices(data.detections.map((_: any, i: number) => i));
        // Save upload log as successful
        await logUploadToHistory(
          fileInputRef.current?.files?.[0]?.name || "Copied Text/Statement Ingest",
          inputText.length,
          fileInputRef.current?.files?.[0]?.name ? "Document Upload" : "Manual Paste",
          data.detections.length,
          'success'
        );
      } else {
        throw new Error('Could not identify any subscriptions in this transaction log.');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during statement analysis.');
      await logUploadToHistory(
        fileInputRef.current?.files?.[0]?.name || "Copied Text Ingest",
        inputText.length,
        "Parsing Error",
        0,
        'failed'
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (index: number) => {
    if (selectedIndices.includes(index)) {
      setSelectedIndices(selectedIndices.filter(i => i !== index));
    } else {
      setSelectedIndices([...selectedIndices, index]);
    }
  };

  const handleImport = async () => {
    if (selectedIndices.length === 0) return;
    const subsToImport = results
      .filter((_, i) => selectedIndices.includes(i))
      .map(item => ({
        name: item.name,
        price: item.price,
        currency: item.currency || 'USD',
        cycle: item.cycle || 'monthly',
        category: item.category || 'Other',
        startDate: item.startDate || new Date().toISOString().split('T')[0],
        nextRenewalDate: item.nextRenewalDate || new Date().toISOString().split('T')[0],
        status: item.status || 'active',
        owner: 'Personal',
        notes: item.reason,
      }));

    await onImport(subsToImport);
    setResults([]);
    setInputText('');
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  return (
    <div id="scan-detect" className="space-y-8">
      
      {/* Upper scanning cockpit */}
      <div className="premium-card p-6 md:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.15)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-[80px] -z-10" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-accent/10 text-accent border border-accent/20 rounded-2xl shadow-[0_4px_15px_rgba(139,92,246,0.15)]">
              <Sparkles className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-text-main font-display">Ingest & Scan Sheets</h2>
              <p className="text-xs text-text-dim font-medium">Upload any Excel sheet, CSV ledger, or bank statement to auto-detect subscriptions.</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleSampleLoad('consumer')}
              className="text-xs font-semibold text-text-dim hover:text-white bg-sidebar hover:bg-surface border border-surface-border px-3 py-2 rounded-xl transition-all cursor-pointer"
            >
              Use Personal Demo Text
            </button>
            <button
              type="button"
              onClick={() => handleSampleLoad('startup')}
              className="text-xs font-semibold text-text-dim hover:text-white bg-sidebar hover:bg-surface border border-surface-border px-3 py-2 rounded-xl transition-all cursor-pointer"
            >
              Use Startup Demo CSV
            </button>
            <button
              type="button"
              onClick={() => generateOneYearTestFile('csv')}
              className="text-xs font-semibold text-accent hover:text-white bg-accent/10 hover:bg-accent border border-accent/20 hover:border-accent px-3 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
              title="Download realistic 12-month CSV bank statement ledger"
            >
              <Download className="w-3.5 h-3.5" />
              Download 1-Year Test CSV
            </button>
            <button
              type="button"
              onClick={() => generateOneYearTestFile('xlsx')}
              className="text-xs font-semibold text-success hover:text-white bg-success/10 hover:bg-success border border-success/20 hover:border-success px-3 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
              title="Download realistic 12-month Excel (.xlsx) bank statement spreadsheet"
            >
              <Download className="w-3.5 h-3.5" />
              Download 1-Year Test XLSX
            </button>
            <button
              type="button"
              onClick={() => generateOneYearTestFile('pdf')}
              className="text-xs font-semibold text-purple-400 hover:text-white bg-purple-500/10 hover:bg-purple-500 border border-purple-500/20 hover:border-purple-500 px-3 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
              title="Download realistic 12-month official PDF bank statement report"
            >
              <Download className="w-3.5 h-3.5" />
              Download 1-Year Test PDF
            </button>
          </div>
        </div>

        {/* Drag & Drop Zone */}
        <div 
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-6 md:p-8 text-center transition-all ${
            isDragOver ? 'border-accent bg-accent/10 scale-[1.01]' : 'border-surface-border bg-sidebar/30 hover:bg-sidebar/50'
          }`}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange}
            accept=".csv, .xlsx, .xls, .txt, .pdf"
            className="hidden"
          />
          <div className="flex flex-col items-center justify-center">
            <div className="p-4 bg-sidebar rounded-full border border-surface-border/50 text-text-dim mb-3 shadow-inner">
              <Upload className="w-6 h-6 text-accent" />
            </div>
            <span className="text-sm font-bold text-white mb-1 block">Drag and drop statement files here</span>
            <span className="text-xs text-text-dim mb-4 block">Supports .pdf, .xlsx, .xls, .csv, and raw text ledger reports</span>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4.5 py-2 bg-sidebar border border-surface-border text-text-main text-xs font-bold hover:border-accent/40 rounded-xl transition-all shadow-sm cursor-pointer hover:scale-[1.02]"
            >
              Browse Local Files
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-text-dim uppercase tracking-wider block">
                Absorbed Data Fragment View
              </span>
              {inputText && (
                <button
                  onClick={() => setInputText('')}
                  className="text-[10px] font-bold text-rose-400 hover:underline uppercase cursor-pointer"
                >
                  Clear Data
                </button>
              )}
            </div>

            <textarea
              id="statement-input"
              rows={8}
              placeholder="Paste raw statements or dropped files will populate here..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="w-full px-4 py-3 bg-sidebar border border-surface-border rounded-2xl text-xs text-white placeholder-text-dim focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent font-mono transition-all resize-none"
            />

            {error && (
              <div className="flex items-start gap-2 bg-rose-950/20 border border-rose-900/30 text-rose-400 p-3.5 rounded-xl text-xs leading-relaxed">
                <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              id="btn-scan-statement"
              onClick={handleScan}
              disabled={loading || isUploading || !inputText.trim()}
              className="w-full flex items-center justify-center gap-2 bg-accent hover:bg-blue-600 disabled:bg-sidebar disabled:text-text-dim text-white font-semibold py-3 px-4 rounded-xl transition-all cursor-pointer shadow-lg shadow-accent/20"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Gemini AI Auditing Ledger for Subscriptions...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  Run Smart Gemini Recognition
                </>
              )}
            </button>
          </div>

          <div>
            <AnimatePresence mode="wait">
              {results.length > 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-text-dim uppercase tracking-wider">
                      Auto-Recognized Records ({results.length})
                    </span>
                    <span className="text-[10px] text-accent bg-accent/15 border border-accent/20 font-bold px-2 py-0.5 rounded-full">
                      Choose items to save
                    </span>
                  </div>

                  <div className="border border-surface-border rounded-2xl divide-y divide-surface-border overflow-hidden max-h-[300px] overflow-y-auto bg-sidebar/20 shadow-inner">
                    {results.map((item, index) => {
                      const isSelected = selectedIndices.includes(index);
                      return (
                        <div
                          key={index}
                          onClick={() => toggleSelect(index)}
                          className={`p-3.5 flex items-start gap-3 hover:bg-sidebar/40 transition-colors cursor-pointer ${
                            isSelected ? 'bg-accent/5' : ''
                          }`}
                        >
                          <div className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-all shrink-0 ${
                            isSelected ? 'bg-accent border-accent text-white' : 'border-surface-border bg-sidebar'
                          }`}>
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-white text-sm">{item.name}</span>
                              <span className="font-bold text-accent text-sm">
                                ${item.price.toFixed(2)}/{item.cycle?.replace('ly', '')}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] font-medium text-text-dim bg-sidebar px-2 py-0.5 border border-surface-border rounded-md uppercase">
                                {item.category}
                              </span>
                              <span className="text-[10px] font-semibold text-text-dim">
                                Confidence: {Math.round((item.confidence || 0.9) * 100)}%
                              </span>
                            </div>
                            <p className="text-xs text-text-dim mt-1.5 leading-relaxed italic bg-sidebar/30 p-2 rounded-lg border border-surface-border/50">
                              "{item.reason || 'Detected periodic transaction charge.'}"
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <button
                    id="btn-import-scan"
                    onClick={handleImport}
                    className="w-full py-3 bg-success hover:bg-emerald-600 text-white font-semibold rounded-xl transition-all shadow-[0_4px_12px_rgba(16,185,129,0.25)] flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Check className="w-5 h-5" />
                    Commit {selectedIndices.length} Subscriptions Permanently
                  </button>
                </motion.div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-surface-border rounded-2xl bg-sidebar/20 p-6 min-h-[300px]">
                  <FileSpreadsheet className="w-12 h-12 text-text-dim mb-3" />
                  <p className="text-sm font-semibold text-gray-300">No Scanned Results Yet</p>
                  <p className="text-xs text-text-dim text-center max-w-xs mt-1">
                    Drag and drop a file or load sample rows above, then select Smart Recognition. Recognized SaaS items will list here.
                  </p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Permanent upload log history */}
      <UploadHistory
        uploadHistory={uploadHistory}
        onClearHistory={handleClearHistory}
        onDeleteHistoryItem={handleDeleteHistoryItem}
      />

    </div>
  );
};
