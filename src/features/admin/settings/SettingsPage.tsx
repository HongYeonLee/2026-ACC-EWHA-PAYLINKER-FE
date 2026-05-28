import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '../common/PageHeader';
import { ApiBadge, Badge, Button, Card, CardBody, CardHeader, Field, Icon, Input, toast } from '../../../shared/ui';
import { useAuthStore } from '../../../shared/stores/auth.store';
import { authApi } from '../../auth/api';

export function SettingsPage() {
  const profile = useAuthStore((s) => s.adminProfile);
  const setAdminProfile = useAuthStore((s) => s.setAdminProfile);
  const [name, setName] = useState(profile?.name ?? '');

  const meQuery = useQuery({
    queryKey: ['users', 'me'],
    queryFn: authApi.me,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (meQuery.data) {
      setAdminProfile({
        adminId: meQuery.data.adminId,
        email: meQuery.data.email,
        name: meQuery.data.name,
        role: meQuery.data.role,
        createdAt: meQuery.data.createdAt,
      });
      setName(meQuery.data.name);
    }
  }, [meQuery.data, setAdminProfile]);
  const [defaultTtl, setDefaultTtl] = useState(48);
  const [defaultResend, setDefaultResend] = useState(1);

  return (
    <div>
      <PageHeader
        title="설정"
        description="개인 정보와 운영 기본값을 관리합니다."
        breadcrumbs={[{ label: '관리자' }, { label: '설정' }]}
        apiBadges={<ApiBadge method="GET" path="/api/users/me" note="USR-001 내 정보" />}
      />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="내 계정"
            subtitle="USR-001 응답으로 가져온 내 정보입니다."
            apiBadge={<ApiBadge method="GET" path="/api/users/me" note="USR-001" />}
          />
          <CardBody className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="성명">
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field label="이메일">
              <Input value={profile?.email ?? ''} disabled />
            </Field>
            <Field label="권한">
              <Input
                value={
                  profile?.role === 'OWNER'
                    ? '운영 책임자 (OWNER)'
                    : profile?.role === 'ADMIN'
                      ? '운영 매니저 (ADMIN)'
                      : (profile?.role ?? '')
                }
                disabled
              />
            </Field>
            <Field label="가입일">
              <Input value={profile?.createdAt ?? ''} disabled />
            </Field>
          </CardBody>
          <div className="flex justify-end gap-2 border-t border-border px-5 py-3">
            <Button
              variant="secondary"
              onClick={() => {
                setName(profile?.name ?? '');
              }}
            >
              되돌리기
            </Button>
            <Button
              onClick={() => {
                if (!profile) return;
                setAdminProfile({ ...profile, name });
                toast.success('변경 사항이 저장되었습니다.');
              }}
              iconLeft={<Icon.Check size={14} />}
            >
              저장
            </Button>
          </div>
        </Card>

        <Card>
          <CardHeader title="기본 발송 정책" subtitle="새 캠페인 생성 시 기본값으로 사용됩니다." />
          <CardBody className="space-y-3">
            <Field label="링크 유효 시간 (h)">
              <Input
                type="number"
                value={defaultTtl}
                onChange={(e) => setDefaultTtl(Number(e.target.value) || 48)}
              />
            </Field>
            <Field label="재전송 요청 제한 (회)">
              <Input
                type="number"
                value={defaultResend}
                onChange={(e) => setDefaultResend(Number(e.target.value) || 1)}
              />
            </Field>
            <Button size="sm" variant="secondary" disabled>
              저장
            </Button>
          </CardBody>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader
            title="보안 / 데모 토큰"
            subtitle="개발 환경에서 수신자 페이지 분기를 테스트할 수 있는 토큰입니다."
          />
          <CardBody className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { token: 'demo-valid', label: '정상 흐름', tone: 'success' as const },
              { token: 'demo-expired', label: '만료 안내', tone: 'warn' as const },
              { token: 'demo-used', label: '재사용 안내', tone: 'warn' as const },
              { token: 'demo-invalid', label: '잘못된 링크', tone: 'danger' as const },
              { token: 'demo-unauth', label: '권한 오류', tone: 'danger' as const },
            ].map((t) => (
              <div
                key={t.token}
                className="flex items-center justify-between gap-3 rounded-md border border-border bg-white px-4 py-3"
              >
                <div>
                  <Badge tone={t.tone} size="xs">{t.label}</Badge>
                  <div className="mt-1 num text-[12px] text-ink-2">/link/{t.token}</div>
                </div>
                <a
                  href={`/link/${t.token}`}
                  className="text-[12px] font-medium text-mint-700 hover:underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  열기 ↗
                </a>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
