import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { campaignApi } from './api';
import { PageHeader } from '../common/PageHeader';
import {
  ApiBadge,
  ApiBadgeGroup,
  Badge,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Field,
  Icon,
  Input,
  Modal,
  Pill,
  Switch,
  Textarea,
  toast,
} from '../../../shared/ui';
import { FileDrop } from '../../../shared/ui/FileDrop';
import {
  CHECK_ITEM_TYPE_LABEL,
  MATCH_STATUS_LABEL,
  SEND_FAILURE_REASON_LABEL,
  VALIDATION_STATUS_LABEL,
} from '../../../shared/constants/status';
import { CampaignStatusBadge } from '../../../shared/ui/StatusBadge';
import { ApiError } from '../../../shared/api/client';
import { formatNumber } from '../../../shared/lib/format';
import type {
  CampaignCreateRequest,
  CampaignDetailResponse,
  CampaignFinalReviewResponse,
  CampaignUpdateRequest,
  RecipientUploadType,
} from '../../../shared/api/types';

type WizardStep = 'basic' | 'recipients' | 'documents' | 'review' | 'schedule';

const STEPS: Array<{ key: WizardStep; label: string }> = [
  { key: 'basic', label: '캠페인 정보' },
  { key: 'recipients', label: '수신자 업로드' },
  { key: 'documents', label: '명세서 업로드' },
  { key: 'review', label: '최종 확인' },
  { key: 'schedule', label: '발송' },
];

const UPLOAD_TYPES: Array<{ value: RecipientUploadType; label: string }> = [
  { value: 'FULL_REPLACE', label: '전체 교체' },
  { value: 'APPEND', label: '추가' },
];

const DOCUMENT_TYPES = ['PDF', 'HTML', 'JSON'] as const;
const MATCH_KEYS = ['employeeNo', 'email'] as const;

