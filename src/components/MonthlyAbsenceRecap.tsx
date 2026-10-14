import React, { useState, useMemo } from 'react';
import { Student, SchoolSettings, AttendanceStatus } from '../types';
import { MONTH_NAMES } from '../data/initialData';
import {
  exportMonthlyAbsenceRecapToWord,
  exportSemesterAbsenceRecapToCSV,
  exportSemesterAbsenceRecapToWord,
  SemesterStudentRecapItem,
  SemesterTotals,
} from '../utils/export';
import {
  Printer,
  FileText,
  FileSpreadsheet,
  Check,
  Search,
  ChevronLeft,
  ChevronRight,
  Calendar,
  MessageSquare,
  Phone,
  Send,
  ExternalLink,
  X,
  Filter,
  RefreshCw,
  Eye,
  Edit3,
  Copy,
} from 'lucide-react';
import {
  sendWhatsAppViaGateway,
  saveWhatsAppTransmissionLog,
} from '../utils/whatsappService';

interface MonthlyAbsenceRecapProps {
  students: Student[];
  schoolSettings: SchoolSettings;
  selectedMonthIndex: number;
  selectedYear: number;
  currentMonthName: string;
  activeAttendanceData: Record<string, Record<number, AttendanceStatus>>;
  attendanceStore: Record<string, Record<string, Record<number, AttendanceStatus>>>;
  onPrevMonth?: () => void;
  onNextMonth?: () => void;
  onGoToCurrentMonth?: () => void;
}

