import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { api } from '../../services/api';
import { Application } from '../../types';
import { ExportControls } from '../../components/common/ExportControls';
import { BookOpen, Search, Filter, Phone, MapPin, GraduationCap, CheckCircle2 } from 'lucide-react';

export const ApprovedStudentsPage: React.FC = () => {
  const { t, language } = useLanguage();
  const [students, setStudents] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [levelFilter, setLevelFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');
  const [search, setSearch] = useState('');

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admissions/approved', {
        params: {
          level: levelFilter,
          department: deptFilter,
          search: search || undefined,
        },
      });
      setStudents(res.data?.students || []);
    } catch (err) {
      console.error('Failed to load approved students:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [levelFilter, deptFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStudents();
  };

  const exportColumns = [
    { header: language === 'rw' ? 'Kode y’Ubwiyandikishe' : 'Admission Ref', key: 'tracking_number' },
    { header: language === 'rw' ? 'Amazina y’Umunyeshuri' : 'Student Full Name', key: 'student_name' },
    { header: language === 'rw' ? 'Igitsina' : 'Gender', key: 'gender' },
    { header: language === 'rw' ? 'Urwego' : 'Level', key: 'academic_level' },
    { header: language === 'rw' ? 'Ishami' : 'Department', key: 'department' },
    { header: language === 'rw' ? 'Amanota S3 (%)' : 'S3 Marks (%)', key: 's3_marks' },
    { header: language === 'rw' ? 'Amacumbi' : 'Boarding Status', key: 'qualifies_boarding', format: (val: number) => val === 1 ? (language === 'rw' ? 'Acumbika' : 'Boarding') : (language === 'rw' ? 'Umutaha' : 'Day Scholar') },
    { header: language === 'rw' ? 'Telefone y’Umubyeyi' : 'Parent Phone', key: 'phone' },
    { header: language === 'rw' ? 'Aho Atuye' : 'Residence', key: 'residence' },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-[#252B33]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-[#F0F3F6] tracking-tight">
              {t('approvedRegisterTitle')}
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#0ECB81]/15 text-[#0ECB81] border border-[#0ECB81]/30">
              {students.length} {language === 'rw' ? 'BEMEREWE' : 'ENROLLED'}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-[#A0AAB8] mt-1">
            {t('approvedRegisterSubtitle')}
          </p>
        </div>

        <ExportControls
          title={language === 'rw' ? 'Igitabo cy’Abanyeshuri Bemerewe Kwiga IBB' : 'Official Register of Approved Students'}
          data={students}
          columns={exportColumns}
          fileNamePrefix="IBB_Approved_Students"
        />
      </div>

      {/* Filter Bar (Level 3 Surface) */}
      <div className="bg-white dark:bg-[#181D24] rounded-xl p-3.5 border border-slate-200 dark:border-[#2B3139] shadow-xs flex flex-wrap items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 dark:text-[#707A8A] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('searchApprovedStudent')}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-[#11151B] border border-slate-200 dark:border-[#2B3139] text-slate-900 dark:text-[#F0F3F6] placeholder-slate-400 dark:placeholder-[#707A8A] focus:outline-none focus:border-[#FCD535]"
          />
        </form>

        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-500 dark:text-[#707A8A] text-[11px] font-mono font-medium">{t('filterLevel')}:</span>
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-[#11151B] border border-slate-200 dark:border-[#2B3139] text-slate-800 dark:text-[#F0F3F6] focus:outline-none focus:border-[#FCD535]"
          >
            <option value="all">{t('allLevels')}</option>
            <option value="L3">Level 3 (L3)</option>
            <option value="L4">Level 4 (L4)</option>
            <option value="L5">Level 5 (L5)</option>
          </select>
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-500 dark:text-[#707A8A] text-[11px] font-mono font-medium">{t('filterDept')}:</span>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-[#11151B] border border-slate-200 dark:border-[#2B3139] text-slate-800 dark:text-[#F0F3F6] focus:outline-none focus:border-[#FCD535]"
          >
            <option value="all">{t('allDepartments')}</option>
            <option value="Software Development">{language === 'rw' ? 'Ikoranabuhanga (Software)' : 'Software Development'}</option>
            <option value="Automobile Technology">{language === 'rw' ? 'Ubukanishi bw’Ibinyabiziga' : 'Automobile Technology'}</option>
          </select>
        </div>
      </div>

      {/* Register Table (Level 3 Surface) */}
      <div className="bg-white dark:bg-[#181D24] rounded-xl border border-slate-200 dark:border-[#2B3139] shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500 dark:text-[#A0AAB8] font-mono">
            {language === 'rw' ? 'Gutegereza urutonde rw’abanyeshuri...' : 'Loading student roster...'}
          </div>
        ) : students.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-[#707A8A] space-y-2">
            <BookOpen className="w-8 h-8 mx-auto text-slate-400 dark:text-[#707A8A]" />
            <p className="text-xs">{language === 'rw' ? 'Nta munyeshuri wemerewe uhuye n’ibyo mushakisha.' : 'No approved students found matching the selected filter criteria.'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[700px]">
              <thead className="bg-slate-50 dark:bg-[#11151B] text-slate-500 dark:text-[#707A8A] uppercase font-mono tracking-wider text-[10px] border-b border-slate-200 dark:border-[#252B33]">
                <tr>
                  <th className="py-3 px-4 font-bold">{t('tblTracking')}</th>
                  <th className="py-3 px-4 font-bold">{t('tblCandidateName')}</th>
                  <th className="py-3 px-4 font-bold">{language === 'rw' ? 'Igitsina' : 'Gender'}</th>
                  <th className="py-3 px-4 font-bold">{t('tblLevelTrade')}</th>
                  <th className="py-3 px-4 font-bold text-right">{t('tblS3Marks')}</th>
                  <th className="py-3 px-4 font-bold text-center">{t('tblBoarding')}</th>
                  <th className="py-3 px-4 font-bold">{language === 'rw' ? 'Aho Batuye & Telefone' : 'Contact & District'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#252B33]">
                {students.map((st) => (
                  <tr key={st.id} className="hover:bg-slate-50/70 dark:hover:bg-[#202630]/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-[#3B82F6] dark:text-[#FCD535]">
                      {st.tracking_number}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-[#F0F3F6]">
                      {st.student_name}
                      <span className="block text-[10px] text-slate-400 dark:text-[#707A8A] font-mono font-normal">
                        {language === 'rw' ? 'Aho yize:' : 'Prev:'} {st.previous_school}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-[#A0AAB8]">
                      {st.gender === 'Male' && language === 'rw' ? 'Gabo' : st.gender === 'Female' && language === 'rw' ? 'Gore' : st.gender}
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-[#A0AAB8]">
                      <span className="font-bold text-slate-900 dark:text-[#F0F3F6] font-mono">{st.academic_level}</span> · {st.department === 'Software Development' ? (language === 'rw' ? 'Software' : 'Software') : (language === 'rw' ? 'Auto' : 'Auto')}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold tabular-nums text-[#0ECB81]">
                      {st.s3_marks}%
                    </td>
                    <td className="py-3 px-4 text-center">
                      {st.qualifies_boarding === 1 ? (
                        <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-[#0ECB81]/15 text-[#0ECB81] border border-[#0ECB81]/30">
                          {language === 'rw' ? 'Acumbika' : 'Boarding'}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 dark:text-[#707A8A] font-mono">
                          {language === 'rw' ? 'Umutaha' : 'Day Scholar'}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-[#A0AAB8]">
                      <span className="font-mono text-slate-900 dark:text-[#F0F3F6]">{st.phone}</span>
                      <span className="block text-[10px] text-slate-400 dark:text-[#707A8A]">{st.residence}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
