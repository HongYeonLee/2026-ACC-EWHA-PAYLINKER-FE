export const CAMPAIGN_STATUS = {
  DRAFT: 'DRAFT',
  READY: 'READY',
  SCHEDULED: 'SCHEDULED',
  SENDING: 'SENDING',
  SENT: 'SENT',
  PARTIAL_FAILED: 'PARTIAL_FAILED',
  CANCELLED: 'CANCELLED',
  FAILED: 'FAILED',
} as const;
export type CampaignStatus = (typeof CAMPAIGN_STATUS)[keyof typeof CAMPAIGN_STATUS];

export const CAMPAIGN_STATUS_LABEL: Record<CampaignStatus, string> = {
  DRAFT: '작성 중',
  READY: '발송 준비',
  SCHEDULED: '예약됨',
  SENDING: '발송 중',
  SENT: '발송 완료',
  PARTIAL_FAILED: '일부 실패',
  CANCELLED: '취소됨',
  FAILED: '실패',
};

export const CAMPAIGN_STATUS_TONE: Record<
  CampaignStatus,
  'success' | 'warn' | 'danger' | 'scheduled' | 'neutral'
> = {
  DRAFT: 'neutral',
  READY: 'neutral',
  SCHEDULED: 'scheduled',
  SENDING: 'warn',
  SENT: 'success',
  PARTIAL_FAILED: 'warn',
  CANCELLED: 'neutral',
  FAILED: 'danger',
};

export const SEND_JOB_STATUS = {
  REQUESTED: 'REQUESTED',
  QUEUED: 'QUEUED',
  SENDING: 'SENDING',
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED',
  RETRYING: 'RETRYING',
  CANCELLED: 'CANCELLED',
} as const;
export type SendJobStatus = (typeof SEND_JOB_STATUS)[keyof typeof SEND_JOB_STATUS];

export const SEND_JOB_STATUS_LABEL: Record<SendJobStatus, string> = {
  REQUESTED: '요청됨',
  QUEUED: '대기',
  SENDING: '발송 중',
  SUCCESS: '발송 완료',
  FAILED: '발송 실패',
  RETRYING: '재시도',
  CANCELLED: '취소',
};

export const SEND_FAILURE_REASON_LABEL: Record<string, string> = {
  INVALID_EMAIL: '이메일 주소 오류',
  BLOCKED: '수신 차단',
  BOUNCED: '반송',
  COMPLAINT: '스팸 신고',
  TEMPORARY_FAILURE: '일시적 오류',
  SYSTEM_ERROR: '시스템 오류',
  RATE_LIMITED: '발송 제한',
  UNKNOWN: '알 수 없음',
};

export const LINK_STATUS = {
  ACTIVE: 'ACTIVE',
  USED: 'USED',
  EXPIRED: 'EXPIRED',
  INVALIDATED: 'INVALIDATED',
} as const;
export type LinkStatus = (typeof LINK_STATUS)[keyof typeof LINK_STATUS];

export const LINK_ERROR_LABEL: Record<string, { title: string; description: string }> = {
  EXPIRED: {
    title: '링크가 만료되었습니다',
    description:
      '이 링크는 더 이상 사용할 수 없습니다. 운영자에게 재전송을 요청하시면 새 링크가 발송됩니다.',
  },
  REUSED: {
    title: '이미 사용된 링크입니다',
    description: '이 링크는 한 번만 사용 가능하도록 설정되어 있어 다시 접근할 수 없습니다.',
  },
  INVALID_LINK: {
    title: '잘못된 링크입니다',
    description: '링크 주소가 손상되었거나 존재하지 않는 링크입니다.',
  },
  DOCUMENT_NOT_FOUND: {
    title: '명세서를 찾을 수 없습니다',
    description: '연결된 명세서를 찾을 수 없습니다. 운영자에게 문의해 주세요.',
  },
  UNAUTHORIZED: {
    title: '접근 권한이 없습니다',
    description: '이 명세서는 본인 외에는 열람할 수 없습니다.',
  },
  UNKNOWN: {
    title: '명세서에 접근할 수 없습니다',
    description: '문제가 지속되면 운영자에게 문의해 주세요.',
  },
};

export const RESEND_REQUEST_STATUS = {
  REQUESTED: 'REQUESTED',
  COMPLETED: 'COMPLETED',
  REJECTED: 'REJECTED',
} as const;
export type ResendRequestStatus =
  (typeof RESEND_REQUEST_STATUS)[keyof typeof RESEND_REQUEST_STATUS];

export const RESEND_REQUEST_STATUS_LABEL: Record<ResendRequestStatus, string> = {
  REQUESTED: '대기',
  COMPLETED: '완료',
  REJECTED: '반려됨',
};

export const CHECK_ITEM_TYPE = {
  RESEND_REQUEST: 'RESEND_REQUEST',
  FINAL_FAILED: 'FINAL_FAILED',
  UNVIEWED_RECIPIENT: 'UNVIEWED_RECIPIENT',
} as const;
export type CheckItemType = (typeof CHECK_ITEM_TYPE)[keyof typeof CHECK_ITEM_TYPE];

export const CHECK_ITEM_TYPE_LABEL: Record<CheckItemType, string> = {
  UNVIEWED_RECIPIENT: '미확인 수신자',
  RESEND_REQUEST: '재전송 요청',
  FINAL_FAILED: '최종 실패',
};

export const CHECK_ITEM_STATUS = {
  OPEN: 'OPEN',
  IN_PROGRESS: 'IN_PROGRESS',
  RESOLVED: 'RESOLVED',
  REJECTED: 'REJECTED',
} as const;
export type CheckItemStatus = (typeof CHECK_ITEM_STATUS)[keyof typeof CHECK_ITEM_STATUS];

export const CHECK_ITEM_STATUS_LABEL: Record<CheckItemStatus, string> = {
  OPEN: '확인 필요',
  IN_PROGRESS: '처리 중',
  RESOLVED: '완료',
  REJECTED: '반려',
};

export const VALIDATION_STATUS_LABEL: Record<string, string> = {
  VALID: '정상',
  INVALID: '오류',
  DUPLICATE: '중복',
  NEEDS_REVIEW: '확인 필요',
};

export const MATCH_STATUS_LABEL: Record<string, string> = {
  MATCHED: '매칭 완료',
  UNMATCHED: '매칭 실패',
  DUPLICATE_MATCH: '중복 매칭',
  MISMATCHED: '불일치',
};