export const MonthlyAbsenceRecap: React.FC<MonthlyAbsenceRecapProps> = ({
  students,
  schoolSettings,
  selectedMonthIndex,
  selectedYear,
  activeAttendanceData,
  attendanceStore,
}) => {
  // View mode: 'semester' (matching rekap.jpg) or 'monthly' (single month)
  const [viewMode, setViewMode] = useState<'semester' | 'monthly'>('semester');

  // Semester configuration: 'ganjil' (Juli - Desember) matches rekap.jpg exactly
  const [semester, setSemester] = useState<'ganjil' | 'genap'>('ganjil');
  const [selectedSemesterYear, setSelectedSemesterYear] = useState<number>(selectedYear || 2026);

  // Single-month mode state
  const [activeMonthIdx, setActiveMonthIdx] = useState<number>(selectedMonthIndex);
  const [activeSingleYear, setActiveSingleYear] = useState<number>(selectedYear);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<'all' | 'absent_only' | 'perfect_only'>('all');
  const [sortBy] = useState<'no' | 'name' | 'total_desc' | 'alpa_desc'>('no');
  const [showZeroMode] = useState<'blank' | 'dash' | 'zero'>('dash');

  // Toast / Copy notification
  const [copied, setCopied] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // WA Personal Orang Tua Modal State
  const [isWaPersonalModalOpen, setIsWaPersonalModalOpen] = useState<boolean>(false);
  const [waFilterMode, setWaFilterMode] = useState<'all' | 'absent_only' | 'alpa_only'>('absent_only');
  const [waSearchQuery, setWaSearchQuery] = useState<string>('');
  const [sendingStudentId, setSendingStudentId] = useState<string | null>(null);
  const [previewStudentId, setPreviewStudentId] = useState<string | null>(null);

  // Preview Pesan Sebelum Kirim Modal State
  const [waPreviewModalData, setWaPreviewModalData] = useState<{
    id: string;
    name: string;
    nisn?: string;
    parentWhatsapp?: string;
    sakit: number;
    izin: number;
    alpa: number;
    total: number;
    monthlyBreakdown?: string;
    customMessage: string;
    targetPhone: string;
    preferredAction?: 'direct' | 'gateway';
  } | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Helper to format clean international WA number
  const formatWaNumber = (raw?: string): string => {
    let clean = (raw || '').replace(/[^0-9]/g, '');
    if (clean.startsWith('0')) clean = '62' + clean.slice(1);
    return clean;
  };

  // Helper to generate personal WhatsApp absence recap message for parent
  const generateRecapPersonalWaMessage = (studentItem: {
    name: string;
    nisn?: string;
    sakit: number;
    izin: number;
    alpa: number;
    total: number;
    monthlyBreakdown?: string;
  }) => {
    const schoolName = schoolSettings.schoolName || 'SMKS Nusantara 1 Ciputat';
    const className = schoolSettings.className || 'X TJKT 3';
    const teacherName = schoolSettings.homeroomTeacher || schoolSettings.teacherName || 'Wali Kelas';
    const periodLabel =
      viewMode === 'semester'
        ? `Semester ${semester === 'ganjil' ? 'Ganjil (Juli - Desember)' : 'Genap (Januari - Juni)'} Tahun ${selectedSemesterYear}`
        : `Bulan ${singleMonthName} ${activeSingleYear}`;

    const statusSummary =
      studentItem.total === 0
        ? `- Status Kehadiran: *Alhamdulillah, Nihil Ketidakhadiran (Hadir 100%)*`
        : `- Sakit (S): *${studentItem.sakit} hari*\n- Izin (I): *${studentItem.izin} hari*\n- Alpa / Tanpa Keterangan (A): *${studentItem.alpa} hari*\n- *Total Ketidakhadiran: ${studentItem.total} hari*`;

    const breakdownBlock =
      studentItem.monthlyBreakdown && studentItem.total > 0
        ? `\n*Rincian Per Bulan:*\n${studentItem.monthlyBreakdown}\n`
        : '';

    return `Assalamu'alaikum Wr. Wb.

Yth. Bapak/Ibu Orang Tua/Wali dari ananda:
Nama: *${studentItem.name}*${studentItem.nisn ? ` (NISN: ${studentItem.nisn})` : ''}
Kelas: *${className}* — *${schoolName}*

Berikut kami sampaikan informasi *Rekapitulasi Ketidakhadiran Siswa* pada periode *${periodLabel}*:

${statusSummary}
${breakdownBlock}
Demikian informasi rekap kehadiran ini kami sampaikan untuk menjadi perhatian bersama. Atas kerja sama dan perhatian Bapak/Ibu, kami ucapkan terima kasih.

Wassalamu'alaikum Wr. Wb.
*Wali Kelas ${className}*
${teacherName}`;
  };

  // Open Preview Pesan modal before sending
  const handleOpenWaPreviewBeforeSend = (
    studentItem: {
      id: string;
      name: string;
      nisn?: string;
      parentWhatsapp?: string;
      sakit: number;
      izin: number;
      alpa: number;
      total: number;
      monthlyBreakdown?: string;
    },
    preferredAction: 'direct' | 'gateway' = 'direct'
  ) => {
    const generatedMsg = generateRecapPersonalWaMessage(studentItem);
    setWaPreviewModalData({
      ...studentItem,
      customMessage: generatedMsg,
      targetPhone: studentItem.parentWhatsapp || '',
      preferredAction,
    });
  };

  // Direct open wa.me link for a student's parent (supports custom edited message & phone)
  const handleOpenDirectWaPersonal = (
    studentItem: {
      id: string;
      name: string;
      nisn?: string;
      parentWhatsapp?: string;
      sakit: number;
      izin: number;
      alpa: number;
      total: number;
      monthlyBreakdown?: string;
    },
    overrideMessage?: string,
    overridePhone?: string
  ) => {
    const rawPhone = overridePhone !== undefined ? overridePhone : studentItem.parentWhatsapp;
    const waClean = formatWaNumber(rawPhone);
    if (!waClean) {
      showToast(`Nomor WA Orang Tua untuk ${studentItem.name} belum diisi di Database Siswa.`);
      return;
    }
    const msg = overrideMessage !== undefined ? overrideMessage : generateRecapPersonalWaMessage(studentItem);
    const url = `https://wa.me/${waClean}?text=${encodeURIComponent(msg)}`;

    try {
      saveWhatsAppTransmissionLog({
        target: rawPhone || waClean,
        targetName: `Wali Murid: ${studentItem.name}`,
        targetType: 'personal',
        message: msg,
        status: 'success',
        responseMessage: 'Rekap Ketidakhadiran dibuka via WhatsApp Personal Ortu',
        sentBy: `Manual (Rekap Ketidakhadiran - ${viewMode === 'semester' ? `Semester ${semester}` : singleMonthName})`,
        meta: {
          studentId: studentItem.id,
          studentName: studentItem.name,
          year: viewMode === 'semester' ? selectedSemesterYear : activeSingleYear,
        },
      });
    } catch {
      // ignore
    }

    window.open(url, '_blank', 'noopener,noreferrer');
    setWaPreviewModalData(null);
  };

  // Send via Fonnte Gateway to a student's parent (supports custom edited message & phone)
  const handleSendGatewayWaPersonal = async (
    studentItem: {
      id: string;
      name: string;
      nisn?: string;
      parentWhatsapp?: string;
      sakit: number;
      izin: number;
      alpa: number;
      total: number;
      monthlyBreakdown?: string;
    },
    overrideMessage?: string,
    overridePhone?: string
  ) => {
    const rawPhone = overridePhone !== undefined ? overridePhone : studentItem.parentWhatsapp;
    const waClean = formatWaNumber(rawPhone);
    if (!waClean) {
      showToast(`Nomor WA Orang Tua untuk ${studentItem.name} belum diisi.`);
      return;
    }
    if (!schoolSettings.whatsappApiToken?.trim()) {
      handleOpenDirectWaPersonal(studentItem, overrideMessage, overridePhone);
      return;
    }

    setSendingStudentId(studentItem.id);
    const msg = overrideMessage !== undefined ? overrideMessage : generateRecapPersonalWaMessage(studentItem);

    try {
      const res = await sendWhatsAppViaGateway({
        token: schoolSettings.whatsappApiToken,
        endpointUrl: schoolSettings.whatsappEndpointUrl,
        target: waClean,
        message: msg,
        auditMeta: {
          targetName: `Wali Murid: ${studentItem.name}`,
          targetType: 'personal',
          sentBy: `Gateway (Rekap Ketidakhadiran - ${viewMode === 'semester' ? `Semester ${semester}` : singleMonthName})`,
          meta: {
            studentId: studentItem.id,
            studentName: studentItem.name,
            year: viewMode === 'semester' ? selectedSemesterYear : activeSingleYear,
          },
        },
      });

      if (res.success) {
        showToast(`✅ Terkirim ke WA Orang Tua ${studentItem.name} (${rawPhone || waClean})`);
        setWaPreviewModalData(null);
      } else {
        showToast(`⚠️ Gagal via Gateway: ${res.message}. Membuka WhatsApp langsung...`);
        handleOpenDirectWaPersonal(studentItem, overrideMessage, overridePhone);
      }
    } catch {
      handleOpenDirectWaPersonal(studentItem, overrideMessage, overridePhone);
    } finally {
      setSendingStudentId(null);
    }
  };

  // Helper to fetch attendance data for any year and month index
  const getMonthAttendanceData = (year: number, monthIdx: number) => {
    const isCurrentActive = year === selectedYear && monthIdx === selectedMonthIndex;
    const key = `${year}_${monthIdx}`;
    if (isCurrentActive && activeAttendanceData && Object.keys(activeAttendanceData).length > 0) {
      return activeAttendanceData;
    }
    return attendanceStore[key] || {};
  };

  // Months for current semester
  const semesterMonths = useMemo(() => {
    if (semester === 'ganjil') {
      return [
        { name: 'Juli', index: 6, year: selectedSemesterYear },
        { name: 'Agustus', index: 7, year: selectedSemesterYear },
        { name: 'September', index: 8, year: selectedSemesterYear },
        { name: 'Oktober', index: 9, year: selectedSemesterYear },
        { name: 'November', index: 10, year: selectedSemesterYear },
        { name: 'Desember', index: 11, year: selectedSemesterYear },
      ];
    } else {
      return [
        { name: 'Januari', index: 0, year: selectedSemesterYear },
        { name: 'Februari', index: 1, year: selectedSemesterYear },
        { name: 'Maret', index: 2, year: selectedSemesterYear },
        { name: 'April', index: 3, year: selectedSemesterYear },
        { name: 'Mei', index: 4, year: selectedSemesterYear },
        { name: 'Juni', index: 5, year: selectedSemesterYear },
      ];
    }
  }, [semester, selectedSemesterYear]);

  // Compute semester recap data per student (exactly for the 25-column table in rekap.jpg)
  const semesterStudentRecapList: SemesterStudentRecapItem[] = useMemo(() => {
    return students.map((s, idx) => {
      const monthlyStats: Record<number, { s: number; i: number; a: number }> = {};
      let totalS = 0;
      let totalI = 0;
      let totalA = 0;

      semesterMonths.forEach((m) => {
        const daysInM = new Date(m.year, m.index + 1, 0).getDate();
        const mAttendance = getMonthAttendanceData(m.year, m.index);
        const sData = mAttendance[s.id] || {};

        let sCount = 0;
        let iCount = 0;
        let aCount = 0;

        for (let day = 1; day <= daysInM; day++) {
          const st = sData[day];
          if (st === 'S') sCount++;
          else if (st === 'I') iCount++;
          else if (st === 'A') aCount++;
        }

        monthlyStats[m.index] = { s: sCount, i: iCount, a: aCount };
        totalS += sCount;
        totalI += iCount;
        totalA += aCount;
      });

      return {
        id: s.id,
        no: s.no || idx + 1,
        nisn: s.nisn || '',
        name: s.name,
        gender: s.gender,
        parentWhatsapp: s.parentWhatsapp,
        monthly: monthlyStats,
        totalSemester: {
          s: totalS,
          i: totalI,
          a: totalA,
          jumlah: totalS + totalI + totalA,
        },
      };
    });
  }, [students, semesterMonths, activeAttendanceData, attendanceStore, selectedYear, selectedMonthIndex]);

  // Filtered & Sorted Semester Students
  const filteredSemesterStudents = useMemo(() => {
    let list = semesterStudentRecapList.filter((item) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesNisn = item.nisn.toLowerCase().includes(q);
        const matchesNo = String(item.no).includes(q);
        if (!matchesName && !matchesNisn && !matchesNo) return false;
      }

      if (filterType === 'absent_only') {
        return item.totalSemester.jumlah > 0;
      }
      if (filterType === 'perfect_only') {
        return item.totalSemester.jumlah === 0;
      }

      return true;
    });

    list.sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name, 'id');
      }
      if (sortBy === 'total_desc') {
        if (b.totalSemester.jumlah !== a.totalSemester.jumlah) {
          return b.totalSemester.jumlah - a.totalSemester.jumlah;
        }
        return b.totalSemester.a - a.totalSemester.a;
      }
      if (sortBy === 'alpa_desc') {
        if (b.totalSemester.a !== a.totalSemester.a) {
          return b.totalSemester.a - a.totalSemester.a;
        }
        return b.totalSemester.jumlah - a.totalSemester.jumlah;
      }
      return a.no - b.no;
    });

    return list;
  }, [semesterStudentRecapList, searchQuery, filterType, sortBy]);

  // Totals for Semester View
  const semesterTotals: SemesterTotals = useMemo(() => {
    const monthlyTotals: Record<number, { s: number; i: number; a: number }> = {};
    semesterMonths.forEach((m) => {
      monthlyTotals[m.index] = { s: 0, i: 0, a: 0 };
    });

    let grandS = 0;
    let grandI = 0;
    let grandA = 0;
    let grandJumlah = 0;

    filteredSemesterStudents.forEach((s) => {
      semesterMonths.forEach((m) => {
        const stats = s.monthly[m.index] || { s: 0, i: 0, a: 0 };
        monthlyTotals[m.index].s += stats.s;
        monthlyTotals[m.index].i += stats.i;
        monthlyTotals[m.index].a += stats.a;
      });

      grandS += s.totalSemester.s;
      grandI += s.totalSemester.i;
      grandA += s.totalSemester.a;
      grandJumlah += s.totalSemester.jumlah;
    });

    return {
      monthly: monthlyTotals,
      totalSemester: {
        s: grandS,
        i: grandI,
        a: grandA,
        jumlah: grandJumlah,
      },
    };
  }, [filteredSemesterStudents, semesterMonths]);

  // Overall student stats (for filter badges)
  const semesterCounts = useMemo(() => {
    let perfect = 0;
    let absent = 0;
    semesterStudentRecapList.forEach((s) => {
      if (s.totalSemester.jumlah === 0) perfect++;
      else absent++;
    });
    return {
      perfect,
      absent,
      total: semesterStudentRecapList.length,
    };
  }, [semesterStudentRecapList]);

  // ---------------- Single Month Logic (fallback / secondary view) ----------------
  const singleMonthName = MONTH_NAMES[activeMonthIdx] || 'Bulan';
  const singleDaysInMonth = new Date(activeSingleYear, activeMonthIdx + 1, 0).getDate();

  const singleMonthAttendance = useMemo(() => {
    return getMonthAttendanceData(activeSingleYear, activeMonthIdx);
  }, [activeSingleYear, activeMonthIdx, selectedYear, selectedMonthIndex, activeAttendanceData, attendanceStore]);

  const singleMonthRecapList = useMemo(() => {
    return students.map((s, idx) => {
      const sData = singleMonthAttendance[s.id] || {};
      let sakit = 0;
      let izin = 0;
      let alpa = 0;
      let hadir = 0;

      for (let day = 1; day <= singleDaysInMonth; day++) {
        const st = sData[day];
        if (st === 'S') sakit++;
        else if (st === 'I') izin++;
        else if (st === 'A') alpa++;
        else if (st === 'H') hadir++;
      }

      return {
        id: s.id,
        no: s.no || idx + 1,
        name: s.name,
        gender: s.gender,
        parentWhatsapp: s.parentWhatsapp,
        sakit,
        izin,
        alpa,
        hadir,
        total: sakit + izin + alpa,
      };
    });
  }, [students, singleMonthAttendance, singleDaysInMonth]);

  const filteredSingleMonthStudents = useMemo(() => {
    let list = singleMonthRecapList.filter((item) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesNo = String(item.no).includes(q);
        if (!matchesName && !matchesNo) return false;
      }
      if (filterType === 'absent_only') return item.total > 0;
      if (filterType === 'perfect_only') return item.total === 0;
      return true;
    });

    list.sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name, 'id');
      if (sortBy === 'total_desc') return b.total - a.total || b.alpa - a.alpa;
      if (sortBy === 'alpa_desc') return b.alpa - a.alpa || b.total - a.total;
      return a.no - b.no;
    });

    return list;
  }, [singleMonthRecapList, searchQuery, filterType, sortBy]);

  const singleMonthTotals = useMemo(() => {
    let sumSakit = 0;
    let sumIzin = 0;
    let sumAlpa = 0;
    let grandTotal = 0;

    filteredSingleMonthStudents.forEach((s) => {
      sumSakit += s.sakit;
      sumIzin += s.izin;
      sumAlpa += s.alpa;
      grandTotal += s.total;
    });

    return { sumSakit, sumIzin, sumAlpa, grandTotal };
  }, [filteredSingleMonthStudents]);

  // Cell rendering for values
  const renderCellValue = (val: number, isHighlight: boolean = false) => {
    if (val === 0) {
      if (showZeroMode === 'blank') {
        return null;
      }
      if (showZeroMode === 'dash') {
        return <span className="text-slate-500 font-bold text-xs">-</span>;
      }
      return <span className="text-slate-300 text-xs">0</span>;
    }
    return (
      <span
        className={`font-black ${
          isHighlight
            ? val >= 5
              ? 'text-rose-600'
              : 'text-slate-900'
            : 'text-slate-800'
        }`}
      >
        {val}
      </span>
    );
  };

  // Copy table to clipboard in TSV (Tab Separated Values) format for direct Excel paste
  const handleCopyTableToClipboard = () => {
    if (viewMode === 'semester') {
      let tsv = `REKAP KETIDAKHADIRAN SISWA\n`;
      tsv += `${schoolSettings.schoolName}\tKELAS ${schoolSettings.className}\tSEMESTER ${semester.toUpperCase()} ${selectedSemesterYear}\n\n`;

      // Header row 1
      tsv += `No\tNISN\tNama Siswa\t`;
      semesterMonths.forEach((m) => {
        tsv += `${m.name}\t\t\t`;
      });
      tsv += `Total Semester\t\t\t\n`;

      // Header row 2
      tsv += `\t\t\t`;
      semesterMonths.forEach(() => {
        tsv += `S\tI\tA\t`;
      });
      tsv += `S\tI\tA\tJumlah\n`;

      // Rows
      filteredSemesterStudents.forEach((s, idx) => {
        tsv += `${idx + 1}\t${s.nisn || '-'}\t${s.name}\t`;
        semesterMonths.forEach((m) => {
          const stats = s.monthly[m.index] || { s: 0, i: 0, a: 0 };
          tsv += `${stats.s || '-'}\t${stats.i || '-'}\t${stats.a || '-'}\t`;
        });
        tsv += `${s.totalSemester.s || '-'}\t${s.totalSemester.i || '-'}\t${s.totalSemester.a || '-'}\t${s.totalSemester.jumlah || '-'}\n`;
      });

      // Total row
      tsv += `TOTAL\t\t\t`;
      semesterMonths.forEach((m) => {
        const mTot = semesterTotals.monthly[m.index] || { s: 0, i: 0, a: 0 };
        tsv += `${mTot.s || '-'}\t${mTot.i || '-'}\t${mTot.a || '-'}\t`;
      });
      tsv += `${semesterTotals.totalSemester.s || '-'}\t${semesterTotals.totalSemester.i || '-'}\t${semesterTotals.totalSemester.a || '-'}\t${semesterTotals.totalSemester.jumlah || '-'}\n`;

      navigator.clipboard.writeText(tsv);
      setCopied(true);
      showToast('Tabel format semester berhasil disalin! Siap ditempel langsung ke Microsoft Excel.');
      setTimeout(() => setCopied(false), 3000);
    } else {
      let tsv = `KETIDAK HADIRAN\n`;
      tsv += `Bulan: ${singleMonthName} ${activeSingleYear}\tKelas: ${schoolSettings.className}\tSekolah: ${schoolSettings.schoolName}\n\n`;
      tsv += `NO.\tNAMA SISWA\tSAKIT\tIZIN\tALPA\tTOTAL\n`;

      filteredSingleMonthStudents.forEach((s, idx) => {
        tsv += `${idx + 1}\t${s.name}\t${s.sakit}\t${s.izin}\t${s.alpa}\t${s.total}\n`;
      });

      tsv += `TOTAL KESELURUHAN\t\t${singleMonthTotals.sumSakit}\t${singleMonthTotals.sumIzin}\t${singleMonthTotals.sumAlpa}\t${singleMonthTotals.grandTotal}\n`;

      navigator.clipboard.writeText(tsv);
      setCopied(true);
      showToast('Tabel bulanan berhasil disalin! Siap ditempel langsung ke Excel.');
      setTimeout(() => setCopied(false), 3000);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (viewMode === 'semester') {
      exportSemesterAbsenceRecapToCSV(
        filteredSemesterStudents,
        semesterTotals,
        schoolSettings,
        semester === 'ganjil' ? 'Ganjil' : 'Genap',
        String(selectedSemesterYear),
        semesterMonths
      );
      showToast('File CSV Rekap Ketidakhadiran Semester berhasil didownload!');
    } else {
      let csvContent = 'data:text/csv;charset=utf-8,\uFEFF';
      csvContent += `REKAP KETIDAKHADIRAN SISWA BULANAN\n`;
      csvContent += `${schoolSettings.schoolName} - KELAS ${schoolSettings.className}\n`;
      csvContent += `BULAN: ${singleMonthName} ${activeSingleYear}\n\n`;
      csvContent += `NO,NAMA SISWA,SAKIT,IZIN,ALPA,TOTAL\n`;

      filteredSingleMonthStudents.forEach((s, idx) => {
        csvContent += `${idx + 1},"${(s.name || '').replace(/"/g, '""')}",${s.sakit},${s.izin},${s.alpa},${s.total}\n`;
      });
      csvContent += `TOTAL,,${singleMonthTotals.sumSakit},${singleMonthTotals.sumIzin},${singleMonthTotals.sumAlpa},${singleMonthTotals.grandTotal}\n`;

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `Rekap_Ketidakhadiran_${schoolSettings.className}_${singleMonthName}_${activeSingleYear}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('File CSV Rekap Bulanan berhasil didownload!');
    }
  };

  // Export to Microsoft Word
  const handleExportWord = () => {
    if (viewMode === 'semester') {
      exportSemesterAbsenceRecapToWord(
        filteredSemesterStudents,
        semesterTotals,
        schoolSettings,
        semester === 'ganjil' ? 'Ganjil' : 'Genap',
        String(selectedSemesterYear),
        semesterMonths,
        showZeroMode === 'blank'
      );
      showToast('File Word (.doc) Rekap Ketidakhadiran Semester berhasil didownload!');
    } else {
      exportMonthlyAbsenceRecapToWord(
        filteredSingleMonthStudents,
        singleMonthTotals,
        schoolSettings,
        singleMonthName,
        activeSingleYear,
        showZeroMode === 'dash'
      );
      showToast('File Word (.doc) Rekap Bulanan berhasil didownload!');
    }
  };

  // Native Print
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 text-xs font-bold flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-3">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header & Controls Card (Hidden in Print) */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-4 sm:p-5 space-y-4 print:hidden">
        {/* Header Title */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#2F5597] text-white rounded-xl shadow-xs">
            <FileSpreadsheet className="w-5 h-5 text-blue-100" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                Rekap Ketidakhadiran Siswa
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-900 border border-blue-200">
                Format Excel Resmi
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Tabel rekapitulasi ketidakhadiran siswa (Sakit, Izin, Alpa) per bulan dan Total Semester sesuai template Excel resmi.
            </p>
          </div>
        </div>

        {/* Toolbar: Posisi Rapi Sesuai Urutan Permintaan */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
          {/* Kelompok Kiri: 1. Semester, 2. Tahun, 3. Cari nama atau NISN */}
          <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
            {/* 1. Ganjil (Juli - Des) / Genap (Jan - Jun) */}
            {viewMode === 'semester' ? (
              <div className="flex items-center bg-slate-200/80 p-1 rounded-xl border border-slate-300 text-xs font-bold shrink-0 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setSemester('ganjil')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    semester === 'ganjil'
                      ? 'bg-[#2F5597] text-white shadow-xs font-black'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-300/60 font-semibold'
                  }`}
                >
                  Ganjil (Juli - Des)
                </button>
                <button
                  type="button"
                  onClick={() => setSemester('genap')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    semester === 'genap'
                      ? 'bg-[#2F5597] text-white shadow-xs font-black'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-300/60 font-semibold'
                  }`}
                >
                  Genap (Jan - Jun)
                </button>
              </div>
            ) : (
              /* Navigasi Bulan jika dalam mode Rekap 1 Bulan */
              <div className="flex items-center gap-1.5 bg-slate-200/80 rounded-xl p-1 border border-slate-300 shrink-0 shadow-2xs">
                <button
                  type="button"
                  onClick={() => {
                    if (activeMonthIdx > 0) setActiveMonthIdx(activeMonthIdx - 1);
                    else {
                      setActiveMonthIdx(11);
                      setActiveSingleYear(activeSingleYear - 1);
                    }
                  }}
                  className="p-1.5 hover:bg-white text-slate-700 hover:text-slate-900 rounded-lg cursor-pointer transition-all"
                  title="Bulan Sebelumnya"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <select
                  value={activeMonthIdx}
                  onChange={(e) => setActiveMonthIdx(Number(e.target.value))}
                  className="bg-transparent font-black text-xs text-slate-900 focus:outline-none cursor-pointer py-1 px-1"
                >
                  {MONTH_NAMES.map((m, idx) => (
                    <option key={idx} value={idx}>
                      {m}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => {
                    if (activeMonthIdx < 11) setActiveMonthIdx(activeMonthIdx + 1);
                    else {
                      setActiveMonthIdx(0);
                      setActiveSingleYear(activeSingleYear + 1);
                    }
                  }}
                  className="p-1.5 hover:bg-white text-slate-700 hover:text-slate-900 rounded-lg cursor-pointer transition-all"
                  title="Bulan Berikutnya"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* 2. Tahun Selector dengan Background Tombol Elegan */}
            <div className="flex items-center gap-1.5 bg-white hover:bg-slate-50 border border-slate-300 hover:border-[#2F5597] rounded-xl px-3 py-1.5 shadow-xs shrink-0 transition-all cursor-pointer">
              <Calendar className="w-3.5 h-3.5 text-[#2F5597] shrink-0" />
              <select
                value={viewMode === 'semester' ? selectedSemesterYear : activeSingleYear}
                onChange={(e) => {
                  const y = Number(e.target.value);
                  if (viewMode === 'semester') setSelectedSemesterYear(y);
                  else setActiveSingleYear(y);
                }}
                className="bg-transparent font-black text-xs text-slate-900 focus:outline-none cursor-pointer"
              >
                {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map((y) => (
                  <option key={y} value={y}>
                    Tahun {y}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Cari nama atau NISN... */}
            <div className="relative min-w-[200px] max-w-xs flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama atau NISN..."
                className="w-full pl-8 pr-3 py-2 bg-slate-50 hover:bg-slate-100/80 focus:bg-white text-xs border border-slate-200 focus:border-blue-500 rounded-xl focus:outline-none transition-all font-medium"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Kelompok Kanan: 4. Mode Rekap, 5. Export Word, 6. Cetak / PDF */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* 4. Rekap Semester & Rekap 1 Bulan */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
              <button
                type="button"
                onClick={() => setViewMode('semester')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'semester'
                    ? 'bg-[#2F5597] text-white shadow-xs'
                    : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                Rekap Semester
              </button>
              <button
                type="button"
                onClick={() => setViewMode('monthly')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'monthly'
                    ? 'bg-[#2F5597] text-white shadow-xs'
                    : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                Rekap 1 Bulan
              </button>
            </div>

            {/* 5. Export Word */}
            <button
              type="button"
              onClick={handleExportWord}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#2F5597] hover:bg-[#234377] text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer active:scale-95"
              title="Download File Microsoft Word (.doc)"
            >
              <FileText className="w-3.5 h-3.5 text-sky-200" />
              <span>Export Word</span>
            </button>

            {/* 6. Cetak / PDF */}
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer active:scale-95"
              title="Cetak Laporan / Simpan PDF"
            >
              <Printer className="w-3.5 h-3.5 text-yellow-300" />
              <span>Cetak / PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Document & Sheet Area */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6 print:p-0 print:border-none print:shadow-none overflow-hidden">
        {/* Document Header (Formal Title for School) */}
        <div className="text-center mb-5">
          <h1 className="text-xl sm:text-2xl font-black tracking-wider text-black uppercase">
            KETIDAK HADIRAN
          </h1>
          <div className="mt-1.5 text-xs sm:text-sm font-semibold text-slate-700 flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            <span>
              KELAS: <strong className="text-black">{schoolSettings.className}</strong>
            </span>
            <span className="text-slate-300 hidden sm:inline">•</span>
            <span>
              SEKOLAH: <strong className="text-black">{schoolSettings.schoolName}</strong>
            </span>
            <span className="text-slate-300 hidden sm:inline">•</span>
            <span>
              SEMESTER: <strong className="text-black uppercase">{viewMode === 'semester' ? (semester === 'ganjil' ? 'GANJIL' : 'GENAP') : singleMonthName.toUpperCase()}</strong>
            </span>
            <span className="text-slate-300 hidden sm:inline">•</span>
            <span>
              TAHUN: <strong className="text-black">{viewMode === 'semester' ? selectedSemesterYear : activeSingleYear}</strong>
            </span>
            {schoolSettings.academicYear && (
              <>
                <span className="text-slate-300 hidden sm:inline">•</span>
                <span>
                  TAHUN AJARAN: <strong className="text-black">{schoolSettings.academicYear}</strong>
                </span>
              </>
            )}
          </div>
        </div>

        {/* ---------------- VIEW 1: REKAP SEMESTER (EXACTLY AS SHOWN IN rekap.jpg) ---------------- */}
        {viewMode === 'semester' && (
          <div className="overflow-x-auto pb-4">
            <table className="w-full border-collapse border border-slate-400 text-xs font-sans select-text">
              <thead>
                {/* Header Row 1: No, NISN, Nama Siswa, [Months x 6], Total Semester */}
                <tr className="bg-[#2F5597] text-white">
                  {/* Column 1: No */}
                  <th
                    rowSpan={2}
                    className="border border-[#7f9ec7] px-2 py-2 text-center align-middle font-bold text-white w-10 min-w-[36px] tracking-wide"
                  >
                    No
                  </th>

                  {/* Column 2: NISN */}
                  <th
                    rowSpan={2}
                    className="border border-[#7f9ec7] px-2 py-2 text-center align-middle font-bold text-white w-24 min-w-[85px] tracking-wide"
                  >
                    NISN
                  </th>

                  {/* Column 3: Nama Siswa */}
                  <th
                    rowSpan={2}
                    className="border border-[#7f9ec7] px-3 py-2 text-center align-middle font-bold text-white min-w-[170px] tracking-wide"
                  >
                    Nama Siswa
                  </th>

                  {/* Columns 4-9: Months (e.g. Juli, Agustus, September, Oktober, November, Desember) */}
                  {semesterMonths.map((m) => (
                    <th
                      key={m.name}
                      colSpan={3}
                      className="border border-[#7f9ec7] px-2 py-1.5 text-center align-middle font-bold text-white tracking-wide"
                    >
                      {m.name}
                    </th>
                  ))}

                  {/* Column 10: Total Semester */}
                  <th
                    colSpan={4}
                    className="border border-[#7f9ec7] px-2 py-1.5 text-center align-middle font-bold text-white tracking-wide bg-[#27467d]"
                  >
                    Total Semester
                  </th>
                </tr>

                {/* Header Row 2: S, I, A for each month, and S, I, A, Jumlah for Total Semester */}
                <tr className="bg-[#2F5597] text-white text-[11px]">
                  {semesterMonths.map((m) => (
                    <React.Fragment key={`sub-${m.name}`}>
                      <th className="border border-[#7f9ec7] py-1 text-center align-middle font-bold w-7 min-w-[28px]">
                        S
                      </th>
                      <th className="border border-[#7f9ec7] py-1 text-center align-middle font-bold w-7 min-w-[28px]">
                        I
                      </th>
                      <th className="border border-[#7f9ec7] py-1 text-center align-middle font-bold w-7 min-w-[28px]">
                        A
                      </th>
                    </React.Fragment>
                  ))}

                  {/* Total Semester Subheaders */}
                  <th className="border border-[#7f9ec7] py-1 text-center align-middle font-bold w-8 min-w-[30px] bg-[#27467d]">
                    S
                  </th>
                  <th className="border border-[#7f9ec7] py-1 text-center align-middle font-bold w-8 min-w-[30px] bg-[#27467d]">
                    I
                  </th>
                  <th className="border border-[#7f9ec7] py-1 text-center align-middle font-bold w-8 min-w-[30px] bg-[#27467d]">
                    A
                  </th>
                  <th className="border border-[#7f9ec7] py-1 text-center align-middle font-bold w-12 min-w-[44px] bg-[#233f72]">
                    Jumlah
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredSemesterStudents.length === 0 ? (
                  <tr>
                    <td
                      colSpan={25}
                      className="border border-slate-300 py-10 text-center text-slate-500 font-medium italic"
                    >
                      Tidak ada data siswa yang cocok dengan pencarian / filter ini.
                    </td>
                  </tr>
                ) : (
                  filteredSemesterStudents.map((student, idx) => {
                    return (
                      <tr
                        key={student.id}
                        className={`hover:bg-blue-50/50 transition-colors ${
                          idx % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'
                        }`}
                      >
                        {/* No */}
                        <td className="border border-slate-300 px-2 py-1.5 text-center font-medium text-slate-800 align-middle">
                          {idx + 1}
                        </td>

                        {/* NISN */}
                        <td className="border border-slate-300 px-2 py-1.5 text-center font-mono text-slate-700 text-xs align-middle">
                          {student.nisn || '-'}
                        </td>

                        {/* Nama Siswa */}
                        <td className="border border-slate-300 px-3 py-1.5 text-left font-semibold text-slate-900 uppercase align-middle">
                          <div className="flex items-center justify-between gap-2">
                            <span>{student.name}</span>
                            <div className="flex items-center gap-1.5 shrink-0 print:hidden">
                              {student.totalSemester.jumlah === 0 && (
                                <span className="text-[9px] font-extrabold text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200">
                                  100%
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  const breakdownLines = semesterMonths
                                    .map((m) => {
                                      const st = student.monthly[m.index] || { s: 0, i: 0, a: 0 };
                                      if (st.s + st.i + st.a === 0) return null;
                                      return `• ${m.name}: S=${st.s}, I=${st.i}, A=${st.a}`;
                                    })
                                    .filter(Boolean)
                                    .join('\n');
                                  handleOpenWaPreviewBeforeSend({
                                    id: student.id,
                                    name: student.name,
                                    nisn: student.nisn,
                                    parentWhatsapp: student.parentWhatsapp,
                                    sakit: student.totalSemester.s,
                                    izin: student.totalSemester.i,
                                    alpa: student.totalSemester.a,
                                    total: student.totalSemester.jumlah,
                                    monthlyBreakdown: breakdownLines,
                                  });
                                }}
                                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                                  student.parentWhatsapp
                                    ? 'bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-300'
                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-500 border border-slate-300'
                                }`}
                                title={
                                  student.parentWhatsapp
                                    ? `Preview & Kirim WA Rekap ke Orang Tua ${student.name} (${student.parentWhatsapp})`
                                    : `Preview Pesan WA Orang Tua ${student.name} (Nomor WA dapat diisi saat preview)`
                                }
                              >
                                <MessageSquare className="w-2.5 h-2.5" />
                                <span>WA</span>
                              </button>
                            </div>
                          </div>
                        </td>

                        {/* Months S, I, A values */}
                        {semesterMonths.map((m) => {
                          const stats = student.monthly[m.index] || { s: 0, i: 0, a: 0 };
                          return (
                            <React.Fragment key={`${student.id}-${m.name}`}>
                              {/* S */}
                              <td className="border border-slate-300 px-1 py-1 text-center align-middle text-amber-900">
                                {renderCellValue(stats.s)}
                              </td>
                              {/* I */}
                              <td className="border border-slate-300 px-1 py-1 text-center align-middle text-blue-900">
                                {renderCellValue(stats.i)}
                              </td>
                              {/* A */}
                              <td className="border border-slate-300 px-1 py-1 text-center align-middle text-rose-900">
                                {renderCellValue(stats.a)}
                              </td>
                            </React.Fragment>
                          );
                        })}

                        {/* Total Semester: S, I, A, Jumlah */}
                        <td className="border border-slate-300 px-1 py-1 text-center align-middle font-bold text-amber-950 bg-slate-50/70">
                          {renderCellValue(student.totalSemester.s)}
                        </td>
                        <td className="border border-slate-300 px-1 py-1 text-center align-middle font-bold text-blue-950 bg-slate-50/70">
                          {renderCellValue(student.totalSemester.i)}
                        </td>
                        <td className="border border-slate-300 px-1 py-1 text-center align-middle font-bold text-rose-950 bg-slate-50/70">
                          {renderCellValue(student.totalSemester.a)}
                        </td>
                        <td className="border border-slate-300 px-1.5 py-1 text-center align-middle font-black text-slate-950 bg-slate-100">
                          {renderCellValue(student.totalSemester.jumlah, true)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>

              {/* Bottom Row: TOTAL (matching rekap.jpg) */}
              <tfoot>
                <tr className="bg-slate-100 font-bold text-slate-900 text-xs">
                  {/* Spans No, NISN, Nama Siswa with centered 'TOTAL' */}
                  <td
                    colSpan={3}
                    className="border border-slate-400 px-3 py-2 text-center font-black tracking-widest uppercase align-middle text-slate-950"
                  >
                    TOTAL
                  </td>

                  {/* Monthly column totals */}
                  {semesterMonths.map((m) => {
                    const mTot = semesterTotals.monthly[m.index] || { s: 0, i: 0, a: 0 };
                    return (
                      <React.Fragment key={`tot-${m.name}`}>
                        <td className="border border-slate-400 px-1 py-2 text-center align-middle font-black text-slate-900">
                          {mTot.s === 0 ? (showZeroMode === 'blank' ? '' : showZeroMode === 'dash' ? '-' : 0) : mTot.s}
                        </td>
                        <td className="border border-slate-400 px-1 py-2 text-center align-middle font-black text-slate-900">
                          {mTot.i === 0 ? (showZeroMode === 'blank' ? '' : showZeroMode === 'dash' ? '-' : 0) : mTot.i}
                        </td>
                        <td className="border border-slate-400 px-1 py-2 text-center align-middle font-black text-slate-900">
                          {mTot.a === 0 ? (showZeroMode === 'blank' ? '' : showZeroMode === 'dash' ? '-' : 0) : mTot.a}
                        </td>
                      </React.Fragment>
                    );
                  })}

                  {/* Total Semester column totals */}
                  <td className="border border-slate-400 px-1 py-2 text-center align-middle font-black text-slate-950 bg-slate-200/80">
                    {semesterTotals.totalSemester.s === 0 && showZeroMode === 'dash' ? '-' : semesterTotals.totalSemester.s}
                  </td>
                  <td className="border border-slate-400 px-1 py-2 text-center align-middle font-black text-slate-950 bg-slate-200/80">
                    {semesterTotals.totalSemester.i === 0 && showZeroMode === 'dash' ? '-' : semesterTotals.totalSemester.i}
                  </td>
                  <td className="border border-slate-400 px-1 py-2 text-center align-middle font-black text-slate-950 bg-slate-200/80">
                    {semesterTotals.totalSemester.a === 0 && showZeroMode === 'dash' ? '-' : semesterTotals.totalSemester.a}
                  </td>
                  <td className="border border-slate-400 px-1.5 py-2 text-center align-middle font-black text-slate-950 bg-slate-300 text-sm">
                    {semesterTotals.totalSemester.jumlah === 0 && showZeroMode === 'dash' ? '-' : semesterTotals.totalSemester.jumlah}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* ---------------- VIEW 2: REKAP BULANAN (DETAIL 1 BULAN) ---------------- */}
        {viewMode === 'monthly' && (
          <div className="overflow-x-auto max-w-3xl mx-auto">
            <table className="w-full border-collapse border-2 border-black text-xs sm:text-sm">
              <thead>
                <tr>
                  <th
                    rowSpan={2}
                    className="border border-black bg-[#95B3D7] text-black font-extrabold uppercase px-2 py-2 text-center align-middle w-12 tracking-wider"
                  >
                    NO.
                  </th>
                  <th
                    rowSpan={2}
                    className="border border-black bg-[#95B3D7] text-black font-extrabold uppercase px-3 py-2 text-center align-middle tracking-wider"
                  >
                    NAMA SISWA
                  </th>
                  <th
                    colSpan={3}
                    className="border border-black bg-[#95B3D7] text-black font-extrabold uppercase px-2 py-1.5 text-center align-middle tracking-wider"
                  >
                    KETERANGAN
                  </th>
                  <th
                    rowSpan={2}
                    className="border border-black bg-[#95B3D7] text-black font-extrabold uppercase px-2 py-2 text-center align-middle w-16 sm:w-20 tracking-wider"
                  >
                    TOTAL
                  </th>
                </tr>
                <tr>
                  <th className="border border-black bg-[#95B3D7] text-black font-extrabold uppercase px-2 py-1 text-center align-middle w-14 sm:w-16 tracking-wider">
                    SAKIT
                  </th>
                  <th className="border border-black bg-[#95B3D7] text-black font-extrabold uppercase px-2 py-1 text-center align-middle w-14 sm:w-16 tracking-wider">
                    IZIN
                  </th>
                  <th className="border border-black bg-[#95B3D7] text-black font-extrabold uppercase px-2 py-1 text-center align-middle w-14 sm:w-16 tracking-wider">
                    ALPA
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredSingleMonthStudents.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="border border-black py-8 text-center text-slate-500 font-medium italic"
                    >
                      Tidak ada data siswa yang cocok dengan pencarian / filter ini.
                    </td>
                  </tr>
                ) : (
                  filteredSingleMonthStudents.map((student, idx) => (
                    <tr
                      key={student.id}
                      className={`hover:bg-blue-50/40 transition-colors ${
                        idx % 2 === 1 ? 'bg-slate-50/40' : 'bg-white'
                      }`}
                    >
                      <td className="border border-black px-2 py-1.5 text-center font-medium text-black align-middle">
                        {idx + 1}
                      </td>
                      <td className="border border-black px-3 py-1.5 text-left font-semibold uppercase text-black align-middle">
                        <div className="flex items-center justify-between gap-2">
                          <span>{student.name}</span>
                          <button
                            type="button"
                            onClick={() =>
                              handleOpenWaPreviewBeforeSend({
                                id: student.id,
                                name: student.name,
                                nisn: students.find((st) => st.id === student.id)?.nisn || '',
                                parentWhatsapp: student.parentWhatsapp,
                                sakit: student.sakit,
                                izin: student.izin,
                                alpa: student.alpa,
                                total: student.total,
                              })
                            }
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer print:hidden shrink-0 ${
                              student.parentWhatsapp
                                ? 'bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-300'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-500 border border-slate-300'
                            }`}
                            title={
                              student.parentWhatsapp
                                ? `Preview & Kirim WA Rekap Bulan ${singleMonthName} ke Orang Tua ${student.name} (${student.parentWhatsapp})`
                                : `Preview Pesan WA Orang Tua ${student.name} (Nomor WA dapat diisi saat preview)`
                            }
                          >
                            <MessageSquare className="w-3 h-3" />
                            <span>WA Ortu</span>
                          </button>
                        </div>
                      </td>
                      <td className="border border-black px-2 py-1.5 text-center align-middle">
                        {renderCellValue(student.sakit)}
                      </td>
                      <td className="border border-black px-2 py-1.5 text-center align-middle">
                        {renderCellValue(student.izin)}
                      </td>
                      <td className="border border-black px-2 py-1.5 text-center align-middle">
                        {renderCellValue(student.alpa)}
                      </td>
                      <td className="border border-black px-2 py-1.5 text-center font-bold text-black bg-slate-50/70 align-middle">
                        {renderCellValue(student.total, true)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>

              <tfoot>
                <tr className="bg-[#B8CCE4] text-black font-black">
                  <td
                    colSpan={2}
                    className="border border-black px-3 py-2 text-center font-black uppercase tracking-wider align-middle"
                  >
                    JUMLAH / TOTAL KESELURUHAN
                  </td>
                  <td className="border border-black px-2 py-2 text-center font-black text-black align-middle">
                    {singleMonthTotals.sumSakit === 0 && showZeroMode === 'dash' ? '-' : singleMonthTotals.sumSakit}
                  </td>
                  <td className="border border-black px-2 py-2 text-center font-black text-black align-middle">
                    {singleMonthTotals.sumIzin === 0 && showZeroMode === 'dash' ? '-' : singleMonthTotals.sumIzin}
                  </td>
                  <td className="border border-black px-2 py-2 text-center font-black text-black align-middle">
                    {singleMonthTotals.sumAlpa === 0 && showZeroMode === 'dash' ? '-' : singleMonthTotals.sumAlpa}
                  </td>
                  <td className="border border-black px-2 py-2 text-center font-black text-black bg-[#A6C0DE] align-middle text-sm sm:text-base">
                    {singleMonthTotals.grandTotal === 0 && showZeroMode === 'dash' ? '-' : singleMonthTotals.grandTotal}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* Official Signatures Area (Tanda Tangan) */}
        <div className="mt-8 pt-6 border-t border-slate-200 grid grid-cols-2 gap-8 text-center text-xs sm:text-sm text-black">
          {/* Left: Kepala Sekolah */}
          <div className="space-y-16">
            <div>
              <p className="font-semibold text-slate-700">Mengetahui,</p>
              <p className="font-bold text-black uppercase">Kepala Sekolah</p>
            </div>
            <div>
              <p className="font-black text-black underline uppercase">
                {schoolSettings.principalName || '................................................'}
              </p>
              <p className="text-slate-600 text-xs mt-0.5">
                NIP: {schoolSettings.principalNip || '................................'}
              </p>
            </div>
          </div>

          {/* Right: Wali Kelas */}
          <div className="space-y-16">
            <div>
              <p className="font-semibold text-slate-700">
                {schoolSettings.locationName || schoolSettings.reportPlaceDate || 'Ciputat'},{' '}
                {viewMode === 'semester'
                  ? semester === 'ganjil'
                    ? `31 Desember ${selectedSemesterYear}`
                    : `30 Juni ${selectedSemesterYear}`
                  : `${singleDaysInMonth} ${singleMonthName} ${activeSingleYear}`}
              </p>
              <p className="font-bold text-black uppercase">Wali Kelas {schoolSettings.className}</p>
            </div>
            <div>
              <p className="font-black text-black underline uppercase">
                {schoolSettings.homeroomTeacher || schoolSettings.teacherName || '................................................'}
              </p>
              <p className="text-slate-600 text-xs mt-0.5">
                NIP: {schoolSettings.homeroomTeacherNip || schoolSettings.teacherNip || '................................'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Kirim WA Personal Orang Tua (Rekap Ketidakhadiran) */}
      {isWaPersonalModalOpen && (
        <div
          onClick={() => setIsWaPersonalModalOpen(false)}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200 print:hidden"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl shadow-2xl border-2 border-emerald-400 w-full max-w-3xl overflow-hidden my-auto max-h-[90vh] flex flex-col"
          >
            {/* Header Modal */}
            <div className="bg-gradient-to-r from-emerald-700 via-teal-800 to-emerald-900 p-4 sm:p-5 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-500/30 text-yellow-300 rounded-2xl border border-emerald-400/30 shadow-inner">
                  <Phone className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-base sm:text-lg flex items-center gap-2">
                    Kirim Rekap Ketidakhadiran ke WA Personal Orang Tua
                  </h3>
                  <p className="text-xs text-emerald-100 font-medium">
                    Periode:{' '}
                    <strong>
                      {viewMode === 'semester'
                        ? `Semester ${semester === 'ganjil' ? 'Ganjil (Juli - Des)' : 'Genap (Jan - Jun)'} ${selectedSemesterYear}`
                        : `Bulan ${singleMonthName} ${activeSingleYear}`}
                    </strong>{' '}
                    • Kelas {schoolSettings.className}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsWaPersonalModalOpen(false)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
                title="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-slate-100 border-b border-slate-200 p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-black text-slate-700 flex items-center gap-1 mr-1">
                  <Filter className="w-3.5 h-3.5 text-emerald-700" />
                  Filter:
                </span>
                <button
                  type="button"
                  onClick={() => setWaFilterMode('absent_only')}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                    waFilterMode === 'absent_only'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  Ada Ketidakhadiran (S/I/A)
                </button>
                <button
                  type="button"
                  onClick={() => setWaFilterMode('alpa_only')}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                    waFilterMode === 'alpa_only'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  Khusus Alpa (A)
                </button>
                <button
                  type="button"
                  onClick={() => setWaFilterMode('all')}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                    waFilterMode === 'all'
                      ? 'bg-slate-800 text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  Semua Siswa ({students.length})
                </button>
              </div>

              <div className="relative min-w-[200px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={waSearchQuery}
                  onChange={(e) => setWaSearchQuery(e.target.value)}
                  placeholder="Cari nama siswa..."
                  className="w-full pl-8 pr-3 py-1.5 bg-white text-xs border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-600 font-medium"
                />
              </div>
            </div>

            {/* Body List */}
            <div className="p-4 overflow-y-auto space-y-2.5 grow">
              {(() => {
                const normalizedList =
                  viewMode === 'semester'
                    ? semesterStudentRecapList.map((s) => {
                        const breakdownLines = semesterMonths
                          .map((m) => {
                            const st = s.monthly[m.index] || { s: 0, i: 0, a: 0 };
                            if (st.s + st.i + st.a === 0) return null;
                            return `• ${m.name}: S=${st.s}, I=${st.i}, A=${st.a}`;
                          })
                          .filter(Boolean)
                          .join('\n');
                        return {
                          id: s.id,
                          no: s.no,
                          nisn: s.nisn,
                          name: s.name,
                          parentWhatsapp: s.parentWhatsapp,
                          sakit: s.totalSemester.s,
                          izin: s.totalSemester.i,
                          alpa: s.totalSemester.a,
                          total: s.totalSemester.jumlah,
                          monthlyBreakdown: breakdownLines,
                        };
                      })
                    : singleMonthRecapList.map((s) => ({
                        id: s.id,
                        no: s.no,
                        nisn: students.find((st) => st.id === s.id)?.nisn || '',
                        name: s.name,
                        parentWhatsapp: s.parentWhatsapp,
                        sakit: s.sakit,
                        izin: s.izin,
                        alpa: s.alpa,
                        total: s.total,
                        monthlyBreakdown: undefined,
                      }));

                const filteredWaList = normalizedList.filter((item) => {
                  if (waSearchQuery.trim()) {
                    const q = waSearchQuery.toLowerCase();
                    if (!item.name.toLowerCase().includes(q) && !String(item.no).includes(q)) {
                      return false;
                    }
                  }
                  if (waFilterMode === 'absent_only') return item.total > 0;
                  if (waFilterMode === 'alpa_only') return item.alpa > 0;
                  return true;
                });

                if (filteredWaList.length === 0) {
                  return (
                    <div className="py-10 text-center text-xs text-slate-500 font-semibold bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                      Tidak ada siswa pada kategori filter ini. Silakan pilih filter <strong>&quot;Semua Siswa&quot;</strong> untuk melihat seluruh daftar siswa.
                    </div>
                  );
                }

                return filteredWaList.map((item) => {
                  const hasWa = Boolean(formatWaNumber(item.parentWhatsapp));
                  const isPreviewOpen = previewStudentId === item.id;
                  const isSending = sendingStudentId === item.id;

                  return (
                    <div
                      key={item.id}
                      className="border border-slate-200 hover:border-emerald-300 rounded-2xl p-3 bg-white shadow-2xs transition-all space-y-2"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-slate-800 text-white text-[11px] font-black flex items-center justify-center shrink-0">
                              {item.no}
                            </span>
                            <span className="font-black text-xs sm:text-sm text-slate-900 uppercase">
                              {item.name}
                            </span>
                            {item.total === 0 ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                                Hadir 100% (Nihil)
                              </span>
                            ) : (
                              <div className="flex items-center gap-1 text-[10px] font-black">
                                <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900">
                                  S: {item.sakit}
                                </span>
                                <span className="px-2 py-0.5 rounded-md bg-sky-100 text-sky-900">
                                  I: {item.izin}
                                </span>
                                <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-900">
                                  A: {item.alpa}
                                </span>
                                <span className="px-2 py-0.5 rounded-md bg-slate-900 text-white">
                                  Total: {item.total}
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-3 pl-8">
                            <span>
                              No. WA Ortu:{' '}
                              <strong className={hasWa ? 'text-emerald-700 font-bold' : 'text-rose-500 italic'}>
                                {item.parentWhatsapp || 'Belum diisi di Database Siswa'}
                              </strong>
                            </span>
                            <button
                              type="button"
                              onClick={() => setPreviewStudentId(isPreviewOpen ? null : item.id)}
                              className="text-blue-600 hover:underline font-bold cursor-pointer"
                            >
                              {isPreviewOpen ? 'Sembunyikan Preview Pesan' : 'Lihat Preview Pesan'}
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          {schoolSettings.whatsappApiToken?.trim() && (
                            <button
                              type="button"
                              disabled={isSending}
                              onClick={() => handleOpenWaPreviewBeforeSend(item, 'gateway')}
                              className="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                              title="Preview pesan sebelum kirim otomatis via Gateway Fonnte"
                            >
                              {isSending ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Send className="w-3.5 h-3.5 text-yellow-300" />
                              )}
                              <span>Preview &amp; Kirim Gateway</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleOpenWaPreviewBeforeSend(item, 'direct')}
                            className="px-3 py-1.5 font-extrabold text-xs rounded-xl transition-all flex items-center gap-1.5 shadow-xs bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                            title={`Preview pesan sebelum kirim WhatsApp Personal ke Orang Tua ${item.name}`}
                          >
                            <Eye className="w-3.5 h-3.5 text-emerald-100" />
                            <span>Preview &amp; Kirim WA</span>
                          </button>
                        </div>
                      </div>

                      {isPreviewOpen && (
                        <div className="mt-2 pt-2 border-t border-slate-100 pl-8">
                          <pre className="p-3 bg-slate-900 text-emerald-300 font-mono text-[11px] rounded-xl whitespace-pre-wrap leading-relaxed">
                            {generateRecapPersonalWaMessage(item)}
                          </pre>
                        </div>
                      )}
                    </div>
                  );
                });
              })()}
            </div>

            {/* Footer Modal */}
            <div className="bg-slate-100 border-t border-slate-200 p-4 flex items-center justify-between gap-3 shrink-0">
              <span className="text-[11px] text-slate-600 font-medium">
                💡 Klik <strong>&quot;Preview &amp; Kirim WA&quot;</strong> untuk memeriksa atau mengedit isi pesan sebelum dikirim ke orang tua siswa.
              </span>
              <button
                type="button"
                onClick={() => setIsWaPersonalModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs transition-all cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Preview Pesan Sebelum Kirim ke WA Personal Orang Tua */}
      {waPreviewModalData && (
        <div
          onClick={() => setWaPreviewModalData(null)}
          className="fixed inset-0 z-[60] bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200 print:hidden"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl shadow-2xl border-2 border-emerald-500 w-full max-w-xl overflow-hidden my-auto max-h-[92vh] flex flex-col"
          >
            {/* Header Preview */}
            <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 p-4 sm:p-5 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-500/25 text-emerald-200 rounded-2xl border border-emerald-400/30">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base sm:text-lg flex items-center gap-2">
                    Preview Pesan Sebelum Kirim
                  </h3>
                  <p className="text-xs text-emerald-200 font-medium">
                    Periksa nomor tujuan dan isi pesan WhatsApp sebelum dikirim ke Orang Tua/Wali
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setWaPreviewModalData(null)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
                title="Batal / Tutup Preview"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body Preview */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 grow">
              {/* Info Siswa & Ringkasan */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Nama Siswa
                  </div>
                  <div className="font-black text-sm text-slate-900 uppercase">
                    {waPreviewModalData.name}
                  </div>
                  {waPreviewModalData.nisn && (
                    <div className="text-xs text-slate-500 font-mono">
                      NISN: {waPreviewModalData.nisn}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-1.5 text-xs font-black">
                  <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 border border-amber-200">
                    Sakit: {waPreviewModalData.sakit}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-sky-100 text-sky-900 border border-sky-200">
                    Izin: {waPreviewModalData.izin}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-rose-100 text-rose-900 border border-rose-200">
                    Alpa: {waPreviewModalData.alpa}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-white">
                    Total: {waPreviewModalData.total}
                  </span>
                </div>
              </div>

              {/* Nomor WA Tujuan */}
              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                  Nomor WhatsApp Orang Tua / Wali Tujuan
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-emerald-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={waPreviewModalData.targetPhone}
                    onChange={(e) =>
                      setWaPreviewModalData((prev) =>
                        prev ? { ...prev, targetPhone: e.target.value } : null
                      )
                    }
                    placeholder="Contoh: 081234567890 atau 6281234567890"
                    className="w-full pl-10 pr-3 py-2 text-xs sm:text-sm font-bold text-slate-900 bg-white border-2 border-slate-300 rounded-xl focus:outline-none focus:border-emerald-600 transition-colors"
                  />
                </div>
                {!formatWaNumber(waPreviewModalData.targetPhone) && (
                  <p className="text-[11px] font-semibold text-rose-600">
                    ⚠️ Nomor WhatsApp orang tua belum diisi. Silakan ketik nomor tujuan di atas sebelum mengirim.
                  </p>
                )}
              </div>

              {/* Editor & Preview Pesan */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                    Isi Pesan WhatsApp (Dapat Diedit Sebelum Kirim)
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const defaultMsg = generateRecapPersonalWaMessage(waPreviewModalData);
                        setWaPreviewModalData((prev) =>
                          prev ? { ...prev, customMessage: defaultMsg } : null
                        );
                      }}
                      className="text-[11px] font-bold text-slate-500 hover:text-slate-800 underline cursor-pointer"
                    >
                      Reset Pesan
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(waPreviewModalData.customMessage);
                        showToast('Pesan berhasil disalin ke clipboard');
                      }}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] cursor-pointer transition-colors"
                    >
                      <Copy className="w-3 h-3" />
                      Salin Teks
                    </button>
                  </div>
                </div>

                {/* WhatsApp Bubble Style Preview + Editable Textarea */}
                <div className="bg-[#E5DDD5] p-3 rounded-2xl border border-slate-300 shadow-inner">
                  <div className="bg-[#DCF8C6] rounded-xl p-3 shadow-xs border border-emerald-200">
                    <textarea
                      rows={11}
                      value={waPreviewModalData.customMessage}
                      onChange={(e) =>
                        setWaPreviewModalData((prev) =>
                          prev ? { ...prev, customMessage: e.target.value } : null
                        )
                      }
                      className="w-full bg-transparent text-slate-900 font-sans text-xs sm:text-[13px] leading-relaxed focus:outline-none resize-y"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Action Buttons */}
            <div className="bg-slate-100 border-t border-slate-200 p-4 flex flex-wrap items-center justify-end gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setWaPreviewModalData(null)}
                className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold text-xs transition-all cursor-pointer"
              >
                Batal
              </button>

              {schoolSettings.whatsappApiToken?.trim() && (
                <button
                  type="button"
                  disabled={
                    sendingStudentId === waPreviewModalData.id ||
                    !formatWaNumber(waPreviewModalData.targetPhone)
                  }
                  onClick={() =>
                    handleSendGatewayWaPersonal(
                      waPreviewModalData,
                      waPreviewModalData.customMessage,
                      waPreviewModalData.targetPhone
                    )
                  }
                  className="px-4 py-2 bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  {sendingStudentId === waPreviewModalData.id ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5 text-yellow-300" />
                  )}
                  <span>Kirim via Gateway WA</span>
                </button>
              )}

              <button
                type="button"
                disabled={!formatWaNumber(waPreviewModalData.targetPhone)}
                onClick={() =>
                  handleOpenDirectWaPersonal(
                    waPreviewModalData,
                    waPreviewModalData.customMessage,
                    waPreviewModalData.targetPhone
                  )
                }
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Kirim ke WhatsApp Sekarang</span>
                <ExternalLink className="w-3 h-3 text-emerald-200" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
