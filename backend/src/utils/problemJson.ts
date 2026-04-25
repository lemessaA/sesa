import type { Response } from 'express';

const TYPE_BASE = 'https://api.sesa.dev/problems';

/**
 * RFC 7807 Problem Details for JSON APIs (4xx/5xx).
 * https://www.rfc-editor.org/rfc/rfc7807
 */
export function sendProblem(
  res: Response,
  status: number,
  code: string,
  title: string,
  detail?: string
) {
  return res.status(status).type('application/problem+json').json({
    type: `${TYPE_BASE}/${kebabCode(code)}`,
    title,
    status,
    code,
    ...(detail ? { detail } : {}),
  });
}

function kebabCode(code: string) {
  return code.toLowerCase().replace(/_/g, '-');
}