export function CampaignNewPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<WizardStep>('basic');
  const [campaign, setCampaign] = useState<CampaignDetailResponse | null>(null);

  const [form, setForm] = useState<CampaignCreateRequest>({
    campaignName: '',
    emailSubject: '',
    emailDescription: '',
    linkTtlHours: 48,
    allowOneTimeLink: true,
    allowResendRequest: true,
    resendRequestLimit: 1,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [scheduledSendAt, setScheduledSendAt] = useState('');
  const [uploadType, setUploadType] = useState<RecipientUploadType>('FULL_REPLACE');
  const [recipientBatchId, setRecipientBatchId] = useState<string | null>(null);
  const [documentType, setDocumentType] =
    useState<(typeof DOCUMENT_TYPES)[number]>('PDF');
  const [matchKey, setMatchKey] = useState<(typeof MATCH_KEYS)[number]>('employeeNo');

  const existingCampaignId = searchParams.get('campaignId') ?? campaign?.campaignId ?? null;

  const detailQuery = useQuery({
    queryKey: ['campaign', existingCampaignId],
    queryFn: () => campaignApi.detail(existingCampaignId!),
    enabled: !!existingCampaignId,
  });

  const recipientValidationQuery = useQuery({
    queryKey: ['campaign-validation', existingCampaignId, recipientBatchId],
    queryFn: () => campaignApi.validateUpload(existingCampaignId!, recipientBatchId!),
    enabled: !!existingCampaignId && !!recipientBatchId,
    retry: false,
  });
  const matchesQuery = useQuery({
    queryKey: ['campaign-matches', existingCampaignId],
    queryFn: () => campaignApi.documentMatches(existingCampaignId!),
    enabled: !!existingCampaignId && (step === 'documents' || step === 'review'),
    retry: false,
  });
  const finalReviewQuery = useQuery({
    queryKey: ['campaign-final-review', existingCampaignId],
    queryFn: () => campaignApi.finalReview(existingCampaignId!),
    enabled: !!existingCampaignId && step === 'review',
    retry: false,
  });

  const createMutation = useMutation({
    mutationFn: (body: CampaignCreateRequest) => campaignApi.create(body),
    onSuccess: (created) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set('campaignId', created.campaignId);
        return next;
      });
      // detailQuery refetch will fill in the full CampaignDetailResponse
      queryClient.invalidateQueries({ queryKey: ['campaign', created.campaignId] });
      setStep('recipients');
      toast.success('캠페인이 생성되었습니다', '수신자 업로드 단계로 이동합니다.');
    },
    onError: (err: unknown) => {
      const message = err instanceof ApiError ? err.message : '캠페인 생성에 실패했습니다.';
      toast.error('캠페인 생성 실패', message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (body: CampaignUpdateRequest) =>
      campaignApi.update(existingCampaignId!, body),
    onSuccess: (updated) => {
      setCampaign(updated);
      toast.success('캠페인 정보를 저장했습니다.');
    },
  });

  const uploadRecipientsMutation = useMutation({
    mutationFn: ({ file }: { file: File }) =>
      campaignApi.uploadRecipients(existingCampaignId!, file, uploadType),
    onSuccess: (res) => {
      setRecipientBatchId(res.uploadBatchId);
      toast.success(
        '수신자 데이터가 업로드되었습니다.',
        `정상 ${res.validRowCount}건 · 오류 ${res.errorRowCount}건 · 중복 ${res.duplicateRowCount}건`,
      );
      queryClient.invalidateQueries({ queryKey: ['campaign', existingCampaignId] });
    },
    onError: (err: unknown) => {
      const message = err instanceof ApiError ? err.message : '업로드에 실패했습니다.';
      toast.error('업로드 실패', message);
    },
  });
  const uploadDocumentsMutation = useMutation({
    mutationFn: ({ file }: { file: File }) =>
      campaignApi.uploadDocuments(existingCampaignId!, file, documentType, matchKey),
    onSuccess: (res) => {
      toast.success(
        '명세서 데이터가 업로드되었습니다.',
        `매칭 완료 ${res.matchedCount}건 · 미매칭 수신자 ${res.unmatchedRecipientCount}건`,
      );
      queryClient.invalidateQueries({ queryKey: ['campaign-matches', existingCampaignId] });
      queryClient.invalidateQueries({ queryKey: ['campaign-final-review', existingCampaignId] });
    },
    onError: (err: unknown) => {
      const message = err instanceof ApiError ? err.message : '업로드에 실패했습니다.';
      toast.error('업로드 실패', message);
    },
  });

  const sendMutation = useMutation({
    mutationFn: () => campaignApi.send(existingCampaignId!),
    onSuccess: () => {
      toast.success('발송 요청이 접수되었습니다', '발송 진행 상황은 캠페인 상세에서 확인하세요.');
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      navigate(`/admin/campaigns/${existingCampaignId}`);
    },
    onError: (err: unknown) => {
      const message = err instanceof ApiError ? err.message : '발송에 실패했습니다.';
      toast.error('발송 실패', message);
    },
  });
  const scheduleMutation = useMutation({
    mutationFn: (iso: string) => campaignApi.schedule(existingCampaignId!, iso),
    onSuccess: () => {
      toast.success('예약 발송이 등록되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      navigate('/admin/scheduled');
    },
    onError: (err: unknown) => {
      const message = err instanceof ApiError ? err.message : '예약 발송 등록에 실패했습니다.';
      toast.error('예약 실패', message);
    },
  });

  const validateBasic = () => {
    const e: Record<string, string> = {};
    if (!form.campaignName.trim()) e.campaignName = '캠페인명을 입력해 주세요.';
    if (form.campaignName.length > 20) e.campaignName = '캠페인명은 20자 이하여야 합니다.';
    if (!form.emailSubject.trim()) e.emailSubject = '이메일 제목을 입력해 주세요.';
    if (
      form.linkTtlHours !== undefined &&
      (form.linkTtlHours <= 0 || form.linkTtlHours > 720)
    )
      e.linkTtlHours = '링크 유효 시간은 1~720시간 사이여야 합니다.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const stepIndex = STEPS.findIndex((s) => s.key === step);

  const totalRecipients =
    recipientValidationQuery.data?.validRowCount ??
    detailQuery.data?.totalRecipientCount ??
    0;
  const matchedCount = matchesQuery.data?.matchedCount ?? 0;
  const unmatchedCount = matchesQuery.data?.unmatchedRecipientCount ?? 0;

  return (
    <div>
      <PageHeader
        title="새 발송"
        description="캠페인 정보 → 수신자 업로드 → 명세서 업로드 → 최종 확인 → 발송 순서로 진행합니다."
        breadcrumbs={[
          { label: '관리자' },
          { label: '발송 이력', to: '/admin/campaigns' },
          { label: '새 발송' },
        ]}
        apiBadges={
          <ApiBadgeGroup>
            <ApiBadge method="POST" path="/api/campaigns" note="CAM-002 생성" />
            <ApiBadge method="POST" path="/api/campaigns/:id/recipients/upload" note="RCP-001" />
            <ApiBadge method="POST" path="/api/campaigns/:id/documents/upload" note="DOC-001" />
            <ApiBadge method="GET" path="/api/campaigns/:id/final-review" note="발송 전 검토" />
            <ApiBadge method="POST" path="/api/campaigns/:id/send" note="SND-001 (BE 자리표시자)" />
            <ApiBadge method="PATCH" path="/api/campaigns/:id/schedule" note="RSV-001 예약" />
          </ApiBadgeGroup>
        }
      />

      {/* Stepper */}
      <Card className="mb-5">
        <CardBody>
          <ol className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {STEPS.map((s, i) => {
              const isActive = s.key === step;
              const isDone = i < stepIndex;
              return (
                <li key={s.key} className="flex items-center gap-2.5">
                  <span
                    className={`flex size-9 items-center justify-center rounded-full text-[13px] font-bold ${
                      isActive
                        ? 'bg-mint-500 text-navy-900'
                        : isDone
                          ? 'bg-mint-100 text-mint-700'
                          : 'bg-surface-sunken text-ink-4'
                    }`}
                  >
                    {isDone ? <Icon.Check size={14} /> : i + 1}
                  </span>
                  <span
                    className={`text-[12.5px] font-medium ${isActive ? 'text-ink-1' : 'text-ink-4'}`}
                  >
                    {s.label}
                  </span>
                </li>
              );
            })}
          </ol>
        </CardBody>
      </Card>

      {step === 'basic' ? (
        <Card>
          <CardHeader title="캠페인 기본 정보" subtitle="발송에 필요한 기본 정보를 입력합니다." />
          <CardBody className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="캠페인명" required error={errors.campaignName} hint="최대 20자">
              <Input
                value={form.campaignName}
                onChange={(e) => setForm((f) => ({ ...f, campaignName: e.target.value }))}
                placeholder="2026년 5월 급여명세서"
              />
            </Field>
            <Field label="링크 유효 시간 (h)" required error={errors.linkTtlHours}>
              <Input
                type="number"
                value={form.linkTtlHours ?? 48}
                onChange={(e) =>
                  setForm((f) => ({ ...f, linkTtlHours: Number(e.target.value) || 48 }))
                }
              />
            </Field>
            <Field label="이메일 제목" required error={errors.emailSubject} className="md:col-span-2">
              <Input
                value={form.emailSubject}
                onChange={(e) => setForm((f) => ({ ...f, emailSubject: e.target.value }))}
                placeholder="[Paylinker] 2026년 5월 급여명세서가 발행되었습니다"
              />
            </Field>
            <Field label="발송 설명" className="md:col-span-2">
              <Textarea
                rows={4}
                value={form.emailDescription ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, emailDescription: e.target.value }))}
                placeholder="이메일 본문에 포함될 안내 문구를 입력합니다."
              />
            </Field>

            <ToggleField
              label="일회용 링크 적용"
              hint="확인 후 동일 링크로 다시 열람할 수 없습니다."
              checked={!!form.allowOneTimeLink}
              onChange={(v) => setForm((f) => ({ ...f, allowOneTimeLink: v }))}
            />
            <ToggleField
              label="수신자 재전송 요청 허용"
              hint="수신자가 운영자에게 새 링크를 요청할 수 있습니다."
              checked={!!form.allowResendRequest}
              onChange={(v) => setForm((f) => ({ ...f, allowResendRequest: v }))}
            />
            <Field label="재전송 요청 제한 (회)">
              <Input
                type="number"
                value={form.resendRequestLimit ?? 1}
                onChange={(e) =>
                  setForm((f) => ({ ...f, resendRequestLimit: Number(e.target.value) || 1 }))
                }
              />
            </Field>
          </CardBody>
          <CardFooter>
            <Button variant="ghost" onClick={() => navigate('/admin/campaigns')}>
              취소
            </Button>
            <Button
              onClick={() => {
                if (!validateBasic()) return;
                if (existingCampaignId) {
                  const updateBody: CampaignUpdateRequest = {
                    campaignName: form.campaignName,
                    emailSubject: form.emailSubject,
                    emailDescription: form.emailDescription,
                    linkTtlHours: form.linkTtlHours,
                    allowOneTimeLink: form.allowOneTimeLink,
                    allowResendRequest: form.allowResendRequest,
                    resendRequestLimit: form.resendRequestLimit,
                  };
                  updateMutation.mutate(updateBody, {
                    onSuccess: () => setStep('recipients'),
                  });
                } else {
                  createMutation.mutate(form);
                }
              }}
              loading={createMutation.isPending || updateMutation.isPending}
              iconRight={<Icon.ChevronRight size={14} />}
            >
              다음
            </Button>
          </CardFooter>
        </Card>
      ) : null}

      {step === 'recipients' && existingCampaignId ? (
        <Card>
          <CardHeader
            title="수신자 데이터 업로드"
            subtitle="CSV 또는 엑셀 파일을 업로드해 발송 대상자를 등록합니다."
            apiBadge={<ApiBadge method="POST" path="/api/campaigns/:id/recipients/upload" note="RCP-001 / RCP-002" />}
          />
          <CardBody className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-[12px] font-medium text-ink-3">업로드 방식</span>
              <Pill items={UPLOAD_TYPES} value={uploadType} onChange={setUploadType} />
            </div>
            <FileDrop
              accept=".csv,.xlsx,.xls"
              hint="CSV / XLSX / XLS · 사번, 성명, 부서, 이메일 컬럼 포함"
              onFile={(file) => uploadRecipientsMutation.mutate({ file })}
            />
            {recipientValidationQuery.data ? (
              <div className="rounded-lg border border-border bg-surface-sunken p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-[12.5px] font-medium text-ink-1">
                      uploadBatchId: <span className="num text-ink-3">{recipientValidationQuery.data.uploadBatchId}</span>
                    </div>
                    <div className="mt-0.5 text-[11px] text-ink-4">
                      행 {recipientValidationQuery.data.totalRowCount}건 처리
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <Statistic
                      label="정상"
                      value={recipientValidationQuery.data.validRowCount}
                      tone="success"
                    />
                    <Statistic
                      label="중복"
                      value={recipientValidationQuery.data.duplicateRowCount}
                      tone="warn"
                    />
                    <Statistic
                      label="오류"
                      value={recipientValidationQuery.data.errorRowCount}
                      tone="danger"
                    />
                  </div>
                </div>
                {recipientValidationQuery.data.errors.length > 0 ? (
                  <ul className="mt-3 space-y-1.5">
                    {recipientValidationQuery.data.errors.map((err, idx) => (
                      <li
                        key={idx}
                        className="rounded-md border border-danger-100 bg-danger-50 px-3.5 py-2.5 text-[12px] text-danger-600"
                      >
                        <strong className="num mr-1">행 {err.rowNumber}</strong>
                        <span className="font-medium">{err.column}</span> · {err.message}
                      </li>
                    ))}
                  </ul>
                ) : null}
                <div className="mt-3 text-[11.5px] text-ink-4">
                  검증 통과한 수신자만 발송 단계로 진행됩니다. 오류는 원본 데이터에서 수정 후 다시
                  업로드해 주세요.
                </div>
              </div>
            ) : null}
          </CardBody>
          <CardFooter>
            <Button variant="ghost" onClick={() => setStep('basic')}>
              이전
            </Button>
            <Button
              onClick={() => setStep('documents')}
              disabled={
                !recipientValidationQuery.data || !recipientValidationQuery.data.canProceed
              }
              iconRight={<Icon.ChevronRight size={14} />}
            >
              다음
            </Button>
          </CardFooter>
        </Card>
      ) : null}

      {step === 'documents' && existingCampaignId ? (
        <Card>
          <CardHeader
            title="명세서 데이터 업로드"
            subtitle="개별 PDF 또는 ZIP 파일을 업로드해 수신자별 명세서를 자동 매칭합니다."
            apiBadge={<ApiBadge method="POST" path="/api/campaigns/:id/documents/upload" note="DOC-001 / DOC-002" />}
          />
          <CardBody className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="문서 형식">
                <select
                  value={documentType}
                  onChange={(e) =>
                    setDocumentType(e.target.value as (typeof DOCUMENT_TYPES)[number])
                  }
                  className="h-9 w-full rounded-md border border-border-strong bg-white px-3 text-[12.5px]"
                >
                  {DOCUMENT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="매칭 키">
                <select
                  value={matchKey}
                  onChange={(e) => setMatchKey(e.target.value as (typeof MATCH_KEYS)[number])}
                  className="h-9 w-full rounded-md border border-border-strong bg-white px-3 text-[12.5px]"
                >
                  {MATCH_KEYS.map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <FileDrop
              accept=".zip,.pdf,.html,.json"
              hint="ZIP / PDF / HTML / JSON · 파일명 또는 메타 데이터로 수신자와 자동 매칭"
              onFile={(file) => uploadDocumentsMutation.mutate({ file })}
            />
            {matchesQuery.data ? (
              <div className="rounded-lg border border-border bg-surface-sunken p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-[12.5px] font-medium text-ink-1">매칭 결과</div>
                    <div className="mt-0.5 text-[11px] text-ink-4">
                      전체 {matchesQuery.data.totalRecipientCount}건 중 매칭 완료{' '}
                      {matchesQuery.data.matchedCount}건 · 미매칭 {matchesQuery.data.unmatchedRecipientCount}건
                    </div>
                  </div>
                </div>
                <ul className="mt-3 max-h-72 space-y-1.5 overflow-y-auto pr-1">
                  {matchesQuery.data.items.slice(0, 30).map((m) => (
                    <li
                      key={m.campaignRecipientId}
                      className="flex items-center justify-between rounded-md border border-border bg-white px-3.5 py-2.5 text-[12px]"
                    >
                      <div>
                        <div className="font-medium text-ink-1">{m.recipientName}</div>
                        <div className="text-[11px] text-ink-4">
                          <span className="num">{m.matchKey}</span>
                        </div>
                      </div>
                      <Badge
                        tone={
                          m.matchStatus === 'MATCHED'
                            ? 'success'
                            : m.matchStatus === 'DUPLICATE_MATCH'
                              ? 'warn'
                              : 'danger'
                        }
                        size="xs"
                      >
                        {MATCH_STATUS_LABEL[m.matchStatus] ?? m.matchStatus}
                      </Badge>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </CardBody>
          <CardFooter>
            <Button variant="ghost" onClick={() => setStep('recipients')}>
              이전
            </Button>
            <Button
              onClick={() => setStep('review')}
              disabled={!matchesQuery.data || !matchesQuery.data.canProceed}
              iconRight={<Icon.ChevronRight size={14} />}
            >
              다음
            </Button>
          </CardFooter>
        </Card>
      ) : null}

      {step === 'review' && existingCampaignId ? (
        <ReviewStep
          campaign={detailQuery.data}
          review={finalReviewQuery.data}
          totalRecipients={totalRecipients}
          matched={matchedCount}
          unmatched={unmatchedCount}
          onPrev={() => setStep('documents')}
          onSchedule={() => setStep('schedule')}
          onSend={() => sendMutation.mutate()}
          sending={sendMutation.isPending}
        />
      ) : null}

      {step === 'schedule' && existingCampaignId ? (
        <Card>
          <CardHeader
            title="예약 발송 설정"
            subtitle="지정 시각에 자동으로 발송됩니다. (Asia/Seoul 기준)"
            apiBadge={<ApiBadge method="PATCH" path="/api/campaigns/:id/schedule" note="RSV-001" />}
          />
          <CardBody className="space-y-3">
            <Field
              label="예약 시각"
              hint="현재로부터 최소 5분 후 시점만 지정 가능합니다."
              required
            >
              <Input
                type="datetime-local"
                value={scheduledSendAt}
                onChange={(e) => setScheduledSendAt(e.target.value)}
              />
            </Field>
            <div className="rounded-md border border-dashed border-border-strong bg-surface-sunken px-4 py-3 text-[11.5px] leading-relaxed text-ink-3">
              <div className="font-medium text-ink-2">예약 시 유의 사항</div>
              <ul className="mt-1 space-y-0.5">
                <li>• 예약 발송은 운영자 콘솔의 1분 단위 스케줄러가 트리거합니다.</li>
                <li>• 예약 상태에서는 수신자/명세서 데이터 추가 변경이 가능합니다.</li>
                <li>• 예약 취소 시 일반 캠페인 상태로 되돌아갑니다.</li>
              </ul>
            </div>
          </CardBody>
          <CardFooter>
            <Button variant="ghost" onClick={() => setStep('review')}>
              이전
            </Button>
            <Button
              onClick={() => {
                if (!scheduledSendAt) {
                  toast.warn('예약 시각', '예약 시각을 입력해 주세요.');
                  return;
                }
                scheduleMutation.mutate(new Date(scheduledSendAt).toISOString());
              }}
              loading={scheduleMutation.isPending}
              iconLeft={<Icon.Calendar size={14} />}
            >
              예약 등록
            </Button>
          </CardFooter>
        </Card>
      ) : null}

      <SideHelp />
    </div>
  );
}

function ToggleField({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-md border border-border bg-surface-sunken px-4 py-4">
      <div className="min-w-0 flex-1">
        <div className="text-[12.5px] font-medium text-ink-2">{label}</div>
        {hint ? <div className="mt-1 text-[11.5px] text-ink-4">{hint}</div> : null}
      </div>
      <Switch checked={checked} onChange={onChange} aria-label={label} />
    </div>
  );
}

function Statistic({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'success' | 'warn' | 'danger';
}) {
  const toneClass =
    tone === 'success' ? 'text-mint-700' : tone === 'warn' ? 'text-warn-600' : 'text-danger-600';
  return (
    <div className="text-right">
      <div className={`num text-[18px] font-medium ${toneClass}`}>{formatNumber(value)}</div>
      <div className="text-[11px] text-ink-4">{label}</div>
    </div>
  );
}

function ReviewStep({
  campaign,
  review,
  totalRecipients,
  matched,
  unmatched,
  onPrev,
  onSchedule,
  onSend,
  sending,
}: {
  campaign: CampaignDetailResponse | undefined;
  review: CampaignFinalReviewResponse | undefined;
  totalRecipients: number;
  matched: number;
  unmatched: number;
  onPrev: () => void;
  onSchedule: () => void;
  onSend: () => void;
  sending: boolean;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  if (!campaign) return null;

  const canSend = review?.canSend ?? false;
  const blockingIssues = review?.blockingIssues ?? [];

  return (
    <Card>
      <CardHeader
        title="발송 전 최종 확인"
        subtitle="발송 요청 후에는 캠페인 정보를 수정할 수 없습니다."
        apiBadge={<ApiBadge method="GET" path="/api/campaigns/:id/final-review" />}
        actions={<CampaignStatusBadge status={campaign.status} />}
      />
      <CardBody className="space-y-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <ReviewRow label="캠페인명" value={campaign.campaignName} />
          <ReviewRow label="이메일 제목" value={campaign.emailSubject} />
          <ReviewRow
            label="링크 유효 시간"
            value={`${campaign.linkTtlHours}시간`}
          />
          <ReviewRow
            label="옵션"
            value={
              <div className="flex flex-wrap gap-1.5">
                {campaign.allowOneTimeLink ? (
                  <Badge tone="brand" size="xs">일회용 링크</Badge>
                ) : null}
                {campaign.allowResendRequest ? (
                  <Badge tone="neutral" size="xs">
                    재전송 요청 {campaign.resendRequestLimit}회
                  </Badge>
                ) : null}
              </div>
            }
          />
          <ReviewRow
            label="이메일 본문"
            value={campaign.emailDescription || '-'}
            full
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <SummaryCard label="전체 수신자" value={totalRecipients} tone="neutral" />
          <SummaryCard label="매칭 완료" value={matched} tone="success" />
          <SummaryCard
            label="매칭 오류"
            value={unmatched}
            tone={unmatched > 0 ? 'danger' : 'neutral'}
          />
        </div>

        {blockingIssues.length > 0 ? (
          <div className="rounded-lg border border-danger-100 bg-danger-50 px-4 py-3 text-[12px] text-danger-600">
            <div className="font-medium">
              <Icon.Alert size={13} className="-mt-0.5 mr-1.5 inline" />
              발송할 수 없습니다.
            </div>
            <ul className="mt-1.5 space-y-0.5 pl-4 list-disc">
              {blockingIssues.map((issue, idx) => (
                <li key={idx}>{issue}</li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="rounded-lg border border-mint-100 bg-mint-50 px-4 py-3 text-[12px] text-mint-700">
            <Icon.Check size={13} className="-mt-0.5 mr-1.5 inline" />
            모든 항목이 매칭되었습니다. 발송을 진행할 수 있습니다.
          </div>
        )}
      </CardBody>
      <CardFooter>
        <Button variant="ghost" onClick={onPrev}>
          이전
        </Button>
        <Button variant="secondary" onClick={onSchedule} iconLeft={<Icon.Calendar size={14} />}>
          예약 발송 설정
        </Button>
        <Button
          onClick={() => setConfirmOpen(true)}
          disabled={!canSend}
          loading={sending}
          iconLeft={<Icon.Send size={14} />}
        >
          지금 발송
        </Button>
      </CardFooter>
      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="발송 요청을 진행할까요?"
        description={`총 ${totalRecipients}명의 수신자에게 발송됩니다. 발송 후에는 캠페인 취소가 불가합니다.`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmOpen(false)}>
              취소
            </Button>
            <Button
              onClick={() => {
                setConfirmOpen(false);
                onSend();
              }}
              loading={sending}
            >
              발송 시작
            </Button>
          </>
        }
      >
        <div className="rounded-md border border-border bg-surface-sunken px-4 py-3 text-[12.5px] text-ink-3">
          <ul className="space-y-1">
            <li>• 발송은 비동기로 처리되며 진행률은 캠페인 상세에서 확인할 수 있습니다.</li>
            <li>• 영구 실패 사유(이메일 형식 오류, 차단, 스팸 신고)는 자동 재발송에서 제외됩니다.</li>
          </ul>
        </div>
      </Modal>
    </Card>
  );
}

function ReviewRow({
  label,
  value,
  full,
}: {
  label: string;
  value: React.ReactNode;
  full?: boolean;
}) {
  return (
    <div
      className={`rounded-md border border-border bg-white px-4 py-3 ${full ? 'md:col-span-2' : ''}`}
    >
      <div className="text-[10.5px] font-medium uppercase tracking-[0.1em] text-ink-4">
        {label}
      </div>
      <div className="mt-1 text-[12.5px] text-ink-1">{value}</div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'success' | 'warn' | 'danger' | 'neutral';
}) {
  const toneClass =
    tone === 'success'
      ? 'text-mint-700'
      : tone === 'warn'
        ? 'text-warn-600'
        : tone === 'danger'
          ? 'text-danger-600'
          : 'text-ink-2';
  return (
    <div className="rounded-md border border-border bg-white px-4 py-3 text-center">
      <div className={`num text-[24px] font-medium ${toneClass}`}>{formatNumber(value)}</div>
      <div className="mt-0.5 text-[11px] text-ink-4">{label}</div>
    </div>
  );
}

function SideHelp() {
  return (
    <div className="mt-5 rounded-lg border border-dashed border-border-strong bg-white px-4 py-3 text-[11.5px] leading-relaxed text-ink-3">
      <div className="font-medium text-ink-2">발송 전 체크리스트</div>
      <ul className="mt-1 space-y-0.5">
        <li>• 수신자/명세서 데이터는 한 캠페인 내에서만 사용되며 발송 후 보존됩니다.</li>
        <li>• 매칭 오류({Object.values(MATCH_STATUS_LABEL).filter((l) => l !== '매칭 완료').join(', ')})는 즉시 안내됩니다.</li>
        <li>• 영구 실패(예: {SEND_FAILURE_REASON_LABEL.INVALID_EMAIL})는 SES suppression list에 따라 자동 제외됩니다.</li>
        <li>• 발송 완료 후 미확인 수신자는 {CHECK_ITEM_TYPE_LABEL.UNVIEWED_RECIPIENT}에서 별도 관리됩니다.</li>
        <li>• 발송 가능한 상태({VALIDATION_STATUS_LABEL.VALID})가 아닌 행은 자동으로 제외됩니다.</li>
      </ul>
    </div>
  );
}
