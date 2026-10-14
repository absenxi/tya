import { Student, SchoolSettings, AttendanceEntry, TeacherAgendaEntry, Teacher, Subject } from '../types';

export const INITIAL_STUDENTS: Student[] = [
  {
    id: 'batch_1786185130159_0',
    no: 1,
    name: 'ADIT DWI NURDI HASTOMO',
    gender: 'L',
    nisn: '',
    parentWhatsapp: '081287143338',
    address: 'JALAN ARYA PUTRA GG. MUSHOLA AN-NUR RT 006 / 002 KELURAHAN KEDAUNG KECAMATAN PAMULANG',
    note: '',
  },
  {
    id: 'batch_1786185130159_1',
    no: 2,
    name: 'ADRIAN HERMAWAN',
    gender: 'L',
    nisn: '',
    parentWhatsapp: '083183121183',
    address: 'JALAN LEGOSO SELATAN 2 RT 007 / 002 NO. 92',
    note: '',
  },
  {
    id: 'batch_1786185130159_2',
    no: 3,
    name: 'AFIF HANIF FEBRIANSYAH',
    gender: 'L',
    nisn: '',
    parentWhatsapp: '081298682974',
    address: 'JALAN BOLA BASKET RT 7 / 6 SERUA PERMAI PAMULANG',
    note: '',
  },
  {
    id: 'batch_1786185130159_3',
    no: 4,
    name: 'AKBAR RYANSYAH',
    gender: 'L',
    nisn: '',
    parentWhatsapp: '0895619503262',
    address: 'JALAN KAYU MANIS RT 001 / 002 PONDOK CABE UDIK KECAMATAN PAMULANG',
    note: '',
  },
  {
    id: 'batch_1786185130159_4',
    no: 5,
    name: 'AKMAL PRADANA',
    gender: 'L',
    nisn: '',
    parentWhatsapp: '083184149863',
    address: 'JALAN PONCOL INDAH IV RT 2 / 2 DEKAT MUSHOLA AL-INAYAH DEPAN PAGAR WARNA HIJAU CAT HIJAU ABU',
    note: '',
  },
  {
    id: 'batch_1786185130159_5',
    no: 6,
    name: 'BAGUS DWI HARYANTO',
    gender: 'L',
    nisn: '',
    parentWhatsapp: '089514161877',
    address: '',
    note: '',
  },
  {
    id: 'batch_1786185130159_6',
    no: 7,
    name: 'CRISTIAN WICAKSONO',
    gender: 'L',
    nisn: '',
    parentWhatsapp: '089682162819',
    address: '',
    note: '',
  },
  {
    id: 'batch_1786185130159_8',
    no: 8,
    name: 'FERNANDO ILHAMSYAH PUTRA',
    gender: 'L',
    nisn: '',
    parentWhatsapp: '087822030689',
    address: 'JALAN HJ. ENTONG SERUA INDAH RT 04 / 01',
    note: '',
  },
  {
    id: 'batch_1786185130159_9',
    no: 9,
    name: 'FERRY FEBRIAN SIHALOHO',
    gender: 'L',
    nisn: '',
    parentWhatsapp: '089604814744',
    address: 'JALAN PISANGAN RAYA ( SAMPING RADJA NASI GORENG )',
    note: '',
  },
  {
    id: 'batch_1786185130159_10',
    no: 10,
    name: 'HAFIZ FADILAH',
    gender: 'L',
    nisn: '',
    parentWhatsapp: '087865770672',
    address: 'JALAN ATARUM RAYA RT 002 / 03 NO.26',
    note: '',
  },
  {
    id: 'batch_1786185130159_11',
    no: 11,
    name: 'HASAN MAULANA IDRIS',
    gender: 'L',
    nisn: '',
    parentWhatsapp: '083879785505',
    address: '',
    note: '',
  },
  {
    id: 'batch_1786185130159_12',
    no: 12,
    name: 'IHSAN AL FEROZ',
    gender: 'L',
    nisn: '',
    parentWhatsapp: '085715700746',
    address: 'JALAN LIMUN NO.45 RT 03 / 08',
    note: '',
  },
  {
    id: 'batch_1786185130159_13',
    no: 13,
    name: 'IRSYAD ARKANA',
    gender: 'L',
    nisn: '',
    parentWhatsapp: '085935008655',
    address: 'JALAN KEMIRI RAYA VIII RT 01 / 04 PONDOK CABE UDIK PAMULANG',
    note: '',
  },
  {
    id: 'batch_1786185130159_14',
    no: 14,
    name: 'M. RIDHO KUSUMAH',
    gender: 'L',
    nisn: '',
    parentWhatsapp: '085779270776',
    address: 'BAMBU APUS CIPUTAT RUMAH IBU DAHLIA',
    note: '',
  },
  {
    id: 'batch_1786185130159_34',
    no: 15,
    name: 'MIRZA PANCA SAKTI',
    gender: 'L',
    nisn: '',
    parentWhatsapp: '089677218486',
    address: 'JALAN PLUTO DALAM 1 NO.13 B',
    note: '',
  },
  {
    id: 'batch_1786185130159_15',
    no: 16,
    name: 'MORENO KUSUMAH',
    gender: 'L',
    nisn: '',
    parentWhatsapp: '085779270776',
    address: 'BAMBU APUS CIPUTAT RUMAH IBU DAHLIA',
    note: '',
  },
  {
    id: 'batch_1786185130159_16',
    no: 17,
    name: 'MUAMAR SULTAN MARUF',
    gender: 'L',
    nisn: '',
    parentWhatsapp: '',
    address: 'SAWAH LAMA GG. RODA RT 4 / 12',
    note: '',
  },
  {
    id: 'batch_1786185130159_17',
    no: 18,
    name: 'MUHAMAD FAIZ KAMIL',
    gender: 'L',
    nisn: '',
    parentWhatsapp: '085960552660',
    address: 'JALAN SIRNA GALIH 3 KAV. A NO. 8A CINANGKA SAWANGAN',
    note: '',
  },
  {
    id: 'batch_1786185130159_18',
    no: 19,
    name: 'MUHAMAD RIZKY',
    gender: 'L',
    nisn: '',
    parentWhatsapp: '08818870061',
    address: 'JALAN DEWANTARA KOMPLEK KOMPAS 2',
    note: '',
  },
  {
    id: 'batch_1786185130159_19',
    no: 20,
    name: 'MUHAMMAD DHEFA',
    gender: 'L',
    nisn: '',
    parentWhatsapp: '083879882359',
    address: 'JALAN KEMIRI RAYA 6 RT 03 / 11 PONDOK CABE UDIK PAMULANG',
    note: '',
  },
  {
    id: 'batch_1786185130159_20',
    no: 21,
    name: 'MUHAMMAD FAHMI',
    gender: 'L',
    nisn: '',
    parentWhatsapp: '083878999619',
    address: 'VILLA GADING ROYAL PARUNG BOGOR JAWA BARAT',
    note: '',
  },
  {
    id: 'batch_1786185130159_21',
    no: 22,
    name: 'MUHAMMAD FATHIR ARRASYID',
    gender: 'L',
    nisn: '',
    parentWhatsapp: '089638336158',
    address: 'JALAN KIHAJAR DEWANTARA GG. NURUL HUDA 2 RT 4 / 15',
    note: '',
  },
  {
    id: 'batch_1786185130159_22',
    no: 23,
    name: 'MUHAMMAD IBNU SABIL',
    gender: 'L',
    nisn: '',
    parentWhatsapp: '085813321608',
    address: 'JALAN ALE RAYA GG. RIBI 2 RT 02 / 02',
    note: '',
  },
  {
    id: 'batch_1786185130159_23',
    no: 24,
    name: 'MUHAMMAD IBRAHIM MUNTAZ',
    gender: 'L',
    nisn: '',
    parentWhatsapp: '08211885848',
    address: 'JALAN KH. WAHID HASYIM NO. 63 RT 005 / 06 , CIPADU RAYA KEC. LARANGAN',
    note: '',
  },
  {
    id: 'batch_1786185130159_24',
    no: 25,
    name: 'MUHAMMAD LUTHFI BAIHAQI',
    gender: 'L',
    nisn: '',
    parentWhatsapp: '085770893346',
    address: 'JALAN GURAME BAMBU APUS 3 D, NO. 54',
    note: '',
  },
  {
    id: 'batch_1786185130159_25',
    no: 26,
    name: 'MUHAMMAD SANDI',
    gender: 'L',
    nisn: '',
    parentWhatsapp: '083186488744',
    address: '',
    note: '',
  },
  {
    id: 'batch_1786185130159_26',
    no: 27,
    name: 'OMAR BENZEMA RUKMANA',
    gender: 'L',
    nisn: '',
    parentWhatsapp: '088292106008',
    address: 'JALAN HASAN LEOMING 02 RT 003 / 012',
    note: '',
  },
  {
    id: 'batch_1786185130159_27',
    no: 28,
    name: 'PUTRA JULYANSYAH',
    gender: 'L',
    nisn: '',
    parentWhatsapp: '085723816590',
    address: 'JALAN GUNUNG RAYA INDAH 1 RT 05 / 11 NO. 71',
    note: '',
  },
  {
    id: 'batch_1786185130159_28',
    no: 29,
    name: 'RAFFI SYADDAD RAHMAWAN',
    gender: 'L',
    nisn: '',
    parentWhatsapp: '08998317461',
    address: 'JALAN ANGSANA 2 RT 3 / 8 PAMULANG TIMUR',
    note: '',
  },
  {
    id: 'batch_1786185130159_29',
    no: 30,
    name: 'RAFQA BINTANG SAPUTRA',
    gender: 'L',
    nisn: '',
    parentWhatsapp: '',
    address: '',
    note: '',
  },
  {
    id: 'batch_1786185130159_30',
    no: 31,
    name: 'RISANG ELGI APRILIAN',
    gender: 'L',
    nisn: '',
    parentWhatsapp: '082124678507',
    address: 'JALAN GG. DAHU LEGOSO RT 4 / 1',
    note: '',
  },
  {
    id: 'batch_1786185130159_31',
    no: 32,
    name: 'RIZKY ARDIANSYAH',
    gender: 'L',
    nisn: '',
    parentWhatsapp: '089512933923',
    address: 'JALAN PONCOL INDAH III NO 24',
    note: '',
  },
  {
    id: 'batch_1786185130159_32',
    no: 33,
    name: 'RIZKY DAMAY SETIAWAN GINTING',
    gender: 'L',
    nisn: '',
    parentWhatsapp: '',
    address: 'JALAN APEL RAYA PAMULANG ESTATE RT 1 / 17 PAMULANG TIMUR',
    note: '',
  },
  {
    id: 'batch_1786185130159_33',
    no: 34,
    name: 'TAUFIK SARIFULLOH',
    gender: 'L',
    nisn: '',
    parentWhatsapp: '087775711131',
    address: '',
    note: '',
  },
];

