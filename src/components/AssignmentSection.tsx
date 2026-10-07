'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Assignment } from '@/types';
import {
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Calendar,
  AlertCircle,
  Clock,
  BookMarked,
  X,
  Edit2,
  Filter
} from 'lucide-react';

interface AssignmentSectionProps {
  userId: string;
}

export default function AssignmentSection({ userId }: AssignmentSectionProps) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // 폼 입력 상태
  const [title, setTitle] = useState<string>('');
  const [subject, setSubject] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const supabase = createClient();

  // 과제 목록 불러오기
  const fetchAssignments = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('assignments')
        .select('*')
        .eq('user_id', userId)
        .order('due_date', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      const formatted: Assignment[] = ((data || []) as any[]).map((item) => ({
        ...item,
        is_completed: item.status === 'completed',
      }));
      setAssignments(formatted);
    } catch (err: any) {
      console.error('Failed to load assignments:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase, userId]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  // 완료 상태 토글
  const handleToggleComplete = async (assignment: Assignment) => {
    const nextCompleted = !assignment.is_completed;
    const nextStatus = nextCompleted ? 'completed' : 'pending';
    // 낙관적 UI 업데이트
    setAssignments((prev) =>
      prev.map((item) =>
        item.id === assignment.id
          ? { ...item, is_completed: nextCompleted, status: nextStatus }
          : item
      )
    );

    try {
      const { error } = await supabase
        .from('assignments')
        .update({ status: nextStatus, updated_at: new Date().toISOString() })
        .eq('id', assignment.id);

      if (error) {
        // 롤백
        fetchAssignments();
      }
    } catch (err) {
      console.error('Error toggling assignment:', err);
      fetchAssignments();
    }
  };

  // 과제 삭제
  const handleDelete = async (id: string) => {
    if (!confirm('이 과제를 삭제하시겠습니까?')) return;

    setAssignments((prev) => prev.filter((item) => item.id !== id));

    try {
      const { error } = await supabase.from('assignments').delete().eq('id', id);
      if (error) fetchAssignments();
    } catch (err) {
      console.error('Error deleting assignment:', err);
      fetchAssignments();
    }
  };

  // 모달 열기 (신규 / 수정)
  const openModal = (item?: Assignment) => {
    setErrorMsg('');
    if (item) {
      setEditingId(item.id);
      setTitle(item.title);
      setSubject(item.subject || '');
      setDueDate(item.due_date || '');
      setDescription(item.description || '');
    } else {
      setEditingId(null);
      setTitle('');
      setSubject('');
      setDueDate('');
      setDescription('');
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  // 폼 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('과제 제목을 입력해주세요.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      if (editingId) {
        const { error } = await supabase
          .from('assignments')
          .update({
            title: title.trim(),
            subject: subject.trim(),
            due_date: dueDate || null,
            description: description.trim(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingId);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('assignments').insert({
          user_id: userId,
          title: title.trim(),
          subject: subject.trim(),
          due_date: dueDate || null,
          description: description.trim(),
          status: 'pending',
        });

        if (error) throw error;
      }

      await fetchAssignments();
      closeModal();
    } catch (err: any) {
      console.error('Error saving assignment:', err);
      setErrorMsg(err.message || '저장 중 문제가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  // 필터링 적용
  const filteredAssignments = assignments.filter((item) => {
    if (filter === 'pending') return !item.is_completed;
    if (filter === 'completed') return item.is_completed;
    return true;
  });

  const pendingCount = assignments.filter((a) => !a.is_completed).length;
  const completedCount = assignments.filter((a) => a.is_completed).length;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm overflow-hidden flex flex-col h-full">
      {/* 상단 헤더 */}
      <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800/60 bg-gradient-to-b from-slate-50/50 to-transparent dark:from-slate-900/50">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400">
              <BookMarked className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                내 과제 및 일정
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                미완료 {pendingCount}개 • 완료 {completedCount}개
              </p>
            </div>
          </div>

          <button
            onClick={() => openModal()}
            className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-md shadow-violet-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>과제 추가</span>
          </button>
        </div>

        {/* 필터 탭 */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                filter === 'all'
                  ? 'bg-white dark:bg-slate-700 text-violet-600 dark:text-violet-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              전체 ({assignments.length})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                filter === 'pending'
                  ? 'bg-white dark:bg-slate-700 text-violet-600 dark:text-violet-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              진행 중 ({pendingCount})
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                filter === 'completed'
                  ? 'bg-white dark:bg-slate-700 text-violet-600 dark:text-violet-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              완료 ({completedCount})
            </button>
          </div>
        </div>
      </div>

      {/* 목록 리스트 */}
      <div className="p-5 sm:p-6 flex-1 overflow-y-auto">
        {loading ? (
          <div className="space-y-3 py-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-20 rounded-2xl bg-slate-100 dark:bg-slate-800/60 animate-pulse"
              />
            ))}
          </div>
        ) : filteredAssignments.length > 0 ? (
          <div className="space-y-3">
            {filteredAssignments.map((item) => (
              <div
                key={item.id}
                className={`group p-4 rounded-2xl border transition-all duration-200 flex items-start gap-3.5 ${
                  item.is_completed
                    ? 'bg-slate-50/50 dark:bg-slate-800/20 border-slate-200/50 dark:border-slate-800/50 opacity-75'
                    : 'bg-white dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700/80 hover:shadow-md hover:border-violet-200 dark:hover:border-violet-800/60'
                }`}
              >
                {/* 완료 체크 버튼 */}
                <button
                  onClick={() => handleToggleComplete(item)}
                  className="mt-0.5 text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
                >
                  {item.is_completed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-50 dark:fill-emerald-950" />
                  ) : (
                    <Circle className="w-5 h-5" />
                  )}
                </button>

                {/* 과제 내용 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {item.subject && (
                      <span className="px-2 py-0.5 rounded-md bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 font-bold text-[10px] border border-violet-200/50 dark:border-violet-800/50">
                        {item.subject}
                      </span>
                    )}
                    <h4
                      className={`text-sm font-bold text-slate-800 dark:text-slate-100 truncate ${
                        item.is_completed ? 'line-through text-slate-400 dark:text-slate-500' : ''
                      }`}
                    >
                      {item.title}
                    </h4>
                  </div>

                  {item.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                      {item.description}
                    </p>
                  )}

                  {item.due_date && (
                    <div className="flex items-center gap-1 mt-2 text-[11px] font-medium text-slate-400 dark:text-slate-500">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>마감일: {item.due_date}</span>
                    </div>
                  )}
                </div>

                {/* 액션 버튼 */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openModal(item)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors"
                    title="수정"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg transition-colors"
                    title="삭제"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center">
            <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800/80 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300">
              과제가 없습니다
            </h3>
            <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">
              {filter === 'completed'
                ? '완료된 과제가 아직 없습니다.'
                : '새로운 과제를 추가하고 마감일을 관리해보세요!'}
            </p>
          </div>
        )}
      </div>

      {/* 등록 / 수정 모달 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                {editingId ? '과제 수정하기' : '새 과제 등록'}
              </h3>
              <button
                onClick={closeModal}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {errorMsg && (
                <div className="flex items-center gap-2 p-3 text-xs text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 rounded-xl border border-rose-200 dark:border-rose-800">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* 과제 제목 */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  과제 제목 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="예: 프로그래밍 실습 과제 제출"
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  required
                />
              </div>

              {/* 과목 & 마감일 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    과목
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="예: 컴퓨터 구조"
                    className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    마감일
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              </div>

              {/* 상세 설명 */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  상세 설명 및 메모
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="과제에 대한 세부 사항이나 준비물을 적어두세요."
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                />
              </div>

              {/* 버튼 영역 */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-md shadow-violet-500/20 transition-all disabled:opacity-50"
                >
                  {submitting ? '저장 중...' : editingId ? '수정 완료' : '추가하기'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
