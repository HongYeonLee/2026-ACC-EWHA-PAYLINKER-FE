import { api } from '../../shared/api/client';
import type {
  LinkSessionResponse,
  RecipientDocumentResponse,
  ResendSubmitRequest,
  ResendSubmitResponse,
  ViewedResponse,
} from '../../shared/api/types';

export const recipientApi = {
  /** LNK-001 — 링크 토큰 검증 및 세션 발급 */
  validateLink: (token: string) =>
    api.post<LinkSessionResponse>('/secure-links/validate', { token }, { auth: 'none' }),

  /** DOC-101 — 수신자 본인 명세서 조회 */
  getDocument: () =>
    api.get<RecipientDocumentResponse>('/documents/me', { auth: 'recipient' }),

  /** DOC-102 — 수신자 열람 확인 처리 */
  markViewed: () =>
    api.post<ViewedResponse>('/documents/me/viewed', undefined, { auth: 'recipient' }),

  /** ERR-003 — 수신자 재전송 요청 */
  submitResendRequest: (body: ResendSubmitRequest) =>
    api.post<ResendSubmitResponse>('/secure-links/resend-request', body, { auth: 'recipient' }),
};