export const INITIAL_TEACHERS: Teacher[] = [];

export const DEFAULT_SUBJECTS: string[] = [];

export const INITIAL_SUBJECTS: Subject[] = [];

export const INDONESIAN_DAY_NAMES = [
  'Minggu',
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
];

export function generateSampleTeacherAgenda(
  _year?: number,
  _monthIndex?: number,
  _className = 'X TJKT 3'
): TeacherAgendaEntry[] {
  // Data agenda guru default dibuat kosong murni (clean slate)
  return [];
}

export const INITIAL_SCHOOL_SETTINGS: SchoolSettings = {
  schoolName: 'SMKS NUSANTARA 1 CIPUTAT',
  foundationName: 'YAYASAN SMKS NUSANTARA 1 CIPUTAT',
  className: 'X TJKT 3',
  academicYear: '2026/2027',
  locationName: 'Ciputat',
  principalName: 'Drs. H. M. Nursalam, M.M.',
  principalNip: '-',
  teacherName: 'Wali Kelas X TJKT 3',
  teacherNip: '-',
  homeroomTeacher: 'Wali Kelas X TJKT 3',
  homeroomTeacherNip: '-',
  studyProgram: 'Teknik Jaringan Komputer dan Telekomunikasi',
  semester: 'GENAP',
  reportPlaceDate: 'Ciputat, 31 Januari 2026',
  headOfDepartment: '',
  headOfDepartmentNip: '-',
  classLeader: '',
  signatureDate: '13 Juli 2026',
  // Coordinates for SMKS Nusantara 1 Ciputat
  schoolLat: -6.31250,
  schoolLng: 106.74830,
  allowedRadiusMeters: 200,
  attendancePassword: '1234',
  adminPassword: 'admin',
  superAdminPassword: 'superadmin',
  requirePassword: true,
  whatsappGatewayProvider: 'fonnte',
  whatsappApiToken: '',
  whatsappEndpointUrl: 'https://api.fonnte.com/send',
  whatsappTestTarget: '',
  whatsappTestTargetType: 'group',
  whatsappTargetList: [],
  autoSendWhatsAppOnComplete: false,
  autoSendWhatsAppTargetId: '',
  autoSendWhatsAppTargetIds: [],
  autoSendWhatsAppCustomGreeting: '',
  lastAutoSentDate: '',
  whatsappGroupMessageTemplate: '',
  whatsappPersonalMessageTemplate: '',
};

