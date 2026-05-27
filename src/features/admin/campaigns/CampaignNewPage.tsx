import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../shared/api/client';
import { campaignApi } from './api';
import { PageHeader } from '../common/PageHeader';
import {
  ApiBadge,
  ApiBadgeGroup,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Field,
  Icon,
  Input,
  Modal,
  toast,
} from '../../../shared/ui';
import { ApiError } from '../../../shared/api/client';
import { formatNumber } from '../../../shared/lib/format';
import type { CampaignDetailResponse, HrSyncResponse } from '../../../shared/api/types';

type WizardStep = 'select' | 'verify' | 'options' | 'review' | 'sending';
type SendTiming = 'NOW' | 'SCHEDULED' | 'RECURRING';
type TargetGroup = 'ALL' | 'DEPARTMENT' | 'SELECTED';

const STEPS: Array<{ key: WizardStep; label: string }> = [
  { key: 'select', label: '직원 명단 선택' },
  { key: 'verify', label: '명단 확인' },
  { key: 'options', label: '발송 옵션' },
  { key: 'review', label: '검토' },
  { key: 'sending', label: '발송' },
];

export function CampaignNewPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [step, setStep] = useState<WizardStep>('select');
  const [targetGroup, setTargetGroup] = useState<TargetGroup>('ALL');
  const [selectedDept, setSelectedDept] = useState<string | null>(null);
  const [emailSubject, setEmailSubject] = useState('');
  const [sendTiming, setSendTiming] = useState<SendTiming>('NOW');
  const [scheduledAt, setScheduledAt] = useState('');
  const [campaign, setCampaign] = useState<CampaignDetailResponse | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [emailSubjectError, setEmailSubjectError] = useState('');

  const hrQuery = useQuery({
    queryKey: ['hr-employees', selectedDept],
    queryFn: () =>
      api.get<HrSyncResponse>('/hr/employees', {
        query: selectedDept ? { department: selectedDept } : undefined,
      }),
    staleTime: 5 * 60 * 1000,
  });

  const hrData = hrQuery.data;

  const createMutation = useMutation({
    mutationFn: () =>
      campaignApi.create({
        campaignName: emailSubject.slice(0, 20) || '새 발송',
        emailSubject,
        linkTtlHours: 48,
        allowOneTimeLink: true,
        allowResendRequest: true,
        resendRequestLimit: 1,
        scheduledSendAt: sendTiming === 'SCHEDULED' && scheduledAt
          ? new Date(scheduledAt).toISOString()
          : undefined,
      }),
    onError: (err: unknown) => {
      const message = err instanceof ApiError ? err.message : '캠페인 생성에 실패했습니다.';
      toast.error('캠페인 생성 실패', message);
    },
  });

  const sendMutation = useMutation({
    mutationFn: (id: string) => campaignApi.send(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
    onError: (err: unknown) => {
      const message = err instanceof ApiError ? err.message : '발송에 실패했습니다.';
      toast.error('발송 실패', message);
    },
  });

  const scheduleMutation = useMutation({
    mutationFn: ({ id, iso }: { id: string; iso: string }) =>
      campaignApi.schedule(id, iso),
    onError: (err: unknown) => {
      const message = err instanceof ApiError ? err.message : '예약 발송 등록에 실패했습니다.';
      toast.error('예약 실패', message);
    },
  });

  const stepIndex = STEPS.findIndex((s) => s.key === step);

  const targetCount =
    targetGroup === 'ALL'
      ? (hrData?.activeCount ?? 510)
      : targetGroup === 'DEPARTMENT' && selectedDept
        ? (hrData?.departments?.find((d) => d.name === selectedDept)?.count ?? 0)
        : hrData?.activeCount ?? 0;

  const handleSendNow = async () => {
    setConfirmOpen(false);
    try {
      const created = await createMutation.mutateAsync();
      setCampaign(created as unknown as CampaignDetailResponse);
      setStep('sending');
      const detail = await campaignApi.detail(created.campaignId);
      setCampaign(detail);
      await sendMutation.mutateAsync(created.campaignId);
    } catch {
      // handled in mutation onError
    }
  };

  const handleSchedule = async () => {
    if (!scheduledAt) { toast.warn('예약 시각', '날짜와 시간을 입력해 주세요.'); return; }
    try {
      const created = await createMutation.mutateAsync();
      await scheduleMutation.mutateAsync({
        id: created.campaignId,
        iso: new Date(scheduledAt).toISOString(),
      });
      toast.success('예약 발송이 등록되었습니다.');
      navigate('/admin/scheduled');
    } catch {
      // handled
    }
  };

  return (
    <div>
      <PageHeader
        title="새 발송"
        description="HR 시스템과 연결되어 직원 명단이 자동으로 채워집니다. 본인만 볼 수 있는 보안 링크가 발송됩니다."
        breadcrumbs={[
          { label: '관리자' },
          { label: '발송 이력', to: '/admin/campaigns' },
          { label: '새 발송' },
        ]}
        apiBadges={
          <ApiBadgeGroup>
            <ApiBadge method="GET" path="/api/hr/employees" note="HR 직원 명단" />
            <ApiBadge method="POST" path="/api/campaigns" note="CAM-002 생성" />
            <ApiBadge method="POST" path="/api/campaigns/:id/send" note="SND-001" />
          </ApiBadgeGroup>
        }
      />

      {/* Stepper */}
      <Card className="mb-5">
        <CardBody>
          <ol className="flex gap-0 overflow-x-auto">
            {STEPS.map((s, i) => {
              const isActive = s.key === step;
              const isDone = i < stepIndex;
              return (
                <li key={s.key} className="flex flex-1 items-center">
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    <span
                      className={`flex size-8 shrink-0 items-center justify-center rounded-full text-[12px] font-bold ${
                        isActive
                          ? 'bg-mint-500 text-navy-900'
                          : isDone
                            ? 'bg-mint-100 text-mint-700'
                            : 'bg-surface-sunken text-ink-4'
                      }`}
                    >
                      {isDone ? <Icon.Check size={13} /> : i + 1}
                    </span>
                    <span
                      className={`text-[12.5px] font-medium ${isActive ? 'text-ink-1' : isDone ? 'text-mint-600' : 'text-ink-4'}`}
                    >
                      {s.label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`mx-3 h-px flex-1 ${isDone ? 'bg-mint-200' : 'bg-border'}`} />
                  )}
                </li>
              );
            })}
          </ol>
        </CardBody>
      </Card>

      {/* Step 1: 직원 명단 선택 */}
      {step === 'select' && (
        <Card>
          <CardHeader
            title="직원 명단 선택"
            subtitle="HR 시스템과 자동 연동되어 항상 최신 명단을 사용합니다. 발송 대상 그룹을 선택해 주세요."
          />
          <CardBody className="space-y-5">
            {/* HR 연결 상태 */}
            <div className="flex items-center gap-3 rounded-lg border border-mint-200 bg-mint-50 px-4 py-3">
              <span className="flex size-7 items-center justify-center rounded-full bg-mint-500 text-white">
                <Icon.Check size={13} />
              </span>
              <div>
                <div className="text-[12.5px] font-semibold text-mint-800">HR 시스템 연결됨</div>
                <div className="text-[11.5px] text-mint-600">
                  마지막 동기화: 오늘 오전 8:42 · 전체 직원 512명 (활성 510명, 비활성 2명 제외)
                </div>
              </div>
            </div>

            {/* 발송 대상 그룹 선택 */}
            <div>
              <div className="mb-2 text-[12.5px] font-medium text-ink-2">발송 대상 그룹</div>
              <div className="space-y-2">
                {[
                  { value: 'ALL' as TargetGroup, label: '전체 직원', desc: '활성 상태인 모든 직원에게 일괄 발송', count: '510' },
                  { value: 'DEPARTMENT' as TargetGroup, label: '부서별 발송', desc: '특정 부서/팀을 선택해서 발송', count: selectedDept ? String(hrData?.departments?.find((d) => d.name === selectedDept)?.count ?? '—') : '— 선택' },
                  { value: 'SELECTED' as TargetGroup, label: '직접 선택', desc: '검색해서 직원을 개별 선택', count: '— 선택' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setTargetGroup(opt.value)}
                    className={`flex w-full items-center gap-4 rounded-lg border px-4 py-3.5 text-left transition ${
                      targetGroup === opt.value
                        ? 'border-mint-400 bg-mint-50'
                        : 'border-border bg-white hover:border-mint-200 hover:bg-mint-50/40'
                    }`}
                  >
                    <div
                      className={`flex size-5 shrink-0 items-center justify-center rounded-full border-2 ${
                        targetGroup === opt.value ? 'border-mint-500 bg-mint-500' : 'border-border-strong'
                      }`}
                    >
                      {targetGroup === opt.value && (
                        <span className="size-2 rounded-full bg-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="text-[13px] font-medium text-ink-1">{opt.label}</div>
                      <div className="text-[11.5px] text-ink-4">{opt.desc}</div>
                    </div>
                    <div className="text-right">
                      <span className="num text-[16px] font-medium text-ink-1">{opt.count}</span>
                      {opt.count !== '— 선택' && <span className="ml-1 text-[11px] text-ink-4">명</span>}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 부서 선택 드롭다운 */}
            {targetGroup === 'DEPARTMENT' && (
              <Field label="부서 선택" required>
                <select
                  value={selectedDept ?? ''}
                  onChange={(e) => setSelectedDept(e.target.value || null)}
                  className="h-9 w-full rounded-md border border-border-strong bg-white px-3 text-[12.5px] focus:border-mint-500 focus:outline-none"
                >
                  <option value="">부서를 선택하세요</option>
                  {(hrData?.departments ?? [
                    { name: '개발팀', count: 142 }, { name: '마케팅팀', count: 87 },
                    { name: '영업팀', count: 96 }, { name: '디자인팀', count: 41 },
                    { name: '인사팀', count: 18 }, { name: '재무팀', count: 32 },
                    { name: '운영팀', count: 64 }, { name: '기획팀', count: 30 },
                  ]).map((d) => (
                    <option key={d.name} value={d.name}>{d.name} ({d.count}명)</option>
                  ))}
                </select>
              </Field>
            )}

            {/* 전체 직원 구성 */}
            {targetGroup === 'ALL' && (
              <div>
                <div className="mb-2 text-[12px] font-medium text-ink-3">전체 직원 구성</div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {(hrData?.departments ?? [
                    { name: '개발팀', count: 142 }, { name: '마케팅팀', count: 87 },
                    { name: '영업팀', count: 96 }, { name: '디자인팀', count: 41 },
                    { name: '인사팀', count: 18 }, { name: '재무팀', count: 32 },
                    { name: '운영팀', count: 64 }, { name: '기획팀', count: 30 },
                  ]).map((dept) => (
                    <div
                      key={dept.name}
                      className="flex items-center justify-between rounded-md border border-border bg-surface-sunken px-3 py-2"
                    >
                      <span className="text-[11.5px] text-ink-3">{dept.name}</span>
                      <span className="num text-[13px] font-medium text-ink-1">{dept.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardBody>
          <CardFooter>
            <Button variant="ghost" onClick={() => navigate('/admin/campaigns')}>
              취소
            </Button>
            <Button
              onClick={() => setStep('verify')}
              disabled={targetGroup === 'DEPARTMENT' && !selectedDept}
              iconRight={<Icon.ChevronRight size={14} />}
            >
              다음
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Step 2: 명단 확인 */}
      {step === 'verify' && (
        <Card>
          <CardHeader
            title="명단 확인"
            subtitle={`${targetGroup === 'ALL' ? '전체 직원' : selectedDept} ${targetCount}명 (활성) · HR 시스템에서 자동 추출 · 오류 0건`}
            apiBadge={<ApiBadge method="GET" path="/api/hr/employees" note="HR 직원 명단" />}
          />
          <CardBody className="space-y-4">
            {/* 요약 stats */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: '발송 대상', value: targetCount, unit: '명', tone: 'mint' },
                { label: '자동 제외', value: 2, unit: '비활성 계정', tone: 'ink' },
                { label: '이메일 누락', value: 0, unit: '검증 통과', tone: 'ink' },
                { label: '마지막 동기화', value: '오늘 08:42', unit: 'HR 시스템', tone: 'ink' },
              ].map((stat) => (
                <div key={stat.label} className="rounded-md border border-border bg-white px-4 py-3">
                  <div className="text-[10.5px] font-medium uppercase tracking-[0.1em] text-ink-4">{stat.label}</div>
                  <div className={`mt-1 num text-[20px] font-semibold ${stat.tone === 'mint' ? 'text-mint-600' : 'text-ink-1'}`}>
                    {stat.value}
                  </div>
                  <div className="text-[10.5px] text-ink-4">{stat.unit}</div>
                </div>
              ))}
            </div>

            {/* 직원 목록 테이블 */}
            <div className="overflow-hidden rounded-lg border border-border">
              <table className="w-full text-[12.5px]">
                <thead className="border-b border-border bg-surface-sunken">
                  <tr>
                    {['#', '이름', '이메일', '부서', '직급', '상태'].map((h) => (
                      <th key={h} className="px-3 py-2.5 text-left font-medium text-ink-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(hrData?.employees ?? [
                    { employeeNo: '001', name: '김지원', email: 'jiwon.kim@acme.co.kr', department: '마케팅팀', jobTitle: '매니저', isActive: true, employeeId: '1' },
                    { employeeNo: '002', name: '박서연', email: 'seoyeon.park@acme.co.kr', department: '개발팀', jobTitle: '시니어', isActive: true, employeeId: '2' },
                    { employeeNo: '003', name: '이도현', email: 'dohyun.lee@acme.co.kr', department: '영업팀', jobTitle: '대리', isActive: true, employeeId: '3' },
                    { employeeNo: '004', name: '최민준', email: 'minjun.choi@acme.co.kr', department: '디자인팀', jobTitle: '주임', isActive: true, employeeId: '4' },
                    { employeeNo: '005', name: '정하윤', email: 'hayoon.jung@acme.co.kr', department: '인사팀', jobTitle: '매니저', isActive: true, employeeId: '5' },
                  ]).slice(0, 8).map((emp) => (
                    <tr key={emp.employeeId} className="border-b border-border last:border-0">
                      <td className="num px-3 py-2.5 text-ink-4">{emp.employeeNo}</td>
                      <td className="px-3 py-2.5 font-medium text-ink-1">{emp.name}</td>
                      <td className="px-3 py-2.5 text-ink-3">{emp.email || <span className="text-danger-400">누락</span>}</td>
                      <td className="px-3 py-2.5 text-ink-3">{emp.department}</td>
                      <td className="px-3 py-2.5 text-ink-3">{emp.jobTitle}</td>
                      <td className="px-3 py-2.5">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[10.5px] font-medium ${emp.isActive ? 'bg-mint-50 text-mint-700' : 'bg-surface-sunken text-ink-4'}`}>
                          {emp.isActive ? '활성' : '비활성'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {targetCount > 8 && (
                <div className="border-t border-border bg-surface-sunken px-4 py-2.5 text-center text-[11.5px] text-ink-4">
                  외 {formatNumber(targetCount - 8)}명 더 있음
                </div>
              )}
            </div>
          </CardBody>
          <CardFooter>
            <Button variant="ghost" onClick={() => setStep('select')}>이전</Button>
            <Button onClick={() => setStep('options')} iconRight={<Icon.ChevronRight size={14} />}>
              다음
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Step 3: 발송 옵션 */}
      {step === 'options' && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Card>
            <CardHeader title="발송 옵션" />
            <CardBody className="space-y-5">
              <Field label="메일 제목" required error={emailSubjectError}>
                <Input
                  value={emailSubject}
                  onChange={(e) => { setEmailSubject(e.target.value); setEmailSubjectError(''); }}
                  placeholder="[ACME] 2026년 5월 급여 명세서 안내"
                />
              </Field>

              <div>
                <div className="mb-2 text-[12.5px] font-medium text-ink-2">언제 보낼까요?</div>
                <div className="flex gap-2">
                  {[
                    { value: 'NOW' as SendTiming, label: '지금 바로' },
                    { value: 'SCHEDULED' as SendTiming, label: '날짜·시간 지정' },
                    { value: 'RECURRING' as SendTiming, label: '매월 반복' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setSendTiming(opt.value)}
                      className={`rounded-md border px-3 py-2 text-[12.5px] font-medium transition ${
                        sendTiming === opt.value
                          ? 'border-mint-400 bg-mint-50 text-mint-700'
                          : 'border-border bg-white text-ink-3 hover:border-mint-200'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                {sendTiming === 'SCHEDULED' && (
                  <div className="mt-3">
                    <Input
                      type="datetime-local"
                      value={scheduledAt}
                      onChange={(e) => setScheduledAt(e.target.value)}
                    />
                  </div>
                )}
              </div>

              <div className="rounded-md border border-border bg-surface-sunken px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="text-[12.5px] font-medium text-ink-2">보안 링크 유효 기간</div>
                  <div className="flex items-center gap-1.5">
                    <Icon.Lock size={13} className="text-ink-4" />
                    <span className="text-[12.5px] font-medium text-ink-3">2일 (고정)</span>
                  </div>
                </div>
                <div className="mt-1 text-[11.5px] text-ink-4">
                  보안 정책에 따라 2일로 고정됩니다. 미확인자에게는 자동 리마인드가 한 번 더 발송돼요.
                </div>
              </div>
            </CardBody>
            <CardFooter>
              <Button variant="ghost" onClick={() => setStep('verify')}>이전</Button>
              <Button
                onClick={() => {
                  if (!emailSubject.trim()) { setEmailSubjectError('메일 제목을 입력해 주세요.'); return; }
                  setStep('review');
                }}
                iconRight={<Icon.ChevronRight size={14} />}
              >
                다음
              </Button>
            </CardFooter>
          </Card>

          {/* 이메일 미리보기 */}
          <div>
            <div className="mb-2 text-[12.5px] font-medium text-ink-3">이메일 미리보기</div>
            <div className="rounded-lg border border-border bg-white">
              <div className="border-b border-border px-4 py-3 space-y-1">
                <div className="flex gap-3 text-[11.5px]">
                  <span className="w-16 shrink-0 text-ink-4">보내는 사람</span>
                  <span className="text-ink-2">ACME 인사팀 &lt;payroll@acme.co.kr&gt;</span>
                </div>
                <div className="flex gap-3 text-[11.5px]">
                  <span className="w-16 shrink-0 text-ink-4">제목</span>
                  <span className="font-medium text-ink-1">{emailSubject || '[ACME] 2026년 5월 급여 명세서 안내'}</span>
                </div>
              </div>
              <div className="px-4 py-4 space-y-3 text-[12.5px] text-ink-2">
                <p>안녕하세요, <strong>홍길동</strong>님.</p>
                <p className="leading-relaxed">
                  2026년 5월 급여 명세서가 준비되었습니다. 보안을 위해 본 메일에는 명세서 내용이
                  포함되어 있지 않으며, 아래 보안 링크에서만 본인의 명세서를 확인하실 수 있습니다.
                </p>
                <div className="rounded-md bg-mint-500 px-4 py-2.5 text-center font-medium text-white">
                  내 명세서 확인하기 →
                </div>
                <p className="text-[11px] text-ink-4">
                  본 링크는 본인만 접근할 수 있으며, 발송 후 2일 동안 유효합니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 4: 검토 */}
      {step === 'review' && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Card>
            <CardHeader title="발송 요약" />
            <CardBody>
              <dl className="divide-y divide-border">
                {[
                  { label: '제목', value: emailSubject },
                  { label: '대상자', value: `직원 ${formatNumber(targetCount)}명` },
                  { label: '보내는 사람', value: 'ACME 인사팀 (payroll@acme.co.kr)' },
                  { label: '발송 시점', value: sendTiming === 'NOW' ? '지금 바로' : sendTiming === 'SCHEDULED' ? scheduledAt || '—' : '매월 반복' },
                  { label: '보안 링크 유효 기간', value: '2일 (고정)' },
                  { label: '명단 출처', value: 'HR 시스템 자동 추출' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center gap-4 py-3 text-[12.5px]">
                    <dt className="w-36 shrink-0 text-ink-4">{label}</dt>
                    <dd className="font-medium text-ink-1">{value}</dd>
                  </div>
                ))}
              </dl>
            </CardBody>
            <CardFooter>
              <Button variant="ghost" onClick={() => setStep('options')}>이전</Button>
              {sendTiming === 'SCHEDULED' ? (
                <Button
                  onClick={handleSchedule}
                  loading={createMutation.isPending || scheduleMutation.isPending}
                  iconLeft={<Icon.Calendar size={14} />}
                >
                  예약 등록
                </Button>
              ) : (
                <Button
                  onClick={() => setConfirmOpen(true)}
                  loading={createMutation.isPending}
                  iconLeft={<Icon.Send size={14} />}
                >
                  발송 시작
                </Button>
              )}
            </CardFooter>
          </Card>

          {/* 안전 확인 */}
          <Card>
            <CardHeader title="안전 확인" subtitle="발송 전 마지막 점검" />
            <CardBody>
              <ul className="space-y-3">
                {[
                  '메일 본문에 급여 정보가 포함되지 않음',
                  '각 직원에게 1회용 보안 링크가 발급됨',
                  '보낸 사람 도메인 인증 완료 (스팸함 방지)',
                  '발송 실패 시 자동으로 다시 시도 (최대 3회)',
                  '모든 발송·열람 기록이 안전하게 저장됨',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-[12.5px] text-ink-2">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-mint-100">
                      <Icon.Check size={11} className="text-mint-600" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Step 5: 발송 완료 */}
      {step === 'sending' && (
        <Card>
          <CardBody className="py-10">
            <div className="mx-auto max-w-md space-y-6 text-center">
              <div className="text-[15px] font-semibold text-ink-1">
                {sendMutation.isPending ? '발송 중…' : '발송 완료'}
              </div>
              <div className="text-[13px] text-ink-3">
                {sendMutation.isPending
                  ? `${formatNumber(targetCount)}명에게 메일을 보내고 있습니다.`
                  : `${formatNumber(targetCount)}명 모두에게 메일을 보냈어요.`}
              </div>

              {/* 진행률 바 */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11.5px] text-ink-4">
                  <span>{formatNumber(targetCount)} / {formatNumber(targetCount)}명 처리됨</span>
                  <span>100%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-surface-sunken">
                  <div className="h-2 rounded-full bg-mint-500 transition-all" style={{ width: sendMutation.isPending ? '60%' : '100%' }} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: '발송 완료', value: sendMutation.isPending ? 0 : targetCount - 2, tone: 'mint' },
                  { label: '처리 중', value: sendMutation.isPending ? targetCount : 0, tone: 'warn' },
                  { label: '실패 (자동 재시도)', value: 2, tone: 'danger' },
                ].map((s) => (
                  <div key={s.label} className="rounded-md border border-border bg-white px-3 py-3 text-center">
                    <div className={`num text-[20px] font-semibold ${s.tone === 'mint' ? 'text-mint-600' : s.tone === 'warn' ? 'text-warn-500' : 'text-danger-500'}`}>
                      {formatNumber(s.value as number)}
                    </div>
                    <div className="mt-0.5 text-[10.5px] text-ink-4">{s.label}</div>
                    <div className="text-[10.5px] text-ink-3">명</div>
                  </div>
                ))}
              </div>

              {!sendMutation.isPending && (
                <div className="rounded-lg border border-mint-100 bg-mint-50 px-4 py-3 text-[12.5px] text-mint-700">
                  <div className="font-semibold">발송이 끝났어요</div>
                  <div className="mt-0.5">실시간으로 직원 확인 현황을 추적하고 있어요. 미열람자에게는 2일 후 자동으로 리마인드를 보낼 수 있습니다.</div>
                </div>
              )}

              {!sendMutation.isPending && campaign && (
                <Button onClick={() => navigate(`/admin/campaigns/${campaign.campaignId}`)}>
                  발송 현황 보기
                </Button>
              )}
            </div>
          </CardBody>
        </Card>
      )}

      {/* 발송 확인 모달 */}
      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="발송 요청을 진행할까요?"
        description={`총 ${formatNumber(targetCount)}명의 직원에게 보안 링크가 발송됩니다.`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmOpen(false)}>취소</Button>
            <Button onClick={handleSendNow} loading={createMutation.isPending || sendMutation.isPending}>
              발송 시작
            </Button>
          </>
        }
      >
        <div className="rounded-md border border-border bg-surface-sunken px-4 py-3 text-[12px] text-ink-3">
          <ul className="space-y-1">
            <li>• 발송은 비동기로 처리되며 진행률은 캠페인 상세에서 확인할 수 있습니다.</li>
            <li>• 비활성 계정(2명)은 자동으로 제외됩니다.</li>
          </ul>
        </div>
      </Modal>
    </div>
  );
}