export const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

/**
 * Generate realistic initial attendance entries for the given month
 */
export function generateSampleAttendance(
  students: Student[],
  year: number,
  monthIndex: number
): Record<string, Record<number, 'H' | 'A' | 'S' | 'I' | '-'>> {
  // result structure: { [studentId]: { [day]: status } }
  const result: Record<string, Record<number, 'H' | 'A' | 'S' | 'I' | '-'>> = {};
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

  students.forEach((student) => {
    result[student.id] = {};
    for (let day = 1; day <= daysInMonth; day++) {
      const dateObj = new Date(year, monthIndex, day);
      const dayOfWeek = dateObj.getDay(); // 0 = Sun, 6 = Sat

      // Weekends off
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        result[student.id][day] = '-';
        continue;
      }

      // Random realistic attendance
      // 90% Hadir, 4% Sakit, 3% Izin, 3% Alpa
      const studentHash = (parseInt(student.id, 10) * 17 + day * 31 + monthIndex * 7) % 100;
      if (studentHash < 88) {
        result[student.id][day] = 'H';
      } else if (studentHash < 93) {
        result[student.id][day] = 'S';
      } else if (studentHash < 97) {
        result[student.id][day] = 'I';
      } else {
        result[student.id][day] = 'A';
      }
    }
  });

  return result;
}
